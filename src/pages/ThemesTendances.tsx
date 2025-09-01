import React from "react";

const ThemesTendances = () => {
  // URLs des images pour chaque thème
  const themeImages = {
    theme1: "https://m.media-amazon.com/images/M/MV5BYzhkODE3NjEtYzVkNC00OWQ5LTk5ZjItNWI5MzI0YjdiNTg4XkEyXkFqcGc@._V1_.jpg",
    theme2: "https://www.nextplz.fr/wp-content/uploads/nextplz/2025/05/mort-de-werenoi-apres-leur-duo-gims-lui-rend-un-hommage-bouleversant.jpg",
    theme3: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&q=80&w=800",
    theme4: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800",
    theme5: "https://static.wixstatic.com/media/e96aef_27347120c7c24a3d8ac4a00165bae4a9~mv2.jpg/v1/fill/w_640,h_632,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/e96aef_27347120c7c24a3d8ac4a00165bae4a9~mv2.jpg",
  };

  return (
    <div className="w-full bg-white py-1 md:py-2">
      {/* Titre principal et bouton sur la même ligne */}
      <div className="flex items-center justify-between mb-1 px-4 sm:px-8">
        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-black flex items-center gap-3">
          <span className="font-bold">Thèmes tendances</span>
          <svg className="w-6 h-6 md:w-8 md:h-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </h2>
        
        <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
          Voir Tous les thèmes
        </button>
      </div>

      {/* Container principal */}
      <div className="w-full px-4 sm:px-8">
        {/* En-tête avec bouton */}
        <div className="flex justify-end items-center mb-1">
        </div>

        {/* Layout mobile-first responsive */}
        <div className="space-y-1 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-1 lg:gap-2">
          
          {/* Thème 1 - Principal */}
          <div className="md:col-span-1 lg:col-span-1">
            <div
              className="rounded h-48 sm:h-56 md:h-80 lg:h-[450px] flex items-end cursor-pointer relative overflow-hidden shadow-lg bg-cover bg-center group transition-transform duration-300 hover:scale-[1.02]"
              style={{ backgroundImage: `url(${themeImages.theme1})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
              <span className="relative z-10 m-4 text-white font-bold text-lg md:text-xl drop-shadow-lg">
                MANGAS ET ANIME
              </span>
            </div>
          </div>

          {/* Thèmes 2-5 en grille adaptative */}
          <div className="md:col-span-1 lg:col-span-2 grid grid-cols-2 gap-0.5 md:gap-1 lg:gap-2 md:h-80 lg:h-[450px]">
            
            {/* Thème 2 - Tall sur desktop */}
            <div className="md:row-span-2">
              <div
                className="rounded h-48 md:h-full flex items-end cursor-pointer relative overflow-hidden shadow-md bg-cover bg-center group transition-transform duration-300 hover:scale-[1.02]"
                style={{ backgroundImage: `url(${themeImages.theme2})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                <span className="relative z-10 m-3 md:m-4 text-white font-bold text-base md:text-lg drop-shadow-lg">
                  RAP
                </span>
              </div>
            </div>

            {/* Thème 3 */}
            <div>
              <div
                className="rounded h-48 md:h-full flex items-end cursor-pointer relative overflow-hidden shadow-md bg-cover bg-center group transition-transform duration-300 hover:scale-[1.02]"
                style={{ backgroundImage: `url(${themeImages.theme3})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                <span className="relative z-10 m-3 text-white font-bold text-sm md:text-base drop-shadow-lg">
                  GAMING
                </span>
              </div>
            </div>

            {/* Thème 4 - Hidden sur mobile, visible sur md+ */}
            <div className="hidden md:block md:row-span-2">
              <div
                className="rounded h-full flex items-end cursor-pointer relative overflow-hidden shadow-md bg-cover bg-center group transition-transform duration-300 hover:scale-[1.02]"
                style={{ backgroundImage: `url(${themeImages.theme4})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                <span className="relative z-10 m-3 md:m-4 text-white font-bold text-base md:text-lg drop-shadow-lg">
                  MUSIQUE
                </span>
              </div>
            </div>

            {/* Thème 5 */}
            <div>
              <div
                className="rounded h-48 md:h-full flex items-end cursor-pointer relative overflow-hidden shadow-md bg-cover bg-center group transition-transform duration-300 hover:scale-[1.02]"
                style={{ backgroundImage: `url(${themeImages.theme5})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                <span className="relative z-10 m-3 text-white font-bold text-sm md:text-base drop-shadow-lg">
                  ART
                </span>
              </div>
            </div>
          </div>

          {/* Thème 4 visible uniquement sur mobile */}
          <div className="md:hidden col-span-2">
            <div
              className="rounded h-40 flex items-end cursor-pointer relative overflow-hidden shadow-md bg-cover bg-center group transition-transform duration-300 hover:scale-[1.02]"
              style={{ backgroundImage: `url(${themeImages.theme4})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
              <span className="relative z-10 m-3 text-white font-bold text-base drop-shadow-lg">
                MUSIQUE
              </span>
            </div>
          </div>
        </div>

        {/* Indicateur de plus de contenu sur mobile */}
        <div className="mt-1 text-center md:hidden">
          <p className="text-gray-600 text-sm">Faites défiler horizontalement pour plus de thèmes</p>
        </div>
      </div>
    </div>
  );
};

export default ThemesTendances;