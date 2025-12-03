import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Footer from '../components/Footer';
import CategoryTabs from '../components/CategoryTabs';
import ServiceFeatures from '../pages/ServiceFeatures ';
import { VendorServiceInstance } from '../services/vendorService';

interface Influencer {
  id: number;
  firstName: string;
  shopName: string | null;
  name: string;
  role: string;
  rating: number;
  imageUrl: string;
  shopUrl?: string;
}

// Composant InfluenceurSection sans bouton pour la page Influenceurs (conservé avec images existantes)
function InfluenceurSectionWithoutButton() {
  return (
    <div className="w-full py-1 md:py-2 pt-6 sm:pt-8 md:pt-10 lg:pt-12">
      {/* Container principal avec container cohérent */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded p-4 md:p-6 flex flex-col md:flex-row items-center justify-between text-white shadow-lg h-80 lg:h-96" style={{backgroundColor: '#E5042B'}}>

          {/* Texte à gauche */}
          <div className="md:w-1/2 space-y-3 text-center md:text-left">
            <h2 className="text-xl md:text-2xl font-bold uppercase tracking-wide">
              Influenceurs Partenaires
            </h2>
            <p className="text-sm md:text-base leading-relaxed opacity-90">
              Explorez les univers créatifs de vos influenceurs préférés
              et adoptez leurs designs signature.
            </p>
            <button className="bg-white px-4 py-2 rounded-lg font-semibold shadow hover:scale-105 transition-transform duration-200 text-sm" style={{color: '#E5042B'}}>
              Découvrir
            </button>
          </div>

          {/* Grille compacte des influenceurs (images existantes conservées) */}
          <div className="md:w-1/2 grid grid-cols-3 gap-1 md:gap-2 mt-4 md:mt-0 md:ml-4 h-56 md:h-64 lg:h-72">

            {/* Grande carte colonne gauche */}
            <div className="row-span-2 bg-gray-800 rounded overflow-hidden relative group shadow-md">
              <img
                src="https://tse2.mm.bing.net/th/id/OIP.HWgGD1gYH8ZRHC9Cs2CnGAHaHa?rs=1&pid=ImgDetMain&o=7&rm=3"
                alt="Bathie Drizzy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1 md:p-2">
                <p className="text-white text-xs md:text-sm font-semibold">Bathie Drizzy</p>
              </div>
            </div>

            {/* Deux petites cartes en haut */}
            <div className="bg-gray-800 rounded overflow-hidden relative group shadow-md">
              <img
                src="https://tse4.mm.bing.net/th/id/OIP._Ej2qNEVtKsCJJlRYGQGKwHaJQ?rs=1&pid=ImgDetMain&o=7&rm=3"
                alt="Latzo Dozé"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1">
                <p className="text-white text-xs font-medium">Latzo Dozé</p>
              </div>
            </div>

            <div className="bg-gray-800 rounded overflow-hidden relative group shadow-md">
              <img
                src="https://th.bing.com/th/id/R.d8ab980609f6027de425903340ab85c7?rik=EbNyFnBAlMUuyA&riu=http%3a%2f%2finfosrewmi.com%2fwp-content%2fuploads%2f2019%2f04%2fJaaw-Ketchup-lance-un-message.jpg&ehk=oDqmSCK%2bJj2p9vcySE2eUZC32B9IEpVkru%2bDZzEofIY%3d&risl=&pid=ImgRaw&r=0"
                alt="Jaaw Ketchup"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1">
                <p className="text-white text-xs font-medium">Jaaw Ketchup</p>
              </div>
            </div>

            {/* Grande carte au milieu */}
            <div className="row-span-2 bg-gray-800 rounded overflow-hidden relative group shadow-md">
              <img
                src="https://kawtef.com/wp-content/uploads/2022/11/91AC7CFA-9682-4FDE-BF6F-F62D6FA9B7E8-854x1024.jpeg"
                alt="Dudu FDV"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1 md:p-2">
                <p className="text-white text-xs md:text-sm font-semibold">Dudu FDV</p>
              </div>
            </div>

            {/* Adja Everywhere */}
            <div className="row-span-2 bg-gray-800 rounded overflow-hidden relative group shadow-md">
              <img
                src="https://www.senenews.com/wp-content/uploads/2024/07/img_3115.jpeg"
                alt="Adja Everywhere"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1 md:p-2">
                <p className="text-white text-xs md:text-sm font-medium">Adja Everywhere</p>
              </div>
            </div>

            {/* Pape Sidy Fall */}
            <div className="bg-gray-800 rounded overflow-hidden relative group shadow-md">
              <img
                src="https://sunubuzzsn.com/wp-content/uploads/2023/03/Pape-Sidy-Fall.png"
                alt="Pape Sidy Fall"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1">
                <p className="text-white text-xs font-medium">Pape Sidy Fall</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default function InfluenceursPage() {
  const navigate = useNavigate();
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInfluencers = async () => {
      try {
        setLoading(true);
        const vendorData = await VendorServiceInstance.getInfluencers();
        const transformedInfluencers = vendorData.map(vendor =>
          VendorServiceInstance.transformVendorToCard(vendor)
        );
        setInfluencers(transformedInfluencers);
      } catch (error) {
        console.error('Erreur lors du chargement des influenceurs:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInfluencers();
  }, []);

  const handleViewShop = (influencerId: number) => {
    navigate(`/profile/influenceur/${influencerId}`);
  };

  if (loading) {
    return (
      <>
        <div className="sticky top-0 z-40">
          <CategoryTabs />
        </div>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des influenceurs...</p>
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
        {/* Bouton de retour vers la page Landing - avant InfluenceurSection */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors duration-200 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Retour à l'accueil</span>
          </button>
        </div>

        {/* Section Influenceurs partenaires sans bouton (images existantes conservées) */}
        <InfluenceurSectionWithoutButton />

        {/* Header de la page */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex items-center gap-3 mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
              Influenceurs
            </h1>
            <img
              src="/x_influencer.svg"
              alt="Influenceurs"
              className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12"
            />
          </div>

          {/* Grille des influenceurs (données API) */}
          {influencers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {influencers.map((influencer) => (
                <div
                  key={influencer.id}
                  className="rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-lg hover:shadow-xl transition-all duration-300"
                  style={{ backgroundColor: '#E5042B' }}
                >
                  {/* Avatar */}
                  <div className="w-32 h-32 rounded-full bg-white p-2 mb-6">
                    <img
                      src={influencer.imageUrl}
                      alt={influencer.name}
                      className="w-full h-full rounded-full object-cover bg-gray-200"
                    />
                  </div>

                  {/* Nom de l'influenceur (firstName) */}
                  <h2 className="text-2xl font-bold text-white mb-2 italic">
                    {influencer.firstName}
                  </h2>

                  {/* Nom de la boutique (shopName) */}
                  <p className="text-sm text-white/90 mb-3">
                    {influencer.shopName}
                  </p>

                  {/* Note avec étoile */}
                  <div className="flex items-center gap-1 mb-6">
                    <svg
                      className="w-5 h-5 text-yellow-300 fill-current"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    <span className="text-sm text-white">
                      {influencer.rating.toFixed(1)}
                    </span>
                  </div>

                  {/* Bouton CTA */}
                  <button
                    onClick={() => handleViewShop(influencer.id)}
                    className="bg-white text-black font-bold text-xs px-5 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 uppercase tracking-wide"
                  >
                    VOIR MA BOUTIQUE
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">Aucun influenceur disponible pour le moment.</p>
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