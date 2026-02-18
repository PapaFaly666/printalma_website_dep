import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Button from '../components/ui/Button';
import { contentService, ContentItem } from '../services/contentService';

export default function InfluenceurSection() {
  const navigate = useNavigate();
  const [merchandising, setMerchandising] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      setLoading(true);
      const data = await contentService.getPublicContent();
      setMerchandising(data.merchandising || []);
    } catch (error) {
      console.error('Erreur lors du chargement du merchandising:', error);
      // Fallback avec données par défaut si erreur
      setMerchandising([
        { id: '1', name: 'Bathie Drizzy', imageUrl: 'https://tse2.mm.bing.net/th/id/OIP.HWgGD1gYH8ZRHC9Cs2CnGAHaHa?rs=1&pid=ImgDetMain&o=7&rm=3' },
        { id: '2', name: 'Latzo Dozé', imageUrl: 'https://tse4.mm.bing.net/th/id/OIP._Ej2qNEVtKsCJJlRYGQGKwHaJQ?rs=1&pid=ImgDetMain&o=7&rm=3' },
        { id: '3', name: 'Jaaw Ketchup', imageUrl: 'https://th.bing.com/th/id/R.d8ab980609f6027de425903340ab85c7?rik=EbNyFnBAlMUuyA&riu=http%3a%2f%2finfosrewmi.com%2fwp-content%2fuploads%2f2019%2f04%2fJaaw-Ketchup-lance-un-message.jpg&ehk=oDqmSCK%2bJj2p9vcySE2eUZC32B9IEpVkru%2bDZzEofIY%3d&risl=&pid=ImgRaw&r=0' },
        { id: '4', name: 'Dudu FDV', imageUrl: 'https://kawtef.com/wp-content/uploads/2022/11/91AC7CFA-9682-4FDE-BF6F-F62D6FA9B7E8-854x1024.jpeg' },
        { id: '5', name: 'Adja Everywhere', imageUrl: 'https://www.senenews.com/wp-content/uploads/2024/07/img_3115.jpeg' },
        { id: '6', name: 'Pape Sidy Fall', imageUrl: 'https://sunubuzzsn.com/wp-content/uploads/2023/03/Pape-Sidy-Fall.png' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full py-0 sm:py-1 md:py-2 pt-4 xs:pt-6 sm:pt-8 md:pt-10 lg:pt-12">
        <div className="w-full px-3 xs:px-4 sm:px-6">
          <div className="rounded-2xl p-2 xs:p-2.5 sm:p-3 md:p-4 lg:p-6 animate-pulse bg-gray-200" style={{ minHeight: 'clamp(12rem, 30vw, 36rem)' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-0 sm:py-1 md:py-2 pt-4 xs:pt-6 sm:pt-8 md:pt-10 lg:pt-12">

      {/* Container principal */}
      <div className="w-full px-3 xs:px-4 sm:px-6">
        <div className="rounded-2xl p-2 xs:p-2.5 sm:p-3 md:p-4 lg:p-6 flex flex-col md:flex-row items-center justify-between text-white shadow-lg overflow-hidden" style={{ backgroundColor: '#e61d2c', minHeight: 'clamp(12rem, 30vw, 36rem)' }}>

          {/* Texte à gauche */}
          <div className="md:w-1/2 flex flex-col justify-center text-center px-2 xs:px-3 sm:px-4 w-full">
            <div className="flex-shrink-0">
              <img
                src="/Asset 34.svg"
                alt="Influencer Icon"
                className="w-16 h-16 xs:w-20 xs:h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 xl:w-36 xl:h-36 mb-2 xs:mb-3 sm:mb-4 md:mb-5 mx-auto"
              />
            </div>
            <h2 className="text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold mb-2 xs:mb-3 sm:mb-4 md:mb-5 uppercase tracking-wide leading-tight">
              MERCHANDISING MUSICAL
            </h2>
            <p className="text-[11px] xs:text-xs sm:text-sm md:text-base lg:text-lg mb-2 xs:mb-3 sm:mb-4 md:mb-5 leading-relaxed max-w-md mx-auto px-1">
              Soutenez vos artistes favoris avec leur merchandising officiel. Des t-shirts aux accessoires, portez fièrement l'univers de vos musiciens préférés.
            </p>
            <div className="w-full flex justify-center px-2">
              <Button
                onClick={() => navigate('/influenceurs')}
                variant="outline"
                size="lg"
                className="bg-white text-black hover:bg-gray-100 px-3 xs:px-4 sm:px-6 md:px-8 lg:px-10 py-1.5 xs:py-2 sm:py-2.5 md:py-3 text-[11px] xs:text-xs sm:text-sm md:text-base lg:text-lg font-medium border-transparent rounded-full whitespace-nowrap max-w-full"
              >
                Découvrir
              </Button>
            </div>
          </div>

          {/* Grille compacte du merchandising */}
          <div className="md:w-1/2 grid grid-cols-3 gap-0.5 xs:gap-1 sm:gap-1 md:gap-2 mt-3 xs:mt-4 sm:mt-4 md:mt-0 md:ml-3 xs:ml-4 sm:ml-4 h-48 xs:h-56 sm:h-64 md:h-80 lg:h-96 xl:h-[32rem]">
            {merchandising.map((item, index) => (
              <div
                key={item.id}
                className={`${index === 0 || index === 3 || index === 4 ? "row-span-2" : ""} bg-gray-800 rounded-2xl overflow-hidden relative group shadow-md`}
              >
                <img
                  src={item.imageUrl || item.name}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 xs:p-2.5 md:p-3 text-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500 ease-in-out">
                  <p className="text-white text-xs xs:text-sm md:text-base font-semibold leading-tight">
                    {item.name}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
