import React, { useState, useEffect } from 'react';
import { useVendors } from '../hooks/useVendors';
import { formatLastLoginDate, formatJoinDate, getSellerTypeIcon, getSellerTypeLabel } from '../types/auth.types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Building2, 
  Mail, 
  Calendar, 
  Star,
  TrendingUp,
  Clock,
  Users,
  RefreshCw,
  AlertCircle,
  LogIn,
  MoreHorizontal,
  Shield,
  ShieldOff,
  Key,
  Unlock,
  AlertTriangle
} from 'lucide-react';
import { VendorsListSkeleton, StatsSkeleton, LoadingSpinner } from './ui/loading';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from './ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface VendorsListProps {
  showStats?: boolean;
  compact?: boolean;
}

export const VendorsList: React.FC<VendorsListProps> = ({ 
  showStats = true, 
  compact = false 
}) => {
  const {
    vendors,
    stats,
    total,
    loading,
    statsLoading,
    error,
    statsError,
    refreshAll,
    clearError,
    clearStatsError
  } = useVendors();

  const handleRefresh = () => {
    refreshAll();
  };

  const clearAllErrors = () => {
    clearError();
    clearStatsError();
  };

  if (loading && vendors.length === 0) {
    return (
      <div className="py-20">
        <VendorsListSkeleton />
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      {/* Header avec refresh */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {total} Vendeur{total > 1 ? 's' : ''} Actif{total > 1 ? 's' : ''}
          </h2>
          <p className="text-gray-600 mt-1">
            Membres de la communauté PrintAlma
          </p>
        </div>
        
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={loading || statsLoading}
          className="border-gray-300 hover:bg-gray-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${(loading || statsLoading) ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Erreurs */}
      {(error || statsError) && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-800">
            {error || statsError}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllErrors}
              className="ml-2 h-auto p-1 text-red-600 hover:bg-red-100"
            >
              ✕
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Statistiques */}
      {showStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statsLoading ? (
            <div className="col-span-3 flex items-center justify-center py-12">
              <StatsSkeleton />
            </div>
          ) : (
            stats.map((stat) => (
              <Card key={stat.type} className="border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">{stat.icon}</span>
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-gray-900">
                          {stat.count}
                        </div>
                        <div className="text-sm text-gray-600">
                          {stat.label}{stat.count > 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Liste des vendeurs */}
      <div className="bg-white rounded-lg border border-gray-200">
        {vendors.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucun vendeur trouvé
            </h3>
            <p className="text-gray-600">
              Il n'y a actuellement aucun autre vendeur actif sur la plateforme.
            </p>
          </div>
        ) : (
          <div className={`grid gap-0 ${compact ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'}`}>
            {vendors.map((vendor, index) => (
              <div
                key={vendor.id}
                className={`p-6 hover:bg-gray-50 transition-colors ${
                  index % (compact ? 2 : 4) !== (compact ? 1 : 3) ? 'border-r border-gray-200' : ''
                } ${
                  index < vendors.length - (compact ? 2 : 4) ? 'border-b border-gray-200' : ''
                }`}
              >
                {/* Header vendeur */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 text-lg">
                      {vendor.firstName} {vendor.lastName}
                    </h4>
                    <Badge variant="outline" className="mt-2 bg-gray-50 border-gray-300">
                      {getSellerTypeIcon(vendor.vendeur_type)} {getSellerTypeLabel(vendor.vendeur_type)}
                    </Badge>
                  </div>
                  
                  {/* Indicateur d'activité */}
                  {vendor.last_login_at && (
                    <div className={`w-3 h-3 rounded-full ${
                      (() => {
                        const lastLogin = new Date(vendor.last_login_at!);
                        const now = new Date();
                        const diffInHours = (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60);
                        
                        if (diffInHours < 24) return 'bg-green-500';
                        if (diffInHours < 24 * 7) return 'bg-yellow-500';
                        return 'bg-gray-400';
                      })()
                    }`} />
                  )}
                </div>

                {/* Informations vendeur */}
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="truncate">{vendor.email}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>Inscrit le {formatJoinDate(vendor.created_at)}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <LogIn className="w-4 h-4 text-gray-400" />
                    <span>
                      {vendor.last_login_at 
                        ? `${formatLastLoginDate(vendor.last_login_at)}`
                        : 'Jamais connecté'
                      }
                    </span>
                  </div>
                </div>

                {/* Statut d'activité */}
                {vendor.last_login_at && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 font-medium">ACTIVITÉ</span>
                      <span className={`text-xs font-medium ${
                        (() => {
                          const lastLogin = new Date(vendor.last_login_at!);
                          const now = new Date();
                          const diffInHours = (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60);
                          
                          if (diffInHours < 24) return 'text-green-600';
                          if (diffInHours < 24 * 7) return 'text-yellow-600';
                          return 'text-gray-500';
                        })()
                      }`}>
                        {(() => {
                          const lastLogin = new Date(vendor.last_login_at!);
                          const now = new Date();
                          const diffInHours = (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60);
                          
                          if (diffInHours < 24) return 'ACTIF';
                          if (diffInHours < 24 * 7) return 'RÉCENT';
                          return 'INACTIF';
                        })()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorsList; 