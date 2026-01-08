import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Badge } from './ui/badge';
import Button from './ui/Button';
import { 
  Eye, 
  Edit, 
  Trash2, 
  Target, 
  Image as ImageIcon,
  Package,
  Tag,
  DollarSign,
  MoreVertical,
  Star,
  ShoppingCart,
  Calendar,
  User
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

interface ProductCardProps {
  product: {
    id: number;
    name: string;
    description?: string;
    price: number;
    status: string;
    category?: string;
    views?: Array<{
      imageUrl: string;
      delimitations?: Array<{
        id: number;
        name?: string;
        x: number;
        y: number;
        width: number;
        height: number;
      }>;
    }>;
    createdAt?: string;
    updatedAt?: string;
  };
  onView?: (id: number) => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  className?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onView,
  onEdit,
  onDelete,
  className = ''
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Calculer le nombre total de délimitations
  const totalDelimitations = product.views?.reduce(
    (total, view) => total + (view.delimitations?.length || 0), 
    0
  ) || 0;

  // Image principale (première vue disponible)
  const mainImage = product.views?.[0]?.imageUrl;

  // Statut badge
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { variant: 'default' as const, label: 'Actif', color: 'bg-green-500' },
      inactive: { variant: 'secondary' as const, label: 'Inactif', color: 'bg-gray-500' },
      draft: { variant: 'outline' as const, label: 'Brouillon', color: 'bg-yellow-500' },
      archived: { variant: 'destructive' as const, label: 'Archivé', color: 'bg-red-500' }
    };
    
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
  };

  const statusInfo = getStatusBadge(product.status);

  return (
    <Card className={`group hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-200 bg-white overflow-hidden ${className}`}>
      {/* Image avec overlay des délimitations */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {mainImage ? (
          <>
            <img
              src={mainImage}
              alt={product.name}
              className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                setImageError(true);
                setImageLoaded(true);
              }}
            />
            
            {imageError ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <div className="text-center text-gray-400">
                  <ImageIcon className="h-12 w-12 mx-auto mb-2" />
                  <p className="text-sm">Image indisponible</p>
                </div>
              </div>
            ) : (
              // Overlay avec info délimitations
              totalDelimitations > 0 && (
                <div className="absolute top-3 left-3">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg">
                          <Target className="h-3 w-3 mr-1" />
                          {totalDelimitations}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        {totalDelimitations} zone{totalDelimitations > 1 ? 's' : ''} de personnalisation
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )
            )}

            {/* Badge statut */}
            <div className="absolute top-3 right-3">
              <div className="flex items-center space-x-1">
                <div 
                  className={`w-2 h-2 rounded-full ${statusInfo.color}`}
                />
                <Badge variant={statusInfo.variant} className="text-xs bg-white/90 backdrop-blur-sm">
                  {statusInfo.label}
                </Badge>
              </div>
            </div>

            {/* Overlay d'actions (visible au survol) */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <div className="flex space-x-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="bg-white/90 hover:bg-white text-gray-900"
                        onClick={() => onView?.(product.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Voir le produit</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="bg-white/90 hover:bg-white text-gray-900"
                        onClick={() => onEdit?.(product.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Modifier</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </>
        ) : (
          // Placeholder si pas d'image
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <Package className="h-16 w-16 mx-auto mb-3" />
              <p className="text-sm font-medium">Aucune image</p>
            </div>
          </div>
        )}
      </div>

      {/* Contenu de la carte */}
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Titre et prix */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-lg leading-tight group-hover:text-blue-600 transition-colors">
                {product.name}
              </h3>
              {product.category && (
                <div className="flex items-center mt-1 text-sm text-gray-500">
                  <Tag className="h-3 w-3 mr-1" />
                  {product.category}
                </div>
              )}
            </div>
            
            <div className="ml-3 text-right">
              <div className="flex items-center text-lg font-bold text-green-600">
                <DollarSign className="h-4 w-4" />
                {product.price.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {product.description}
            </p>
          )}

          {/* Statistiques */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Target className="h-4 w-4 text-blue-500" />
              <span>{totalDelimitations} zone{totalDelimitations > 1 ? 's' : ''}</span>
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <ImageIcon className="h-4 w-4 text-purple-500" />
              <span>{product.views?.length || 0} vue{(product.views?.length || 0) > 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onView?.(product.id)}
                className="text-xs"
              >
                <Eye className="h-3 w-3 mr-1" />
                Voir
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit?.(product.id)}
                className="text-xs"
              >
                <Edit className="h-3 w-3 mr-1" />
                Modifier
              </Button>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onView?.(product.id)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Voir les détails
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit?.(product.id)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDelete?.(product.id)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Meta information */}
          {product.createdAt && (
            <div className="flex items-center text-xs text-gray-400 pt-2 border-t border-gray-50">
              <Calendar className="h-3 w-3 mr-1" />
              Créé le {new Date(product.createdAt).toLocaleDateString('fr-FR')}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard; 