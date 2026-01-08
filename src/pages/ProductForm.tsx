import { useState, useRef } from "react";
import Button from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { ChevronRight, X, Upload, Eye, Check, Plus, ShoppingCart, Loader2, Target, FileImage } from "lucide-react";
import ProductCharacteristics from "../components/ProductCharacteristics";
import ProDelimitationEditor from "../components/ProDelimitationEditor";
import { CategorySelector } from "../components/CategorySelector";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { ProductService, CreateProductPayload } from "../services/productService";
import { Delimitation, DelimitationService } from "../services/delimitationService";
import { resizeImage } from '../utils/imageResizer';

// Types basés sur votre schéma Prisma et la documentation API
type ViewType = "FRONT" | "BACK" | "LEFT" | "RIGHT" | "TOP" | "BOTTOM" | "DETAIL" | "OTHER" | "DESIGN";
type PublicationStatus = "PUBLISHED" | "DRAFT";

interface Size {
    id: number;
    name: string;
}

interface Color {
    id: number;
    name: string;
    hexCode?: string;
    imageUrl: string;
}

interface CategoryItem {
    id: number;
    name: string;
    parentId?: number;
    level?: number;
    order?: number;
    subcategories?: CategoryItem[];
}

interface Design {
    id: number;
    name: string;
    imageUrl: string;
    description?: string;
}

interface ProductView {
    viewType: ViewType;
    imageUrl: string;
    description?: string;
    imageId?: number; // Pour les délimitations
}

interface CustomColor {
    name: string;
    hexCode: string;
}

interface CustomDesign {
    name: string;
    description: string;
    image?: string;
    base64Image?: string;
}

interface ColorImage {
    url: string;
    file: File;
}

interface ColorImagesDict {
    [key: number]: ColorImage[];
}

// Données de démonstration avec sous-catégories hiérarchiques
const availableSizes: Size[] = [
    { id: 1, name: "S" },
    { id: 2, name: "M" },
    { id: 3, name: "L" },
    { id: 4, name: "XL" },
];

const availableColors: Color[] = [
    { id: 1, name: "Noir", hexCode: "#000000", imageUrl: "/api/placeholder/50/50" },
    { id: 2, name: "Blanc", hexCode: "#FFFFFF", imageUrl: "/api/placeholder/50/50" },
    { id: 3, name: "Rouge", hexCode: "#FF0000", imageUrl: "/api/placeholder/50/50" },
];

// Structure hiérarchique des catégories avec sous-catégories
const availableCategories: CategoryItem[] = [
    // Catégories principales
    { id: 1, name: "Vêtements", level: 0, order: 1 },
    { id: 2, name: "Accessoires", level: 0, order: 2 },
    { id: 3, name: "Articles de bureau", level: 0, order: 3 },
    { id: 4, name: "Décoration", level: 0, order: 4 },
    { id: 5, name: "Électronique", level: 0, order: 5 },
    
    // Sous-catégories de Vêtements (ID: 1)
    { id: 11, name: "T-Shirts", parentId: 1, level: 1, order: 1 },
    { id: 12, name: "Sweats", parentId: 1, level: 1, order: 2 },
    { id: 13, name: "Polos", parentId: 1, level: 1, order: 3 },
    { id: 14, name: "Chemises", parentId: 1, level: 1, order: 4 },
    { id: 15, name: "Pantalons", parentId: 1, level: 1, order: 5 },
    
    // Sous-catégories d'Accessoires (ID: 2)
    { id: 21, name: "Casquettes", parentId: 2, level: 1, order: 1 },
    { id: 22, name: "Sacs", parentId: 2, level: 1, order: 2 },
    { id: 23, name: "Montres", parentId: 2, level: 1, order: 3 },
    { id: 24, name: "Bijoux", parentId: 2, level: 1, order: 4 },
    
    // Sous-catégories d'Articles de bureau (ID: 3)
    { id: 31, name: "Mugs", parentId: 3, level: 1, order: 1 },
    { id: 32, name: "Stylos", parentId: 3, level: 1, order: 2 },
    { id: 33, name: "Carnets", parentId: 3, level: 1, order: 3 },
    { id: 34, name: "Clés USB", parentId: 3, level: 1, order: 4 },
    
    // Sous-catégories de Décoration (ID: 4)
    { id: 41, name: "Coussins", parentId: 4, level: 1, order: 1 },
    { id: 42, name: "Tableaux", parentId: 4, level: 1, order: 2 },
    { id: 43, name: "Stickers", parentId: 4, level: 1, order: 3 },
];

const availableDesigns: Design[] = [
    { id: 1, name: "Logo classique", imageUrl: "/api/placeholder/100/100", description: "Notre logo emblématique" },
    { id: 2, name: "Édition limitée", imageUrl: "/api/placeholder/100/100", description: "Design édition limitée 2025" },
];

const availableViews: ViewType[] = ["FRONT", "BACK", "LEFT", "RIGHT", "TOP", "BOTTOM", "DETAIL", "OTHER"];

const viewTypeLabels: Record<ViewType | 'DESIGN', string> = {
    FRONT: "Face avant",
    BACK: "Face arrière",
    LEFT: "Côté gauche",
    RIGHT: "Côté droit",
    TOP: "Dessus",
    BOTTOM: "Dessous",
    DETAIL: "Détail",
    OTHER: "Autre",
    DESIGN: "Design"
};

// Composant d'overlay de chargement
const LoadingOverlay = () => (
  <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
    <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg flex flex-col items-center max-w-md">
      <Loader2 className="h-12 w-12 text-black dark:text-white animate-spin mb-4" />
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Création du produit...</h3>
      <p className="text-gray-500 dark:text-gray-400 mb-4 text-center">
        Nous enregistrons votre produit et uploadons les images. Merci de patienter.
      </p>
      <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
        <div className="bg-black dark:bg-white h-full animate-pulse" style={{ width: '100%' }}></div>
      </div>
    </div>
  </div>
);



// Overlay local pendant la compression/redimensionnement
const ResizingOverlay = () => (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg flex flex-col items-center max-w-xs">
      <Loader2 className="h-8 w-8 text-black dark:text-white animate-spin mb-3" />
      <p className="text-sm text-gray-700 dark:text-gray-300 text-center">Compression de l'image…</p>
    </div>
  </div>
);

