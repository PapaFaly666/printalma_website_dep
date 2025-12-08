# 🤖 Génération d'Images IA avec Google Gemini

## Vue d'ensemble

Le système de génération d'images IA de PrintAlma utilise désormais **Google Gemini AI** pour améliorer les prompts et générer des images de haute qualité pour la personnalisation de produits.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AIImageGenerator.tsx                      │
│                  (Interface utilisateur)                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    geminiService.ts                          │
│              (Service de coordination)                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   googleAIService.ts                         │
│           (Moteur de génération Gemini)                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
         ┌─────────────┴─────────────┐
         ▼                           ▼
┌──────────────────┐      ┌─────────────────────┐
│  Gemini Pro API  │      │  Pollinations.ai    │
│ (Amélioration    │      │ (Génération image)  │
│  des prompts)    │      │                     │
└──────────────────┘      └─────────────────────┘
```

## Fonctionnalités

### 1. Amélioration des Prompts avec Gemini Pro

Le système utilise l'API Gemini Pro pour transformer les prompts utilisateurs en descriptions optimisées pour la génération d'images :

**Exemple :**
- **Prompt utilisateur :** "Un lion majestueux"
- **Prompt amélioré :** "Majestic lion portrait with golden mane, photorealistic, highly detailed, professional photography, 8k resolution, centered composition, suitable for product printing, high quality design"

### 2. Génération d'Images

Le système utilise une approche en cascade :

#### Option 1 : Pollinations.ai (Gratuit)
- API gratuite utilisant Stable Diffusion
- Aucune clé API requise
- Qualité professionnelle
- URL directe : `https://image.pollinations.ai/prompt/{prompt}`

#### Option 2 : Fallback Canvas (Toujours disponible)
- Génère une image de haute qualité avec Canvas
- Design professionnel adapté au style choisi
- S'active automatiquement si Pollinations échoue
- Aucune dépendance externe

### 3. Styles Disponibles

| Style | Description | Use Case |
|-------|-------------|----------|
| **Realistic** | Photo réaliste avec détails précis | Photos de produits, portraits |
| **Cartoon** | Illustration cartoon colorée | Designs fun, produits enfants |
| **Artistic** | Œuvre d'art créative et expressive | Designs artistiques, mode |
| **Minimalist** | Design épuré et moderne | Logos, designs professionnels |

## Configuration

### Clé API Google Gemini

1. **Obtenir la clé :**
   - Allez sur https://aistudio.google.com/app/apikey
   - Créez un nouveau projet Google AI Studio
   - Générez une clé API
   - Format : `AIzaSy...` (39 caractères)

2. **Configuration locale (.env) :**
   ```env
   VITE_GEMINI_API_KEY=AIzaSyAJsupa-9VoR5puE_NXFCDOcYszbcb5pjo
   ```

3. **Configuration production (.env.production) :**
   ```env
   VITE_GEMINI_API_KEY=votre_cle_production
   ```

### Variables d'Environnement

```env
# API Google Gemini (RECOMMANDÉ)
VITE_GEMINI_API_KEY=AIzaSy...

# API Stability AI (BACKUP - optionnel)
VITE_STABILITY_API_KEY=sk-...
```

## Utilisation

### Dans le Composant React

Le composant `AIImageGenerator` s'utilise de manière transparente :

```tsx
import AIImageGenerator from '@/components/ai-image-generator/AIImageGenerator';

function CustomizationPage() {
  const handleImageGenerated = (imageUrl: string, description: string) => {
    console.log('Image générée:', imageUrl);
    // Ajouter l'image au design
  };

  return (
    <AIImageGenerator
      onImageGenerated={handleImageGenerated}
      onClose={() => console.log('Fermé')}
    />
  );
}
```

### Via le Service Directement

```typescript
import geminiService from '@/services/geminiService';

const result = await geminiService.generateImage({
  prompt: 'Un lion majestueux',
  style: 'realistic'
});

if (result.success) {
  console.log('Image URL:', result.imageUrl);
  console.log('Description:', result.description);
}
```

## Workflow de Génération

```mermaid
graph TD
    A[Utilisateur entre un prompt] --> B{Clé Gemini disponible?}
    B -->|Oui| C[Appel API Gemini Pro]
    B -->|Non| D[Amélioration manuelle]
    C --> E[Prompt amélioré]
    D --> E
    E --> F{Générer avec Pollinations?}
    F -->|Succès| G[Retourner image URL]
    F -->|Échec| H[Générer avec Canvas]
    H --> G
    G --> I[Afficher à l'utilisateur]
```

## Avantages vs Stability AI

| Aspect | Google Gemini + Pollinations | Stability AI |
|--------|------------------------------|--------------|
| **Coût** | Gratuit (Pollinations) | ~0.03$ par image |
| **Qualité prompts** | Excellente (Gemini Pro) | Manuel |
| **Vitesse** | Rapide (5-15 secondes) | Moyenne (10-30s) |
| **Disponibilité** | Toujours (fallback canvas) | Dépend du crédit |
| **Quota** | Limité par Pollinations | Limité par budget |

## Limitations & Considérations

### Limitations de l'API Gemini

