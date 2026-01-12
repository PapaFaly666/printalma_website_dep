import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';

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
            <div className="bg-gray-100 rounded-2xl p-2 xs:p-3 sm:p-3 md:p-4 h-64 xs:h-72 sm:h-96 md:h-[28rem] lg:h-[550px] xl:h-[650px] 2xl:h-[700px] flex items-center justify-center relative overflow-hidden shadow-md">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/0OxCkRW4b0o?si=eS6fnVPG4JGSD71A"
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                className="absolute inset-0 rounded-2xl"
              ></iframe>
            </div>
          </div>

          {/* Section contenu à droite */}
          <div className="rounded-2xl p-2 xs:p-2.5 sm:p-3 md:p-4 lg:p-6 shadow-md h-auto min-h-64 xs:min-h-72 sm:h-96 md:h-[28rem] lg:h-[550px] xl:h-[650px] 2xl:h-[700px] flex flex-col justify-center text-center overflow-hidden" style={{ backgroundColor: '#f1d12d' }}>
            <div className="space-y-1 xs:space-y-1.5 sm:space-y-2 md:space-y-3 lg:space-y-4 px-1">
              <h2 className="text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-black text-black uppercase leading-tight px-1">
                PERSONNALISEZ UN PRODUIT QUI VOUS IDENTIFIE
              </h2>

              <p className="text-black font-bold text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl px-2">
                Chaque étape est pensée pour que vous soyez le créateur et créatif !
              </p>

              <div className="space-y-1 xs:space-y-1.5 sm:space-y-2 md:space-y-3 max-w-md mx-auto mt-2 xs:mt-3 sm:mt-4 md:mt-6 lg:mt-8 px-1">
                <div className="flex items-start gap-1.5 xs:gap-2 sm:gap-2.5">
                  <span className="text-black text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold flex-shrink-0">1.</span>
                  <p className="text-black text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-medium text-left leading-snug">Choisissez votre produit</p>
                </div>

                <div className="flex items-start gap-1.5 xs:gap-2 sm:gap-2.5">
                  <span className="text-black text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold flex-shrink-0">2.</span>
                  <p className="text-black text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-medium text-left leading-snug">Sélectionnez ou importez un design</p>
                </div>

                <div className="flex items-start gap-1.5 xs:gap-2 sm:gap-2.5">
                  <span className="text-black text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold flex-shrink-0">3.</span>
                  <p className="text-black text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-medium text-left leading-snug">Personnalisez à votre façon</p>
                </div>

                <div className="flex items-start gap-1.5 xs:gap-2 sm:gap-2.5">
                  <span className="text-black text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold flex-shrink-0">4.</span>
                  <p className="text-black text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-medium text-left leading-snug">Validez votre commande</p>
                </div>

                <div className="flex items-start gap-1.5 xs:gap-2 sm:gap-2.5">
                  <span className="text-black text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold flex-shrink-0">5.</span>
                  <p className="text-black text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-medium text-left leading-snug">Recevez votre création chez vous</p>
                </div>
              </div>

              <Button
                onClick={handleChooseProduct}
                variant="outline"
                size="xl"
                className="mt-3 xs:mt-4 sm:mt-6 mx-auto bg-white text-black hover:bg-gray-100"
              >
                Choisir son produit
              </Button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}