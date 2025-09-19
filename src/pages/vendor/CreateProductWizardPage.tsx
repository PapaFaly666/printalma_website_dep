import React from 'react';
import { ProductCreationWizard } from '../../components/vendor/ProductCreationWizard';

const CreateProductWizardPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <ProductCreationWizard />
    </div>
  );
};

export default CreateProductWizardPage;