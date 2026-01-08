import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { Store } from 'lucide-react';

const VendorPendingPage: React.FC = () => {
  const location = useLocation();
  const email = (location.state as any)?.email as string | undefined;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-900 px-4 py-10">
      <div className="text-center space-y-6 max-w-md">
        <div className="mx-auto w-16 h-16 rounded-full bg-black flex items-center justify-center shadow-lg">
          <Store className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          🎉 Inscription réussie !
        </h1>
        <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
          Votre compte est créé et est maintenant en attente d'activation par le SuperAdmin.
          Vous recevrez un email dès qu'il sera actif.
        </p>
        {email && (
          <p className="text-sm text-gray-500">Email: <span className="font-medium">{email}</span></p>
        )}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Button asChild className="bg-black text-white px-6 py-3">
            <Link to="/vendeur/login">Retour à la connexion</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VendorPendingPage; 