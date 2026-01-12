import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import SynchronizedStickerPreview from '../components/SynchronizedStickerPreview';
import { generateStickerFilters, getStickerStyle, BORDER_OPTIONS, STICKER_TYPE_OPTIONS, STICKER_SIZES, type StickerType, type BorderColor } from '../utils/stickerFilters';
import Button from '../components/ui/Button';

/**
 * Page de test pour les filtres CSS de stickers
 * Permet de tester visuellement les différents types et configurations
 */
const StickerTestPage: React.FC = () => {
  const navigate = useNavigate();

  // Configuration
  const [stickerType, setStickerType] = useState<StickerType>('autocollant');
  const [borderColor, setBorderColor] = useState<BorderColor>('glossy-white');
  const [showGrid, setShowGrid] = useState(true);

  // Design de test (une image simple avec transparence)
  const testDesignUrl = 'https://res.cloudinary.com/dsxab4qnu/raw/upload/v1766578630/vendor-designs/vendor_3_design_1766578606404.svg';

  const previewStyle = getStickerStyle(stickerType, borderColor);

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
              <h1 className="text-xl font-bold text-gray-900">Test Stickers CSS</h1>
              <p className="text-sm text-gray-600">Test des filtres CSS synchronisés avec Sharp</p>
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

              {/* Options */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showGrid}
                    onChange={(e) => setShowGrid(e.target.checked)}
                    className="w-4 h-4 text-primary rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Afficher la grille</span>
                </label>
              </div>

              {/* Code CSS généré */}
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="text-xs text-gray-400 mb-2">Filtres CSS générés:</div>
                <code className="text-xs text-green-400 break-all font-mono">
                  {previewStyle.filter}
                </code>
              </div>
            </div>
          </div>

          {/* Zone d'aperçu */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Aperçu</h2>

              {/* Fond avec damier pour voir la transparence */}
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
                  <SynchronizedStickerPreview
                    designUrl={testDesignUrl}
                    stickerType={stickerType}
                    borderColor={borderColor}
                    size="83 mm x 100 mm"
                    showGrid={showGrid}
                    alt="Test sticker"
                    className="max-w-sm"
                  />
                </div>
              </div>

              {/* Comparaison sans composant */}
              <div className="mt-8 pt-8 border-t">
                <h3 className="text-md font-bold text-gray-900 mb-4">Test direct (sans composant)</h3>
                <div className="bg-gray-200 rounded-lg p-12 flex items-center justify-center">
                  <img
                    src={testDesignUrl}
                    alt="Test direct"
                    style={previewStyle}
                    className="max-w-sm"
                  />
                </div>
              </div>

              {/* Informations */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">Configuration actuelle:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li><strong>Type:</strong> {stickerType}</li>
                  <li><strong>Bordure:</strong> {borderColor}</li>
                  <li><strong>Grille:</strong> {showGrid ? 'Oui' : 'Non'}</li>
                  <li><strong>URL design:</strong> {testDesignUrl}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StickerTestPage;
