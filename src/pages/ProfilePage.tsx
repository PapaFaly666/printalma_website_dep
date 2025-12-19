import { useParams, useNavigate } from 'react-router-dom';
import { ChevronDown, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import Footer from '../components/Footer';
import CategoryTabs from '../components/CategoryTabs';
import vendorProductsService, { VendorProduct } from '../services/vendorProductsService';
import { ProductCardWithDesign } from '../components/ProductCardWithDesign';
import { categoriesService, Category } from '../services/categoriesService';
import { subCategoriesService, SubCategory } from '../services/subCategoriesService';
import { galleryService } from '../services/gallery.service';
import { VendorGallery } from '../types/gallery';

// Icônes réseaux sociaux
const SocialIcon = ({ network }: { network: string }) => {
  const icons = {
    facebook: (
      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
        <path d="M18.77 7.46H14.5v-1.9c0-.9.6-1.1 1-1.1h3V.5h-4.33C10.24.5 9.5 3.44 9.5 5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4z"/>
      </svg>
    ),
    instagram: (
      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
    x: (
      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
    tiktok: (
      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
      </svg>
    ),
  };
  return icons[network as keyof typeof icons] || null;
};

// Fonction utilitaire pour convertir le nom URL-friendly en nom normal
const urlNameToNormalName = (urlName: string): string => {
  return urlName
    .replace(/-/g, ' ') // Remplacer les tirets par des espaces
    .replace(/\b\w/g, l => l.toUpperCase()); // Mettre en majuscule chaque premier mot
};

export default function ProfilePage() {
  const { type, shopName } = useParams<{ type: string; shopName: string }>();
  const navigate = useNavigate();
  const [gallery, setGallery] = useState<VendorGallery | null>(null);
  const [loadingGallery, setLoadingGallery] = useState(true);
  const [vendorData, setVendorData] = useState<any>(null);
  const [loadingVendor, setLoadingVendor] = useState(true);
  const [vendorProducts, setVendorProducts] = useState<VendorProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [filteredProducts, setFilteredProducts] = useState<VendorProduct[]>([]);

  // État pour les réseaux sociaux du vendeur
  const [socialMedias, setSocialMedias] = useState<Record<string, string>>({});

  // État pour les informations de profil (titre et bio)
  const [vendorBio, setVendorBio] = useState<{ professional_title: string; vendor_bio: string }>({
    professional_title: '',
    vendor_bio: ''
  });

  // État pour le modal de zoom d'image
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  // États pour les filtres
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [tempSelectedColors, setTempSelectedColors] = useState<string[]>([]);
  const [showColorSelector, setShowColorSelector] = useState(false);

  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [tempSelectedSizes, setTempSelectedSizes] = useState<string[]>([]);
  const [showSizeSelector, setShowSizeSelector] = useState(false);

  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [tempMinPrice, setTempMinPrice] = useState<number | ''>('');
  const [tempMaxPrice, setTempMaxPrice] = useState<number | ''>('');
  const [showPriceSelector, setShowPriceSelector] = useState(false);

  // États pour les catégories et sous-catégories
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [selectedSubCategory, setSelectedSubCategory] = useState<SubCategory | null>(null);

  // Couleurs disponibles
  const availableColors = [
    { name: 'Noir', value: 'black', hex: '#000000' },
    { name: 'Blanc', value: 'white', hex: '#FFFFFF' },
    { name: 'Rouge', value: 'red', hex: '#EF4444' },
    { name: 'Bleu', value: 'blue', hex: '#3B82F6' },
    { name: 'Vert', value: 'green', hex: '#10B981' },
    { name: 'Jaune', value: 'yellow', hex: '#F59E0B' },
    { name: 'Rose', value: 'pink', hex: '#EC4899' },
    { name: 'Violet', value: 'purple', hex: '#8B5CF6' },
    { name: 'Gris', value: 'gray', hex: '#6B7280' },
    { name: 'Orange', value: 'orange', hex: '#F97316' }
  ];

  // Fonctions de gestion des filtres de couleur
  const toggleTempColor = (colorValue: string) => {
    setTempSelectedColors(prev =>
      prev.includes(colorValue)
        ? prev.filter(c => c !== colorValue)
        : [...prev, colorValue]
    );
  };

  const applyColorSelection = () => {
    setSelectedColors(tempSelectedColors);
    setShowColorSelector(false);
  };

  const cancelColorSelection = () => {
    setTempSelectedColors(selectedColors);
    setShowColorSelector(false);
  };

  const clearColors = () => {
    setSelectedColors([]);
    setTempSelectedColors([]);
  };

  // Fonctions de gestion des filtres de taille
  const toggleTempSize = (size: string) => {
    setTempSelectedSizes(prev =>
      prev.includes(size)
        ? prev.filter(s => s !== size)
        : [...prev, size]
    );
  };

  const applySizeSelection = () => {
    setSelectedSizes(tempSelectedSizes);
    setShowSizeSelector(false);
  };

  const cancelSizeSelection = () => {
    setTempSelectedSizes(selectedSizes);
    setShowSizeSelector(false);
  };

  const clearSizes = () => {
    setSelectedSizes([]);
    setTempSelectedSizes([]);
  };

  // Fonctions de gestion du filtre de prix
  const applyPriceFilter = () => {
    setMinPrice(tempMinPrice);
    setMaxPrice(tempMaxPrice);
    setShowPriceSelector(false);
  };

  const cancelPriceFilter = () => {
    setTempMinPrice(minPrice);
    setTempMaxPrice(maxPrice);
    setShowPriceSelector(false);
  };

  const clearPriceFilter = () => {
    setMinPrice('');
    setMaxPrice('');
    setTempMinPrice('');
    setTempMaxPrice('');
  };

  const hasPriceFilter = minPrice !== '' || maxPrice !== '';

  // Fonctions pour gérer le modal de zoom d'image
  const openImageZoom = (index: number) => {
    setSelectedImageIndex(index);
  };

  const closeImageZoom = () => {
    setSelectedImageIndex(null);
  };

  const goToPreviousImage = () => {
    if (selectedImageIndex !== null && gallery && gallery.images) {
      const newIndex = selectedImageIndex === 0 ? gallery.images.length - 1 : selectedImageIndex - 1;
      setSelectedImageIndex(newIndex);
    }
  };

  const goToNextImage = () => {
    if (selectedImageIndex !== null && gallery && gallery.images) {
      const newIndex = selectedImageIndex === gallery.images.length - 1 ? 0 : selectedImageIndex + 1;
      setSelectedImageIndex(newIndex);
    }
  };

  // Gestion du clavier pour le modal de zoom et bloquer le scroll
  useEffect(() => {
    if (selectedImageIndex !== null) {
      // Bloquer le scroll du body quand le modal est ouvert
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          closeImageZoom();
        } else if (e.key === 'ArrowLeft') {
          goToPreviousImage();
        } else if (e.key === 'ArrowRight') {
          goToNextImage();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        // Restaurer le scroll quand le modal se ferme
        document.body.style.overflow = 'unset';
      };
    }
  }, [selectedImageIndex, gallery]);

  // Formater le prix en FCFA
  const formatPriceInFCFA = (price: number) => {
    return new Intl.NumberFormat('fr-SN', {
      style: 'currency',
      currency: 'XOF',
      maximumFractionDigits: 0,
      currencyDisplay: 'symbol'
    }).format(price);
  };

  // Fonction pour déterminer les couleurs disponibles dans les produits
  const getAvailableColorsFromProducts = () => {
    const colorSet = new Set<string>();

    vendorProducts.forEach(product => {
      if (product.adminProduct?.colorVariations) {
        product.adminProduct.colorVariations.forEach((variation: any) => {
          const variationName = variation.name.toLowerCase();

          const colorMapping: { [key: string]: string } = {
            'noir': 'black',
            'blanc': 'white',
            'rouge': 'red',
            'bleu': 'blue',
            'vert': 'green',
            'jaune': 'yellow',
            'rose': 'pink',
            'violet': 'purple',
            'gris': 'gray',
            'orange': 'orange'
          };

          const mappedColor = colorMapping[variationName];
          if (mappedColor && availableColors.find(c => c.value === mappedColor)) {
            colorSet.add(mappedColor);
          }

          const directMatch = availableColors.find(c =>
            c.value === variationName ||
            variation.colorCode.toLowerCase().includes(c.value)
          );
          if (directMatch) {
            colorSet.add(directMatch.value);
          }
        });
      }
    });

    return availableColors.filter(color => colorSet.has(color.value));
  };

  // Fonction pour déterminer les tailles disponibles dans les produits
  const getAvailableSizesFromProducts = () => {
    const sizeSet = new Set<string>();

    vendorProducts.forEach(product => {
      if (product.selectedSizes && Array.isArray(product.selectedSizes)) {
        product.selectedSizes.forEach((sizeObj: any) => {
          if (sizeObj.sizeName) {
            sizeSet.add(sizeObj.sizeName.toUpperCase());
          }
        });
      }
    });

    const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
    const availableSizes = Array.from(sizeSet).sort((a, b) => {
      const indexA = sizeOrder.indexOf(a);
      const indexB = sizeOrder.indexOf(b);
      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });

    return availableSizes;
  };

  // Effet pour charger les données du vendeur
  useEffect(() => {
    const loadVendorData = async () => {
      try {
        setLoadingVendor(true);

        // Récupérer les données des vendeurs
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3004'}/public/users/vendors`, {
          headers: {
            'accept': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          const vendors = data.data || [];

          // Convertir le nom URL en nom normal pour la recherche
          const normalizedName = urlNameToNormalName(shopName || '');

          // Fonction pour convertir un nom en format URL-friendly
          const nameToUrlFriendly = (name: string): string => {
            return name.toLowerCase()
              .replace(/[^a-z0-9\s-]/g, '')
              .replace(/\s+/g, '-')
              .replace(/-+/g, '-')
              .replace(/^-|-$/g, '');
          };

          // Chercher le vendeur par nom de boutique d'abord, puis par firstName
          const vendor = vendors.find((v: any) => {
            if (v.shop_name && nameToUrlFriendly(v.shop_name) === shopName) {
              return true;
            }
            if (v.firstName && nameToUrlFriendly(v.firstName) === shopName) {
              return true;
            }
            if (v.lastName && nameToUrlFriendly(v.lastName) === shopName) {
              return true;
            }
            return false;
          });

          if (vendor) {
            setVendorData(vendor);
            console.log('Vendeur trouvé:', vendor);
          } else {
            console.warn('Vendeur non trouvé pour le nom:', shopName);
            // Utiliser des données par défaut si le vendeur n'est pas trouvé
            setVendorData({
              id: 0,
              firstName: normalizedName,
              lastName: '',
              shop_name: normalizedName,
              profile_photo_url: null,
              vendeur_type: type?.toUpperCase() || 'ARTISTE',
              about: `Profile ${type} - Description à compléter`
            });
          }
        } else {
          throw new Error('Impossible de récupérer les vendeurs');
        }
      } catch (error) {
        console.error('Erreur lors du chargement du vendeur:', error);
        // Données par défaut en cas d'erreur
        const normalizedName = urlNameToNormalName(shopName || '');
        setVendorData({
          id: 0,
          firstName: normalizedName,
          lastName: '',
          shop_name: normalizedName,
          profile_photo_url: null,
          vendeur_type: type?.toUpperCase() || 'ARTISTE',
          about: `Profile ${type} - Description à compléter`
        });
      } finally {
        setLoadingVendor(false);
      }
    };

    if (type && shopName) {
      loadVendorData();
    }
  }, [type, shopName]);

  // Charger les catégories et sous-catégories
  useEffect(() => {
    const loadCategoriesAndSubCategories = async () => {
      setLoadingCategories(true);
      try {
        const [categoriesData, subCategoriesData] = await Promise.all([
          categoriesService.getActiveCategories(),
          subCategoriesService.getAllSubCategories()
        ]);

        setCategories(categoriesData);
        setSubCategories(subCategoriesData.filter(sub => sub.isActive));
      } catch (error) {
        console.error('❌ Erreur lors du chargement des catégories:', error);
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategoriesAndSubCategories();
  }, []);

  // Effet pour charger la galerie du vendeur
  useEffect(() => {
    const loadVendorGallery = async () => {
      console.log('Effect loadVendorGallery déclenché:', { type, vendorData });

      try {
        setLoadingGallery(true);

        // Pour les profils vendeur, on récupère la galerie du vendeur
        if (type === 'artiste' || type === 'influenceur' || type === 'designer') {
          console.log('Type de profil détecté comme vendeur:', type);

          // Attendre que vendorData soit chargé pour avoir l'ID
          if (vendorData && vendorData.id) {
            console.log(`Récupération de la galerie pour vendeur ID ${vendorData.id}`);
            const vendorGallery = await galleryService.getPublicVendorGallery(vendorData.id);

            setGallery(vendorGallery);
            console.log('Galerie récupérée:', vendorGallery);
            console.log('Images dans la galerie:', vendorGallery?.images);
            console.log('Nombre d images:', vendorGallery?.images?.length);

            // Debug détaillé pour chaque image
            if (vendorGallery && vendorGallery.images) {
              vendorGallery.images.forEach((img, idx) => {
                console.log(`Image ${idx}:`, {
                  id: img.id,
                  url: img.url,
                  imageUrl: (img as any).imageUrl,
                  caption: img.caption,
                  order: img.order
                });
              });
            }
          } else {
            console.log('vendorData pas encore chargé ou pas d\'ID:', vendorData);
          }
        } else {
          console.log('Type de profil non vendeur:', type);
        }
      } catch (error) {
        console.error('Erreur lors du chargement de la galerie:', error);
        // En cas d'erreur, on laisse la galerie vide
        setGallery(null);
      } finally {
        setLoadingGallery(false);
      }
    };

    loadVendorGallery();
  }, [type, vendorData]);

  // Effet pour charger les réseaux sociaux du vendeur
  useEffect(() => {
    const loadSocialMedias = async () => {
      try {
        // Attendre que vendorData soit chargé pour avoir l'ID
        if (!vendorData || !vendorData.id) {
          return;
        }

        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3004'}/auth/public/vendor/${vendorData.id}/social-media`, {
          headers: {
            'accept': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setSocialMedias({
            facebook: data.facebook_url || '',
            instagram: data.instagram_url || '',
            x: data.twitter_url || '',
            tiktok: data.tiktok_url || ''
          });
        }
      } catch (error) {
        console.error('Erreur lors du chargement des réseaux sociaux:', error);
      }
    };

    loadSocialMedias();
  }, [vendorData]);

  // Effet pour charger les informations de profil (titre et bio) du vendeur
  useEffect(() => {
    const loadVendorBio = async () => {
      try {
        // Attendre que vendorData soit chargé pour avoir l'ID
        if (!vendorData || !vendorData.id) {
          return;
        }

        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3004'}/auth/public/vendor/${vendorData.id}/profile/bio`, {
          headers: {
            'accept': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setVendorBio({
            professional_title: data.professional_title || '',
            vendor_bio: data.vendor_bio || ''
          });
        }
      } catch (error) {
        console.error('Erreur lors du chargement du profil vendeur:', error);
      }
    };

    loadVendorBio();
  }, [vendorData]);

  // Effet pour charger les produits du vendeur
  useEffect(() => {
    const loadVendorProducts = async () => {
      try {
        setLoadingProducts(true);

        // Attendre que vendorData soit chargé pour avoir l'ID
        if (!vendorData || !vendorData.id) {
          return;
        }

        const vendorId = vendorData.id;

        console.log(`🛍️ Chargement des produits pour le vendeur ID ${vendorId}`);

        // Construire la requête avec filtre de sous-catégorie si sélectionnée
        const searchQuery = selectedSubCategory ? selectedSubCategory.slug || selectedSubCategory.name : '';

        const response = await vendorProductsService.searchProducts({
          vendorId,
          search: searchQuery, // Ajouter le filtre de recherche pour la sous-catégorie
          limit: 100 // Charger plus de produits pour avoir tous les résultats
        });

        if (response.success && response.data) {
          // Filtrer uniquement les produits publiés
          const publishedProducts = response.data.filter(
            product => product.status && product.status.toLowerCase() === 'published'
          );
          setVendorProducts(publishedProducts);
          console.log(`✅ ${publishedProducts.length} produits publiés trouvés pour le vendeur`);
        } else {
          setVendorProducts([]);
          console.log('⚠️ Aucun produit trouvé pour ce vendeur');
        }
      } catch (error) {
        console.error('❌ Erreur lors du chargement des produits du vendeur:', error);
        setVendorProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    };

    if (vendorData && vendorData.id) {
      loadVendorProducts();
    }
  }, [vendorData, selectedSubCategory]);

  // Effet pour appliquer les filtres aux produits
  useEffect(() => {
    if (vendorProducts.length === 0) {
      setFilteredProducts([]);
      return;
    }

    let filtered = [...vendorProducts];

    // Fonction pour normaliser les noms de couleurs
    const normalizeColorName = (colorName: string): string => {
      return colorName.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
    };

    // Filtre par couleur
    if (selectedColors.length > 0) {
      filtered = filtered.filter(product => {
        if (!product.adminProduct?.colorVariations) return false;

        if (selectedColors.length === 1) {
          // Une seule couleur : logique ET exacte
          const selectedColor = selectedColors[0];
          return product.adminProduct.colorVariations.some((variation: any) => {
            const variationName = normalizeColorName(variation.name);
            const selectedColorNormalized = normalizeColorName(selectedColor);

            const colorMapping: { [key: string]: string[] } = {
              'black': ['black', 'noir'],
              'white': ['white', 'blanc'],
              'red': ['red', 'rouge'],
              'blue': ['blue', 'bleu'],
              'green': ['green', 'vert'],
              'yellow': ['yellow', 'jaune'],
              'pink': ['pink', 'rose'],
              'purple': ['purple', 'violet'],
              'gray': ['gray', 'grey', 'gris'],
              'orange': ['orange']
            };

            const possibleNames = colorMapping[selectedColorNormalized] || [selectedColorNormalized];
            const match = possibleNames.some(name => {
              const normalizedPossible = normalizeColorName(name);
              return variationName === normalizedPossible ||
                     variationName.includes(normalizedPossible) ||
                     normalizedPossible.includes(variationName);
            });

            const colorCodeMatch = variation.colorCode.toLowerCase().includes(selectedColorNormalized);
            return match || colorCodeMatch;
          });
        } else {
          // Plusieurs couleurs : logique OU (au moins une couleur)
          return selectedColors.some(selectedColor => {
            return product.adminProduct.colorVariations.some((variation: any) => {
              const variationName = normalizeColorName(variation.name);
              const selectedColorNormalized = normalizeColorName(selectedColor);

              const colorMapping: { [key: string]: string[] } = {
                'black': ['black', 'noir'],
                'white': ['white', 'blanc'],
                'red': ['red', 'rouge'],
                'blue': ['blue', 'bleu'],
                'green': ['green', 'vert'],
                'yellow': ['yellow', 'jaune'],
                'pink': ['pink', 'rose'],
                'purple': ['purple', 'violet'],
                'gray': ['gray', 'grey', 'gris'],
                'orange': ['orange']
              };

              const possibleNames = colorMapping[selectedColorNormalized] || [selectedColorNormalized];
              const match = possibleNames.some(name => {
                const normalizedPossible = normalizeColorName(name);
                return variationName === normalizedPossible ||
                       variationName.includes(normalizedPossible) ||
                       normalizedPossible.includes(variationName);
              });

              const colorCodeMatch = variation.colorCode.toLowerCase().includes(selectedColorNormalized);
              return match || colorCodeMatch;
            });
          });
        }
      });
    }

    // Filtre par taille
    if (selectedSizes.length > 0) {
      filtered = filtered.filter(product => {
        if (!product.selectedSizes || !Array.isArray(product.selectedSizes)) return false;

        const productSizes = product.selectedSizes.map((s: any) => s.sizeName.toUpperCase());
        return selectedSizes.some(selectedSize =>
          productSizes.includes(selectedSize.toUpperCase())
        );
      });
    }

    // Filtre par prix
    if (hasPriceFilter) {
      filtered = filtered.filter(product => {
        const productPrice = product.price || 0;
        const min = minPrice !== '' ? minPrice : 0;
        const max = maxPrice !== '' ? maxPrice : Infinity;
        return productPrice >= min && productPrice <= max;
      });
    }

    // Note: Le filtre par sous-catégorie est déjà appliqué au niveau de l'API via le paramètre search
    // On n'a pas besoin de filtrer à nouveau ici

    console.log(`🔍 Filtrage des produits: ${filtered.length}/${vendorProducts.length}`);
    setFilteredProducts(filtered);
  }, [vendorProducts, selectedColors, selectedSizes, minPrice, maxPrice]);

  // Générer les données du profil basées sur le vendeur
  const getProfileData = () => {
    if (vendorData) {
      const sigleMap: { [key: string]: string } = {
        'ARTISTE': 'ART',
        'INFLUENCEUR': 'INF', // Support pour les deux orthographes
        'DESIGNER': 'DES'
      };

      const colorMap: { [key: string]: string } = {
        'ARTISTE': '#1A7CB8',
        'INFLUENCEUR': '#E5042B',
        'DESIGNER': '#F2D12E'
      };

      const vendeurType = vendorData.vendeur_type || 'ARTISTE';

      return {
        sigle: vendorData.shop_name ? vendorData.shop_name.substring(0, 3).toUpperCase() : sigleMap[vendeurType] || 'VEN',
        name: vendorData.shop_name || `${vendorData.firstName} ${vendorData.lastName}`.trim(),
        avatarColor: colorMap[vendeurType] || '#6B7280',
        about: `Profile ${vendeurType.toLowerCase()} - ${vendorData.shop_name || `${vendorData.firstName} ${vendorData.lastName}`}`,
        socialLinks: {
          facebook: socialMedias.facebook || '#',
          instagram: socialMedias.instagram || '#',
          x: socialMedias.x || '#',
          tiktok: socialMedias.tiktok || '#',
        },
      };
    } else {
      // Données par défaut en cas de chargement
      return {
        sigle: type === 'artiste' ? 'ART' : type === 'influenceur' ? 'INF' : 'DES',
        name: 'Chargement...',
        avatarColor: type === 'artiste' ? '#1A7CB8' : type === 'influenceur' ? '#E5042B' : '#F2D12E',
        about: 'Chargement des informations du vendeur...',
        socialLinks: {
          facebook: '#',
          instagram: '#',
          x: '#',
          tiktok: '#',
        },
      };
    }
  };

  const profile = getProfileData();

  return (
    <>
      {/* CategoryTabs sticky qui suit le scroll */}
      <div className="sticky top-0 z-40">
        <CategoryTabs />
      </div>

      <div className="min-h-screen bg-white">
        {(loadingVendor || loadingGallery) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-4 sm:p-5 max-w-sm mx-4 shadow-2xl">
              <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-b-2 border-blue-600 mx-auto mb-2 sm:mb-3"></div>
              <p className="text-gray-600 text-center text-xs sm:text-sm font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>Chargement du profil...</p>
            </div>
          </div>
        )}
        {/* Fil d'Ariane */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <nav className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600 mb-6">
            {/* Accueil */}
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1 hover:text-blue-600 transition-colors duration-200"
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="hidden xs:inline">Accueil</span>
            </button>

            {/* Séparateur */}
            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>

            {/* Designers */}
            <button
              onClick={() => navigate('/designers')}
              className="hover:text-blue-600 transition-colors duration-200"
            >
              Designers
            </button>

            {/* Séparateur */}
            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>

            {/* Nom du designer actuel */}
            <span className="text-gray-900 font-medium capitalize truncate max-w-[120px] sm:max-w-none">
              {vendorData ?
                (vendorData.shop_name || `${vendorData.firstName} ${vendorData.lastName}`.trim()) :
                (type ? type : 'Designer')
              }
            </span>
          </nav>
        </div>

        {/* Section profil - Structure optimisée */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          {/* Hero Profile Section - Structure 3 colonnes */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8 mb-8">
            <div className="flex flex-col lg:flex-row gap-3 lg:gap-6 items-start w-full">

              {/* Colonne 1 - Zone de profil (gauche) */}
              <div className="flex justify-start">
                <div
                  className="w-48 h-48 rounded-xl flex items-center justify-center p-6 relative"
                  style={{
                    backgroundColor: '#F2D12E' // Jaune selon design spec
                  }}
                >
                  {/* Avatar rond à l'intérieur */}
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden shadow-lg">
                    {vendorData?.profile_photo_url ? (
                      <img
                        src={vendorData.profile_photo_url}
                        alt={`${vendorData.firstName} ${vendorData.lastName}`.trim()}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg className="w-18 h-18 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    )}
                  </div>
                </div>
              </div>

              {/* Colonne 2 - Informations du designer (milieu) */}
              <div className="flex-1 text-left space-y-1">
                {/* Nom du designer */}
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {vendorData?.shop_name || `${vendorData?.firstName || 'Designer'} ${vendorData?.lastName || ''}`.trim()}
                </h1>

                {/* Rating */}
                <div className="flex items-center justify-start gap-2">
                  <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-lg font-bold text-gray-900">4.8</span>
                </div>

                {/* Titre/Fonction */}
                <p className="text-base text-gray-700 font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {vendorBio.professional_title || (vendorData?.shop_name ? 'Créateur de designs personnalisés' : 'Graphic Designer')}
                </p>

                {/* Réseaux sociaux */}
                <div className="flex items-center justify-start gap-2">
                  {Object.keys(profile.socialLinks)
                    .filter(network => {
                      const url = profile.socialLinks[network as keyof typeof profile.socialLinks];
                      return url && url !== '#' && url.trim() !== '';
                    })
                    .map((network) => (
                      <a
                        key={network}
                        href={profile.socialLinks[network as keyof typeof profile.socialLinks]}
                        className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                        style={{ backgroundColor: '#F2D12E' }} // Jaune selon design spec
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <div className="text-white">
                          <SocialIcon network={network} />
                        </div>
                      </a>
                    ))}
                </div>
              </div>

              {/* Colonne 3 - A propos (droite) */}
              <div className="flex-1">
                <div className="text-left space-y-1">
                  <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: "'Inter', sans-serif" }}>
                    À propos
                  </h2>
                  <div className="space-y-2 text-gray-700 leading-relaxed text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                    {vendorBio.vendor_bio ? (
                      <p className="whitespace-pre-wrap">{vendorBio.vendor_bio}</p>
                    ) : (
                      <>
                        <p>
                          {vendorData?.about || profile.about || 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl ut aliquip ex ea commodo consequat.'}
                        </p>
                        <p>
                          Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie consequat, vel illum dolore eu feugiat nulla facilisis.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section Galerie */}
          <div className="mb-12">
            {/* Titre Galerie */}
            <div className="flex items-center gap-2 mb-6">
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-black tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                Galerie
              </h3>
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>

            {/* Grille d'images - Galerie du vendeur */}
            {/* Mobile: grille 2x3, Tablet+: grille 4x2 avec image principale */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
              {loadingGallery ? (
                // État de chargement
                <>
                  {/* Mobile: toutes les images même taille, Tablet+: image principale 2x2 */}
                  <div className="col-span-2 row-span-1 sm:row-span-2 aspect-[2/1] sm:aspect-auto sm:h-[400px] bg-gray-200 rounded-xl sm:rounded-2xl flex items-center justify-center animate-pulse">
                    <div className="text-center px-4">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-gray-300 rounded-full mx-auto mb-2 sm:mb-3"></div>
                      <span className="text-gray-500 text-[11px] sm:text-xs font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>Chargement de la galerie...</span>
                    </div>
                  </div>
                  {[2, 3, 4, 5].map((num) => (
                    <div key={num} className="col-span-1 row-span-1 aspect-square sm:aspect-auto sm:h-[195px] bg-gray-200 rounded-xl sm:rounded-2xl flex items-center justify-center animate-pulse">
                      <div className="text-center">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-14 lg:h-14 bg-gray-300 rounded-full mx-auto mb-1 sm:mb-2"></div>
                        <span className="text-gray-500 text-[10px] hidden sm:block">Image {num}</span>
                      </div>
                    </div>
                  ))}
                </>
              ) : gallery && gallery.images && gallery.images.length > 0 ? (
                // Afficher la galerie
                <>
                  {gallery.images.slice(0, 5).map((image, index) => {
                    const isMainImage = index === 0;
                    return (
                      <div
                        key={image.id || index}
                        onClick={() => openImageZoom(index)}
                        className={`${
                          isMainImage
                            ? 'col-span-2 row-span-1 sm:row-span-2 aspect-[2/1] sm:aspect-auto sm:h-[400px]'
                            : 'col-span-1 row-span-1 aspect-square sm:aspect-auto sm:h-[195px]'
                        } rounded-xl sm:rounded-2xl overflow-hidden bg-gray-900 hover:shadow-2xl transition-all duration-300 cursor-pointer group relative`}
                      >
                        {/* Image de fond avec blur pour effet professionnel */}
                        <div
                          className="absolute inset-0 bg-cover bg-center blur-sm scale-110 opacity-30"
                          style={{ backgroundImage: `url(${image.imageUrl || image.url})` }}
                        />

                        {/* Image principale centrée */}
                        <img
                          src={image.imageUrl || image.url}
                          alt={image.caption || `Image ${index + 1}`}
                          className="relative w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          style={{
                            imageRendering: 'auto',
                            WebkitFontSmoothing: 'antialiased',
                            MozOsxFontSmoothing: 'grayscale'
                          }}
                          loading="eager"
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            img.style.display = 'none';
                            const parent = img.parentElement;
                            if (parent) {
                              parent.innerHTML = `
                                <div class="w-full h-full flex items-center justify-center bg-gray-800">
                                  <svg class="w-12 h-12 sm:w-16 sm:h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              `;
                            }
                          }}
                        />

                        {/* Overlay sombre au hover */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />

                        {/* Icône d'agrandissement au hover */}
                        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-white/90 backdrop-blur-sm rounded-full p-1.5 sm:p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                          </svg>
                        </div>

                        {image.caption && (
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent text-white text-xs sm:text-sm p-2 sm:p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <p className="font-medium line-clamp-2">{image.caption}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {/* Compléter la grille si moins de 5 images - Masquer les slots vides */}
                </>
              ) : (
                // État vide - aucune galerie trouvée - Affichage compact
                <div className="col-span-2 sm:col-span-4">
                  <div className="bg-gradient-to-br from-gray-100 via-gray-50 to-white rounded-xl sm:rounded-2xl p-6 sm:p-10 text-center border border-gray-200">
                    <div className="max-w-md mx-auto">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h3 className="text-sm sm:text-base lg:text-lg font-bold text-gray-800 mb-1.5 tracking-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>Galerie à venir</h3>
                      <p className="text-[11px] sm:text-xs text-gray-600 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>Ce vendeur enrichira bientôt sa galerie avec ses meilleures créations</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section Produits avec Sidebar */}
          <div className="mb-12">
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
              {/* Sidebar */}
              <aside className="w-full lg:w-48 lg:flex-shrink-0">
                {/* Mobile sidebar toggle pour plus tard */}
                <div className="lg:hidden mb-4">
                  <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg w-full justify-between">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                      <span className="font-medium">Filtres</span>
                    </div>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Sidebar Content */}
                <div className="hidden lg:block">
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    {/* Boutique Header */}
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-6">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        <h2 className="font-bold text-base sm:text-lg tracking-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>Boutique</h2>
                      </div>

                      {/* Catégories */}
                      <div className="mb-6">
                        <button className="flex items-center justify-between w-full py-2 text-sm font-medium mb-3">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                            <span className="font-semibold">Catégories</span>
                          </div>
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <div className="pl-6 space-y-2">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <label className="text-sm cursor-pointer text-gray-700 hover:text-gray-900">Hommes</label>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <label className="text-sm cursor-pointer text-gray-700 hover:text-gray-900">Femmes</label>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <label className="text-sm cursor-pointer text-gray-700 hover:text-gray-900">Enfants</label>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <label className="text-sm cursor-pointer text-gray-700 hover:text-gray-900">Bébés</label>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            <label className="text-sm cursor-pointer text-gray-700 hover:text-gray-900">Accessoires</label>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            <label className="text-sm cursor-pointer text-gray-700 hover:text-gray-900">Stickers</label>
                          </div>
                        </div>
                      </div>

                      {/* Produits */}
                      <div>
                        <button className="flex items-center justify-between w-full py-2 text-sm font-medium mb-3">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            <span className="font-semibold">Produits</span>
                          </div>
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <div className="pl-6 space-y-2 text-sm text-gray-700">
                          {loadingCategories ? (
                            <div className="flex items-center gap-2 py-1">
                              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                              <span className="text-gray-500">Chargement...</span>
                            </div>
                          ) : (
                            <>
                              {subCategories.length === 0 ? (
                                <span className="text-gray-500 py-1">Aucune sous-catégorie</span>
                              ) : (
                                subCategories.map((subCategory) => (
                                  <button
                                    key={subCategory.id}
                                    onClick={() => {
                                      // Sélectionner la sous-catégorie pour filtrer localement
                                      setSelectedSubCategory(
                                        selectedSubCategory?.id === subCategory.id ? null : subCategory
                                      );
                                    }}
                                    className={`text-left block w-full text-left py-1 transition-colors ${
                                      selectedSubCategory?.id === subCategory.id
                                        ? 'text-blue-600 font-semibold'
                                        : 'hover:text-blue-600'
                                    }`}
                                  >
                                    {subCategory.name}
                                  </button>
                                ))
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </aside>

              {/* Main Content */}
              <main className="flex-1 min-w-0">
                {/* Titre Produits */}
                <div className="flex items-center gap-2 mb-6">
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-black tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Produits
                  </h3>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 fill-current" viewBox="0 0 24 24">
                    <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                  </svg>
                </div>

            {/* Barre de filtres */}
            {!loadingProducts && vendorProducts.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
                <div className="flex flex-wrap items-center gap-2">
                  <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    <span>Filtrer par</span>
                  </button>

                  {/* Filtre Couleurs */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        if (!showColorSelector) {
                          setTempSelectedColors(selectedColors);
                        }
                        setShowColorSelector(!showColorSelector);
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border-2 ${
                        selectedColors.length > 0
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>Couleurs</span>
                        {selectedColors.length === 0 && (
                          <span className="text-xs opacity-70">
                            ({getAvailableColorsFromProducts().length})
                          </span>
                        )}
                        {selectedColors.length > 0 && (
                          <div className="flex items-center gap-1">
                            {selectedColors.slice(0, 3).map((colorValue) => {
                              const color = availableColors.find(c => c.value === colorValue);
                              return color ? (
                                <div
                                  key={colorValue}
                                  className="w-3 h-3 rounded-full border border-white/30 shadow-sm"
                                  style={{ backgroundColor: color.hex }}
                                  title={color.name}
                                />
                              ) : null;
                            })}
                            {selectedColors.length > 3 && (
                              <span className="text-xs opacity-90">
                                +{selectedColors.length - 3}
                              </span>
                            )}
                            <span className="text-xs opacity-90">
                              ({selectedColors.length})
                            </span>
                          </div>
                        )}
                      </div>
                      <svg
                        className={`w-4 h-4 transition-transform ${showColorSelector ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {showColorSelector && (
                      <div className="absolute z-50 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg w-64">
                        <div className="p-3">
                          {tempSelectedColors.length > 0 && (
                            <div className="mb-3 p-2 bg-gray-50 rounded border border-gray-200">
                              <div className="text-xs text-gray-600 mb-1">Sélectionné:</div>
                              <div className="flex flex-wrap gap-1">
                                {tempSelectedColors.map((colorValue) => {
                                  const color = availableColors.find(c => c.value === colorValue);
                                  return color ? (
                                    <div
                                      key={colorValue}
                                      className="flex items-center gap-1 px-2 py-1 bg-white border border-gray-300 rounded text-xs"
                                    >
                                      <div
                                        className="w-3 h-3 rounded-full border border-gray-400"
                                        style={{ backgroundColor: color.hex }}
                                      />
                                      <span className="text-gray-700">{color.name}</span>
                                      <button
                                        onClick={() => toggleTempColor(colorValue)}
                                        className="text-gray-400 hover:text-gray-600 ml-1"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  ) : null;
                                })}
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-5 gap-1 max-h-32 overflow-y-auto mb-3">
                            {getAvailableColorsFromProducts().map((color) => (
                              <button
                                key={color.value}
                                onClick={() => toggleTempColor(color.value)}
                                className={`group relative w-9 h-9 border transition-all hover:scale-105 ${
                                  tempSelectedColors.includes(color.value)
                                    ? 'border-blue-500 shadow-sm z-10'
                                    : 'border-gray-300 hover:border-gray-400'
                                }`}
                                title={color.name}
                              >
                                <div
                                  className="w-full h-full"
                                  style={{ backgroundColor: color.hex }}
                                />
                                {tempSelectedColors.includes(color.value) && (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center shadow-md">
                                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>

                          {getAvailableColorsFromProducts().length === 0 && (
                            <div className="text-center py-3 text-sm text-gray-500">
                              Aucune couleur disponible
                            </div>
                          )}

                          {getAvailableColorsFromProducts().length > 0 && (
                            <div className="flex gap-2 border-t border-gray-200 pt-3">
                              <button
                                onClick={applyColorSelection}
                                className="flex-1 px-3 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
                              >
                                Enregistrer
                              </button>
                              <button
                                onClick={cancelColorSelection}
                                className="flex-1 px-3 py-1.5 border-2 border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                Annuler
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Filtre Tailles */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        if (!showSizeSelector) {
                          setTempSelectedSizes(selectedSizes);
                        }
                        setShowSizeSelector(!showSizeSelector);
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border-2 ${
                        selectedSizes.length > 0
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>Tailles</span>
                        {selectedSizes.length === 0 && (
                          <span className="text-xs opacity-70">
                            ({getAvailableSizesFromProducts().length})
                          </span>
                        )}
                        {selectedSizes.length > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-semibold opacity-90">
                              {selectedSizes.slice(0, 3).join(', ')}
                            </span>
                            {selectedSizes.length > 3 && (
                              <span className="text-xs opacity-90">
                                +{selectedSizes.length - 3}
                              </span>
                            )}
                            <span className="text-xs opacity-90">
                              ({selectedSizes.length})
                            </span>
                          </div>
                        )}
                      </div>
                      <svg
                        className={`w-4 h-4 transition-transform ${showSizeSelector ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {showSizeSelector && (
                      <div className="absolute z-50 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg w-64">
                        <div className="p-3">
                          {tempSelectedSizes.length > 0 && (
                            <div className="mb-3 p-2 bg-gray-50 rounded border border-gray-200">
                              <div className="text-xs text-gray-600 mb-1">Sélectionné:</div>
                              <div className="flex flex-wrap gap-1">
                                {tempSelectedSizes.map((size) => (
                                  <div
                                    key={size}
                                    className="flex items-center gap-1 px-2 py-1 bg-white border border-gray-300 rounded text-xs"
                                  >
                                    <span className="text-gray-700 font-semibold">{size}</span>
                                    <button
                                      onClick={() => toggleTempSize(size)}
                                      className="text-gray-400 hover:text-gray-600 ml-1"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto mb-3">
                            {getAvailableSizesFromProducts().map((size) => (
                              <button
                                key={size}
                                onClick={() => toggleTempSize(size)}
                                className={`px-3 py-2 text-sm font-semibold border-2 rounded-lg transition-all ${
                                  tempSelectedSizes.includes(size)
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                {size}
                              </button>
                            ))}
                          </div>

                          {getAvailableSizesFromProducts().length === 0 && (
                            <div className="text-center py-3 text-sm text-gray-500">
                              Aucune taille disponible
                            </div>
                          )}

                          {getAvailableSizesFromProducts().length > 0 && (
                            <div className="flex gap-2 border-t border-gray-200 pt-3">
                              <button
                                onClick={applySizeSelection}
                                className="flex-1 px-3 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
                              >
                                Enregistrer
                              </button>
                              <button
                                onClick={cancelSizeSelection}
                                className="flex-1 px-3 py-1.5 border-2 border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                Annuler
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Filtre Prix */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        if (!showPriceSelector) {
                          setTempMinPrice(minPrice);
                          setTempMaxPrice(maxPrice);
                        }
                        setShowPriceSelector(!showPriceSelector);
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border-2 ${
                        hasPriceFilter
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <span>Prix</span>
                      {hasPriceFilter && (
                        <span className="text-xs font-semibold opacity-90">
                          {minPrice !== '' && maxPrice !== ''
                            ? `${formatPriceInFCFA(Number(minPrice))} - ${formatPriceInFCFA(Number(maxPrice))}`
                            : minPrice !== ''
                            ? `>${formatPriceInFCFA(Number(minPrice))}`
                            : maxPrice !== '' ? `<${formatPriceInFCFA(Number(maxPrice))}` : ''
                          }
                        </span>
                      )}
                      <svg
                        className={`w-4 h-4 transition-transform ${showPriceSelector ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {showPriceSelector && (
                      <div className="absolute z-50 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg w-80">
                        <div className="p-4">
                          <div className="mb-3">
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                              Filtrer par prix (FCFA)
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs text-gray-600 mb-1 block">Prix minimum</label>
                                <input
                                  type="number"
                                  min="0"
                                  step="1000"
                                  placeholder="Min"
                                  value={tempMinPrice === '' ? '' : tempMinPrice}
                                  onChange={(e) => setTempMinPrice(e.target.value === '' ? '' : Number(e.target.value))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-purple-500"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-600 mb-1 block">Prix maximum</label>
                                <input
                                  type="number"
                                  min="0"
                                  step="1000"
                                  placeholder="Max"
                                  value={tempMaxPrice === '' ? '' : tempMaxPrice}
                                  onChange={(e) => setTempMaxPrice(e.target.value === '' ? '' : Number(e.target.value))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-purple-500"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="mb-3">
                            <label className="text-xs text-gray-600 mb-2 block">Suggestions:</label>
                            <div className="grid grid-cols-3 gap-2">
                              <button
                                onClick={() => {
                                  setTempMinPrice('');
                                  setTempMaxPrice(10000);
                                }}
                                className="px-2 py-1.5 text-xs bg-gray-100 hover:bg-purple-100 border border-gray-300 hover:border-purple-400 rounded transition-colors"
                              >
                                &lt; 10k
                              </button>
                              <button
                                onClick={() => {
                                  setTempMinPrice(10000);
                                  setTempMaxPrice(25000);
                                }}
                                className="px-2 py-1.5 text-xs bg-gray-100 hover:bg-purple-100 border border-gray-300 hover:border-purple-400 rounded transition-colors"
                              >
                                10k - 25k
                              </button>
                              <button
                                onClick={() => {
                                  setTempMinPrice(25000);
                                  setTempMaxPrice('');
                                }}
                                className="px-2 py-1.5 text-xs bg-gray-100 hover:bg-purple-100 border border-gray-300 hover:border-purple-400 rounded transition-colors"
                              >
                                &gt; 25k
                              </button>
                            </div>
                          </div>

                          <div className="flex gap-2 border-t border-gray-200 pt-3">
                            <button
                              onClick={applyPriceFilter}
                              className="flex-1 px-3 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
                            >
                              Appliquer
                            </button>
                            <button
                              onClick={cancelPriceFilter}
                              className="flex-1 px-3 py-1.5 border-2 border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              Annuler
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Affichage des filtres actifs */}
                {(selectedColors.length > 0 || selectedSizes.length > 0 || hasPriceFilter || selectedSubCategory) && (
                  <div className="mt-4 space-y-2">
                    {/* Sous-catégorie sélectionnée */}
                    {selectedSubCategory && (
                      <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-primary">Catégorie:</span>
                          <div className="px-3 py-1 bg-white rounded-full text-xs font-semibold text-primary border border-primary/30">
                            {selectedSubCategory.name}
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedSubCategory(null)}
                          className="px-3 py-1 bg-white hover:bg-primary/10 text-sm font-medium text-primary rounded border border-primary/30"
                        >
                          ×
                        </button>
                      </div>
                    )}

                    {selectedColors.length > 0 && (
                      <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-primary">Couleurs:</span>
                          <div className="flex gap-1">
                            {selectedColors.map((colorValue) => {
                              const color = availableColors.find(c => c.value === colorValue);
                              return color ? (
                                <div
                                  key={colorValue}
                                  className="flex items-center gap-1 px-2 py-1 bg-white rounded-full text-xs font-semibold text-primary border border-primary/30"
                                >
                                  <div
                                    className="w-3 h-3 rounded-full border border-gray-300"
                                    style={{ backgroundColor: color.hex }}
                                  />
                                  {color.name}
                                </div>
                              ) : null;
                            })}
                          </div>
                        </div>
                        <button
                          onClick={clearColors}
                          className="px-3 py-1 bg-white hover:bg-primary/10 text-sm font-medium text-primary rounded border border-primary/30"
                        >
                          ×
                        </button>
                      </div>
                    )}

                    {selectedSizes.length > 0 && (
                      <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-primary">Tailles:</span>
                          <div className="flex gap-1">
                            {selectedSizes.map((size) => (
                              <div
                                key={size}
                                className="px-2 py-1 bg-white rounded-full text-xs font-semibold text-primary border border-primary/30"
                              >
                                {size}
                              </div>
                            ))}
                          </div>
                        </div>
                        <button
                          onClick={clearSizes}
                          className="px-3 py-1 bg-white hover:bg-primary/10 text-sm font-medium text-primary rounded border border-primary/30"
                        >
                          ×
                        </button>
                      </div>
                    )}

                    {hasPriceFilter && (
                      <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-primary">Prix:</span>
                          <div className="px-3 py-1 bg-white rounded-full text-xs font-semibold text-primary border border-primary/30">
                            {minPrice !== '' && maxPrice !== ''
                              ? `${formatPriceInFCFA(Number(minPrice))} - ${formatPriceInFCFA(Number(maxPrice))}`
                              : minPrice !== ''
                              ? `À partir de ${formatPriceInFCFA(Number(minPrice))}`
                              : maxPrice !== '' ? `Jusqu'à ${formatPriceInFCFA(Number(maxPrice))}` : ''
                            }
                          </div>
                        </div>
                        <button
                          onClick={clearPriceFilter}
                          className="px-3 py-1 bg-white hover:bg-primary/10 text-sm font-medium text-primary rounded border border-primary/30"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Grille de produits */}
            {loadingProducts ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-b-2 border-blue-600 mx-auto mb-2 sm:mb-3"></div>
                  <p className="text-gray-600 text-xs sm:text-sm font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>Chargement des produits...</p>
                </div>
              </div>
            ) : vendorProducts.length > 0 ? (
              <>
                {/* Compteur de résultats */}
                <div className="mb-4 text-[11px] sm:text-xs text-gray-600 font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''} trouvé{filteredProducts.length > 1 ? 's' : ''}
                  {(selectedColors.length > 0 || selectedSizes.length > 0 || hasPriceFilter || selectedSubCategory) && (
                    <span className="font-semibold"> avec les filtres actifs</span>
                  )}
                </div>

                {filteredProducts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProducts.map((product) => (
                      <ProductCardWithDesign
                        key={product.id}
                        product={product}
                        selectedColors={selectedColors}
                        onClick={() => {
                          console.log('Navigation vers détail produit:', product.id);
                          navigate(`/vendor-product-detail/${product.id}`);
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg px-4">
                    <svg className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <p className="text-gray-600 text-xs sm:text-sm lg:text-base mb-1.5 font-semibold" style={{ fontFamily: "'Poppins', sans-serif" }}>Aucun produit trouvé</p>
                    <p className="text-gray-500 text-[11px] sm:text-xs mb-4 font-normal" style={{ fontFamily: "'Inter', sans-serif" }}>
                      Aucun produit ne correspond aux filtres sélectionnés
                    </p>
                    <div className="flex gap-2 justify-center flex-wrap">
                      {selectedSubCategory && (
                        <button
                          onClick={() => setSelectedSubCategory(null)}
                          className="text-xs sm:text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                        >
                          Effacer la catégorie
                        </button>
                      )}
                      {selectedColors.length > 0 && (
                        <button
                          onClick={clearColors}
                          className="text-xs sm:text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                        >
                          Effacer les couleurs
                        </button>
                      )}
                      {selectedSizes.length > 0 && (
                        <button
                          onClick={clearSizes}
                          className="text-xs sm:text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                        >
                          Effacer les tailles
                        </button>
                      )}
                      {hasPriceFilter && (
                        <button
                          onClick={clearPriceFilter}
                          className="text-xs sm:text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                        >
                          Effacer le prix
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg px-4">
                <svg className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <p className="text-gray-600 text-xs sm:text-sm lg:text-base mb-1.5 font-semibold" style={{ fontFamily: "'Poppins', sans-serif" }}>Aucun produit disponible</p>
                <p className="text-gray-500 text-[11px] sm:text-xs font-normal" style={{ fontFamily: "'Inter', sans-serif" }}>Ce vendeur n'a pas encore publié de produits</p>
              </div>
            )}
              </main>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de zoom d'image */}
      {selectedImageIndex !== null && gallery && gallery.images && gallery.images[selectedImageIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center p-4"
          onClick={closeImageZoom}
        >
          {/* Bouton fermer */}
          <button
            onClick={closeImageZoom}
            className="absolute top-4 right-4 w-10 h-10 sm:w-12 sm:h-12 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-300 z-50"
          >
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Bouton précédent */}
          {gallery.images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPreviousImage();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-300 z-50"
            >
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Bouton suivant */}
          {gallery.images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNextImage();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-300 z-50"
            >
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Container de l'image */}
          <div
            className="relative max-w-7xl max-h-[90vh] w-full h-full flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image zoomée */}
            <img
              src={gallery.images[selectedImageIndex].imageUrl || gallery.images[selectedImageIndex].url}
              alt={gallery.images[selectedImageIndex].caption || `Image ${selectedImageIndex + 1}`}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              style={{
                imageRendering: 'auto',
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale'
              }}
            />

            {/* Caption */}
            {gallery.images[selectedImageIndex].caption && (
              <div className="mt-4 bg-black/50 backdrop-blur-sm text-white px-6 py-3 rounded-lg max-w-2xl text-center">
                <p className="text-sm sm:text-base font-medium">
                  {gallery.images[selectedImageIndex].caption}
                </p>
              </div>
            )}

            {/* Compteur d'images */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-full text-xs sm:text-sm font-medium">
              {selectedImageIndex + 1} / {gallery.images.length}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
