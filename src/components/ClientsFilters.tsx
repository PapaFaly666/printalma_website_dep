import React from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Search, Filter, RotateCcw } from 'lucide-react';
import { 
  ListClientsQuery, 
  VendeurType, 
  ClientStatusFilter,
  SELLER_TYPE_CONFIG 
} from '../types/auth.types';

interface ClientsFiltersProps {
  filters: ListClientsQuery;
  onFiltersChange: (filters: Partial<ListClientsQuery>) => void;
  onReset: () => void;
  loading?: boolean;
}

export const ClientsFilters: React.FC<ClientsFiltersProps> = ({
  filters,
  onFiltersChange,
  onReset,
  loading = false
}) => {
  const handleSearchChange = (search: string) => {
    onFiltersChange({ search: search || undefined });
  };

  const handleStatusChange = (status: string) => {
    const statusValue = status === 'all' ? undefined : status === 'active';
    onFiltersChange({ status: statusValue });
  };

  const handleTypeChange = (vendeur_type: string) => {
    onFiltersChange({ 
      vendeur_type: vendeur_type === 'all' ? undefined : vendeur_type as VendeurType 
    });
  };

  const handleSortChange = (sort_by: string) => {
    onFiltersChange({ 
      sort_by: sort_by === 'default' ? undefined : sort_by as 'created_at' | 'last_login_at' | 'firstName' | 'lastName'
    });
  };

  const handleSortOrderChange = (sort_order: string) => {
    onFiltersChange({ 
      sort_order: sort_order as 'ASC' | 'DESC'
    });
  };

  const currentStatusFilter: ClientStatusFilter = 
    filters.status === undefined ? 'all' : 
    filters.status ? 'active' : 'inactive';

  return (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Filter className="w-5 h-5" />
          Filtres de recherche
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {/* Recherche */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recherche
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Nom, prénom ou email..."
                value={filters.search || ''}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
                disabled={loading}
              />
            </div>
          </div>

          {/* Statut */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Statut
            </label>
            <Select
              value={currentStatusFilter}
              onValueChange={handleStatusChange}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">✅ Actifs uniquement</SelectItem>
                <SelectItem value="inactive">❌ Inactifs uniquement</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Type de vendeur */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type de vendeur
            </label>
            <Select
              value={filters.vendeur_type || 'all'}
              onValueChange={handleTypeChange}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {Object.values(SELLER_TYPE_CONFIG).map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Trier par */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trier par
            </label>
            <Select
              value={filters.sort_by || 'default'}
              onValueChange={handleSortChange}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tri" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Par défaut</SelectItem>
                <SelectItem value="created_at">Date de création</SelectItem>
                <SelectItem value="last_login_at">Dernière connexion</SelectItem>
                <SelectItem value="firstName">Prénom</SelectItem>
                <SelectItem value="lastName">Nom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Ordre de tri */}
          {filters.sort_by && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ordre
              </label>
              <Select
                value={filters.sort_order || 'ASC'}
                onValueChange={handleSortOrderChange}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ordre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ASC">Croissant</SelectItem>
                  <SelectItem value="DESC">Décroissant</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Par page */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Par page
            </label>
            <Select
              value={(filters.limit || 10).toString()}
              onValueChange={(value) => onFiltersChange({ limit: parseInt(value) })}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Limite" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end mt-4">
          <Button
            variant="outline"
            onClick={onReset}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Réinitialiser
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}; 