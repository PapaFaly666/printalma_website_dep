import React, { useState } from 'react';
import { Wand2, Download, Loader2, AlertCircle, Sparkles, X } from 'lucide-react';
import Button from '../ui/Button';
import { useToast } from '../ui/use-toast';
import geminiService, { GeminiImageRequest } from '../../services/geminiService';

interface AIImageGeneratorProps {
  onImageGenerated: (imageUrl: string, description: string) => void;
  onClose: () => void;
  className?: string;
}

const AIImageGenerator: React.FC<AIImageGeneratorProps> = ({
  onImageGenerated,
  onClose,
  className = ''
}) => {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState<GeminiImageRequest['style']>('realistic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [description, setDescription] = useState('');

  const styles = [
    { value: 'realistic', label: 'Réaliste', description: 'Photo réaliste' },
    { value: 'cartoon', label: 'Cartoon', description: 'Style dessin animé' },
    { value: 'artistic', label: 'Artistique', description: 'Style créatif' },
    { value: 'minimalist', label: 'Minimaliste', description: 'Design épuré' }
  ];

  const examplePrompts = [
    'Un lion majestueux avec une crinière dorée',
    'Un paysage montagneux au coucher du soleil',
    'Un logo moderne pour une entreprise de technologie',
    'Un papillon coloré avec des motifs géométriques',
    'Une citation inspirante en typographie élégante'
  ];

  const handleGenerate = async () => {
    // Validation du prompt
    const validation = geminiService.validatePrompt(prompt);
    if (!validation.valid) {
      toast({
        title: 'Prompt invalide',
        description: validation.reason,
        variant: 'destructive'
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      const request: GeminiImageRequest = {
        prompt,
        style
      };

      const response = await geminiService.generateImage(request);

      if (response.success && response.imageUrl) {
        setGeneratedImage(response.imageUrl);
        setDescription(response.description);

        toast({
          title: '✅ Image générée avec succès',
          description: 'Votre image a été créée par l\'IA',
        });
      } else {
        throw new Error(response.error || 'Erreur lors de la génération');
      }
    } catch (error) {
      console.error('❌ Erreur génération IA:', error);
      toast({
        title: 'Erreur de génération',
        description: error instanceof Error ? error.message : 'Impossible de générer l\'image',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseImage = () => {
    if (generatedImage) {
      onImageGenerated(generatedImage, description);
      onClose();
    }
  };

  const handleDownload = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.download = `ai-generated-${Date.now()}.png`;
      link.href = generatedImage;
      link.click();

      toast({
        title: 'Image téléchargée',
        description: 'L\'image a été téléchargée sur votre appareil',
      });
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-xl border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Générateur d'images IA</h3>
            <p className="text-sm text-gray-600">Créez des designs uniques avec l'intelligence artificielle</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="p-6">
        {/* Zone de prompt */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Description de l'image souhaitée
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Décrivez l'image que vous voulez générer..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            rows={4}
            maxLength={500}
          />
          <div className="mt-1 text-xs text-gray-500 text-right">
            {prompt.length}/500 caractères
          </div>
        </div>

        {/* Exemples de prompts */}
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-900 mb-2">Idées d'inspiration :</p>
          <div className="flex flex-wrap gap-2">
            {examplePrompts.map((example, index) => (
              <button
                key={index}
                onClick={() => setPrompt(example)}
                className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        {/* Sélection du style */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Style de l'image
          </label>
          <div className="grid grid-cols-2 gap-3">
            {styles.map((s) => (
              <button
                key={s.value}
                onClick={() => setStyle(s.value as GeminiImageRequest['style'])}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  style === s.value
                    ? 'border-purple-500 bg-purple-50 text-purple-900'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <div className="font-medium">{s.label}</div>
                <div className="text-xs text-gray-500 mt-1">{s.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Bouton de génération */}
        <Button
          onClick={handleGenerate}
          disabled={!prompt.trim() || isGenerating}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-3"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Génération en cours...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4 mr-2" />
              Générer l'image
            </>
          )}
        </Button>

        {/* Message d'information */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-800">
              Les images sont générées par intelligence artificielle et peuvent nécessiter des ajustements.
              Le temps de génération peut varier de quelques secondes à une minute.
            </p>
          </div>
        </div>

        {/* Image générée */}
        {generatedImage && (
          <div className="mt-6 pt-6 border-t">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Image générée</h4>
            <div className="space-y-4">
              {/* Preview */}
              <div className="relative bg-gray-50 rounded-lg p-4">
                <img
                  src={generatedImage}
                  alt="Image générée par IA"
                  className="w-full max-h-64 object-contain mx-auto rounded-lg"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={handleUseImage}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  Utiliser cette image
                </Button>
                <Button
                  onClick={handleDownload}
                  variant="outline"
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger
                </Button>
              </div>

              {/* Description */}
              {description && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Description :</span> {description}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIImageGenerator;