# Debug - Alerte Onboarding Vendeur

## 🔍 Comment tester l'alerte

### Étape 1 : Activer l'alerte
1. Aller sur `/vendeur/onboarding`
2. Cliquer sur le bouton **"Ignorer et compléter plus tard"**
3. Vérifier dans la console :
   ```
   ⏭️ Onboarding ignoré par le vendeur
   ✅ LocalStorage configuré: { onboarding_skipped: 'true', onboarding_skip_time: '...' }
   ```
4. Vous serez redirigé vers `/vendeur/dashboard`

### Étape 2 : Vérifier le localStorage
Ouvrir la console DevTools et taper :
```javascript
localStorage.getItem('onboarding_skipped')      // Doit retourner "true"
localStorage.getItem('onboarding_skip_time')    // Doit retourner un timestamp
localStorage.getItem('onboarding_alert_dismissed') // Doit être null
```

### Étape 3 : Observer les logs
Dans la console, vous devriez voir toutes les 5 secondes :
```
🔍 Vérification alerte onboarding: {
  onboardingSkipped: 'true',
  alertDismissed: null,
  skipTime: 'HH:MM:SS'
}
⏱️ Temps écoulé: X secondes
⏳ Attente... Y secondes restantes
```

### Étape 4 : Attendre 30 secondes
Après 30 secondes, vous devriez voir :
```
⏱️ Temps écoulé: 30 secondes
🔔 Affichage de l'alerte !
```

Et l'alerte devrait apparaître en bas à droite.

## 🐛 Problèmes courants

### L'alerte ne s'affiche pas

**Vérifier 1 : Le composant est-il chargé ?**
```javascript
// Dans la console, vérifier si le VendorLayout charge bien le composant
document.querySelector('.fixed.bottom-4.right-4')
```

**Vérifier 2 : Le localStorage est-il configuré ?**
```javascript
console.log({
  skipped: localStorage.getItem('onboarding_skipped'),
  skipTime: localStorage.getItem('onboarding_skip_time'),
  dismissed: localStorage.getItem('onboarding_alert_dismissed')
});
```

**Vérifier 3 : Y a-t-il des erreurs dans la console ?**
Chercher des erreurs React ou des problèmes d'imports

**Vérifier 4 : Le temps est-il correct ?**
```javascript
const skipTime = parseInt(localStorage.getItem('onboarding_skip_time'));
const now = Date.now();
const elapsed = now - skipTime;
console.log('Temps écoulé:', Math.floor(elapsed / 1000), 'secondes');
```

### L'alerte s'affiche mais ne se ferme pas

Vérifier que le bouton X appelle bien `handleDismiss` :
```javascript
// Cliquer sur X devrait afficher dans la console (si on ajoute un log)
```

### L'alerte ne revient pas après fermeture

**Vérifier que skipTime a été mis à jour :**
```javascript
// Après avoir fermé l'alerte
console.log('Nouveau skipTime:', localStorage.getItem('onboarding_skip_time'));
```

## 🧪 Tests manuels rapides

### Test 1 : Forcer l'affichage immédiat
```javascript
// Dans la console du dashboard
localStorage.setItem('onboarding_skipped', 'true');
localStorage.setItem('onboarding_skip_time', (Date.now() - 35000).toString()); // Il y a 35 secondes
// Attendre 5 secondes, l'alerte devrait apparaître
```

### Test 2 : Réinitialiser l'onboarding
```javascript
localStorage.removeItem('onboarding_skipped');
localStorage.removeItem('onboarding_skip_time');
localStorage.removeItem('onboarding_alert_dismissed');
// Rafraîchir la page
```

### Test 3 : Désactiver l'alerte
```javascript
localStorage.setItem('onboarding_alert_dismissed', 'true');
// L'alerte ne devrait plus apparaître
```

## 📋 Checklist de débogage

- [ ] Le bouton "Ignorer" est visible sur `/vendeur/onboarding`
- [ ] Cliquer sur "Ignorer" redirige vers `/vendeur/dashboard`
- [ ] `localStorage.getItem('onboarding_skipped')` retourne `"true"`
- [ ] `localStorage.getItem('onboarding_skip_time')` contient un timestamp
- [ ] Dans la console, les logs de vérification apparaissent toutes les 5 secondes
- [ ] Après 30 secondes, le log "🔔 Affichage de l'alerte !" apparaît
- [ ] L'alerte s'affiche visuellement en bas à droite
- [ ] Cliquer sur X ferme l'alerte
- [ ] 30 secondes après fermeture, l'alerte réapparaît
- [ ] Cliquer sur "Ne plus afficher" désactive l'alerte définitivement

## 🔧 Solutions rapides

### Si rien ne fonctionne

1. **Vérifier que VendorLayout charge le composant :**
   ```typescript
   // Dans src/layouts/VendorLayout.tsx
   import OnboardingReminderAlert from '../components/vendor/OnboardingReminderAlert';

   export const VendorLayout: React.FC = () => {
     return (
       <>
         <VendorSidebar />
         <OnboardingReminderAlert /> // ← Doit être présent
       </>
     );
   };
   ```

2. **Vérifier les imports du composant :**
   ```typescript
   import { AlertCircle, X } from 'lucide-react';
   import { useNavigate } from 'react-router-dom';
   import { Button } from '../ui/button';
   ```

3. **Vérifier le z-index :**
   ```html
   <div className="fixed bottom-4 right-4 z-50 ...">
   ```
   Le `z-50` doit être assez élevé pour passer au-dessus des autres éléments.

4. **Forcer un re-render :**
   - Rafraîchir la page
   - Vider le cache du navigateur
   - Redémarrer le serveur de développement

## 📞 Support

Si le problème persiste :
1. Copier TOUS les logs de la console
2. Vérifier les valeurs localStorage
3. Vérifier qu'il n'y a pas d'erreurs React
4. Vérifier que le composant est bien monté dans le DOM

---

**Logs attendus (normal flow) :**
```
⏭️ Onboarding ignoré par le vendeur
✅ LocalStorage configuré: { ... }
🔍 Vérification alerte onboarding: { ... }
⏱️ Temps écoulé: 0 secondes
⏳ Attente... 30 secondes restantes
... (attendre) ...
⏱️ Temps écoulé: 30 secondes
🔔 Affichage de l'alerte !
```
