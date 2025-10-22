import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Minus, Trash2, ShoppingCart } from 'lucide-react';
import { CartItem } from '../types/cart';
import DesignPositionService from '../services/DesignPositionService';
import { useAuth } from '../contexts/AuthContext';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
}

// Interface pour les délimitations (similaire à SimpleProductPreview)
interface DelimitationData {
  x: number;
  y: number;
  width: number;
  height: number;
  coordinateType: 'PERCENTAGE' | 'PIXEL';
}

// Interface pour les métriques d'image
interface ImageMetrics {
  originalWidth: number;
  originalHeight: number;
  displayWidth: number;
  displayHeight: number;
  canvasScale: number;
  canvasOffsetX: number;
  canvasOffsetY: number;
}

// Composant pour afficher un produit avec design (similaire à SimpleProductPreview)
const ProductWithDesign: React.FC<{
  item: CartItem;
  user: any;
}> = ({ item, user }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageMetrics, setImageMetrics] = useState<ImageMetrics | null>(null);

  // Calculer les métriques d'image
  const calculateImageMetrics = () => {
    if (!imgRef.current || !containerRef.current) return null;

    const img = imgRef.current;
    const container = containerRef.current;

    const originalWidth = img.naturalWidth;
    const originalHeight = img.naturalHeight;
    const containerRect = container.getBoundingClientRect();

    // Calculer les dimensions d'affichage (object-fit: contain)
    const containerRatio = containerRect.width / containerRect.height;
    const imageRatio = originalWidth / originalHeight;

    let displayWidth, displayHeight, offsetX, offsetY;

    if (imageRatio > containerRatio) {
      // Image plus large que le container
      displayWidth = containerRect.width;
      displayHeight = containerRect.width / imageRatio;
      offsetX = 0;
      offsetY = (containerRect.height - displayHeight) / 2;
    } else {
      // Image plus haute que le container
      displayHeight = containerRect.height;
      displayWidth = containerRect.height * imageRatio;
      offsetX = (containerRect.width - displayWidth) / 2;
      offsetY = 0;
    }

    const scale = displayWidth / originalWidth;

    return {
      originalWidth,
      originalHeight,
      displayWidth,
      displayHeight,
      canvasScale: scale,
      canvasOffsetX: offsetX,
      canvasOffsetY: offsetY
    };
  };

  // Obtenir la position du design depuis localStorage
  const getDesignPosition = () => {
    if (!item.designId || !user?.id || !item.adminProductId) {
      return {
        x: 0,
        y: 0,
        scale: item.designScale || 0.8,
        rotation: 0,
        designWidth: undefined,
        designHeight: undefined,
        designScale: item.designScale || 0.8,
        constraints: {},
        source: 'default',
        sizeId: item.selectedSize?.id || item.sizeId,
        sizeName: item.selectedSize?.sizeName || item.sizeName || item.size
      };
    }

    // Utiliser la taille pour récupérer la position spécifique à cette taille
    const sizeId = item.selectedSize?.id || item.sizeId;
    const sizeName = item.selectedSize?.sizeName || item.sizeName || item.size;

    const localStorageData = DesignPositionService.getPosition(item.designId, item.adminProductId, user.id);
    if (localStorageData && localStorageData.position) {
      const localPosition = localStorageData.position as any;
      return {
        x: localPosition.x || 0,
        y: localPosition.y || 0,
        scale: localPosition.scale || item.designScale || 0.8,
        rotation: localPosition.rotation || 0,
        designWidth: localPosition.designWidth,
        designHeight: localPosition.designHeight,
        designScale: localPosition.designScale || item.designScale || 0.8,
        constraints: localPosition.constraints || {},
        source: 'localStorage',
        sizeId,
        sizeName
      };
    }

    return {
      x: 0,
      y: 0,
      scale: item.designScale || 0.8,
      rotation: 0,
      designWidth: undefined,
      designHeight: undefined,
      designScale: item.designScale || 0.8,
      constraints: {},
      source: 'default',
      sizeId,
      sizeName
    };
  };

  // Convertir les coordonnées de délimitation vers les coordonnées d'affichage
  const computePxPosition = (delim: DelimitationData) => {
    if (!imageMetrics || !containerRef.current) return { left: 0, top: 0, width: 0, height: 0 };

    // Détection automatique du type de coordonnées
    const isPixel = delim.coordinateType === 'PIXEL' || delim.x > 100 || delim.y > 100;

    const imgW = imageMetrics.originalWidth || 1200;
    const imgH = imageMetrics.originalHeight || 1200;

    // Conversion en pourcentage si nécessaire
    const pct = {
      x: isPixel ? (delim.x / imgW) * 100 : delim.x,
      y: isPixel ? (delim.y / imgH) * 100 : delim.y,
      w: isPixel ? (delim.width / imgW) * 100 : delim.width,
      h: isPixel ? (delim.height / imgH) * 100 : delim.height,
    };

    // Utiliser les dimensions du conteneur
    const { width: contW, height: contH } = containerRef.current.getBoundingClientRect();
    if (contW === 0 || contH === 0) return { left: 0, top: 0, width: 0, height: 0 };

    // Calcul responsive
    const imgRatio = imgW / imgH;
    const contRatio = contW / contH;

    let dispW: number, dispH: number, offsetX: number, offsetY: number;
    if (imgRatio > contRatio) {
      dispW = contW;
      dispH = contW / imgRatio;
      offsetX = 0;
      offsetY = (contH - dispH) / 2;
    } else {
      dispH = contH;
      dispW = contH * imgRatio;
      offsetX = (contW - dispW) / 2;
      offsetY = 0;
    }

    return {
      left: offsetX + (pct.x / 100) * dispW,
      top: offsetY + (pct.y / 100) * dispH,
      width: (pct.w / 100) * dispW,
      height: (pct.h / 100) * dispH,
    };
  };

  // Observer les changements
  useEffect(() => {
    if (imgRef.current && imageLoaded && containerRef.current) {
      const metrics = calculateImageMetrics();
      setImageMetrics(metrics);
    }
  }, [imageLoaded]);

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      if (imageLoaded) {
        const metrics = calculateImageMetrics();
        setImageMetrics(metrics);
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, [imageLoaded]);

  const designPosition = getDesignPosition();
  const delimitations = item.delimitations || [];

  return (
    <div className="relative w-20 h-20 bg-white rounded-lg border border-gray-200 flex items-center justify-center p-2">
      {/* Conteneur principal */}
      <div
        ref={containerRef}
        className="relative w-full h-full"
      >
        {/* Image du produit */}
        <img
          ref={imgRef}
          src={item.imageUrl}
          alt={item.name}
          className="w-full h-full object-contain rounded"
          onLoad={() => setImageLoaded(true)}
        />

        {/* Design superposé si présent */}
        {item.designUrl && imageMetrics && delimitations.length > 0 && (() => {
          const delimitation = delimitations[0];
          if (!delimitation) return null;

          const pos = computePxPosition(delimitation);
          if (pos.width <= 0 || pos.height <= 0) return null;

          const { x, y, scale, rotation } = designPosition;
          const designScale = scale || 0.8;
          const actualDesignWidth = pos.width * designScale;
          const actualDesignHeight = pos.height * designScale;

          // Contraintes de positionnement
          const maxX = (pos.width - actualDesignWidth) / 2;
          const minX = -(pos.width - actualDesignWidth) / 2;
          const maxY = (pos.height - actualDesignHeight) / 2;
          const minY = -(pos.height - actualDesignHeight) / 2;
          const adjustedX = Math.max(minX, Math.min(x, maxX));
          const adjustedY = Math.max(minY, Math.min(y, maxY));

          return (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                zIndex: 2,
                overflow: 'visible'
              }}
            >
              {/* Conteneur délimité */}
              <div
                className="absolute overflow-hidden"
                style={{
                  left: pos.left,
                  top: pos.top,
                  width: pos.width,
                  height: pos.height,
                  pointerEvents: 'none',
                }}
              >
                {/* Conteneur du design */}
                <div
                  className="absolute pointer-events-none select-none"
                  style={{
                    left: '50%',
                    top: '50%',
                    width: actualDesignWidth,
                    height: actualDesignHeight,
                    transform: `translate(-50%, -50%) translate(${adjustedX}px, ${adjustedY}px) rotate(${rotation || 0}deg)`,
                    transformOrigin: 'center center',
                    transition: 'transform 0.1s ease-out',
                  }}
                >
                  {/* Image du design */}
                  <img
                    src={item.designUrl}
                    alt="Design"
                    className="object-contain pointer-events-none select-none"
                    draggable={false}
                    style={{
                      width: '100%',
                      height: '100%',
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

const CartSidebar: React.FC<CartSidebarProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout
}) => {
  const { user } = useAuth();
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-white/30 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Panier latéral */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl transform transition-transform">
        <div className="flex flex-col h-full">
          {/* En-tête du panier */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-6 h-6 text-gray-900" />
              <h2 className="text-xl font-semibold text-gray-900">
                Mon Panier ({totalItems})
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Liste des produits */}
          <div className="flex-1 overflow-y-auto p-6">
            {items.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Votre panier est vide</p>
                <p className="text-gray-400 text-sm mt-2">
                  Ajoutez des produits pour commencer vos achats
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex gap-4">
                      {/* Image du produit avec design intégré */}
                      <ProductWithDesign item={item} user={user} />

                      {/* Détails du produit */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-sm mb-1">
                          {item.name}
                        </h3>
                        <p className="text-xs text-gray-500 mb-1">
                          {item.vendorName && `Par ${item.vendorName}`}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                          <div
                            className="w-4 h-4 rounded border border-gray-300"
                            style={{ backgroundColor: item.colorCode }}
                          />
                          <span>{item.color}</span>
                          <span>•</span>
                          <span>
                            Taille {item.selectedSize?.sizeName || item.sizeName || item.size}
                          </span>
                        </div>
                        <p className="font-semibold text-gray-900">
                          {(item.price / 100).toLocaleString('fr-FR')} FCFA
                        </p>
                      </div>

                      {/* Contrôles */}
                      <div className="flex flex-col items-end gap-2">
                        <button
                          onClick={() => onRemoveItem(item.id)}
                          className="p-1 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>

                        <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200">
                          <button
                            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                            className="p-1 hover:bg-gray-100 rounded-l transition-colors"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-3 h-3 text-gray-600" />
                          </button>
                          <span className="w-8 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            className="p-1 hover:bg-gray-100 rounded-r transition-colors"
                          >
                            <Plus className="w-3 h-3 text-gray-600" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Design si présent */}
                    {item.designUrl && (
                      <div className="mt-3 p-2 bg-white rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-600 mb-1">Design personnalisé :</p>
                        <div className="flex items-center gap-2">
                          <img
                            src={item.designUrl}
                            alt="Design"
                            className="w-8 h-8 object-contain"
                          />
                          <span className="text-xs text-gray-700">Inclus</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pied du panier */}
          {items.length > 0 && (
            <div className="border-t border-gray-200 p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Total</span>
                <span className="text-2xl font-bold text-gray-900">
                  {(totalPrice / 100).toLocaleString('fr-FR')} FCFA
                </span>
              </div>

              <div className="space-y-2">
                <button
                  onClick={onCheckout}
                  className="w-full bg-yellow-400 text-gray-900 py-3 rounded-lg font-semibold hover:bg-yellow-500 transition-colors"
                >
                  Valider la commande
                </button>

                <button
                  onClick={onClose}
                  className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Continuer mes achats
                </button>
              </div>

              <p className="text-xs text-gray-500 text-center">
                Frais de port calculés à l'étape suivante
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartSidebar;