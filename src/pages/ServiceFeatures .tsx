import React from "react";

const ServiceFeatures = () => {
  return (
    <div className="w-full bg-gray-100 py-12">
      <div className="w-full px-4 sm:px-8">
        <div
          className="relative w-full flex flex-col md:flex-row justify-between items-center 
                     rounded-2xl shadow px-8 py-8 space-y-8 md:space-y-0 md:space-x-12 overflow-hidden"
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
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center w-full space-y-8 md:space-y-0 md:space-x-12">
            {/* Disponibilité */}
            <div className="flex items-center space-x-4">
              <img src="/24.svg" alt="24h/24" className="w-14 h-14" />
              <div>
                <h3 className="text-lg font-semibold" style={{ color: "#049BE5" }}>
                  Disponibilité
                </h3>
                <p className="text-base font-medium" style={{ color: "#049BE5" }}>
                  24h/24
                </p>
              </div>
            </div>

            {/* Livraison */}
            <div className="flex items-center space-x-4">
              <img src="/delivery.svg" alt="Livraison" className="w-14 h-14" />
              <div>
                <h3 className="text-lg font-semibold" style={{ color: "#049BE5" }}>
                  Livraison
                </h3>
                <p className="text-base font-medium" style={{ color: "#049BE5" }}>
                  Moins de 72h
                </p>
              </div>
            </div>

            {/* Paiement sécurisé */}
            <div className="flex items-center space-x-4">
              <img src="/payement.svg" alt="Paiement" className="w-14 h-14" />
              <div>
                <h3 className="text-lg font-semibold" style={{ color: "#049BE5" }}>
                  Paiement sécurisé
                </h3>
                <p className="text-base font-medium" style={{ color: "#049BE5" }}>
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
