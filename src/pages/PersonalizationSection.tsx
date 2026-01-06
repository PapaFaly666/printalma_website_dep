import { useNavigate } from 'react-router-dom';

export default function PersonalizationSection() {
  const navigate = useNavigate();

  const handleChooseProduct = () => {
    // Rediriger vers la page des articles filtrés pour choisir un produit
    navigate('/filtered-articles');
  };

  return (
    <div className="w-full py-0 sm:py-1 md:py-2 pt-4 xs:pt-6 sm:pt-8 md:pt-10 lg:pt-12">


      <div className="w-full px-3 xs:px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 xs:gap-2 md:gap-3 lg:gap-4 items-stretch">

          {/* Section vidéo à gauche */}
          <div className="relative">
            <div className="bg-gray-100 rounded p-2 xs:p-3 sm:p-3 md:p-4 h-56 xs:h-64 sm:h-80 md:h-96 lg:h-[450px] xl:h-[550px] flex items-center justify-center relative overflow-hidden shadow-md">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/0OxCkRW4b0o?si=eS6fnVPG4JGSD71A"
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                className="absolute inset-0 rounded"
              ></iframe>
            </div>
          </div>

          {/* Section contenu à droite */}
          <div className="bg-yellow-400 rounded p-2 xs:p-2.5 sm:p-3 md:p-4 lg:p-6 shadow-md h-auto min-h-56 xs:min-h-64 sm:h-80 md:h-96 lg:h-[450px] xl:h-[550px] flex flex-col justify-center text-center overflow-hidden">
            <div className="space-y-1 xs:space-y-1.5 sm:space-y-2 md:space-y-3 lg:space-y-4 px-1">
              <h2 className="text-[11px] xs:text-xs sm:text-sm md:text-base lg:text-lg xl:text-2xl font-bold text-black uppercase leading-tight px-1">
                PERSONNALISEZ UN PRODUIT QUI VOUS IDENTIFIE
              </h2>

              <p className="text-black font-medium text-[10px] xs:text-xs sm:text-sm md:text-base lg:text-lg px-2">
                Chaque étape est pensée pour que vous soyez le créateur et créatif !
              </p>

              <div className="space-y-1 xs:space-y-1.5 sm:space-y-2 md:space-y-3 max-w-full mx-auto mt-2 xs:mt-3 sm:mt-4 md:mt-6 lg:mt-8 px-1">
                <div className="flex items-start gap-1.5 xs:gap-2 sm:gap-2.5">
                  <span className="bg-black text-yellow-400 w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 rounded-full flex items-center justify-center text-[10px] xs:text-xs sm:text-sm md:text-base font-bold flex-shrink-0 mt-0">1</span>
                  <p className="text-black text-[10px] xs:text-xs sm:text-sm md:text-base lg:text-lg font-medium text-left leading-snug">Choisissez votre produit</p>
                </div>

                <div className="flex items-start gap-1.5 xs:gap-2 sm:gap-2.5">
                  <span className="bg-black text-yellow-400 w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 rounded-full flex items-center justify-center text-[10px] xs:text-xs sm:text-sm md:text-base font-bold flex-shrink-0 mt-0">2</span>
                  <p className="text-black text-[10px] xs:text-xs sm:text-sm md:text-base lg:text-lg font-medium text-left leading-snug">Sélectionnez ou importez un design</p>
                </div>

                <div className="flex items-start gap-1.5 xs:gap-2 sm:gap-2.5">
                  <span className="bg-black text-yellow-400 w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 rounded-full flex items-center justify-center text-[10px] xs:text-xs sm:text-sm md:text-base font-bold flex-shrink-0 mt-0">3</span>
                  <p className="text-black text-[10px] xs:text-xs sm:text-sm md:text-base lg:text-lg font-medium text-left leading-snug">Personnalisez à votre façon</p>
                </div>

                <div className="flex items-start gap-1.5 xs:gap-2 sm:gap-2.5">
                  <span className="bg-black text-yellow-400 w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 rounded-full flex items-center justify-center text-[10px] xs:text-xs sm:text-sm md:text-base font-bold flex-shrink-0 mt-0">4</span>
                  <p className="text-black text-[10px] xs:text-xs sm:text-sm md:text-base lg:text-lg font-medium text-left leading-snug">Validez votre commande</p>
                </div>

                <div className="flex items-start gap-1.5 xs:gap-2 sm:gap-2.5">
                  <span className="bg-black text-yellow-400 w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 rounded-full flex items-center justify-center text-[10px] xs:text-xs sm:text-sm md:text-base font-bold flex-shrink-0 mt-0">5</span>
                  <p className="text-black text-[10px] xs:text-xs sm:text-sm md:text-base lg:text-lg font-medium text-left leading-snug">Recevez votre création chez vous</p>
                </div>
              </div>

              <button
                onClick={handleChooseProduct}
                className="mt-3 xs:mt-4 sm:mt-6 bg-white text-black px-2 xs:px-3 py-1 xs:py-1.5 sm:px-4 sm:py-2 md:px-6 md:py-3 lg:px-8 lg:py-4 rounded-lg font-semibold text-[10px] xs:text-xs sm:text-sm md:text-base lg:text-lg hover:bg-gray-100 transition-colors duration-200 mx-auto"
              >
                Choisir son produit
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}