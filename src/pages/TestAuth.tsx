import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useNavigate } from 'react-router-dom';

declare global {
  interface Window {
    runAuthTest?: () => void;
  }
}

const TestAuth: React.FC = () => {
  const { user, isAuthenticated, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const runTest = () => {
    if (window.runAuthTest) {
      window.runAuthTest();
    } else {
      alert('Test API non disponible. Ouvrez la console pour plus de détails.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">🧪 Page de Test Auth</h1>

        <Card>
          <CardHeader>
            <CardTitle>Statut de l'authentification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <span>Authentifié:</span>
              <Badge variant={isAuthenticated ? "default" : "destructive"}>
                {isAuthenticated ? "✅ OUI" : "❌ NON"}
              </Badge>
            </div>

            {user && (
              <div className="space-y-2">
                <div><strong>Nom:</strong> {user.firstName} {user.lastName}</div>
                <div><strong>Email:</strong> {user.email}</div>
                <div><strong>Rôle:</strong> {user.role}</div>
                <div><strong>Statut:</strong> {user.status ? "Actif" : "Inactif"}</div>
                <div><strong>ID:</strong> {user.id}</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions de test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={runTest} className="w-full">
              🧪 Lancer le test API complet
            </Button>

            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={() => navigate('/admin/dashboard')}
              >
                Tableau de bord admin
              </Button>

              <Button
                variant="outline"
                onClick={() => navigate('/admin/orders')}
              >
                Gestion des commandes
              </Button>
            </div>

            <Button
              variant="destructive"
              onClick={handleLogout}
              className="w-full"
            >
              Se déconnecter
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Vérifiez que vous êtes bien authentifié ci-dessus</li>
              <li>Cliquez sur "Lancer le test API complet" pour tester les endpoints</li>
              <li>Ouvrez la console (F12) pour voir les détails du test</li>
              <li>Utilisez les boutons de navigation pour tester les pages</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestAuth;