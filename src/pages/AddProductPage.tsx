import React from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { ProductFormMain } from '../components/product-form';
import { Toaster } from 'sonner';

const AddProductPage: React.FC = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  // Détecter le mode édition
  const isEditMode = searchParams.get('edit') !== null;
  const editProduct = location.state?.editProduct || null;
  const editProductId = searchParams.get('edit');

  return (
    <>
      <ProductFormMain 
        editMode={isEditMode}
        initialProduct={editProduct}
        editProductId={editProductId ? parseInt(editProductId) : undefined}
      />
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