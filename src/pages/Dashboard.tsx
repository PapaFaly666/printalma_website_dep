import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Avatar } from '../components/ui/avatar';
import {
  DollarSign,
  Users,
  CreditCard,
  Activity,
  ShoppingBag,
  TrendingUp,
  ShoppingCart,
  Eye
} from 'lucide-react';
import { useOutletContext } from 'react-router-dom';

const Dashboard = () => {
  // Get isDarkMode from context, defaulting to false if not provided
  const { isDarkMode = false } = useOutletContext<{ isDarkMode?: boolean }>() || {};

  // Data for monthly sales chart
  const chartData = [
    { name: 'Jan', value: 900000 },
    { name: 'Fév', value: 2000000 },
    { name: 'Mar', value: 3500000 },
    { name: 'Avr', value: 1600000 },
    { name: 'Mai', value: 2400000 },
    { name: 'Juin', value: 5000000 },
    { name: 'Juil', value: 4500000 },
    { name: 'Août', value: 2000000 },
    { name: 'Sep', value: 4000000 },
    { name: 'Oct', value: 4200000 },
    { name: 'Nov', value: 2000000 },
    { name: 'Déc', value: 2000000 },
  ];

  // Top vendors data (Meilleurs vendeurs)
  const topVendors = [
    {
      id: 'KD',
      name: 'Konan Diomandé',
      totalSales: 35000,
      productCount: 42
    },
    {
      id: 'AT',
      name: 'Aminata Touré',
      totalSales: 15000,
      productCount: 27
    },
    {
      id: 'MK',
      name: 'Mohamed Konaté',
      totalSales: 25000,
      productCount: 31
    },
    {
      id: 'FL',
      name: 'Fatoumata Lô',
      totalSales: 45000,
      productCount: 53
    },
    {
      id: 'OT',
      name: 'Ousmane Traoré',
      totalSales: 12000,
      productCount: 18
    }
  ];

  // Définir les couleurs en fonction du mode sombre
  const barColor = isDarkMode ? "#ffffff" : "#000000";
  const positiveTextColor = isDarkMode ? "text-gray-300" : "text-gray-700";

  // Formatter pour les valeurs en FCFA
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR').format(value) + ' FCFA';
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex flex-col gap-6 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight dark:text-white">Tableau de Bord</h1>
          <Button variant="outline" className="dark:text-white dark:border-gray-600">
            Télécharger le rapport
          </Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview" className="relative dark:text-white">
              Aperçu
            </TabsTrigger>
            <TabsTrigger value="analytics" className="dark:text-white">Analytiques</TabsTrigger>
            <TabsTrigger value="products" className="dark:text-white">Produits</TabsTrigger>
            <TabsTrigger value="customers" className="dark:text-white">Clients</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Chiffre d'Affaires Total
              </CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">45 231 890 FCFA</div>
              <p className={`text-xs ${positiveTextColor}`}>+20.1% depuis le mois dernier</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Nouveaux Clients
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+2 350</div>
              <p className={`text-xs ${positiveTextColor}`}>+18.1% depuis le mois dernier</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Ventes
              </CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+12 234</div>
              <p className={`text-xs ${positiveTextColor}`}>+19% depuis le mois dernier</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Visiteurs Actifs
              </CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+573</div>
              <p className={`text-xs ${positiveTextColor}`}>+201 depuis la dernière heure</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Ventes Mensuelles</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartData}>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    vertical={false} 
                    stroke={isDarkMode ? "#333333" : "#dddddd"}
                  />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    stroke={isDarkMode ? "#aaaaaa" : "#333333"}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value/1000}k`}
                    stroke={isDarkMode ? "#aaaaaa" : "#333333"}
                  />
                  <Bar
                    dataKey="value"
                    fill={barColor}
                    radius={[4, 4, 0, 0]}
                    fillOpacity={0.8}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Meilleur Vendeur</CardTitle>
              <p className="text-sm text-muted-foreground">
                Classement des meilleurs vendeurs du mois.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {topVendors.map((vendor) => (
                  <div className="flex items-center" key={vendor.id}>
                    <Avatar className="h-9 w-9 mr-3">
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                        {vendor.id}
                      </div>
                    </Avatar>
                    <div className="space-y-1 flex-1">
                      <p className="text-sm font-medium leading-none">{vendor.name}</p>
                      <p className="text-xs text-muted-foreground">Produits vendus: {vendor.productCount}</p>
                    </div>
                    <div className="font-medium">{formatCurrency(vendor.totalSales)}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Produits les Plus Vendus</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>T-shirt Original</span>
                  <span className="font-medium">1,254 unités</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Pull Premium</span>
                  <span className="font-medium">876 unités</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Pantalon Cargo</span>
                  <span className="font-medium">654 unités</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Mug Personnalisé</span>
                  <span className="font-medium">432 unités</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Casquette Urban</span>
                  <span className="font-medium">321 unités</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Statistiques de Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2">
                  <div>
                    <p className="font-medium">T-shirt Original</p>
                    <p className="text-sm text-muted-foreground">12 000 FCFA</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-200 text-gray-800'}`}>
                      En stock: 125
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center py-2">
                  <div>
                    <p className="font-medium">Pull Premium</p>
                    <p className="text-sm text-muted-foreground">25 000 FCFA</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-200 text-gray-800'}`}>
                      En stock: 78
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center py-2">
                  <div>
                    <p className="font-medium">Pantalon Cargo</p>
                    <p className="text-sm text-muted-foreground">30 000 FCFA</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-200 text-gray-800'}`}>
                      En stock: 45
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center py-2">
                  <div>
                    <p className="font-medium">Mug Personnalisé</p>
                    <p className="text-sm text-muted-foreground">8 000 FCFA</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-200 text-gray-800'}`}>
                      En stock: 210
                    </span>
                  </div>
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