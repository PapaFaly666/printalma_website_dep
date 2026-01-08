import React from 'react';
import { useVendorProfile } from '../hooks/useVendorProfile';
import Button from './ui/Button';
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle, Info, User, Globe } from 'lucide-react';

interface ProfileCompletionBannerProps {
  onComplete?: () => void;
  onCompleteLater?: () => void;
}

export const ProfileCompletionBanner: React.FC<ProfileCompletionBannerProps> = ({
  onComplete,
  onCompleteLater
}) => {
  const { profileStatus, loading } = useVendorProfile();

  const handleCompleteLater = () => {
    // ❌ NE PAS appeler completeFirstLogin() ici !
    // La bannière doit revenir à chaque connexion tant que le profil n'est pas complet
    onCompleteLater?.();
  };

  if (loading || !profileStatus) {
    return null; // Pas d'animation de chargement, simplement ne rien afficher
  }

  // 🔄 Afficher la bannière tant que le profil n'est PAS complet (à chaque connexion)
  // Comportement comme dans les apps modernes (Instagram, LinkedIn, etc.)
  if (profileStatus.isProfileComplete) {
    return null;
  }

  // 📊 Log de débogage pour voir ce que l'API retourne
  console.log('🔍 [ProfileCompletionBanner] Statut du profil:', {
    isProfileComplete: profileStatus.isProfileComplete,
    isFirstLogin: profileStatus.isFirstLogin,
    missingItems: profileStatus.missingItems,
    profile: profileStatus.profile
  });

  const getMissingItemIcon = (item: string) => {
    if (item.toLowerCase().includes('biographie')) {
      return <User className="h-4 w-4" />;
    }
    if (item.toLowerCase().includes('réseau')) {
      return <Globe className="h-4 w-4" />;
    }
    return <Info className="h-4 w-4" />;
  };

  return (
    <Alert className="mb-6 border-blue-200 bg-blue-50">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <Info className="h-5 w-5 text-blue-600" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-semibold text-blue-900 mb-2">
            ⚠️ Profil incomplet - Complétez-le pour augmenter votre visibilité !
          </div>

          <AlertDescription className="text-blue-800 mb-3">
            Les clients recherchent des vendeurs avec un profil complet. Il vous manque :
          </AlertDescription>

          {profileStatus.missingItems.length > 0 && (
            <div className="space-y-2 mb-4">
              {profileStatus.missingItems.map((item, index) => (
                <div key={index} className="flex items-center gap-2 text-sm font-medium text-red-700 bg-red-50 px-3 py-2 rounded-md">
                  <div className="text-red-600">
                    {getMissingItemIcon(item)}
                  </div>
                  <span>• {item}</span>
                </div>
              ))}
            </div>
          )}

          <div className="text-xs text-blue-600 mb-3">
            💡 Un profil complet augmente vos chances d'être découvert de 3x !
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={onComplete}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              Compléter mon profil
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleCompleteLater}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              Plus tard
            </Button>
          </div>
        </div>

        <div className="flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCompleteLater}
            className="text-blue-600 hover:bg-blue-50 h-8 w-8 p-0"
          >
            ×
          </Button>
        </div>
      </div>
    </Alert>
  );
};

// Composant pour le profil déjà complet
export const ProfileCompleteBadge: React.FC = () => {
  const { profileStatus, loading } = useVendorProfile();

  if (loading || !profileStatus || !profileStatus.isProfileComplete) {
    return null;
  }

  return (
    <Alert className="mb-4 border-green-200 bg-green-50">
      <div className="flex items-center gap-2">
        <CheckCircle className="h-5 w-5 text-green-600" />
        <span className="text-green-800 font-medium">
           Votre profil est complet ! Vous avez plus de chances d'être remarqué par les clients.
        </span>
      </div>
    </Alert>
  );
};