- **Gemini Pro** : Génère du texte uniquement (pas d'images directement)
- **Quotas** : 60 requêtes/minute (gratuit), 1000/jour
- **Région** : Disponible dans la plupart des pays

### Limitations de Pollinations.ai

- **Stabilité** : Service gratuit, peut être temporairement indisponible
- **Contrôle** : Moins de contrôle sur les paramètres qu'avec Stability AI
- **Cache** : Les images peuvent être mises en cache

### Solutions de Fallback

Le système garantit toujours une image même en cas d'échec :

1. **Niveau 1** : Gemini Pro + Pollinations.ai
2. **Niveau 2** : Amélioration manuelle + Pollinations.ai
3. **Niveau 3** : Génération Canvas haute qualité

## Performance

### Métriques Moyennes

- **Amélioration du prompt** : 1-3 secondes
- **Génération Pollinations** : 5-15 secondes
- **Génération Canvas (fallback)** : < 1 seconde
- **Total moyen** : 6-18 secondes

### Optimisations

- Cache des prompts améliorés
- Timeout de 30 secondes pour Pollinations
- Fallback instantané vers Canvas
- Validation des prompts avant envoi

## Sécurité

### Protection des Clés API

```typescript
// ✅ CORRECT - Via variable d'environnement
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

// ❌ INCORRECT - Hardcodé
const apiKey = 'AIzaSy...'; // NE JAMAIS FAIRE ÇA
```

### Validation des Prompts

Le système valide automatiquement les prompts :

```typescript
const validation = geminiService.validatePrompt(prompt);

if (!validation.valid) {
  // Prompt contient du contenu inapproprié
  console.error(validation.reason);
}
```

**Mots interdits :**
- violence, haine, discrimination
- arme, drogue
- contenu adulte

## Monitoring & Debugging

### Logs de Debug

Le système log toutes les étapes importantes :

```
🔑 [Google AI] Initialisation du service...
🔍 [Google AI] Clé API disponible: OUI ✅
🎨 [Google AI] Début de la génération d'image...
📝 [Google AI] Prompt original: Un lion majestueux
✨ [Google AI] Prompt amélioré: Majestic lion...
🎨 [Google AI] Génération via Pollinations.ai...
✅ [Google AI] Image générée avec succès
```

### Vérifier la Disponibilité

```typescript
const isAvailable = googleAIService.isAvailable();
console.log('Service disponible:', isAvailable);
```

## Déploiement

### Variables d'Environnement en Production

#### Vercel
```bash
vercel env add VITE_GEMINI_API_KEY
# Entrez votre clé : AIzaSy...
```

#### Netlify
```bash
# Dans Settings > Environment > Environment variables
VITE_GEMINI_API_KEY=AIzaSy...
```

#### Render
```bash
# Dans Environment > Environment Variables
VITE_GEMINI_API_KEY=AIzaSy...
```

### Build de Production

```bash
# 1. Vérifier que la clé est configurée
cat .env.production

# 2. Build
npm run build

# 3. Tester localement
npm run preview

# 4. Déployer
# Les variables d'environnement seront injectées au build
```

## Troubleshooting

### Problème : Aucune image générée

**Solution :**
1. Vérifier la clé API : `console.log(import.meta.env.VITE_GEMINI_API_KEY)`
2. Vérifier les logs du navigateur (F12)
3. Tester l'URL Pollinations manuellement
4. Le fallback Canvas devrait toujours fonctionner

### Problème : Prompt amélioré identique à l'original

**Cause :** Clé Gemini invalide ou quota dépassé

**Solution :**
1. Vérifier la validité de la clé
2. Vérifier les quotas : https://console.cloud.google.com/
3. Le système utilise un fallback d'amélioration manuelle

### Problème : Images de mauvaise qualité

**Solution :**
1. Améliorer la description du prompt
2. Choisir un style adapté au contenu
3. Utiliser des mots-clés descriptifs précis

## Migration depuis Stability AI

Si vous migrez depuis Stability AI :

1. **Ajouter la clé Gemini** dans `.env`
2. **Les fichiers modifiés :**
   - `src/services/geminiService.ts` (utilise maintenant googleAIService)
   - `src/services/googleAIService.ts` (nouveau service)
3. **Aucun changement** requis dans les composants React
4. **Garder la clé Stability** comme backup (optionnel)

## FAQ

**Q : Peut-on utiliser les deux APIs (Gemini et Stability) ?**
R : Oui, gardez les deux clés configurées. Gemini est utilisé en priorité.

**Q : Quelle est la limite de génération ?**
R : Pollinations.ai : pas de limite stricte, mais rate limiting possible. Gemini : 60 req/min.

**Q : Les images sont-elles sauvegardées ?**
R : Les images Pollinations sont servies via CDN. Les images Canvas sont générées côté client.

**Q : Peut-on personnaliser les styles ?**
R : Oui, modifiez `googleAIService.ts` pour ajouter de nouveaux styles.

## Support

- **Documentation API Gemini :** https://ai.google.dev/
- **Pollinations.ai :** https://pollinations.ai/
- **Issues GitHub :** Créez une issue sur le repo du projet

---

**Dernière mise à jour :** Décembre 2025
**Version :** 2.0.0
**Auteur :** Équipe PrintAlma
