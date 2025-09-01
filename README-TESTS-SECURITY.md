# 🔐 Guide Complet des Tests de Sécurité PrintAlma

## 🎯 **Objectif**
Tester et valider les messages progressifs de sécurité avec comptage des tentatives de connexion restantes.

---

## 🚀 **Étapes Rapides (TL;DR)**

```bash
# 1. Créer l'utilisateur de test
node create-test-user.cjs

# 2. Copier-coller la requête SQL dans votre base PostgreSQL

# 3. Tester le backend directement
node quick-test-login.cjs

# 4. Tester l'intégration frontend-backend
node test-frontend-messages.js

# 5. Tester dans l'interface web à http://localhost:5173/login
```

---

## 📋 **Guide Détaillé**

### **Étape 1: Création de l'utilisateur de test**

```bash
node create-test-user.cjs
```

**Résultat :** Génère une requête SQL à exécuter dans votre base PostgreSQL :

```sql
-- 🆕 Créer l'utilisateur de test pour les messages de sécurité
INSERT INTO "User" (
    "firstName", "lastName", "email", "password", 
    "role", "vendeur_type", "status", "must_change_password",
    "login_attempts", "locked_until", "created_at", "updated_at"
) VALUES (
    'Test', 'Vendeur', 'test.vendeur@printalma.com', 
    '$2b$12$SjQfa38B.R42IxdbSbeFYOQadDQwYshMHwkGX/nXUZb5nlgiq2GjC', 
    'VENDEUR', 'DESIGNER', true, false, 0, NULL, NOW(), NOW()
);

-- 🔍 Vérifier l'insertion
SELECT id, "firstName", "lastName", email, role, "vendeur_type", status, "must_change_password", "login_attempts"
FROM "User" WHERE email = 'test.vendeur@printalma.com';
```

### **Étape 2: Test Backend Direct**

```bash
node quick-test-login.cjs
```

**Messages attendus :**
- **Tentative 1-4:** `❌ Email ou mot de passe incorrect. Il vous reste X tentatives.`
- **Tentative 5:** `❌ Email ou mot de passe incorrect. ⚠️ Dernière tentative avant verrouillage.`
- **Tentative 6:** `🔒 Trop de tentatives échouées. Votre compte est verrouillé pour 30 minutes.`
- **Tentatives suivantes:** `🔒 Votre compte est temporairement verrouillé. Temps restant : 25 minutes`

### **Étape 3: Test Frontend-Backend**

```bash
node test-frontend-messages.js
```

**Vérifie :**
- ✅ Extraction des tentatives restantes
- ✅ Détection du verrouillage
- ✅ Extraction du temps de verrouillage
- ✅ Détection de la dernière tentative

### **Étape 4: Test Interface Web**

1. Démarrez votre application : `npm run dev`
2. Allez à http://localhost:5173/login
3. Utilisez les identifiants :
   - **Email:** `test.vendeur@printalma.com`
   - **Mot de passe INCORRECT:** `mauvais123` (pour déclencher les erreurs)

---

## 🎨 **Nouvelles Fonctionnalités Frontend**

### **🔍 Analyse Automatique des Messages**

Le `LoginForm` utilise maintenant `authService.analyzeSecurityError()` qui retourne :

```typescript
{
  message: string;                    // Message exact du backend
  type: 'warning' | 'critical' | 'locked' | 'superadmin' | 'error';
  remainingAttempts: number | null;   // Tentatives restantes extraites
  isLocked: boolean;                  // Compte verrouillé ?
  lockTime: string | null;            // Temps de verrouillage
  isLastAttempt: boolean;             // Dernière tentative ?
  formattedLockTime?: string;         // Temps formaté avec icône
}
```

### **🎯 Indicateur Visuel des Tentatives**

```jsx
<AttemptsIndicator remaining={3} />
```

Affiche :
- 🟢🟢🟢🔴🔴 **3/5** tentatives restantes
- Message d'avertissement si dernière tentative

### **🎨 Alertes Colorées selon le Type**

- **⚠️ Warning (jaune):** `Il vous reste X tentatives`
- **🚨 Critical (orange):** `Dernière tentative`
- **🔒 Locked (rouge):** `Compte verrouillé`
- **🛡️ SuperAdmin (bleu):** `Protection SUPERADMIN`

---

## 📊 **Données de Test**

### **Utilisateur de Test Créé**
```
Email: test.vendeur@printalma.com
Mot de passe CORRECT: TestPassword123!
Mot de passe INCORRECT: mauvais123
Rôle: VENDEUR
Type: DESIGNER (🎨)
```

### **Scénarios de Test**

