import { useNavigate } from 'react-router-dom';
import Button from './ui/Button';

export default function ArtistesSection() {
  const navigate = useNavigate();
  return (
    <div className="w-full py-0 sm:py-1 md:py-2 pt-4 xs:pt-6 sm:pt-8 md:pt-10 lg:pt-12">
      
      {/* Container principal */}
      <div className="w-full px-3 xs:px-4 sm:px-6">
        <div className="rounded-2xl p-2 xs:p-2.5 sm:p-3 md:p-4 lg:p-6" style={{ backgroundColor: '#14689a' }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 xs:gap-3 sm:gap-4 items-center">

            {/* Colonne gauche - Grille des artistes */}
            <div className="grid grid-cols-3 grid-rows-2 gap-0.5 xs:gap-1 sm:gap-1 md:gap-2 w-full min-h-[16rem] xs:min-h-[20rem] sm:min-h-[24rem] lg:h-[28rem] xl:h-[36rem]">
              {/* Ligne 1 - Ebu Jomlong */}
              <div className="relative rounded-2xl overflow-hidden group">
                <img
                  src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop&crop=face"
                  alt="Ebu Jomlong"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 xs:p-2.5 md:p-3 text-left opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500 ease-in-out">
                  <span className="text-white text-xs xs:text-sm md:text-base font-bold leading-tight">Ebu Jomlong</span>
                </div>
              </div>

              {/* Ligne 1 - Dip Poundou Guiss (2 colonnes) */}
              <div className="relative col-span-2 rounded-2xl overflow-hidden group">
                <img
                  src="https://www.musicinafrica.net/sites/default/files/images/article/202312/dipdoundouguiss.jpg"
                  alt="Dip Poundou Guiss"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 xs:p-2.5 md:p-3 text-left opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500 ease-in-out">
                  <span className="text-white text-xs xs:text-sm md:text-base font-bold leading-tight">Dip Poundou Guiss</span>
                </div>
              </div>

              {/* Ligne 2 - Massamba Amadeus */}
              <div className="relative rounded-2xl overflow-hidden group">
                <img
                  src="https://i.ytimg.com/vi/l2Mb3Q0zmTM/maxresdefault.jpg"
                  alt="Massamba Amadeus"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 xs:p-2.5 md:p-3 text-left opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500 ease-in-out">
                  <span className="text-white text-xs xs:text-sm md:text-base font-bold leading-tight">Massamba Amadeus</span>
                </div>
              </div>

              {/* Ligne 2 - Amina Abed */}
              <div className="relative rounded-2xl overflow-hidden group">
                <img
                  src="https://www.booska-p.com/wp-content/uploads/2023/09/Werenoi-CR-Visu-News.jpg"
                  alt="Amina Abed"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 xs:p-2.5 md:p-3 text-left opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500 ease-in-out">
                  <span className="text-white text-xs xs:text-sm md:text-base font-bold leading-tight">Amina Abed</span>
                </div>
              </div>

              {/* Ligne 2 - Mut Cash */}
              <div className="relative rounded-2xl overflow-hidden group">
                <img
                  src="https://www.musicinafrica.net/sites/default/files/images/article/202205/mist.jpg"
                  alt="Mut Cash"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 xs:p-2.5 md:p-3 text-left opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500 ease-in-out">
                  <span className="text-white text-xs xs:text-sm md:text-base font-bold leading-tight">Mut Cash</span>
                </div>
              </div>
            </div>

            {/* Colonne droite - Section merchandising */}
            <div className="text-white flex flex-col justify-center text-center px-2 xs:px-3 sm:px-4 py-4 min-h-[12rem] xs:min-h-[16rem] sm:min-h-[20rem] lg:h-[28rem] xl:h-[36rem]">
              <img
                src="/Asset 36.svg"
                alt="Music Icon"
                className="w-20 h-20 xs:w-24 xs:h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-36 lg:h-36 xl:w-40 xl:h-40 mb-3 xs:mb-4 sm:mb-5 md:mb-6 mx-auto"
              />
              <h3 className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 xs:mb-4 sm:mb-5 md:mb-6 uppercase tracking-wide leading-tight max-w-5xl mx-auto">
                INFLUENCEURS PARTENAIRES
              </h3>
              <p className="text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl mb-3 xs:mb-4 sm:mb-5 md:mb-6 leading-relaxed max-w-5xl mx-auto px-2">
                Explorez les univers créatifs de vos influenceurs préférés et adoptez leurs designs signature.
              </p>
              <Button
                onClick={() => navigate('/artistes')}
                variant="outline"
                size="xl"
                className="bg-[#e61d2c] text-white hover:bg-red-700 px-6 xs:px-8 py-2.5 xs:py-3 sm:px-10 sm:py-4 md:px-12 md:py-4 text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl font-medium self-center"
              >
                Découvrir
              </Button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}