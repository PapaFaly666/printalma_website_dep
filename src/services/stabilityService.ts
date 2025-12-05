// Service pour la génération d'images avec Stability AI
// Documentation: https://platform.stability.ai/docs/api-reference

const STABILITY_API_KEY = import.meta.env.VITE_STABILITY_API_KEY;

// Validation de la clé API au démarrage
if (!STABILITY_API_KEY) {
  console.warn('⚠️ [Stability AI] AVERTISSEMENT: La clé API n\'est pas configurée.');
  console.warn('💡 Pour activer la génération d\'images IA:');
  console.warn('   - Développement: Ajoutez VITE_STABILITY_API_KEY dans .env.local');
  console.warn('   - Production: Ajoutez VITE_STABILITY_API_KEY dans .env.production');
  console.warn('   - Obtenez votre clé sur: https://platform.stability.ai/account/keys');
}

export interface StabilityImageRequest {
  prompt: string;
  style?: 'realistic' | 'cartoon' | 'artistic' | 'minimalist';
  negativePrompt?: string;
  aspectRatio?: '1:1' | '16:9' | '9:16';
  outputFormat?: 'png' | 'jpeg' | 'webp';
}

export interface StabilityImageResponse {
  imageUrl: string;
  seed?: number;
  finishReason?: string;
  success: boolean;
  error?: string;
}

class StabilityService {
  private apiKey: string | undefined;
  private baseUrl: string = 'https://api.stability.ai/v2beta/stable-image/generate';

  constructor() {
    this.apiKey = STABILITY_API_KEY;
  }

  // Mapper nos styles vers les style presets de Stability AI
  private getStylePreset(style?: string): string {
    const styleMap: Record<string, string> = {
      'realistic': 'photographic',
      'cartoon': 'comic-book',
      'artistic': 'digital-art',
      'minimalist': 'line-art'
    };
    return styleMap[style || 'realistic'] || 'photographic';
  }

  // Enrichir le prompt en français pour de meilleurs résultats
  private enhancePrompt(prompt: string, style?: string): string {
    const styleDescriptions: Record<string, string> = {
      'realistic': 'photorealistic, high quality, detailed',
      'cartoon': 'cartoon style, vibrant colors, bold lines, fun',
      'artistic': 'artistic, creative, unique style, expressive',
      'minimalist': 'minimalist, simple, clean lines, modern'
    };

    const styleDesc = styleDescriptions[style || 'realistic'] || '';

    // Format optimisé pour Stability AI
    return `${prompt}. ${styleDesc}. High quality design suitable for printing on products like t-shirts and mugs. Professional, centered composition.`;
  }

  // Générer un negative prompt pour améliorer la qualité
  private getDefaultNegativePrompt(): string {
    return 'blurry, low quality, distorted, deformed, ugly, bad anatomy, watermark, text, signature, jpeg artifacts, worst quality';
  }

  async generateImage(request: StabilityImageRequest): Promise<StabilityImageResponse> {
    try {
      // Vérifier la clé API
      if (!this.apiKey) {
        const env = import.meta.env.MODE || 'development';
        const envFile = env === 'production' ? '.env.production' : '.env.local';
        console.error('❌ [Stability AI] Clé API manquante');
        console.error(`💡 Configuration requise dans ${envFile}:`);
        console.error('   VITE_STABILITY_API_KEY=sk-votre_cle_ici');

        return {
          imageUrl: '',
          success: false,
          error: `Clé API Stability AI non configurée. Ajoutez VITE_STABILITY_API_KEY dans ${envFile}. Obtenez votre clé sur: https://platform.stability.ai/account/keys`
        };
      }

      console.log('🎨 [Stability AI] Génération d\'image avec prompt:', request.prompt);
      console.log('🎨 [Stability AI] Style:', request.style || 'realistic');

      // Préparer le prompt enrichi
      const enhancedPrompt = this.enhancePrompt(request.prompt, request.style);
      const negativePrompt = request.negativePrompt || this.getDefaultNegativePrompt();

      // Préparer le FormData
      const formData = new FormData();
      formData.append('prompt', enhancedPrompt);
      formData.append('negative_prompt', negativePrompt);
      formData.append('output_format', request.outputFormat || 'png');
      formData.append('aspect_ratio', request.aspectRatio || '1:1');
      formData.append('style_preset', this.getStylePreset(request.style));

      console.log('📤 [Stability AI] Envoi de la requête à l\'API...');

      // Appel à l'API Stability AI (Core model)
      const response = await fetch(`${this.baseUrl}/core`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'image/*'
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [Stability AI] Erreur API:', response.status, errorText);

        // Essayer de parser l'erreur JSON
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(`Stability AI Error: ${errorJson.message || errorJson.errors?.[0] || errorText}`);
        } catch {
          throw new Error(`Stability AI Error (${response.status}): ${errorText}`);
        }
      }

      console.log('✅ [Stability AI] Image reçue avec succès');

      // L'API retourne directement l'image en binaire
      const imageBlob = await response.blob();

      // Convertir le blob en data URL pour l'affichage
      const imageUrl = await this.blobToDataURL(imageBlob);

      // Extraire les métadonnées de l'en-tête de réponse si disponibles
      const seed = response.headers.get('seed');
      const finishReason = response.headers.get('finish-reason');

      console.log('🎉 [Stability AI] Image générée avec succès!');
      if (seed) console.log('🌱 [Stability AI] Seed:', seed);

      return {
        imageUrl,
        seed: seed ? parseInt(seed) : undefined,
        finishReason: finishReason || undefined,
        success: true
      };

    } catch (error) {
      console.error('❌ [Stability AI] Erreur lors de la génération:', error);
      return {
        imageUrl: '',
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue lors de la génération d\'image'
      };
    }
  }

  // Convertir un Blob en Data URL
  private blobToDataURL(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Vérifier si le service est disponible
  isAvailable(): boolean {
    return !!this.apiKey;
  }

  // Obtenir les modèles disponibles (pour debug)
  async listModels(): Promise<any> {
    if (!this.apiKey) {
      throw new Error('API key not configured');
    }

    const response = await fetch('https://api.stability.ai/v1/engines/list', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to list models: ${response.status}`);
    }

    return response.json();
  }
}

const stabilityService = new StabilityService();
export default stabilityService;
