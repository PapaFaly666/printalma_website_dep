import React from "react";

export default function InfluenceursSection() {
  return (
    <div className="w-full py-1 md:py-2 pt-6 sm:pt-8 md:pt-10 lg:pt-12">
      {/* Titre principal et bouton sur la même ligne */}
      <div className="flex items-center justify-between mb-1 px-4 sm:px-8">
        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-black flex items-center gap-3">
          <span className="font-bold">Influenceurs</span>
          <img src="/x_inlfuancer.svg" alt="Influencer" className="w-6 h-6 md:w-8 md:h-8" />
        </h2>
        
        <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
          Voir Tous les influenceurs
        </button>
      </div>

      {/* Container principal */}
      <div className="w-full px-4 sm:px-8">
        <div className="rounded p-4 md:p-6 flex flex-col md:flex-row items-center justify-between text-white shadow-lg h-80 lg:h-96" style={{backgroundColor: '#E5042B'}}>
          
          {/* Texte à gauche */}
          <div className="md:w-1/2 space-y-3 text-center md:text-left">
            <h2 className="text-xl md:text-2xl font-bold uppercase tracking-wide">
              Influenceurs Partenaires
            </h2>
            <p className="text-sm md:text-base leading-relaxed opacity-90">
              Explorez les univers créatifs de vos influenceurs préférés
              et adoptez leurs designs signature.
            </p>
            <button className="bg-white px-4 py-2 rounded-lg font-semibold shadow hover:scale-105 transition-transform duration-200 text-sm" style={{color: '#E5042B'}}>
              Découvrir
            </button>
          </div>

          {/* Grille compacte des influenceurs */}
          <div className="md:w-1/2 grid grid-cols-3 gap-1 md:gap-2 mt-4 md:mt-0 md:ml-4 h-56 md:h-64 lg:h-72">
            
            {/* Grande carte colonne gauche */}
            <div className="row-span-2 bg-gray-800 rounded overflow-hidden relative group shadow-md">
              <img 
                src="https://tse2.mm.bing.net/th/id/OIP.HWgGD1gYH8ZRHC9Cs2CnGAHaHa?rs=1&pid=ImgDetMain&o=7&rm=3" 
                alt="Bathie Drizzy" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1 md:p-2">
                <p className="text-white text-xs md:text-sm font-semibold">Bathie Drizzy</p>
              </div>
            </div>

            {/* Deux petites cartes en haut */}
            <div className="bg-gray-800 rounded overflow-hidden relative group shadow-md">
              <img 
                src="https://tse4.mm.bing.net/th/id/OIP._Ej2qNEVtKsCJJlRYGQGKwHaJQ?rs=1&pid=ImgDetMain&o=7&rm=3" 
                alt="Latzo Dozé" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1">
                <p className="text-white text-xs font-medium">Latzo Dozé</p>
              </div>
            </div>

            <div className="bg-gray-800 rounded overflow-hidden relative group shadow-md">
              <img 
                src="https://th.bing.com/th/id/R.d8ab980609f6027de425903340ab85c7?rik=EbNyFnBAlMUuyA&riu=http%3a%2f%2finfosrewmi.com%2fwp-content%2fuploads%2f2019%2f04%2fJaaw-Ketchup-lance-un-message.jpg&ehk=oDqmSCK%2bJj2p9vcySE2eUZC32B9IEpVkru%2bDZzEofIY%3d&risl=&pid=ImgRaw&r=0" 
                alt="Jaaw Ketchup" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1">
                <p className="text-white text-xs font-medium">Jaaw Ketchup</p>
              </div>
            </div>

            {/* Grande carte au milieu */}
            <div className="row-span-2 bg-gray-800 rounded overflow-hidden relative group shadow-md">
              <img 
                src="https://kawtef.com/wp-content/uploads/2022/11/91AC7CFA-9682-4FDE-BF6F-F62D6FA9B7E8-854x1024.jpeg" 
                alt="Dudu FDV" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1 md:p-2">
                <p className="text-white text-xs md:text-sm font-semibold">Dudu FDV</p>
              </div>
            </div>

            {/* Adja Everywhere */}
            <div className="row-span-2 bg-gray-800 rounded overflow-hidden relative group shadow-md">
              <img 
                src="https://www.senenews.com/wp-content/uploads/2024/07/img_3115.jpeg" 
                alt="Adja Everywhere" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1 md:p-2">
                <p className="text-white text-xs md:text-sm font-medium">Adja Everywhere</p>
              </div>
            </div>

            {/* Pape Sidy Fall */}
            <div className="bg-gray-800 rounded overflow-hidden relative group shadow-md">
              <img 
                src="https://sunubuzzsn.com/wp-content/uploads/2023/03/Pape-Sidy-Fall.png" 
                alt="Pape Sidy Fall" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1">
                <p className="text-white text-xs font-medium">Pape Sidy Fall</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}