import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  AreaChart, Area,  Radar, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import Button from "../components/ui/Button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "../components/ui/table";
import { useNavigate } from 'react-router-dom';
import { fetchProducts } from '../services/api';
import { 
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, Eye,  ArrowUpRight,  Loader2, Filter, Download,  RefreshCcw
} from 'lucide-react';

// Mock data for analytics
const generateMockData = () => {
  // Sales over time
  const salesData = Array.from({ length: 30 }, (_, i) => ({
    date: `2023-${(i % 12) + 1}-${(i % 28) + 1}`,
    sales: Math.floor(Math.random() * 50) + 10,
    revenue: (Math.floor(Math.random() * 50) + 10) * 15000,
    views: Math.floor(Math.random() * 200) + 50,
  }));

  // Product performance
  const topProducts = [
    { name: 'T-shirt Original', sales: 253, revenue: 3795000, views: 1543, conversionRate: 16.4 },
    { name: 'Pull Premium', sales: 187, revenue: 2805000, views: 1253, conversionRate: 14.9 },
    { name: 'Mug Personnalisé', sales: 165, revenue: 990000, views: 1432, conversionRate: 11.5 },
    { name: 'Casquette Urban', sales: 132, revenue: 1320000, views: 987, conversionRate: 13.4 },
    { name: 'Pantalon Cargo', sales: 118, revenue: 2950000, views: 765, conversionRate: 15.4 },
  ];

  // Category distribution
  const categoryData = [
    { name: 'Vêtements', value: 45 },
    { name: 'Accessoires', value: 25 },
    { name: 'Mugs', value: 15 },
    { name: 'Casquettes', value: 10 },
    { name: 'Autres', value: 5 },
  ];

  // Stock status
  const stockData = [
    { name: 'En stock', value: 65 },
    { name: 'Stock faible', value: 15 },
    { name: 'Rupture', value: 20 },
  ];

  return { salesData, topProducts, categoryData, stockData };
};

const { salesData, topProducts, categoryData, stockData } = generateMockData();

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
const STOCK_COLORS = ['#4ade80', '#fbbf24', '#f87171'];

const ProductAnalytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedTab, setSelectedTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();

  // Fetch products data
  useEffect(() => {
    const loadProducts = async () => {
      try {
        await fetchProducts();
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR').format(value) + ' FCFA';
  };

  // Handle data refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1500);
  };

  // Generate KPI cards
  const renderKPICards = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total des Ventes
          </CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">1,234</div>
          <div className="flex items-center pt-1 text-xs text-green-500">
            <TrendingUp className="mr-1 h-3 w-3" />
            <span>+12.5% </span>
            <span className="text-muted-foreground ml-1">par rapport au mois précédent</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Chiffre d'Affaires
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(12450000)}</div>
          <div className="flex items-center pt-1 text-xs text-green-500">
            <TrendingUp className="mr-1 h-3 w-3" />
            <span>+18.2% </span>
            <span className="text-muted-foreground ml-1">par rapport au mois précédent</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Produits Consultés
          </CardTitle>
          <Eye className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">8,432</div>
          <div className="flex items-center pt-1 text-xs text-red-500">
            <TrendingDown className="mr-1 h-3 w-3" />
            <span>-3.1% </span>
            <span className="text-muted-foreground ml-1">par rapport au mois précédent</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Taux de Conversion
          </CardTitle>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">14.6%</div>
          <div className="flex items-center pt-1 text-xs text-green-500">
            <TrendingUp className="mr-1 h-3 w-3" />
            <span>+2.4% </span>
            <span className="text-muted-foreground ml-1">par rapport au mois précédent</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <Loader2 className="h-12 w-12 text-gray-400 dark:text-gray-600 animate-spin mb-4" />
        <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">Chargement des données analytiques...</p>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Préparation des graphiques et métriques</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex flex-col gap-6 p-4 md:p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight dark:text-white">Analytiques Produits</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Analysez les performances de vos produits et optimisez votre catalogue
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 derniers jours</SelectItem>
                <SelectItem value="30d">30 derniers jours</SelectItem>
                <SelectItem value="90d">3 derniers mois</SelectItem>
                <SelectItem value="365d">12 derniers mois</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <RefreshCcw className="h-4 w-4 mr-1" />
              )}
              Actualiser
            </Button>
            
            <Button variant="outline">
              <Download className="h-4 w-4 mr-1" />
              Exporter
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-5 mb-2">
            <TabsTrigger value="overview">Aperçu</TabsTrigger>
            <TabsTrigger value="products">Top Produits</TabsTrigger>
            <TabsTrigger value="sales">Ventes</TabsTrigger>
            <TabsTrigger value="categories">Catégories</TabsTrigger>
            <TabsTrigger value="inventory">Inventaire</TabsTrigger>
          </TabsList>

          {renderKPICards()}

          <TabsContent value="overview" className="space-y-6">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Performance des Ventes</CardTitle>
                <CardDescription>
                  Évolution des ventes et des revenus sur la période
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={salesData}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#dddddd" />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <Tooltip formatter={(value, name) => {
                      if (name === 'revenue') return formatCurrency(Number(value));
                      return value;
                    }} />
                    <Legend />
                    <Area type="monotone" dataKey="sales" stroke="#8884d8" fillOpacity={1} fill="url(#colorSales)" name="Ventes" />
                    <Area type="monotone" dataKey="revenue" stroke="#82ca9d" fillOpacity={1} fill="url(#colorRevenue)" name="Revenus" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Distribution par Catégorie</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {categoryData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>État des Stocks</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={stockData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {stockData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={STOCK_COLORS[index % STOCK_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle>Performance des Produits</CardTitle>
                <CardDescription>
                  Analysez les produits les plus performants de votre catalogue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Rechercher un produit..." 
                        className="w-[250px]" 
                      />
                      <Select>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Trier par" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sales">Ventes (décroissant)</SelectItem>
                          <SelectItem value="revenue">Revenus (décroissant)</SelectItem>
                          <SelectItem value="views">Vues (décroissant)</SelectItem>
                          <SelectItem value="conversion">Taux de conversion</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button variant="outline">
                      <Filter className="h-4 w-4 mr-1" />
                      Filtres avancés
                    </Button>
                  </div>

                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produit</TableHead>
                          <TableHead className="text-right">Ventes</TableHead>
                          <TableHead className="text-right">Revenus</TableHead>
                          <TableHead className="text-right">Vues</TableHead>
                          <TableHead className="text-right">Taux Conv.</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topProducts.map((product, index) => (
                          <TableRow key={index} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/admin/products/${index}`)}>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell className="text-right">{product.sales}</TableCell>
                            <TableCell className="text-right">{formatCurrency(product.revenue)}</TableCell>
                            <TableCell className="text-right">{product.views}</TableCell>
                            <TableCell className="text-right">{product.conversionRate}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance par Produit</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={topProducts}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value, name) => {
                        if (name === 'revenue') return formatCurrency(Number(value));
                        return value;
                      }} />
                      <Legend />
                      <Bar dataKey="sales" fill="#8884d8" name="Ventes" />
                      <Bar dataKey="views" fill="#82ca9d" name="Vues" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Taux de Conversion par Produit</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={topProducts}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="conversionRate" fill="#8884d8" name="Taux de Conversion (%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sales">
            <Card>
              <CardHeader>
                <CardTitle>Analyse des Ventes</CardTitle>
                <CardDescription>
                  Visualisez l'évolution détaillée de vos ventes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip formatter={(value, name) => {
                      if (name === 'revenue') return formatCurrency(Number(value));
                      return value;
                    }} />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="sales" stroke="#8884d8" name="Ventes" />
                    <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#82ca9d" name="Revenus" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories">
            <Card>
              <CardHeader>
                <CardTitle>Performance par Catégorie</CardTitle>
                <CardDescription>
                  Analysez la performance des produits par catégorie
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart outerRadius={150} data={categoryData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="name" />
                    <PolarRadiusAxis angle={30} />
                    <Radar name="Ventes" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inventory">
            <Card>
              <CardHeader>
                <CardTitle>État de l'Inventaire</CardTitle>
                <CardDescription>
                  Surveillez votre inventaire et anticipez les ruptures de stock
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-4">
                  <Card className="flex-1 border-green-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-green-600">
                        Produits en Stock
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">65%</div>
                      <p className="text-xs text-muted-foreground">32 produits</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="flex-1 border-yellow-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-yellow-600">
                        Stock Faible
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">15%</div>
                      <p className="text-xs text-muted-foreground">8 produits</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="flex-1 border-red-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-red-600">
                        Rupture de Stock
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">20%</div>
                      <p className="text-xs text-muted-foreground">10 produits</p>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produit</TableHead>
                        <TableHead className="text-right">Stock</TableHead>
                        <TableHead className="text-right">Seuil Critique</TableHead>
                        <TableHead className="text-right">Dernière Vente</TableHead>
                        <TableHead className="text-right">Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-medium">T-shirt Original</TableCell>
                        <TableCell className="text-right">15</TableCell>
                        <TableCell className="text-right">10</TableCell>
                        <TableCell className="text-right">Il y a 2 heures</TableCell>
                        <TableCell className="text-right">
                          <Badge className="bg-green-100 text-green-800">En stock</Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-medium">Pull Premium</TableCell>
                        <TableCell className="text-right">8</TableCell>
                        <TableCell className="text-right">10</TableCell>
                        <TableCell className="text-right">Il y a 5 heures</TableCell>
                        <TableCell className="text-right">
                          <Badge className="bg-amber-100 text-amber-800">Stock faible</Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-medium">Casquette Urban</TableCell>
                        <TableCell className="text-right">0</TableCell>
                        <TableCell className="text-right">5</TableCell>
                        <TableCell className="text-right">Il y a 3 jours</TableCell>
                        <TableCell className="text-right">
                          <Badge className="bg-red-100 text-red-800">Rupture</Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-medium">Mug Personnalisé</TableCell>
                        <TableCell className="text-right">32</TableCell>
                        <TableCell className="text-right">15</TableCell>
                        <TableCell className="text-right">Il y a 1 jour</TableCell>
                        <TableCell className="text-right">
                          <Badge className="bg-green-100 text-green-800">En stock</Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-medium">Pantalon Cargo</TableCell>
                        <TableCell className="text-right">0</TableCell>
                        <TableCell className="text-right">8</TableCell>
                        <TableCell className="text-right">Il y a 1 semaine</TableCell>
                        <TableCell className="text-right">
                          <Badge className="bg-red-100 text-red-800">Rupture</Badge>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProductAnalytics;