import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import analyticsService from '../../services/AnalyticsService';
import KPICards from '../../components/admin/KPICards';
import RevenueChart from '../../components/admin/RevenueChart';
import TopProducts from '../../components/admin/TopProducts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { 
  RefreshCw, 
  Download, 
  TrendingUp, 
  Users, 
  Package, 
  AlertCircle,
  Calendar,
  BarChart3
} from 'lucide-react';
import '../../styles/dashboard.css';

const AnalyticsDashboard = () => {
  const { user } = useAuth();
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // États des données
  const [statistics, setStatistics] = useState(null);
  const [revenueChart, setRevenueChart] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [realTimeEnabled, setRealTimeEnabled] = useState(false);

  // ==========================================
  // CHARGEMENT DES DONNÉES
  // ==========================================

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('📊 Chargement du dashboard analytics...');
      
      // Charger les statistiques principales
      const statsData = await analyticsService.getStatistics(period);
      setStatistics(statsData);
      setRevenueChart(statsData.revenueChart || []);
      setTopProducts(statsData.topProducts || []);
      setRecentActivity(statsData.recentActivity || []);
      
      setLastRefresh(new Date());
      console.log('✅ Dashboard analytics chargé avec succès');
      
    } catch (error) {
      console.error('❌ Erreur chargement dashboard:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [period]);

  // ==========================================
  // TEMPS RÉEL
  // ==========================================

  const enableRealTime = useCallback(() => {
    if (realTimeEnabled) return;
    
    console.log('🔌 Activation du temps réel...');
    analyticsService.connectRealTime();
    
    // Callbacks pour les mises à jour temps réel
    analyticsService.onNewOrder(() => {
      console.log('🆕 Nouvelle commande - Actualisation du dashboard');
      fetchAllData();
    });
    
    analyticsService.onRevenueUpdate((data) => {
      console.log('💰 Revenus mis à jour temps réel:', data);
      // Mettre à jour les KPI en temps réel sans recharger tout
      if (statistics) {
        setStatistics(prev => ({
          ...prev,
          overview: {
            ...prev.overview,
            revenueToday: data.todayRevenue,
            ordersToday: data.todayOrders
          }
        }));
      }
    });
    
    setRealTimeEnabled(true);
  }, [realTimeEnabled, fetchAllData, statistics]);

  const disableRealTime = useCallback(() => {
    console.log('🔌 Désactivation du temps réel...');
    analyticsService.disconnectRealTime();
    setRealTimeEnabled(false);
  }, []);

  // ==========================================
  // RAPPORTS
  // ==========================================

  const generateReport = async () => {
    try {
      console.log('📋 Génération du rapport...');
      
      const reportConfig = {
        name: `Rapport Analytics ${period}`,
        dateFrom: getDateFromPeriod(period).from,
        dateTo: getDateFromPeriod(period).to,
        metrics: ['revenue', 'orders', 'products', 'customers'],
        groupBy: period === '7d' ? 'day' : period === '30d' ? 'day' : 'week',
        format: 'pdf'
      };
      
      const report = await analyticsService.generateCustomReport(reportConfig);
      
      // Télécharger le rapport
      const blob = await analyticsService.downloadReport(report.reportId, 'pdf');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport-analytics-${period}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      console.log('✅ Rapport téléchargé');
      
    } catch (error) {
      console.error('❌ Erreur génération rapport:', error);
      setError('Erreur lors de la génération du rapport');
    }
  };

  // ==========================================
  // UTILITAIRES
  // ==========================================

  const getDateFromPeriod = (period) => {
    const now = new Date();
    const days = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '365d': 365
    };
    
    const from = new Date(now);
    from.setDate(from.getDate() - (days[period] || 30));
    
    return {
      from: from.toISOString().split('T')[0],
      to: now.toISOString().split('T')[0]
    };
  };

  const getPeriodLabel = (period) => {
    const labels = {
      '7d': '7 derniers jours',
      '30d': '30 derniers jours',
      '90d': '3 derniers mois',
      '365d': '12 derniers mois'
    };
    return labels[period] || labels['30d'];
  };

  // ==========================================
  // EFFETS
  // ==========================================

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  useEffect(() => {
    // Cleanup au démontage
    return () => {
      if (realTimeEnabled) {
        analyticsService.disconnectRealTime();
      }
    };
  }, [realTimeEnabled]);

  // ==========================================
  // VÉRIFICATIONS D'ACCÈS
  // ==========================================

  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">Accès refusé</CardTitle>
            <CardDescription>
              Vous devez être administrateur pour accéder aux analytics.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // ==========================================
  // RENDU
  // ==========================================

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-blue-600" />
                Analytics Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Tableau de bord des performances • {getPeriodLabel(period)} • 
                Dernière actualisation: {lastRefresh.toLocaleTimeString('fr-FR')}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Sélecteur de période */}
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-40">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7 jours</SelectItem>
                  <SelectItem value="30d">30 jours</SelectItem>
                  <SelectItem value="90d">3 mois</SelectItem>
                  <SelectItem value="365d">1 an</SelectItem>
                </SelectContent>
              </Select>

              {/* Bouton temps réel */}
              <Button
                onClick={realTimeEnabled ? disableRealTime : enableRealTime}
                variant={realTimeEnabled ? "default" : "outline"}
                size="sm"
                className="gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                {realTimeEnabled ? 'Temps réel ON' : 'Temps réel OFF'}
              </Button>

              {/* Bouton rapport */}
              <Button onClick={generateReport} variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Rapport
              </Button>

              {/* Bouton actualiser */}
              <Button 
                onClick={fetchAllData} 
                disabled={loading}
                variant="outline" 
                size="sm"
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
            </div>
          </div>

          {/* Indicateurs de statut */}
          <div className="flex items-center gap-4 mt-4">
            <Badge variant={realTimeEnabled ? "default" : "secondary"} className="gap-1">
              <div className={`w-2 h-2 rounded-full ${realTimeEnabled ? 'bg-green-400' : 'bg-gray-400'}`}></div>
              {realTimeEnabled ? 'Temps réel actif' : 'Temps réel inactif'}
            </Badge>
            
            {loading && (
              <Badge variant="outline" className="gap-1">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Chargement...
              </Badge>
            )}
          </div>

          {/* Alerte d'erreur */}
          {error && (
            <Alert className="mt-4 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Erreur:</strong> {error}
                <Button 
                  variant="link" 
                  onClick={fetchAllData}
                  className="p-0 h-auto text-red-800 underline ml-2"
                >
                  Réessayer
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* KPI Cards */}
        <div className="fade-in">
          <KPICards overview={statistics?.overview} loading={loading} />
        </div>

        {/* Graphiques et analyses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Graphique des revenus */}
          <div className="lg:col-span-2 fade-in">
            <RevenueChart 
              data={revenueChart} 
              period={period} 
              loading={loading} 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top produits */}
          <div className="fade-in">
            <TopProducts products={topProducts} loading={loading} />
          </div>

          {/* Activité récente */}
          <div className="fade-in">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Activité Récente
                </CardTitle>
                <CardDescription>
                  Dernières actions sur la plateforme
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-3">
                        <div className="skeleton h-10 w-10 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="skeleton h-4 w-full"></div>
                          <div className="skeleton h-3 w-3/4"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : recentActivity.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-gray-500">
                    Aucune activité récente
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => (
                      <div key={activity.id || index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0 mt-1">
                          {activity.type === 'ORDER_CREATED' ? (
                            <Package className="h-4 w-4 text-green-600" />
                          ) : activity.type === 'ORDER_STATUS_CHANGED' ? (
                            <RefreshCw className="h-4 w-4 text-blue-600" />
                          ) : (
                            <TrendingUp className="h-4 w-4 text-gray-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {activity.type === 'ORDER_CREATED' && `Nouvelle commande ${activity.orderNumber}`}
                            {activity.type === 'ORDER_STATUS_CHANGED' && `Commande ${activity.orderNumber} : ${activity.previousStatus} → ${activity.newStatus}`}
                          </p>
                          <p className="text-sm text-gray-500">
                            {activity.customerName} • {analyticsService.formatCurrency(activity.amount)}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {analyticsService.formatDate(activity.timestamp, { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard; 