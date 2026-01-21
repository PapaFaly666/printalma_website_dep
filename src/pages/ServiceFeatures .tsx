import React from "react";

const ServiceFeatures = () => {
  return (
    <div className="w-full py-3 md:py-4 lg:py-5">
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8">
        <div
          className="relative w-full flex flex-col sm:flex-row justify-between items-center
                     rounded-lg md:rounded-xl lg:rounded-2xl
                     px-4 py-4 sm:px-6 sm:py-5 md:px-8 md:py-6 lg:px-10 lg:py-8
                     gap-3 sm:gap-5 md:gap-7 lg:gap-10"
          style={{
            backgroundColor: "rgb(20, 104, 154)",
          }}
        >
          {/* Contenu */}
          <div className="flex flex-col sm:flex-row justify-between items-center w-full gap-4 sm:gap-6 md:gap-8 lg:gap-10">
            {/* Disponibilité */}
            <div className="flex items-center gap-3 sm:gap-4 md:gap-5">
              <img src="/h24.svg" alt="24h/24" className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 lg:w-20 lg:h-20" />
              <div className="text-center sm:text-left">
                <h3 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-semibold text-white">
                  Disponibilité
                </h3>
                <p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-medium text-white">
                  24h/24
                </p>
              </div>
            </div>

            {/* Livraison */}
            <div className="flex items-center gap-3 sm:gap-4 md:gap-5">
              <img src="/delivery.svg" alt="Livraison" className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 lg:w-20 lg:h-20" />
              <div className="text-center sm:text-left">
                <h3 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-semibold text-white">
                  Livraison
                </h3>
                <p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-medium text-white">
                  Moins de 72h
                </p>
              </div>
            </div>

            {/* Paiement sécurisé */}
            <div className="flex items-center gap-3 sm:gap-4 md:gap-5">
              <img src="/payment.svg" alt="Paiement" className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 lg:w-20 lg:h-20" />
              <div className="text-center sm:text-left">
                <h3 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-semibold text-white">
                  Paiement sécurisé
                </h3>
                <p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-medium text-white">
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
