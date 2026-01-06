# Système d'Alertes d'Onboarding - Documentation

## Vue d'ensemble

Le système d'alertes d'onboarding permet de rappeler aux vendeurs de compléter leur profil s'ils ont choisi d'ignorer l'onboarding initial.

## Fonctionnement

### 1. Onboarding Optionnel

La page `/vendeur/onboarding` permet maintenant au vendeur de :
- **Compléter toutes les informations** : téléphones, photo, réseaux sociaux
- **Compléter partiellement** : seulement certains champs
- **Ignorer complètement** : bouton "Ignorer et compléter plus tard"

### 2. Système d'Alertes Récurrentes Intelligent

Le système vérifie automatiquement le statut du profil :

1. **Vérifie le statut via l'API** :
   ```javascript
   const status = await vendorOnboardingService.getProfileStatus();

   // Logique stricte frontend
   const isIncomplete =
     !status.profileCompleted ||
     status.details.phoneCount === 0 ||
     !status.details.hasProfileImage;
   ```
   - Si profil incomplet → Afficher l'alerte
   - Si profil complet (au moins 1 numéro ET photo) → Cacher l'alerte

2. **Vérification toutes les 1 minute** sur toutes les pages du dashboard vendeur
   - Vérifie automatiquement si le profil a été complété
   - S'adapte en temps réel aux changements du profil

3. **Actions disponibles dans l'alerte** :
   - **Compléter mon profil** : Redirige vers `/vendeur/onboarding`
   - **Fermer (X)** : Vérifie d'abord si le profil est complet
     - Si profil incomplet → Toast d'erreur + alerte reste ouverte
     - Si profil complet → Ferme l'alerte définitivement

   **Note importante** : Le bouton de fermeture ne fonctionne que si le profil est complet (au moins 1 numéro ET 1 photo). Sinon, un message demande de compléter le profil d'abord.

### 3. Gestion du LocalStorage

Le système utilise le localStorage pour la persistance temporaire :

```javascript
// Indique que l'onboarding a été ignoré (optionnel)
'onboarding_skipped': 'true' | null

// Timestamp de quand l'onboarding a été ignoré (optionnel)
'onboarding_skipped_at': string (timestamp) | null
```

**Note** : Ces clés sont automatiquement nettoyées quand l'API renvoie `profileCompleted = true`

### 4. Arrêt des Alertes

Les alertes s'arrêtent **uniquement** quand :
- Le backend renvoie `profileCompleted = true` via l'endpoint `/api/vendor/profile-status`
- Cela signifie que le vendeur a complété son profil (au moins les informations minimales requises)

**Il n'y a aucun autre moyen d'arrêter les alertes.** Elles continueront d'apparaître toutes les 1 minute jusqu'à ce que le backend confirme que le profil est complet.

### 5. Détection Automatique du Profil Incomplet

L'alerte s'affiche automatiquement dans les cas suivants :

**Critères Frontend (vérification stricte)** :
- ⚠️ `phoneCount === 0` → Profil incomplet
- ⚠️ `hasProfileImage === false` → Profil incomplet
- ⚠️ `profileCompleted === false` → Profil incomplet

**Cas d'usage** :
- ✅ Vendeur a ignoré l'onboarding → Alerte
- ✅ Vendeur a supprimé tous ses numéros → Alerte (même si photo existe)
- ✅ Vendeur a supprimé sa photo → Alerte (même si numéros existent)
- ✅ Profil complètement vide → Alerte

**Pour que l'alerte disparaisse, le vendeur DOIT avoir** :
- ✅ Au moins 1 numéro de téléphone ET
- ✅ Une photo de profil

## Composants Impliqués

### 1. `VendorOnboardingPage.tsx`

**Fonction `handleSkip()`** :
```typescript
const handleSkip = () => {
  localStorage.setItem('onboarding_skipped', 'true');
  localStorage.setItem('onboarding_skipped_at', Date.now().toString());
  navigate('/vendeur/dashboard');
};
```

**Fonction `handleSubmit()`** :
```typescript
// Nettoie le localStorage si l'onboarding est complété
localStorage.removeItem('onboarding_skipped');
localStorage.removeItem('onboarding_skipped_at');
```

### 2. `OnboardingAlert.tsx`

**Composant d'alerte** affiché dans tout le dashboard vendeur :

