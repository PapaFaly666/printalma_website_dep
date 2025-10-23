import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { subCategoriesService, SubCategory } from "../services/subCategoriesService";

const CategoryTabs = () => {
    const [activeCategory, setActiveCategory] = useState<number | null>(null);
    const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    // Charger les sous-catégories depuis l'API
    useEffect(() => {
        const loadSubCategories = async () => {
            try {
                setLoading(true);
                const data = await subCategoriesService.getAllSubCategories();
                setSubCategories(data.filter(sub => sub.isActive)); // Ne montrer que les sous-catégories actives
                setError(null);
            } catch (err) {
                console.error('Erreur lors du chargement des sous-catégories:', err);
                setError('Erreur lors du chargement des catégories');
            } finally {
                setLoading(false);
            }
        };

        loadSubCategories();
    }, []);

    const handleCategoryClick = (subCategory: SubCategory) => {
        setActiveCategory(subCategory.id);

        // Rediriger vers la page des articles filtrés avec la sous-catégorie sélectionnée
        navigate(`/filtered-articles?category=${subCategory.name}&subCategory=${subCategory.slug}`);
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
        <div className="w-full bg-gray-50 border-b border-gray-200">
            {/* Container principal qui suit le pattern établi avec fond uniforme */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                    <h2 className="text-lg sm:text-xl font-medium text-gray-800">Je personnalise</h2>

                    <div className="flex flex-wrap gap-1 sm:gap-2">
                        {subCategories.map((subCategory) => (
                            <button
                                key={subCategory.id}
                                onClick={() => handleCategoryClick(subCategory)}
                                className={`px-2 sm:px-4 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm transition-colors ${
                                    activeCategory === subCategory.id
                                        ? "bg-white text-gray-900 font-medium shadow-sm"
                                        : "text-gray-600 hover:bg-white hover:text-gray-800"
                                }`}
                                title={`${subCategory.name} (${subCategory._count.products} produit${subCategory._count.products > 1 ? 's' : ''})`}
                            >
                                {subCategory.name}
                            </button>
                        ))}
                    </div>

                    {subCategories.length === 0 && (
                        <span className="text-sm text-gray-500">Aucune sous-catégorie disponible</span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CategoryTabs;