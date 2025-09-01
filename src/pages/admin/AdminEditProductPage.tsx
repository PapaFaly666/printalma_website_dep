import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ProductFormMain } from '../../components/product-form';

const AdminEditProductPage: React.FC = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<any>(null);

  useEffect(() => {
    async function fetchProduct() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`https://printalma-back-dep.onrender.com/products/${id}`, {
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Erreur lors du chargement du produit');
        const data = await res.json();
        setProduct({
          ...data,
          categories: (data.categories || []).map((c: any) => typeof c === 'string' ? c : c.name),
          sizes: (data.sizes || []).map((s: any) => typeof s === 'string' ? s : s.sizeName),
        });
      } catch (e: any) {
        setError(e.message || 'Erreur lors du chargement du produit');
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-gray-500">Chargement...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!product) return null;

  return (
    <ProductFormMain
      initialData={product}
      mode="edit"
      productId={id}
      onProductPatched={setProduct}
    />
  );
};

export default AdminEditProductPage; 