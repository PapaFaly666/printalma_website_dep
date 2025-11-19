import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Loader2,
  ShoppingCart,
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  Type,
  Save,
  Share2,
  Maximize,
  HelpCircle,
  Shirt,
  X,
  Search,
  Star,
  Flag,
  Cloud,
  CloudOff
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { useToast } from '../components/ui/use-toast';
import adminProductsService, { AdminProduct } from '../services/adminProductsService';
import designService from '../services/designService';
import customizationService from '../services/customizationService';
import { normalizeProductFromApi } from '../utils/productNormalization';
import ProductDesignEditor, { ProductDesignEditorRef } from '../components/ProductDesignEditor';
import SizeQuantityModal from '../components/SizeQuantityModal';
import { useCart } from '../contexts/CartContext';

// Fonction debounce pour l'auto-sauvegarde
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), wait);
  };
}

const CustomerProductCustomizationPageV3: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addToCart, openCart } = useCart();
  const editorRef = useRef<ProductDesignEditorRef>(null);

  // États du produit
  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [selectedColorVariation, setSelectedColorVariation] = useState<any>(null);
  const [selectedView, setSelectedView] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // États de l'interface
  const [activeTab, setActiveTab] = useState<'designs' | 'text' | 'upload'>('designs');
  const [showDesignLibrary, setShowDesignLibrary] = useState(false);
  const [vendorDesigns, setVendorDesigns] = useState<any[]>([]);
  const [loadingDesigns, setLoadingDesigns] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [designSearch, setDesignSearch] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Filtres pour les designs
  const [showFreeOnly, setShowFreeOnly] = useState(false);
  const [showAllAudience, setShowAllAudience] = useState(true);
  const [showAdaptableColor, setShowAdaptableColor] = useState(true);

  // Éléments de design - organisés par vue
  // Structure: { "colorId-viewId": [...elements] }
  const [designElementsByView, setDesignElementsByView] = useState<Record<string, any[]>>({});
  // Ref pour éviter les closures stale dans les callbacks async
  const designElementsByViewRef = useRef<Record<string, any[]>>({});

  // Flag pour éviter la sauvegarde pendant la restauration
  const isRestoringRef = useRef(false);
  // Flag pour tracker si la restauration initiale est complète
  const hasRestoredRef = useRef(false);

  // Synchroniser la ref avec le state
  useEffect(() => {
    designElementsByViewRef.current = designElementsByView;
  }, [designElementsByView]);

  // Modal de sélection taille/quantité
  const [showSizeModal, setShowSizeModal] = useState(false);

  // États de synchronisation avec la base de données
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const currentCustomizationIdRef = useRef<number | null>(null);

  // Fonction helper pour obtenir la clé de la vue actuelle
  const getCurrentViewKey = () => {
    if (!selectedColorVariation || !selectedView) return null;
    return `${selectedColorVariation.id}-${selectedView.id}`;
  };

  // Obtenir les éléments de la vue actuelle
  const getCurrentElements = () => {
    const viewKey = getCurrentViewKey();
    if (!viewKey) return [];
    return designElementsByView[viewKey] || [];
  };

  // Traduire le viewType en français
  const getViewName = (viewType: string, index: number): string => {
    const viewNames: Record<string, string> = {
      'FRONT': 'Devant',
      'BACK': 'Arrière',
      'LEFT': 'Gauche',
      'RIGHT': 'Droite',
      'TOP': 'Dessus',
      'BOTTOM': 'Dessous',
      'DETAIL': 'Détail',
      'OTHER': 'Autre'
    };

    return viewNames[viewType?.toUpperCase()] || `Vue ${index + 1}`;
  };

  // Obtenir les éléments pour une vue spécifique
  const getElementsForView = (colorId: number, viewId: number) => {
    const viewKey = `${colorId}-${viewId}`;
    return designElementsByView[viewKey] || [];
  };

  // Charger le produit
  useEffect(() => {
    const loadProduct = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);
        const productData = await adminProductsService.getProductById(Number(id));
        const normalizedProduct = normalizeProductFromApi(productData);
        setProduct(normalizedProduct);

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

  // ÉTAPE 1: Restaurer la couleur et la vue depuis localStorage au démarrage
  useEffect(() => {
    if (!id || !product || hasRestoredRef.current) return;

    try {
      const storageKey = `design-data-product-${id}`;
      const saved = localStorage.getItem(storageKey);

      if (saved) {
        console.log('📦 [Customization] Lecture localStorage pour couleur/vue...');
        const data = JSON.parse(saved);

        // TOUJOURS activer le flag avant de restaurer couleur/vue
        // pour éviter que la sauvegarde ne s'active pendant la restauration
        console.log('🔒 [Customization] Activation du flag de restauration');
        isRestoringRef.current = true;

        // Restaurer uniquement la couleur et la vue
        if (data.colorVariationId && product.colorVariations) {
          const savedColor = product.colorVariations.find(c => c.id === data.colorVariationId);
          if (savedColor) {
            console.log('🎨 [Customization] Restauration couleur:', savedColor);
            setSelectedColorVariation(savedColor);

            if (data.viewId && savedColor.images) {
              const savedView = savedColor.images.find(img => img.id === data.viewId);
              if (savedView) {
                console.log('🖼️ [Customization] Restauration vue:', savedView);
                setSelectedView(savedView);
              }
            }
          }
        }

        // Restaurer les éléments par vue
        if (data.elementsByView && typeof data.elementsByView === 'object') {
          console.log('📦 [Customization] Restauration éléments par vue:', Object.keys(data.elementsByView).length);
          setDesignElementsByView(data.elementsByView);
          hasRestoredRef.current = true;
          setTimeout(() => {
            isRestoringRef.current = false;
          }, 1000);
        } else {
          // Aucune donnée par vue, marquer comme restauré
          hasRestoredRef.current = true;
          setTimeout(() => {
            isRestoringRef.current = false;
          }, 1000);
        }
      } else {
        // Aucune donnée sauvegardée, marquer comme restauré
        hasRestoredRef.current = true;
      }
    } catch (err) {
      console.error('❌ [Customization] Erreur lecture localStorage (couleur/vue):', err);
      hasRestoredRef.current = true;
    }
  }, [id, product]);

  // Note: L'ÉTAPE 2 n'est plus nécessaire car on restaure tout dans l'ÉTAPE 1

  // ÉTAPE 1.5: Charger le draft depuis la base de données
  useEffect(() => {
    const loadDraftFromDatabase = async () => {
      if (!id || !product || !hasRestoredRef.current) return;

      try {
        console.log('🔍 [Customization] Recherche draft en base de données...');
        const draft = await customizationService.getProductDraft(Number(id));

        if (draft) {
          console.log('📦 [Customization] Draft trouvé en BDD:', {
            id: draft.id,
            elementsCount: draft.designElements?.length || 0,
            colorVariationId: draft.colorVariationId,
            viewId: draft.viewId
          });

          // Sauvegarder l'ID pour les mises à jour futures
          currentCustomizationIdRef.current = draft.id;

          // Si le localStorage est vide mais qu'on a un draft en BDD, le restaurer
          const storageKey = `design-data-product-${id}`;
          const localData = localStorage.getItem(storageKey);

          if (!localData || JSON.parse(localData).elementsByView === undefined) {
            console.log('💾 [Customization] Restauration depuis BDD vers localStorage');

            // Reconstruire le format elementsByView depuis le draft
            const viewKey = `${draft.colorVariationId}-${draft.viewId}`;
            let elementsToRestore = draft.designElements || [];

            // 🔍 DEBUG: Vérifier la structure des éléments restaurés
            console.log('🔍 DEBUG - Éléments depuis BDD:', {
              isArray: Array.isArray(elementsToRestore),
              length: elementsToRestore.length,
              firstIsArray: elementsToRestore.length > 0 ? Array.isArray(elementsToRestore[0]) : false
            });

            // 🚨 Corriger le double wrapping si détecté dans les données BDD
            if (elementsToRestore.length > 0 && Array.isArray(elementsToRestore[0])) {
              console.warn('⚠️ Correction du double wrapping détecté dans BDD');
              // Déballer le premier niveau si c'est un array imbriqué
              elementsToRestore = elementsToRestore[0];
            }

            const restoredElements = {
              [viewKey]: elementsToRestore
            };

            isRestoringRef.current = true;
            setDesignElementsByView(restoredElements);

            // Mettre à jour le localStorage
            localStorage.setItem(storageKey, JSON.stringify({
              elementsByView: restoredElements,
              colorVariationId: draft.colorVariationId,
              viewId: draft.viewId,
              timestamp: Date.now()
            }));

            setTimeout(() => {
              isRestoringRef.current = false;
            }, 500);
          }

          setLastSyncTime(new Date(draft.updatedAt));
        } else {
          console.log('ℹ️ [Customization] Aucun draft trouvé en BDD');
        }
      } catch (error) {
        console.error('❌ [Customization] Erreur chargement draft BDD:', error);
      }
    };

    loadDraftFromDatabase();
  }, [id, product, hasRestoredRef.current]);

  // Fonction pour sauvegarder en base de données
  const saveToDatabase = useCallback(async () => {
    if (!id || !product || !selectedColorVariation || !selectedView) {
      console.log('⏸️ [Customization] saveToDatabase ignoré - données manquantes');
      return;
    }

    const viewKey = `${selectedColorVariation.id}-${selectedView.id}`;

    // Utiliser la ref pour obtenir la valeur actuelle (évite stale closure)
    const elementsToSave = designElementsByViewRef.current;
    const currentElements = elementsToSave[viewKey] || [];

    // Validation: Ne pas sauvegarder si aucun élément et pas de customization existante
    if (currentElements.length === 0 && !currentCustomizationIdRef.current) {
      console.log('⏸️ [Customization] Aucun élément à sauvegarder');
      return;
    }

    // Validation supplémentaire des éléments
    if (currentElements.length > 0) {
      const hasInvalidElements = currentElements.some(el => !el.id || !el.type);
      if (hasInvalidElements) {
        console.error('❌ [Customization] Éléments invalides détectés:', currentElements);
        return;
      }
    }

    try {
      setIsSyncing(true);
      setSyncError(null);

      const customizationData = {
        productId: product.id,
        colorVariationId: selectedColorVariation.id,
        viewId: selectedView.id,
        designElements: currentElements,
        sessionId: customizationService.getOrCreateSessionId(),
      };

      // 🔍 DEBUG: Vérifier la structure avant envoi
      console.log('☁️ [Customization] Auto-sauvegarde BDD:', {
        viewKey,
        elementsCount: currentElements.length,
        isArray: Array.isArray(currentElements),
        firstIsArray: currentElements.length > 0 ? Array.isArray(currentElements[0]) : false,
        elements: currentElements.map(el => ({
          id: el?.id,
          type: el?.type,
          isArray: Array.isArray(el)
        }))
      });

      // 🚨 Bloquer si double wrapping détecté
      if (currentElements.length > 0 && Array.isArray(currentElements[0])) {
        console.error('🚨 BUG BLOQUÉ: Tentative d\'envoi de données corrompues (array imbriqué)');
        setIsSyncing(false);
        return;
      }

      const result = await customizationService.saveCustomization(customizationData);
      currentCustomizationIdRef.current = result.id;
      setLastSyncTime(new Date());

      console.log('✅ [Customization] Sauvegardé en BDD, ID:', result.id);
    } catch (error: any) {
      console.error('❌ [Customization] Erreur auto-save BDD:', error);
      setSyncError(error.message || 'Erreur de synchronisation');
    } finally {
      setIsSyncing(false);
    }
  }, [id, product, selectedColorVariation, selectedView]);

  // Debounce la sauvegarde en BDD (3 secondes)
  const debouncedSaveToDatabase = useMemo(
    () => debounce(() => {
      saveToDatabase();
    }, 3000),
    [saveToDatabase]
  );

  // Callback quand les éléments changent dans l'éditeur
  const handleElementsChange = useCallback((newElements: any[]) => {
    const viewKey = getCurrentViewKey();
    if (!viewKey) {
      console.log('⚠️ [Customization] Pas de vue sélectionnée, ignoré');
      return;
    }

    // 🔍 DEBUG: Vérifier la structure des éléments reçus
    console.log('🔄 [Customization] Éléments changés pour la vue:', viewKey);
    console.log('🔍 DEBUG - newElements:', {
      isArray: Array.isArray(newElements),
      length: newElements.length,
      firstElementType: newElements.length > 0 ? typeof newElements[0] : 'N/A',
      firstIsArray: newElements.length > 0 ? Array.isArray(newElements[0]) : false,
      firstElement: newElements.length > 0 ? newElements[0] : null
    });

    // 🚨 Détecter le double wrapping
    if (newElements.length > 0 && Array.isArray(newElements[0])) {
      console.error('🚨 BUG DÉTECTÉ: newElements est un array imbriqué!', newElements);
      // Ne pas sauvegarder des données corrompues
      return;
    }

    console.log('🔄 [Customization] isRestoring:', isRestoringRef.current);

    // Ne pas écraser les éléments si on est en train de restaurer
    if (isRestoringRef.current) {
      console.log('⏸️ [Customization] Ignoré car en cours de restauration');
      return;
    }

    // Mettre à jour uniquement les éléments de la vue actuelle
    setDesignElementsByView(prev => ({
      ...prev,
      [viewKey]: newElements
    }));
  }, [selectedColorVariation, selectedView]);

  // Sauvegarder automatiquement dans localStorage à chaque modification
  useEffect(() => {
    if (!id) return;

    console.log('📝 [Customization] useEffect sauvegarde déclenché:', {
      viewsCount: Object.keys(designElementsByView).length,
      isRestoring: isRestoringRef.current,
      hasRestored: hasRestoredRef.current,
      colorId: selectedColorVariation?.id,
      viewId: selectedView?.id
    });

    // Ne pas sauvegarder si on est en train de restaurer
    if (isRestoringRef.current) {
      console.log('⏸️ [Customization] Sauvegarde ignorée (restauration en cours)');
      return;
    }

    // Ne pas sauvegarder tant que la restauration initiale n'est pas complète
    if (!hasRestoredRef.current) {
      console.log('⏸️ [Customization] Sauvegarde ignorée (restauration non terminée)');
      return;
    }

    // Sauvegarder tous les éléments par vue
    const storageKey = `design-data-product-${id}`;
    const dataToSave = {
      elementsByView: designElementsByView,
      colorVariationId: selectedColorVariation?.id,
      viewId: selectedView?.id,
      timestamp: Date.now()
    };

    localStorage.setItem(storageKey, JSON.stringify(dataToSave));

    // Log pour debug (à supprimer en production)
    console.log('💾 Auto-sauvegarde localStorage:', dataToSave);

    // Déclencher aussi la sauvegarde en base de données (debounced)
    // La fonction utilise designElementsByViewRef pour avoir les données à jour
    debouncedSaveToDatabase();
  }, [designElementsByView, selectedColorVariation, selectedView, id, debouncedSaveToDatabase]);

  // Gérer le plein écran
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
        toast({
          title: 'Mode plein écran activé',
          description: 'Appuyez sur Échap pour quitter'
        });
      }).catch((err) => {
        console.error('Erreur plein écran:', err);
        toast({
          title: 'Erreur',
          description: 'Impossible d\'activer le plein écran',
          variant: 'destructive'
        });
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  // Écouter les changements de plein écran (Échap par exemple)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Sauvegarder manuellement
  const handleSave = async () => {
    if (!id || !product || !selectedColorVariation || !selectedView) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner une couleur et une vue',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsSyncing(true);
      setSyncError(null);

      // Utiliser la ref pour obtenir les données actuelles
      const viewKey = `${selectedColorVariation.id}-${selectedView.id}`;
      const currentElements = designElementsByViewRef.current[viewKey] || [];

      // Validation des éléments
      if (currentElements.length === 0) {
        toast({
          title: 'Aucun élément',
          description: 'Ajoutez des éléments avant de sauvegarder',
          variant: 'default'
        });
        setIsSyncing(false);
        return;
      }

      // Vérifier la validité des éléments
      const invalidElements = currentElements.filter(el => !el.id || !el.type);
      if (invalidElements.length > 0) {
        console.error('❌ Éléments invalides:', invalidElements);
        toast({
          title: 'Erreur de données',
          description: 'Certains éléments sont invalides',
          variant: 'destructive'
        });
        setIsSyncing(false);
        return;
      }

      // Sauvegarder dans localStorage (backup)
      const storageKey = `design-data-product-${id}`;
      const dataToSave = {
        elementsByView: designElementsByViewRef.current,
        colorVariationId: selectedColorVariation.id,
        viewId: selectedView.id,
        timestamp: Date.now()
      };
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));

      // Sauvegarder dans le backend pour la vue actuelle
      const customizationData = {
        productId: product.id,
        colorVariationId: selectedColorVariation.id,
        viewId: selectedView.id,
        designElements: currentElements,
        sessionId: customizationService.getOrCreateSessionId(),
      };

      console.log('💾 [Customization] Sauvegarde manuelle:', {
        viewKey,
        elementsCount: currentElements.length,
        elements: currentElements.map(el => ({ id: el.id, type: el.type }))
      });

      const result = await customizationService.saveCustomization(customizationData);
      currentCustomizationIdRef.current = result.id;
      setLastSyncTime(new Date());

      console.log('✅ Personnalisation sauvegardée:', result);

      toast({
        title: '✅ Sauvegardé',
        description: `${currentElements.length} élément(s) sauvegardé(s) en base de données (ID: ${result.id})`,
        duration: 3000
      });
    } catch (error: any) {
      console.error('Erreur sauvegarde:', error);
      setSyncError(error.message || 'Erreur de sauvegarde');
      toast({
        title: 'Erreur de sauvegarde',
        description: 'Impossible de sauvegarder sur le serveur. Les données sont sauvegardées localement.',
        variant: 'destructive'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Charger les designs vendeur
  const loadVendorDesigns = async () => {
    try {
      setLoadingDesigns(true);
      const result = await designService.getPublicDesigns({
        limit: 50
      });
      setVendorDesigns(result.designs || []);
      setShowDesignLibrary(true);
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

  // Ouvrir le modal de sélection
  const handleOpenSizeModal = () => {
    // Le client peut acheter sans personnalisation
    setShowSizeModal(true);
  };

  // Ajouter au panier avec les sélections
  const handleAddToCart = async (selections: Array<{ size: string; quantity: number }>) => {
    if (!id || !product) return;

    try {
      console.log('🛒 [Customization] Ajout au panier avec sélections:', selections);

      // 🔧 NOUVEAU: Sauvegarder TOUTES les vues avec des éléments
      // Utiliser la ref pour obtenir les données actuelles
      const currentElementsByView = designElementsByViewRef.current;
      const viewsWithElements = Object.entries(currentElementsByView).filter(
        ([, elements]) => elements.length > 0
      );

      console.log('📦 [Customization] Vues avec éléments:', {
        totalViews: Object.keys(currentElementsByView).length,
        viewsWithElements: viewsWithElements.length,
        views: viewsWithElements.map(([key, elements]) => ({
          viewKey: key,
          elementsCount: elements.length
        }))
      });

      // Si aucune vue n'a d'éléments, afficher un avertissement
      if (viewsWithElements.length === 0) {
        console.warn('⚠️ [Customization] Aucune personnalisation détectée');
        toast({
          title: '⚠️ Aucune personnalisation',
          description: 'Vous pouvez quand même ajouter le produit au panier',
          variant: 'default'
        });
      }

      // Sauvegarder chaque vue personnalisée en base de données
      const customizationIds: Record<string, number> = {};
      const designElementsByViewKey: Record<string, any[]> = {}; // 🆕 Organiser par vue

      for (const [viewKey, elements] of viewsWithElements) {
        // Parser la clé pour obtenir colorVariationId et viewId
        const [colorIdStr, viewIdStr] = viewKey.split('-');
        const colorId = parseInt(colorIdStr);
        const viewId = parseInt(viewIdStr);

        console.log(`💾 [Customization] Sauvegarde vue ${viewKey}:`, {
          colorId,
          viewId,
          elementsCount: elements.length
        });

        const customizationData = {
          productId: product.id,
          colorVariationId: colorId,
          viewId: viewId,
          designElements: elements,
          sizeSelections: selections,
          sessionId: customizationService.getOrCreateSessionId(),
        };

        try {
          const result = await customizationService.saveCustomization(customizationData);
          customizationIds[viewKey] = result.id;

          // 🆕 Stocker les éléments organisés par vue
          designElementsByViewKey[viewKey] = elements;

          console.log(`✅ [Customization] Vue ${viewKey} sauvegardée avec ID:`, result.id);
        } catch (error) {
          console.error(`❌ [Customization] Erreur sauvegarde vue ${viewKey}:`, error);
          // Continuer avec les autres vues
        }
      }

      console.log('✅ [Customization] Toutes les personnalisations sauvegardées:', customizationIds);

      // Sauvegarder les IDs dans localStorage pour référence
      localStorage.setItem(`customization-${product.id}`, JSON.stringify({
        customizationIds: customizationIds,
        selections: selections,
        timestamp: Date.now()
      }));

      // Obtenir les délimitations et infos de toutes les vues
      const allDelimitations: any[] = [];
      const viewImages: Record<number, string> = {}; // 🆕 URLs des images par viewId
      if (selectedColorVariation?.images) {
        selectedColorVariation.images.forEach((img: any) => {
          // Stocker l'URL de l'image pour cette vue
          viewImages[img.id] = img.url;

          if (img.delimitations) {
            allDelimitations.push(...img.delimitations.map((d: any) => ({
              ...d,
              viewId: img.id,
              viewType: img.viewType,
              imageUrl: img.url // 🆕 Ajouter l'URL de l'image
            })));
          }
        });
      }

      console.log('🔍 [Customization] Toutes les délimitations collectées:', {
        count: allDelimitations.length,
        delimitations: allDelimitations
      });

      // Ajouter chaque sélection taille/quantité au panier
      let totalAdded = 0;
      for (const selection of selections) {
        for (let i = 0; i < selection.quantity; i++) {
          const cartItem = {
            id: product.id,
            name: product.name,
            price: product.price,
            suggestedPrice: product.suggestedPrice,
            color: selectedColorVariation?.name || 'Défaut',
            colorCode: selectedColorVariation?.colorCode || '#000000',
            size: selection.size,
            imageUrl: selectedView?.url || product.images?.[0]?.url || '',
            // 🔧 NOUVEAU: Stocker tous les IDs de personnalisation
            customizationIds: customizationIds,
            // Pour compatibilité, stocker aussi le premier ID comme customizationId
            customizationId: Object.values(customizationIds)[0] || undefined,
            // 🆕 Stocker les éléments organisés par vue
            designElementsByView: designElementsByViewKey,
            // Stocker toutes les délimitations
            delimitations: allDelimitations
          };

          console.log('🛒 [Customization] Ajout article au panier:', {
            size: selection.size,
            customizationIds: customizationIds,
            designElementsByView: Object.keys(designElementsByViewKey),
            totalDelimitations: allDelimitations.length,
            viewsCount: viewsWithElements.length
          });

          addToCart(cartItem);
          totalAdded++;
        }
      }

      console.log('🛒 [Customization] Articles ajoutés au panier:', {
        totalAdded,
        customizationIds: customizationIds,
        designElementsByView: Object.keys(designElementsByViewKey),
        viewsCount: viewsWithElements.length
      });

      toast({
        title: '✅ Ajouté au panier',
        description: `${totalAdded} article(s) avec ${viewsWithElements.length} vue(s) personnalisée(s)`,
      });

      // Fermer le modal
      setShowSizeModal(false);

      // Ouvrir automatiquement le drawer du panier
      setTimeout(() => {
        openCart();
      }, 300);

    } catch (error) {
      console.error('❌ [Customization] Erreur ajout au panier:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ajouter au panier',
        variant: 'destructive'
      });
    }
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

  const delimitation = selectedView?.delimitations?.[0];

  // Extraire les catégories pour les designs
  const categories = Array.from(
    new Set(vendorDesigns.map(d => d.category?.name).filter(Boolean))
  ).sort();


  const filteredDesigns = vendorDesigns.filter(design => {
    const matchSearch = design.name.toLowerCase().includes(designSearch.toLowerCase()) ||
                       design.creator?.shopName?.toLowerCase().includes(designSearch.toLowerCase());
    const matchCategory = !selectedCategory || design.category?.name === selectedCategory;
    const matchFreeOnly = !showFreeOnly || design.price === 0;
    return matchSearch && matchCategory && matchFreeOnly;
  });

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header Top Actions */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>

            <div className="flex items-center gap-2">
              {/* Indicateur de synchronisation */}
              <div className="flex items-center gap-1 text-xs text-gray-500 mr-2">
                {isSyncing ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Sync...</span>
                  </>
                ) : syncError ? (
                  <>
                    <CloudOff className="w-3 h-3 text-red-500" />
                    <span className="text-red-500">Erreur</span>
                  </>
                ) : lastSyncTime ? (
                  <>
                    <Cloud className="w-3 h-3 text-green-500" />
                    <span className="text-green-500">Synced</span>
                  </>
                ) : null}
              </div>

              <Button variant="ghost" size="sm">
                <HelpCircle className="w-4 h-4 mr-2" />
                Assistance
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Enregistrer
              </Button>
              <Button variant="ghost" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Partager
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                title={isFullscreen ? 'Quitter le plein écran' : 'Mode plein écran'}
              >
                <Maximize className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex h-full overflow-hidden">
            {/* Left Sidebar - Tools */}
            <div className="w-12 sm:w-16 lg:w-20 bg-white border-r flex flex-row lg:flex-col items-center justify-center lg:justify-start py-2 lg:py-6 gap-2 lg:gap-4 overflow-x-auto lg:overflow-x-visible">
              <button
                onClick={() => setActiveTab('designs')}
                className={`flex flex-col items-center gap-1 px-2 lg:px-4 py-2 lg:py-3 rounded-lg transition-colors ${
                  activeTab === 'designs'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="Produits"
              >
                <Shirt className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                <span className="text-xs font-medium hidden lg:block">Produits</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('designs');
                  loadVendorDesigns();
                }}
                className={`flex flex-col items-center gap-1 px-2 lg:px-4 py-2 lg:py-3 rounded-lg transition-colors ${
                  activeTab === 'designs' && showDesignLibrary
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="Designs"
              >
                <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                <span className="text-xs font-medium hidden lg:block">Designs</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('text');
                  editorRef.current?.addText();
                }}
                className={`flex flex-col items-center gap-1 px-2 lg:px-4 py-2 lg:py-3 rounded-lg transition-colors ${
                  activeTab === 'text'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="Texte"
              >
                <Type className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                <span className="text-xs font-medium hidden lg:block">Texte</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('upload');
                  editorRef.current?.triggerImageUpload();
                }}
                className={`flex flex-col items-center gap-1 px-2 lg:px-4 py-2 lg:py-3 rounded-lg transition-colors ${
                  activeTab === 'upload'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="Importer"
              >
                <Upload className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                <span className="text-xs font-medium hidden lg:block">Importer</span>
              </button>
            </div>

            {/* Center - Product Display avec éditeur intégré */}
            <div className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto">
              <div className="flex-1 flex items-center justify-center">
                {selectedView && delimitation ? (
                  <div className="w-full max-w-2xl lg:max-w-4xl">
                    <ProductDesignEditor
                      key={`editor-${selectedColorVariation?.id}-${selectedView?.id}`}
                      ref={editorRef}
                      productImageUrl={selectedView.url}
                      delimitation={delimitation}
                      initialElements={getCurrentElements()}
                      onElementsChange={handleElementsChange}
                      className="flex-col lg:flex-row-reverse"
                    />
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow-lg p-8">
                    <div className="relative" style={{ width: '500px', height: '500px' }}>
                      {selectedView && (
                        <img
                          src={selectedView.url}
                          alt={product.name}
                          className="w-full h-full object-contain"
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* View Selector */}
              {selectedColorVariation && selectedColorVariation.images && selectedColorVariation.images.length > 1 && (
                <div className="flex gap-3 bg-white rounded-lg p-4 shadow justify-center mt-6 overflow-x-auto">
                  {selectedColorVariation.images.map((img: any, idx: number) => {
                    const viewElements = getElementsForView(selectedColorVariation.id, img.id);
                    const delimitation = img.delimitations?.[0];

                    return (
                      <button
                        key={img.id}
                        onClick={() => {
                          console.log('🖼️ [Customization] Changement de vue:', getViewName(img.viewType, idx));
                          // Le changement de vue sauvegarde automatiquement via useEffect
                          setSelectedView(img);
                        }}
                        className={`flex flex-col items-center gap-2 p-3 rounded-lg min-w-[100px] transition-all ${
                          selectedView?.id === img.id
                            ? 'bg-primary text-primary-foreground shadow-md ring-2 ring-primary ring-offset-2'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow'
                        }`}
                      >
                        <div className="relative w-16 h-16 rounded overflow-hidden bg-white border-2 border-gray-200">
                          {/* Image de fond */}
                          <img
                            src={img.url}
                            alt={getViewName(img.viewType, idx)}
                            className="w-full h-full object-contain"
                          />

                          {/* Éléments de design superposés */}
                          {delimitation && viewElements.length > 0 && (
                            <div className="absolute inset-0 pointer-events-none">
                              {viewElements.map((element: any) => {
                                // Taille du conteneur miniature
                                const thumbnailWidth = 64;
                                const thumbnailHeight = 64;

                                // Dimensions de référence de l'image produit
                                const refWidth = delimitation.referenceWidth || 800;
                                const refHeight = delimitation.referenceHeight || 800;

                                // Calculer le ratio de scale entre la miniature et l'image de référence
                                const scaleX = thumbnailWidth / refWidth;
                                const scaleY = thumbnailHeight / refHeight;

                                // Utiliser le plus petit ratio pour garder les proportions
                                const scale = Math.min(scaleX, scaleY);

                                // Calculer la position en pixels dans la miniature
                                const left = element.x * thumbnailWidth;
                                const top = element.y * thumbnailHeight;

                                // Appliquer le scale aux dimensions de l'élément
                                const scaledWidth = element.width * scale;
                                const scaledHeight = element.height * scale;

                                // Calculer la taille de police scalée
                                const scaledFontSize = element.type === 'text'
                                  ? (element.fontSize || 24) * scale
                                  : 0;

                                return (
                                  <div
                                    key={element.id}
                                    style={{
                                      position: 'absolute',
                                      left: `${left}px`,
                                      top: `${top}px`,
                                      width: `${scaledWidth}px`,
                                      height: `${scaledHeight}px`,
                                      transform: `translate(-50%, -50%) rotate(${element.rotation}deg)`,
                                      transformOrigin: 'center center',
                                      zIndex: element.zIndex,
                                    }}
                                  >
                                    {element.type === 'text' ? (
                                      <div
                                        style={{
                                          width: '100%',
                                          height: '100%',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: element.textAlign || 'center',
                                          fontSize: `${scaledFontSize}px`,
                                          fontFamily: element.fontFamily || 'Arial',
                                          color: element.color || '#000000',
                                          fontWeight: element.fontWeight || 'normal',
                                          fontStyle: element.fontStyle || 'normal',
                                          textDecoration: element.textDecoration || 'none',
                                          textAlign: element.textAlign || 'center',
                                          whiteSpace: 'nowrap',
                                          overflow: 'hidden',
                                          lineHeight: 1,
                                        }}
                                      >
                                        {element.text}
                                      </div>
                                    ) : element.type === 'image' ? (
                                      <img
                                        src={element.imageUrl}
                                        alt="Design"
                                        style={{
                                          width: '100%',
                                          height: '100%',
                                          objectFit: 'contain',
                                        }}
                                      />
                                    ) : null}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Badge compteur d'éléments */}
                          {viewElements.length > 0 && (
                            <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                              {viewElements.length}
                            </div>
                          )}
                        </div>
                        <span className="text-xs font-medium whitespace-nowrap">
                          {getViewName(img.viewType, idx)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Sidebar - Product Info */}
            <div className="w-96 bg-white border-l p-6 overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h2>

              <div className="flex items-center gap-2 mb-4">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <span key={star} className="text-yellow-400">★</span>
              ))}
            </div>
            <span className="text-sm text-gray-600">(0 avis)</span>
          </div>

          {product.description && (
            <p className="text-sm text-gray-600 mb-6">{product.description}</p>
          )}

          {/* Color Selection */}
          {product.colorVariations && product.colorVariations.length > 1 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Couleur</h3>
              <div className="flex flex-wrap gap-2">
                {product.colorVariations.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => {
                      console.log('🎨 [Customization] Changement de couleur:', color.name);
                      // Le changement de couleur sauvegarde automatiquement via useEffect
                      setSelectedColorVariation(color);
                      if (color.images && color.images.length > 0) {
                        setSelectedView(color.images[0]);
                      }
                    }}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${
                      selectedColorVariation?.id === color.id
                        ? 'border-primary ring-2 ring-primary ring-offset-2'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: color.colorCode }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="border-t pt-6 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Prix</span>
              <span className="text-2xl font-bold text-gray-900">
                {(product.suggestedPrice || product.price).toLocaleString()} FCFA
              </span>
            </div>
          </div>

          <Button
            onClick={handleOpenSizeModal}
            className="w-full py-6 text-lg"
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            Choisir la quantité & taille
          </Button>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-900 font-medium mb-2">💡 Comment utiliser:</p>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Utilisez la barre latérale pour ajouter des designs ou du texte</li>
              <li>• Cliquez et glissez pour déplacer les éléments</li>
              <li>• Utilisez les poignées pour redimensionner et pivoter</li>
            </ul>
          </div>
            </div>
          </div>
        </div>
      </div>

      {/* Panneau latéral Bibliothèque de designs */}
      {showDesignLibrary && (
        <div className="fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowDesignLibrary(false)}
          />

          {/* Panneau */}
          <div className="relative ml-auto w-full max-w-5xl bg-white shadow-2xl flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Choisissez un design</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDesignLibrary(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Sidebar gauche - Filtres */}
              <div className="w-72 border-r bg-gray-50 p-4 overflow-y-auto">
                {/* Recherche */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Rechercher..."
                      value={designSearch}
                      onChange={(e) => setDesignSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    />
                  </div>
                </div>

                {/* Interrupteurs de filtres */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Designs gratuits</span>
                    <button
                      onClick={() => setShowFreeOnly(!showFreeOnly)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        showFreeOnly ? 'bg-primary' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          showFreeOnly ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Designs tout public</span>
                    <button
                      onClick={() => setShowAllAudience(!showAllAudience)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        showAllAudience ? 'bg-primary' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          showAllAudience ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Couleur adaptable</span>
                    <button
                      onClick={() => setShowAdaptableColor(!showAdaptableColor)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        showAdaptableColor ? 'bg-primary' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          showAdaptableColor ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Labels associés */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Labels associés</h3>
                  <div className="flex flex-wrap gap-2">
                    {/* Bouton "Tous" */}
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        selectedCategory === null
                          ? 'bg-primary text-white border border-primary'
                          : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                      }`}
                    >
                      Tous
                    </button>
                    {/* Boutons de catégories */}
                    {categories.map((category) => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                          selectedCategory === category
                            ? 'bg-primary text-white border border-primary'
                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Contenu principal - Grille de designs */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Résultats et info */}
                <div className="px-6 py-3 border-b bg-white">
                  <p className="text-sm text-gray-600">
                    {filteredDesigns.length} design{filteredDesigns.length > 1 ? 's' : ''} trouvé{filteredDesigns.length > 1 ? 's' : ''}
                  </p>
                </div>

                {/* Grille scrollable */}
                <div className="flex-1 overflow-y-auto p-6">
                  {loadingDesigns ? (
                    <div className="flex items-center justify-center py-20">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : filteredDesigns.length > 0 ? (
                    <div className="grid grid-cols-3 xl:grid-cols-4 gap-4">
                      {filteredDesigns.map((design) => (
                        <div
                          key={design.id}
                          className="group relative bg-white rounded-lg border-2 border-gray-200 hover:border-primary hover:shadow-lg transition-all cursor-pointer overflow-hidden"
                          onClick={() => {
                            editorRef.current?.addVendorDesign(design);
                            toast({
                              title: 'Design ajouté',
                              description: `${design.name} a été ajouté`
                            });
                            setShowDesignLibrary(false);
                          }}
                        >
                          {/* Actions en haut */}
                          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <button
                              className="p-1.5 bg-white rounded-full shadow-md hover:bg-gray-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                toast({ title: 'Ajouté aux favoris' });
                              }}
                            >
                              <Star className="w-4 h-4 text-gray-600" />
                            </button>
                            <button
                              className="p-1.5 bg-white rounded-full shadow-md hover:bg-gray-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                toast({ title: 'Design signalé' });
                              }}
                            >
                              <Flag className="w-4 h-4 text-gray-600" />
                            </button>
                          </div>

                          {/* Label gratuit */}
                          {design.price === 0 && (
                            <div className="absolute top-2 left-2 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded z-10">
                              Gratuit
                            </div>
                          )}

                          {/* Image */}
                          <div className="aspect-square bg-gray-50 p-4">
                            <img
                              src={design.imageUrl || design.thumbnailUrl}
                              alt={design.name}
                              className="w-full h-full object-contain group-hover:scale-110 transition-transform"
                            />
                          </div>

                          {/* Info */}
                          <div className="p-3 border-t">
                            <p className="text-sm font-medium text-gray-900 mb-1 line-clamp-1">
                              {design.name}
                            </p>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-600 truncate">
                                {design.creator?.shopName}
                              </span>
                              <span className="font-bold text-primary ml-2 whitespace-nowrap">
                                {design.price > 0 ? `${design.price.toLocaleString()} FCFA` : 'Gratuit'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-20 text-gray-500">
                      Aucun design trouvé
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de sélection taille/quantité */}
      <SizeQuantityModal
        isOpen={showSizeModal}
        onClose={() => setShowSizeModal(false)}
        productPrice={product.suggestedPrice || product.price}
        productName={product.name}
        productSizes={product.sizes || []}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
};

export default CustomerProductCustomizationPageV3;
