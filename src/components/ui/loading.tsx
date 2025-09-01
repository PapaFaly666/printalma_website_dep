import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from './skeleton';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

interface InlineLoadingProps {
  message?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

interface LoadingSkeletonProps {
  lines?: number;
  className?: string;
}

// Spinner rotatif moderne (pour les actions)
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <Loader2 
      className={cn(
        'animate-spin text-gray-600',
        sizeClasses[size],
        className
      )} 
    />
  );
};

// Loading inline avec message (pour les boutons)
export const InlineLoading: React.FC<InlineLoadingProps> = ({ 
  message = 'Chargement...', 
  className,
  size = 'md'
}) => {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <LoadingSpinner size={size} />
      <span className="text-sm text-gray-600">{message}</span>
    </div>
  );
};

// Loading pour les boutons
export const ButtonLoading: React.FC<{ message?: string }> = ({ 
  message = 'Chargement...' 
}) => {
  return (
    <div className="flex items-center gap-2">
      <LoadingSpinner size="sm" />
      <span>{message}</span>
    </div>
  );
};

// Skeleton pour les listes de vendeurs/clients
export const VendorsListSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <Skeleton className="h-10 w-24" />
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="border rounded-lg p-6">
            <div className="flex items-center gap-4">
              <Skeleton className="w-12 h-12 rounded-lg" />
              <div>
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-4 w-20 mt-1" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Vendors grid skeleton */}
      <div className="bg-white rounded-lg border">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-0">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="p-6 border-r border-b border-gray-200">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-6 w-24 mt-2" />
                </div>
                <Skeleton className="w-3 h-3 rounded-full" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-4 h-4" />
                  <Skeleton className="h-4 flex-1" />
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="w-4 h-4" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="w-4 h-4" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Skeleton pour les tableaux de clients
export const ClientsTableSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Client', 'Type', 'Contact', 'Statut', 'Dernière connexion', 'Créé le', 'Actions'].map((header) => (
                <th key={header} className="px-6 py-3 text-left">
                  <Skeleton className="h-4 w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {[...Array(5)].map((_, i) => (
              <tr key={i}>
                <td className="px-6 py-4">
                  <div>
                    <Skeleton className="h-4 w-32" />
                    <div className="flex gap-1 mt-1">
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <Skeleton className="w-5 h-5 mr-2" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Skeleton className="h-4 w-40" />
                </td>
                <td className="px-6 py-4">
                  <Skeleton className="h-6 w-16 rounded-full" />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <Skeleton className="w-4 h-4 mr-1" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <Skeleton className="w-4 h-4 mr-1" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <Skeleton className="h-8 w-8 rounded ml-auto" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Skeleton pour les produits en grille
export const ProductsGridSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="border rounded-lg overflow-hidden">
          <Skeleton className="h-48 w-full" />
          <div className="p-4">
            <div className="flex justify-between items-start">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-20 mt-1" />
            <Skeleton className="h-6 w-24 mt-2" />
            <div className="flex items-center mt-1">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-5 w-12 ml-2 rounded-full" />
            </div>
          </div>
          <div className="border-t p-2 bg-gray-50 flex justify-between">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
};

// Skeleton pour les produits en tableau
export const ProductsTableSkeleton: React.FC = () => {
  return (
    <div className="border rounded-md overflow-hidden">
      <table className="min-w-full">
        <thead className="bg-gray-50">
          <tr>
            {['Produit', 'Catégorie', 'Prix', 'Stock', 'Statut', 'Actions'].map((header) => (
              <th key={header} className="px-6 py-3 text-left">
                <Skeleton className="h-4 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {[...Array(5)].map((_, i) => (
            <tr key={i}>
              <td className="px-6 py-4">
                <Skeleton className="h-4 w-40" />
              </td>
              <td className="px-6 py-4">
                <Skeleton className="h-4 w-24" />
              </td>
              <td className="px-6 py-4">
                <Skeleton className="h-4 w-20" />
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center">
                  <Skeleton className="h-4 w-8" />
                  <Skeleton className="h-5 w-16 ml-2 rounded-full" />
                </div>
              </td>
              <td className="px-6 py-4">
                <Skeleton className="h-5 w-16 rounded-full" />
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end space-x-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Skeleton pour les statistiques
export const StatsSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg p-4 border">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-8 w-12 mt-1" />
        </div>
      ))}
    </div>
  );
};

// Skeleton générique pour les listes
export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ 
  lines = 3, 
  className 
}) => {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </div>
  );
};

// Export par défaut pour compatibilité (utilise un skeleton simple)
const PageLoading: React.FC<{ message?: string }> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] space-y-4">
      <LoadingSpinner size="lg" />
      {message && <p className="text-gray-600 text-sm">{message}</p>}
    </div>
  );
};

export { PageLoading };
export default PageLoading; 