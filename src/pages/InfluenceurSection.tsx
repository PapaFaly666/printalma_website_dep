import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';

export default function InfluenceursSection() {
  const navigate = useNavigate();
  return (
    <div className="w-full py-0 sm:py-1 md:py-2 pt-4 xs:pt-6 sm:pt-8 md:pt-10 lg:pt-12">
      

      {/* Container principal */}
      <div className="w-full px-3 xs:px-4 sm:px-6">
        <div className="rounded-2xl p-2 xs:p-2.5 sm:p-3 md:p-4 lg:p-6 flex flex-col md:flex-row items-center justify-between text-white shadow-lg h-auto min-h-[12rem] xs:min-h-[16rem] sm:min-h-[20rem] md:h-[28rem] lg:h-[36rem]" style={{backgroundColor: '#e61d2c'}}>

          {/* Texte à gauche */}
          <div className="md:w-1/2 flex flex-col justify-center text-center px-2 xs:px-3 sm:px-4 h-full">
            <img
              src="/Asset 34.svg"
              alt="Influencer Icon"
              className="w-20 h-20 xs:w-24 xs:h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-36 lg:h-36 xl:w-40 xl:h-40 mb-3 xs:mb-4 sm:mb-5 md:mb-6 mx-auto"
            />
            <h2 className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 xs:mb-4 sm:mb-5 md:mb-6 uppercase tracking-wide leading-tight">
              MERCHANDISING MUSICAL
            </h2>
            <p className="text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl mb-3 xs:mb-4 sm:mb-5 md:mb-6 leading-relaxed max-w-md mx-auto px-1">
              Soutenez vos artistes favoris avec leur merchandising officiel. Des t-shirts aux accessoires, portez fièrement l'univers de vos musiciens préférés.
            </p>
            <Button
              onClick={() => navigate('/influenceurs')}
              variant="outline"
              size="xl"
              className="bg-white text-black hover:bg-gray-100 px-4 py-1.5 xs:px-6 xs:py-2 sm:px-10 sm:py-4 md:px-12 md:py-4 text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl font-medium self-center border-transparent min-h-[32px] xs:min-h-[36px] sm:min-h-[56px] rounded-lg xs:rounded-xl sm:rounded-full"
            >
              Découvrir
            </Button>
          </div>

          {/* Grille compacte des influenceurs */}
          <div className="md:w-1/2 grid grid-cols-3 gap-0.5 xs:gap-1 sm:gap-1 md:gap-2 mt-3 xs:mt-4 sm:mt-4 md:mt-0 md:ml-3 xs:ml-4 sm:ml-4 h-48 xs:h-56 sm:h-64 md:h-80 lg:h-96 xl:h-[32rem]">

            {/* Grande carte colonne gauche */}
            <div className="row-span-2 bg-gray-800 rounded-2xl overflow-hidden relative group shadow-md">
              <img
                src="https://tse2.mm.bing.net/th/id/OIP.HWgGD1gYH8ZRHC9Cs2CnGAHaHa?rs=1&pid=ImgDetMain&o=7&rm=3"
                alt="Bathie Drizzy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 xs:p-2.5 md:p-3 text-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500 ease-in-out">
                <p className="text-white text-xs xs:text-sm md:text-base font-semibold leading-tight">Bathie Drizzy</p>
              </div>
            </div>

            {/* Deux petites cartes en haut */}
            <div className="bg-gray-800 rounded-2xl overflow-hidden relative group shadow-md">
              <img
                src="https://tse4.mm.bing.net/th/id/OIP._Ej2qNEVtKsCJJlRYGQGKwHaJQ?rs=1&pid=ImgDetMain&o=7&rm=3"
                alt="Latzo Dozé"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 xs:p-2.5 md:p-3 text-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500 ease-in-out">
                <p className="text-white text-xs xs:text-sm md:text-base font-semibold leading-tight">Latzo Dozé</p>
              </div>
            </div>

            <div className="bg-gray-800 rounded-2xl overflow-hidden relative group shadow-md">
              <img
                src="https://th.bing.com/th/id/R.d8ab980609f6027de425903340ab85c7?rik=EbNyFnBAlMUuyA&riu=http%3a%2f%2finfosrewmi.com%2fwp-content%2fuploads%2f2019%2f04%2fJaaw-Ketchup-lance-un-message.jpg&ehk=oDqmSCK%2bJj2p9vcySE2eUZC32B9IEpVkru%2bDZzEofIY%3d&risl=&pid=ImgRaw&r=0"
                alt="Jaaw Ketchup"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 xs:p-2.5 md:p-3 text-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500 ease-in-out">
                <p className="text-white text-xs xs:text-sm md:text-base font-semibold leading-tight">Jaaw Ketchup</p>
              </div>
            </div>

            {/* Grande carte au milieu */}
            <div className="row-span-2 bg-gray-800 rounded-2xl overflow-hidden relative group shadow-md">
              <img
                src="https://kawtef.com/wp-content/uploads/2022/11/91AC7CFA-9682-4FDE-BF6F-F62D6FA9B7E8-854x1024.jpeg"
                alt="Dudu FDV"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 xs:p-2.5 md:p-3 text-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500 ease-in-out">
                <p className="text-white text-xs xs:text-sm md:text-base font-semibold leading-tight">Dudu FDV</p>
              </div>
            </div>

            {/* Adja Everywhere */}
            <div className="row-span-2 bg-gray-800 rounded-2xl overflow-hidden relative group shadow-md">
              <img
                src="https://www.senenews.com/wp-content/uploads/2024/07/img_3115.jpeg"
                alt="Adja Everywhere"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 xs:p-2.5 md:p-3 text-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500 ease-in-out">
                <p className="text-white text-xs xs:text-sm md:text-base font-semibold leading-tight">Adja Everywhere</p>
              </div>
            </div>

            {/* Pape Sidy Fall */}
            <div className="bg-gray-800 rounded-2xl overflow-hidden relative group shadow-md">
              <img
                src="https://sunubuzzsn.com/wp-content/uploads/2023/03/Pape-Sidy-Fall.png"
                alt="Pape Sidy Fall"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 xs:p-2.5 md:p-3 text-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500 ease-in-out">
                <p className="text-white text-xs xs:text-sm md:text-base font-semibold leading-tight">Pape Sidy Fall</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}