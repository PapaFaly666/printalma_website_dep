import React, { useState } from 'react';
import { InteractiveDelimitationCanvas } from '../product-form/InteractiveDelimitationCanvas';
import Button from '../ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Save, Upload, Image as ImageIcon, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface DelimitationData {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export const DelimitationExample: React.FC = () => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [savedDelimitation, setSavedDelimitation] = useState<DelimitationData | null>(null);
  const [currentDelimitation, setCurrentDelimitation] = useState<DelimitationData | null>(null);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [saveCount, setSaveCount] = useState<number>(0);

  // Exemples d'images pour les tests
  const exampleImages = [
    {
      url: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&h=600&fit=crop',
      name: 'T-Shirt Blanc'
    },
    {
      url: 'https://images.unsplash.com/photo-1583743814966-8936f37f804c?w=800&h=600&fit=crop',
      name: 'Sweatshirt Gris'
    },
    {
      url: 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&h=600&fit=crop',
      name: 'Mug Blanc'
    }
  ];

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      setSavedDelimitation(null);
      setCurrentDelimitation(null);
      setLastSaveTime(null);
      setSaveCount(0);
      toast.success('Image chargée avec succès');
    }
  };

  const handleDelimitationSave = async (delimitation: DelimitationData): Promise<boolean> => {
    console.log('🎯 APPEL PARENT: handleDelimitationSave', delimitation);
    const currentSaveAttempt = saveCount + 1;
    
    // --- SIMULATION D'APPEL API ---
    console.log(`⏳ Simulation d'un appel API pour la sauvegarde #${currentSaveAttempt}...`);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simule une latence réseau de 1s

    // Décommentez la ligne ci-dessous pour tester le cas d'échec
    // const shouldFail = true;
    const shouldFail = false;

    if (shouldFail) {
        console.error(`❌ Simulation d'un échec API pour la sauvegarde #${currentSaveAttempt}.`);
        toast.error(`Échec simulé de la sauvegarde #${currentSaveAttempt}`, {
            description: "C'est un test. Le bouton de sauvegarde doit rester visible.",
        });
        return false; // Indique l'échec au composant enfant
    }

    // Si la sauvegarde réussit
    setSaveCount(prev => prev + 1);
    setSavedDelimitation(delimitation);
    setLastSaveTime(new Date());

    toast.success(`Sauvegarde #${currentSaveAttempt} réussie !`, {
        description: `Zone de ${delimitation.width}x${delimitation.height}px enregistrée. Vous pouvez la modifier à nouveau.`,
    });

    return true; // Indique le succès au composant enfant
  };

  const handleDelimitationChange = (delimitation: DelimitationData | null) => {
    setCurrentDelimitation(delimitation);
  };

  const selectExampleImage = (url: string, name: string) => {
    setImageUrl(url);
    setSavedDelimitation(null);
    setCurrentDelimitation(null);
    setLastSaveTime(null);
    setSaveCount(0); // Réinitialiser le compteur pour une nouvelle image
    toast.success(`Image "${name}" sélectionnée`);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Délimitation Interactive - Cycle Robuste</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Testez le <strong>cycle répétable</strong> : Modifiez → Sauvegardez → Modifiez → Sauvegardez autant de fois que vous voulez. 
          Parfait pour un backend qui doit recevoir plusieurs mises à jour !
        </p>
        
        {/* Compteur de sauvegardes */}
        {saveCount > 0 && (
          <div className="inline-flex items-center gap-2 bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-full text-sm border border-green-200 dark:border-green-700">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-green-700 dark:text-green-300 font-medium">
              {saveCount} sauvegarde{saveCount > 1 ? 's' : ''} réussie{saveCount > 1 ? 's' : ''}
            </span>
          </div>
        )}
        
        {/* Indicateur de test */}
        <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-full text-sm">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          <span className="text-blue-700 dark:text-blue-300">
            Mode test : Ouvrez la console pour voir les logs détaillés
          </span>
        </div>
      </div>

      {/* Sélection d'image */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Sélection d'image
          </CardTitle>
          <CardDescription>
            Choisissez une image pour commencer la délimitation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload d'image */}
          <div className="flex items-center gap-4">
            <Button variant="outline" className="relative overflow-hidden">
              <Upload className="h-4 w-4 mr-2" />
              Uploader une image
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </Button>
            <span className="text-sm text-gray-500">ou choisissez un exemple :</span>
          </div>

          {/* Images d'exemple */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {exampleImages.map((image, index) => (
              <div key={index} className="relative group cursor-pointer" onClick={() => selectExampleImage(image.url, image.name)}>
                <img
                  src={image.url}
                  alt={image.name}
                  className="w-full h-32 object-cover rounded-lg border-2 border-transparent group-hover:border-blue-500 transition-colors"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <span className="text-white font-medium">{image.name}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Canvas de délimitation */}
      {imageUrl && (
        <Card>
          <CardHeader>
            <CardTitle>Zone de délimitation</CardTitle>
            <CardDescription>
              <strong>Test du cycle répétable :</strong><br/>
              1. Tracez une zone → Bouton apparaît<br/>
              2. Cliquez "Sauvegarder" → Bouton disparaît<br/>
              3. Déplacez/redimensionnez → Bouton réapparaît<br/>
              4. Répétez autant de fois que souhaité !
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InteractiveDelimitationCanvas
              imageUrl={imageUrl}
              onDelimitationSave={handleDelimitationSave}
              onDelimitationChange={handleDelimitationChange}
              className="w-full"
            />
          </CardContent>
        </Card>
      )}

      {/* Informations sur la délimitation */}
      {(currentDelimitation || savedDelimitation) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Délimitation actuelle */}
          {currentDelimitation && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse" />
                  Coordonnées en temps réel
                </CardTitle>
                <CardDescription>
                  Ces données sont prêtes à être sauvegardées.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Position X:</span>
                    <div className="font-mono font-medium">{currentDelimitation.x}px</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Position Y:</span>
                    <div className="font-mono font-medium">{currentDelimitation.y}px</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Largeur:</span>
                    <div className="font-mono font-medium">{currentDelimitation.width}px</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Hauteur:</span>
                    <div className="font-mono font-medium">{currentDelimitation.height}px</div>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <span className="text-gray-500 text-sm">Superficie:</span>
                  <div className="font-mono font-medium text-lg">
                    {(currentDelimitation.width * currentDelimitation.height).toLocaleString()}px²
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Délimitation sauvegardée */}
          {savedDelimitation && (
            <Card className="border-green-200 dark:border-green-700 bg-green-50/50 dark:bg-green-900/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                  <CheckCircle className="h-5 w-5" />
                  Dernière sauvegarde réussie
                </CardTitle>
                <CardDescription>
                  Ces données sont persistées (côté client).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Position X:</span>
                    <div className="font-mono font-medium">{savedDelimitation.x}px</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Position Y:</span>
                    <div className="font-mono font-medium">{savedDelimitation.y}px</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Largeur:</span>
                    <div className="font-mono font-medium">{savedDelimitation.width}px</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Hauteur:</span>
                    <div className="font-mono font-medium">{savedDelimitation.height}px</div>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <span className="text-gray-500 text-sm">Superficie:</span>
                  <div className="font-mono font-medium text-lg">
                    {(savedDelimitation.width * savedDelimitation.height).toLocaleString()}px²
                  </div>
                </div>
                {lastSaveTime && (
                  <Badge variant="secondary" className="mt-2 font-normal">
                    Sauvegarde #{saveCount} • {lastSaveTime.toLocaleTimeString()}
                  </Badge>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Guide d'utilisation */}
      <Card>
        <CardHeader>
          <CardTitle>Guide d'utilisation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold">Cycle de sauvegarde robuste</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• <strong>Modification</strong> → Bouton vert apparaît</li>
                <li>• <strong>Sauvegarde</strong> → Bouton disparaît + état réinitialisé</li>
                <li>• <strong>Nouvelle modification</strong> → Bouton réapparaît</li>
                <li>• <strong>Cycle répétable</strong> → Autant de fois que nécessaire</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold">Intégration Backend</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Chaque sauvegarde = 1 appel API distinct</li>
                <li>• Gestion d'erreurs robuste avec retry possible</li>
                <li>• Compteur pour suivre le nombre de sauvegardes</li>
                <li>• Logs détaillés pour debugging</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 