# Implémentation du Système d'Onboarding Vendeur

## 📋 Vue d'ensemble

Ce document décrit l'implémentation complète du système d'onboarding pour les nouveaux vendeurs, qui les oblige à compléter leur profil avant d'accéder au dashboard.

## 🎯 Fonctionnalités

### Flux d'Onboarding en 3 Étapes

1. **Étape 1: Numéros de téléphone**
   - Minimum: 2 numéros requis
   - Maximum: 3 numéros autorisés
   - Le premier numéro est défini comme "principal" par défaut
   - Validation du format: `+237XXXXXXXXX` ou `6XXXXXXXX`
   - Détection des doublons

2. **Étape 2: Réseaux sociaux (Optionnel)**
   - Facebook, Instagram, Twitter/X, LinkedIn, YouTube
   - Validation des URLs pour chaque plateforme
   - Extraction automatique du nom d'utilisateur

3. **Étape 3: Photo de profil**
   - Formats acceptés: JPG, PNG, GIF, WebP
   - Taille maximale: 5 MB
   - Aperçu en temps réel de l'image
   - Interface drag & drop conviviale

## 📁 Fichiers créés/modifiés

### Nouveaux fichiers

1. **`src/pages/vendor/VendorOnboardingPage.tsx`**
   - Interface complète d'onboarding avec 3 étapes
   - Validation en temps réel des données
   - Animations avec Framer Motion
   - UI moderne et responsive

### Fichiers modifiés

1. **`src/App.tsx`**
   ```tsx
   // Import ajouté
   import VendorOnboardingPage from './pages/vendor/VendorOnboardingPage';

   // Route ajoutée (ligne 386-390)
   <Route path='/vendeur/onboarding' element={
     <VendeurRoute skipOnboardingCheck={true}>
       <VendorOnboardingPage />
     </VendeurRoute>
   } />
   ```

2. **`src/components/auth/ProtectedRoute.tsx`**
   - Ajout de la logique de vérification du profil vendeur
   - Redirection automatique vers `/vendeur/onboarding` si profil incomplet
   - Nouveau prop `skipOnboardingCheck` pour éviter les boucles de redirection

## 🎨 Design et UX

### Indicateur de progression
- Affichage visuel des 3 étapes
- Étapes complétées marquées avec un ✓ vert
- Étape actuelle mise en surbrillance avec un anneau violet

### Validations en temps réel
- Messages d'erreur contextuels
- Conseils et suggestions pour chaque champ
- Désactivation du bouton "Suivant" si données invalides

### Animations
- Transitions fluides entre les étapes
- Animation d'apparition des éléments
- Feedback visuel sur les interactions

### Responsive Design
- Adapté aux mobiles, tablettes et desktops
- Layout optimisé pour chaque taille d'écran
- Touch-friendly sur mobile

## 🔧 Validations implémentées

### Téléphones
```typescript
// Format accepté: +237XXXXXXXXX, 237XXXXXXXXX, 6XXXXXXXX
const phoneRegex = /^(\+?237|237)?[6][0-9]{8}$/;

// Vérifications:
- Minimum 2 numéros requis
- Format valide pour chaque numéro
- Pas de doublons
```

### Réseaux sociaux
```typescript
// Validation des URLs par plateforme
const patterns = {
  facebook: /^(https?:\/\/)?(www\.)?facebook\.com\/.+$/i,
  instagram: /^(https?:\/\/)?(www\.)?instagram\.com\/.+$/i,
  twitter: /^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/.+$/i,
  linkedin: /^(https?:\/\/)?(www\.)?linkedin\.com\/(in|company)\/.+$/i,
  youtube: /^(https?:\/\/)?(www\.)?youtube\.com\/@?.+$/i
};
```

### Photo de profil
```typescript
// Vérifications:
- Type de fichier: image/* uniquement
- Taille maximale: 5 MB
- Aperçu généré automatiquement
```

## 🔄 Flux de redirection

### À la connexion d'un vendeur

```
Connexion vendeur
    ↓
Vérification de l'authentification (ProtectedRoute)
    ↓
Vérification du profil complété (VendeurRoute)
    ↓
    ├── Profil incomplet → /vendeur/onboarding
    │       ↓
    │   Complétion du profil (3 étapes)
    │       ↓
    │   Soumission → /vendeur/dashboard
    │
    └── Profil complété → /vendeur/dashboard
```

### Protection contre les boucles

La route `/vendeur/onboarding` utilise `skipOnboardingCheck={true}` pour éviter une redirection infinie.

## 📊 Structure des données

