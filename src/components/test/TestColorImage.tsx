import React from 'react';

export const TestColorImage = () => {
  const testImageUrl = "https://res.cloudinary.com/dsxab4qnu/image/upload/v1748261572/colors/1748261571264-custom_color_0.jpg";
  
  return (
    <div className="p-4 border border-gray-300 rounded-lg bg-white shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Test Image Couleur</h3>
      
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600 mb-2">URL de test :</p>
          <p className="text-xs font-mono bg-gray-100 p-2 rounded break-all">
            {testImageUrl}
          </p>
        </div>
        
        <div>
          <p className="text-sm text-gray-600 mb-2">Aperçu de l'image :</p>
          <div className="flex items-center gap-4">
            {/* Version petite */}
            <div className="text-center">
              <img 
                src={testImageUrl}
                alt="Test couleur - petite"
                className="w-8 h-8 object-cover rounded border-2 border-gray-300"
                onError={(e) => {
                  console.error('❌ Erreur chargement image (petite):', testImageUrl);
                  e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="red"><text y="20" font-size="16">✗</text></svg>';
                }}
                onLoad={() => {
                  console.log('✅ Image chargée (petite):', testImageUrl);
                }}
              />
              <p className="text-xs mt-1">8x8</p>
            </div>
            
            {/* Version moyenne */}
            <div className="text-center">
              <img 
                src={testImageUrl}
                alt="Test couleur - moyenne"
                className="w-16 h-16 object-cover rounded border-2 border-gray-300"
                onError={(e) => {
                  console.error('❌ Erreur chargement image (moyenne):', testImageUrl);
                  e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="red"><text y="32" font-size="24">✗</text></svg>';
                }}
                onLoad={() => {
                  console.log('✅ Image chargée (moyenne):', testImageUrl);
                }}
              />
              <p className="text-xs mt-1">16x16</p>
            </div>
            
            {/* Version grande */}
            <div className="text-center">
              <img 
                src={testImageUrl}
                alt="Test couleur - grande"
                className="w-24 h-24 object-cover rounded border-2 border-gray-300"
                onError={(e) => {
                  console.error('❌ Erreur chargement image (grande):', testImageUrl);
                  e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" fill="red"><text y="48" font-size="32">✗</text></svg>';
                }}
                onLoad={() => {
                  console.log('✅ Image chargée (grande):', testImageUrl);
                }}
              />
              <p className="text-xs mt-1">24x24</p>
            </div>
          </div>
        </div>
        
        <div className="text-xs text-gray-500">
          Vérifiez la console pour les logs de chargement
        </div>
      </div>
    </div>
  );
}; 