import React, { useEffect, useState } from "react";
import { Designer } from '../services/designerService';
import designerService from '../services/designerService';

export default function DesignersSection() {
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFeaturedDesigners = async () => {
      try {
        const featuredDesigners = await designerService.getFeaturedDesigners();
        setDesigners(featuredDesigners);
      } catch (error) {
        console.error('Erreur lors du chargement des designers:', error);
        // En cas d'erreur, utiliser les designers par défaut (fallback)
        setDesigners([
          {
            id: 1,
            name: 'Pap Musa',
            displayName: 'Pap Musa',
            bio: 'Artiste spécialisé dans les motifs traditionnels africains',
            avatarUrl: '/x_pap_musa.svg',
            isActive: true,
            sortOrder: 1,
            featuredOrder: 1,
            isFeatured: true,
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-01-01T00:00:00.000Z',
            creator: {
              id: 1,
              firstName: 'Papa Faly',
              lastName: 'Diagne'
            }
          },
          {
            id: 2,
            name: 'Ceeneer',
            displayName: 'Ceeneer',
            bio: 'Ibrahima Diop - Designer moderne et innovant',
            avatarUrl: '/x_ceeneer.svg',
            isActive: true,
            sortOrder: 2,
            featuredOrder: 2,
            isFeatured: true,
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-01-01T00:00:00.000Z',
            creator: {
              id: 1,
              firstName: 'Papa Faly',
              lastName: 'Diagne'
            }
          },
          {
            id: 3,
            name: 'K & C',
            displayName: 'K & C',
            bio: 'Collectif de designers créatifs',
            avatarUrl: '/x_kethiakh.svg',
            isActive: true,
            sortOrder: 3,
            featuredOrder: 3,
            isFeatured: true,
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-01-01T00:00:00.000Z',
            creator: {
              id: 1,
              firstName: 'Papa Faly',
              lastName: 'Diagne'
            }
          },
          {
            id: 4,
            name: 'Breadwinner',
            displayName: 'Breadwinner',
            bio: 'Expert en design minimaliste',
            avatarUrl: '/x_breadwinner.svg',
            isActive: true,
            sortOrder: 4,
            featuredOrder: 4,
            isFeatured: true,
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-01-01T00:00:00.000Z',
            creator: {
              id: 1,
              firstName: 'Papa Faly',
              lastName: 'Diagne'
            }
          },
          {
            id: 5,
            name: 'Meissa Biguey',
            displayName: 'Meissa Biguey',
            bio: 'Artiste polyvalent dans tous les styles',
            avatarUrl: '/x_maisssa_biguey.svg',
            isActive: true,
            sortOrder: 5,
            featuredOrder: 5,
            isFeatured: true,
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-01-01T00:00:00.000Z',
            creator: {
              id: 1,
              firstName: 'Papa Faly',
              lastName: 'Diagne'
            }
          },
          {
            id: 6,
            name: 'DAD',
            displayName: 'DAD',
            bio: 'Designer de street art',
            avatarUrl: '/x_dad.svg',
            isActive: true,
            sortOrder: 6,
            featuredOrder: 6,
            isFeatured: false,
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-01-01T00:00:00.000Z',
            creator: {
              id: 1,
              firstName: 'Papa Faly',
              lastName: 'Diagne'
            }
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadFeaturedDesigners();
  }, []);

  // Utiliser les 6 premiers designers ou les 6 par défaut
  const displayDesigners = designers.slice(0, 6);

  return (
    <div className="w-full py-1 md:py-2 pt-6 sm:pt-8 md:pt-10 lg:pt-12">
      {/* Titre principal et bouton sur la même ligne */}
      <div className="flex items-center justify-between mb-1 px-4 sm:px-8">
        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-black flex items-center gap-3">
          <span className="font-bold">Designers</span>
          <img src="/x_designer.svg" alt="Designer" className="w-6 h-6 md:w-8 md:h-8" />
        </h2>
        
        <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
          Voir Tous les designers
        </button>
      </div>

      {/* Container principal */}
      <div className="w-full px-4 sm:px-8">
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

            {/* Colonne droite - Grille designers dynamique */}
            <div className="bg-yellow-400 relative">
              {loading ? (
                <div className="grid grid-cols-3 gap-1 md:gap-2 p-3 md:p-4 h-full auto-rows-fr">
                  {[...Array(6)].map((_, index) => (
                    <div key={index} className={`${index === 0 || index === 3 || index === 4 ? "row-span-2" : ""} bg-black rounded overflow-hidden flex items-center justify-center`}>
                      <div className="animate-pulse flex flex-col items-center justify-center text-white">
                        <div className={`${index === 0 || index === 3 || index === 4 ? "w-12 h-12 md:w-16 md:h-16" : "w-10 h-10 md:w-12 md:h-12"} bg-gray-600 rounded-full mb-1`}></div>
                        <div className="h-3 bg-gray-600 rounded w-12"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1 md:gap-2 p-3 md:p-4 h-full auto-rows-fr">
                  {displayDesigners.length === 0 ? (
                    <div className="col-span-3 flex items-center justify-center h-full">
                      <div className="text-black text-center">
                        <div className="text-sm font-medium mb-2">Aucun designer disponible</div>
                        <div className="text-xs opacity-80">Revenez plus tard</div>
                      </div>
                    </div>
                  ) : (
                    displayDesigners.map((designer, index) => (
                      <div
                        key={designer.id}
                        className={`${index === 0 || index === 3 || index === 4 ? "row-span-2" : ""} bg-black rounded overflow-hidden relative group flex flex-col items-center justify-center text-white`}
                      >
                        <img
                          src={designer.avatarUrl || '/placeholder-avatar.png'}
                          alt={designer.displayName || designer.name}
                          className={`${index === 0 || index === 3 || index === 4 ? "w-12 h-12 md:w-16 md:h-16 mb-2" : "w-10 h-10 md:w-12 md:h-12 mb-1"} group-hover:scale-110 transition-transform duration-300 object-cover`}
                          onError={(e) => {
                            // Fallback vers une image par défaut si l'image ne charge pas
                            const target = e.target as HTMLImageElement;
                            target.src = '/placeholder-avatar.png';
                          }}
                        />
                        <span className={`font-bold ${index === 0 || index === 3 || index === 4 ? "text-xs md:text-sm" : "text-xs md:text-sm"}`}>
                          {designer.displayName || designer.name}
                        </span>
                        {index === 1 && designer.bio && (
                          <span className="text-xs opacity-80 hidden md:block">
                            {designer.bio.split(' ').slice(0, 2).join(' ')}
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}