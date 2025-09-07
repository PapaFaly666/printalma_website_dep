import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, 
  Image as ImageIcon, 
  Eye, 
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Users,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth.service';

// Types pour les données du dashboard
interface DashboardStats {
  totalProducts: number;
  totalDesigns: number;
  totalViews: number;
  totalEarnings: number;
  totalRevenue: number;
  totalRemaining: number;
}

export const VendorDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalDesigns: 0,
    totalViews: 0,
    totalEarnings: 0,
    totalRevenue: 0,
    totalRemaining: 0
  });
  const [loading, setLoading] = useState(true);
  const [extendedProfile, setExtendedProfile] = useState<any>(null);

  // Chargement des données du dashboard
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Charger le profil étendu du vendeur
      const profileData = await authService.getExtendedVendorProfile();
      if (profileData.success) {
        setExtendedProfile(profileData.vendor);
      }

      // TODO: Remplacer par les vraies API calls
      // Pour l'instant, utiliser des données simulées
      setStats({
        totalProducts: 12,
        totalDesigns: 8,
        totalViews: 1540,
        totalEarnings: 125000,
        totalRevenue: 180000,
        totalRemaining: 55000
      });
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const vendorName = user ? `${user.firstName} ${user.lastName}` : 'Vendeur';
  const shopName = extendedProfile?.shop_name || 'Mon Shop';

  const statItems = [
    {
      title: 'Produits',
      value: stats.totalProducts,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      format: (val: number) => val.toString()
    },
    {
      title: 'Chiffre d\'affaires',
      value: stats.totalRevenue,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      format: (val: number) => `${val.toLocaleString()} F`
    },
    {
      title: 'Designs',
      value: stats.totalDesigns,
      icon: ImageIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      format: (val: number) => val.toString()
    },
    {
      title: 'Vues',
      value: stats.totalViews,
      icon: Eye,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      format: (val: number) => val.toLocaleString()
    },
    {
      title: 'Gains totaux',
      value: stats.totalEarnings,
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      format: (val: number) => `${val.toLocaleString()} F`
    },
    {
      title: 'Total restant',
      value: stats.totalRemaining,
      icon: ShoppingCart,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      format: (val: number) => `${val.toLocaleString()} F`
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-black">
                Tableau de bord
              </h1>
              <p className="text-gray-600 mt-1 md:mt-2 text-sm md:text-base">
                Bonjour {vendorName}, bienvenue dans {shopName}
              </p>
            </div>
            
            <Button 
              variant="outline" 
              onClick={loadDashboardData}
              disabled={loading}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        </div>

        {/* Cartes de statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statItems.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-gray-200 hover:border-black transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{item.title}</p>
                      <p className="text-2xl font-bold text-black">
                        {loading ? '...' : item.format(item.value)}
                      </p>
                    </div>
                    <div className={`p-3 rounded-full ${item.bgColor}`}>
                      <item.icon className={`h-6 w-6 ${item.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Actions rapides */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-8"
        >
          <h2 className="text-xl font-semibold text-black mb-4">Actions rapides</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-gray-200 hover:border-black transition-colors cursor-pointer">
              <CardContent className="p-4 text-center">
                <Package className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <p className="text-sm font-medium text-black">Mes Produits</p>
                <p className="text-xs text-gray-500">Gérer mes produits</p>
              </CardContent>
            </Card>
            
            <Card className="border-gray-200 hover:border-black transition-colors cursor-pointer">
              <CardContent className="p-4 text-center">
                <ImageIcon className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <p className="text-sm font-medium text-black">Mes Designs</p>
                <p className="text-xs text-gray-500">Créer et gérer</p>
              </CardContent>
            </Card>
            
            <Card className="border-gray-200 hover:border-black transition-colors cursor-pointer">
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <p className="text-sm font-medium text-black">Mes Commandes</p>
                <p className="text-xs text-gray-500">Suivre les ventes</p>
              </CardContent>
            </Card>
            
            <Card className="border-gray-200 hover:border-black transition-colors cursor-pointer">
              <CardContent className="p-4 text-center">
                <Users className="h-8 w-8 mx-auto mb-2 text-indigo-600" />
                <p className="text-sm font-medium text-black">Mon Compte</p>
                <p className="text-xs text-gray-500">Paramètres</p>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Graphique ou données récentes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="border-gray-200">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-black mb-4">Aperçu des performances</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {loading ? '...' : `${((stats.totalProducts / 20) * 100).toFixed(1)}%`}
                  </div>
                  <p className="text-sm text-gray-600">Objectif produits</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {loading ? '...' : `${((stats.totalRevenue / 300000) * 100).toFixed(1)}%`}
                  </div>
                  <p className="text-sm text-gray-600">Objectif revenus</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {loading ? '...' : `${((stats.totalViews / 2000) * 100).toFixed(1)}%`}
                  </div>
                  <p className="text-sm text-gray-600">Objectif vues</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default VendorDashboardPage;