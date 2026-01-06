import React, { useState, useEffect, useRef } from 'react';
import { Upload, X, Info } from 'lucide-react';

interface StickerPreviewProps {
  imageUrl?: string;
  stickerType: 'contour' | 'bumper';
  onImageUpload?: (file: File) => void;
  className?: string;
}

/**
 * Composant pour prévisualiser les stickers avec gestion des contours
 * - Type "contour": Suit la forme du PNG avec transparence (contour blanc optionnel)
 * - Type "bumper": Format rectangulaire standard pour pare-chocs
 */
const StickerPreview: React.FC<StickerPreviewProps> = ({
  imageUrl,
  stickerType,
  onImageUpload,
  className = ''
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(imageUrl || null);
  const [showWhiteBorder, setShowWhiteBorder] = useState(true);
  const [borderWidth, setBorderWidth] = useState(3);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Générer l'aperçu du sticker avec contour
  useEffect(() => {
    if (!previewUrl || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      // Définir la taille du canvas
      canvas.width = img.width;
      canvas.height = img.height;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (stickerType === 'bumper') {
        // Sticker pare-chocs : rectangulaire avec coins arrondis
        const cornerRadius = 10;

        // Dessiner le fond blanc
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.moveTo(cornerRadius, 0);
        ctx.lineTo(canvas.width - cornerRadius, 0);
        ctx.quadraticCurveTo(canvas.width, 0, canvas.width, cornerRadius);
        ctx.lineTo(canvas.width, canvas.height - cornerRadius);
        ctx.quadraticCurveTo(canvas.width, canvas.height, canvas.width - cornerRadius, canvas.height);
        ctx.lineTo(cornerRadius, canvas.height);
        ctx.quadraticCurveTo(0, canvas.height, 0, canvas.height - cornerRadius);
        ctx.lineTo(0, cornerRadius);
        ctx.quadraticCurveTo(0, 0, cornerRadius, 0);
        ctx.closePath();
        ctx.fill();

        // Dessiner l'image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Bordure
        if (showWhiteBorder) {
          ctx.strokeStyle = 'white';
          ctx.lineWidth = borderWidth;
          ctx.stroke();
        }
      } else {
        // Autocollant avec contour : suivre la forme du PNG

        // D'abord dessiner l'image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        if (showWhiteBorder) {
          // Créer un contour blanc autour des pixels non-transparents
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          // Créer un nouveau canvas temporaire pour le contour
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = canvas.width;
          tempCanvas.height = canvas.height;
          const tempCtx = tempCanvas.getContext('2d');
          if (!tempCtx) return;

          // Copier l'image originale
          tempCtx.drawImage(canvas, 0, 0);

          // Dessiner le contour blanc
          ctx.strokeStyle = 'white';
          ctx.lineWidth = borderWidth;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          // Parcourir les pixels pour détecter les bords
          for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
              const idx = (y * canvas.width + x) * 4;
              const alpha = data[idx + 3];

              // Si le pixel est opaque
              if (alpha > 128) {
                // Vérifier les pixels voisins
                let isBorder = false;

                // Vérifier les 8 directions
                for (let dy = -1; dy <= 1; dy++) {
                  for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;

                    const nx = x + dx;
                    const ny = y + dy;

                    if (nx < 0 || nx >= canvas.width || ny < 0 || ny >= canvas.height) {
                      isBorder = true;
                      break;
                    }

                    const nIdx = (ny * canvas.width + nx) * 4;
                    const nAlpha = data[nIdx + 3];

                    if (nAlpha < 128) {
                      isBorder = true;
                      break;
                    }
                  }
                  if (isBorder) break;
                }

                // Dessiner un point de contour
                if (isBorder) {
                  ctx.fillStyle = 'white';
                  ctx.fillRect(x - borderWidth / 2, y - borderWidth / 2, borderWidth, borderWidth);
                }
              }
            }
          }

          // Re-dessiner l'image par-dessus le contour
          ctx.drawImage(tempCanvas, 0, 0);
        }
      }
    };

    img.onerror = () => {
      console.error('Erreur de chargement de l\'image');
    };

    img.src = previewUrl;
  }, [previewUrl, stickerType, showWhiteBorder, borderWidth]);

  // Gérer l'upload de fichier
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Vérifier que c'est un PNG
    if (!file.type.includes('png')) {
      alert('Veuillez uploader un fichier PNG pour préserver la transparence');
      return;
    }

    // Créer l'URL de prévisualisation
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Callback pour le parent
    if (onImageUpload) {
      onImageUpload(file);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Info sur le type de sticker */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            {stickerType === 'contour' ? (
              <>
                <p className="font-semibold mb-1">Autocollant avec contour découpé</p>
                <p>L'autocollant suivra la forme de votre image PNG. Les zones transparentes seront découpées. Un contour blanc peut être ajouté pour plus de contraste.</p>
              </>
            ) : (
              <>
                <p className="font-semibold mb-1">Sticker pare-chocs</p>
                <p>Format rectangulaire standard avec coins arrondis, parfait pour les pare-chocs. L'image sera imprimée sur fond blanc.</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Zone d'upload */}
      {!previewUrl && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 mb-2">Cliquez pour uploader une image PNG</p>
          <p className="text-sm text-gray-500">Format PNG recommandé pour la transparence</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".png,image/png"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}

      {/* Aperçu du sticker */}
      {previewUrl && (
        <div className="space-y-4">
          <div className="relative bg-gray-100 rounded-lg p-8 flex items-center justify-center min-h-[300px]">
            {/* Canvas pour le rendu du sticker */}
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-[400px] object-contain"
              style={{
                filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'
              }}
            />

            {/* Bouton pour supprimer */}
            <button
              onClick={handleRemoveImage}
              className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Contrôles */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showWhiteBorder}
                  onChange={(e) => setShowWhiteBorder(e.target.checked)}
                  className="w-4 h-4 text-primary rounded"
                />
                <span className="text-sm font-medium text-gray-700">Contour blanc</span>
              </label>
            </div>

            {showWhiteBorder && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 block">
                  Épaisseur du contour: {borderWidth}px
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={borderWidth}
                  onChange={(e) => setBorderWidth(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2 px-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Changer l'image
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,image/png"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default StickerPreview;
