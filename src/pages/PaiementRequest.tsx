import { useState } from 'react';
import { 
  CreditCard, 
  History, 
  ChevronRight, 
  Send, 
  Download, 
  ArrowRight,
  Phone
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useOutletContext } from 'react-router-dom';

const PaymentRequest = () => {
  // Get isDarkMode from context, defaulting to false if not provided
  const { isDarkMode = false } = useOutletContext<{ isDarkMode?: boolean }>() || {};
  const [amount, setAmount] = useState('');
  const [requestMethod, setRequestMethod] = useState('wave');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [description, setDescription] = useState('');

  // Recent payment requests (would normally come from an API)
  const recentRequests = [
    {
      id: '1',
      date: '12 Mai 2025',
      amount: '45,000 FCFA',
      method: 'Wave',
      status: 'Complété'
    },
    {
      id: '2',
      date: '5 Mai 2025',
      amount: '23,500 FCFA',
      method: 'Orange Money',
      status: 'En attente'
    },
    {
      id: '3',
      date: '28 Avril 2025',
      amount: '67,200 FCFA',
      method: 'Wave',
      status: 'Complété'
    },
    {
      id: '4',
      date: '15 Avril 2025',
      amount: '32,000 FCFA',
      method: 'Orange Money',
      status: 'Refusé'
    }
  ];

  // Earnings summary data
  const earningsData = [
    { label: 'Ce mois', value: '182,500 FCFA' },
    { label: 'En attente', value: '23,500 FCFA' },
    { label: 'Disponible', value: '159,000 FCFA' }
  ];

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    // Handle submission logic here
    alert(`Demande de paiement de ${amount} FCFA envoyée via ${requestMethod === 'wave' ? 'Wave' : 'Orange Money'}`);
  };

  const getStatusClass = (status: any) => {
    switch(status) {
      case 'Complété':
        return isDarkMode ? 'text-gray-300' : 'text-gray-700';
      case 'En attente':
        return isDarkMode ? 'text-gray-400' : 'text-gray-500';
      case 'Refusé':
        return isDarkMode ? 'text-gray-500' : 'text-gray-800';
      default:
        return '';
    }
  };

  const getMethodIcon = (method: any) => {
    if (method === 'Wave') {
      return <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800">W</div>;
    } else {
      return <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800">O</div>;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex flex-col gap-6 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Demande de Paiement</h1>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Historique
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {earningsData.map((item, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardDescription className="text-sm">{item.label}</CardDescription>
                <CardTitle className="text-2xl font-bold">{item.value}</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center">
                <CreditCard className="mr-2 h-5 w-5" />
                Nouvelle Demande
              </CardTitle>
              <CardDescription>
                Créez une demande de paiement pour vos ventes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form  className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Montant (FCFA)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Montant en FCFA"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="focus:ring-2 focus:ring-gray-400"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="method">Méthode de Paiement</Label>
                  <Select value={requestMethod} onValueChange={setRequestMethod}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sélectionnez une méthode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wave">Wave</SelectItem>
                      <SelectItem value="orange">Orange Money</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Numéro de Téléphone</Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                      +221
                    </span>
                    <Input
                      id="phone"
                      type="tel"
                      className="rounded-l-none focus:ring-2 focus:ring-gray-400"
                      placeholder="77 123 45 67"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Produits vendus)</Label>
                  <Input
                    id="description"
                    placeholder="Ex: 2 T-shirts, 1 Mug"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="focus:ring-2 focus:ring-gray-400"
                    required
                  />
                </div>
                
                <Button type="submit" className="w-full bg-black dark:bg-white dark:text-black text-white hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors">
                  <Send className="mr-2 h-4 w-4" />
                  Envoyer la demande
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center">
                <History className="mr-2 h-5 w-5" />
                Dernières Demandes
              </CardTitle>
              <CardDescription>
                Vos demandes de paiement récentes
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue="all" className="w-full">
                <div className="px-6 pt-2">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="all">Toutes</TabsTrigger>
                    <TabsTrigger value="pending">En attente</TabsTrigger>
                    <TabsTrigger value="completed">Complétées</TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="all" className="pt-2">
                  <div className="divide-y divide-gray-200 dark:divide-gray-800">
                    {recentRequests.map((request) => (
                      <div key={request.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {getMethodIcon(request.method)}
                            <div>
                              <p className="text-sm font-medium">{request.amount}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{request.date}</p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <span className={`text-xs ${getStatusClass(request.status)}`}>
                              {request.status}
                            </span>
                            <ChevronRight className="ml-2 h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="pending" className="pt-2">
                  <div className="divide-y divide-gray-200 dark:divide-gray-800">
                    {recentRequests.filter(r => r.status === 'En attente').map((request) => (
                      <div key={request.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {getMethodIcon(request.method)}
                            <div>
                              <p className="text-sm font-medium">{request.amount}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{request.date}</p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <span className={`text-xs ${getStatusClass(request.status)}`}>
                              {request.status}
                            </span>
                            <ChevronRight className="ml-2 h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="completed" className="pt-2">
                  <div className="divide-y divide-gray-200 dark:divide-gray-800">
                    {recentRequests.filter(r => r.status === 'Complété').map((request) => (
                      <div key={request.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {getMethodIcon(request.method)}
                            <div>
                              <p className="text-sm font-medium">{request.amount}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{request.date}</p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <span className={`text-xs ${getStatusClass(request.status)}`}>
                              {request.status}
                            </span>
                            <ChevronRight className="ml-2 h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="border-t border-gray-200 dark:border-gray-800">
              <Button variant="ghost" className="w-full text-sm">
                Voir tout l'historique
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center">
              <Phone className="mr-2 h-5 w-5" />
              Contact Support
            </CardTitle>
            <CardDescription>
              Besoin d'aide avec vos paiements?
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Notre équipe est disponible du lundi au vendredi, de 9h à 18h.</p>
              <p className="mt-2 text-sm">Email: <span className="font-medium">support@votresite.com</span></p>
              <p className="mt-1 text-sm">Téléphone: <span className="font-medium">+221 77 123 45 67</span></p>
            </div>
            <Button variant="outline" className="whitespace-nowrap">
              Contacter le Support
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentRequest;