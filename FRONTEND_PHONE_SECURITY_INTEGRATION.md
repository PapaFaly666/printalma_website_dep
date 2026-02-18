# Guide d'intégration - Sécurité des numéros de téléphone (Frontend)

## 📱 Phase 1 - Implémentée

### Composants créés

1. **`PhoneOTPModal.tsx`** - Modal de vérification OTP
2. **`phoneSecurityService.ts`** - Service de gestion de sécurité

---

## 🔧 Intégration dans VendorAccountPage

### 1. Imports nécessaires

```typescript
import PhoneOTPModal from '../../components/vendor/PhoneOTPModal';
import phoneSecurityService, { PhoneNumberWithSecurity } from '../../services/phoneSecurityService';
```

### 2. États à ajouter

```typescript
// État du modal OTP
const [showOTPModal, setShowOTPModal] = useState(false);
const [phoneToVerify, setPhoneToVerify] = useState('');

// Liste des numéros avec sécurité
const [securePhoneNumbers, setSecurePhoneNumbers] = useState<PhoneNumberWithSecurity[]>([]);
```

### 3. Fonction pour ajouter un numéro (avec OTP)

```typescript
const handleAddPhoneWithOTP = (phoneNumber: string) => {
  // Valider le numéro
  if (!phoneSecurityService.isValidSenegalPhone(phoneNumber)) {
    toast.error('Numéro de téléphone invalide');
    return;
  }

  // Ouvrir le modal OTP
  setPhoneToVerify(phoneNumber);
  setShowOTPModal(true);
};

const handleOTPVerified = async () => {
  toast.success('Numéro vérifié avec succès !');
  setShowOTPModal(false);

  // Recharger la liste des numéros
  await loadSecurePhoneNumbers();
};

const loadSecurePhoneNumbers = async () => {
  try {
    const phones = await phoneSecurityService.getPhoneNumbersWithSecurity();
    setSecurePhoneNumbers(phones);
  } catch (error) {
    console.error('Erreur chargement numéros:', error);
  }
};
```

### 4. Modifier le bouton "Ajouter un numéro"

**Remplacer :**
```typescript
<Button
  type="button"
  variant="outline"
  onClick={addPhone}  // ❌ Ancien
  className="w-full border-dashed border-2 border-blue-300"
>
  <Phone className="h-4 w-4 mr-2" />
  Ajouter un numéro
</Button>
```

**Par :**
```typescript
<Button
  type="button"
  variant="outline"
  onClick={() => {
    // Demander le numéro d'abord
    const phoneNumber = prompt('Entrez le numéro de téléphone (format: 77 XXX XX XX)');
    if (phoneNumber) {
      handleAddPhoneWithOTP(phoneNumber);
    }
  }}
  className="w-full border-dashed border-2 border-blue-300"
>
  <Phone className="h-4 w-4 mr-2" />
  Ajouter un numéro
</Button>
```

### 5. Ajouter le modal OTP dans le JSX

```typescript
{/* Modal OTP */}
<PhoneOTPModal
  isOpen={showOTPModal}
  onClose={() => setShowOTPModal(false)}
  phoneNumber={phoneToVerify}
  onVerified={handleOTPVerified}
/>
```

### 6. Afficher le statut de sécurité

```typescript
{securePhoneNumbers.map((phone, index) => {
  const withdrawalCheck = phoneSecurityService.canUseForWithdrawal(phone);

  return (
    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-3">
        <Phone className="h-4 w-4 text-gray-600" />
        <div>
          <p className="font-medium">{phone.number}</p>

          {/* Badges de statut */}
          <div className="flex items-center gap-2 mt-1">
            {phone.isPrimary && (
              <Badge className="bg-blue-100 text-blue-700">Principal</Badge>
            )}

            {phone.isVerified ? (
              <Badge className="bg-green-100 text-green-700">
                <CheckCircle className="h-3 w-3 mr-1" />
                Vérifié
              </Badge>
            ) : (
              <Badge className="bg-yellow-100 text-yellow-700">
                En attente
              </Badge>
            )}

            {phone.status === 'ACTIVE' && (
              <Badge className="bg-emerald-100 text-emerald-700">Actif</Badge>
            )}

            {phone.status === 'PENDING' && (
              <Badge className="bg-orange-100 text-orange-700">
                Période de sécurité
              </Badge>
            )}
          </div>

          {/* Avertissement période de sécurité */}
          {!withdrawalCheck.canUse && withdrawalCheck.remainingTime && (
            <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Utilisable pour retrait dans {phoneSecurityService.formatRemainingTime(withdrawalCheck.remainingTime)}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {!phone.isPrimary && (
          <Button size="sm" variant="outline">
            Définir principal
          </Button>
        )}
      </div>
    </div>
  );
})}
```

---

## 🎨 Interface utilisateur

### Flow complet

