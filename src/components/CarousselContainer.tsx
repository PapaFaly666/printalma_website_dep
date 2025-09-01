import { useEffect, useState } from "react";

// Mock slides data
const slides = [
  {
    id: 1,
    image: "/1.jpg",
    title: "CRÉER OU TROUVER VOTRE STYLE,",
    subtitle: "NOUS L'IMPRIMONS.",
    collection: "Collection",
    collectionName: "StreetWear",
    collectionSubtitle: "Pour les fans de street fashion",
    primaryBtn: "Je personnalise",
    secondaryBtn: "Je Découvre",
    bgColor: "from-orange-600/20 via-orange-500/15 to-teal-600/25",
    buttonColor: "#F2D12E"
  },
  {
    id: 2,
    image: "/3.jpg",
    title: "LE STYLE",
    subtitle: "OUI NOUS L'IMPRIMONS.",
    collection: "Collection",
    collectionName: "Otaku",
    collectionSubtitle: "Pour les fans de manga",
    primaryBtn: "Je personnalise",
    secondaryBtn: "Je Découvre",
    bgColor: "from-blue-600/20 via-gray-500/15 to-blue-800/25",
    buttonColor: "#049BE5"
  },
  {
    id: 3,
    image: "/3.jpg",
    title: "SUMMER VIBE ÇA VOUS PARLE ?",
    subtitle: "OUI NOUS L'IMPRIMONS.",
    collection: "Collection",
    collectionName: "été 2025",
    collectionSubtitle: "Pour les beaux jours",
    primaryBtn: "Je personnalise",
    secondaryBtn: "Je Découvre",
    bgColor: "from-pink-500/20 via-orange-400/15 to-yellow-500/25",
    buttonColor: "#E5042B"
  }
];

const EnhancedCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-scroll
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isPaused) {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused]);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const goToSlide = (index) => setCurrentSlide(index);
  const goToPrevious = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  const goToNext = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);

  const currentSlideData = slides[currentSlide];

  return (
    <div 
      className="relative w-full"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={`relative w-full h-[40vh] sm:h-[45vh] md:h-[55vh] lg:h-[65vh] min-h-[300px] max-h-[500px] transition-all duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'} overflow-hidden`}>
        
        {/* Slides */}
        <div className="relative h-full">
          {slides.map((slide, index) => (
            <div 
              key={slide.id} 
              className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                  index === currentSlide 
                      ? 'opacity-100 translate-x-0' 
                      : index < currentSlide 
                          ? 'opacity-0 -translate-x-full' 
                          : 'opacity-0 translate-x-full'
              }`}
            >
              {/* Background image */}
              <div className="absolute inset-0 bg-cover bg-center transition-transform duration-[7000ms] ease-out" style={{
                backgroundImage: `url(${slide.image})`,
                transform: index === currentSlide ? 'scale(1.05)' : 'scale(1)'
              }} />

              {/* Gradient overlay pour améliorer la lisibilité */}
              <div className={`absolute inset-0 bg-gradient-to-r ${slide.bgColor}`} />
              <div className="absolute inset-0 bg-black/10" />

              {/* Content overlay - Centrage vertical strict avec flexbox */}
              <div className="relative z-20 h-full flex flex-col justify-center px-2 sm:px-4 md:px-6 py-4 sm:py-6">
                <div className="text-center w-full max-w-[280px] sm:max-w-sm md:max-w-xl lg:max-w-3xl mx-auto">

                  {/* Title avec SVG intégré pour le slide Otaku */}
                  <h1 className={`font-redhat flex flex-col sm:flex-row items-center justify-center text-white mb-1 sm:mb-2 md:mb-3 uppercase font-black transition-all duration-1000 ${
                    index === currentSlide 
                        ? 'translate-y-0 opacity-100' 
                        : 'translate-y-8 opacity-0'
                  }`} style={{ 
                    transitionDelay: index === currentSlide ? '200ms' : '0ms',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    fontWeight: '900',
                    textShadow: '2px 2px 8px rgba(0,0,0,0.7)',
                    fontSize: 'clamp(1.2rem, 3.5vw, 3.2rem)',
                    gap: '0.3rem',
                    lineHeight: 0.9,
                    letterSpacing: '0.01em'
                  }}>
                    <span className="text-center">{slide.title}</span>
                    {slide.collectionName === "Otaku" && slide.title === "LE STYLE" && (
                      <div className="flex items-center justify-center mt-1 sm:mt-0">
                        <img 
                          src="/landing_OTAKU.svg" 
                          alt="Otaku Style" 
                          className="block"
                          style={{ 
                            height: 'clamp(1rem, 2.5vw, 2.5rem)',
                            width: 'auto',
                            filter: 'drop-shadow(2px 2px 6px rgba(0,0,0,0.6))',
                            marginLeft: '0.2rem'
                          }}
                        />
                      </div>
                    )}
                  </h1>

                  {/* Subtitle */}
                  <div className={`relative mb-2 sm:mb-3 md:mb-4 transition-all duration-1000 ${
                    index === currentSlide 
                        ? 'translate-y-0 opacity-100' 
                        : 'translate-y-8 opacity-0'
                  }`} style={{ transitionDelay: index === currentSlide ? '400ms' : '0ms' }}>
                    <p className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl text-white font-light italic tracking-wide mb-2 sm:mb-3" style={{
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                      textShadow: '1px 1px 6px rgba(0,0,0,0.8)',
                      fontWeight: '300',
                      lineHeight: 1.2
                    }}>
                      {slide.subtitle}
                    </p>

                    {/* SVG décoratif sous le subtitle - Plus grand et décalé à droite */}
                    <img
                      src="/landing_Fichcvfoier.svg"
                      alt="Decoration"
                      className="w-16 sm:w-20 md:w-28 lg:w-32 xl:w-36 transition-all duration-1000"
                      style={{ 
                        filter: 'drop-shadow(0 0 6px rgba(0,0,0,0.6))',
                        opacity: 0.9,
                        marginLeft: 'auto',
                        marginRight: 'auto',
                        transform: 'translateX(10px)'
                      }}
                    />
                  </div>

                  {/* Buttons - Couleurs dynamiques selon le slide avec correction du bug */}
                  <div className={`flex flex-col sm:flex-row gap-2 justify-center items-center mb-2 sm:mb-3 md:mb-4 transition-all duration-1000 ${
                    index === currentSlide 
                        ? 'translate-y-0 opacity-100' 
                        : 'translate-y-8 opacity-0'
                  }`} style={{ transitionDelay: index === currentSlide ? '600ms' : '0ms' }}>
                    
                    {/* Bouton "Je personnalise" - Couleur correcte pour chaque slide */}
                    <button 
                      className="px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-2.5 text-black font-semibold text-xs sm:text-sm transition-all duration-200 hover:opacity-90 w-full sm:w-auto"
                      style={{ 
                        backgroundColor: slide.buttonColor, // Utilise slide.buttonColor au lieu de currentSlideData.buttonColor
                        borderRadius: '4px',
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        fontWeight: '600',
                        border: 'none',
                        minWidth: '100px',
                        maxWidth: '160px',
                        cursor: 'pointer'
                      }}
                    >
                      {slide.primaryBtn}
                    </button>
                    
                    {/* Bouton "Je Découvre" - Blanc avec texte noir */}
                    <button 
                      className="px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-2.5 text-black font-semibold text-xs sm:text-sm transition-all duration-200 hover:opacity-90 w-full sm:w-auto"
                      style={{ 
                        backgroundColor: 'white', 
                        border: 'none',
                        borderRadius: '4px',
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        fontWeight: '600',
                        minWidth: '100px',
                        maxWidth: '160px',
                        cursor: 'pointer'
                      }}
                    >
                      {slide.secondaryBtn}
                    </button>
                  </div>

                  {/* Collection badge - Style amélioré et responsive */}
                  <div className={`inline-block transition-all duration-1000 ${
                    index === currentSlide 
                        ? 'translate-y-0 opacity-100' 
                        : 'translate-y-8 opacity-0'
                  }`} style={{ transitionDelay: index === currentSlide ? '800ms' : '0ms' }}>
                    <div className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-3 rounded-lg text-white border border-white/20" style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.75)',
                      backdropFilter: 'blur(15px)',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
                    }}>
                      <div className="text-xs font-medium mb-0.5 opacity-80" style={{ 
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        letterSpacing: '0.05em'
                      }}>
                        {slide.collection}
                      </div>
                      <div className="text-sm sm:text-base md:text-lg font-black mb-0.5 sm:mb-1" style={{ 
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        letterSpacing: '0.02em'
                      }}>
                        {slide.collectionName}
                      </div>
                      <div className="text-xs opacity-75 italic" style={{ 
                        fontFamily: 'system-ui, -apple-system, sans-serif' 
                      }}>
                        {slide.collectionSubtitle}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Buttons - Style amélioré et responsive */}
        <button
          className="absolute left-2 sm:left-3 md:left-4 top-1/2 transform -translate-y-1/2 z-30 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg border border-white/30"
          style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.25)', 
            backdropFilter: 'blur(10px)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}
          onClick={goToPrevious}
          aria-label="Slide précédent"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <button
          className="absolute right-2 sm:right-3 md:right-4 top-1/2 transform -translate-y-1/2 z-30 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg border border-white/30"
          style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.25)', 
            backdropFilter: 'blur(10px)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}
          onClick={goToNext}
          aria-label="Slide suivant"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Dots Navigation - Style amélioré et responsive */}
        <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 left-1/2 transform -translate-x-1/2 z-30 flex gap-2 sm:gap-3">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`transition-all duration-300 rounded-full ${
                index === currentSlide
                    ? 'w-6 sm:w-8 h-2 sm:h-3 bg-white shadow-lg'
                    : 'w-2 sm:w-3 h-2 sm:h-3 bg-white bg-opacity-50 hover:bg-opacity-75'
              }`}
              onClick={() => goToSlide(index)}
              aria-label={`Aller au slide ${index + 1}`}
              style={{
                boxShadow: index === currentSlide ? '0 2px 8px rgba(0,0,0,0.3)' : 'none'
              }}
            />
          ))}
        </div>

      </div>
    </div>
  );
};

export default EnhancedCarousel;