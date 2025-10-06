
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// This component shows how the same design is available on different products
export const ProductVariants = () => {
  const [scrollPosition, setScrollPosition] = useState(0);
  
  // Sample product variants data - in a real app, this would come from your API
  const productVariants = [
    {
      id: '1',
      title: 'T-shirt Homme',
      price: '22,99 €',
      image: '/api/placeholder/220/260',
      category: 'hommes'
    },
    {
      id: '2',
      title: 'T-shirt premium Homme',
      price: '27,99 €',
      image: '/api/placeholder/220/260',
      category: 'hommes'
    },
    {
      id: '3',
      title: 'Sweat à capuche premium Homme',
      price: '49,99 €',
      image: '/api/placeholder/220/260',
      category: 'hommes'
    },
    {
      id: '4',
      title: 'T-shirt moulant Homme',
      price: '27,99 €',
      image: '/api/placeholder/220/260',
      category: 'hommes'
    },
    {
      id: '5',
      title: 'Sweat à capuche unisexe',
      price: '39,99 €',
      image: '/api/placeholder/220/260',
      category: 'unisexe'
    },
    {
      id: '6',
      title: 'T-shirt Femme',
      price: '22,99 €',
      image: '/api/placeholder/220/260',
      category: 'femmes'
    },
    {
      id: '7',
      title: 'Body Bébé',
      price: '19,99 €',
      image: '/api/placeholder/220/260',
      category: 'bebes'
    },
    {
      id: '8',
      title: 'Sticker',
      price: '3,99 €',
      image: '/api/placeholder/220/260',
      category: 'stickers'
    }
  ];

  // Category filter tabs
  const categories = [
    { name: 'Tous', slug: 'tous' },
    { name: 'Hommes', slug: 'hommes' },
    { name: 'Femmes', slug: 'femmes' },
    { name: 'Enfants', slug: 'enfants' },
    { name: 'Bébés', slug: 'bebes' },
    { name: 'Accessoires', slug: 'accessoires' },
    { name: 'Maison & décor', slug: 'maison' },
    { name: 'Stickers', slug: 'stickers' }
  ];

  const [activeCategory, setActiveCategory] = useState('tous');

  // Filter products by category
  const filteredProducts = activeCategory === 'tous' 
    ? productVariants 
    : productVariants.filter(product => product.category === activeCategory);

  // Scroll handlers
  const scrollLeft = () => {
    const container = document.getElementById('variantsContainer');
    if (container) {
      container.scrollBy({ left: -300, behavior: 'smooth' });
      setScrollPosition(Math.max(0, scrollPosition - 300));
    }
  };

  const scrollRight = () => {
    const container = document.getElementById('variantsContainer');
    if (container) {
      container.scrollBy({ left: 300, behavior: 'smooth' });
      setScrollPosition(scrollPosition + 300);
    }
  };

  // Check if scroll buttons should be shown
  const showLeftButton = scrollPosition > 0;
  const showRightButton = true; // Simplified for demo - in reality would check if there's more content to scroll

  return (
    <div className="mt-16 mb-12">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Ce design est aussi disponible sur d'autres produits</h2>
      
      {/* Category selector tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex overflow-x-auto no-scrollbar">
          {categories.map((category) => (
            <button
              key={category.slug}
              className={`whitespace-nowrap px-5 py-3 font-medium text-sm border-b-2 ${
                activeCategory === category.slug
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveCategory(category.slug)}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Products carousel */}
      <div className="relative">
        {/* Left scroll button */}
        {showLeftButton && (
          <button 
            onClick={scrollLeft}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 backdrop-blur-sm shadow-md rounded-full p-2 border border-gray-200"
            aria-label="Scroll left"
          >
            <ChevronLeft size={20} className="text-gray-700" />
          </button>
        )}
        
        {/* Products container */}
        <div 
          id="variantsContainer"
          className="flex overflow-x-auto gap-4 py-2 no-scrollbar scroll-smooth"
          style={{ scrollbarWidth: 'none' }}
        >
          {filteredProducts.map(product => (
            <div key={product.id} className="flex-shrink-0 w-48">
              <div className="bg-gray-100 rounded-lg overflow-hidden mb-2">
                <img src={product.image} alt={product.title} className="w-full h-56 object-cover" />
              </div>
              <h3 className="font-medium text-gray-900 text-sm">{product.title}</h3>
              <p className="text-gray-700 font-bold text-sm mt-1">{product.price}</p>
            </div>
          ))}
        </div>
        
        {/* Right scroll button */}
        {showRightButton && (
          <button 
            onClick={scrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 backdrop-blur-sm shadow-md rounded-full p-2 border border-gray-200"
            aria-label="Scroll right"
          >
            <ChevronRight size={20} className="text-gray-700" />
          </button>
        )}
      </div>
    </div>
  );
};

