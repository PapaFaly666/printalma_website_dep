import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { subCategoriesService, SubCategory } from "../services/subCategoriesService";
import { categoriesService, Category } from "../services/categoriesService";

const CategoryTabs = () => {
    const [activeCategory, setActiveCategory] = useState<number | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

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
        <div className="w-full bg-gray-50 border-b border-gray-200">
            {/* Container principal qui suit le pattern établi avec fond uniforme */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                    <h2 className="text-lg sm:text-xl font-medium text-gray-800">Je personnalise</h2>

                    <div className="flex flex-wrap gap-2 sm:gap-3">
                        {categories.map((category) => {
                            const categorySubCategories = subCategories.filter(sub => sub.categoryId === category.id);

                            return (
                                <div key={category.id} className="flex flex-wrap gap-1 sm:gap-2 items-center">
                                    {/* Catégorie principale */}
                                    <button
                                        onClick={() => handleCategoryClick(category)}
                                        className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                                            activeCategory === category.id
                                                ? "bg-blue-100 text-blue-900"
                                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                        }`}
                                        title={`${category.name} (${category._count?.products || 0} produit${(category._count?.products || 0) > 1 ? 's' : ''})`}
                                    >
                                        {category.name}
                                    </button>

                                    {/* Sous-catégories de cette catégorie */}
                                    {categorySubCategories.map((subCategory) => (
                                        <button
                                            key={subCategory.id}
                                            onClick={() => handleCategoryClick(category, subCategory)}
                                            className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm transition-colors ${
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
                            );
                        })}
                    </div>

                    {categories.length === 0 && (
                        <span className="text-sm text-gray-500">Aucune catégorie disponible</span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CategoryTabs;