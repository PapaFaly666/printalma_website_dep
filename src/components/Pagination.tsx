import React from 'react';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { PaginationInfo } from '../types/auth.types';

interface PaginationProps {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
  pagination,
  onPageChange,
  loading = false
}) => {
  const { page, totalPages, hasPrevious, hasNext, total, limit } = pagination;

  const generatePageNumbers = (): number[] => {
    const pages: number[] = [];
    const maxVisiblePages = 7;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Toujours afficher la première page
      pages.push(1);
      
      let start = Math.max(2, page - 2);
      let end = Math.min(totalPages - 1, page + 2);
      
      // Ajuster la plage si on est près du début ou de la fin
      if (page <= 3) {
        end = Math.min(totalPages - 1, 5);
      }
      if (page >= totalPages - 2) {
        start = Math.max(2, totalPages - 4);
      }
      
      // Ajouter des points de suspension si nécessaire
      if (start > 2) {
        pages.push(-1); // -1 représente les points de suspension
      }
      
      // Ajouter les pages du milieu
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      // Ajouter des points de suspension si nécessaire
      if (end < totalPages - 1) {
        pages.push(-2); // -2 représente les points de suspension
      }
      
      // Toujours afficher la dernière page (si elle n'est pas déjà incluse)
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const pageNumbers = generatePageNumbers();
  
  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  if (totalPages <= 1) {
    return (
      <div className="flex items-center justify-between px-6 py-3 bg-white border-t border-gray-200">
        <div className="text-sm text-gray-700">
          <span className="font-medium">{total}</span> résultat{total > 1 ? 's' : ''} au total
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-6 py-3 bg-white border-t border-gray-200">
      {/* Info pagination */}
      <div className="flex-1 flex justify-between sm:hidden">
        <Button
          variant="outline"
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrevious || loading}
          size="sm"
        >
          Précédent
        </Button>
        <Button
          variant="outline"
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNext || loading}
          size="sm"
        >
          Suivant
        </Button>
      </div>

      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Affichage de{' '}
            <span className="font-medium">{startItem}</span>
            {' '}à{' '}
            <span className="font-medium">{endItem}</span>
            {' '}sur{' '}
            <span className="font-medium">{total}</span>
            {' '}résultats
          </p>
        </div>

        <div>
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            {/* Première page */}
            <Button
              variant="outline"
              onClick={() => onPageChange(1)}
              disabled={page === 1 || loading}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md text-sm font-medium"
              title="Première page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>

            {/* Page précédente */}
            <Button
              variant="outline"
              onClick={() => onPageChange(page - 1)}
              disabled={!hasPrevious || loading}
              className="relative inline-flex items-center px-2 py-2 text-sm font-medium"
              title="Page précédente"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Numéros de pages */}
            {pageNumbers.map((pageNum, index) => {
              if (pageNum === -1 || pageNum === -2) {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                  >
                    ...
                  </span>
                );
              }

              const isCurrentPage = pageNum === page;
              
              return (
                <Button
                  key={pageNum}
                  variant={isCurrentPage ? "default" : "outline"}
                  onClick={() => onPageChange(pageNum)}
                  disabled={loading}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-medium ${
                    isCurrentPage 
                      ? 'bg-black text-white border-black' 
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </Button>
              );
            })}

            {/* Page suivante */}
            <Button
              variant="outline"
              onClick={() => onPageChange(page + 1)}
              disabled={!hasNext || loading}
              className="relative inline-flex items-center px-2 py-2 text-sm font-medium"
              title="Page suivante"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Dernière page */}
            <Button
              variant="outline"
              onClick={() => onPageChange(totalPages)}
              disabled={page === totalPages || loading}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md text-sm font-medium"
              title="Dernière page"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </nav>
        </div>
      </div>
    </div>
  );
}; 