export default function PersonalizationSection() {
  return (
    <div className="w-full bg-white py-1 md:py-2">
      

      <div className="w-full px-4 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-1 md:gap-2 lg:gap-3 items-stretch">
          
          {/* Section vidéo à gauche */}
          <div className="relative">
            <div className="bg-gray-100 rounded p-3 md:p-4 h-64 md:h-72 lg:h-80 flex items-center justify-center relative overflow-hidden shadow-md">
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
          <div className="bg-yellow-400 rounded p-3 md:p-4 lg:p-6 shadow-md h-64 md:h-72 lg:h-80 flex flex-col justify-center text-center">
            <div className="space-y-3 md:space-y-4">
              <h2 className="text-sm md:text-base lg:text-lg font-bold text-black uppercase leading-tight">
                PERSONNALISEZ UN PRODUIT QUI VOUS IDENTIFIE
              </h2>
              
              <p className="text-black font-medium text-xs md:text-sm">
                Chaque étape est pensée pour que vous soyez le créateur et créatif !
              </p>

              <div className="space-y-2 max-w-xs mx-auto">
                <div className="flex items-start gap-2">
                  <span className="bg-black text-yellow-400 w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                  <p className="text-black text-xs md:text-sm font-medium text-left">Choisissez votre produit</p>
                </div>
                
                <div className="flex items-start gap-2">
                  <span className="bg-black text-yellow-400 w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                  <p className="text-black text-xs md:text-sm font-medium text-left">Sélectionnez ou importez un design</p>
                </div>
                
                <div className="flex items-start gap-2">
                  <span className="bg-black text-yellow-400 w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                  <p className="text-black text-xs md:text-sm font-medium text-left">Personnalisez à votre façon</p>
                </div>
                
                <div className="flex items-start gap-2">
                  <span className="bg-black text-yellow-400 w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">4</span>
                  <p className="text-black text-xs md:text-sm font-medium text-left">Validez votre commande</p>
                </div>
                
                <div className="flex items-start gap-2">
                  <span className="bg-black text-yellow-400 w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">5</span>
                  <p className="text-black text-xs md:text-sm font-medium text-left">Recevez votre création chez vous</p>
                </div>
              </div>

              <button className="bg-white text-black px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-semibold text-xs md:text-sm hover:bg-gray-100 transition-colors duration-200 mx-auto">
                Choisir son produit
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}