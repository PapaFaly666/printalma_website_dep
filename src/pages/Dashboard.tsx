import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Avatar } from '../components/ui/avatar';
import { TrendingUp, Loader2 } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { dashboardService } from '../services/dashboardService';
import { DashboardData } from '../types/dashboard';

const Dashboard = () => {
  // Get isDarkMode from context, defaulting to false if not provided
  const { isDarkMode = false } = useOutletContext<{ isDarkMode?: boolean }>() || {};

  // Fetch dashboard data using React Query
  const { data: dashboardData, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['adminDashboard'],
    queryFn: () => dashboardService.getDashboardData(),
    refetchInterval: 60000, // Rafraîchir toutes les 60 secondes
  });

  // Définir les couleurs en fonction du mode sombre
  const barColor = isDarkMode ? "#ffffff" : "#000000";
  const positiveTextColor = isDarkMode ? "text-gray-300" : "text-gray-700";

  // Formatter pour les valeurs en FCFA
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR').format(value) + ' FCFA';
  };

  // Affichage de l'état de chargement
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <p className="mt-4 text-gray-500">Chargement du tableau de bord...</p>
      </div>
    );
  }

  // Affichage de l'erreur
  if (error) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center">
        <p className="text-red-500">Erreur lors du chargement des données du tableau de bord.</p>
        <p className="text-gray-500 mt-2">Veuillez réessayer plus tard.</p>
      </div>
    );
  }

  // Si pas de données, afficher un message
  if (!dashboardData) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center">
        <p className="text-gray-500">Aucune donnée disponible.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight dark:text-white">Tableau de Bord - {dashboardData.currentMonth} {dashboardData.currentYear}</h1>
      </div>

        {/* Onglets supprimés selon la demande */}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chiffre d'affaires annuel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(dashboardData.financialStats.thisYearRevenue)}</div>
              <p className={`text-xs ${positiveTextColor}`}>Gain annuel</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chiffre d'affaires mensuel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(dashboardData.financialStats.thisMonthRevenue)}</div>
              <p className={`text-xs ${positiveTextColor}`}>Gain mensuel</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vendeurs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.vendorStats.totalVendors}</div>
              <p className={`text-xs ${positiveTextColor}`}>{dashboardData.vendorStats.newVendorsThisMonth} vendeur(s) ce mois</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Produits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.productStats.totalProducts}</div>
              <p className={`text-xs ${positiveTextColor}`}>{dashboardData.productStats.productsAwaitingValidation.length} produit(s) en attente</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Designs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.designStats.totalDesigns}</div>
              <p className={`text-xs ${positiveTextColor}`}>{dashboardData.designStats.designsAwaitingValidation.length} en attente</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Statistiques Commandes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Commandes</p>
                  <p className="text-2xl font-bold">{dashboardData.orderStats.totalOrders}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ce mois</p>
                  <p className="text-2xl font-bold">{dashboardData.orderStats.thisMonthOrders}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">En attente</p>
                  <p className="text-2xl font-bold">{dashboardData.orderStats.pendingOrders}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Confirmées</p>
                  <p className="text-2xl font-bold">{dashboardData.orderStats.confirmedOrders}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">En traitement</p>
                  <p className="text-2xl font-bold">{dashboardData.orderStats.processingOrders}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Expédiées</p>
                  <p className="text-2xl font-bold">{dashboardData.orderStats.shippedOrders}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Livrées</p>
                  <p className="text-2xl font-bold">{dashboardData.orderStats.deliveredOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Meilleurs Vendeurs</CardTitle>
              <p className="text-sm text-muted-foreground">
                Top vendeurs par produits.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.topVendors.byProducts.slice(0, 5).map((vendor) => (
                  <div className="flex items-center" key={vendor.vendorId}>
                    <Avatar className="h-9 w-9 mr-3">
                      {vendor.profileImage ? (
                        <img src={vendor.profileImage} alt={vendor.vendorName} className="h-full w-full rounded-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center rounded-full bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs">
                          {vendor.vendorName.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                    </Avatar>
                    <div className="space-y-1 flex-1">
                      <p className="text-sm font-medium leading-none">{vendor.vendorName}</p>
                      <p className="text-xs text-muted-foreground">{vendor.shopName} - {vendor.totalProducts} produit(s)</p>
                    </div>
                    <div className="text-xs font-medium">{vendor.commissionRate}%</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Designs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Total designs</span>
                  <span className="font-medium">{dashboardData.designStats.totalDesigns}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Designs en attente</span>
                  <span className="font-medium">{dashboardData.designStats.pendingDesigns}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Designs publiés</span>
                  <span className="font-medium">{dashboardData.designStats.publishedDesigns}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Designs validés</span>
                  <span className="font-medium">{dashboardData.designStats.validatedDesigns}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statistiques Vendeurs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2">
                  <span className="font-medium">Vendeurs actifs</span>
                  <span className="text-sm">{dashboardData.vendorStats.activeVendors}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="font-medium">Vendeurs inactifs</span>
                  <span className="text-sm">{dashboardData.vendorStats.inactiveVendors}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="font-medium">Vendeurs suspendus</span>
                  <span className="text-sm">{dashboardData.vendorStats.suspendedVendors}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statistiques Financières</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2">
                  <span className="font-medium">Gains Admin</span>
                  <span className="text-sm font-bold">{formatCurrency(dashboardData.financialStats.totalAdminGains)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="font-medium">Revenus vendeurs</span>
                  <span className="text-sm">{formatCurrency(dashboardData.financialStats.thisMonthVendorEarnings)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="font-medium">Commission moyenne</span>
                  <span className="text-sm">{(dashboardData.financialStats.averageCommissionRate * 100).toFixed(0)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;