```typescript
const OnboardingAlert: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  // Vérifier le statut du profil via l'API
  const checkProfileStatus = async () => {
    try {
      const status = await vendorOnboardingService.getProfileStatus();

      // Si le profil n'est pas complet, afficher l'alerte
      if (!status.profileCompleted) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
        // Nettoyer le localStorage si le profil est complet
        localStorage.removeItem('onboarding_skipped');
        localStorage.removeItem('onboarding_skipped_at');
      }
    } catch (error) {
      console.error('Erreur vérification statut profil:', error);
    }
  };

  useEffect(() => {
    // Vérifier immédiatement
    checkProfileStatus();

    // Intervalle de 1 minute (60000ms)
    const interval = setInterval(() => {
      checkProfileStatus();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // ...
};
```

### 3. `VendorLayout.tsx`

**Intégration de l'alerte** :
```typescript
export const VendorLayout: React.FC = () => {
  return (
    <>
      <OnboardingAlert />  {/* Alerte globale */}
      <VendorSidebar />
    </>
  );
};
```

## Expérience Utilisateur

### Scénario 1 : Vendeur complète l'onboarding
1. Remplit tous les champs ou partiellement
2. Clique sur "Terminer"
3. ✅ Aucune alerte n'apparaît

### Scénario 2 : Vendeur ignore l'onboarding
1. Clique sur "Ignorer et compléter plus tard"
2. Arrive sur le dashboard
3. ⚠️ Une alerte apparaît immédiatement en bas à droite
4. L'alerte réapparaît toutes les 1 minute **indéfiniment**
5. Le vendeur clique sur le bouton **Fermer (X)** :
   - ❌ L'alerte vérifie le profil
   - ❌ Toast d'erreur : "Veuillez compléter votre profil (au moins 1 numéro et une photo) avant de fermer cette alerte"
   - ❌ L'alerte reste affichée
6. Seule option : Cliquer sur **"Compléter mon profil"**
7. ⚠️ **Impossible de fermer l'alerte sans compléter le profil**

### Scénario 3 : Vendeur complète finalement son profil
1. Après plusieurs alertes, clique sur "Compléter mon profil"
2. Ajoute **au moins 1 numéro ET une photo**
3. Clique "Terminer"
4. ✅ Retourne au dashboard
5. ✅ L'alerte disparaît définitivement
6. ✅ Les clés localStorage sont nettoyées
7. ✅ Le bouton fermer (X) fonctionne maintenant si besoin

## Design de l'Alerte

L'alerte utilise un design moderne et attractif :
- **Positionnement** : `fixed bottom-6 right-6` (coin inférieur droit)
- **Style** :
  - Carte blanche avec ombre portée
  - Bande colorée gradient en haut (bleu → violet → rose)
  - Icône avec badge rouge pulsant
  - Bouton principal avec gradient bleu-violet
- **Animation** : Slide-in depuis la droite avec effet spring (Framer Motion)
- **Responsive** : `max-w-sm` adapté mobile et desktop
- **Z-index** : `z-50` pour être au-dessus de tout
- **Effets** :
  - Badge rouge pulsant sur l'icône
  - Hover scale sur l'icône
  - Émoji ✨ pour attirer l'attention

## Modification du Timing

Pour changer la fréquence des alertes, modifier dans `OnboardingAlert.tsx` :

```typescript
// Actuellement : 60000ms = 1 minute
const interval = setInterval(() => {
  setIsVisible(true);
}, 60000);  // ← Modifier cette valeur

// Exemples :
// 30000  = 30 secondes
// 120000 = 2 minutes
// 300000 = 5 minutes
```

## Considérations UX

### Avantages
- ✅ Rappel persistant et **impossible à ignorer** pour compléter le profil
- ✅ Pas de blocage total de l'utilisation (le dashboard reste accessible)
- ✅ Incitation **très forte** à compléter le profil
- ✅ Vérification en temps réel du statut du profil
- ✅ Feedback immédiat si tentative de fermeture avec profil incomplet

### Points d'Attention
- ⚠️ **Fréquence de 1 minute est volontairement très insistante**
- ⚠️ **IMPOSSIBLE de fermer sans compléter le profil** (par design)
- ⚠️ **Bouton fermer (X) bloqué** tant que profil incomplet
- ⚠️ Toast d'erreur affiché si tentative de fermeture
- ⚠️ Utilise localStorage (ne fonctionne pas en navigation privée)
- ⚠️ Ne persiste pas entre appareils
- ⚠️ Expérience volontairement contraignante pour forcer la complétion

### Améliorations Futures Possibles
- Augmenter progressivement l'intervalle (1 min → 5 min → 15 min)
- Synchroniser l'état avec le backend
- Analyser le taux de complétion pour ajuster la stratégie
- Différencier les rappels selon le type de profil (artiste, influenceur, designer)
