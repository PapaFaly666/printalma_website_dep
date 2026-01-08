import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, Upload, X, RotateCw, Move, ZoomIn, ZoomOut, Save, ShoppingCart, ArrowLeft } from 'lucide-react';
import Button from '../components/ui/Button';
import { useToast } from '../components/ui/use-toast';
import adminProductsService, { AdminProduct } from '../services/adminProductsService';
import designService, { Design } from '../services/designService';

// Interface pour les transformations du design
interface DesignTransforms {
  positionX: number;  // 0-1 (percentage)
  positionY: number;  // 0-1 (percentage)
  scale: number;      // 0.3-1.5
  rotation: number;   // 0-360 (degrees)
}

// Constantes de validation
const MAX_SCALE = 1.5;
const MIN_SCALE = 0.3;
const DESIGN_BASE_SIZE = 100; // Taille de base du design en pixels

const CustomerProductCustomizationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  // États du produit et design
  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [selectedColorVariation, setSelectedColorVariation] = useState<any>(null);
  const [selectedView, setSelectedView] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // États des designs
  const [designMode, setDesignMode] = useState<'upload' | 'library' | null>(null);
  const [uploadedDesign, setUploadedDesign] = useState<string | null>(null);
  const [vendorDesigns, setVendorDesigns] = useState<Design[]>([]);
  const [selectedDesign, setSelectedDesign] = useState<string | null>(null);
  const [loadingDesigns, setLoadingDesigns] = useState(false);

  // États de transformation
  const [transforms, setTransforms] = useState<DesignTransforms>({
    positionX: 0.5,
    positionY: 0.4,
    scale: 0.8,
    rotation: 0
  });

  // États d'interaction
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const designRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ x: number; y: number; startX: number; startY: number }>({ x: 0, y: 0, startX: 0, startY: 0 });
  const resizeStart = useRef<{ scale: number; startX: number; startY: number }>({ scale: 1, startX: 0, startY: 0 });
  const rotateStart = useRef<{ rotation: number; startAngle: number }>({ rotation: 0, startAngle: 0 });
  const lastUpdateTime = useRef(0);

  // Charger le produit
  useEffect(() => {
    const loadProduct = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);
        const productData = await adminProductsService.getProductById(Number(id));
        setProduct(productData);

        // Sélectionner la première variation de couleur et la première vue
        if (productData.colorVariations && productData.colorVariations.length > 0) {
          const firstColor = productData.colorVariations[0];
          setSelectedColorVariation(firstColor);

          if (firstColor.images && firstColor.images.length > 0) {
            setSelectedView(firstColor.images[0]);
          }
        }
      } catch (err) {
        console.error('Erreur chargement produit:', err);
        setError('Impossible de charger le produit');
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  // Charger les designs vendeur
  const loadVendorDesigns = async () => {
    try {
      setLoadingDesigns(true);
      const response = await designService.getDesigns({
        limit: 20,
        status: 'published'
      });
      setVendorDesigns(response.designs || []);
    } catch (err) {
      console.error('Erreur chargement designs:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les designs',
        variant: 'destructive'
      });
    } finally {
      setLoadingDesigns(false);
    }
  };

  // Sauvegarde automatique en localStorage
  useEffect(() => {
    if (selectedDesign && product) {
      const storageKey = `customer-design-${product.id}-${selectedColorVariation?.id}`;
      localStorage.setItem(storageKey, JSON.stringify({
        design: selectedDesign,
        designMode,
        transforms,
        uploadedDesign,
        timestamp: Date.now()
      }));
    }
  }, [selectedDesign, transforms, product, selectedColorVariation, designMode, uploadedDesign]);

  // Restaurer depuis localStorage au chargement
  useEffect(() => {
    if (product && selectedColorVariation) {
      const storageKey = `customer-design-${product.id}-${selectedColorVariation.id}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const data = JSON.parse(saved);
          // Restaurer seulement si c'est récent (moins de 24h)
          if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
            setSelectedDesign(data.design);
            setDesignMode(data.designMode);
            setTransforms(data.transforms);
            if (data.uploadedDesign) {
              setUploadedDesign(data.uploadedDesign);
            }
          }
        } catch (err) {
          console.error('Erreur restauration:', err);
        }
      }
    }
  }, [product, selectedColorVariation]);

  // Upload de design client
  const handleDesignUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier le type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner une image',
        variant: 'destructive'
      });
      return;
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Erreur',
        description: 'L\'image ne doit pas dépasser 5MB',
        variant: 'destructive'
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      setUploadedDesign(imageUrl);
      setSelectedDesign(imageUrl);
      setDesignMode('upload');

      toast({
        title: 'Design chargé',
        description: 'Positionnez votre design sur le produit'
      });
    };
    reader.readAsDataURL(file);
  };

  // Sélectionner un design de la bibliothèque
  const handleSelectVendorDesign = (design: Design) => {
    setSelectedDesign(design.imageUrl);
    setDesignMode('library');
  };

  // Validation des limites avec les vraies délimitations
  const validateBoundaries = (): boolean => {
    if (!containerRef.current || !selectedView || !selectedView.delimitations || selectedView.delimitations.length === 0) {
      return false;
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    const delimitation = selectedView.delimitations[0]; // Utiliser la première délimitation

    // Taille du design en pixels
    const designSize = DESIGN_BASE_SIZE * transforms.scale;

    // Position du design en pixels (centré sur le point de position)
    const designX = transforms.positionX * containerRect.width - (designSize / 2);
    const designY = transforms.positionY * containerRect.height - (designSize / 2);

    // Convertir les délimitations de l'image de référence (1200x1200) vers les dimensions du container
    const scaleX = containerRect.width / delimitation.referenceWidth;
    const scaleY = containerRect.height / delimitation.referenceHeight;

    // Limites de la zone autorisée (délimitation convertie en pixels du container)
    const boundaryX = delimitation.x * scaleX;
    const boundaryY = delimitation.y * scaleY;
    const boundaryWidth = delimitation.width * scaleX;
    const boundaryHeight = delimitation.height * scaleY;

    // Vérifier si le design est complètement dans la zone
    const designRight = designX + designSize;
    const designBottom = designY + designSize;
    const boundaryRight = boundaryX + boundaryWidth;
    const boundaryBottom = boundaryY + boundaryHeight;

    return (
      designX >= boundaryX &&
      designY >= boundaryY &&
      designRight <= boundaryRight &&
      designBottom <= boundaryBottom
    );
  };

  // Gestion du drag avec throttling
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;

    e.preventDefault();
    setIsDragging(true);

    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      startX: transforms.positionX,
      startY: transforms.positionY
    };

    // Calculer position actuelle en pixels pour affichage immédiat
    const rect = containerRef.current.getBoundingClientRect();
    const currentX = transforms.positionX * rect.width;
    const currentY = transforms.positionY * rect.height;
    setDragPosition({ x: currentX, y: currentY });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    // Throttling à 60fps
    const now = Date.now();
    if (now - lastUpdateTime.current < 16) return;
    lastUpdateTime.current = now;

    const rect = containerRef.current.getBoundingClientRect();
    const deltaX = (e.clientX - dragStart.current.x) / rect.width;
    const deltaY = (e.clientY - dragStart.current.y) / rect.height;

    const newX = Math.max(0, Math.min(1, dragStart.current.startX + deltaX));
    const newY = Math.max(0, Math.min(1, dragStart.current.startY + deltaY));

    // Mise à jour visuelle immédiate
    setDragPosition({
      x: newX * rect.width,
      y: newY * rect.height
    });

    setTransforms(prev => ({
      ...prev,
      positionX: newX,
      positionY: newY
    }));
  };

  const handleMouseUp = () => {
    if (isDragging || isResizing || isRotating) {
      setIsDragging(false);
      setIsResizing(false);
      setIsRotating(false);
      setDragPosition(null);
    }
  };

  // Gestion du resize avec throttling
  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    resizeStart.current = {
      scale: transforms.scale,
      startX: e.clientX,
      startY: e.clientY
    };
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!isResizing) return;

    // Throttling
    const now = Date.now();
    if (now - lastUpdateTime.current < 16) return;
    lastUpdateTime.current = now;

    const deltaX = e.clientX - resizeStart.current.startX;
    const scaleDelta = deltaX / 200;

    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, resizeStart.current.scale + scaleDelta));

    setTransforms(prev => ({
      ...prev,
      scale: newScale
    }));
  };

  // Gestion de la rotation avec throttling
  const handleRotateStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!containerRef.current) return;

    setIsRotating(true);
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180 / Math.PI;

    rotateStart.current = {
      rotation: transforms.rotation,
      startAngle
    };
  };

  const handleRotateMove = (e: MouseEvent) => {
    if (!isRotating || !containerRef.current) return;

    // Throttling
    const now = Date.now();
    if (now - lastUpdateTime.current < 16) return;
    lastUpdateTime.current = now;

    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180 / Math.PI;
    const deltaAngle = currentAngle - rotateStart.current.startAngle;

    const newRotation = (rotateStart.current.rotation + deltaAngle + 360) % 360;

    setTransforms(prev => ({
      ...prev,
      rotation: newRotation
    }));
  };

  // Event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else if (isRotating) {
      document.addEventListener('mousemove', handleRotateMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mousemove', handleRotateMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, isRotating]);

  // Ajouter au panier
  const handleAddToCart = () => {
    if (!selectedDesign) {
      toast({
        title: 'Design requis',
        description: 'Veuillez ajouter un design avant de continuer',
        variant: 'destructive'
      });
      return;
    }

    // Vérifier si des délimitations existent
    if (!selectedView?.delimitations || selectedView.delimitations.length === 0) {
      // Pas de délimitations = pas de validation requise
      toast({
        title: 'Ajouté au panier',
        description: 'Votre produit personnalisé a été ajouté au panier'
      });
      navigate('/cart');
      return;
    }

    // Si des délimitations existent, valider la position
    if (!validateBoundaries()) {
      toast({
        title: 'Position invalide',
        description: 'Le design doit être positionné dans la zone verte',
        variant: 'destructive'
      });
      return;
    }

    // TODO: Ajouter la logique d'ajout au panier avec les transforms
    console.log('Ajout au panier:', {
      productId: product.id,
      colorVariationId: selectedColorVariation?.id,
      design: selectedDesign,
      designMode,
      transforms
    });

    toast({
      title: 'Ajouté au panier',
      description: 'Votre produit personnalisé a été ajouté au panier'
    });

    navigate('/cart');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Produit introuvable'}</p>
          <Button onClick={() => navigate('/')}>Retour à l'accueil</Button>
        </div>
      </div>
    );
  }

  // Validation : true si pas de design, ou si design valide, ou si pas de délimitations
  const isValid = !selectedDesign ||
                  !selectedView?.delimitations ||
                  selectedView.delimitations.length === 0 ||
                  validateBoundaries();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
                <p className="text-sm text-gray-600">Personnalisez votre produit</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold text-gray-900">
                {product.price.toLocaleString()} FCFA
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Panneau gauche - Canvas de personnalisation */}
          <div className="space-y-6">
            {/* Sélection de couleur */}
            {product.colorVariations && product.colorVariations.length > 1 && (
              <div className="bg-white rounded-lg border p-4">
                <h3 className="font-medium text-gray-900 mb-3">Couleur</h3>
                <div className="flex flex-wrap gap-2">
                  {product.colorVariations.map((color) => (
                    <button
                      key={color.id}
                      onClick={() => {
                        setSelectedColorVariation(color);
                        if (color.images && color.images.length > 0) {
                          setSelectedView(color.images[0]);
                        }
                      }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${
                        selectedColorVariation?.id === color.id
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div
                        className="w-6 h-6 rounded-full border-2 border-gray-300"
                        style={{ backgroundColor: color.colorCode }}
                      />
                      <span className="text-sm font-medium">{color.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Canvas de personnalisation */}
            <div className="bg-white rounded-lg border p-6">
              <div className="relative">
                {/* Indicateur de statut */}
                <div className="absolute top-2 right-2 z-10">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    selectedDesign && isValid
                      ? 'bg-green-100 text-green-800'
                      : selectedDesign && !isValid
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {selectedDesign ? (isValid ? 'Valide' : 'Hors limites') : 'Ajoutez un design'}
                  </span>
                </div>

                {/* Container du canvas */}
                <div
                  ref={containerRef}
                  className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden"
                  style={{ touchAction: 'none' }}
                >
                  {/* Image du produit */}
                  {selectedView && (
                    <img
                      src={selectedView.url}
                      alt={product.name}
                      className="w-full h-full object-contain"
                      draggable={false}
                    />
                  )}

                  {/* Overlay de délimitation - toujours visible si délimitation existe */}
                  {selectedView?.delimitations && selectedView.delimitations.length > 0 && containerRef.current && (() => {
                    const delimitation = selectedView.delimitations[0];
                    const containerRect = containerRef.current.getBoundingClientRect();
                    const scaleX = containerRect.width / delimitation.referenceWidth;
                    const scaleY = containerRect.height / delimitation.referenceHeight;

                    // Convertir les coordonnées de délimitation en pourcentages du container
                    const leftPercent = (delimitation.x * scaleX / containerRect.width) * 100;
                    const topPercent = (delimitation.y * scaleY / containerRect.height) * 100;
                    const widthPercent = (delimitation.width * scaleX / containerRect.width) * 100;
                    const heightPercent = (delimitation.height * scaleY / containerRect.height) * 100;

                    return (
                      <>
                        <div
                          className="absolute border-2 border-dashed pointer-events-none"
                          style={{
                            left: `${leftPercent}%`,
                            top: `${topPercent}%`,
                            width: `${widthPercent}%`,
                            height: `${heightPercent}%`,
                            borderColor: selectedDesign ? (isValid ? '#10b981' : '#ef4444') : '#3b82f6',
                            backgroundColor: selectedDesign
                              ? (isValid ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)')
                              : 'rgba(59, 130, 246, 0.1)'
                          }}
                        />
                        {/* Label de la zone */}
                        {!selectedDesign && (
                          <div
                            className="absolute pointer-events-none text-xs font-medium text-blue-600"
                            style={{
                              left: `${leftPercent}%`,
                              top: `${topPercent - 3}%`,
                            }}
                          >
                            Zone de design
                          </div>
                        )}
                      </>
                    );
                  })()}

                  {/* Design positionnable */}
                  {selectedDesign && (
                    <div
                      ref={designRef}
                      className="absolute"
                      style={{
                        left: '50%',
                        top: '50%',
                        transform: `translate(-50%, -50%) translate(${
                          (transforms.positionX - 0.5) * (containerRef.current?.offsetWidth || 0)
                        }px, ${
                          (transforms.positionY - 0.5) * (containerRef.current?.offsetHeight || 0)
                        }px) scale(${transforms.scale}) rotate(${transforms.rotation}deg)`,
                        cursor: isDragging ? 'grabbing' : isResizing ? 'se-resize' : isRotating ? 'alias' : 'grab',
                        transformOrigin: 'center',
                        willChange: 'transform',
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        userSelect: 'none',
                        pointerEvents: isDragging || isResizing || isRotating ? 'auto' : 'auto',
                        transition: (isDragging || isResizing || isRotating) ? 'none' : 'transform 0.1s ease-out'
                      }}
                      onMouseDown={handleMouseDown}
                    >
                      <img
                        src={selectedDesign}
                        alt="Design"
                        className="w-24 h-24 object-contain select-none"
                        draggable={false}
                      />

                      {/* Handle de resize */}
                      <div
                        className="absolute bottom-0 right-0 w-6 h-6 bg-blue-500 rounded-full cursor-se-resize flex items-center justify-center shadow-lg"
                        onMouseDown={handleResizeStart}
                      >
                        <ZoomIn className="w-3 h-3 text-white" />
                      </div>

                      {/* Handle de rotation */}
                      <div
                        className="absolute -top-8 left-1/2 -translate-x-1/2 w-6 h-6 bg-green-500 rounded-full cursor-alias flex items-center justify-center shadow-lg"
                        onMouseDown={handleRotateStart}
                      >
                        <RotateCw className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Info sur les délimitations */}
              {!selectedDesign && selectedView?.delimitations && selectedView.delimitations.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800">
                    <span className="font-semibold">Zone bleue :</span> Votre design doit rester dans cette zone pour être imprimé correctement.
                  </p>
                </div>
              )}

              {/* Instructions pour le design */}
              {selectedDesign && (
                <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-xs text-gray-600 mb-2">
                    <span className="font-semibold">Comment positionner :</span>
                  </p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• <span className="font-medium">Déplacer :</span> Cliquez et glissez le design</li>
                    <li>• <span className="font-medium">Redimensionner :</span> Utilisez le bouton bleu</li>
                    <li>• <span className="font-medium">Rotation :</span> Utilisez le bouton vert</li>
                  </ul>
                </div>
              )}

              {/* Contrôles de transformation */}
              {selectedDesign && (
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Position X</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={transforms.positionX}
                      onChange={(e) => setTransforms(prev => ({ ...prev, positionX: parseFloat(e.target.value) }))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Position Y</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={transforms.positionY}
                      onChange={(e) => setTransforms(prev => ({ ...prev, positionY: parseFloat(e.target.value) }))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Taille ({Math.round(transforms.scale * 100)}%)</label>
                    <input
                      type="range"
                      min={MIN_SCALE}
                      max={MAX_SCALE}
                      step="0.01"
                      value={transforms.scale}
                      onChange={(e) => setTransforms(prev => ({ ...prev, scale: parseFloat(e.target.value) }))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Rotation ({Math.round(transforms.rotation)}°)</label>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      step="1"
                      value={transforms.rotation}
                      onChange={(e) => setTransforms(prev => ({ ...prev, rotation: parseFloat(e.target.value) }))}
                      className="w-full"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTransforms({ positionX: 0.5, positionY: 0.4, scale: 0.8, rotation: 0 })}
                    className="w-full"
                  >
                    Réinitialiser
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Panneau droit - Sélection du design */}
          <div className="space-y-6">
            {/* Choix du mode */}
            {!designMode && (
              <div className="bg-white rounded-lg border p-6">
                <h3 className="font-medium text-gray-900 mb-4">Ajouter un design</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      setDesignMode('upload');
                      document.getElementById('design-upload')?.click();
                    }}
                    className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-center"
                  >
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="font-medium text-gray-900">Uploader</p>
                    <p className="text-xs text-gray-500 mt-1">Votre propre design</p>
                  </button>
                  <button
                    onClick={() => {
                      setDesignMode('library');
                      loadVendorDesigns();
                    }}
                    className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-center"
                  >
                    <div className="w-8 h-8 mx-auto mb-2 text-gray-400">📚</div>
                    <p className="font-medium text-gray-900">Bibliothèque</p>
                    <p className="text-xs text-gray-500 mt-1">Designs des artistes</p>
                  </button>
                </div>
                <input
                  id="design-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleDesignUpload}
                  className="hidden"
                />
              </div>
            )}

            {/* Mode upload */}
            {designMode === 'upload' && (
              <div className="bg-white rounded-lg border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900">Votre design</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDesignMode(null);
                      setUploadedDesign(null);
                      setSelectedDesign(null);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                {uploadedDesign ? (
                  <div className="relative">
                    <img src={uploadedDesign} alt="Design uploadé" className="w-full rounded-lg" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('design-upload')?.click()}
                      className="w-full mt-3"
                    >
                      Changer de design
                    </Button>
                  </div>
                ) : (
                  <label className="block cursor-pointer">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary hover:bg-primary/5 transition-colors">
                      <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p className="font-medium text-gray-900 mb-1">Cliquez pour uploader</p>
                      <p className="text-sm text-gray-500">PNG, JPG jusqu'à 5MB</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleDesignUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            )}

            {/* Mode bibliothèque */}
            {designMode === 'library' && (
              <div className="bg-white rounded-lg border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900">Designs disponibles</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDesignMode(null);
                      setSelectedDesign(null);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                {loadingDesigns ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : vendorDesigns.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                    {vendorDesigns.map((design) => (
                      <button
                        key={design.id}
                        onClick={() => handleSelectVendorDesign(design)}
                        className={`p-2 rounded-lg border-2 transition-all ${
                          selectedDesign === design.imageUrl
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <img
                          src={design.imageUrl}
                          alt={design.name}
                          className="w-full aspect-square object-contain rounded"
                        />
                        <p className="text-xs font-medium text-gray-900 mt-2 truncate">
                          {design.name}
                        </p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">Aucun design disponible</p>
                )}
              </div>
            )}

            {/* Résumé et actions */}
            <div className="bg-white rounded-lg border p-6 sticky top-24">
              <h3 className="font-medium text-gray-900 mb-4">Résumé</h3>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Produit</span>
                  <span className="font-medium text-gray-900">{product.name}</span>
                </div>
                {selectedColorVariation && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Couleur</span>
                    <span className="font-medium text-gray-900">{selectedColorVariation.name}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Design</span>
                  <span className="font-medium text-gray-900">
                    {selectedDesign ? (designMode === 'upload' ? 'Personnel' : 'Bibliothèque') : 'Non ajouté'}
                  </span>
                </div>
                <div className="flex justify-between text-sm pt-3 border-t">
                  <span className="text-gray-900 font-semibold">Total</span>
                  <span className="text-lg font-bold text-gray-900">
                    {product.price.toLocaleString()} FCFA
                  </span>
                </div>
              </div>

              <Button
                onClick={handleAddToCart}
                disabled={!selectedDesign || !isValid}
                className="w-full"
                size="lg"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Ajouter au panier
              </Button>

              {selectedDesign && !isValid && (
                <p className="text-xs text-red-600 mt-2 text-center">
                  Le design doit être dans les limites vertes
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerProductCustomizationPage;
