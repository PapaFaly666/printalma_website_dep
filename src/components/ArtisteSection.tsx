// import React from 'react'; // unused

export default function ArtistesSection() {
  return (
    <div className="w-full bg-gray-100 py-1 md:py-2">
      {/* Titre principal et bouton sur la même ligne */}
      <div className="flex items-center justify-between mb-1 px-4 sm:px-8">
        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-3">
          <span className="font-bold">Artistes</span>
          <img src="x_artiste.svg" alt="Artistes" className="w-6 h-6 md:w-8 md:h-8" />
        </h2>
        
        <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
          Voir Tous les artistes
        </button>
      </div>

      {/* Container principal */}
      <div className="w-full px-4 sm:px-8">
        <div className="rounded p-4 md:p-6" style={{ backgroundColor: '#049BE5' }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-center">

            {/* Colonne gauche - Grille des artistes */}
            <div className="grid grid-cols-3 grid-rows-2 gap-1 md:gap-2 w-full h-64 md:h-72 lg:h-80">
              {/* Ligne 1 - Ebu Jomlong */}
              <div className="relative rounded overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop&crop=face" 
                  alt="Ebu Jomlong" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/70 to-transparent p-1 md:p-2 text-left">
                  <span className="text-white text-xs md:text-sm font-bold">Ebu Jomlong</span>
                </div>
              </div>

              {/* Ligne 1 - Dip Poundou Guiss (2 colonnes) */}
              <div className="relative col-span-2 rounded overflow-hidden">
                <img 
                  src="https://www.musicinafrica.net/sites/default/files/images/article/202312/dipdoundouguiss.jpg" 
                  alt="Dip Poundou Guiss" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/70 to-transparent p-1 md:p-2 text-left">
                  <span className="text-white text-xs md:text-sm font-bold">Dip Poundou Guiss</span>
                </div>
              </div>

              {/* Ligne 2 - Massamba Amadeus */}
              <div className="relative rounded overflow-hidden">
                <img 
                  src="https://i.ytimg.com/vi/l2Mb3Q0zmTM/maxresdefault.jpg"
                  alt="Massamba Amadeus" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/70 to-transparent p-1 md:p-2 text-left">
                  <span className="text-white text-xs md:text-sm font-bold">Massamba Amadeus</span>
                </div>
              </div>

              {/* Ligne 2 - Amina Abed */}
              <div className="relative rounded overflow-hidden">
                <img 
                  src="https://www.booska-p.com/wp-content/uploads/2023/09/Werenoi-CR-Visu-News.jpg" 
                  alt="Amina Abed" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/70 to-transparent p-1 md:p-2 text-left">
                  <span className="text-white text-xs md:text-sm font-bold">Amina Abed</span>
                </div>
              </div>

              {/* Ligne 2 - Mut Cash */}
              <div className="relative rounded overflow-hidden">
                <img 
                  src="https://www.musicinafrica.net/sites/default/files/images/article/202205/mist.jpg" 
                  alt="Mut Cash" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/70 to-transparent p-1 md:p-2 text-left">
                  <span className="text-white text-xs md:text-sm font-bold">Mut Cash</span>
                </div>
              </div>
            </div>

            {/* Colonne droite - Section merchandising */}
            <div className="text-white flex flex-col justify-center text-center px-2 md:px-4 h-64 md:h-72 lg:h-80">
              <h3 className="text-xl md:text-2xl lg:text-3xl font-bold mb-3 uppercase tracking-wide">
                MERCHANDISING MUSICAL
              </h3>
              <p className="text-sm md:text-base mb-4 leading-relaxed max-w-md mx-auto text-center">
                Soutenez vos artistes favoris avec leur merchandising officiel. Des t-shirts aux accessoires, portez fièrement l'univers de vos stars préférées.
              </p>
              <button className="bg-white text-[#049BE5] px-4 py-2 rounded-md font-semibold text-sm hover:bg-gray-100 transition-colors duration-200 self-center">
                Découvrir
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}