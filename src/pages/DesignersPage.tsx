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
    <div className="w-full py-1 md:py-2 pt-6 sm:pt-8 md:pt-10 lg:pt-12">
      {/* Container principal avec container cohérent */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 h-80 lg:h-96">

            {/* Colonne gauche */}
            <div className="text-black flex flex-col justify-center items-center px-6 py-8 bg-yellow-400 text-center">
              <h3 className="text-2xl md:text-3xl font-bold mb-4 uppercase tracking-wide">
                DESIGNS EXCLUSIFS
              </h3>
              <p className="text-sm md:text-base mb-6 leading-relaxed max-w-md mx-auto">
                Découvrez des milliers de designs exclusifs créés par nos designers.
                Des motifs tendance aux illustrations artistiques, pour vos produits
                personnalisés.
              </p>
              <button className="bg-white text-black px-6 py-2 rounded-md font-semibold text-sm hover:bg-gray-100 transition-colors duration-200">
                Découvrir
              </button>
            </div>

            {/* Colonne droite - Grille designers (images existantes conservées) */}
            <div className="bg-yellow-400 relative">
              <div className="grid grid-cols-3 gap-1 md:gap-2 p-3 md:p-4 h-full auto-rows-fr">
                {/* Pap Musa */}
                <div className="row-span-2 bg-black rounded overflow-hidden relative group flex flex-col items-center justify-center text-white">
                  <img
                    src="/x_pap_musa.svg"
                    alt="Pap Musa"
                    className="w-12 h-12 md:w-16 md:h-16 mb-2 group-hover:scale-110 transition-transform duration-300 object-cover"
                  />
                  <span className="font-bold text-xs md:text-sm">Pap Musa</span>
                </div>

                {/* Ceeneer */}
                <div className="bg-black rounded overflow-hidden relative group flex flex-col items-center justify-center text-white">
                  <img
                    src="/x_ceeneer.svg"
                    alt="Ceeneer"
                    className="w-10 h-10 md:w-12 md:h-12 mb-1 group-hover:scale-110 transition-transform duration-300 object-cover"
                  />
                  <span className="font-bold text-xs md:text-sm">Ceeneer</span>
                </div>

                {/* K & C */}
                <div className="bg-black rounded overflow-hidden relative group flex flex-col items-center justify-center text-white">
                  <img
                    src="/x_kethiakh.svg"
                    alt="K & C"
                    className="w-10 h-10 md:w-12 md:h-12 mb-1 group-hover:scale-110 transition-transform duration-300 object-cover"
                  />
                  <span className="font-bold text-xs md:text-sm">K & C</span>
                </div>

                {/* Breadwinner */}
                <div className="row-span-2 bg-black rounded overflow-hidden relative group flex flex-col items-center justify-center text-white">
                  <img
                    src="/x_breadwinner.svg"
                    alt="Breadwinner"
                    className="w-12 h-12 md:w-16 md:h-16 mb-2 group-hover:scale-110 transition-transform duration-300 object-cover"
                  />
                  <span className="font-bold text-xs md:text-sm">Breadwinner</span>
                </div>

                {/* Meissa Biguey */}
                <div className="row-span-2 bg-black rounded overflow-hidden relative group flex flex-col items-center justify-center text-white">
                  <img
                    src="/x_maisssa_biguey.svg"
                    alt="Meissa Biguey"
                    className="w-12 h-12 md:w-16 md:h-16 mb-2 group-hover:scale-110 transition-transform duration-300 object-cover"
                  />
                  <span className="font-bold text-xs md:text-sm">Meissa Biguey</span>
                </div>

                {/* DAD */}
                <div className="bg-black rounded overflow-hidden relative group flex flex-col items-center justify-center text-white">
                  <img
                    src="/x_dad.svg"
                    alt="DAD"
                    className="w-10 h-10 md:w-12 md:h-12 mb-1 group-hover:scale-110 transition-transform duration-300 object-cover"
                  />
                  <span className="font-bold text-xs md:text-sm">DAD</span>
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
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des designers...</p>
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
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-yellow-600 transition-colors duration-200 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Retour à l'accueil</span>
          </button>
        </div>

        {/* Section Designers sans bouton (images existantes conservées) */}
        <DesignerSectionWithoutButton />

        {/* Header de la page */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex items-center gap-3 mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
              Designers
            </h1>
            <img
              src="/x_designer.svg"
              alt="Designers"
              className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12"
            />
          </div>

          {/* Grille des designers (données API) */}
          {designers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {designers.map((designer) => (
                <div
                  key={designer.id}
                  className="rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-lg hover:shadow-xl transition-all duration-300"
                  style={{ backgroundColor: '#F2D12E' }}
                >
                  {/* Avatar */}
                  <div className="w-32 h-32 rounded-full bg-white p-2 mb-6">
                    <img
                      src={designer.imageUrl}
                      alt={designer.name}
                      className="w-full h-full rounded-full object-cover bg-gray-200"
                    />
                  </div>

                  {/* Nom du designer (firstName) */}
                  <h2 className="text-2xl font-bold text-black mb-2 italic">
                    {designer.firstName}
                  </h2>

                  {/* Nom de la boutique (shopName) */}
                  <p className="text-sm text-black/90 mb-3">
                    {designer.shopName}
                  </p>

                  {/* Note avec étoile */}
                  <div className="flex items-center gap-1 mb-6">
                    <svg
                      className="w-5 h-5 text-black fill-current"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    <span className="text-sm text-black">
                      {designer.rating.toFixed(1)}
                    </span>
                  </div>

                  {/* Bouton CTA */}
                  <button
                    onClick={() => handleViewShop(designer)}
                    className="bg-black text-white font-bold text-xs px-5 py-2 rounded-lg hover:bg-gray-800 transition-colors duration-200 uppercase tracking-wide"
                  >
                    VOIR MA BOUTIQUE
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">Aucun designer disponible pour le moment.</p>
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