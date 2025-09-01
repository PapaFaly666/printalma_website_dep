import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { categories } from "../data/categoriesData";

// Define an interface for the category object
interface Category {
    id: number;
    name: string;
}

const CategoryTabs = () => {
    const [activeCategory, setActiveCategory] = useState<number | null>(null);
    const navigate = useNavigate();

    const handleCategoryClick = (category: Category) => {
        setActiveCategory(category.id);

        // Rediriger vers la page des articles filtrés avec la catégorie sélectionnée
        navigate(`/filtered-articles?category=${category.name}`);
    };

    return (
        <div className="w-full bg-white py-4 sm:py-6 border-b border-gray-200 shadow-sm">
            {/* Container principal avec même padding que ArtistesSection */}
            <div className="w-full px-4 sm:px-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                    <h2 className="text-lg sm:text-xl font-medium text-gray-800">Je personnalise</h2>

                    <div className="flex flex-wrap gap-1 sm:gap-2">
                        {categories.map((category) => (
                            <button
                                key={category.id}
                                onClick={() => handleCategoryClick(category)}
                                className={`px-2 sm:px-4 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm transition-colors ${
                                    activeCategory === category.id
                                        ? "bg-gray-100 text-gray-900 font-medium"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                                }`}
                            >
                                {category.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CategoryTabs;