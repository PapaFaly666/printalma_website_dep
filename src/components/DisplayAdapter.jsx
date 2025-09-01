import React, { useState, useRef, useEffect } from 'react';

// Données factices pour les délimitations
const FAKE_DELIMITATIONS = [
  { id: 1, x: 20, y: 15, width: 30, height: 25, name: 'Zone Logo Principal' },
  { id: 2, x: 55, y: 40, width: 35, height: 20, name: 'Zone Texte Central' },
  { id: 3, x: 10, y: 70, width: 80, height: 15, name: 'Zone Slogan Bas' },
  { id: 4, x: 70, y: 10, width: 25, height: 15, name: 'Zone Marque' }
];

const DisplayAdapter = ({ 
  imageUrl = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=800&fit=crop',
  delimitations = FAKE_DELIMITATIONS 
}) => {
  const [selectedZone, setSelectedZone] = useState(null);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const containerRef = useRef(null);

  // Gestion du clic sur une zone
  const handleZoneClick = (delimitation) => {
    setSelectedZone(delimitation);
    alert(`Zone cliquée: ${delimitation.name}`);
  };

  // Gestion du survol des zones
  const handleZoneHover = (delimitation, isHovering) => {
    if (isHovering) {
      setSelectedZone(delimitation);
    } else {
      setSelectedZone(null);
    }
  };

  // Styles pour les zones de délimitation
  const getZoneStyle = (delimitation) => ({
    position: 'absolute',
    left: `${delimitation.x}%`,
    top: `${delimitation.y}%`,
    width: `${delimitation.width}%`,
    height: `${delimitation.height}%`,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    zIndex: 10
  });

  // Classes CSS pour les zones
  const getZoneClasses = (delimitation) => {
    const baseClasses = "border-2 border-dashed transition-all duration-300";
    const isSelected = selectedZone?.id === delimitation.id;
    
    if (isSelected) {
      return `${baseClasses} border-blue-500 bg-blue-200 bg-opacity-30`;
    }
    return `${baseClasses} border-red-400 bg-red-100 bg-opacity-20 hover:bg-red-200 hover:bg-opacity-40 hover:border-red-500`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      {/* Titre et informations */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Zones de délimitation interactive
        </h2>
        <p className="text-gray-600">
          Cliquez sur les zones délimitées pour voir les détails. 
          {delimitations.length} zone{delimitations.length > 1 ? 's' : ''} disponible{delimitations.length > 1 ? 's' : ''}.
        </p>
      </div>

      {/* Conteneur principal avec image et délimitations */}
      <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden shadow-lg">
        {/* Image principale */}
        <div 
          ref={containerRef}
          className="relative w-full max-w-[600px] mx-auto"
          style={{ aspectRatio: '3/4' }} // Ratio fixe pour éviter le jump
        >
          <img
            src={imageUrl}
            alt="Produit avec zones délimitées"
            className="w-full h-full object-cover"
            onLoad={() => setIsImageLoaded(true)}
            onError={(e) => {
              console.error('Erreur de chargement de l\'image:', e);
              e.target.src = 'https://via.placeholder.com/600x800/cccccc/666666?text=Image+non+disponible';
            }}
          />

          {/* Overlay pour assombrir l'image */}
          <div className="absolute inset-0 bg-black bg-opacity-10 pointer-events-none" />

          {/* Zones de délimitation */}
          {isImageLoaded && delimitations.map((delimitation) => (
            <div
              key={delimitation.id}
              style={getZoneStyle(delimitation)}
              className={getZoneClasses(delimitation)}
              onClick={() => handleZoneClick(delimitation)}
              onMouseEnter={() => handleZoneHover(delimitation, true)}
              onMouseLeave={() => handleZoneHover(delimitation, false)}
              title={delimitation.name}
            >
              {/* Étiquette de la zone */}
              <div className="absolute -top-6 left-0 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                {delimitation.name}
              </div>
              
              {/* Numéro de la zone */}
              <div className="absolute top-1 left-1 bg-white text-gray-900 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow">
                {delimitation.id}
              </div>
            </div>
          ))}

          {/* Indicateur de chargement */}
          {!isImageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
              <div className="text-gray-500">Chargement de l'image...</div>
            </div>
          )}
        </div>
      </div>

      {/* Panneau d'informations de la zone sélectionnée */}
      {selectedZone && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Zone sélectionnée</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium text-blue-800">Nom:</span>
              <div className="text-blue-600">{selectedZone.name}</div>
            </div>
            <div>
              <span className="font-medium text-blue-800">Position:</span>
              <div className="text-blue-600">{selectedZone.x}%, {selectedZone.y}%</div>
            </div>
            <div>
              <span className="font-medium text-blue-800">Taille:</span>
              <div className="text-blue-600">{selectedZone.width}% × {selectedZone.height}%</div>
            </div>
            <div>
              <span className="font-medium text-blue-800">ID:</span>
              <div className="text-blue-600">#{selectedZone.id}</div>
            </div>
          </div>
        </div>
      )}

      {/* Liste des zones */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Zones disponibles ({delimitations.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {delimitations.map((delimitation) => (
            <div
              key={delimitation.id}
              className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                selectedZone?.id === delimitation.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-400'
              }`}
              onClick={() => handleZoneClick(delimitation)}
              onMouseEnter={() => handleZoneHover(delimitation, true)}
              onMouseLeave={() => handleZoneHover(delimitation, false)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">
                    #{delimitation.id} - {delimitation.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    Position: {delimitation.x}%, {delimitation.y}% | 
                    Taille: {delimitation.width}% × {delimitation.height}%
                  </div>
                </div>
                <div className="text-gray-400">
                  👆
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Informations techniques */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Informations techniques</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <div>• Les zones sont positionnées en pourcentages pour être responsive</div>
          <div>• Le conteneur s'adapte automatiquement à la taille de l'écran (max 600px)</div>
          <div>• Cliquez ou survolez les zones pour interagir</div>
          <div>• L'image garde son ratio d'aspect même lors du redimensionnement</div>
        </div>
      </div>
    </div>
  );
};

export default DisplayAdapter; 