import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import Button from '../components/ui/Button';
import { ChevronRight, ArrowRight } from 'lucide-react';

// Define the type for a theme
interface Theme {
  id: number;
  name: string;
  description: string;
  coverImage?: string;
  category?: string;
  status: string;
  featured?: boolean;
  productCount?: number;
  createdAt?: string;
}

const ThemeTendance: React.FC = () => {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleThemeClick = (themeId: number) => {
    navigate(`/themes/${themeId}`);
  };

  useEffect(() => {
    const fetchThemes = async () => {
      try {
        setLoading(true);
        
        // Utiliser fetch direct sans credentials pour les routes publiques
        const response = await fetch('/api/themes', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const responseData = await response.json();
        
        console.log('Réponse API thèmes:', responseData);
        
        if (responseData && responseData.data) {
          // Gérer différentes structures de réponse possibles
          let themesData = [];
          
          if (Array.isArray(responseData.data)) {
            // Structure directe: responseData.data est un tableau
            themesData = responseData.data;
          } else if (responseData.data.data && Array.isArray(responseData.data.data)) {
            // Structure imbriquée: responseData.data.data est un tableau
            themesData = responseData.data.data;
          } else if (responseData.data.success && responseData.data.data && Array.isArray(responseData.data.data)) {
            // Structure avec success: responseData.data.data est un tableau
            themesData = responseData.data.data;
          } else {
            console.warn('Structure de réponse API inattendue pour les thèmes:', responseData);
            setThemes([]);
            return;
          }
          
          // Filtrer uniquement les thèmes actifs et avec des produits
          const activeThemes = themesData.filter((theme: Theme) => 
            theme.status === 'active' && theme.productCount && theme.productCount > 0
          );
          
          console.log('Thèmes actifs filtrés:', activeThemes);
          
          // Limiter à 6 thèmes maximum
          setThemes(activeThemes.slice(0, 6));
        } else {
          console.warn('Réponse API invalide pour les thèmes:', responseData);
          setThemes([]);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des thèmes:', error);
        setThemes([]);
      } finally {
        setLoading(false); 
      }
    };

    fetchThemes();
  }, []);

  if (loading) {
    return (
      <section className="w-full bg-background py-8 lg:py-12 px-4 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 lg:mb-8 space-y-2 sm:space-y-0">
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold text-foreground">Thèmes tendances</h2>
              <p className="text-muted-foreground text-sm">Explorez nos collections et trouvez l'inspiration</p>
            </div>
          </div>
          
          {/* Loading skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, index) => (
              <Card key={index} className="overflow-hidden border-muted shadow-sm">
                <div className="relative h-64 overflow-hidden">
                  <div className="w-full h-full bg-gray-200 animate-pulse"></div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Si aucun thème n'est disponible, ne pas afficher la section
  if (themes.length === 0) {
    return null;
  }

  return (
    <section className="w-full bg-background py-8 lg:py-12 px-4 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 lg:mb-8 space-y-2 sm:space-y-0">
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground">Thèmes tendances</h2>
            <p className="text-muted-foreground text-sm">Explorez nos collections et trouvez l'inspiration</p>
          </div>

          <Button 
            variant="outline" 
            className="group flex items-center gap-2"
            onClick={() => navigate('/themes')}
          >
            Voir tous les thèmes
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        {/* Grille de thèmes avec shadcn */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {themes.map((theme: Theme) => (
            <Card
              key={theme.id}
              className="group overflow-hidden border-muted shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
              onClick={() => handleThemeClick(theme.id)}
            >
              <div className="relative h-64 overflow-hidden">
                <img
                  src={theme.coverImage || "/api/placeholder/800/400"}
                  alt={`Thème ${theme.name}`}
                  className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex flex-col justify-end p-6">
                  <div className="mb-2 transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <Badge variant="outline" className="bg-black/40 text-white border-white/20 backdrop-blur-sm">
                      {theme.category || 'Collection'}
                    </Badge>
                  </div>

                  <h3 className="text-xl lg:text-2xl font-medium text-white mb-2">
                    {theme.name}
                  </h3>

                  <p className="text-white/80 text-sm mb-3 line-clamp-2">
                    {theme.description}
                  </p>

                  <div className="flex items-center justify-between transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <span className="text-white text-sm">{theme.productCount} produit(s)</span>
                    <div className="flex items-center">
                      <span className="text-white text-sm">Découvrir</span>
                      <ChevronRight className="ml-1 w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ThemeTendance;
