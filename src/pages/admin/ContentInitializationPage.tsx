import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, Package, Users, Music, ArrowRight, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { AdminButton } from '../../components/admin/AdminButton';
import { toast } from 'sonner';
import { contentService } from '../../services/contentService';

interface ContentData {
  designs: Array<{ id: string; name: string; imageUrl: string }>;
  influencers: Array<{ id: string; name: string; imageUrl: string }>;
  merchandising: Array<{ id: string; name: string; imageUrl: string }>;
}

const TOTAL_ITEMS = 17; // 6 + 5 + 6

// Données par défaut qui seront créées
const PREVIEW_DATA = {
  designs: [
    'Pap Musa',
    'Ceeneer',
    'K & C',
    'Breadwinner',
    'Meissa Biguey',
    'DAD'
  ],
  influencers: [
    'Ebu Jomlong',
    'Dip Poundou Guiss',
    'Massamba Amadeus',
    'Amina Abed',
    'Mut Cash'
  ],
  merchandising: [
    'Bathie Drizzy',
    'Latzo Dozé',
    'Jaaw Ketchup',
    'Dudu FDV',
    'Adja Everywhere',
    'Pape Sidy Fall'
  ]
};

export const ContentInitializationPage: React.FC = () => {
  const navigate = useNavigate();
  const [isInitialized, setIsInitialized] = useState<boolean | null>(null);
  const [initializing, setInitializing] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contentPreview, setContentPreview] = useState<ContentData | null>(null);

  useEffect(() => {
    checkInitializationStatus();
  }, []);

  const checkInitializationStatus = async () => {
    try {
      setVerifying(true);
      setError(null);
      const data = await contentService.getAdminContent();
      setContentPreview(data);

      const totalItems = data.designs.length + data.influencers.length + data.merchandising.length;
      setIsInitialized(totalItems === TOTAL_ITEMS);
    } catch (err: any) {
      console.error('Erreur vérification:', err);
      setError(err.message || 'Erreur lors de la vérification');
    } finally {
      setVerifying(false);
    }
  };

  const handleInitialize = async () => {
    const confirmation = `
⚠️ INITIALISATION DU CONTENU ⚠️

Cette opération va créer ${TOTAL_ITEMS} items permanents:
- 6 Designs Exclusifs
- 5 Influenceurs Partenaires
- 6 Merchandising Musical

Après création, vous pourrez uniquement modifier:
✓ Le nom de chaque item
✓ L'image de chaque item

Vous ne pourrez PAS:
✗ Ajouter de nouveaux items
✗ Supprimer des items existants

Continuer?
    `;

    if (!confirm(confirmation)) {
      return;
    }

    setInitializing(true);
    setError(null);

    try {
      const result = await contentService.initializeContent();

      toast.success('✅ ' + result.message, {
        description: `${result.count} items ont été créés`
      });

      // Recharger et rediriger
      await checkInitializationStatus();
      setTimeout(() => {
        navigate('/admin/content-management');
      }, 1500);
    } catch (err: any) {
      const errorMsg = err.message || 'Erreur inconnue';
      setError(errorMsg);

      if (errorMsg.includes('déjà')) {
        toast.error('Contenu déjà initialisé', {
          description: 'Redirection vers la page de gestion...'
        });
        setTimeout(() => {
          navigate('/admin/content-management');
        }, 2000);
      } else {
        toast.error('Erreur lors de l\'initialisation', {
          description: errorMsg
        });
      }
    } finally {
      setInitializing(false);
    }
  };

  // État de chargement
  if (verifying) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Vérification de l'état d'initialisation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Erreur de vérification
  if (error && isInitialized === null) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-xl">Erreur de vérification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-gray-600 dark:text-gray-400">{error}</p>
            <AdminButton
              onClick={checkInitializationStatus}
              variant="secondary"
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </AdminButton>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Déjà initialisé
  if (isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-lg"
        >
          <Card>
            <CardHeader className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle className="h-10 w-10 text-green-600" />
              </motion.div>
              <CardTitle className="text-2xl">Contenu déjà initialisé</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-center text-gray-600 dark:text-gray-400">
                Les {TOTAL_ITEMS} items sont créés et prêts à être modifiés.
              </p>

              {contentPreview && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-amber-500">{contentPreview.designs.length}</div>
                    <div className="text-xs text-gray-500">Designs</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-blue-500">{contentPreview.influencers.length}</div>
                    <div className="text-xs text-gray-500">Influenceurs</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-red-500">{contentPreview.merchandising.length}</div>
                    <div className="text-xs text-gray-500">Merchandising</div>
                  </div>
                </div>
              )}

              <AdminButton
                onClick={() => navigate('/admin/content-management')}
                variant="primary"
                className="w-full"
              >
                Gérer le contenu
                <ArrowRight className="h-4 w-4 ml-2" />
              </AdminButton>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Non initialisé - Afficher le bouton d'initialisation
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            ⚙️ Initialisation du Contenu
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Configuration du contenu de la page d'accueil
          </p>
        </motion.div>

        {/* Warning Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="mb-6 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-100">
                <AlertTriangle className="h-5 w-5" />
                ⚠️ Opération irréversible
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-amber-800 dark:text-amber-200 mb-2">
                Cette opération ne peut être effectuée qu'<strong>UNE SEULE FOIS</strong>.
              </p>
              <p className="text-amber-700 dark:text-amber-300 text-sm">
                Une fois les items créés, vous ne pourrez plus les supprimer, mais uniquement modifier leur nom et leur image.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Info Sections */}
        <div className="space-y-6 mb-8">
          {/* Designs Exclusifs */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="border-b border-gray-200" style={{ backgroundColor: 'rgb(241, 209, 45)' }}>
                <CardTitle className="flex items-center gap-2 text-black">
                  <Package className="h-5 w-5" />
                  🎨 Designs Exclusifs
                  <span className="ml-auto text-sm bg-black/20 px-2 py-1 rounded">
                    {PREVIEW_DATA.designs.length} items
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {PREVIEW_DATA.designs.map((name, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <span className="w-6 h-6 flex items-center justify-center bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-xs font-bold">
                        {i + 1}
                      </span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Influenceurs Partenaires */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader className="border-b border-gray-200" style={{ backgroundColor: 'rgb(20, 104, 154)' }}>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Users className="h-5 w-5" />
                  👥 Influenceurs Partenaires
                  <span className="ml-auto text-sm bg-white/20 px-2 py-1 rounded">
                    {PREVIEW_DATA.influencers.length} items
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {PREVIEW_DATA.influencers.map((name, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <span className="w-6 h-6 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-bold">
                        {i + 1}
                      </span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Merchandising Musical */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader className="border-b border-gray-200" style={{ backgroundColor: 'rgb(230, 29, 44)' }}>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Music className="h-5 w-5" />
                  🎵 Merchandising Musical
                  <span className="ml-auto text-sm bg-white/20 px-2 py-1 rounded">
                    {PREVIEW_DATA.merchandising.length} items
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {PREVIEW_DATA.merchandising.map((name, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <span className="w-6 h-6 flex items-center justify-center bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-xs font-bold">
                        {i + 1}
                      </span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* After Initialization Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-900 dark:text-green-100">
                <CheckCircle className="h-5 w-5" />
                ✏️ Après l'initialisation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-green-800 dark:text-green-200 font-medium mb-2">
                    Vous pourrez modifier:
                  </p>
                  <ul className="space-y-1 text-green-700 dark:text-green-300 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Le nom de chaque item
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      L'image (via upload Cloudinary)
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="text-red-800 dark:text-red-200 font-medium mb-2">
                    Vous ne pourrez PAS:
                  </p>
                  <ul className="space-y-1 text-red-700 dark:text-red-300 text-sm">
                    <li className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Ajouter de nouveaux items
                    </li>
                    <li className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Supprimer des items existants
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Initialize Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <AdminButton
            onClick={handleInitialize}
            disabled={initializing}
            variant="primary"
            size="lg"
            className="px-12 py-6 text-lg"
          >
            {initializing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Initialisation en cours...
              </>
            ) : (
              <>
                🚀 Initialiser le contenu
                <ArrowRight className="h-5 w-5 ml-2" />
              </>
            )}
          </AdminButton>

          {error && !error.includes('déjà') && (
            <p className="mt-4 text-red-600 dark:text-red-400 text-sm">{error}</p>
          )}
        </motion.div>
      </div>
    </div>
  );
};
