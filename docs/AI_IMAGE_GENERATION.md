# 🎨 Guide d'intégration - Génération d'images par IA

## État actuel

Le système utilise actuellement des **images placeholder stylisées** qui affichent le texte du prompt avec un design visuel adapté au style choisi. C'est une solution temporaire fonctionnelle mais pas une vraie génération d'images par IA.

## Pourquoi pas Gemini ?

**Gemini** est un modèle de langage (LLM) optimisé pour la génération de texte, pas d'images. L'API Gemini ne supporte pas `generateContent` pour les images.

## Solutions recommandées

### 🥇 Option 1 : OpenAI DALL-E 3 (Recommandé)

**Avantages :**
- Qualité exceptionnelle
- API simple et bien documentée
- Support officiel
- Bonne gestion des prompts en langage naturel

**Intégration :**

```typescript
// src/services/dalleService.ts
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

async function generateImage(prompt: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard"
    })
  });

  const data = await response.json();
  return data.data[0].url;
}
```

**Coût :** ~0.04$ par image (1024x1024)

**Documentation :** https://platform.openai.com/docs/guides/images

---

### 🥈 Option 2 : Stable Diffusion (Stability AI)

**Avantages :**
- Open source
- Très personnalisable
- Plusieurs modèles disponibles
- Coût modéré

**Intégration :**

```typescript
// src/services/stabilityService.ts
const STABILITY_API_KEY = import.meta.env.VITE_STABILITY_API_KEY;

async function generateImage(prompt: string, style: string): Promise<string> {
  const formData = new FormData();
  formData.append('prompt', prompt);
  formData.append('output_format', 'png');

  const response = await fetch(
    'https://api.stability.ai/v2beta/stable-image/generate/core',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STABILITY_API_KEY}`,
        'Accept': 'image/*'
      },
      body: formData
    }
  );

  if (!response.ok) {
    throw new Error(`${response.status}: ${await response.text()}`);
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}
```

**Coût :** ~0.03$ par image

**Documentation :** https://platform.stability.ai/docs/api-reference

---

### 🥉 Option 3 : Google Imagen (API officielle d'images Google)

**Avantages :**
- Qualité Google
- Bonne compréhension du contexte
- Intégration avec Google Cloud

**Intégration :**

```typescript
// src/services/imagenService.ts
import { ImageGenerationClient } from '@google-cloud/aiplatform';

const client = new ImageGenerationClient();

async function generateImage(prompt: string): Promise<string> {
  const [response] = await client.predict({
    endpoint: 'projects/YOUR_PROJECT/locations/us-central1/publishers/google/models/imagen-2',
    instances: [{
      prompt: prompt
    }],
    parameters: {
      sampleCount: 1
    }
  });

  return response.predictions[0].bytesBase64Encoded;
}
```

**Coût :** Variable selon l'utilisation

**Documentation :** https://cloud.google.com/vertex-ai/docs/generative-ai/image/overview

---

### 🎯 Option 4 : Replicate (Multiple modèles)

**Avantages :**
- Accès à plusieurs modèles (SDXL, Flux, etc.)
- Pay-as-you-go
- API simple

**Intégration :**

```typescript
// src/services/replicateService.ts
import Replicate from "replicate";

const replicate = new Replicate({
  auth: import.meta.env.VITE_REPLICATE_API_KEY,
});

async function generateImage(prompt: string): Promise<string> {
  const output = await replicate.run(
    "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
    {
      input: {
        prompt: prompt,
        width: 1024,
        height: 1024
      }
    }
  );

  return output[0];
}
```

**Coût :** Variable selon le modèle (~$0.01-0.05 par image)

**Documentation :** https://replicate.com/docs

---

## Migration depuis le système actuel

Pour migrer, modifiez `src/services/geminiService.ts` :

```typescript
// Remplacez la méthode generateImage
async generateImage(request: GeminiImageRequest): Promise<GeminiImageResponse> {
  try {
    // Option 1: DALL-E
    const imageUrl = await dalleService.generateImage(request.prompt);

    // Option 2: Stable Diffusion
    // const imageUrl = await stabilityService.generateImage(request.prompt, request.style);

    // Option 3: Replicate
    // const imageUrl = await replicateService.generateImage(request.prompt);

    return {
      imageUrl,
      description: request.prompt,
      success: true
    };
  } catch (error) {
    // Fallback vers le placeholder en cas d'erreur
    return {
      imageUrl: this.createMockImageFromPrompt(request.prompt, request.style),
      description: request.prompt,
      success: true
    };
  }
}
```

## Recommandation finale

Pour **PrintAlma**, je recommande **OpenAI DALL-E 3** pour :
- Qualité professionnelle des designs
- Support excellent des prompts en français
- API stable et bien documentée
- Bon rapport qualité/prix pour un usage commercial

## Budget estimé

Pour 100 générations/jour :
- DALL-E 3 : ~120$/mois
- Stable Diffusion : ~90$/mois
- Replicate : ~100$/mois

## Questions ?

Contactez l'équipe de développement pour plus d'informations sur l'intégration.