1. **Utilisateur clique "Ajouter un numéro"**
   - Prompt pour saisir le numéro
   - Validation du format

2. **Modal OTP s'ouvre** (PhoneOTPModal)
   - Affiche les 3 mesures de sécurité (OTP, Email, 48h)
   - Bouton "Envoyer le code"

3. **Code envoyé**
   - Input pour entrer le code à 6 chiffres
   - Countdown de 5 minutes
   - Bouton "Renvoyer le code" après expiration

4. **Vérification**
   - Validation du code
   - Message de succès
   - Information sur la période de 48h

5. **Confirmation**
   - Le numéro apparaît avec badge "Période de sécurité"
   - Indication du temps restant
   - Numéro devient actif après 48h

---

## 🔒 Vérification avant retrait

### Dans votre page de retrait/paiement

```typescript
const handleWithdrawal = async (amount: number) => {
  // Récupérer le numéro principal
  const primaryPhone = securePhoneNumbers.find(p => p.isPrimary);

  if (!primaryPhone) {
    toast.error('Aucun numéro de téléphone principal défini');
    return;
  }

  // Vérifier si le numéro peut être utilisé
  const check = phoneSecurityService.canUseForWithdrawal(primaryPhone);

  if (!check.canUse) {
    if (check.remainingTime) {
      toast.error(
        `${check.reason}. Utilisable dans ${phoneSecurityService.formatRemainingTime(check.remainingTime)}`
      );
    } else {
      toast.error(check.reason);
    }
    return;
  }

  // Procéder au retrait
  // ...
};
```

---

## 🎯 Exemple complet de remplacement

```typescript
// AVANT (ligne ~1936 dans VendorAccountPage.tsx)
{editingPhones.length < 3 && (
  <Button
    type="button"
    variant="outline"
    onClick={addPhone}  // ❌ Sans sécurité
    className="w-full border-dashed border-2"
  >
    <Phone className="h-4 w-4 mr-2" />
    Ajouter un numéro
  </Button>
)}

// APRÈS (avec sécurité OTP)
{securePhoneNumbers.length < 3 && (
  <>
    <Button
      type="button"
      variant="outline"
      onClick={() => {
        const phoneNumber = prompt('Numéro (format: 77 XXX XX XX):');
        if (phoneNumber) {
          handleAddPhoneWithOTP(phoneNumber);
        }
      }}
      className="w-full border-dashed border-2 border-blue-300 text-blue-600 hover:bg-blue-50"
    >
      <Shield className="h-4 w-4 mr-2" />
      Ajouter un numéro sécurisé
    </Button>

    {/* Informations de sécurité */}
    <div className="text-xs text-gray-600 space-y-1 mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
      <p className="font-semibold text-blue-900">Mesures de sécurité :</p>
      <ul className="list-disc list-inside space-y-0.5">
        <li>Vérification par code SMS</li>
        <li>Confirmation par email</li>
        <li>Période de sécurité de 48h</li>
      </ul>
    </div>
  </>
)}

{/* Modal OTP */}
<PhoneOTPModal
  isOpen={showOTPModal}
  onClose={() => setShowOTPModal(false)}
  phoneNumber={phoneToVerify}
  onVerified={handleOTPVerified}
/>
```

---

## 📦 Dépendances

Vérifier que ces composants sont bien installés :

```bash
# Composants UI utilisés
- Dialog (shadcn/ui)
- Alert (shadcn/ui)
- Badge (shadcn/ui)
- Input (shadcn/ui)
- Button (composant custom)
```

---

## 🚀 Migration progressive

### Option 1: Remplacer complètement (recommandé)
Remplacer le système actuel par le nouveau système sécurisé

### Option 2: Cohabitation
Garder l'ancien système et ajouter le nouveau en parallèle
- Anciens numéros : pas de période de sécurité
- Nouveaux numéros : avec OTP et 48h

### Option 3: Migration forcée
Demander à tous les vendeurs de re-vérifier leurs numéros existants

---

## ⚠️ Points d'attention

1. **Ne jamais bypass la vérification OTP** en production
2. **Toujours afficher le temps restant** pour la période de sécurité
3. **Envoyer l'email de confirmation** à chaque modification
4. **Logger toutes les actions** (ajout, modification, suppression)

---

## 🎨 Personnalisation

### Changer la durée de la période de sécurité

Backend contrôle la durée (48h par défaut), mais on peut l'afficher différemment :

```typescript
// Dans phoneSecurityService.ts
formatRemainingTime(hours: number): string {
  // Personnaliser l'affichage ici
}
```

### Changer le style du modal

Modifier `PhoneOTPModal.tsx` pour adapter les couleurs, tailles, etc.

---

## 📱 Responsive

Le composant `PhoneOTPModal` est responsive :
- Mobile : Modal plein écran
- Desktop : Modal centré (max-w-md)

---

Cette implémentation est **prête à l'emploi** et attend seulement l'intégration backend ! 🎉
