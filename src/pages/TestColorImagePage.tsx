import React from 'react';
import { TestColorImage } from '../components/test/TestColorImage';
import { ColorDisplay } from '../components/common/ColorDisplay';

export const TestColorImagePage = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Test des Images de Couleur</h1>
        
        <div className="space-y-8">
          {/* Test avec l'URL réelle */}
          <TestColorImage />
          
          {/* Test avec le composant ColorDisplay */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-300">
            <h3 className="text-lg font-semibold mb-4">Test ColorDisplay Component</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Taille small :</p>
                <ColorDisplay 
                  colorName="white"
                  colorHexCode="#ffffff"
                  colorImageUrl="https://res.cloudinary.com/dsxab4qnu/image/upload/v1748261572/colors/1748261571264-custom_color_0.jpg"
                  size="sm"
                />
              </div>
              
              <div>
                <p className="text-sm text-gray-600 mb-2">Taille medium :</p>
                <ColorDisplay 
                  colorName="white"
                  colorHexCode="#ffffff"
                  colorImageUrl="https://res.cloudinary.com/dsxab4qnu/image/upload/v1748261572/colors/1748261571264-custom_color_0.jpg"
                  size="md"
                />
              </div>
              
              <div>
                <p className="text-sm text-gray-600 mb-2">Taille large :</p>
                <ColorDisplay 
                  colorName="white"
                  colorHexCode="#ffffff"
                  colorImageUrl="https://res.cloudinary.com/dsxab4qnu/image/upload/v1748261572/colors/1748261571264-custom_color_0.jpg"
                  size="lg"
                />
              </div>
              
              <div>
                <p className="text-sm text-gray-600 mb-2">Sans image (fallback) :</p>
                <ColorDisplay 
                  colorName="blue"
                  colorHexCode="#0066CC"
                  size="lg"
                />
              </div>
              
              <div>
                <p className="text-sm text-gray-600 mb-2">Avec image cassée (test d'erreur) :</p>
                <ColorDisplay 
                  colorName="red"
                  colorHexCode="#FF0000"
                  colorImageUrl="https://example.com/broken-image.jpg"
                  size="lg"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 