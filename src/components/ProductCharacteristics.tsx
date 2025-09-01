import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { Card, CardContent } from "../components/ui/card";
import { Plus, Check, X, Upload, Image as ImageIcon, Palette } from "lucide-react";
import { ScrollArea } from "../components/ui/scroll-area";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "../components/ui/tooltip";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "../components/ui/dialog";
import { cn } from "../lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Separator } from "../components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { Textarea } from "../components/ui/textarea";
import { useCategories } from "../contexts/CategoryContext";

// Définir les types et interfaces nécessaires
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

interface Category {
    id: number;
    name: string;
}

interface Design {
    id: number;
    name: string;
    imageUrl: string;
    description?: string;
}

interface Product {
    categoryId: number;
    designId: number | null;
    sizes: number[];
    colors: number[];
    customColors: number[];
    colorImages: { [key: number]: { url: string; file: File }[] };
    customColorImages: { [key: number]: { url: string; file: File }[] };
    customDesign?: {
        name: string;
        description: string;
        image?: string;
        base64Image?: string;
    };
    designImage?: File;
    designData?: {
        file: File;
        fileName: string;
        description: string;
        base64Image?: string;
    };
    designImagePreview?: string;
    designImages?: { url: string; file: File }[];
}

interface ProductCharacteristicsProps {
    product: Product;
    availableCategories?: Category[];
    availableDesigns: Design[];
    availableSizes: Size[];
    availableColors: Color[];
    handleChange: (field: string, value: any) => void;
    toggleSize: (sizeId: number) => void;
    toggleColor: (colorId: number) => void;
    addCustomColor: () => void;
    customColors: { name: string; hexCode: string }[];
    showCustomColorPicker: boolean;
    customColor: { name: string; hexCode: string };
    setCustomColor: React.Dispatch<React.SetStateAction<{ name: string; hexCode: string }>>;
    setShowCustomColorPicker: React.Dispatch<React.SetStateAction<boolean>>;
    saveCustomColor: () => void;
    removeCustomColor: (index: number) => void;
    toggleCustomColor: (index: number) => void;
    handleStandardColorImageUpload: (colorId: number, event: React.ChangeEvent<HTMLInputElement>) => void;
    removeColorImage: (colorId: number, imageIndex: number) => void;
    handleCustomColorImageUpload: (colorIndex: number, event: React.ChangeEvent<HTMLInputElement>) => void;
    removeCustomColorImage: (colorIndex: number, imageIndex: number) => void;
    getContrastYIQ: (hexcolor: string) => string;
}

