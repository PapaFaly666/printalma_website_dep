import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ChevronRight, X } from "lucide-react";
import { subCategoriesService, SubCategory } from "../services/subCategoriesService";
import { categoriesService, Category } from "../services/categoriesService";

const CategoryTabs = () => {
    const [activeCategory, setActiveCategory] = useState<number | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAllModal, setShowAllModal] = useState(false);
    const navigate = useNavigate();

    const VISIBLE_LIMIT = 6;
    const visibleSubCategories = subCategories.slice(0, VISIBLE_LIMIT);
    const hiddenSubCategories = subCategories.slice(VISIBLE_LIMIT);

    // Charger les catégories et sous-catégories depuis l'API
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const [categoriesData, subCategoriesData] = await Promise.all([
                    categoriesService.getActiveCategories(),
                    subCategoriesService.getAllSubCategories()
                ]);
                setCategories(categoriesData);
                setSubCategories(subCategoriesData.filter(sub => sub.isActive)); // Ne montrer que les sous-catégories actives
                setError(null);
            } catch (err) {
                console.error('Erreur lors du chargement des données:', err);
                setError('Erreur lors du chargement des catégories');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

      const handleCategoryClick = (category?: Category, subCategory?: SubCategory) => {
        if (subCategory) {
            setActiveCategory(subCategory.id);
            // Rediriger vers la page de personnalisation des mockups admin
            navigate(`/customize-product?category=${subCategory.slug || subCategory.name}`);
            setShowAllModal(false); // Fermer le modal si ouvert
        } else if (category) {
            // Afficher tous les mockups admin de la catégorie pour personnalisation
            navigate(`/customize-product?category=${category.slug || category.name}`);
        }
    };

    // Affichage du chargement
    if (loading) {
        return (
            <div className="w-full bg-gray-50 border-b border-gray-200">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                        <h2 className="text-lg sm:text-xl font-medium text-gray-800">Je personnalise</h2>
                        <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                            <span className="text-sm text-gray-600">Chargement...</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Affichage d'erreur
    if (error) {
        return (
            <div className="w-full bg-gray-50 border-b border-gray-200">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                        <h2 className="text-lg sm:text-xl font-medium text-gray-800">Je personnalise</h2>
                        <span className="text-sm text-red-600">{error}</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="w-full bg-gray-50 border-b border-gray-200">
                {/* Container principal qui suit le pattern établi avec fond uniforme */}
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                        <h2 className="text-lg sm:text-xl font-medium text-gray-800">Je personnalise</h2>

                        <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
                            {visibleSubCategories.map((subCategory) => (
                                <button
                                    key={subCategory.id}
                                    onClick={() => handleCategoryClick(undefined, subCategory)}
                                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                                        activeCategory === subCategory.id
                                            ? "bg-blue-600 text-white shadow-md"
                                            : "bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900 border border-gray-300"
                                    }`}
                                    title={subCategory._count.products > 0
                                        ? `${subCategory.name} (${subCategory._count.products} produit${subCategory._count.products > 1 ? 's' : ''})`
                                        : subCategory.name}
                                >
                                    {subCategory.name}
                                </button>
                            ))}

                            {/* Bouton "Voir plus" si plus de 6 sous-catégories */}
                            {hiddenSubCategories.length > 0 && (
                                <button
                                    onClick={() => setShowAllModal(true)}
                                    className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 flex items-center gap-1"
                                    title={`Voir ${hiddenSubCategories.length} autres sous-catégories`}
                                >
                                    +{hiddenSubCategories.length}
                                    <ChevronRight className="w-3 h-3" />
                                </button>
                            )}
                        </div>

                        {subCategories.length === 0 && (
                            <span className="text-sm text-gray-500">Aucune sous-catégorie disponible</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal pour afficher toutes les sous-catégories */}
            {showAllModal && (
                <div className="fixed inset-0 z-50 flex">
                    {/* Overlay */}
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={() => setShowAllModal(false)}
                    />

                    {/* Modal */}
                    <div className="relative mx-auto w-full max-w-4xl bg-white shadow-2xl rounded-lg m-4 max-h-[80vh] flex flex-col">
                        {/* Header */}
                        <div className="px-6 py-4 border-b flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-900">
                                Autres sous-catégories ({hiddenSubCategories.length})
                            </h3>
                            <button
                                onClick={() => setShowAllModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {hiddenSubCategories.map((subCategory) => (
                                    <button
                                        key={subCategory.id}
                                        onClick={() => handleCategoryClick(undefined, subCategory)}
                                        className={`p-3 rounded-lg text-sm font-medium transition-all ${
                                            activeCategory === subCategory.id
                                                ? "bg-blue-600 text-white shadow-md"
                                                : "bg-gray-50 text-gray-700 hover:bg-gray-100 hover:text-gray-900 border border-gray-200"
                                        }`}
                                        title={subCategory._count.products > 0
                                        ? `${subCategory.name} (${subCategory._count.products} produit${subCategory._count.products > 1 ? 's' : ''})`
                                        : subCategory.name}
                                    >
                                        <div className="text-center">
                                            <div className="font-medium">{subCategory.name}</div>
                                            {subCategory._count.products > 0 && (
                                                <div className="text-xs opacity-75 mt-1">
                                                    {subCategory._count.products} produit{subCategory._count.products > 1 ? 's' : ''}
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default CategoryTabs;