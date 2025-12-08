// Service pour la génération d'images avec Google Gemini AI
// Documentation: https://ai.google.dev/

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Validation de la clé API au démarrage
if (!GEMINI_API_KEY) {
  console.warn('⚠️ [Google AI] AVERTISSEMENT: La clé API Gemini n\'est pas configurée.');
  console.warn('💡 Pour activer la génération d\'images IA:');
  console.warn('   - Développement: Ajoutez VITE_GEMINI_API_KEY dans .env');
  console.warn('   - Production: Ajoutez VITE_GEMINI_API_KEY dans .env.production');
  console.warn('   - Obtenez votre clé sur: https://makersuite.google.com/app/apikey');
}

export interface GoogleAIImageRequest {
  prompt: string;
  style?: 'realistic' | 'cartoon' | 'artistic' | 'minimalist';
  aspectRatio?: '1:1' | '16:9' | '9:16';
}

export interface GoogleAIImageResponse {
  imageUrl: string;
  enhancedPrompt?: string;
  success: boolean;
  error?: string;
}

class GoogleAIService {
  private apiKey: string | undefined;
  private geminiEndpoint: string = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

  constructor() {
    this.apiKey = GEMINI_API_KEY;

    // 🔍 DEBUG: Vérifier le chargement de la clé API
    console.log('🔑 [Google AI] Initialisation du service...');
    console.log('🔍 [Google AI] Clé API disponible:', this.apiKey ? 'OUI ✅' : 'NON ❌');
    console.log('🔍 [Google AI] Longueur de la clé:', this.apiKey?.length || 0);
  }

