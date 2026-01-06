import React from "react";

const ServiceFeatures = () => {
  return (
    <div className="w-full py-0 sm:py-1 md:py-2 pt-4 xs:pt-6 sm:pt-8 md:pt-10 lg:pt-12">
      <div className="w-full px-3 xs:px-4 sm:px-6">
        <div
          className="relative w-full flex flex-col sm:flex-row md:flex-row justify-between items-center
                     rounded-xl md:rounded-2xl shadow px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8 py-3 xs:py-4 sm:py-5 md:py-6 lg:py-8 space-y-2 xs:space-y-3 sm:space-y-0 sm:space-x-3 xs:sm:space-x-4 md:space-x-8 lg:space-x-12 overflow-hidden"
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
          <div className="relative z-10 flex flex-col sm:flex-row md:flex-row justify-between items-center w-full space-y-2 xs:space-y-3 sm:space-y-0 sm:space-x-3 xs:sm:space-x-4 md:space-x-8 lg:space-x-12">
            {/* Disponibilité */}
            <div className="flex items-center space-x-2 xs:space-x-3 sm:space-x-4">
              <img src="/24.svg" alt="24h/24" className="w-6 h-6 xs:w-8 xs:h-8 sm:w-10 sm:h-10 md:w-12 md:w-12 lg:w-14 lg:h-14" />
              <div>
                <h3 className="text-[10px] xs:text-xs sm:text-sm md:text-base lg:text-lg font-semibold" style={{ color: "#049BE5" }}>
                  Disponibilité
                </h3>
                <p className="text-[9px] xs:text-[10px] sm:text-xs md:text-sm lg:text-base font-medium" style={{ color: "#049BE5" }}>
                  24h/24
                </p>
              </div>
            </div>

            {/* Livraison */}
            <div className="flex items-center space-x-2 xs:space-x-3 sm:space-x-4">
              <img src="/delivery.svg" alt="Livraison" className="w-6 h-6 xs:w-8 xs:h-8 sm:w-10 sm:h-10 md:w-12 md:w-12 lg:w-14 lg:h-14" />
              <div>
                <h3 className="text-[10px] xs:text-xs sm:text-sm md:text-base lg:text-lg font-semibold" style={{ color: "#049BE5" }}>
                  Livraison
                </h3>
                <p className="text-[9px] xs:text-[10px] sm:text-xs md:text-sm lg:text-base font-medium" style={{ color: "#049BE5" }}>
                  Moins de 72h
                </p>
              </div>
            </div>

            {/* Paiement sécurisé */}
            <div className="flex items-center space-x-2 xs:space-x-3 sm:space-x-4">
              <img src="/payement.svg" alt="Paiement" className="w-6 h-6 xs:w-8 xs:h-8 sm:w-10 sm:h-10 md:w-12 md:w-12 lg:w-14 lg:h-14" />
              <div>
                <h3 className="text-[10px] xs:text-xs sm:text-sm md:text-base lg:text-lg font-semibold" style={{ color: "#049BE5" }}>
                  Paiement sécurisé
                </h3>
                <p className="text-[9px] xs:text-[10px] sm:text-xs md:text-sm lg:text-base font-medium" style={{ color: "#049BE5" }}>
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
