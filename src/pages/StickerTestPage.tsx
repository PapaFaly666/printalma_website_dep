import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { BORDER_OPTIONS, STICKER_TYPE_OPTIONS, type StickerType, type BorderColor } from '../utils/stickerFilters';
import Button from '../components/ui/Button';

/**
 * Page de test pour les stickers
 *
 * ✅ SYNCHRONISATION BACKEND/FRONTEND :
 *
 * Cette page de test affiche les informations sur les configurations possibles
 * pour les stickers. Les effets sont maintenant générés côté serveur.
 *
 * Pour tester visuellement les effets, utilisez l'aperçu dans le flux de création
 * de sticker qui affiche l'image générée par le backend.
 */
const StickerTestPage: React.FC = () => {
  const navigate = useNavigate();

  // Configuration (pour affichage des options)
  const [stickerType, setStickerType] = useState<StickerType>('autocollant');
  const [borderColor, setBorderColor] = useState<BorderColor>('glossy-white');

  // Design de test
  const testDesignUrl = 'https://res.cloudinary.com/dsxab4qnu/raw/upload/v1766578630/vendor-designs/vendor_3_design_1766578606404.svg';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Test Stickers</h1>
              <p className="text-sm text-gray-600">Configuration et options des stickers</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Panneau de contrôle */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border p-6 space-y-6">
              <h2 className="text-lg font-bold text-gray-900">Configuration</h2>

              {/* Type de sticker */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Type de sticker
                </label>
                <div className="space-y-2">
                  {STICKER_TYPE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setStickerType(option.value)}
                      className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                        stickerType === option.value
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-semibold text-gray-900">{option.label}</div>
                      <div className="text-sm text-gray-600">{option.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Couleur de bordure */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Couleur de bordure
                </label>
                <div className="space-y-2">
                  {BORDER_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setBorderColor(option.value)}
                      className={`w-full p-3 border-2 rounded-lg text-left transition-all ${
                        borderColor === option.value
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded border-2 border-gray-300"
                          style={{ backgroundColor: option.preview }}
                        />
                        <div>
                          <div className="font-semibold text-gray-900 text-sm">{option.label}</div>
                          <div className="text-xs text-gray-600">{option.description}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Informations sur l'architecture */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h4 className="font-semibold text-green-900 mb-2">Architecture Backend/Frontend</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>✅ Effets générés côté serveur (Sharp)</li>
                  <li>✅ Plus de filtres CSS destructeurs</li>
                  <li>✅ Performance optimale client</li>
                  <li>✅ Images PNG haute qualité</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Zone d'aperçu */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Aperçu</h2>

              {/* Aperçu du design original */}
              <div className="relative">
                {/* Damier de fond */}
                <div
                  className="absolute inset-0 rounded-lg"
                  style={{
                    backgroundImage: `
                      linear-gradient(45deg, #e5e7eb 25%, transparent 25%),
                      linear-gradient(-45deg, #e5e7eb 25%, transparent 25%),
                      linear-gradient(45deg, transparent 75%, #e5e7eb 75%),
                      linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)
                    `,
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                  }}
                />

                {/* Zone de test sur fond gris clair */}
                <div className="relative bg-gray-200 rounded-lg p-12 min-h-[500px] flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <img
                      src={testDesignUrl}
                      alt="Design original"
                      className="max-w-xs mx-auto"
                    />
                    <p className="text-sm text-gray-600">
                      Design original (sans effets)
                    </p>
                    <p className="text-xs text-gray-500">
                      Les effets sont appliqués lors de la création du sticker par le backend
                    </p>
                  </div>
                </div>
              </div>

              {/* Informations */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">Configuration actuelle:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li><strong>Type:</strong> {stickerType}</li>
                  <li><strong>Bordure:</strong> {borderColor}</li>
                  <li><strong>URL design:</strong> {testDesignUrl}</li>
                </ul>
              </div>

              {/* Note importante */}
              <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h4 className="font-semibold text-yellow-900 mb-2">Note</h4>
                <p className="text-sm text-yellow-800">
                  Pour tester visuellement les effets avec bordures, ombres et couleurs,
                  utilisez le flux de création de sticker dans l'interface vendeur.
                  L'aperçu affichera l'image générée par le backend avec tous les effets appliqués.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StickerTestPage;