### Format des données soumises
```typescript
{
  phones: [
    {
      id: "1",
      number: "+237698765432",
      isPrimary: true
    },
    {
      id: "2",
      number: "+237677889900",
      isPrimary: false
    }
  ],
  socialMedia: [
    {
      platform: "facebook",
      url: "https://facebook.com/myshop",
      username: "myshop"
    },
    {
      platform: "instagram",
      url: "https://instagram.com/myshop",
      username: "myshop"
    }
  ],
  profileImage: File, // Fichier image
  profileImagePreview: "data:image/png;base64,..." // Base64 pour aperçu
}
```

## 🔌 Intégration Backend (À faire)

### Endpoint à créer
```
POST /api/vendor/complete-onboarding
```

### Payload attendu
```json
{
  "phones": [
    {
      "number": "+237698765432",
      "isPrimary": true
    }
  ],
  "socialMedia": [
    {
      "platform": "facebook",
      "url": "https://facebook.com/myshop"
    }
  ],
  "profileImage": "base64_encoded_image" ou FormData
}
```

### Réponse attendue
```json
{
  "success": true,
  "message": "Profil complété avec succès",
  "vendor": {
    "id": 123,
    "profileCompleted": true,
    "phones": [...],
    "socialMedia": [...],
    "profileImage": "https://cdn.printalma.com/vendors/123/profile.jpg"
  }
}
```

## 🔐 Vérification du profil

### Fonction actuelle (temporaire)
```typescript
const checkVendorProfileComplete = (user: any): boolean => {
  // Retourne false pour forcer l'onboarding
  // À remplacer par une vraie vérification API
  return false;
};
```

### Implémentation recommandée
```typescript
const checkVendorProfileComplete = async (user: any): Promise<boolean> => {
  try {
    const response = await axios.get('/api/vendor/profile-status');
    return response.data.profileCompleted;
  } catch (error) {
    console.error('Erreur vérification profil:', error);
    return false; // Par sécurité, forcer l'onboarding en cas d'erreur
  }
};
```

## 🎯 Points d'amélioration futures

1. **Sauvegarde progressive**
   - Sauvegarder chaque étape dans localStorage
   - Permettre de reprendre où on s'est arrêté

2. **Validation côté backend**
   - Vérifier la validité des numéros de téléphone (API de validation)
   - Vérifier l'existence des profils de réseaux sociaux

3. **Enrichissement des données**
   - Ajouter d'autres informations (adresse, description de la boutique)
   - Permettre l'upload de documents (pièce d'identité, justificatif de domicile)

4. **Gamification**
   - Afficher un pourcentage de complétion du profil
   - Badges pour profil 100% complété
   - Avantages pour les profils bien remplis

5. **Notifications**
   - Email de bienvenue après complétion
   - Rappels pour compléter le profil si abandonné

## 🐛 Debug et Tests

### Pour tester l'onboarding

1. Mettre `return false;` dans `checkVendorProfileComplete()` (ligne 115 de `ProtectedRoute.tsx`)
2. Se connecter avec un compte vendeur
3. Vous serez automatiquement redirigé vers `/vendeur/onboarding`

### Pour désactiver l'onboarding temporairement

1. Mettre `return true;` dans `checkVendorProfileComplete()`
2. Les vendeurs accèdent directement au dashboard

### Console Logs

Le composant affiche des logs détaillés:
```typescript
console.log('📤 Données à envoyer:', {
  phones: data.phones.filter(p => p.number.trim() !== ''),
  socialMedia: data.socialMedia,
  profileImage: data.profileImage?.name
});
```

## 📝 Notes importantes

1. **Sécurité**: Les validations côté frontend sont complétées par des validations backend
2. **Performance**: Les images sont compressées avant upload (à implémenter)
3. **Accessibilité**: Tous les champs ont des labels appropriés
4. **i18n**: Textes en français, prêts pour internationalisation

## 🚀 Déploiement

### Checklist avant déploiement

- [ ] Implémenter l'API backend `/api/vendor/complete-onboarding`
- [ ] Remplacer `checkVendorProfileComplete()` par un vrai appel API
- [ ] Tester le flux complet de connexion → onboarding → dashboard
- [ ] Vérifier la validation backend des données
- [ ] Configurer le stockage des images (S3, CDN, etc.)
- [ ] Ajouter la gestion d'erreurs réseau
- [ ] Tester sur différents navigateurs et appareils
- [ ] Vérifier l'accessibilité (WCAG 2.1)

## 📞 Support

Pour toute question ou problème, se référer à:
- Documentation API backend (à créer)
- Guide d'authentification: `src/components/auth/README.md`
- Documentation des contextes: `src/contexts/README.md`
