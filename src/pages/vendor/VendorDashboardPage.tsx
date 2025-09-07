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
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  CalendarIcon,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Progress } from '../../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
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

interface ChartData {
  name: string;
  value: number;
  change: number;
}

// Composant pour les courbes/graphiques simples
const MiniChart = ({ data, color = "#3b82f6" }: { data: number[]; color?: string }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = range === 0 ? 50 : 100 - ((value - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="h-16 w-full">
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          points={points}
          vectorEffect="non-scaling-stroke"
        />
        <defs>
          <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon
          fill={`url(#gradient-${color.replace('#', '')})`}
          points={`0,100 ${points} 100,100`}
        />
      </svg>
    </div>
  );
};

// Composant pour les graphiques en barres circulaires
const CircularProgress = ({ value, max, color, size = 60 }: { value: number; max: number; color: string; size?: number }) => {
  const percentage = (value / max) * 100;
  const circumference = 2 * Math.PI * 18;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size/2}
          cy={size/2}
          r="18"
          stroke="currentColor"
          strokeWidth="4"
          fill="transparent"
          className="text-gray-200"
        />
        <circle
          cx={size/2}
          cy={size/2}
          r="18"
          stroke={color}
          strokeWidth="4"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-in-out"
        />
      </svg>
      <span className="absolute text-sm font-semibold text-gray-700">
        {Math.round(percentage)}%
      </span>
    </div>
  );
};

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

  // Données simulées pour les graphiques
  const revenueData = [45000, 52000, 48000, 65000, 58000, 72000, 85000];
  const viewsData = [120, 150, 180, 220, 190, 280, 320];
  const ordersData = [8, 12, 15, 18, 14, 22, 25];

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
        totalProducts: 24,
        totalDesigns: 18,
        totalViews: 2847,
        totalEarnings: 285000,
        totalRevenue: 425000,
        totalRemaining: 140000
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

  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Tableau de bord
            </h1>
            <p className="text-gray-600 mt-1">
              Bonjour {vendorName}, bienvenue dans {shopName}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
              En ligne
            </Badge>
            <Button 
              variant="outline" 
              size="sm"
              onClick={loadDashboardData}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        </div>

        {/* Stats principales avec graphiques */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Chiffre d'affaires</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : `${stats.totalRevenue.toLocaleString()} F`}
                </div>
                <div className="flex items-center text-xs text-green-600">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  <span>+12.5% ce mois</span>
                </div>
                <div className="mt-4">
                  <MiniChart data={revenueData} color="#10b981" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Nombre de produits</CardTitle>
                <Package className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : stats.totalProducts}
                </div>
                <div className="flex items-center text-xs text-blue-600">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  <span>+2 ce mois</span>
                </div>
                <div className="mt-4 flex justify-center">
                  <CircularProgress value={stats.totalProducts} max={50} color="#3b82f6" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Designs</CardTitle>
                <ImageIcon className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : stats.totalDesigns}
                </div>
                <div className="flex items-center text-xs text-purple-600">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  <span>+3 ce mois</span>
                </div>
                <div className="mt-4 flex justify-center">
                  <CircularProgress value={stats.totalDesigns} max={25} color="#8b5cf6" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Nombre de vues</CardTitle>
                <Eye className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : stats.totalViews.toLocaleString()}
                </div>
                <div className="flex items-center text-xs text-orange-600">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  <span>+18.2% ce mois</span>
                </div>
                <div className="mt-4">
                  <MiniChart data={viewsData} color="#ea580c" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Gains totaux</CardTitle>
                <DollarSign className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : `${stats.totalEarnings.toLocaleString()} F`}
                </div>
                <div className="flex items-center text-xs text-emerald-600">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  <span>+8.3% ce mois</span>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Progression</span>
                    <span className="text-gray-700">67%</span>
                  </div>
                  <Progress value={67} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total restant</CardTitle>
                <ShoppingCart className="h-4 w-4 text-indigo-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : `${stats.totalRemaining.toLocaleString()} F`}
                </div>
                <div className="flex items-center text-xs text-indigo-600">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  <span>+5.1% ce mois</span>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Objectif</span>
                    <span className="text-gray-700">33%</span>
                  </div>
                  <Progress value={33} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Section avec onglets */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Tabs defaultValue="analytics" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="analytics">Analytiques</TabsTrigger>
              <TabsTrigger value="recent">Activité récente</TabsTrigger>
              <TabsTrigger value="goals">Objectifs</TabsTrigger>
            </TabsList>
            
            <TabsContent value="analytics" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Performance des ventes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-sm">Produits vendus</span>
                        </div>
                        <span className="font-medium">{stats.totalProducts}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="text-sm">Designs actifs</span>
                        </div>
                        <span className="font-medium">{stats.totalDesigns}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                          <span className="text-sm">Taux conversion</span>
                        </div>
                        <span className="font-medium">3.2%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Évolution mensuelle</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-32">
                      <MiniChart data={ordersData} color="#6366f1" />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>Jan</span>
                      <span>Fév</span>
                      <span>Mar</span>
                      <span>Avr</span>
                      <span>Mai</span>
                      <span>Jun</span>
                      <span>Jul</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="recent" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Activités récentes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">Nouveau design approuvé</p>
                      <p className="text-xs text-gray-500">Il y a 2 heures</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">Produit ajouté au catalogue</p>
                      <p className="text-xs text-gray-500">Il y a 5 heures</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">Commande reçue #1234</p>
                      <p className="text-xs text-gray-500">Il y a 1 jour</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="goals" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Objectifs du mois</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Revenus</span>
                        <span className="text-gray-600">500,000 F</span>
                      </div>
                      <Progress value={85} className="h-2" />
                      <p className="text-xs text-gray-500">85% atteint</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Nouveaux produits</span>
                        <span className="text-gray-600">30</span>
                      </div>
                      <Progress value={48} className="h-2" />
                      <p className="text-xs text-gray-500">48% atteint</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Actions recommandées</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        <BarChart3 className="w-3 h-3 mr-1" />
                        Tips
                      </Badge>
                      <div className="text-sm">
                        <p className="font-medium">Optimisez vos designs</p>
                        <p className="text-gray-500">Ajoutez des mots-clés pour améliorer la visibilité</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Croissance
                      </Badge>
                      <div className="text-sm">
                        <p className="font-medium">Nouveaux produits</p>
                        <p className="text-gray-500">Créez 6 nouveaux produits pour atteindre votre objectif</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default VendorDashboardPage;