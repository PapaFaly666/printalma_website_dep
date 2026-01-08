import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { VendorsList } from '../components/VendorsList';
import { Card, CardContent } from '../components/ui/card';
import Button from '../components/ui/Button';
import { Badge } from '../components/ui/badge';
import { 
  Users, 
  Eye,
  EyeOff,
  LayoutGrid,
  LayoutList
} from 'lucide-react';

const VendorsCommunity: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [showStats, setShowStats] = useState(true);
  const [compactView, setCompactView] = useState(false);

  // Vérifier si l'utilisateur est connecté
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-8">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Connexion requise
            </h2>
            <p className="text-gray-600 mb-4">
              Vous devez être connecté pour voir la communauté des vendeurs.
            </p>
            <Button 
              onClick={() => window.location.href = '/login'}
              className="bg-black hover:bg-gray-800 text-white"
            >
              Se connecter
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full">
        {/* Header moderne */}
        <div className="bg-white border-b border-gray-200">
          <div className="w-full px-8 py-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Communauté
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Découvrez les vendeurs de la plateforme
                  </p>
                </div>
                
                {user && (
                  <div className="flex items-center gap-3 ml-8">
                    <Badge variant="outline" className="bg-gray-50 border-gray-300">
                      {user.firstName} {user.lastName}
                    </Badge>
                    <Badge className="bg-black text-white">
                      {user.vendeur_type ? `${user.vendeur_type} ${user.vendeur_type === 'DESIGNER' ? '🎨' : user.vendeur_type === 'INFLUENCEUR' ? '📱' : '🎭'}` : user.role}
                    </Badge>
                  </div>
                )}
              </div>
              
              {/* Contrôles d'affichage */}
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowStats(!showStats)}
                  className="border-gray-300 hover:bg-gray-50"
                >
                  {showStats ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                  {showStats ? 'Masquer stats' : 'Afficher stats'}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCompactView(!compactView)}
                  className="border-gray-300 hover:bg-gray-50"
                >
                  {compactView ? <LayoutGrid className="w-4 h-4 mr-2" /> : <LayoutList className="w-4 h-4 mr-2" />}
                  {compactView ? 'Vue étendue' : 'Vue compacte'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="w-full px-8 py-8">
          <VendorsList showStats={showStats} compact={compactView} />
        </div>
      </div>
    </div>
  );
};

export default VendorsCommunity; 