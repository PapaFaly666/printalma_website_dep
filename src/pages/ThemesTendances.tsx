import React, { useState, useEffect } from "react";
import { designCategoryService, DesignCategory } from "../services/designCategoryService";
import { Loader2 } from "lucide-react";

interface ThemesTendancesProps {
  themes?: DesignCategory[];
}

const ThemesTendances = ({ themes: propThemes }: ThemesTendancesProps = {}) => {
  const [themes, setThemes] = useState<DesignCategory[]>(propThemes || []);
  const [loading, setLoading] = useState(!propThemes);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Si les thèmes sont fournis en props, les utiliser directement
    if (propThemes && propThemes.length > 0) {
      setThemes(propThemes);
      setLoading(false);
      setError(null);
      return;
    }

    // Sinon, charger les thèmes depuis l'API (comportement par défaut)
    const loadFeaturedThemes = async () => {
      try {
        setLoading(true);
        const featuredThemes = await designCategoryService.getFeaturedCategories();
        setThemes(featuredThemes);
        setError(null);
      } catch (err: any) {
        console.error('Erreur lors du chargement des thèmes tendances:', err);
        setError(err.message || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };

    loadFeaturedThemes();
  }, [propThemes]);

  // États de chargement et d'erreur
  if (loading) {
    return (
      <div className="w-full py-12">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Chargement des thèmes tendances...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full py-12">
        <div className="text-center text-red-600">
          <p>Erreur lors du chargement des thèmes tendances</p>
        </div>
      </div>
    );
  }

  if (themes.length === 0) {
    return null; // Ne rien afficher si aucun thème configuré
  }

  // Rendre le layout en fonction du nombre de thèmes
  const renderThemeLayout = () => {
    const [theme1, theme2, theme3, theme4, theme5] = themes;

    return (
      <div className="space-y-1 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-1 lg:gap-2">
        {/* Thème 1 - Principal */}
        {theme1 && (
          <div className="md:col-span-1 lg:col-span-1">
            <div
              className="rounded h-40 sm:h-48 md:h-64 lg:h-80 xl:h-[450px] flex items-end cursor-pointer relative overflow-hidden shadow-lg bg-cover bg-center group transition-transform duration-300 hover:scale-[1.02]"
              style={{ backgroundImage: `url(${theme1.coverImageUrl || 'https://via.placeholder.com/800'})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
              <span className="relative z-10 m-3 sm:m-4 text-white font-bold text-sm sm:text-base md:text-lg lg:text-xl drop-shadow-lg uppercase">
                {theme1.name}
              </span>
            </div>
          </div>
        )}

        {/* Thèmes 2-5 en grille adaptative */}
        <div className="md:col-span-1 lg:col-span-2 grid grid-cols-2 gap-0.5 md:gap-1 lg:gap-2 md:h-64 lg:h-80 xl:h-[450px]">

          {/* Thème 2 - Tall sur desktop */}
          {theme2 && (
            <div className="md:row-span-2">
              <div
                className="rounded h-40 sm:h-48 md:h-full flex items-end cursor-pointer relative overflow-hidden shadow-md bg-cover bg-center group transition-transform duration-300 hover:scale-[1.02]"
                style={{ backgroundImage: `url(${theme2.coverImageUrl || 'https://via.placeholder.com/800'})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                <span className="relative z-10 m-2 sm:m-3 md:m-4 text-white font-bold text-xs sm:text-sm md:text-base lg:text-lg drop-shadow-lg uppercase">
                  {theme2.name}
                </span>
              </div>
            </div>
          )}

          {/* Thème 3 */}
          {theme3 && (
            <div>
              <div
                className="rounded h-40 sm:h-48 md:h-full flex items-end cursor-pointer relative overflow-hidden shadow-md bg-cover bg-center group transition-transform duration-300 hover:scale-[1.02]"
                style={{ backgroundImage: `url(${theme3.coverImageUrl || 'https://via.placeholder.com/800'})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                <span className="relative z-10 m-2 sm:m-3 text-white font-bold text-xs sm:text-sm md:text-base drop-shadow-lg uppercase">
                  {theme3.name}
                </span>
              </div>
            </div>
          )}

          {/* Thème 4 - Hidden sur mobile, visible sur md+ */}
          {theme4 && (
            <div className="hidden md:block md:row-span-2">
              <div
                className="rounded h-full flex items-end cursor-pointer relative overflow-hidden shadow-md bg-cover bg-center group transition-transform duration-300 hover:scale-[1.02]"
                style={{ backgroundImage: `url(${theme4.coverImageUrl || 'https://via.placeholder.com/800'})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                <span className="relative z-10 m-3 md:m-4 text-white font-bold text-sm md:text-base lg:text-lg drop-shadow-lg uppercase">
                  {theme4.name}
                </span>
              </div>
            </div>
          )}

          {/* Thème 5 */}
          {theme5 && (
            <div>
              <div
                className="rounded h-40 sm:h-48 md:h-full flex items-end cursor-pointer relative overflow-hidden shadow-md bg-cover bg-center group transition-transform duration-300 hover:scale-[1.02]"
                style={{ backgroundImage: `url(${theme5.coverImageUrl || 'https://via.placeholder.com/800'})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                <span className="relative z-10 m-2 sm:m-3 text-white font-bold text-xs sm:text-sm md:text-base drop-shadow-lg uppercase">
                  {theme5.name}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Thème 4 visible uniquement sur mobile */}
        {theme4 && (
          <div className="md:hidden col-span-2">
            <div
              className="rounded h-36 sm:h-40 flex items-end cursor-pointer relative overflow-hidden shadow-md bg-cover bg-center group transition-transform duration-300 hover:scale-[1.02]"
              style={{ backgroundImage: `url(${theme4.coverImageUrl || 'https://via.placeholder.com/800'})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
              <span className="relative z-10 m-2 sm:m-3 text-white font-bold text-sm sm:text-base drop-shadow-lg uppercase">
                {theme4.name}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full py-1 md:py-2 pt-6 sm:pt-8 md:pt-10 lg:pt-12">
      {/* Titre principal et bouton sur la même ligne */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-1 px-4 sm:px-8">
        <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-black flex items-center gap-2 sm:gap-3">
          <span className="font-bold">Thèmes tendances</span>
          <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </h2>

        <button className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-200 self-start sm:self-auto">
          Voir Tous les thèmes
        </button>
      </div>

      {/* Container principal */}
      <div className="w-full px-4 sm:px-8">
        {renderThemeLayout()}
      </div>
    </div>
  );
};

export default ThemesTendances;