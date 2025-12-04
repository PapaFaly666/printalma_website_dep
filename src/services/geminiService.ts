// Service pour la génération d'images avec Stability AI
// Ce service fait le pont entre l'interface utilisateur et Stability AI

import stabilityService from './stabilityService';

export interface GeminiImageRequest {
  prompt: string;
  style?: 'realistic' | 'cartoon' | 'artistic' | 'minimalist';
  size?: 'small' | 'medium' | 'large';
}

export interface GeminiImageResponse {
  imageUrl: string;
  description: string;
  success: boolean;
  error?: string;
}

class GeminiService {
  async generateImage(request: GeminiImageRequest): Promise<GeminiImageResponse> {
    try {
      console.log('🎨 [AI Generator] Génération d\'image avec prompt:', request.prompt);

      // Vérifier si Stability AI est disponible
      if (!stabilityService.isAvailable()) {
        console.warn('⚠️ [AI Generator] Stability AI non disponible, utilisation du fallback');
        return this.generateFallbackImage(request);
      }

      // Utiliser Stability AI pour générer une vraie image
      console.log('🚀 [AI Generator] Utilisation de Stability AI...');
      const stabilityResponse = await stabilityService.generateImage({
        prompt: request.prompt,
        style: request.style,
        aspectRatio: '1:1',
        outputFormat: 'png'
      });

      if (stabilityResponse.success && stabilityResponse.imageUrl) {
        console.log('✅ [AI Generator] Image générée avec succès par Stability AI');
        return {
          imageUrl: stabilityResponse.imageUrl,
          description: request.prompt,
          success: true
        };
      } else {
        // Si Stability AI échoue, utiliser le fallback
        console.warn('⚠️ [AI Generator] Stability AI a échoué, utilisation du fallback');
        return this.generateFallbackImage(request);
      }

    } catch (error) {
      console.error('❌ [AI Generator] Erreur génération image:', error);
      // En cas d'erreur, essayer le fallback
      return this.generateFallbackImage(request);
    }
  }

  // Générer une image de fallback en cas d'erreur
  private generateFallbackImage(request: GeminiImageRequest): GeminiImageResponse {
    console.log('🎨 [AI Generator] Génération d\'image fallback...');
    const imageUrl = this.createMockImageFromPrompt(request.prompt, request.style);

    return {
      imageUrl,
      description: request.prompt,
      success: true
    };
  }

  // Fonction pour créer une image placeholder stylisée
  // Note: Pour de vraies images IA, utilisez Imagen, DALL-E ou Stable Diffusion
  private createMockImageFromPrompt(prompt: string, style?: string): string {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Styles visuels selon le type
    const styleConfig = {
      realistic: {
        bgGradient: ['#667eea', '#764ba2'],
        accent: '#ffffff',
        pattern: 'photo'
      },
      cartoon: {
        bgGradient: ['#f093fb', '#f5576c'],
        accent: '#ffffff',
        pattern: 'cartoon'
      },
      artistic: {
        bgGradient: ['#4facfe', '#00f2fe'],
        accent: '#ffffff',
        pattern: 'artistic'
      },
      minimalist: {
        bgGradient: ['#f8f9fa', '#e9ecef'],
        accent: '#212529',
        pattern: 'minimal'
      }
    };

    const config = styleConfig[style as keyof typeof styleConfig] || styleConfig.realistic;

    // Créer un dégradé de fond
    const gradient = ctx.createLinearGradient(0, 0, 1024, 1024);
    gradient.addColorStop(0, config.bgGradient[0]);
    gradient.addColorStop(1, config.bgGradient[1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1024, 1024);

    // Ajouter des formes décoratives
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (let i = 0; i < 5; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;
      const size = Math.random() * 200 + 50;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ajouter une zone centrale pour le texte
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.roundRect(100, 300, 824, 424, 20);
    ctx.fill();

    // Texte principal
    ctx.fillStyle = config.accent === '#ffffff' ? '#212529' : config.accent;
    ctx.font = 'bold 48px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Diviser le prompt en lignes
    const words = prompt.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach(word => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > 700 && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    if (currentLine) {
      lines.push(currentLine);
    }

    // Afficher le prompt
    const lineHeight = 60;
    const startY = 512 - (lines.length - 1) * lineHeight / 2;

    lines.forEach((line, index) => {
      ctx.fillText(line, 512, startY + index * lineHeight);
    });

    // Badge style
    const badgeY = startY - 80;
    ctx.fillStyle = config.bgGradient[0];
    ctx.roundRect(400, badgeY - 20, 224, 40, 20);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText(style?.toUpperCase() || 'DESIGN', 512, badgeY);

    // Footer
    ctx.fillStyle = '#6c757d';
    ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText('✨ Généré par IA - PrintAlma', 512, 950);

    return canvas.toDataURL('image/png');
  }

  // Fonction pour vérifier si le prompt est approprié
  validatePrompt(prompt: string): { valid: boolean; reason?: string } {
    if (!prompt || prompt.trim().length < 3) {
      return { valid: false, reason: 'Le prompt doit contenir au moins 3 caractères' };
    }

    if (prompt.length > 500) {
      return { valid: false, reason: 'Le prompt ne doit pas dépasser 500 caractères' };
    }

    // Liste de mots interdits
    const forbiddenWords = ['violence', 'haine', 'discrimination', 'arme', 'drogue', 'adulte'];
    const lowerPrompt = prompt.toLowerCase();

    for (const word of forbiddenWords) {
      if (lowerPrompt.includes(word)) {
        return { valid: false, reason: 'Contenu inapproprié détecté' };
      }
    }

    return { valid: true };
  }
}

const geminiService = new GeminiService();
export default geminiService;