const ProductCharacteristics: React.FC<ProductCharacteristicsProps> = ({
    product,
    availableCategories: propCategories,
    availableDesigns,
    availableSizes,
    availableColors,
    handleChange,
    toggleSize,
    toggleColor,
    addCustomColor,
    customColors,
    showCustomColorPicker,
    customColor,
    setCustomColor,
    setShowCustomColorPicker,
    saveCustomColor,
    removeCustomColor,
    toggleCustomColor,
    handleStandardColorImageUpload,
    removeColorImage,
    handleCustomColorImageUpload,
    removeCustomColorImage,
    getContrastYIQ,
}) => {
    // Récupérer les catégories du contexte global
    const { categories: contextCategories, loading: loadingCategories } = useCategories();
    
    // Utiliser les catégories du contexte si disponibles, sinon utiliser les props
    const availableCategories = contextCategories.length > 0 ? contextCategories : propCategories || [];
    
    // Initialiser la catégorie par défaut de manière plus robuste
    useEffect(() => {
        const isCategorySelectedAndValid = product.categoryId && availableCategories.some(c => c.id === product.categoryId);

        if (!loadingCategories && !isCategorySelectedAndValid && availableCategories.length > 0) {
            const defaultCategoryId = availableCategories[0].id;
            console.log(`✅ [DEBUG] Aucune catégorie valide sélectionnée. Initialisation par défaut sur ID: ${defaultCategoryId}`);
            handleChange("categoryId", defaultCategoryId);
        }
    }, [loadingCategories, availableCategories, product.categoryId, handleChange]);
    
    // Au moins une couleur doit être sélectionnée pour le produit, standard ou personnalisée
    // L'utilisateur a le choix entre les couleurs prédéfinies et ses propres couleurs personnalisées
    const [imageUrl, setImageUrl] = useState<string | null>(product.designImagePreview || null);
    const [showImageUploadDialog, setShowImageUploadDialog] = useState(false);
    const [currentColorId, setCurrentColorId] = useState<number | null>(null);
    const [currentColorIndex, setCurrentColorIndex] = useState<number | null>(null);
    const [isCustomColor, setIsCustomColor] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [showDesignImageDialog, setShowDesignImageDialog] = useState(false);
    
    // Référence pour garder une trace des URL créées afin d'éviter les fuites de mémoire
    const createdObjectURLs = useRef<string[]>([]);
    
    // Fonction pour créer des URLs d'objet de manière sécurisée
    const createSafeObjectURL = useCallback((file: File): string => {
        if (!file) return '';
        
        const url = URL.createObjectURL(file);
        createdObjectURLs.current.push(url);
        return url;
    }, []);
    
    // Nettoyer toutes les URLs créées quand le composant est démonté
    useEffect(() => {
        return () => {
            createdObjectURLs.current.forEach(url => {
                try {
                    URL.revokeObjectURL(url);
                    console.log("🧹 URL libérée:", url);
                } catch (e) {
                    console.warn("⚠️ Erreur lors de la libération de l'URL:", e);
                }
            });
        };
    }, []);
    
    // Use callback refs instead of direct ref assignments to fix TypeScript errors
    const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});
    const customFileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});
    const designFileInputRef = useRef<HTMLInputElement | null>(null);
    const dialogFileInputRef = useRef<HTMLInputElement | null>(null);
    const designImageDialogRef = useRef<HTMLInputElement | null>(null);
    
    const setFileInputRef = useCallback((element: HTMLInputElement | null, id: number) => {
        fileInputRefs.current[id] = element;
    }, []);
    
    const setCustomFileInputRef = useCallback((element: HTMLInputElement | null, id: number) => {
        customFileInputRefs.current[id] = element;
    }, []);

    // Toujours utiliser l'option "new" (création d'un nouveau design personnalisé)
    useEffect(() => {
        // S'assurer que designId est toujours null (nous utilisons uniquement le design personnalisé)
        handleChange('designId', null);
    }, []);

    // Récupérer l'URL de prévisualisation du design depuis le state du produit
    useEffect(() => {
        if (product.designImagePreview && !imageUrl) {
            setImageUrl(product.designImagePreview);
            console.log("🔄 Récupération de l'URL de prévisualisation du design depuis le state du produit", product.designImagePreview);
        }
    }, [product.designImagePreview, imageUrl]);

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Convertir l'image en BASE64 pour une persistance garantie entre les étapes
            const reader = new FileReader();
            reader.onload = (e) => {
                const base64Image = e.target?.result as string;
                
                // Stocker l'URL base64 dans l'état local pour affichage immédiat
                setImageUrl(base64Image);
                
                // Utiliser un nom de fichier UNIQUE avec timestamp pour éviter les conflits
                const timestamp = Date.now();
                const randomNum = Math.floor(Math.random() * 1000);
                const fileExtension = file.name.split('.').pop() || 'jpg';
                const designFileName = `design_${timestamp}_${randomNum}.${fileExtension}`;
                
                // Créer un objet customDesign complet
                const customDesign = {
                    name: product.customDesign?.name || file.name.split('.')[0] || 'Design personnalisé',
                    description: product.customDesign?.description || `Design personnalisé créé à partir de ${file.name}`,
                    image: designFileName,
                    // Stocker l'image base64 directement dans l'objet customDesign pour persistance garantie
                    base64Image: base64Image
                };
                
                // Stocker le fichier et les informations associées
                handleChange('customDesign', customDesign);
                handleChange('designImage', file);
                handleChange('designImagePreview', base64Image);
                
                // Créer également un objet pour designImages
                const designImage = {
                    url: base64Image,
                    file: file
                };
                handleChange('designImages', [designImage]); // Tableau avec une seule image
                
                // Ajouter également les données du design au format attendu par le backend
                const designData = {
                    file: file,
                    fileName: designFileName,
                    description: customDesign.description,
                    base64Image: base64Image // Stocker également l'image base64 ici
                };
                
                handleChange('designData', designData);
                
                // S'assurer que les variables design et designId sont nulles pour éviter la confusion
                handleChange('design', null);
                handleChange('designId', null);
                
                // Logguer les informations
                console.log("✅ Image de design convertie en base64 et stockée avec succès");
                console.log("🔍 Nom de fichier pour Cloudinary:", designFileName);
                console.log("📄 Taille de l'image:", Math.round(file.size/1024), "KB");
                console.log("🔄 Design ajouté aux données du produit sous plusieurs formats pour maximiser la compatibilité");
            };
            
            // Déclencher la conversion en base64
            reader.readAsDataURL(file);
        }
    };

    // Nouvelle fonction pour gérer l'upload via la popup similaire aux couleurs
    const handleDesignImageUploadViaDialog = (event: React.ChangeEvent<HTMLInputElement>) => {
        handleImageUpload(event);
        setShowDesignImageDialog(false);
    };

    // Ajoutons une vérification pour s'assurer que l'image ne se perd pas entre les étapes
    useEffect(() => {
        // Si nous avons une image locale mais pas dans le state du produit, récupérons-la
        if (imageUrl && !product.designImage && !product.designImages?.length && !product.designImagePreview) {
            console.log("⚠️ RÉCUPÉRATION: Image locale présente mais absente du produit, restauration en cours");
            
            // Tentons de restaurer l'image à partir de l'URL base64
            if (imageUrl.startsWith('data:')) {
                console.log("✅ Restauration de l'image du design depuis l'URL base64 locale");
                
                // Créer un nom de fichier temporaire
                const timestamp = Date.now();
                const designFileName = `design_${timestamp}_restored.jpg`;
                
                // Mettre à jour le preview dans le produit
                handleChange('designImagePreview', imageUrl);
                
                // Si nous avons customDesign mais sans image, ajoutons l'image
                if (product.customDesign && !product.customDesign.base64Image) {
                    const updatedCustomDesign = {
                        ...product.customDesign,
                        image: designFileName,
                        base64Image: imageUrl
                    };
                    handleChange('customDesign', updatedCustomDesign);
                    console.log("✅ Image ajoutée au customDesign existant");
                } else if (!product.customDesign) {
                    // Créer un nouveau customDesign si nécessaire
                    const customDesign = {
                        name: 'Design personnalisé',
                        description: 'Design restauré automatiquement',
                        image: designFileName,
                        base64Image: imageUrl
                    };
                    handleChange('customDesign', customDesign);
                    console.log("✅ Nouveau customDesign créé avec l'image restaurée");
                }
            }
        }
    }, [imageUrl, product.designImage, product.designImages, product.designImagePreview, product.customDesign, handleChange]);

    // Fonction similaire à handleDrop mais pour les design images
    const handleDesignImageDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            // Create a synthetic event
            const syntheticEvent = {
                target: { files }
            } as unknown as React.ChangeEvent<HTMLInputElement>;
            handleImageUpload(syntheticEvent);
            setShowDesignImageDialog(false);
        }
    };

    const openImageUploadDialog = (colorId: number, isCustom: boolean = false, colorIdx?: number) => {
        setCurrentColorId(colorId);
        setIsCustomColor(isCustom);
        if (isCustom && colorIdx !== undefined) {
            setCurrentColorIndex(colorIdx);
        }
        setShowImageUploadDialog(true);
    };

    const handleDialogImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (isCustomColor && currentColorIndex !== null) {
            handleCustomColorImageUpload(currentColorIndex, event);
        } else if (currentColorId !== null) {
            handleStandardColorImageUpload(currentColorId, event);
        }
        setShowImageUploadDialog(false);
    };

    const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            if (isCustomColor && currentColorIndex !== null) {
                // Create a synthetic event
                const syntheticEvent = {
                    target: { files }
                } as unknown as React.ChangeEvent<HTMLInputElement>;
                handleCustomColorImageUpload(currentColorIndex, syntheticEvent);
            } else if (currentColorId !== null) {
                const syntheticEvent = {
                    target: { files }
                } as unknown as React.ChangeEvent<HTMLInputElement>;
                handleStandardColorImageUpload(currentColorId, syntheticEvent);
            }
            setShowImageUploadDialog(false);
        }
    };

    const ensureColorImagesExist = (colorId: number) => {
        if (!product.colorImages[colorId]) {
            return [];
        }
        return product.colorImages[colorId];
    };

    const ensureCustomColorImagesExist = (colorIndex: number) => {
        if (!product.customColorImages[colorIndex]) {
            return [];
        }
        return product.customColorImages[colorIndex];
    };

    const getMainColorImage = (colorId: number) => {
        const images = ensureColorImagesExist(colorId);
        return images.length > 0 ? images[0].url : null;
    };

    const getMainCustomColorImage = (colorIndex: number) => {
        const images = ensureCustomColorImagesExist(colorIndex);
        return images.length > 0 ? images[0].url : null;
    };

    const getColorName = (colorId: number | null) => {
        if (colorId === null) return "";
        if (isCustomColor && currentColorIndex !== null) {
            return customColors[currentColorIndex]?.name || "";
        }
        return availableColors.find(c => c.id === colorId)?.name || "";
    };

    // Modifions la fonction verifyDesignData pour supprimer les références à designOption
    const verifyDesignData = () => {
        console.log("🔍 Vérification des données de design avant soumission:");
        
        // Vérifier si une image a été sélectionnée via le fileInputRef
        const hasDesignImage = designFileInputRef.current && 
                               designFileInputRef.current.files && 
                               designFileInputRef.current.files.length > 0;
        
        // Vérifier si nous avons déjà une image via l'état
        const hasDesignImageInState = Boolean(product.designImage);
        
        console.log("📊 Statut du design:", {
            designId: product.designId,
            hasCustomDesign: Boolean(product.customDesign),
            hasDesignImage: hasDesignImageInState,
            hasDesignImageInRef: hasDesignImage,
            colorsSelected: product.colors.length + product.customColors.length
        });
        
        // Si nous avons un design personnalisé
        if ((hasDesignImage || hasDesignImageInState) && !product.customDesign) {
            // On a une image mais pas de customDesign, créer un customDesign simple
            const DESIGN_IMAGE_NAME = "design_image.jpg";
            const designFile = hasDesignImage && designFileInputRef.current?.files ? 
                designFileInputRef.current.files[0] : product.designImage;
            
            if (designFile) {
                // Créer un customDesign
                handleChange('customDesign', {
                    name: "Design personnalisé",
                    description: "Design créé automatiquement",
                    image: DESIGN_IMAGE_NAME
                });
                
                console.log("✅ customDesign créé automatiquement avec nom d'image fixe:", DESIGN_IMAGE_NAME);
            }
        }
        // Si on a un customDesign mais pas de champ image, ajouter un champ image
        else if (product.customDesign && !product.customDesign.image && (hasDesignImage || hasDesignImageInState)) {
            const DESIGN_IMAGE_NAME = "design_image.jpg";
            handleChange('customDesign', {
                ...product.customDesign,
                image: DESIGN_IMAGE_NAME
            });
            console.log("✅ Champ image ajouté au customDesign existant:", DESIGN_IMAGE_NAME);
        }
        
        return Boolean(product.designImage || hasDesignImage);
    };

    return (
        <Card className="bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 shadow-sm">
            <CardContent className="p-6">
                <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-gray-50">Caractéristiques du produit</h2>

                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-6">
                        <TabsTrigger value="general">Général</TabsTrigger>
                        <TabsTrigger value="colors">Couleurs</TabsTrigger>
                        <TabsTrigger value="sizes">Tailles</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="general" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Catégorie */}
                            <div className="space-y-4">
                                <Label className="text-gray-900 dark:text-white">Catégorie</Label>
                                <Select
                                    value={product.categoryId ? product.categoryId.toString() : ""}
                                    onValueChange={(value) => handleChange("categoryId", parseInt(value, 10))}
                                >
                                    <SelectTrigger className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                        <SelectValue placeholder="Sélectionner une catégorie" />
                                    </SelectTrigger>
                                    <SelectContent className="dark:bg-gray-700 dark:text-white">
                                        <SelectItem value="0">Sélectionner une catégorie</SelectItem>
                                        {loadingCategories ? (
                                            <SelectItem value="loading" disabled>Chargement des catégories...</SelectItem>
                                        ) : (
                                            availableCategories.map((category) => (
                                                <SelectItem key={category.id} value={category.id?.toString() || '0'}>
                                                    {category.name}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Design */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label className="text-gray-900 dark:text-white">Design du produit</Label>
                                </div>
                                
                                {/* Option unique: Nouveau design personnalisé */}
                                <div className="space-y-4 mb-4">
                                    <div 
                                        className="flex items-start p-3 rounded-md transition-colors bg-black/5 dark:bg-white/10 border border-gray-300 dark:border-gray-600"
                                    >
                                        <div className="ml-3 flex-grow">
                                            <label className="font-medium text-gray-900 dark:text-white">
                                                Design personnalisé
                                            </label>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                                                Téléchargez une image et décrivez votre design
                                            </p>
                                            
                                            <div className="mt-2 space-y-3">
                                                <div>
                                                    <Label htmlFor="design-name" className="text-sm text-gray-700 dark:text-gray-300">Nom du design</Label>
                                                    <Input
                                                        id="design-name"
                                                        placeholder="Ex: Logo de la marque"
                                                        value={product.customDesign?.name || ''}
                                                        onChange={(e) => {
                                                            const updatedCustomDesign = {
                                                                ...(product.customDesign || {}),
                                                                name: e.target.value
                                                            };
                                                            handleChange('customDesign', updatedCustomDesign);
                                                        }}
                                                        className="mt-1"
                                                    />
                                                </div>

                                                <div>
                                                    <Label htmlFor="design-description" className="text-sm text-gray-700 dark:text-gray-300">Description (optionnelle)</Label>
                                                    <Textarea
                                                        id="design-description"
                                                        placeholder="Décrivez votre design..."
                                                        value={product.customDesign?.description || ''}
                                                        onChange={(e) => {
                                                            const updatedCustomDesign = {
                                                                ...(product.customDesign || {}),
                                                                description: e.target.value
                                                            };
                                                            handleChange('customDesign', updatedCustomDesign);
                                                        }}
                                                        className="mt-1 resize-none"
                                                        rows={2}
                                                    />
                                                </div>
                                                    
                                                <div>
                                                    <Label className="text-sm text-gray-700 dark:text-gray-300">Image du design</Label>
                                                    
                                                    {/* Option 1: Bouton direct avec style amélioré */}
                                                    <Button
                                                        onClick={() => setShowDesignImageDialog(true)}
                                                        className="w-full h-auto mt-1 py-6 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                                        variant="ghost"
                                                    >
                                                        {imageUrl ? (
                                                            <div className="flex flex-col items-center">
                                                                <div className="w-32 h-32 rounded-md overflow-hidden bg-white dark:bg-gray-700 mb-3">
                                                                    <img 
                                                                        src={imageUrl}
                                                                        alt="Design preview" 
                                                                        className="w-full h-full object-contain"
                                                                        onLoad={() => console.log("✅ Image de design chargée avec succès")}
                                                                        onError={(e) => console.error("❌ Erreur de chargement de l'image de design:", e)}
                                                                    />
                                                                </div>
                                                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                                                    Cliquez pour changer l'image
                                                                </span>
                                                                <span className="text-xs text-emerald-500 mt-1">
                                                                    Image sélectionnée
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col items-center">
                                                                <Upload className="h-10 w-10 text-gray-400 dark:text-gray-500 mb-2" />
                                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                    Cliquez pour télécharger une image
                                                                </span>
                                                                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                                    PNG, JPG, GIF jusqu'à 10MB
                                                                </span>
                                                            </div>
                                                        )}
                                                    </Button>
                                                    
                                                    {/* Input file caché pour compatibilité */}
                                                    <input
                                                        type="file"
                                                        ref={designFileInputRef}
                                                        onChange={handleImageUpload}
                                                        accept="image/*"
                                                        className="hidden"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                    
                    <TabsContent value="colors" className="space-y-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Couleurs disponibles</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Sélectionnez les couleurs disponibles pour ce produit
                                </p>
                            </div>
                            <Button
                                onClick={addCustomColor}
                                className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white dark:border-gray-700 h-9"
                            >
                                <Plus size={16} className="mr-2" />
                                Ajouter une couleur
                            </Button>
                        </div>
                        
                        <Separator className="my-4" />
                        
                        {/* Couleurs prédéfinies avec nouveau design */}
                        <div className="space-y-1">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Couleurs standards
                                <span className="ml-2 text-xs text-red-500 dark:text-red-400 font-normal">
                                    (Au moins une couleur requise)
                                </span>
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                Sélectionnez une ou plusieurs couleurs disponibles pour ce produit
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mt-2">
                                {availableColors.map((color) => {
                                    const mainImage = getMainColorImage(color.id);
                                    const hasImages = ensureColorImagesExist(color.id).length > 0;
                                    const isSelected = product.colors.includes(color.id);

                                    return (
                                        <div
                                            key={color.id}
                                            className={cn(
                                                "relative group rounded-md overflow-hidden transition-all duration-200",
                                                isSelected 
                                                    ? "ring-2 ring-gray-900 dark:ring-gray-100 ring-offset-2 ring-offset-white dark:ring-offset-gray-950" 
                                                    : "ring-1 ring-gray-200 dark:ring-gray-800 hover:ring-gray-300 dark:hover:ring-gray-700"
                                            )}
                                        >
                                            <div 
                                                className="aspect-square w-full relative cursor-pointer"
                                                onClick={() => toggleColor(color.id)}
                                            >
                                                {mainImage ? (
                                                    <img
                                                        src={mainImage}
                                                        alt={color.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div
                                                        className="w-full h-full flex items-center justify-center"
                                                        style={{ backgroundColor: color.hexCode || "#e2e2e2" }}
                                                    >
                                                        <span className="text-xs font-medium" style={{ color: getContrastYIQ(color.hexCode || "#e2e2e2") }}>
                                                            {color.name.substring(0, 2).toUpperCase()}
                                                        </span>
                                                    </div>
                                                )}
                                                
                                                {/* Overlay avec action rapide */}
                                                <div className={cn(
                                                    "absolute inset-0 flex flex-col justify-between p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity",
                                                    isSelected && "opacity-100"
                                                )}>
                                                    <div className="self-end">
                                                        {isSelected && (
                                                            <div className="bg-white rounded-full p-1 shadow-md">
                                                                <Check size={14} className="text-gray-900" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex justify-between items-end">
                                                        <span className="text-xs font-medium text-white">{hasImages ? `${ensureColorImagesExist(color.id).length} image(s)` : ""}</span>
                                                        {isSelected && (
                                                            <Button 
                                                                size="sm" 
                                                                variant="secondary"
                                                                className="h-7 w-7 p-0 bg-white/90 hover:bg-white text-gray-900"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    openImageUploadDialog(color.id);
                                                                }}
                                                            >
                                                                <Upload size={12} />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Footer avec nom et actions */}
                                            <div className="p-2 bg-white dark:bg-gray-900 flex justify-between items-center">
                                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                                                    {color.name}
                                                </span>
                                                
                                                {isSelected && (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                                                <MoreHorizontal size={14} />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => openImageUploadDialog(color.id)}>
                                                                Gérer les images
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        
                        {/* Couleurs personnalisées avec nouveau design */}
                        {customColors.length > 0 && (
                            <div className="space-y-1 mt-8">
                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Couleurs personnalisées
                                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 font-normal">
                                        (alternative aux couleurs standards)
                                    </span>
                                </h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                    Vous pouvez utiliser ces couleurs en plus ou à la place des couleurs standards
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mt-2">
                                    {customColors.map((color, index) => {
                                        const mainImage = getMainCustomColorImage(index);
                                        const hasImages = ensureCustomColorImagesExist(index).length > 0;
                                        const isSelected = product.customColors.includes(index);
                                        const textColor = color.hexCode ? getContrastYIQ(color.hexCode) : "text-black";

                                        return (
                                            <div
                                                key={`custom-${index}`}
                                                className={cn(
                                                    "relative group rounded-md overflow-hidden transition-all duration-200",
                                                    isSelected 
                                                        ? "ring-2 ring-gray-900 dark:ring-gray-100 ring-offset-2 ring-offset-white dark:ring-offset-gray-950" 
                                                        : "ring-1 ring-gray-200 dark:ring-gray-800 hover:ring-gray-300 dark:hover:ring-gray-700"
                                                )}
                                            >
                                                {/* Bouton supprimer */}
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    className="absolute top-2 right-2 h-6 w-6 p-0 rounded-full z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeCustomColor(index);
                                                    }}
                                                >
                                                    <X size={12} />
                                                </Button>
                                                
                                                <div 
                                                    className="aspect-square w-full relative cursor-pointer"
                                                    onClick={() => toggleCustomColor(index)}
                                                >
                                                    {mainImage ? (
                                                        <img
                                                            src={mainImage}
                                                            alt={color.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div
                                                            className="w-full h-full flex items-center justify-center"
                                                            style={{ backgroundColor: color.hexCode }}
                                                        >
                                                            <span className={`text-sm font-medium ${textColor}`}>
                                                                {color.name.substring(0, 2).toUpperCase()}
                                                            </span>
                                                        </div>
                                                    )}
                                                    
                                                    {/* Overlay avec action rapide */}
                                                    <div className={cn(
                                                        "absolute inset-0 flex flex-col justify-between p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity",
                                                        isSelected && "opacity-100"
                                                    )}>
                                                        <div className="self-end">
                                                            {isSelected && (
                                                                <div className="bg-white rounded-full p-1 shadow-md">
                                                                    <Check size={14} className="text-gray-900" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex justify-between items-end">
                                                            <span className="text-xs font-medium text-white">{hasImages ? `${ensureCustomColorImagesExist(index).length} image(s)` : ""}</span>
                                                            {isSelected && (
                                                                <Button 
                                                                    size="sm" 
                                                                    variant="secondary"
                                                                    className="h-7 w-7 p-0 bg-white/90 hover:bg-white text-gray-900"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        openImageUploadDialog(index, true, index);
                                                                    }}
                                                                >
                                                                    <Upload size={12} />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* Footer avec nom et hex */}
                                                <div className="p-2 bg-white dark:bg-gray-900 flex justify-between items-center">
                                                    <div className="overflow-hidden">
                                                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate block">
                                                            {color.name}
                                                        </span>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400 truncate block">
                                                            {color.hexCode}
                                                        </span>
                                                    </div>
                                                    
                                                    {isSelected && (
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                                                    <MoreHorizontal size={14} />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={() => openImageUploadDialog(index, true, index)}>
                                                                    Gérer les images
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        
                        {/* Section couleur personnalisée - Modern UI */}
                        {showCustomColorPicker && (
                            <Card className="mt-6 border border-gray-200 dark:border-gray-800">
                                <CardContent className="p-4 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-medium text-gray-900 dark:text-gray-100">
                                            <span className="flex items-center gap-2">
                                                <Palette size={16} />
                                                Nouvelle couleur personnalisée
                                            </span>
                                        </h3>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setShowCustomColorPicker(false)}
                                            className="h-8 w-8 p-0"
                                        >
                                            <X size={16} />
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-sm">Nom de la couleur</Label>
                                            <Input
                                                value={customColor.name}
                                                onChange={(e) => setCustomColor({ ...customColor, name: e.target.value })}
                                                placeholder="ex: Noir Onyx"
                                                className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-sm">Code couleur</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    type="text"
                                                    value={customColor.hexCode}
                                                    onChange={(e) => setCustomColor({ ...customColor, hexCode: e.target.value })}
                                                    placeholder="#"
                                                    className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                                                />
                                                <div className="relative w-10 h-10 border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
                                                    <input
                                                        type="color"
                                                        value={customColor.hexCode}
                                                        onChange={(e) => setCustomColor({ ...customColor, hexCode: e.target.value })}
                                                        className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
                                                    />
                                                    <div
                                                        className="w-full h-full"
                                                        style={{ backgroundColor: customColor.hexCode || "#ffffff" }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-end">
                                            <Button
                                                onClick={saveCustomColor}
                                                className="w-full bg-gray-900 hover:bg-gray-800 text-white dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
                                                disabled={!customColor.name || !customColor.hexCode}
                                            >
                                                Ajouter cette couleur
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Aperçu */}
                                    <Card className="bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800">
                                        <CardContent className="p-4">
                                            <div className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Aperçu</div>
                                            <div className="flex items-center gap-4">
                                                <div
                                                    className="w-16 h-16 rounded-lg shadow-sm"
                                                    style={{ backgroundColor: customColor.hexCode || "#ffffff" }}
                                                ></div>
                                                <div>
                                                    <div className="font-medium text-gray-900 dark:text-gray-100">{customColor.name || "Sans nom"}</div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">{customColor.hexCode || "#"}</div>
                                                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                                        Cette couleur sera disponible pour vos produits
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>
                    
                    <TabsContent value="sizes" className="space-y-4">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Tailles disponibles</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Sélectionnez les tailles disponibles pour ce produit
                            </p>
                        </div>
                        
                        <Separator className="my-4" />
                        
                        <div className="flex flex-wrap gap-3">
                            {availableSizes.map((size) => {
                                const isSelected = product.sizes.includes(size.id);
                                
                                return (
                                    <div
                                        key={size.id}
                                        onClick={() => toggleSize(size.id)}
                                        className={cn(
                                            "h-10 min-w-10 px-3 flex items-center justify-center rounded-md cursor-pointer transition-all text-sm font-medium",
                                            isSelected 
                                                ? "bg-gray-900 text-white ring-2 ring-gray-900 ring-offset-2 ring-offset-white dark:bg-gray-100 dark:text-gray-900 dark:ring-gray-100 dark:ring-offset-gray-950" 
                                                : "bg-white text-gray-700 border border-gray-200 hover:border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                                        )}
                                    >
                                        {size.name}
                                    </div>
                                );
                            })}
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Image Upload Dialog - Modified for better UX */}
                <Dialog open={showImageUploadDialog} onOpenChange={setShowImageUploadDialog}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Upload size={18} className="text-gray-600 dark:text-gray-400" />
                                Images pour {getColorName(currentColorId)}
                            </DialogTitle>
                            <DialogDescription>
                                Téléchargez des images pour représenter cette couleur. Vous pouvez glisser-déposer des fichiers ou utiliser le sélecteur de fichiers.
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div 
                            className={cn(
                                "mt-4 h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-4 transition-colors cursor-pointer",
                                dragActive 
                                    ? "border-gray-400 bg-gray-100 dark:border-gray-500 dark:bg-gray-800" 
                                    : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/50"
                            )}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => dialogFileInputRef.current?.click()}
                        >
                            <div className={cn(
                                "w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4",
                                dragActive && "bg-gray-200 dark:bg-gray-700"
                            )}>
                                <Upload className={cn(
                                    "h-6 w-6 text-gray-500 dark:text-gray-400",
                                    dragActive && "text-gray-700 dark:text-gray-300"
                                )} />
                            </div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Glissez-déposez vos images ici
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                ou <span className="font-medium text-gray-900 dark:text-gray-100 hover:underline">parcourir vos fichiers</span>
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                Formats acceptés: PNG, JPG, WEBP (max. 5MB)
                            </p>
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                ref={dialogFileInputRef}
                                onChange={handleDialogImageUpload}
                                className="hidden"
                            />
                        </div>
                        
                        <div className="flex justify-between items-center mt-4">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Vous pouvez télécharger plusieurs images à la fois
                            </p>
                            <div className="flex gap-2">
                                <Button 
                                    variant="outline" 
                                    onClick={() => setShowImageUploadDialog(false)}
                                >
                                    Annuler
                                </Button>
                                <Button 
                                    onClick={() => dialogFileInputRef.current?.click()}
                                    className="bg-gray-900 text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
                                >
                                    Parcourir
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Design Image Upload Dialog */}
                <Dialog open={showDesignImageDialog} onOpenChange={setShowDesignImageDialog}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <ImageIcon size={18} className="text-gray-600 dark:text-gray-400" />
                                Image du design
                            </DialogTitle>
                            <DialogDescription>
                                Téléchargez une image pour votre design personnalisé. Vous pouvez glisser-déposer un fichier ou utiliser le sélecteur de fichiers.
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div 
                            className={cn(
                                "mt-4 h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-4 transition-colors cursor-pointer",
                                dragActive 
                                    ? "border-gray-400 bg-gray-100 dark:border-gray-500 dark:bg-gray-800" 
                                    : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/50"
                            )}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDesignImageDrop}
                            onClick={() => designImageDialogRef.current?.click()}
                        >
                            <div className={cn(
                                "w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4",
                                dragActive && "bg-gray-200 dark:bg-gray-700"
                            )}>
                                <ImageIcon className={cn(
                                    "h-6 w-6 text-gray-500 dark:text-gray-400",
                                    dragActive && "text-gray-700 dark:text-gray-300"
                                )} />
                            </div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Glissez-déposez votre image ici
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                ou <span className="font-medium text-gray-900 dark:text-gray-100 hover:underline">parcourir vos fichiers</span>
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                Formats acceptés: PNG, JPG, SVG (max. 10MB)
                            </p>
                            <input
                                type="file"
                                accept="image/*"
                                ref={designImageDialogRef}
                                onChange={handleDesignImageUploadViaDialog}
                                className="hidden"
                            />
                        </div>
                        
                        <div className="flex justify-between items-center mt-4">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Cette image représentera votre design
                            </p>
                            <div className="flex gap-2">
                                <Button 
                                    variant="outline" 
                                    onClick={() => setShowDesignImageDialog(false)}
                                >
                                    Annuler
                                </Button>
                                <Button 
                                    onClick={() => designImageDialogRef.current?.click()}
                                    className="bg-gray-900 text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
                                >
                                    Parcourir
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
};

export default ProductCharacteristics;
