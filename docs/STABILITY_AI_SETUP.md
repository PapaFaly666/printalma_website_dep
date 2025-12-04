# 🎨 Guide de configuration - Stability AI

## Vue d'ensemble

PrintAlma utilise maintenant **Stability AI** pour générer des images de qualité professionnelle par intelligence artificielle. Ce guide explique comment le système fonctionne et comment l'utiliser.

## ✅ Configuration actuelle

Le système est **déjà configuré et fonctionnel** avec :
- ✅ Clé API Stability AI active
- ✅ Service d'intégration complet
- ✅ 4 styles de génération disponibles
- ✅ Système de fallback automatique

## 🚀 Fonctionnalités

### Styles disponibles

1. **Réaliste (Photographic)**
   - Style : Photographie réaliste
   - Idéal pour : Portraits, objets, scènes naturelles
   - Preset Stability : `photographic`

2. **Cartoon**
   - Style : Bande dessinée
   - Idéal pour : Personnages, designs ludiques
   - Preset Stability : `comic-book`

3. **Artistique**
   - Style : Art numérique créatif
   - Idéal pour : Designs abstraits, œuvres d'art
   - Preset Stability : `digital-art`

4. **Minimaliste**
   - Style : Lignes épurées
   - Idéal pour : Logos, designs simples
   - Preset Stability : `line-art`

### Optimisations automatiques

Le système optimise automatiquement chaque génération :

```typescript
// Enrichissement du prompt
prompt + style description + "High quality design suitable for printing"

// Negative prompts (améliore la qualité)
"blurry, low quality, distorted, deformed, ugly, bad anatomy,
watermark, text, signature, jpeg artifacts, worst quality"

// Format optimal pour impression
- Ratio: 1:1 (carré)
- Format: PNG (transparence)
- Résolution: 1024x1024px
```

## 📁 Architecture du code

### Services

**`src/services/stabilityService.ts`**
- Service principal pour l'API Stability AI
- Gestion des appels API
- Conversion blob → data URL
- Validation et gestion d'erreurs

**`src/services/geminiService.ts`** (renommage à considérer)
- Pont entre l'UI et Stability AI
- Système de fallback automatique
- Génération d'images placeholder si nécessaire

### Composants

**`src/components/ai-image-generator/AIImageGenerator.tsx`**
- Interface utilisateur
- Sélection de style
- Prévisualisation
- Actions (utiliser/télécharger)

## 🔧 Utilisation dans le code

### Générer une image

```typescript
import stabilityService from './services/stabilityService';

// Génération simple
const result = await stabilityService.generateImage({
  prompt: "Un lion majestueux",
  style: "realistic"
});

if (result.success) {
  console.log("Image URL:", result.imageUrl);
  console.log("Seed:", result.seed); // Pour reproduire
}

// Génération avancée
const result = await stabilityService.generateImage({
  prompt: "Logo moderne pour tech startup",
  style: "minimalist",
  aspectRatio: "1:1",
  outputFormat: "png",
  negativePrompt: "ugly, distorted"
});
```

### Vérifier la disponibilité

```typescript
if (stabilityService.isAvailable()) {
  console.log("✅ Stability AI prêt");
} else {
  console.log("⚠️ Clé API manquante");
}
```

## 💰 Coûts et quotas

### Tarification Stability AI

- **Stable Image Core** : ~$0.03 par image (1024x1024)
- **Crédits requis** : 3 crédits par image
- **Pack de crédits** :
  - 1000 crédits = $10
  - ~333 images par $10

### Estimation mensuelle

| Utilisation | Images/jour | Coût/mois |
|-------------|-------------|-----------|
| Faible | 10 | ~$9 |
| Moyenne | 50 | ~$45 |
| Élevée | 200 | ~$180 |

### Optimiser les coûts

