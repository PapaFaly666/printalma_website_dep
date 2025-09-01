import React from 'react';
import { ProductFormMain } from '../components/product-form';
import { Toaster } from 'sonner';

const AddProductPage: React.FC = () => {
  return (
    <>
      <ProductFormMain />
      <Toaster 
        position="top-right"
        expand={true}
        richColors
        closeButton
      />
    </>
  );
};

export default AddProductPage; 