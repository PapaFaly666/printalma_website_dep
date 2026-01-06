import React from 'react';
import { X, Heart, Trash2 } from 'lucide-react';
import { useFavorites } from '../contexts/FavoritesContext';
import { useNavigate } from 'react-router-dom';
import { SimpleProductPreview } from './vendor/SimpleProductPreview';

const FavoritesDrawer: React.FC = () => {
  const { favorites, favoritesCount, isFavoritesOpen, closeFavorites, removeFromFavorites, clearFavorites } = useFavorites();
  const navigate = useNavigate();

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      maximumFractionDigits: 0
    }).format(price);
  };

  const handleProductClick = (productId: number) => {
    closeFavorites();
    navigate(`/vendor-product-detail/${productId}`);
  };

  if (!isFavoritesOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-[100] transition-opacity"
        onClick={closeFavorites}
      />

      {/* Drawer latéral */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-[480px] bg-white shadow-2xl z-[101] transform transition-transform duration-300 ease-in-out flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-pink-50 to-red-50">
          <div className="flex items-center gap-3">
            <Heart className="w-6 h-6 text-pink-500 fill-pink-500" />
            <h2 className="text-xl font-bold text-gray-900">
              Mes Favoris
              {favoritesCount > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-600">
                  ({favoritesCount} {favoritesCount === 1 ? 'article' : 'articles'})
                </span>
              )}
            </h2>
          </div>
          <button
            onClick={closeFavorites}
            className="p-2 hover:bg-white/80 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto">
          {favoritesCount === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="w-24 h-24 bg-pink-50 rounded-full flex items-center justify-center mb-4">
                <Heart className="w-12 h-12 text-pink-300" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Aucun favori pour le moment
              </h3>
              <p className="text-gray-600 mb-6">
                Ajoutez des produits à vos favoris pour les retrouver facilement
              </p>
              <button
                onClick={closeFavorites}
                className="px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
              >
                Continuer mes achats
              </button>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {favorites.map((favorite) => (
                <div
                  key={favorite.id}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="flex gap-4 p-4">
                    {/* Aperçu du produit */}
                    <div
                      className="w-32 h-32 flex-shrink-0 cursor-pointer"
                      onClick={() => handleProductClick(favorite.id)}
                    >
                      <SimpleProductPreview
                        product={favorite}
                        showColorSlider={false}
                        showDelimitations={false}
                        className="w-full h-full rounded-lg overflow-hidden"
                        onColorChange={() => {}}
                        hideValidationBadges={true}
                        imageObjectFit="cover"
                        initialColorId={favorite.defaultColorId ?? undefined}
                      />
                    </div>

                    {/* Informations */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h3
                          className="font-semibold text-gray-900 mb-1 cursor-pointer hover:text-blue-600 transition-colors"
                          onClick={() => handleProductClick(favorite.id)}
                        >
                          {favorite.vendorName}
                        </h3>
                        {favorite.vendor && (
                          <p className="text-sm text-gray-600 mb-2">
                            Par {favorite.vendor.shop_name || favorite.vendor.fullName}
                          </p>
                        )}
                        <p className="text-lg font-bold text-gray-900">
                          {formatPrice(favorite.price)} <span className="text-sm font-normal text-gray-600">FCFA</span>
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleProductClick(favorite.id)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Visiter le produit
                        </button>
                        <button
                          onClick={() => removeFromFavorites(favorite.id)}
                          className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"
                          title="Retirer des favoris"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {favoritesCount > 0 && (
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <button
              onClick={clearFavorites}
              className="w-full py-3 px-4 border-2 border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium"
            >
              Vider tous les favoris
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default FavoritesDrawer;
