import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Avatar } from '../components/ui/avatar';
import { TrendingUp } from 'lucide-react';
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
      </div>

        {/* Onglets supprimés selon la demande */}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chiffre d'affaires annuel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0 FCFA</div>
              <p className={`text-xs ${positiveTextColor}`}>Gain annuel</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chiffre d'affaires mensuel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0 FCFA</div>
              <p className={`text-xs ${positiveTextColor}`}>Gain mensuel</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vendeurs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className={`text-xs ${positiveTextColor}`}>0 vendeur ce mois</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Produits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className={`text-xs ${positiveTextColor}`}>produit en attente</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Designs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className={`text-xs ${positiveTextColor}`}>10 en attente</p>
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
              <CardTitle>Designs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Total designs</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Designs en attente</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Designs publiés</span>
                  <span className="font-medium">0</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Nombre de visites</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2">
                  <span className="font-medium">Aujourd'hui</span>
                  <span className="text-sm">0</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="font-medium">Cette semaine</span>
                  <span className="text-sm">0</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="font-medium">Ce mois</span>
                  <span className="text-sm">0</span>
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