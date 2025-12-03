import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Footer from '../components/Footer';
import CategoryTabs from '../components/CategoryTabs';
import ServiceFeatures from '../pages/ServiceFeatures ';
import { VendorServiceInstance, Vendor } from '../services/vendorService';

interface Artist {
  id: number;
  firstName: string;
  shopName: string | null;
  name: string;
  role: string;
  rating: number;
  imageUrl: string;
  shopUrl?: string;
}

// Composant ArtisteSection sans bouton pour la page Artistes (conservé avec images existantes)
function ArtisteSectionWithoutButton() {
  return (
    <div className="w-full py-1 md:py-2 pt-6 sm:pt-8 md:pt-10 lg:pt-12">
      {/* Container principal avec container cohérent */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded p-4 md:p-6" style={{ backgroundColor: '#049BE5' }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-center">

            {/* Colonne gauche - Grille des artistes (images existantes conservées) */}
            <div className="grid grid-cols-3 grid-rows-2 gap-1 md:gap-2 w-full h-64 md:h-72 lg:h-80">
              {/* Ligne 1 - Ebu Jomlong */}
              <div className="relative rounded overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop&crop=face"
                  alt="Ebu Jomlong"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/70 to-transparent p-1 md:p-2 text-left">
                  <span className="text-white text-xs md:text-sm font-bold">Ebu Jomlong</span>
                </div>
              </div>

              {/* Ligne 1 - Dip Poundou Guiss (2 colonnes) */}
              <div className="relative col-span-2 rounded overflow-hidden">
                <img
                  src="https://www.musicinafrica.net/sites/default/files/images/article/202312/dipdoundouguiss.jpg"
                  alt="Dip Poundou Guiss"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/70 to-transparent p-1 md:p-2 text-left">
                  <span className="text-white text-xs md:text-sm font-bold">Dip Poundou Guiss</span>
                </div>
              </div>

              {/* Ligne 2 - Massamba Amadeus */}
              <div className="relative rounded overflow-hidden">
                <img
                  src="https://i.ytimg.com/vi/l2Mb3Q0zmTM/maxresdefault.jpg"
                  alt="Massamba Amadeus"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/70 to-transparent p-1 md:p-2 text-left">
                  <span className="text-white text-xs md:text-sm font-bold">Massamba Amadeus</span>
                </div>
              </div>

              {/* Ligne 2 - Amina Abed */}
              <div className="relative rounded overflow-hidden">
                <img
                  src="https://www.booska-p.com/wp-content/uploads/2023/09/Werenoi-CR-Visu-News.jpg"
                  alt="Amina Abed"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/70 to-transparent p-1 md:p-2 text-left">
                  <span className="text-white text-xs md:text-sm font-bold">Amina Abed</span>
                </div>
              </div>

              {/* Ligne 2 - Mut Cash */}
              <div className="relative rounded overflow-hidden">
                <img
                  src="https://www.musicinafrica.net/sites/default/files/images/article/202205/mist.jpg"
                  alt="Mut Cash"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/70 to-transparent p-1 md:p-2 text-left">
                  <span className="text-white text-xs md:text-sm font-bold">Mut Cash</span>
                </div>
              </div>
            </div>

            {/* Colonne droite - Section merchandising */}
            <div className="text-white flex flex-col justify-center text-center px-2 md:px-4 h-64 md:h-72 lg:h-80">
              <h3 className="text-xl md:text-2xl lg:text-3xl font-bold mb-3 uppercase tracking-wide">
                MERCHANDISING MUSICAL
              </h3>
              <p className="text-sm md:text-base mb-4 leading-relaxed max-w-md mx-auto text-center">
                Soutenez vos artistes favoris avec leur merchandising officiel. Des t-shirts aux accessoires, portez fièrement l'univers de vos stars préférées.
              </p>
              <button className="bg-white text-[#049BE5] px-4 py-2 rounded-md font-semibold text-sm hover:bg-gray-100 transition-colors duration-200 self-center">
                Découvrir
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default function ArtistesPage() {
  const navigate = useNavigate();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadArtists = async () => {
      try {
        setLoading(true);
        const vendorData = await VendorServiceInstance.getArtists();
        const transformedArtists = vendorData.map(vendor =>
          VendorServiceInstance.transformVendorToCard(vendor)
        );
        setArtists(transformedArtists);
      } catch (error) {
        console.error('Erreur lors du chargement des artistes:', error);
      } finally {
        setLoading(false);
      }
    };

    loadArtists();
  }, []);

  const handleViewShop = (artistId: number) => {
    navigate(`/profile/artiste/${artistId}`);
  };

  if (loading) {
    return (
      <>
        <div className="sticky top-0 z-40">
          <CategoryTabs />
        </div>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des artistes...</p>
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
        {/* Bouton de retour vers la page Landing - avant ArtisteSection */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors duration-200 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Retour à l'accueil</span>
          </button>
        </div>

        {/* Section Artistes partenaires sans bouton (images existantes conservées) */}
        <ArtisteSectionWithoutButton />

        {/* Header de la page */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex items-center gap-3 mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
              Artistes
            </h1>
            <img
              src="/x_artiste.svg"
              alt="Artistes"
              className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12"
            />
          </div>

          {/* Grille des artistes (données API) */}
          {artists.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {artists.map((artist) => (
                <div
                  key={artist.id}
                  className="rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-lg hover:shadow-xl transition-all duration-300"
                  style={{ backgroundColor: '#1A7CB8' }}
                >
                  {/* Avatar */}
                  <div className="w-32 h-32 rounded-full bg-white p-2 mb-6">
                    <img
                      src={artist.imageUrl}
                      alt={artist.name}
                      className="w-full h-full rounded-full object-cover bg-gray-200"
                    />
                  </div>

                  {/* Nom de l'artiste (firstName) */}
                  <h2 className="text-2xl font-bold text-white mb-2 italic">
                    {artist.firstName}
                  </h2>

                  {/* Nom de la boutique (shopName) */}
                  <p className="text-sm text-white/90 mb-3">
                    {artist.shopName}
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
                      {artist.rating.toFixed(1)}
                    </span>
                  </div>

                  {/* Bouton CTA */}
                  <button
                    onClick={() => handleViewShop(artist.id)}
                    className="bg-white text-black font-bold text-xs px-5 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 uppercase tracking-wide"
                  >
                    VOIR MA BOUTIQUE
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">Aucun artiste disponible pour le moment.</p>
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