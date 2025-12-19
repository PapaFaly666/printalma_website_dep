import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useVendorProfile } from '../../hooks/useVendorProfile';
import { VendorProfileSetupPage } from '../../pages/vendor/VendorProfileSetupPage';

interface VendorDashboardGuardProps {
  children: React.ReactNode;
}

export const VendorDashboardGuard: React.FC<VendorDashboardGuardProps> = ({ children }) => {
  const location = useLocation();
  const { profileStatus, loading } = useVendorProfile();

  // Pendant le chargement, on affiche un spinner discret
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de votre profil...</p>
        </div>
      </div>
    );
  }

  // 🔄 NOUVEAU COMPORTEMENT : Ne plus rediriger automatiquement
  // La bannière ProfileCompletionBanner s'affichera dans le dashboard si le profil n'est pas complet
  // Cela permet au vendeur de naviguer librement tout en étant rappelé à compléter son profil
  // C'est le comportement standard des apps modernes (Instagram, LinkedIn, etc.)

  // On laisse toujours passer, la bannière fera le rappel
  return <>{children}</>;
};

export default VendorDashboardGuard;
