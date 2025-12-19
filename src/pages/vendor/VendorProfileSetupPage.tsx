import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVendorProfile } from '../../hooks/useVendorProfile';
import { VendorProfileForm } from '../../components/VendorProfileForm';
import { ProfileCompleteBadge } from '../../components/ProfileCompletionBanner';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { ArrowRight, Store, TrendingUp, Users, Star, Target, Award, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export const VendorProfileSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { profileStatus, completeFirstLogin, loading } = useVendorProfile();
  const [profileSaved, setProfileSaved] = useState(false);

  const handleCompleteProfile = async () => {
    try {
      // Marquer la première connexion comme terminée
      if (profileStatus?.isFirstLogin) {
        await completeFirstLogin();
      }
      setProfileSaved(true);
      toast.success('Profil enregistré avec succès !');

      // Rediriger vers le dashboard après 2 secondes
      setTimeout(() => {
        navigate('/vendeur/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleSkipForNow = async () => {
    try {
      if (profileStatus?.isFirstLogin) {
        await completeFirstLogin();
      }
      toast.info('Vous pourrez compléter votre profil plus tard');
      navigate('/vendeur/dashboard');
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Chargement de votre profil...</p>
        </motion.div>
      </div>
    );
  }

  // Si le profil est déjà complet, rediriger vers le dashboard
  if (profileStatus?.isProfileComplete || profileSaved) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="max-w-md w-full shadow-lg">
            <CardContent className="text-center py-12">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle className="h-10 w-10 text-white" />
              </motion.div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Profil configuré avec succès !
              </h2>
              <p className="text-gray-600 mb-6 text-lg">
                Redirection vers votre tableau de bord...
              </p>
              <div className="animate-pulse">
                <div className="h-2 bg-gray-900 rounded-full w-48 mx-auto"></div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white border-b"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-900 rounded-lg">
                <Store className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  PrintAlma Vendeur
                </h1>
                <p className="text-sm text-gray-500">Complétez votre profil professionnel</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleSkipForNow}
              className="hover:bg-gray-50"
            >
              Plus tard
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Colonne de gauche - Formulaire */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Carte d'introduction */}
            <Card className="shadow-lg border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gray-900 rounded-lg">
                    <Store className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Créez votre identité de vendeur
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Un profil complet vous permet d'être mieux référencé et de gagner la confiance des clients.
                      Partagez votre histoire et vos réseaux sociaux pour vous démarquer !
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Formulaire */}
            <VendorProfileForm onSave={handleCompleteProfile} />

            {/* Actions */}
            <Card className="shadow-lg border-gray-200">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={handleSkipForNow}
                    className="w-full sm:w-auto"
                  >
                    Compléter plus tard
                  </Button>
                  <Button
                    onClick={handleCompleteProfile}
                    className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 text-white"
                  >
                    Accéder à mon dashboard
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Colonne de droite - Bénéfices */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {profileStatus && <ProfileCompleteBadge />}

            {/* Pourquoi compléter */}
            <Card className="shadow-lg border-gray-200 overflow-hidden">
              <div className="bg-gray-900 p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <Target className="h-6 w-6" />
                  <CardTitle className="text-white text-xl">
                    Pourquoi compléter ?
                  </CardTitle>
                </div>
                <p className="text-gray-300 text-sm">
                  Maximisez votre visibilité et vos ventes
                </p>
              </div>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 hover:border-gray-900 transition-colors">
                  <div className="p-2 bg-gray-900 rounded-lg">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Attirez plus de clients</h3>
                    <p className="text-sm text-gray-600">
                      Les profils complets reçoivent plus de visites
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 hover:border-gray-900 transition-colors">
                  <div className="p-2 bg-gray-900 rounded-lg">
                    <Award className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Gagnez en crédibilité</h3>
                    <p className="text-sm text-gray-600">
                      Montrez votre expertise et votre passion à travers votre biographie
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 hover:border-gray-900 transition-colors">
                  <div className="p-2 bg-gray-900 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Boostez vos ventes</h3>
                    <p className="text-sm text-gray-600">
                      Les clients achètent davantage auprès de vendeurs vérifiés
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statut actuel */}
            {profileStatus && (
              <Card className="shadow-lg border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Star className="h-5 w-5 text-gray-900" />
                    Statut de votre profil
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 rounded-lg bg-gray-50">
                      <span className="text-sm font-medium text-gray-700">État du profil</span>
                      <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                        profileStatus.isProfileComplete
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}>
                        {profileStatus.isProfileComplete ? '✓ Complet' : '⚠ Incomplet'}
                      </span>
                    </div>

                    {!profileStatus.isProfileComplete && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <p className="font-semibold text-gray-900 mb-3 text-sm">
                          Informations manquantes :
                        </p>
                        <ul className="space-y-2">
                          {profileStatus.missingItems.map((item, index) => (
                            <motion.li
                              key={index}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="flex items-center gap-2 text-sm text-gray-700 bg-white border border-gray-200 p-2 rounded"
                            >
                              <span className="text-gray-900 font-bold">•</span>
                              {item}
                            </motion.li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};
