import React from 'react';
import VendorSidebar from '../components/VendorSidebar';
import OnboardingAlert from '../components/vendor/OnboardingAlert';

export const VendorLayout: React.FC = () => {
  return (
    <>
      <OnboardingAlert />
      <VendorSidebar />
    </>
  );
}; 