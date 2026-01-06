import { useNavigate } from 'react-router-dom';

export default function DesignersSection() {
  const navigate = useNavigate();

  // Designers statiques
  const displayDesigners = [
    { id: 1, name: 'Pap Musa', avatarUrl: '/x_pap_musa.svg' },
    { id: 2, name: 'Ceeneer', avatarUrl: '/x_ceeneer.svg' },
    { id: 3, name: 'K & C', avatarUrl: '/x_kethiakh.svg' },
    { id: 4, name: 'Breadwinner', avatarUrl: '/x_breadwinner.svg' },
    { id: 5, name: 'Meissa Biguey', avatarUrl: '/x_maisssa_biguey.svg' },
    { id: 6, name: 'DAD', avatarUrl: '/x_dad.svg' }
  ];

  return (
    <div className="w-full py-0 sm:py-1 md:py-2 pt-4 xs:pt-6 sm:pt-8 md:pt-10 lg:pt-12">
      {/* Titre principal */}
      <div className="flex items-center justify-between mb-1 px-3 xs:px-4 sm:px-6">
        <h2 className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-black flex items-center gap-1.5 xs:gap-2 sm:gap-3">
          <span className="font-bold">Designers</span>
          <img src="/x_designer.svg" alt="Designer" className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
        </h2>
      </div>

      {/* Container principal */}
      <div className="w-full px-3 xs:px-4 sm:px-6">
        <div className="rounded-md overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 h-[20rem] xs:h-[24rem] sm:h-[28rem] lg:h-[36rem]">

            {/* Colonne gauche */}
            <div className="text-black flex flex-col justify-center items-center px-3 xs:px-4 sm:px-5 md:px-6 py-4 xs:py-6 sm:py-8 bg-yellow-400 text-center">
              <h3 className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 xs:mb-4 sm:mb-5 md:mb-6 uppercase tracking-wide leading-tight">
                DESIGNS EXCLUSIFS
              </h3>
              <p className="text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl mb-3 xs:mb-4 sm:mb-5 md:mb-6 leading-relaxed max-w-md mx-auto px-2">
                Découvrez des milliers de designs exclusifs créés par nos designers.
                Des motifs tendance aux illustrations artistiques, pour vos produits
                personnalisés.
              </p>
              <button
                onClick={() => navigate('/designers')}
                className="bg-white text-black px-3 xs:px-4 sm:px-5 md:px-6 py-1.5 xs:py-2 rounded-md font-semibold text-[10px] xs:text-xs sm:text-sm hover:bg-gray-100 transition-colors duration-200"
              >
                Découvrir
              </button>
            </div>

            {/* Colonne droite - Grille designers statique */}
            <div className="bg-yellow-400 relative">
              <div className="grid grid-cols-3 gap-0.5 xs:gap-1 sm:gap-1 md:gap-2 p-2 xs:p-2.5 sm:p-3 md:p-4 h-full auto-rows-fr">
                {displayDesigners.map((designer, index) => (
                  <div
                    key={designer.id}
                    className={`${index === 3 ? "row-span-3" : index === 0 || index === 2 || index === 4 || index === 5 ? "row-span-2" : ""} bg-black rounded overflow-hidden relative group flex flex-col items-center justify-center text-white`}
                  >
                    <img
                      src={designer.avatarUrl}
                      alt={designer.name}
                      className={`${index === 3 ? "w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 mb-1 xs:mb-1.5 sm:mb-2" : index === 0 || index === 2 || index === 4 || index === 5 ? "w-6 h-6 xs:w-8 xs:h-8 sm:w-10 sm:h-10 md:w-12 md:w-14 lg:w-16 lg:h-16 mb-1 xs:mb-1.5 sm:mb-2" : "w-5 h-5 xs:w-7 xs:h-7 sm:w-9 sm:h-9 md:w-10 md:w-12 lg:w-12 lg:h-12 mb-0.5 xs:mb-1 sm:mb-1"} group-hover:scale-110 transition-transform duration-300 object-cover`}
                    />
                    <span className="font-bold text-[9px] xs:text-[10px] sm:text-xs md:text-sm text-center leading-tight px-0.5">
                      {designer.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}