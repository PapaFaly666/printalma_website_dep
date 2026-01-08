import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Footer from '../components/Footer';
import CategoryTabs from '../components/CategoryTabs';
import ServiceFeatures from '../pages/ServiceFeatures ';
import { VendorServiceInstance } from '../services/vendorService';

interface Designer {
  id: number;
  firstName: string;
  shopName: string | null;
  name: string;
  role: string;
  rating: number;
  imageUrl: string;
  shopUrl?: string;
}

// Composant DesignerSection sans bouton pour la page Designers (conservé avec images existantes)
function DesignerSectionWithoutButton() {
  return (
    <div className="w-full py-0 sm:py-1 md:py-2 pt-3 sm:pt-4 md:pt-6 lg:pt-8 xl:pt-10">
      {/* Container principal avec même padding que NavBar */}
      <div className="w-full px-4 sm:px-6">
        <div className="rounded-md overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 h-auto lg:h-[32rem] xl:h-[36rem]">

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
              <button className="bg-white text-black px-3 xs:px-4 sm:px-5 md:px-6 py-1.5 xs:py-2 rounded-md font-semibold text-[10px] xs:text-xs sm:text-sm hover:bg-gray-100 transition-colors duration-200">
                Découvrir
              </button>
            </div>

            {/* Colonne droite - Grille designers (images existantes conservées) */}
            <div className="bg-yellow-400 relative">
              <div className="grid grid-cols-3 gap-0.5 xs:gap-1 sm:gap-1 md:gap-2 p-2 xs:p-2.5 sm:p-3 md:p-4 h-full auto-rows-fr">
                {/* Pap Musa */}
                <div className="row-span-2 bg-black rounded overflow-hidden relative group flex flex-col items-center justify-center text-white">
                  <img
                    src="/x_pap_musa.svg"
                    alt="Pap Musa"
                    className="w-6 h-6 xs:w-8 xs:h-8 sm:w-10 sm:h-10 md:w-12 lg:w-16 lg:h-16 mb-1 xs:mb-1.5 sm:mb-2 group-hover:scale-110 transition-transform duration-300 object-cover"
                  />
                  <span className="font-bold text-[9px] xs:text-[10px] sm:text-xs md:text-sm">Pap Musa</span>
                </div>

                {/* Ceeneer */}
                <div className="bg-black rounded overflow-hidden relative group flex flex-col items-center justify-center text-white">
                  <img
                    src="/x_ceeneer.svg"
                    alt="Ceeneer"
                    className="w-5 h-5 xs:w-7 xs:h-7 sm:w-9 sm:h-9 md:w-10 lg:w-12 lg:h-12 mb-0.5 xs:mb-1 sm:mb-1 group-hover:scale-110 transition-transform duration-300 object-cover"
                  />
                  <span className="font-bold text-[9px] xs:text-[10px] sm:text-xs md:text-sm">Ceeneer</span>
                </div>

                {/* K & C */}
                <div className="row-span-2 bg-black rounded overflow-hidden relative group flex flex-col items-center justify-center text-white">
                  <img
                    src="/x_kethiakh.svg"
                    alt="K & C"
                    className="w-6 h-6 xs:w-8 xs:h-8 sm:w-10 sm:h-10 md:w-12 lg:w-16 lg:h-16 mb-1 xs:mb-1.5 sm:mb-2 group-hover:scale-110 transition-transform duration-300 object-cover"
                  />
                  <span className="font-bold text-[9px] xs:text-[10px] sm:text-xs md:text-sm">K & C</span>
                </div>

                {/* Breadwinner */}
                <div className="row-span-3 bg-black rounded overflow-hidden relative group flex flex-col items-center justify-center text-white">
                  <img
                    src="/x_breadwinner.svg"
                    alt="Breadwinner"
                    className="w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 md:w-16 lg:w-20 lg:h-20 mb-1 xs:mb-1.5 sm:mb-2 group-hover:scale-110 transition-transform duration-300 object-cover"
                  />
                  <span className="font-bold text-[9px] xs:text-[10px] sm:text-xs md:text-sm">Breadwinner</span>
                </div>

                {/* Meissa Biguey */}
                <div className="row-span-2 bg-black rounded overflow-hidden relative group flex flex-col items-center justify-center text-white">
                  <img
                    src="/x_maisssa_biguey.svg"
                    alt="Meissa Biguey"
                    className="w-6 h-6 xs:w-8 xs:h-8 sm:w-10 sm:h-10 md:w-12 lg:w-16 lg:h-16 mb-1 xs:mb-1.5 sm:mb-2 group-hover:scale-110 transition-transform duration-300 object-cover"
                  />
                  <span className="font-bold text-[9px] xs:text-[10px] sm:text-xs md:text-sm">Meissa Biguey</span>
                </div>

                {/* DAD */}
                <div className="row-span-2 bg-black rounded overflow-hidden relative group flex flex-col items-center justify-center text-white">
                  <img
                    src="/x_dad.svg"
                    alt="DAD"
                    className="w-6 h-6 xs:w-8 xs:h-8 sm:w-10 sm:h-10 md:w-12 lg:w-16 lg:h-16 mb-1 xs:mb-1.5 sm:mb-2 group-hover:scale-110 transition-transform duration-300 object-cover"
                  />
                  <span className="font-bold text-[9px] xs:text-[10px] sm:text-xs md:text-sm">DAD</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DesignersPage() {
  const navigate = useNavigate();
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDesigners = async () => {
      try {
        setLoading(true);
        const vendorData = await VendorServiceInstance.getDesigners();
        const transformedDesigners = vendorData.map(vendor =>
          VendorServiceInstance.transformVendorToCard(vendor)
        );
        setDesigners(transformedDesigners);
      } catch (error) {
        console.error('Erreur lors du chargement des designers:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDesigners();
  }, []);

  const handleViewShop = (designer: Designer) => {
    // Utiliser le nom de la boutique si disponible, sinon le firstName
    const shopName = designer.shopName || designer.firstName || designer.name;
    // Convertir en URL-friendly (remplacer les espaces et caractères spéciaux)
    const urlFriendlyName = shopName.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Garder seulement lettres, chiffres, espaces et tirets
      .replace(/\s+/g, '-') // Remplacer les espaces par des tirets
      .replace(/-+/g, '-') // Éviter les tirets multiples
      .replace(/^-|-$/g, ''); // Éviter les tirets au début/fin

    navigate(`/profile/designer/${urlFriendlyName}`);
  };

  if (loading) {
    return (
      <>
        <div className="sticky top-0 z-40">
          <CategoryTabs />
        </div>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-yellow-500 mx-auto mb-3 sm:mb-4"></div>
            <p className="text-gray-600 text-sm sm:text-base">Chargement des designers...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* CategoryTabs sticky qui suit le scroll */}
      <div className="sticky top-0 z-40">
        <CategoryTabs />
      </div>

      <div className="min-h-screen bg-gray-50">
        {/* Bouton de retour vers la page Landing - avant DesignerSection */}
        <div className="px-4 sm:px-6 pt-4 sm:pt-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 sm:gap-2 text-gray-600 hover:text-yellow-600 transition-colors duration-200 mb-3 sm:mb-4"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-sm font-medium">Retour à l'accueil</span>
          </button>
        </div>

        {/* Section Designers sans bouton (images existantes conservées) */}
        <DesignerSectionWithoutButton />

        {/* Header de la page */}
        <div className="px-4 sm:px-6 py-6 sm:py-8 lg:py-12">
          <div className="flex items-center gap-2 sm:gap-3 mb-8 sm:mb-12">
            <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900">
              Designers
            </h1>
            <img
              src="/x_designer.svg"
              alt="Designers"
              className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 xl:w-9 xl:h-9"
            />
          </div>

          {/* Grille des designers (données API) */}
          {designers.length > 0 ? (
            <div className="px-4 sm:px-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
                {designers.map((designer) => (
                  <div
                    key={designer.id}
                    className="rounded-2xl sm:rounded-3xl p-3 sm:p-4 md:p-5 lg:p-6 flex flex-col items-center justify-center text-center shadow-lg hover:shadow-xl transition-all duration-300"
                    style={{ backgroundColor: '#F2D12E' }}
                  >
                    {/* Avatar */}
                    <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-56 lg:h-56 xl:w-64 xl:h-64 rounded-full bg-white p-2 sm:p-2.5 md:p-3 mb-3 sm:mb-4 md:mb-5">
                      <img
                        src={designer.imageUrl}
                        alt={designer.name}
                        className="w-full h-full rounded-full object-cover bg-gray-200"
                      />
                    </div>

                    {/* Nom du designer (firstName) */}
                    <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-black mb-0.5 sm:mb-1 italic">
                      {designer.firstName}
                    </h2>

                    {/* Nom de la boutique (shopName) */}
                    <p className="text-xs sm:text-sm md:text-base lg:text-lg text-black/90 mb-1 sm:mb-1.5">
                      {designer.shopName}
                    </p>

                    {/* Note avec étoile */}
                    <div className="flex items-center gap-1 sm:gap-1.5 mb-1.5 sm:mb-2">
                      <svg
                        className="w-4 h-4 sm:w-5 sm:h-5 md:w-5 md:h-5 lg:w-6 lg:h-6 text-black fill-current"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      <span className="text-xs sm:text-sm md:text-base lg:text-lg text-black">
                        {designer.rating.toFixed(1)}
                      </span>
                    </div>

                    {/* Bouton CTA */}
                    <button
                      onClick={() => handleViewShop(designer)}
                      className="bg-white text-black font-bold text-[10px] sm:text-xs md:text-sm lg:text-base px-3 sm:px-4 md:px-5 lg:px-6 py-1.5 sm:py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 uppercase tracking-wide"
                    >
                      VOIR MA BOUTIQUE
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="px-4 sm:px-6 text-center py-8 sm:py-12">
              <p className="text-gray-600 text-base sm:text-lg">Aucun designer disponible pour le moment.</p>
            </div>
          )}
        </div>

        {/* Section ServiceFeatures avant le Footer */}
        <ServiceFeatures />
      </div>

      <Footer />
    </>
  );
}