export default function ProductForm() {
    const [activeStep, setActiveStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    
    // États pour gérer les couleurs personnalisées
    const [showCustomColorPicker, setShowCustomColorPicker] = useState(false);
    const [customColor, setCustomColor] = useState<CustomColor>({ name: "", hexCode: "#ffffff" });
    const [customColors, setCustomColors] = useState<CustomColor[]>([]);
    const [colorFiles, setColorFiles] = useState<{[key: string | number]: File}>({});
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const designFileInputRef = useRef<HTMLInputElement | null>(null);
    const [isResizing, setIsResizing] = useState(false);

    // Pending upload state
    const [pendingUpload, setPendingUpload] = useState<{
        file: File;
        previewUrl: string;
        onApply: (resized: File) => void;
    } | null>(null);


    // Composant modale (utilise l'état ci-dessus)
    const ConfirmUploadModal = () => {
        if (!pendingUpload) return null;
        const { previewUrl, file, onApply } = pendingUpload;

        const handleCancel = () => {
            URL.revokeObjectURL(previewUrl);
            setPendingUpload(null);
        };

        const handleConfirm = async () => {
            try {
                setIsResizing(true);
                // Utiliser directement le fichier sans compression
                const resizedFile = new File([file], file.name, { type: file.type });
                onApply(resizedFile);
            } catch (err) {
                console.error('Erreur lors du traitement du fichier', err);
            } finally {
                setIsResizing(false);
                setPendingUpload(null);
            }
        };

        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg w-80 space-y-4">
                    <img src={previewUrl} alt="aperçu" className="w-full rounded" />
                    <p className="text-center text-sm text-gray-700 dark:text-gray-300">Redimensionner l'image à 500 px de large ?</p>
                    <div className="flex justify-between">
                        <Button variant="outline" onClick={handleCancel}>Annuler</Button>
                        <Button onClick={handleConfirm}>Télécharger (500 px)</Button>
                    </div>
                </div>
            </div>
        );
    };

    // État du produit selon la documentation API
    const [product, setProduct] = useState({
        name: "",
        description: "",
        price: 0,
        stock: 0,
        status: "PUBLISHED" as PublicationStatus,
        categoryId: 0,
        subcategoryId: 0,
        designId: null as number | null,
        design: null as { name: string; imageUrl: string } | null,
        sizes: [] as number[],
        colors: [] as number[],
        customColors: [] as number[],
        colorImages: {} as ColorImagesDict,
        customColorImages: {} as ColorImagesDict,
        customDesign: undefined as CustomDesign | undefined,
        designImage: undefined as File | undefined,
        designData: undefined as { file: File; fileName: string; description: string } | undefined,
        designImagePreview: undefined as string | undefined,
        designImages: [] as { url: string; file: File }[],
        views: [] as ProductView[],
        delimitations: {} as { [viewType: string]: Delimitation[] },
    });

    // Prévisualisation du produit
    const [activeColor] = useState<number | null>(null);
    const [isCustomColorActive] = useState(false);
    const [activeView, setActiveView] = useState<ViewType | 'DESIGN'>("FRONT");

    // États pour la gestion de la délimitation

    // Références pour les uploads de fichiers
    const [viewFiles, setViewFiles] = useState<{ [viewType: string]: File }>({});

    // Gérer les changements dans le formulaire
    const handleChange = (field: string, value: any) => {
        setProduct({ ...product, [field]: value });
    };

    // Gérer la sélection de catégorie
    const handleCategoryChange = (categoryId: number | null) => {
        setProduct(prev => ({ 
            ...prev, 
            categoryId: categoryId || 0,
            subcategoryId: 0
        }));
    };

    // Gérer la sélection de sous-catégorie
    const handleSubcategoryChange = (subcategoryId: number | null) => {
        setProduct(prev => ({ 
            ...prev, 
            subcategoryId: subcategoryId || 0
        }));
    };

    // Gérer les tailles
    const toggleSize = (sizeId: number) => {
        if (product.sizes.includes(sizeId)) {
            setProduct({ ...product, sizes: product.sizes.filter(id => id !== sizeId) });
        } else {
            setProduct({ ...product, sizes: [...product.sizes, sizeId] });
        }
    };

    // Gérer les couleurs
    const toggleColor = (colorId: number) => {
        if (product.colors.includes(colorId)) {
            setProduct({ ...product, colors: product.colors.filter(id => id !== colorId) });
        } else {
            setProduct({ ...product, colors: [...product.colors, colorId] });
        }
    };

    // Validation de fichier image améliorée
    const validateImageFile = (file: File): boolean => {
        if (!file.type.match('image.*')) {
            setUploadError('Veuillez sélectionner une image valide (JPG, PNG, WebP)');
            return false;
        }
        
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            setUploadError(`L'image ne doit pas dépasser 5MB (taille actuelle: ${(file.size / (1024 * 1024)).toFixed(2)}MB)`);
            return false;
        }
        
        return true;
    };

    // Gérer l'upload d'images de couleurs standard
    const handleStandardColorImageUpload = async (colorId: number, event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0) return;
        
        const newImages: ColorImage[] = [];
        
        for (const file of event.target.files) {
            try {
                const resizedFile = await resizeImage(file);
                if (!validateImageFile(resizedFile)) continue;
                
                // ✅ Upload direct sur le serveur avec productId et colorId
                console.log(`🚀 [ProductForm] Upload direct image couleur ${colorId}...`);
                
                // Utiliser un productId temporaire ou 0 pour les nouveaux produits
                const productId = 0; // Temporaire pour les nouveaux produits
                
                // ✅ Upload direct selon la documentation
                const formData = new FormData();
                formData.append('image', resizedFile);
                
                const response = await fetch(`https://printalma-back-dep.onrender.com/products/upload-color-image/${productId}/${colorId}`, {
                    method: 'POST',
                    credentials: 'include',
                    body: formData
                });
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || 'Erreur lors de l\'upload de l\'image');
                }
                
                const result = await response.json();
                
                if (result.success && result.image) {
                    // ✅ Image uploadée avec succès sur le serveur
                    const serverUrl = result.image.url;
                    const fileId = `color_${colorId}_${Date.now()}`;
                    
                    // Créer l'objet ColorImage avec l'URL du serveur
                    newImages.push({ 
                        url: serverUrl, 
                        file: resizedFile 
                    });
                    
                    // Ajouter le fichier à colorFiles pour la soumission finale
                    setColorFiles(prev => ({
                        ...prev,
                        [fileId]: resizedFile
                    }));
                    
                    console.log(`✅ [ProductForm] Image couleur ${colorId} uploadée directement sur le serveur:`, serverUrl);
                    toast.success(`Image couleur uploadée avec succès`, {
                        duration: 2000
                    });
                } else {
                    throw new Error(result.message || 'Erreur lors de l\'upload de l\'image');
                }
            } catch (error) {
                console.error(`❌ [ProductForm] Erreur lors du traitement de l'image ${file.name}:`, error);
                toast.error(`Erreur lors de l'upload de l'image: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
            }
        }
        
        if (newImages.length > 0) {
            const currentImages = product.colorImages[colorId] || [];
            const updatedColorImages = {
                ...product.colorImages,
                [colorId]: [...currentImages, ...newImages]
            };
            handleChange("colorImages", updatedColorImages);
            console.log(`✅ [ProductForm] Image(s) pour couleur ${colorId} ajoutée(s)`);
        }
    };

    // Gérer l'upload d'images de couleurs personnalisées
    const handleCustomColorImageUpload = async (colorIndex: number, event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0) return;
        
        const newImages: ColorImage[] = [];
        
        for (const file of event.target.files) {
            try {
                const resizedFile = await resizeImage(file);
                if (!validateImageFile(resizedFile)) continue;
                
                // ✅ Upload direct sur le serveur avec productId et colorIndex
                console.log(`🚀 [ProductForm] Upload direct image couleur personnalisée ${colorIndex}...`);
                
                // Utiliser un productId temporaire ou 0 pour les nouveaux produits
                const productId = 0; // Temporaire pour les nouveaux produits
                
                // ✅ Upload direct selon la documentation
                const formData = new FormData();
                formData.append('image', resizedFile);
                
                const response = await fetch(`https://printalma-back-dep.onrender.com/products/upload-color-image/${productId}/${colorIndex}`, {
                    method: 'POST',
                    credentials: 'include',
                    body: formData
                });
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || 'Erreur lors de l\'upload de l\'image');
                }
                
                const result = await response.json();
                
                if (result.success && result.image) {
                    // ✅ Image uploadée avec succès sur le serveur
                    const serverUrl = result.image.url;
                    const fileId = `color_${colorIndex}_${Date.now()}`;
                    
                    // Créer l'objet ColorImage avec l'URL du serveur
                    newImages.push({ 
                        url: serverUrl, 
                        file: resizedFile 
                    });
                    
                    // Ajouter le fichier à colorFiles pour la soumission finale
                    setColorFiles(prev => ({
                        ...prev,
                        [fileId]: resizedFile
                    }));
                    
                    console.log(`✅ [ProductForm] Image couleur personnalisée ${colorIndex} uploadée directement sur le serveur:`, serverUrl);
                    toast.success(`Image couleur uploadée avec succès`, {
                        duration: 2000
                    });
                } else {
                    throw new Error(result.message || 'Erreur lors de l\'upload de l\'image');
                }
            } catch (error) {
                console.error(`❌ [ProductForm] Erreur lors du traitement de l'image ${file.name}:`, error);
                toast.error(`Erreur lors de l'upload de l'image: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
            }
        }
        
        if (newImages.length > 0) {
            const currentImages = product.customColorImages[colorIndex] || [];
            const updatedCustomColorImages = {
                ...product.customColorImages,
                [colorIndex]: [...currentImages, ...newImages]
            };
            handleChange("customColorImages", updatedCustomColorImages);
            console.log(`✅ [ProductForm] Image(s) pour couleur personnalisée ${colorIndex} ajoutée(s)`);
        }
    };

    // Gestion de l'upload d'image de design
    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        setUploadError(null);
        if (!event.target.files || event.target.files.length === 0) return;
        
        let resizedFile: File;
        try {
            resizedFile = await resizeImage(event.target.files[0]);
        } catch (e) {
            setUploadError('Erreur lors du redimensionnement de l\'image');
            return;
        }

        if (!validateImageFile(resizedFile)) {
            return;
        }

        const url = URL.createObjectURL(resizedFile);
        setImagePreview(url);
        const designImage = { url: url, file: resizedFile };
        handleChange('designImages', [designImage]);
        
        const fileName = resizedFile.name;
        const designName = fileName.split('.')[0] || 'Design personnalisé';
        setActiveView('DESIGN');
        
        const timestamp = Date.now();
        const randomNum = Math.floor(Math.random() * 1000);
        const fileExtension = resizedFile.name.split('.').pop() || 'jpg';
        const designFileName = `design_${timestamp}_${randomNum}.${fileExtension}`;
        
        const customDesign: CustomDesign = {
            name: designName,
            description: `Design personnalisé créé à partir de ${fileName}`,
            image: designFileName
        };
        
        handleChange('customDesign', customDesign);
        handleChange('designImage', resizedFile);
        handleChange('designId', null);
        
        const designData = {
            file: resizedFile,
            fileName: designFileName,
            description: `Design personnalisé créé à partir de ${fileName}`
        };
        
        handleChange('designData', designData);
        handleChange('design', null);
        
        console.log("✅ Design configuré avec image:", {
            customDesign: customDesign,
            designFileName: designFileName,
            fileSize: `${Math.round(resizedFile.size/1024)}KB`
        });
        
        const designView: ProductView = {
            viewType: 'DESIGN' as ViewType,
            imageUrl: url,
            description: designName
        };
        
        const filteredViews = product.views.filter(v => v.viewType !== 'DESIGN');
        const updatedViews = [...filteredViews, designView];
        setProduct({
            ...product,
            views: updatedViews
        });
    };

    // Soumettre le formulaire avec la nouvelle API
    const handleSubmit = async () => {
        console.log("🔄 [ProductForm] Début de la soumission du produit...");
        
        setIsLoading(true);
        setUploadError(null);

        try {
            // 1. Validation des champs
            if (!product.name || !product.categoryId || product.categoryId <= 0) {
                throw new Error("Le nom et la catégorie du produit sont obligatoires.");
            }

            const imageFiles: File[] = [
                ...Object.values(colorFiles),
                ...Object.values(viewFiles),
                ...(product.designImage ? [product.designImage] : [])
            ];

            if (imageFiles.length === 0) {
                throw new Error("Au moins une image est requise pour créer le produit.");
            }
            
            console.log(`✅ [ProductForm] Validation réussie. ${imageFiles.length} images à uploader.`);

            // 2. Préparer les données pour le service
            const productData: CreateProductPayload = {
                name: product.name,
                description: product.description,
                price: product.price,
                stock: product.stock,
                status: product.status,
                categoryId: product.categoryId ? String(product.categoryId) : '',
                sizes: product.sizes.map(String),
            };

            console.log("✅ [ProductForm] Données préparées pour l'API:", productData);

            // 3. Appel à l'API backend avec FormData
            const result = await ProductService.createProduct(productData, imageFiles);

            if (result.success && result.data?.id) {
                console.log("✅ [ProductForm] Produit créé avec succès!", result.data);

                // ÉTAPE CRUCIALE : Enregistrer les délimitations en convertissant en pixels
                const newProduct = result.data;
                
                if (newProduct.views && newProduct.views.length > 0 && Object.keys(product.delimitations).length > 0) {
                    const viewTypeToIdMap = new Map<string, number>();
                    newProduct.views.forEach((view: any) => {
                        if (view.id && view.viewType) {
                            viewTypeToIdMap.set(view.viewType, view.id);
                        }
                    });

                    console.log("🗺️ [ProductForm] Mapping ViewType -> ImageID:", viewTypeToIdMap);
                    
                    const processViewType = async (viewType: string) => {
                        const imageId = viewTypeToIdMap.get(viewType);
                        if (!imageId) return [];

                        const delimitationsForView = product.delimitations[viewType as ViewType];
                        
                        const creationPromises = delimitationsForView.map(delim => {
                            const percentDelim = {
                                x: delim.x,
                                y: delim.y,
                                width: delim.width,
                                height: delim.height,
                                name: delim.name,
                                coordinateType: 'PERCENTAGE' as const,
                                referenceWidth: delim.referenceWidth || 0,
                                referenceHeight: delim.referenceHeight || 0,
                            };
                            console.log(`➕ [ProductForm] Ajout de la délimitation (%) pour l'image ${imageId} (${viewType})`, percentDelim);
                            return DelimitationService.createDelimitation({
                                productImageId: imageId,
                                delimitation: percentDelim
                            });
                        });
                        return Promise.all(creationPromises);
                    };

                    const allPromises = Object.keys(product.delimitations).map(processViewType);

                    if (allPromises.length > 0) {
                        console.log(`⏳ [ProductForm] Enregistrement des délimitation(s)...`);
                        const results = await Promise.all(allPromises);
                        const flatResults = results.flat();
                        const failedDelimitations = flatResults.filter(res => !res.success);
                        
                        if (failedDelimitations.length > 0) {
                            console.error(`❌ [ProductForm] ${failedDelimitations.length} délimitation(s) n'ont pas pu être enregistrées.`);
                            toast.warning("Certaines zones de personnalisation n'ont pas pu être enregistrées.");
                        } else {
                            console.log("✅ [ProductForm] Toutes les délimitations ont été enregistrées avec succès.");
                        }
                    }
                }

                toast.success(`${product.name} a été ajouté à votre catalogue.`, {
                    duration: 3000
                });
                
                // Réinitialiser le formulaire
                setProduct({
                    name: "",
                    description: "",
                    price: 0,
                    stock: 0,
                    status: "PUBLISHED" as PublicationStatus,
                    categoryId: 0,
                    subcategoryId: 0,
                    designId: null,
                    design: null,
                    sizes: [],
                    colors: [],
                    customColors: [],
                    colorImages: {},
                    customColorImages: {},
                    customDesign: undefined,
                    designImage: undefined,
                    designData: undefined,
                    designImagePreview: undefined,
                    designImages: [],
                    views: [],
                    delimitations: {},
                });
                setColorFiles({});
                setViewFiles({});
                
                console.log("🔄 [ProductForm] Redirection vers /admin/products...");
                
                // Redirection
                setTimeout(() => {
                    navigate("/admin/products", { 
                        state: { 
                            newProduct: result.data,
                            message: result.message || (result.data ? `Produit "${result.data.name}" créé avec succès!` : "Produit créé avec succès!")
                        },
                        replace: true
                    });
                }, 1000);

            } else {
                throw new Error(result.error || "Erreur lors de la création du produit");
            }
                
        } catch (error) {
            console.error('❌ [ProductForm] Erreur lors de la création du produit:', error);
            
            toast.error("Impossible d'ajouter le produit", {
                description: error instanceof Error ? error.message : "Vérifiez les informations saisies et réessayez.",
                duration: 4000
            });
        } finally {
            setIsLoading(false);
            console.log("🏁 [ProductForm] Processus terminé");
        }
    };

    // Étapes du formulaire avec délimitations
    const steps = [
        { label: "Informations de base", isCompleted: product.name && product.description && product.price > 0 },
        { label: "Caractéristiques", isCompleted: (product.categoryId > 0 || product.subcategoryId > 0) && product.sizes.length > 0 && (product.colors.length > 0 || product.customColors.length > 0) },
        { label: "Images & Vues", isCompleted: true },
        { label: "Zones de personnalisation", isCompleted: true },
        { label: "Prévisualisation", isCompleted: true },
    ];

    // Gérer les changements de délimitations
    const handleDelimitationsChange = (viewType: ViewType, delimitations: Delimitation[]) => {
        setProduct(prev => ({
            ...prev,
            delimitations: {
                ...prev.delimitations,
                [viewType]: delimitations
            }
        }));
    };

    // Récupérer l'URL de l'image pour la vue active
    const _unused_getActiveViewImage = (currentActiveView: ViewType | 'DESIGN', currentProduct: typeof product) => {
        if (currentActiveView === 'DESIGN') {
            const designView = currentProduct.views.find(v => v.viewType === 'DESIGN');
            if (designView?.imageUrl) {
                return designView.imageUrl;
            }
            
            if (currentProduct.designImages && currentProduct.designImages.length > 0) {
                return currentProduct.designImages[0].url;
            }
            
            if (currentProduct.customDesign?.base64Image) {
                return currentProduct.customDesign.base64Image;
            }
            
            if (imagePreview) {
                return imagePreview;
            }
            
            return currentProduct.design?.imageUrl || "/api/placeholder/400/400?text=No+Design";
        }

        if (activeColor !== null) {
            if (isCustomColorActive) {
                const customColorImages = currentProduct.customColorImages[activeColor];
                if (customColorImages && customColorImages.length > 0) {
                    return customColorImages[0].url;
                }
            } else {
                const colorImages = currentProduct.colorImages[activeColor];
                if (colorImages && colorImages.length > 0) {
                    return colorImages[0].url;
                }
            }
        }

        const view = currentProduct.views.find(v => v.viewType === currentActiveView);
        return view?.imageUrl || "/api/placeholder/400/400?text=No+Image";
    };

    // Récupérer les informations de la couleur active
    const _unused_getActiveColorInfo = () => {
        if (activeColor === null) return null;
        
        if (isCustomColorActive && customColors[activeColor]) {
            return {
                id: activeColor,
                name: customColors[activeColor].name,
                hexCode: customColors[activeColor].hexCode,
                imageUrl: ""
            };
        }

        return availableColors.find(color => color.id === activeColor);
    };

    // Autres fonctions utilitaires (addCustomColor, saveCustomColor, etc.)
    const addCustomColor = () => {
        setCustomColor({ name: "", hexCode: "#ffffff" });
        setShowCustomColorPicker(true);
    };

    const saveCustomColor = () => {
        if (!customColor.name || !customColor.hexCode) return;
        setCustomColors([...customColors, { ...customColor }]);
        setShowCustomColorPicker(false);
        setCustomColor({ name: "", hexCode: "#ffffff" });
    };

    const removeCustomColor = (index: number) => {
        const newCustomColors = [...customColors];
        newCustomColors.splice(index, 1);
        setCustomColors(newCustomColors);

        const updatedCustomColors = product.customColors.filter(i => i !== index);
        handleChange("customColors", updatedCustomColors);

        const newProductCustomColors = product.customColors.map(i =>
            i > index ? i - 1 : i
        ).filter(i => i >= 0);

        handleChange("customColors", newProductCustomColors);

        const newCustomColorImages = { ...product.customColorImages };
        delete newCustomColorImages[index];

        Object.keys(newCustomColorImages).forEach(key => {
            const keyNum = parseInt(key);
            if (keyNum > index) {
                newCustomColorImages[keyNum - 1] = newCustomColorImages[keyNum as keyof typeof newCustomColorImages];
                delete newCustomColorImages[keyNum as keyof typeof newCustomColorImages];
            }
        });

        handleChange("customColorImages", newCustomColorImages);
    };

    const toggleCustomColor = (index: number) => {
        let updatedCustomColors = [...product.customColors];

        if (updatedCustomColors.includes(index)) {
            updatedCustomColors = updatedCustomColors.filter(i => i !== index);
        } else {
            updatedCustomColors.push(index);
        }

        handleChange("customColors", updatedCustomColors);
    };

    const removeColorImage = (colorId: number, imageIndex: number) => {
        const updatedImages = [...(product.colorImages[colorId] || [])];
        updatedImages.splice(imageIndex, 1);

        const updatedColorImages = {
            ...product.colorImages,
            [colorId]: updatedImages
        };

        handleChange("colorImages", updatedColorImages);
    };

    const removeCustomColorImage = (colorIndex: number, imageIndex: number) => {
        const updatedImages = [...(product.customColorImages[colorIndex] || [])];
        updatedImages.splice(imageIndex, 1);

        const updatedCustomColorImages = {
            ...product.customColorImages,
            [colorIndex]: updatedImages
        };

        handleChange("customColorImages", updatedCustomColorImages);
    };

    const getContrastYIQ = (hexcolor: string) => {
        hexcolor = hexcolor.replace("#", "");

        if (hexcolor.length === 3) {
            hexcolor = hexcolor.split('').map(char => char + char).join('');
        }

        const r = parseInt(hexcolor.substr(0, 2), 16);
        const g = parseInt(hexcolor.substr(2, 2), 16);
        const b = parseInt(hexcolor.substr(4, 2), 16);

        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;

        return (yiq >= 128) ? 'black' : 'white';
    };

    // Upload d'image de vue produit
    const handleViewImageUpload = async (viewType: ViewType, event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0) return;
        
        try {
            const resizedFile = await resizeImage(event.target.files[0]);
            if (!validateImageFile(resizedFile)) return;
            
            const url = URL.createObjectURL(resizedFile);
            const newViewFiles = { ...viewFiles };
            newViewFiles[viewType] = resizedFile;
            setViewFiles(newViewFiles);
            
            const newView: ProductView = {
                viewType: viewType,
                imageUrl: url,
                description: `Vue ${viewType.toLowerCase()}`
            };
            
            const updatedViews = product.views.filter(v => v.viewType !== viewType);
            updatedViews.push(newView);
            
            setProduct({
                ...product,
                views: updatedViews
            });
            
            console.log(`✅ Image de vue ${viewType} ajoutée: ${resizedFile.name}`);
        } catch (error) {
            console.error(`Erreur lors du redimensionnement de l'image:`, error);
            toast.error(`Erreur lors du traitement de l'image`);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('fr-SN', {
            style: 'currency',
            currency: 'XOF',
            maximumFractionDigits: 0,
            currencyDisplay: 'symbol'
        }).format(price);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800">
            {/* Afficher le loader quand isLoading est true */}
            {isLoading && <LoadingOverlay />}
            {isResizing && <ResizingOverlay />}
            {pendingUpload && <ConfirmUploadModal />}

            {/* Container principal avec glassmorphism */}
            <div className="max-w-7xl mx-auto p-6">
                {/* Header moderne avec gradient */}
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/50 shadow-xl mb-8 p-8">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Plus className="h-8 w-8 text-white" />
                        </div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-2">
                            Créer un nouveau produit
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 text-lg">
                            Configurez votre produit personnalisable en quelques étapes simples
                        </p>
                    </div>
                </div>

                {/* Stepper moderne */}
                <div className="mb-12">
                    {/* Indicateur d'étape - visible sur tous les appareils */}
                    <div className="flex items-center justify-center mb-8">
                        <div className="px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center text-white shadow-lg">
                            <span className="font-semibold">Étape {activeStep + 1}</span>
                            <span className="mx-3 text-blue-200">/</span>
                            <span className="text-blue-100">{steps.length}</span>
                        </div>
                    </div>

                    {/* Barre de progression moderne */}
                    <div className="relative h-3 bg-gray-200/50 dark:bg-gray-700/50 rounded-full overflow-hidden mb-10 mx-auto max-w-2xl backdrop-blur-sm">
                        <div
                            className="absolute h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-700 ease-out rounded-full"
                            style={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
                        ></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                    </div>

                    {/* Version mobile: étape actuelle uniquement */}
                    <div className="flex justify-center mb-6 lg:hidden">
                        <div className="relative flex flex-col items-center w-40 h-40 justify-center rounded-2xl shadow-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                            <div className="w-12 h-12 flex items-center justify-center rounded-full mb-3 border-2 bg-black dark:bg-white text-white dark:text-black border-black dark:border-white">
                                {activeStep + 1}
                            </div>
                            <h3 className="text-base font-semibold text-center text-black dark:text-white">
                                {steps[activeStep].label}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1 px-3">
                                {activeStep === 0 && "Les détails essentiels de votre produit"}
                                {activeStep === 1 && "Catégories et options disponibles"}
                                {activeStep === 2 && "Vues et visuels du produit"}
                                {activeStep === 3 && "Zones de personnalisation interactives"}
                                {activeStep === 4 && "Vérification avant publication"}
                            </p>
                        </div>
                    </div>

                    {/* Navigation mobile: points */}
                    <div className="flex justify-center space-x-2 lg:hidden mb-2">
                        {steps.map((_, index) => (
                            <button
                                key={index}
                                    onClick={() => index <= steps.findIndex(s => s.isCompleted) + 1 && setActiveStep(index)}
                                disabled={index > steps.findIndex(s => s.isCompleted) + 1}
                                className={`w-2.5 h-2.5 rounded-full transition-all ${index === activeStep
                                        ? "bg-black dark:bg-white scale-125"
                                        : index < activeStep
                                            ? "bg-gray-400 dark:bg-gray-500"
                                            : "bg-gray-200 dark:bg-gray-700"
                                    }`}
                                aria-label={`Aller à l'étape ${index + 1}`}
                            />
                        ))}
                    </div>

                    {/* Navigation (précédent/suivant) - visible sur mobile uniquement */}
                    <div className="flex justify-between px-2 lg:hidden">
                        <button
                            className={`text-sm flex items-center ${activeStep === 0
                                    ? "text-gray-400 dark:text-gray-600"
                                    : "text-gray-600 dark:text-gray-300"
                                }`}
                            onClick={() => activeStep > 0 && setActiveStep(activeStep - 1)}
                            disabled={activeStep === 0}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Précédent
                        </button>
                        <button
                            className={`text-sm flex items-center ${!steps[activeStep].isCompleted || activeStep === steps.length - 1
                                    ? "text-gray-400 dark:text-gray-600"
                                    : "text-gray-600 dark:text-gray-300"
                                }`}
                            onClick={() => activeStep < steps.length - 1 && steps[activeStep].isCompleted && setActiveStep(activeStep + 1)}
                            disabled={!steps[activeStep].isCompleted || activeStep === steps.length - 1}
                        >
                            Suivant
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                                </div>

                    {/* Version desktop: toutes les étapes avec design moderne */}
                    <div className="hidden lg:flex justify-between items-start mt-8 px-12">
                        {steps.map((step, index) => {
                            const isCompleted = index < activeStep;
                            const isCurrent = index === activeStep;
                            const isClickable = index <= steps.findIndex(s => s.isCompleted) + 1;

                            return (
                                <div
                                    key={index}
                                    className={`relative flex flex-col items-center w-full ${
                                        index === steps.length - 1 
                                            ? "" 
                                            : "after:content-[''] after:absolute after:top-8 after:w-full after:h-[3px] after:left-1/2 after:bg-gradient-to-r after:from-gray-200 after:to-gray-300 dark:after:from-gray-600 dark:after:to-gray-700"
                                    }`}
                                >
                                    {/* Connecteur animé pour les étapes complétées */}
                                    {index < steps.length - 1 && isCompleted && (
                                        <div className="absolute top-8 left-1/2 w-full h-[3px] bg-gradient-to-r from-blue-500 to-indigo-500 z-10"></div>
                                    )}

                                    <div
                                        onClick={() => isClickable && setActiveStep(index)}
                                        className={`
                                            z-20 h-16 w-16 flex items-center justify-center rounded-2xl mb-4
                                            transition-all duration-300 ease-in-out transform
                                            ${isClickable ? "cursor-pointer hover:scale-105" : "cursor-not-allowed"}
                                            ${isCompleted
                                                ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg"
                                                : isCurrent
                                                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl scale-110"
                                                    : "bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 text-gray-400 shadow-md"
                                            }
                                        `}
                                    >
                                        {isCompleted ? <Check size={24} /> : index + 1}
                                    </div>

                                    <div className={`
                                        flex flex-col items-center text-center max-w-[140px]
                                        ${isCurrent ? "transform scale-105 transition-transform" : ""}
                                    `}>
                                        <span className={`
                                            text-sm font-semibold mb-2
                                            ${isCurrent 
                                                ? "text-blue-600 dark:text-blue-400" 
                                                : isCompleted 
                                                    ? "text-green-600 dark:text-green-400" 
                                                    : "text-gray-400 dark:text-gray-500"
                                            }
                                        `}>
                                            {step.label}
                                        </span>

                                        {isCurrent && (
                                            <div className="px-3 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 rounded-full">
                                                <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                                                    {activeStep === 0 && "Configuration de base"}
                                                    {activeStep === 1 && "Options et variantes"}
                                                    {activeStep === 2 && "Galerie d'images"}
                                                    {activeStep === 3 && "Zones personnalisables"}
                                                    {activeStep === 4 && "Validation finale"}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Contenu des étapes avec design modernisé */}
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/50 shadow-xl p-8 mb-8">
                    {/* Étape 1: Informations de base */}
                    {activeStep === 0 && (
                        <div className="space-y-8">
                            {/* Header de l'étape */}
                            <div className="text-center">
                                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                                    <div className="w-6 h-6 border-2 border-white rounded"></div>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Informations de base</h2>
                                <p className="text-gray-600 dark:text-gray-400">Définissez les caractéristiques essentielles de votre produit</p>
                            </div>

                            {/* Grille de champs avec design moderne */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Nom du produit */}
                                <div className="lg:col-span-1">
                                    <Card className="border border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-lg hover:shadow-xl transition-all duration-300">
                                        <CardContent className="p-6">
                                            <Label className="text-gray-900 dark:text-white font-semibold mb-3 block">
                                                Nom du produit <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                placeholder="Ex: T-shirt personnalisé premium"
                                                value={product.name}
                                                onChange={(e) => handleChange("name", e.target.value)}
                                                className="w-full p-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                                            />
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Prix */}
                                <div className="lg:col-span-1">
                                    <Card className="border border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-lg hover:shadow-xl transition-all duration-300">
                                        <CardContent className="p-6">
                                            <Label className="text-gray-900 dark:text-white font-semibold mb-3 block">
                                                Prix (XOF) <span className="text-red-500">*</span>
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    placeholder="15000"
                                                    value={product.price}
                                                    onChange={(e) => handleChange("price", parseFloat(e.target.value))}
                                                    className="w-full p-4 pl-12 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                                                />
                                                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">
                                                    XOF
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Stock */}
                                <div className="lg:col-span-1">
                                    <Card className="border border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-lg hover:shadow-xl transition-all duration-300">
                                        <CardContent className="p-6">
                                            <Label className="text-gray-900 dark:text-white font-semibold mb-3 block">
                                                Stock disponible
                                            </Label>
                                            <Input
                                                type="number"
                                                placeholder="100"
                                                value={product.stock}
                                                onChange={(e) => handleChange("stock", parseInt(e.target.value))}
                                                className="w-full p-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                                            />
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Statut */}
                                <div className="lg:col-span-1">
                                    <Card className="border border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-lg hover:shadow-xl transition-all duration-300">
                                        <CardContent className="p-6">
                                            <Label className="text-gray-900 dark:text-white font-semibold mb-3 block">
                                                Statut de publication
                                            </Label>
                                            <Select
                                                value={product.status}
                                                onValueChange={(value) => handleChange("status", value as PublicationStatus)}
                                            >
                                                <SelectTrigger className="w-full p-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200">
                                                    <SelectValue placeholder="Choisissez un statut" />
                                                </SelectTrigger>
                                                <SelectContent className="dark:bg-gray-700 dark:text-white rounded-xl border border-gray-200 dark:border-gray-600">
                                                    <SelectItem value="DRAFT" className="rounded-lg">
                                                        <div className="flex items-center">
                                                            <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                                                            Brouillon
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="PUBLISHED" className="rounded-lg">
                                                        <div className="flex items-center">
                                                            <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                                                            Publié
                                                        </div>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>

                            {/* Description avec design moderne */}
                            <Card className="border border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-lg hover:shadow-xl transition-all duration-300">
                                <CardContent className="p-6">
                                    <Label className="text-gray-900 dark:text-white font-semibold mb-3 block">
                                        Description du produit <span className="text-red-500">*</span>
                                    </Label>
                                    <Textarea
                                        placeholder="Décrivez votre produit en détail : matériaux, utilisation, avantages..."
                                        value={product.description}
                                        onChange={(e) => handleChange("description", e.target.value)}
                                        className="w-full p-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 min-h-[120px] resize-none"
                                        rows={5}
                                    />
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                            Une description détaillée aide vos clients à mieux comprendre votre produit
                                        </span>
                                        <span className="text-sm text-gray-400 dark:text-gray-500">
                                            {product.description.length}/500
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Étape 2: Caractéristiques */}
                    {activeStep === 1 && (
                        <div className="space-y-8">
                            {/* Header de l'étape */}
                            <div className="text-center">
                                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                                    <Check className="h-6 w-6 text-white" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Caractéristiques du produit</h2>
                                <p className="text-gray-600 dark:text-gray-400">Définissez les catégories, tailles et options disponibles</p>
                            </div>

                            {/* Grille pour catégories et caractéristiques */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Sélection de catégorie et sous-catégorie */}
                                <Card className="border border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-lg hover:shadow-xl transition-all duration-300">
                                    <CardContent className="p-6">
                                        <CategorySelector
                                            categories={availableCategories}
                                            selectedCategoryId={product.categoryId || undefined}
                                            selectedSubcategoryId={product.subcategoryId || undefined}
                                            onCategoryChange={handleCategoryChange}
                                            onSubcategoryChange={handleSubcategoryChange}
                                            placeholder="Choisissez une catégorie"
                                            required={true}
                                        />
                                    </CardContent>
                                </Card>

                                {/* Autres caractéristiques */}
                                <Card className="border border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-lg hover:shadow-xl transition-all duration-300">
                                    <CardContent className="p-6">
                                        <ProductCharacteristics
                                            product={product}
                                            availableCategories={[]} // Ne pas passer les catégories car nous utilisons le nouveau sélecteur
                                            availableDesigns={availableDesigns}
                                            availableSizes={availableSizes}
                                            availableColors={availableColors}
                                            handleChange={handleChange}
                                            toggleSize={toggleSize}
                                            toggleColor={toggleColor}
                                            addCustomColor={addCustomColor}
                                            customColors={customColors}
                                            showCustomColorPicker={showCustomColorPicker}
                                            customColor={customColor}
                                            setCustomColor={setCustomColor}
                                            setShowCustomColorPicker={setShowCustomColorPicker}
                                            saveCustomColor={saveCustomColor}
                                            removeCustomColor={removeCustomColor}
                                            toggleCustomColor={toggleCustomColor}
                                            handleStandardColorImageUpload={handleStandardColorImageUpload}
                                            removeColorImage={removeColorImage}
                                            handleCustomColorImageUpload={handleCustomColorImageUpload}
                                            removeCustomColorImage={removeCustomColorImage}
                                            getContrastYIQ={getContrastYIQ}
                                        />
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}

                    {/* Étape 3: Images & Vues */}
                     {activeStep === 2 && (
                         <div className="space-y-8">
                             {/* Header de l'étape */}
                             <div className="text-center">
                                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                                    <FileImage className="h-6 w-6 text-white" />
                                 </div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Images & Vues</h2>
                                <p className="text-gray-600 dark:text-gray-400">Ajoutez les images et les vues de votre produit</p>
                             </div>

                            {/* Upload de design personnalisé */}
                                     <Card className="border border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-lg hover:shadow-xl transition-all duration-300">
                                         <CardContent className="p-6">
                                             <Label className="text-gray-900 dark:text-white font-semibold mb-3 block">
                                        Design personnalisé
                                             </Label>
                                    <div className="flex items-center space-x-4">
                                        <input
                                            ref={designFileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="hidden"
                                        />
                                        <Button
                                            type="button"
                                            onClick={() => designFileInputRef.current?.click()}
                                            className="flex items-center space-x-2"
                                        >
                                            <Upload className="w-4 h-4" />
                                            <span>Choisir une image</span>
                                        </Button>
                                        {imagePreview && (
                                            <div className="flex items-center space-x-2">
                                                <img
                                                    src={imagePreview}
                                                    alt="Aperçu du design"
                                                    className="w-16 h-16 object-cover rounded-lg border"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setImagePreview(null);
                                                        handleChange('designImages', []);
                                                        handleChange('customDesign', undefined);
                                                    }}
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                 </div>
                                        )}
                                    </div>
                                    {uploadError && (
                                        <p className="text-red-500 text-sm mt-2">{uploadError}</p>
                                    )}
                                         </CardContent>
                                     </Card>

                            {/* Grille pour les autres vues */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {availableViews.map(viewType => (
                                    <Card key={viewType} className="border border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-lg hover:shadow-xl transition-all duration-300">
                                         <CardContent className="p-6">
                                             <Label className="text-gray-900 dark:text-white font-semibold mb-3 block">
                                                {viewTypeLabels[viewType]}
                                             </Label>
                                            <Input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleViewImageUpload(viewType, e)}
                                                className="w-full p-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                                            />
                                         </CardContent>
                                     </Card>
                                ))}
                             </div>
                         </div>
                     )}

                    {/* Étape 4: Zones de personnalisation */}
                     {activeStep === 3 && (
                         <div className="space-y-8">
                             {/* Header de l'étape */}
                             <div className="text-center">
                                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                                    <Target className="h-6 w-6 text-white" />
                                 </div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Zones de personnalisation</h2>
                                <p className="text-gray-600 dark:text-gray-400">Définissez les zones où vos clients pourront ajouter leurs personnalisations</p>
                             </div>

                            {/* Gestion des délimitations */}
                            {product.views.length > 0 ? (
                                <div className="space-y-8">
                                    <div className="text-center border-b pb-4">
                                        <h3 className="text-xl font-semibold text-gray-900">
                                            🎯 Éditeur de Zones de Personnalisation
                                        </h3>
                                        <p className="text-gray-600 mt-2">
                                            Définissez les zones où vos clients pourront ajouter leurs designs
                                        </p>
                                 </div>

                                    {product.views.map((view, index) => (
                                        <div key={`${view.viewType}-${index}`} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                                        <h4 className="text-lg font-semibold text-gray-900">
                                                            Vue {view.viewType} {index + 1}
                                                        </h4>
                                 </div>
                                                    <Badge variant="outline" className="bg-white">
                                                        Image {index + 1}
                                                    </Badge>
                                 </div>
                                 </div>

                                            <div className="h-[700px]">
                                                <ProDelimitationEditor
                                                    imageUrl={view.imageUrl}
                                                    imageId={view.imageId || index + 1}
                                                    initialDelimitations={product.delimitations[view.viewType] || []}
                                                    onDelimitationsChange={(delimitations) => {
                                                        handleDelimitationsChange(view.viewType, delimitations);
                                                    }}
                                                    className="h-full"
                                                />
                                 </div>
                                 </div>
                                    ))}
                                </div>
                            ) : (
                                <Card className="border border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-lg">
                                    <CardContent className="p-12 text-center">
                                        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <FileImage className="h-8 w-8 text-gray-400" />
                                 </div>
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                            Aucune image disponible
                                        </h3>
                                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                                            Veuillez d'abord ajouter des images à votre produit dans l'étape précédente pour pouvoir définir des zones de personnalisation.
                                        </p>
                                        <Button
                                            onClick={() => setActiveStep(2)}
                                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                                        >
                                            <FileImage className="h-4 w-4 mr-2" />
                                            Ajouter des images
                                        </Button>
                                         </CardContent>
                                     </Card>
                            )}
                         </div>
                     )}

                     {/* Étape 5: Prévisualisation */}
                     {activeStep === 4 && (
                         <div className="space-y-8">
                             {/* Header de l'étape */}
                             <div className="text-center">
                                 <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                                     <Eye className="h-6 w-6 text-white" />
                                 </div>
                                 <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Prévisualisation</h2>
                                 <p className="text-gray-600 dark:text-gray-400">Vérifiez toutes les informations avant de publier votre produit</p>
                             </div>

                             {/* Prévisualisation moderne */}
                             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                 {/* Informations du produit */}
                                 <Card className="border border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-lg">
                                     <CardContent className="p-6">
                                         <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{product.name || "Nom du produit"}</h3>
                                         <div className="space-y-4">
                                             <div className="flex justify-between items-center">
                                                 <span className="text-gray-600 dark:text-gray-400">Prix:</span>
                                                 <span className="font-bold text-gray-900 dark:text-white">{formatPrice(product.price)}</span>
                                             </div>
                                             <div className="flex justify-between items-center">
                                                 <span className="text-gray-600 dark:text-gray-400">Stock:</span>
                                                 <span className="text-gray-900 dark:text-white">{product.stock} unités</span>
                                             </div>
                                             <div className="flex justify-between items-center">
                                                 <span className="text-gray-600 dark:text-gray-400">Statut:</span>
                                                 <Badge variant={product.status === "PUBLISHED" ? "default" : "secondary"}>
                                                     {product.status === "PUBLISHED" ? "Publié" : "Brouillon"}
                                                 </Badge>
                                             </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600 dark:text-gray-400">Zones de personnalisation:</span>
                                                <span className="text-gray-900 dark:text-white">
                                                    {Object.values(product.delimitations).flat().length} zones
                                                </span>
                                             </div>
                                         </div>
                                         <div className="mt-6">
                                             <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Description</h4>
                                             <p className="text-gray-600 dark:text-gray-400 text-sm">{product.description || "Aucune description"}</p>
                                         </div>
                                     </CardContent>
                                 </Card>

                                 {/* Aperçu visuel */}
                                 <Card className="border border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-lg">
                                     <CardContent className="p-6">
                                         <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Aperçu du produit</h3>
                                         <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
                                             {product.views.length > 0 ? (
                                                 <img
                                                     src={product.views[0].imageUrl}
                                                     alt="Aperçu du produit"
                                                     className="w-full h-full object-contain rounded-xl"
                                                 />
                                             ) : (
                                                 <div className="text-center">
                                                     <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                                                         <Upload className="h-8 w-8 text-gray-400" />
                                                     </div>
                                                     <p className="text-gray-500 dark:text-gray-400">Aucune image de produit</p>
                                                 </div>
                                             )}
                                         </div>
                                     </CardContent>
                                 </Card>
                             </div>
                         </div>
                     )}
                  </div>

                  {/* Actions modernisées */}
                  <div className="flex justify-between items-center pt-8">
                      <Button
                          variant="outline"
                          onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                          disabled={activeStep === 0}
                          className="px-8 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 rounded-xl font-medium"
                      >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                          Précédent
                      </Button>

                      {activeStep < steps.length - 1 ? (
                          <Button
                              onClick={() => setActiveStep(activeStep + 1)}
                              disabled={!steps[activeStep].isCompleted}
                              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all duration-200 rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                          >
                              Suivant
                              <ChevronRight size={20} className="ml-2" />
                          </Button>
                      ) : (
                          <Button
                              onClick={handleSubmit}
                              disabled={isLoading}
                              className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white transition-all duration-200 rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                          >
                              {isLoading ? (
                                  <>
                                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                      Enregistrement...
                                  </>
                              ) : (
                                  <>
                                      <ShoppingCart className="mr-2 h-5 w-5" />
                                      Publier le produit
                                  </>
                              )}
                          </Button>
                      )}
                  </div>
              </div>
          </div>
      );
};
