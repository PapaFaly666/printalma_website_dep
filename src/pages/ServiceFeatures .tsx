import React from "react";

const ServiceFeatures = () => {
  return (
    <div className="w-full py-8 sm:py-10 md:py-12 pt-6 sm:pt-8 md:pt-10 lg:pt-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="relative w-full flex flex-col sm:flex-row md:flex-row justify-between items-center
                     rounded-xl md:rounded-2xl shadow px-4 sm:px-6 md:px-8 py-6 sm:py-8 space-y-6 sm:space-y-0 sm:space-x-4 md:space-x-12 overflow-hidden"
          style={{
            backgroundColor: "#ffffff",
          }}
        >
          {/* Image de fond avec opacité */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "url(/doodles.svg)",
              backgroundRepeat: "no-repeat",
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: 0.1,
            }}
          ></div>

          {/* Contenu */}
          <div className="relative z-10 flex flex-col sm:flex-row md:flex-row justify-between items-center w-full space-y-4 sm:space-y-0 sm:space-x-4 md:space-x-12">
            {/* Disponibilité */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              <img src="/24.svg" alt="24h/24" className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14" />
              <div>
                <h3 className="text-sm sm:text-base md:text-lg font-semibold" style={{ color: "#049BE5" }}>
                  Disponibilité
                </h3>
                <p className="text-xs sm:text-sm md:text-base font-medium" style={{ color: "#049BE5" }}>
                  24h/24
                </p>
              </div>
            </div>

            {/* Livraison */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              <img src="/delivery.svg" alt="Livraison" className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14" />
              <div>
                <h3 className="text-sm sm:text-base md:text-lg font-semibold" style={{ color: "#049BE5" }}>
                  Livraison
                </h3>
                <p className="text-xs sm:text-sm md:text-base font-medium" style={{ color: "#049BE5" }}>
                  Moins de 72h
                </p>
              </div>
            </div>

            {/* Paiement sécurisé */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              <img src="/payement.svg" alt="Paiement" className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14" />
              <div>
                <h3 className="text-sm sm:text-base md:text-lg font-semibold" style={{ color: "#049BE5" }}>
                  Paiement sécurisé
                </h3>
                <p className="text-xs sm:text-sm md:text-base font-medium" style={{ color: "#049BE5" }}>
                  Carte / Mobile money
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceFeatures;
