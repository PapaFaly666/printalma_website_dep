import { useNavigate } from 'react-router-dom';

export default function InfluenceursSection() {
  const navigate = useNavigate();
  return (
    <div className="w-full py-0 sm:py-1 md:py-2 pt-4 xs:pt-6 sm:pt-8 md:pt-10 lg:pt-12">
      {/* Titre principal */}
      <div className="flex items-center justify-between mb-1 px-3 xs:px-4 sm:px-6">
        <h2 className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-black flex items-center gap-1.5 xs:gap-2 sm:gap-3">
          <span className="font-bold">Influenceurs</span>
          <img src="/x_inlfuancer.svg" alt="Influencer" className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
        </h2>
      </div>

      {/* Container principal */}
      <div className="w-full px-3 xs:px-4 sm:px-6">
        <div className="rounded-md p-2 xs:p-2.5 sm:p-3 md:p-4 lg:p-6 flex flex-col md:flex-row items-center justify-between text-white shadow-lg h-auto min-h-[12rem] xs:min-h-[16rem] sm:min-h-[20rem] md:h-[28rem] lg:h-[36rem]" style={{backgroundColor: '#E5042B'}}>

          {/* Texte à gauche */}
          <div className="md:w-1/2 flex flex-col justify-center text-center px-2 xs:px-3 sm:px-4 h-full">
            <h2 className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 xs:mb-4 sm:mb-5 md:mb-6 uppercase tracking-wide leading-tight">
              Influenceurs Partenaires
            </h2>
            <p className="text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl mb-3 xs:mb-4 sm:mb-5 md:mb-6 leading-relaxed max-w-md mx-auto px-1">
              Explorez les univers créatifs de vos influenceurs préférés
              et adoptez leurs designs signature.
            </p>
            <button
              onClick={() => navigate('/influenceurs')}
              className="bg-white text-[#E5042B] px-3 xs:px-4 py-1.5 xs:py-2 rounded-md font-semibold text-[10px] xs:text-xs sm:text-sm hover:bg-gray-100 transition-colors duration-200 self-center"
            >
              Voir Tous les influenceurs
            </button>
          </div>

          {/* Grille compacte des influenceurs */}
          <div className="md:w-1/2 grid grid-cols-3 gap-0.5 xs:gap-1 sm:gap-1 md:gap-2 mt-3 xs:mt-4 sm:mt-4 md:mt-0 md:ml-3 xs:ml-4 sm:ml-4 h-48 xs:h-56 sm:h-64 md:h-80 lg:h-96 xl:h-[32rem]">

            {/* Grande carte colonne gauche */}
            <div className="row-span-2 bg-gray-800 rounded overflow-hidden relative group shadow-md">
              <img
                src="https://tse2.mm.bing.net/th/id/OIP.HWgGD1gYH8ZRHC9Cs2CnGAHaHa?rs=1&pid=ImgDetMain&o=7&rm=3"
                alt="Bathie Drizzy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1 xs:p-1.5 md:p-2">
                <p className="text-white text-[9px] xs:text-[10px] sm:text-xs md:text-sm font-semibold leading-tight">Bathie Drizzy</p>
              </div>
            </div>

            {/* Deux petites cartes en haut */}
            <div className="bg-gray-800 rounded overflow-hidden relative group shadow-md">
              <img
                src="https://tse4.mm.bing.net/th/id/OIP._Ej2qNEVtKsCJJlRYGQGKwHaJQ?rs=1&pid=ImgDetMain&o=7&rm=3"
                alt="Latzo Dozé"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-0.5 xs:p-1">
                <p className="text-white text-[8px] xs:text-[9px] sm:text-xs font-medium leading-tight">Latzo Dozé</p>
              </div>
            </div>

            <div className="bg-gray-800 rounded overflow-hidden relative group shadow-md">
              <img
                src="https://th.bing.com/th/id/R.d8ab980609f6027de425903340ab85c7?rik=EbNyFnBAlMUuyA&riu=http%3a%2f%2finfosrewmi.com%2fwp-content%2fuploads%2f2019%2f04%2fJaaw-Ketchup-lance-un-message.jpg&ehk=oDqmSCK%2bJj2p9vcySE2eUZC32B9IEpVkru%2bDZzEofIY%3d&risl=&pid=ImgRaw&r=0"
                alt="Jaaw Ketchup"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-0.5 xs:p-1">
                <p className="text-white text-[8px] xs:text-[9px] sm:text-xs font-medium leading-tight">Jaaw Ketchup</p>
              </div>
            </div>

            {/* Grande carte au milieu */}
            <div className="row-span-2 bg-gray-800 rounded overflow-hidden relative group shadow-md">
              <img
                src="https://kawtef.com/wp-content/uploads/2022/11/91AC7CFA-9682-4FDE-BF6F-F62D6FA9B7E8-854x1024.jpeg"
                alt="Dudu FDV"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1 xs:p-1.5 md:p-2">
                <p className="text-white text-[9px] xs:text-[10px] sm:text-xs md:text-sm font-semibold leading-tight">Dudu FDV</p>
              </div>
            </div>

            {/* Adja Everywhere */}
            <div className="row-span-2 bg-gray-800 rounded overflow-hidden relative group shadow-md">
              <img
                src="https://www.senenews.com/wp-content/uploads/2024/07/img_3115.jpeg"
                alt="Adja Everywhere"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1 xs:p-1.5 md:p-2">
                <p className="text-white text-[9px] xs:text-[10px] sm:text-xs md:text-sm font-medium leading-tight">Adja Everywhere</p>
              </div>
            </div>

            {/* Pape Sidy Fall */}
            <div className="bg-gray-800 rounded overflow-hidden relative group shadow-md">
              <img
                src="https://sunubuzzsn.com/wp-content/uploads/2023/03/Pape-Sidy-Fall.png"
                alt="Pape Sidy Fall"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-0.5 xs:p-1">
                <p className="text-white text-[8px] xs:text-[9px] sm:text-xs font-medium leading-tight">Pape Sidy Fall</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}