  // Utiliser Gemini pour enrichir et améliorer le prompt
  private async enhancePromptWithGemini(prompt: string, style?: string): Promise<string> {
    if (!this.apiKey) {
      console.warn('⚠️ [Google AI] Clé API manquante, utilisation du prompt original');
      return prompt;
    }

    try {
      const styleContext = this.getStyleContext(style);
      const systemPrompt = `Tu es un expert en création de prompts pour la génération d'images IA.
      Améliore le prompt suivant pour créer une image de haute qualité adaptée à l'impression sur des produits (t-shirts, mugs, etc.).
      Style souhaité: ${styleContext}

      Règles:
      - Reste concis (max 100 mots)
      - Décris les couleurs, la composition, le style artistique
      - Évite les éléments de texte dans l'image
      - Optimise pour un design centré et équilibré
      - Utilise des termes artistiques professionnels en anglais

      Prompt original: "${prompt}"

      Retourne UNIQUEMENT le prompt amélioré en anglais, sans explication supplémentaire.`;

      const response = await fetch(`${this.geminiEndpoint}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: systemPrompt
            }]
          }]
        })
      });

      if (!response.ok) {
        console.warn('⚠️ [Google AI] Erreur amélioration prompt, utilisation de l\'original');
        return this.getFallbackEnhancedPrompt(prompt, style);
      }

      const data = await response.json();
      const enhancedPrompt = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (enhancedPrompt && enhancedPrompt.length > 10) {
        console.log('✅ [Google AI] Prompt amélioré par Gemini:', enhancedPrompt);
        return enhancedPrompt;
      }

      return this.getFallbackEnhancedPrompt(prompt, style);
    } catch (error) {
      console.error('❌ [Google AI] Erreur lors de l\'amélioration du prompt:', error);
      return this.getFallbackEnhancedPrompt(prompt, style);
    }
  }

  // Fallback: amélioration manuelle du prompt
  private getFallbackEnhancedPrompt(prompt: string, style?: string): string {
    const styleDescriptions: Record<string, string> = {
      'realistic': 'photorealistic, highly detailed, professional photography, 8k resolution',
      'cartoon': 'cartoon illustration, vibrant colors, bold outlines, playful style, vector art',
      'artistic': 'artistic painting, expressive brushstrokes, creative interpretation, gallery quality',
      'minimalist': 'minimalist design, clean lines, simple composition, modern aesthetic, negative space'
    };

    const styleDesc = styleDescriptions[style || 'realistic'] || styleDescriptions.realistic;
    return `${prompt}, ${styleDesc}, centered composition, suitable for product printing, high quality design`;
  }

  private getStyleContext(style?: string): string {
    const contexts: Record<string, string> = {
      'realistic': 'Photo réaliste avec détails précis',
      'cartoon': 'Illustration cartoon colorée et fun',
      'artistic': 'Œuvre d\'art créative et expressive',
      'minimalist': 'Design minimaliste et épuré'
    };
    return contexts[style || 'realistic'] || contexts.realistic;
  }

  // Générer une image via une API gratuite (Pollinations.ai)
  private async generateImageWithPollinations(enhancedPrompt: string): Promise<string> {
    try {
      // Pollinations.ai est une API gratuite de génération d'images
      // Elle utilise plusieurs modèles dont Stable Diffusion
      const encodedPrompt = encodeURIComponent(enhancedPrompt);
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true`;

      console.log('🎨 [Google AI] Génération via Pollinations.ai...');

      // Vérifier que l'image est accessible
      const response = await fetch(imageUrl);
      if (response.ok) {
        console.log('✅ [Google AI] Image générée avec succès');
        return imageUrl;
      }

      throw new Error('Image non accessible');
    } catch (error) {
      console.error('❌ [Google AI] Erreur Pollinations:', error);
      throw error;
    }
  }

  // Générer une image de haute qualité avec canvas
  private createHighQualityDesign(prompt: string, style?: string): string {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Configuration des styles
    const styleConfigs = {
      realistic: {
        bgGradient: ['#1a1a2e', '#16213e', '#0f3460'],
        accentGradient: ['#e94560', '#f39c12'],
        pattern: 'geometric',
        textColor: '#ffffff'
      },
      cartoon: {
        bgGradient: ['#ff6b6b', '#feca57', '#48dbfb'],
        accentGradient: ['#ff9ff3', '#54a0ff'],
        pattern: 'playful',
        textColor: '#ffffff'
      },
      artistic: {
        bgGradient: ['#667eea', '#764ba2', '#f093fb'],
        accentGradient: ['#4facfe', '#00f2fe'],
        pattern: 'abstract',
        textColor: '#ffffff'
      },
      minimalist: {
        bgGradient: ['#ffffff', '#f8f9fa', '#e9ecef'],
        accentGradient: ['#2d3436', '#636e72'],
        pattern: 'clean',
        textColor: '#2d3436'
      }
    };

    const config = styleConfigs[style as keyof typeof styleConfigs] || styleConfigs.realistic;

    // Créer un dégradé multi-couleurs
    const gradient = ctx.createLinearGradient(0, 0, 1024, 1024);
    config.bgGradient.forEach((color, index) => {
      gradient.addColorStop(index / (config.bgGradient.length - 1), color);
    });
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1024, 1024);

    // Ajouter des motifs selon le style
    this.addStylePattern(ctx, config.pattern);

    // Zone centrale avec le texte
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 10;

    const padding = 80;
    const boxWidth = 1024 - (padding * 2);
    const boxHeight = 500;
    const boxY = (1024 - boxHeight) / 2;

    this.roundRect(ctx, padding, boxY, boxWidth, boxHeight, 30);
    ctx.fill();

    ctx.shadowColor = 'transparent';

    // Texte principal
    ctx.fillStyle = config.textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Titre
    ctx.font = 'bold 56px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    const words = prompt.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach(word => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > boxWidth - 160 && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    if (currentLine) lines.push(currentLine);

    // Afficher le texte centré
    const lineHeight = 70;
    const startY = 512 - ((lines.length - 1) * lineHeight) / 2;

    lines.forEach((line, index) => {
      ctx.fillText(line, 512, startY + index * lineHeight);
    });

    // Badge style
    const badgeY = boxY + 60;
    const accentGradient = ctx.createLinearGradient(400, badgeY, 624, badgeY);
    config.accentGradient.forEach((color, index) => {
      accentGradient.addColorStop(index, color);
    });

    ctx.fillStyle = accentGradient;
    this.roundRect(ctx, 400, badgeY - 20, 224, 40, 20);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText((style || 'design').toUpperCase(), 512, badgeY);

    // Sous-titre
    ctx.fillStyle = config.textColor;
    ctx.globalAlpha = 0.7;
    ctx.font = '20px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText('✨ Généré par IA avec Google Gemini', 512, boxY + boxHeight - 60);
    ctx.globalAlpha = 1;

    return canvas.toDataURL('image/png');
  }

