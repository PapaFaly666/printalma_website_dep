import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { useToast } from '../ui/use-toast';
import vendorOnboardingService from '../../services/vendorOnboardingService';

interface OnboardingAlertProps {
  onClose?: () => void;
}

const OnboardingAlert: React.FC<OnboardingAlertProps> = ({ onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Vérifier le statut du profil
  const checkProfileStatus = async () => {
    try {
      const status = await vendorOnboardingService.getProfileStatus();

      console.log('📊 Statut du profil:', status);

      // Vérifier si le profil est vraiment complet
      // Le profil est incomplet si :
      // - profileCompleted est false OU
      // - phoneCount est 0 (pas de numéro de téléphone) OU
      // - hasProfileImage est false (pas de photo)
      const isIncomplete =
        !status.profileCompleted ||
        status.details.phoneCount === 0 ||
        !status.details.hasProfileImage;

      if (isIncomplete) {
        console.log('⚠️ Profil incomplet - Affichage de l\'alerte');
        setProfileIncomplete(true);
        setIsVisible(true);
      } else {
        console.log('✅ Profil complet - Pas d\'alerte');
        setProfileIncomplete(false);
        setIsVisible(false);
        // Nettoyer le localStorage si le profil est complet
        localStorage.removeItem('onboarding_skipped');
        localStorage.removeItem('onboarding_skipped_at');
      }
    } catch (error) {
      console.error('❌ Erreur vérification statut profil:', error);
    }
  };

  useEffect(() => {
    // Vérifier le statut immédiatement
    checkProfileStatus();

    // Configurer l'intervalle pour vérifier toutes les 1 minute (60000ms)
    const interval = setInterval(() => {
      checkProfileStatus();
    }, 60000); // 1 minute

    return () => clearInterval(interval);
  }, []);

  const handleClose = async () => {
    // Vérifier le statut avant de fermer
    try {
      const status = await vendorOnboardingService.getProfileStatus();

      const isIncomplete =
        !status.profileCompleted ||
        status.details.phoneCount === 0 ||
        !status.details.hasProfileImage;

      if (isIncomplete) {
        // Le profil est toujours incomplet, afficher un message
        toast({
          title: 'Profil incomplet',
          description: 'Veuillez compléter votre profil (au moins 1 numéro et une photo) avant de fermer cette alerte.',
          variant: 'destructive',
        });
        // Ne pas fermer l'alerte
        return;
      }

      // Le profil est complet, fermer l'alerte
      setIsVisible(false);
      if (onClose) onClose();
    } catch (error) {
      console.error('Erreur vérification:', error);
      // En cas d'erreur, ne pas fermer
      toast({
        title: 'Erreur',
        description: 'Impossible de vérifier le statut du profil.',
        variant: 'destructive',
      });
    }
  };

  const handleGoToOnboarding = () => {
    navigate('/vendeur/onboarding');
  };

  if (!isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 400, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 400, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-6 right-6 z-50 w-full max-w-sm"
        >
          <div className="relative bg-white rounded-lg shadow-lg border-2 border-black overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                {/* Contenu */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-black mb-2">
                    Profil incomplet
                  </h3>
                  <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                    Complétez vos informations pour booster votre visibilité et vos ventes !
                  </p>

                  {/* Bouton */}
                  <Button
                    onClick={handleGoToOnboarding}
                    size="sm"
                    className="w-full bg-black hover:bg-gray-800 text-white font-semibold transition-colors"
                  >
                    Compléter mon profil
                  </Button>
                </div>

                {/* Bouton fermer */}
                <button
                  onClick={handleClose}
                  className="flex-shrink-0 text-gray-500 hover:text-black transition-colors text-2xl leading-none font-light"
                  aria-label="Fermer"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OnboardingAlert;
