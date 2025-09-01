import React, { useState, useEffect } from 'react';
import { authService } from '../../services/auth.service';
import { VendorCountryStats, COUNTRIES_LIST } from '../../types/auth.types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { InlineLoading } from '../ui/loading';
import { Globe, Users, TrendingUp, MapPin, BarChart3 } from 'lucide-react';

interface VendorCountryStatsProps {
  className?: string;
}

const VendorCountryStatsComponent: React.FC<VendorCountryStatsProps> = ({ className = "" }) => {
  const [stats, setStats] = useState<VendorCountryStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.getVendorStatsByCountry();
      setStats(response.stats);
      setTotal(response.total);
    } catch (err: any) {
      console.error('Erreur chargement statistiques par pays:', err);
      setError(err?.message || 'Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  const getCountryFlag = (countryName: string): string => {
    const country = COUNTRIES_LIST.find(c => c.value === countryName || c.label === countryName);
    return country?.flag || '🌍';
  };

  const getProgressBarColor = (index: number): string => {
    const colors = [
      'bg-blue-500',
      'bg-green-500', 
      'bg-yellow-500',
      'bg-purple-500',
      'bg-red-500',
      'bg-indigo-500',
      'bg-pink-500',
      'bg-teal-500'
    ];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Répartition par Pays
          </CardTitle>
        </CardHeader>
        <CardContent>
          <InlineLoading message="Chargement des statistiques..." />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Répartition par Pays
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription className="text-red-600">
              {error}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Répartition par Pays
        </CardTitle>
        <CardDescription>
          Distribution géographique des {total} vendeurs
        </CardDescription>
      </CardHeader>
      <CardContent>
        {stats.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Aucune donnée géographique disponible</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Résumé */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Total vendeurs</span>
              </div>
              <span className="text-lg font-bold text-gray-900">{total}</span>
            </div>

            {/* Liste des pays */}
            <div className="space-y-3">
              {stats.map((countryStat, index) => (
                <div key={countryStat.country} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{getCountryFlag(countryStat.country)}</span>
                      <div>
                        <span className="font-medium text-gray-900">
                          {countryStat.country || 'Non spécifié'}
                        </span>
                        <div className="text-xs text-gray-500">
                          {countryStat.count} vendeur{countryStat.count > 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        {countryStat.percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  
                  {/* Barre de progression */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${getProgressBarColor(index)}`}
                      style={{ width: `${countryStat.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Footer avec indicateur de mise à jour */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  <span>Mis à jour en temps réel</span>
                </div>
                <button
                  onClick={loadStats}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Actualiser
                </button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VendorCountryStatsComponent; 