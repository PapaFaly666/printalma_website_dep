import { CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';

interface SuccessMessageProps {
  navigate: (path: string) => void;
}

const SuccessMessage: React.FC<SuccessMessageProps> = ({ navigate }) => (
  <div className="py-8 text-center">
    <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
      <CheckCircle2 className="text-green-600" size={32} />
    </div>
    <h3 className="text-xl font-medium mb-2">Commande validée avec succès!</h3>
    <p className="text-gray-500 mb-6">Nous avons reçu votre paiement et votre commande est en cours de traitement.</p>
    <p className="text-gray-500 mb-6">Un email de confirmation a été envoyé à votre adresse.</p>
    <Button onClick={() => navigate('/')} size="lg">
      Fermer
    </Button>
  </div>
);

export default SuccessMessage;