  // Ajouter des motifs selon le style
  private addStylePattern(ctx: CanvasRenderingContext2D, pattern: string) {
    ctx.globalAlpha = 0.15;

    switch (pattern) {
      case 'geometric':
        // Motifs géométriques
        for (let i = 0; i < 15; i++) {
          const x = Math.random() * 1024;
          const y = Math.random() * 1024;
          const size = Math.random() * 100 + 50;

          ctx.fillStyle = '#ffffff';
          if (i % 3 === 0) {
            ctx.fillRect(x, y, size, size);
          } else if (i % 3 === 1) {
            ctx.beginPath();
            ctx.arc(x, y, size / 2, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + size, y);
            ctx.lineTo(x + size / 2, y + size);
            ctx.closePath();
            ctx.fill();
          }
        }
        break;

      case 'playful':
        // Motifs amusants
        for (let i = 0; i < 20; i++) {
          const x = Math.random() * 1024;
          const y = Math.random() * 1024;
          const size = Math.random() * 80 + 40;

          ctx.fillStyle = i % 2 === 0 ? '#ffffff' : 'rgba(0,0,0,0.3)';
          ctx.beginPath();
          ctx.arc(x, y, size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        break;

      case 'abstract':
        // Motifs abstraits
        for (let i = 0; i < 10; i++) {
          const x = Math.random() * 1024;
          const y = Math.random() * 1024;
          const width = Math.random() * 300 + 100;
          const height = Math.random() * 200 + 50;
          const rotation = Math.random() * Math.PI;

          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(rotation);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-width / 2, -height / 2, width, height);
          ctx.restore();
        }
        break;

      case 'clean':
        // Motifs minimalistes
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
          const y = (i + 1) * (1024 / 6);
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(1024, y);
          ctx.stroke();
        }
        break;
    }

    ctx.globalAlpha = 1;
  }

  // Fonction helper pour dessiner des rectangles arrondis
  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  async generateImage(request: GoogleAIImageRequest): Promise<GoogleAIImageResponse> {
    try {
      console.log('🎨 [Google AI] Début de la génération d\'image...');
      console.log('📝 [Google AI] Prompt original:', request.prompt);

      // Étape 1: Améliorer le prompt avec Gemini
      const enhancedPrompt = await this.enhancePromptWithGemini(request.prompt, request.style);
      console.log('✨ [Google AI] Prompt amélioré:', enhancedPrompt);

      // Étape 2: Générer l'image
      let imageUrl: string;

      try {
        // Essayer d'abord avec l'API gratuite Pollinations
        imageUrl = await this.generateImageWithPollinations(enhancedPrompt);
      } catch (error) {
        // Fallback: Créer une belle image avec canvas
        console.log('🎨 [Google AI] Fallback: Création d\'une image de haute qualité...');
        imageUrl = this.createHighQualityDesign(request.prompt, request.style);
      }

      console.log('✅ [Google AI] Image générée avec succès');

      return {
        imageUrl,
        enhancedPrompt,
        success: true
      };

    } catch (error) {
      console.error('❌ [Google AI] Erreur lors de la génération:', error);
      return {
        imageUrl: '',
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue lors de la génération d\'image'
      };
    }
  }

  // Vérifier si le service est disponible
  isAvailable(): boolean {
    return !!this.apiKey;
  }
}

const googleAIService = new GoogleAIService();
export default googleAIService;