1. **Utiliser le cache** : Sauvegarder les images générées
2. **Seed fixe** : Reproduire les images exactement
3. **Fallback intelligent** : Éviter les régénérations inutiles
4. **Monitoring** : Suivre la consommation

## 🛡️ Sécurité

### Protection de la clé API

✅ **Ce qui est fait :**
- Clé stockée dans `.env.local` (non versionné)
- `.gitignore` configuré
- Validation au démarrage
- Messages d'erreur clairs

❌ **À ne JAMAIS faire :**
- Committer la clé dans Git
- Exposer la clé côté client (déjà sécurisé)
- Partager la clé publiquement

### Rotation de clé

Si la clé est compromise :

1. **Révoquer** sur https://platform.stability.ai/account/keys
2. **Générer** une nouvelle clé
3. **Mettre à jour** `.env.local`
4. **Redémarrer** le serveur dev

```bash
npm run dev
```

## 🔍 Debugging

### Logs de console

Le système log toutes les étapes :

```
🎨 [AI Generator] Génération d'image avec prompt: Un lion
🚀 [AI Generator] Utilisation de Stability AI...
📤 [Stability AI] Envoi de la requête à l'API...
✅ [Stability AI] Image reçue avec succès
🌱 [Stability AI] Seed: 1234567890
🎉 [Stability AI] Image générée avec succès!
```

### Erreurs communes

**404 - Model not found**
```
Solution : Vérifier l'endpoint API (doit être /v2beta/stable-image/generate/core)
```

**401 - Unauthorized**
```
Solution : Vérifier la clé API dans .env.local
```

**400 - Bad request**
```
Solution : Vérifier le format du prompt (pas de caractères spéciaux interdits)
```

**429 - Rate limit**
```
Solution : Attendre ou upgrader le plan Stability AI
```

## 🧪 Tests

### Test manuel

1. Ouvrir l'interface de personnalisation
2. Cliquer sur l'icône "IA" (Sparkles)
3. Entrer un prompt : "Un chat mignon"
4. Sélectionner style : "Cartoon"
5. Cliquer "Générer l'image"
6. Attendre 5-10 secondes
7. Vérifier l'image générée

### Test du fallback

1. Renommer temporairement `.env.local`
2. Relancer le serveur
3. Tester la génération
4. Vérifier que l'image placeholder s'affiche
5. Restaurer `.env.local`

## 📊 Monitoring

### Métriques à suivre

1. **Taux de succès** : % d'images générées avec succès
2. **Temps de génération** : Temps moyen par image
3. **Coût** : Budget mensuel consommé
4. **Utilisation du fallback** : Fréquence d'utilisation

### Dashboard Stability AI

Accéder aux statistiques : https://platform.stability.ai/account/usage

## 🆘 Support

### Documentation officielle
- API Reference : https://platform.stability.ai/docs/api-reference
- Guides : https://platform.stability.ai/docs/getting-started
- Modèles : https://platform.stability.ai/docs/features

### Problèmes courants

**Problème :** Images floues
**Solution :** Ajouter plus de détails au prompt

**Problème :** Génération lente
**Solution :** Normal (5-15 secondes), c'est le temps de génération IA

**Problème :** Résultat inattendu
**Solution :** Améliorer le prompt, utiliser negative prompts

## 🚀 Améliorations futures

### Court terme
- [ ] Cache des images générées (éviter régénération)
- [ ] Historique des prompts
- [ ] Favoris / collections

### Moyen terme
- [ ] Variations d'une image (même seed, variation légère)
- [ ] Upscaling (augmenter la résolution)
- [ ] Inpainting (modifier une partie)

### Long terme
- [ ] Fine-tuning sur le style PrintAlma
- [ ] Génération par lots
- [ ] API privée pour contrôle total

## 📞 Contact

Questions ? Problèmes ? Contactez l'équipe de développement PrintAlma.

---

**Dernière mise à jour :** 2025-12-04
**Version :** 1.0.0
**Status :** ✅ Production Ready
