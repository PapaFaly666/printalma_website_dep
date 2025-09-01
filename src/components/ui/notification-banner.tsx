import React from 'react';
import { Rocket, Mail, CheckCircle, Clock } from 'lucide-react';

interface NotificationBannerProps {
  type: 'admin' | 'vendor';
  className?: string;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({ 
  type, 
  className = "" 
}) => {
  // 🔄 Désormais aucune bannière spécifique côté admin
  if (type === 'admin') {
    return null;
  }

  // Bannière vendeur
  return (
    <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 ${className}`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <Rocket className="w-4 h-4 text-white" />
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
            🚀 Nouveau Système de Publication (Décembre 2024)
          </h3>
          <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
            <div className="flex items-start gap-2">
              <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>
                <strong>Notification automatique :</strong> Quand vous créez un design, les administrateurs sont automatiquement notifiés par email.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>
                <strong>Design validé :</strong> Vos produits passent en statut <span className="font-mono bg-blue-100 dark:bg-blue-800 px-1 rounded text-xs">DRAFT</span> - vous choisissez quand les publier.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <Rocket className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>
                <strong>Contrôle total :</strong> Publiez vos produits manuellement au moment qui vous convient le mieux !
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
              📝 Prêt à publier = Design validé
            </span>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300">
              📋 À valider = En attente admin
            </span>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
              ✅ Publié = Visible aux clients
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}; 