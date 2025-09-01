import React from "react";

export default function DesignersSection() {
  return (
    <div className="w-full bg-gray-100 py-1 md:py-2">
      {/* Titre principal et bouton sur la même ligne */}
      <div className="flex items-center justify-between mb-1 px-4 sm:px-8">
        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-black flex items-center gap-3">
          <span className="font-bold">Designers</span>
          <img src="/x_designer.svg" alt="Designer" className="w-6 h-6 md:w-8 md:h-8" />
        </h2>
        
        <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
          Voir Tous les designers
        </button>
      </div>

      {/* Container principal */}
      <div className="w-full px-4 sm:px-8">
        <div className="rounded overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 h-80 lg:h-96">
            
            {/* Colonne gauche */}
            <div className="text-black flex flex-col justify-center items-center px-6 py-8 bg-yellow-400 text-center">
              <h3 className="text-2xl md:text-3xl font-bold mb-4 uppercase tracking-wide">
                DESIGNS EXCLUSIFS
              </h3>
              <p className="text-sm md:text-base mb-6 leading-relaxed max-w-md mx-auto">
                Découvrez des milliers de designs exclusifs créés par nos designers.
                Des motifs tendance aux illustrations artistiques, pour vos produits
                personnalisés.
              </p>
              <button className="bg-white text-black px-6 py-2 rounded-md font-semibold text-sm hover:bg-gray-100 transition-colors duration-200">
                Découvrir
              </button>
            </div>

            {/* Colonne droite - Grille designers stylisée */}
            <div className="bg-yellow-400 relative">
              <div className="grid grid-cols-3 gap-1 md:gap-2 p-3 md:p-4 h-full auto-rows-fr">
                
                {/* Designer 1 - Grande carte */}
                <div className="row-span-2 bg-black rounded overflow-hidden relative group flex flex-col items-center justify-center text-white">
                  <img src="/x_pap_musa.svg" alt="Pap Musa" className="w-12 h-12 md:w-16 md:h-16 mb-2 group-hover:scale-110 transition-transform duration-300" />
                  <span className="text-xs md:text-sm font-bold">Pap Musa</span>
                </div>

                {/* Designer 2 */}
                <div className="bg-black rounded overflow-hidden relative group flex flex-col items-center justify-center text-white">
                  <img src="/x_ceeneer.svg" alt="Ceeneer" className="w-10 h-10 md:w-12 md:h-12 mb-1 group-hover:scale-110 transition-transform duration-300" />
                  <span className="text-xs font-bold italic">Ceeneer</span>
                  <span className="text-xs opacity-80 hidden md:block">Ibrahima Diop</span>
                </div>

                {/* Designer 3 */}
                <div className="bg-black rounded overflow-hidden relative group flex flex-col items-center justify-center text-white">
                  <img src="/x_kethiakh.svg" alt="K & C" className="w-10 h-10 md:w-12 md:h-12 mb-1 group-hover:scale-110 transition-transform duration-300" />
                  <span className="text-xs md:text-sm font-bold">K & C</span>
                </div>

                {/* Designer 4 - Grande carte */}
                <div className="row-span-2 bg-black rounded overflow-hidden relative group flex flex-col items-center justify-center text-white">
                  <img src="/x_breadwinner.svg" alt="Breadwinner" className="w-12 h-12 md:w-16 md:h-16 mb-2 group-hover:scale-110 transition-transform duration-300" />
                  <span className="text-xs md:text-sm font-bold">Breadwinner</span>
                </div>

                {/* Designer 5 - Grande carte */}
                <div className="row-span-2 bg-black rounded overflow-hidden relative group flex flex-col items-center justify-center text-white">
                  <img src="/x_maisssa_biguey.svg" alt="Meissa Biguey" className="w-12 h-12 md:w-16 md:h-16 mb-2 group-hover:scale-110 transition-transform duration-300" />
                  <span className="text-xs md:text-sm font-bold">Meissa Biguey</span>
                </div>

                {/* Designer 6 */}
                <div className="bg-black rounded overflow-hidden relative group flex flex-col items-center justify-center text-white">
                  <img src="/x_dad.svg" alt="DAD" className="w-10 h-10 md:w-12 md:h-12 mb-1 group-hover:scale-110 transition-transform duration-300" />
                  <span className="text-xs md:text-sm font-bold">DAD</span>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}