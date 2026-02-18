# Guide d'implémentation Backend - Sécurité des numéros de téléphone

## Phase 1: OTP + Email + Période de sécurité 48h

Ce document décrit l'implémentation backend nécessaire pour le système de sécurité des numéros de téléphone vendeur.

---

## 📋 Table des matières

1. [Architecture générale](#architecture-générale)
2. [Schéma de base de données](#schéma-de-base-de-données)
3. [API Endpoints](#api-endpoints)
4. [Service OTP](#service-otp)
5. [Service Email](#service-email)
6. [Validation et sécurité](#validation-et-sécurité)
7. [Tests](#tests)

---

## 🏗️ Architecture générale

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                 │
│  PhoneOTPModal + phoneSecurityService                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API ENDPOINTS                               │
│  POST /api/vendor/phone/send-otp                                │
│  POST /api/vendor/phone/verify-otp                              │
│  GET  /api/vendor/phone/list                                    │
│  DELETE /api/vendor/phone/:id                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   BUSINESS LOGIC                                │
│  - OTPService (génération, validation)                          │
│  - EmailService (notifications)                                 │
│  - PhoneSecurityService (validation, hold period)               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     DATABASE                                    │
│  - vendor_phone_numbers                                         │
│  - phone_otp_codes                                              │
│  - security_logs                                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Schéma de base de données

### Table: `vendor_phone_numbers`

```sql
CREATE TABLE vendor_phone_numbers (
  id SERIAL PRIMARY KEY,
  vendor_id INTEGER NOT NULL REFERENCES vendor(id) ON DELETE CASCADE,

  -- Informations du numéro
  country_code VARCHAR(5) NOT NULL DEFAULT '+221',
  phone_number VARCHAR(20) NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,

  -- Sécurité
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verified_at TIMESTAMP,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    -- PENDING: En attente de vérification ou en période de sécurité
    -- ACTIVE: Actif et utilisable pour retraits
    -- SUSPENDED: Suspendu (comportement suspect)

  -- Période de sécurité (48h après vérification)
  security_hold_until TIMESTAMP,

  -- Métadonnées
  added_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_used_for_withdrawal TIMESTAMP,

  -- Index et contraintes
  UNIQUE(vendor_id, phone_number),
  CHECK (status IN ('PENDING', 'ACTIVE', 'SUSPENDED'))
);

-- Index pour performance
CREATE INDEX idx_vendor_phone_vendor ON vendor_phone_numbers(vendor_id);
CREATE INDEX idx_vendor_phone_status ON vendor_phone_numbers(status);
CREATE INDEX idx_vendor_phone_primary ON vendor_phone_numbers(vendor_id, is_primary);
```

### Table: `phone_otp_codes`

```sql
CREATE TABLE phone_otp_codes (
  id SERIAL PRIMARY KEY,
  vendor_id INTEGER NOT NULL REFERENCES vendor(id) ON DELETE CASCADE,
  phone_number VARCHAR(20) NOT NULL,

  -- Code OTP
  code VARCHAR(6) NOT NULL,
  code_hash VARCHAR(255) NOT NULL, -- bcrypt hash du code pour sécurité

  -- Expiration
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,

  -- Statut
  is_used BOOLEAN NOT NULL DEFAULT FALSE,
  verified_at TIMESTAMP,
  attempts INTEGER NOT NULL DEFAULT 0,

  -- Sécurité
  ip_address VARCHAR(45),
  user_agent TEXT,

  -- Index
  CHECK (attempts <= 5)
);

-- Index pour performance et sécurité
CREATE INDEX idx_phone_otp_vendor ON phone_otp_codes(vendor_id);
CREATE INDEX idx_phone_otp_expires ON phone_otp_codes(expires_at);
CREATE INDEX idx_phone_otp_used ON phone_otp_codes(is_used);
```

### Table: `security_logs` (optionnel mais recommandé)

```sql
CREATE TABLE security_logs (
  id SERIAL PRIMARY KEY,
  vendor_id INTEGER NOT NULL REFERENCES vendor(id) ON DELETE CASCADE,

  -- Action
  action VARCHAR(50) NOT NULL,
    -- 'PHONE_ADDED', 'PHONE_VERIFIED', 'PHONE_DELETED',
    -- 'OTP_SENT', 'OTP_VERIFIED', 'OTP_FAILED',
    -- 'WITHDRAWAL_ATTEMPTED', 'WITHDRAWAL_BLOCKED'

  -- Détails
  phone_number VARCHAR(20),
  details JSONB,

  -- Contexte
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_security_logs_vendor ON security_logs(vendor_id);
CREATE INDEX idx_security_logs_action ON security_logs(action);
CREATE INDEX idx_security_logs_created ON security_logs(created_at);
```

---

## 🔌 API Endpoints

### 1. POST `/api/vendor/phone/send-otp`

**Description**: Envoie un code OTP au numéro de téléphone

**Authentication**: Bearer token (vendeur connecté)

**Request Body**:
```typescript
{
  phoneNumber: string // Format: "77 123 45 67" ou "+221771234567"
}
```

**Response Success (200)**:
```typescript
{
  success: true,
  otpId: string,        // ID unique pour référencer ce code
  expiresAt: number,    // Timestamp d'expiration (now + 5 min)
  message: "Code envoyé avec succès"
}
```

**Response Errors**:
- `400`: Format de numéro invalide
- `400`: Numéro déjà associé à ce vendeur
- `429`: Trop de tentatives (rate limiting)
- `500`: Erreur d'envoi SMS

**Implémentation**:

```typescript
// vendor-phone.controller.ts
@Post('send-otp')
@UseGuards(AuthGuard)
async sendOTP(@Request() req, @Body() body: SendOTPDto) {
  const { phoneNumber } = body;
  const vendorId = req.user.id;

  // 1. Valider le format du numéro
  if (!this.phoneService.isValidSenegalPhone(phoneNumber)) {
    throw new BadRequestException('Format de numéro invalide');
  }

  // 2. Vérifier que le numéro n'est pas déjà utilisé
  const existing = await this.prisma.vendorPhoneNumber.findFirst({
    where: {
      vendor_id: vendorId,
      phone_number: phoneNumber
    }
  });

  if (existing) {
    throw new BadRequestException('Ce numéro est déjà associé à votre compte');
  }

  // 3. Vérifier rate limiting (max 3 codes par heure)
  const recentCodes = await this.prisma.phoneOTPCode.count({
    where: {
      vendor_id: vendorId,
      created_at: {
        gte: new Date(Date.now() - 60 * 60 * 1000)
      }
    }
  });

  if (recentCodes >= 3) {
    throw new TooManyRequestsException('Trop de tentatives. Réessayez dans 1 heure.');
  }

  // 4. Générer le code OTP
  const code = this.otpService.generateCode(); // 6 chiffres aléatoires
  const codeHash = await bcrypt.hash(code, 10);

  // 5. Sauvegarder en BDD
  const otp = await this.prisma.phoneOTPCode.create({
    data: {
      vendor_id: vendorId,
      phone_number: phoneNumber,
      code: code, // Ou stocker uniquement le hash
      code_hash: codeHash,
      expires_at: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    }
  });

  // 6. Envoyer le SMS
  await this.smsService.sendOTP(phoneNumber, code);

  // 7. Logger l'action
  await this.securityLogService.log({
    vendor_id: vendorId,
    action: 'OTP_SENT',
    phone_number: phoneNumber,
    ip_address: req.ip
  });

  return {
    success: true,
    otpId: otp.id.toString(),
    expiresAt: otp.expires_at.getTime(),
    message: 'Code envoyé avec succès'
  };
}
```

---

### 2. POST `/api/vendor/phone/verify-otp`

**Description**: Vérifie le code OTP et ajoute le numéro

**Authentication**: Bearer token (vendeur connecté)

**Request Body**:
```typescript
{
  otpId: string,  // ID retourné par send-otp
  code: string    // Code à 6 chiffres
}
```

**Response Success (200)**:
```typescript
{
  success: true,
  phoneNumber: {
    id: number,
    number: string,
    countryCode: string,
    isPrimary: boolean,
    isVerified: true,
    verifiedAt: string,
    status: "PENDING",
    securityHoldUntil: string,  // Date dans 48h
    addedAt: string,
    canBeUsedForWithdrawal: false
  },
  message: "Numéro vérifié avec succès. Utilisable dans 48 heures."
}
```

**Response Errors**:
- `400`: Code invalide ou expiré
- `400`: Trop de tentatives
- `404`: OTP ID introuvable
- `500`: Erreur serveur

**Implémentation**:

```typescript
@Post('verify-otp')
@UseGuards(AuthGuard)
async verifyOTP(@Request() req, @Body() body: VerifyOTPDto) {
  const { otpId, code } = body;
  const vendorId = req.user.id;

  // 1. Récupérer le code OTP
  const otp = await this.prisma.phoneOTPCode.findFirst({
    where: {
      id: parseInt(otpId),
      vendor_id: vendorId,
      is_used: false
    }
  });

  if (!otp) {
    throw new NotFoundException('Code introuvable ou déjà utilisé');
  }

  // 2. Vérifier l'expiration
  if (new Date() > otp.expires_at) {
    throw new BadRequestException('Code expiré');
  }

  // 3. Vérifier les tentatives
  if (otp.attempts >= 5) {
    throw new BadRequestException('Trop de tentatives. Demandez un nouveau code.');
  }

  // 4. Vérifier le code
  const isValid = await bcrypt.compare(code, otp.code_hash);

  if (!isValid) {
    // Incrémenter les tentatives
    await this.prisma.phoneOTPCode.update({
      where: { id: otp.id },
      data: { attempts: otp.attempts + 1 }
    });

    await this.securityLogService.log({
      vendor_id: vendorId,
      action: 'OTP_FAILED',
      phone_number: otp.phone_number,
      details: { attempts: otp.attempts + 1 }
    });

    throw new BadRequestException('Code invalide');
  }

  // 5. Marquer le code comme utilisé
  await this.prisma.phoneOTPCode.update({
    where: { id: otp.id },
    data: {
      is_used: true,
      verified_at: new Date()
    }
  });

  // 6. Créer le numéro de téléphone avec période de sécurité
  const securityHoldUntil = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h

  // Vérifier si c'est le premier numéro (sera principal)
  const existingPhones = await this.prisma.vendorPhoneNumber.count({
    where: { vendor_id: vendorId }
  });

  const phoneNumber = await this.prisma.vendorPhoneNumber.create({
    data: {
      vendor_id: vendorId,
      country_code: '+221',
      phone_number: otp.phone_number,
      is_primary: existingPhones === 0,
      is_verified: true,
      verified_at: new Date(),
      status: 'PENDING',
      security_hold_until: securityHoldUntil,
      added_at: new Date()
    }
  });

  // 7. Envoyer l'email de confirmation
  const vendor = await this.prisma.vendor.findUnique({
    where: { id: vendorId }
  });

  await this.emailService.sendPhoneAddedNotification({
    to: vendor.email,
    vendorName: `${vendor.firstName} ${vendor.lastName}`,
    phoneNumber: otp.phone_number,
    activationDate: securityHoldUntil
  });

  // 8. Logger l'action
  await this.securityLogService.log({
    vendor_id: vendorId,
    action: 'PHONE_VERIFIED',
    phone_number: otp.phone_number,
    details: { phoneNumberId: phoneNumber.id }
  });

  return {
    success: true,
    phoneNumber: {
      id: phoneNumber.id,
      number: phoneNumber.phone_number,
      countryCode: phoneNumber.country_code,
      isPrimary: phoneNumber.is_primary,
      isVerified: phoneNumber.is_verified,
      verifiedAt: phoneNumber.verified_at.toISOString(),
      status: phoneNumber.status,
      securityHoldUntil: phoneNumber.security_hold_until.toISOString(),
      addedAt: phoneNumber.added_at.toISOString(),
      canBeUsedForWithdrawal: false
    },
    message: 'Numéro vérifié avec succès. Utilisable dans 48 heures.'
  };
}
```

---

### 3. GET `/api/vendor/phone/list`

**Description**: Récupère tous les numéros du vendeur avec leur statut

**Authentication**: Bearer token (vendeur connecté)

**Response Success (200)**:
```typescript
{
  success: true,
  phoneNumbers: [
    {
      id: number,
      number: string,
      countryCode: string,
      isPrimary: boolean,
      isVerified: boolean,
      verifiedAt: string | null,
      status: "ACTIVE" | "PENDING" | "SUSPENDED",
      securityHoldUntil: string | null,
      addedAt: string,
      canBeUsedForWithdrawal: boolean
    }
  ]
}
```

**Implémentation**:

```typescript
@Get('list')
@UseGuards(AuthGuard)
async listPhoneNumbers(@Request() req) {
  const vendorId = req.user.id;

  const phones = await this.prisma.vendorPhoneNumber.findMany({
    where: { vendor_id: vendorId },
    orderBy: [
      { is_primary: 'desc' },
      { added_at: 'desc' }
    ]
  });

  const now = new Date();

  const phoneNumbers = phones.map(phone => {
    // Vérifier si la période de sécurité est terminée
    let canUse = phone.is_verified && phone.status === 'ACTIVE';

    if (phone.security_hold_until && phone.security_hold_until > now) {
      canUse = false;
    }

    return {
      id: phone.id,
      number: phone.phone_number,
      countryCode: phone.country_code,
      isPrimary: phone.is_primary,
      isVerified: phone.is_verified,
      verifiedAt: phone.verified_at?.toISOString() || null,
      status: phone.status,
      securityHoldUntil: phone.security_hold_until?.toISOString() || null,
      addedAt: phone.added_at.toISOString(),
      canBeUsedForWithdrawal: canUse
    };
  });

  return {
    success: true,
    phoneNumbers
  };
}
```

---

### 4. DELETE `/api/vendor/phone/:id`

**Description**: Supprime un numéro de téléphone (nécessite OTP)

**Authentication**: Bearer token (vendeur connecté)

**Response**: Similar flow avec OTP requis

---

## 📱 Service OTP

### `otp.service.ts`

```typescript
import * as crypto from 'crypto';

@Injectable()
export class OTPService {
  /**
   * Génère un code OTP à 6 chiffres
   */
  generateCode(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Hash un code pour stockage sécurisé
   */
  async hashCode(code: string): Promise<string> {
    return bcrypt.hash(code, 10);
  }

  /**
   * Vérifie un code contre son hash
   */
  async verifyCode(code: string, hash: string): Promise<boolean> {
    return bcrypt.compare(code, hash);
  }

  /**
   * Vérifie si un code est expiré
   */
  isExpired(expiresAt: Date): boolean {
    return new Date() > expiresAt;
  }
}
```

---

## 📧 Service Email

### `email.service.ts`

```typescript
@Injectable()
export class EmailService {
  constructor(private mailer: MailerService) {}

  /**
   * Envoie une notification d'ajout de numéro
   */
  async sendPhoneAddedNotification(params: {
    to: string;
    vendorName: string;
    phoneNumber: string;
    activationDate: Date;
  }) {
    const { to, vendorName, phoneNumber, activationDate } = params;

    const subject = '🔒 Nouveau numéro ajouté à votre compte';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: rgb(20, 104, 154);">Nouveau numéro de téléphone ajouté</h2>

        <p>Bonjour ${vendorName},</p>

        <p>Un nouveau numéro de téléphone a été ajouté à votre compte PrintAlma :</p>

        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Numéro:</strong> ${phoneNumber}</p>
          <p style="margin: 10px 0 0 0;"><strong>Date d'activation:</strong> ${activationDate.toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
        </div>

        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #92400e;">⏱️ Période de sécurité: 48 heures</h3>
          <p style="margin: 0; color: #92400e;">
            Par mesure de sécurité, ce numéro ne pourra être utilisé pour des retraits
            qu'après une période de 48 heures.
          </p>
        </div>

        <div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #991b1b;">⚠️ Vous n'avez pas effectué cette action?</h3>
          <p style="margin: 0; color: #991b1b;">
            Si vous n'êtes pas à l'origine de cet ajout, veuillez contacter immédiatement
            notre support à <a href="mailto:security@printalma.com">security@printalma.com</a>
          </p>
        </div>

        <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
          Cet email a été envoyé automatiquement par PrintAlma. Merci de ne pas y répondre.
        </p>
      </div>
    `;

    await this.mailer.sendMail({
      to,
      subject,
      html
    });
  }

  /**
   * Envoie une notification de suppression de numéro
   */
  async sendPhoneRemovedNotification(params: {
    to: string;
    vendorName: string;
    phoneNumber: string;
  }) {
    // Similar implementation
  }
}
```

---

## 📱 Service SMS

### `sms.service.ts`

Intégration avec un provider SMS (Twilio, Africa's Talking, etc.)

```typescript
@Injectable()
export class SMSService {
  private twilioClient: Twilio;

  constructor() {
    this.twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }

  /**
   * Envoie un code OTP par SMS
   */
  async sendOTP(phoneNumber: string, code: string): Promise<void> {
    try {
      await this.twilioClient.messages.create({
        body: `Votre code de vérification PrintAlma: ${code}. Valide pendant 5 minutes.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber.startsWith('+') ? phoneNumber : `+221${phoneNumber}`
      });
    } catch (error) {
      console.error('Erreur envoi SMS:', error);
      throw new Error('Impossible d\'envoyer le code SMS');
    }
  }
}
```

**Alternatives pour le Sénégal**:
- **Africa's Talking**: Très populaire en Afrique
- **Vonage (Nexmo)**: Support international
- **Orange SMS API**: Directement avec Orange Sénégal

---

## 🔒 Validation et sécurité

### Service de validation des retraits

```typescript
@Injectable()
export class WithdrawalSecurityService {
  /**
   * Vérifie si un vendeur peut effectuer un retrait
   */
  async canWithdraw(vendorId: number, amount: number): Promise<{
    allowed: boolean;
    reason?: string;
    phoneNumber?: VendorPhoneNumber;
  }> {
    // 1. Récupérer le numéro principal
    const primaryPhone = await this.prisma.vendorPhoneNumber.findFirst({
      where: {
        vendor_id: vendorId,
        is_primary: true
      }
    });

    if (!primaryPhone) {
      return {
        allowed: false,
        reason: 'Aucun numéro de téléphone principal configuré'
      };
    }

    // 2. Vérifier que le numéro est vérifié
    if (!primaryPhone.is_verified) {
      return {
        allowed: false,
        reason: 'Le numéro principal n\'est pas vérifié',
        phoneNumber: primaryPhone
      };
    }

    // 3. Vérifier le statut
    if (primaryPhone.status !== 'ACTIVE') {
      return {
        allowed: false,
        reason: `Le numéro est en statut ${primaryPhone.status}`,
        phoneNumber: primaryPhone
      };
    }

    // 4. Vérifier la période de sécurité
    if (primaryPhone.security_hold_until && new Date() < primaryPhone.security_hold_until) {
      const remainingMs = primaryPhone.security_hold_until.getTime() - Date.now();
      const remainingHours = Math.ceil(remainingMs / (1000 * 60 * 60));

      return {
        allowed: false,
        reason: `Numéro en période de sécurité. Utilisable dans ${remainingHours}h`,
        phoneNumber: primaryPhone
      };
    }

    // 5. Vérifications additionnelles (optionnel)
    // - Limite de retrait par jour
    // - Délai entre retraits
    // - Vérification du solde

    return {
      allowed: true,
      phoneNumber: primaryPhone
    };
  }
}
```

### Utilisation dans le controller de retrait

```typescript
@Post('withdrawal')
@UseGuards(AuthGuard)
async requestWithdrawal(@Request() req, @Body() body: WithdrawalDto) {
  const vendorId = req.user.id;
  const { amount } = body;

  // Vérifier la sécurité
  const security = await this.withdrawalSecurityService.canWithdraw(vendorId, amount);

  if (!security.allowed) {
    throw new BadRequestException(security.reason);
  }

  // Procéder au retrait
  const withdrawal = await this.withdrawalService.create({
    vendorId,
    amount,
    phoneNumber: security.phoneNumber.phone_number,
    method: 'MOBILE_MONEY'
  });

  return withdrawal;
}
```

---

## 🔄 Job automatique: Activation des numéros

### `phone-activation.cron.ts`

```typescript
@Injectable()
export class PhoneActivationCron {
  constructor(private prisma: PrismaService) {}

  /**
   * S'exécute toutes les heures pour activer les numéros
   * dont la période de sécurité est terminée
   */
  @Cron('0 * * * *') // Toutes les heures
  async activatePendingPhones() {
    const now = new Date();

    const phonesToActivate = await this.prisma.vendorPhoneNumber.findMany({
      where: {
        status: 'PENDING',
        is_verified: true,
        security_hold_until: {
          lte: now
        }
      }
    });

    for (const phone of phonesToActivate) {
      await this.prisma.vendorPhoneNumber.update({
        where: { id: phone.id },
        data: {
          status: 'ACTIVE',
          security_hold_until: null
        }
      });

      console.log(`✅ Numéro ${phone.phone_number} activé (vendeur ${phone.vendor_id})`);
    }

    if (phonesToActivate.length > 0) {
      console.log(`✅ ${phonesToActivate.length} numéro(s) activé(s)`);
    }
  }
}
```

---

## 🧪 Tests

### Test unitaire: OTP Service

```typescript
describe('OTPService', () => {
  let service: OTPService;

  beforeEach(() => {
    service = new OTPService();
  });

  it('devrait générer un code à 6 chiffres', () => {
    const code = service.generateCode();
    expect(code).toHaveLength(6);
    expect(Number(code)).toBeGreaterThanOrEqual(100000);
    expect(Number(code)).toBeLessThanOrEqual(999999);
  });

  it('devrait hash et vérifier un code', async () => {
    const code = '123456';
    const hash = await service.hashCode(code);

    const isValid = await service.verifyCode(code, hash);
    expect(isValid).toBe(true);

    const isInvalid = await service.verifyCode('999999', hash);
    expect(isInvalid).toBe(false);
  });
});
```

### Test d'intégration: Send OTP

```typescript
describe('POST /api/vendor/phone/send-otp', () => {
  it('devrait envoyer un code OTP', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/vendor/phone/send-otp')
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({ phoneNumber: '77 123 45 67' })
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('otpId');
    expect(response.body).toHaveProperty('expiresAt');
  });

  it('devrait rejeter un numéro invalide', async () => {
    await request(app.getHttpServer())
      .post('/api/vendor/phone/send-otp')
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({ phoneNumber: 'invalid' })
      .expect(400);
  });
});
```

---

## 🚀 Déploiement

### Variables d'environnement

```env
# SMS Provider (Twilio)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@printalma.com
SMTP_PASS=your_password

# Sécurité
OTP_EXPIRATION_MINUTES=5
SECURITY_HOLD_HOURS=48
MAX_OTP_ATTEMPTS=5
MAX_OTP_PER_HOUR=3
```

### Migration de production

```bash
# 1. Créer les tables
psql -d printalma_production -f migrations/add_phone_security.sql

# 2. Indexer les données existantes (si migration)
npm run migrate:phone-security

# 3. Redémarrer l'application
pm2 restart printalma-api
```

---

## 📊 Monitoring

### Métriques à surveiller

1. **Taux de succès OTP**: % de codes vérifiés avec succès
2. **Temps moyen d'activation**: Temps entre ajout et utilisation
3. **Tentatives échouées**: Surveiller les comportements suspects
4. **Retraits bloqués**: Combien de retraits sont bloqués par la sécurité

### Logs importants

```typescript
// Dans security_logs
- OTP_SENT: Code envoyé
- OTP_VERIFIED: Code vérifié avec succès
- OTP_FAILED: Échec de vérification
- PHONE_ADDED: Numéro ajouté
- PHONE_ACTIVATED: Numéro activé après 48h
- WITHDRAWAL_BLOCKED: Retrait bloqué par sécurité
```

---

## ✅ Checklist d'implémentation

- [ ] Créer les tables en base de données
- [ ] Implémenter OTPService
- [ ] Implémenter SMSService (Twilio/Africa's Talking)
- [ ] Implémenter EmailService
- [ ] Créer POST /api/vendor/phone/send-otp
- [ ] Créer POST /api/vendor/phone/verify-otp
- [ ] Créer GET /api/vendor/phone/list
- [ ] Créer DELETE /api/vendor/phone/:id
- [ ] Implémenter WithdrawalSecurityService
- [ ] Créer le CRON d'activation automatique
- [ ] Ajouter les logs de sécurité
- [ ] Écrire les tests unitaires
- [ ] Écrire les tests d'intégration
- [ ] Configurer les variables d'environnement
- [ ] Tester en staging
- [ ] Déployer en production

---

## 🎯 Améliorations futures (Phase 2+)

### Phase 2: 2FA obligatoire
- Code OTP requis pour chaque retrait
- Google Authenticator en option

### Phase 3: Détection de fraude
- Machine learning pour détecter comportements suspects
- Blocage automatique si changement d'IP/localisation
- Analyse des patterns de retrait

### Phase 4: Vérification d'identité
- Upload de pièce d'identité
- Vérification KYC (Know Your Customer)
- Limites de retrait basées sur le niveau de vérification

---

**Cette documentation complète permet l'implémentation backend du système de sécurité des numéros de téléphone Phase 1.**

Pour toute question ou clarification, référez-vous à la documentation frontend: `FRONTEND_PHONE_SECURITY_INTEGRATION.md`