| Tentative | Mot de passe | Résultat Attendu |
|-----------|--------------|------------------|
| 1-4 | `mauvais123` | `Il vous reste X tentatives` |
| 5 | `mauvais123` | `Dernière tentative avant verrouillage` |
| 6 | `mauvais123` | `Compte verrouillé pour 30 minutes` |
| 7+ | `mauvais123` | `Temps restant : XX minutes` |
| N'importe quand | `TestPassword123!` | ✅ Connexion réussie |

---

## 🔧 **Dépannage**

### **❌ "L'utilisateur n'existe pas"**
```bash
# Vérifiez dans votre base PostgreSQL :
SELECT email, "firstName", "lastName", role FROM "User" WHERE email = 'test.vendeur@printalma.com';
```

### **❌ "Messages génériques seulement"**
L'utilisateur n'existe probablement pas. Le backend renvoie des messages génériques pour les emails inexistants.

### **❌ "node-fetch not found"**
```bash
npm install node-fetch bcrypt
```

### **❌ "Backend non démarré"**
Assurez-vous que votre backend PrintAlma tourne sur http://localhost:3004

---

## 🎉 **Résultats Attendus dans l'Interface**

### **Premier Échec (3 tentatives restantes)**
```
⚠️ ❌ Email ou mot de passe incorrect. Il vous reste 3 tentatives.

Tentatives restantes : 3/5
🟢🟢🟢🔴🔴
```

### **Dernière Tentative**
```
🚨 ❌ Email ou mot de passe incorrect. ⚠️ Dernière tentative avant verrouillage.

🚨 Dernière chance ! Une tentative incorrecte de plus verrouillera votre compte.

Tentatives restantes : 1/5  
🟢🔴🔴🔴🔴
```

### **Compte Verrouillé**
```
🔒 🔒 Trop de tentatives échouées. Votre compte est verrouillé pour 30 minutes.
```

### **Compte Verrouillé (tentatives suivantes)**
```
🔒 🕒 Temps restant : 25 minutes
```

---

## 🚀 **Nouvelles Méthodes AuthService**

Le service `auth.service.ts` inclut maintenant des utilitaires puissants :

```typescript
// 🔍 Extraction
authService.extractRemainingAttempts(message) // → number | null
authService.isAccountLocked(message)          // → boolean
authService.extractLockTime(message)          // → string | null
authService.isLastAttempt(message)            // → boolean

// 🎨 Analyse complète  
authService.analyzeSecurityError(message)     // → objet complet avec tous les détails

// 🌈 Styles et icônes
authService.getSecurityAlertType(message)     // → 'warning' | 'critical' | 'locked' | ...
authService.getSecurityAlertIcon(type)        // → '⚠️' | '🚨' | '🔒' | ...
authService.getSecurityAlertClasses(type)     // → classes CSS TailwindCSS
```

---

## 📝 **Notes Importantes**

1. **Message Exact:** Le frontend affiche EXACTEMENT le message du backend
2. **Indicateurs Visuels:** Ajoutés EN PLUS du message (pas à la place)
3. **Extraction Regex:** `Il vous reste (\d+) tentative` pour extraire le nombre
4. **Persistance:** L'utilisateur de test peut être supprimé après les tests
5. **Sécurité:** Les comptes SUPERADMIN ne peuvent jamais être verrouillés

---

## 🧪 **Tests Automatisés**

Les scripts incluent des tests automatiques pour :
- ✅ Extraction des tentatives restantes
- ✅ Détection des types d'alertes  
- ✅ Parsing des temps de verrouillage
- ✅ Validation des messages progressifs

---

## 🎯 **Exemple concret dans le LoginForm**

```tsx
// Message d'erreur reçu du backend
const errorMessage = "❌ Email ou mot de passe incorrect. Il vous reste 3 tentatives.";

// Analyse automatique
const analysis = authService.analyzeSecurityError(errorMessage);
// → { 
//     type: 'warning', 
//     remainingAttempts: 3, 
//     isLastAttempt: false,
//     message: "❌ Email ou mot de passe incorrect. Il vous reste 3 tentatives."
//   }

// Affichage avec indicateurs visuels
<Alert className={authService.getSecurityAlertClasses(analysis.type)}>
  {analysis.message}
  {analysis.remainingAttempts && (
    <AttemptsIndicator remaining={analysis.remainingAttempts} />
  )}
</Alert>
```

---

**🎊 Une fois ces tests réussis, votre système de sécurité PrintAlma est opérationnel !**

**📞 Pour toute question ou problème, vérifiez que :**
- ✅ L'utilisateur de test existe dans la base
- ✅ Le backend PrintAlma tourne sur http://localhost:3004  
- ✅ Les modules `bcrypt` et `node-fetch` sont installés
- ✅ Vous utilisez les bons identifiants de test 