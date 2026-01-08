import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "./ui/Button";

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
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const handlePersonalize = () => {
    // Rediriger vers la page de personnalisation des mockups admin sans filtres
    navigate('/customize-product');
  };

  const handleDiscover = () => {
    // Rediriger vers la page des articles filtrés sans catégorie (tous les produits)
    navigate('/filtered-articles');
  };

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
      <div className={`relative w-full h-[45vh] xs:h-[50vh] sm:h-[55vh] md:h-[65vh] lg:h-[70vh] xl:h-[75vh] min-h-[320px] xs:min-h-[350px] sm:min-h-[420px] max-h-[650px] transition-all duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'} overflow-hidden`}>
        
        {/* Slides */}
        <div className="relative h-full">
          {slides.map((slide, index) => (
            <div 
              key={slide.id} 
              className={`-mt-12 absolute inset-0 transition-all duration-700 ease-in-out ${
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

              {/* Overlay sombre léger pour améliorer la lisibilité */}
              <div className="absolute inset-0 bg-black/20" />

              {/* Content overlay - Centrage vertical strict avec flexbox */}
              <div className="relative z-20 h-full flex flex-col justify-center px-2 xs:px-3 sm:px-4 md:px-6 py-3 xs:py-4 sm:py-6">
                <div className="text-center w-full max-w-[260px] xs:max-w-[280px] sm:max-w-sm md:max-w-xl lg:max-w-3xl mx-auto">

                  {/* Section haute: Title + Subtitle + Decoration */}
                  <div className={`mb-8 xs:mb-10 sm:mb-16 md:mb-20 lg:mb-24 xl:mb-28 transition-all duration-1000 ${
                    index === currentSlide
                        ? 'translate-y-0 opacity-100'
                        : 'translate-y-8 opacity-0'
                  }`} style={{ transitionDelay: index === currentSlide ? '200ms' : '0ms' }}>
                    {/* Title avec SVG intégré pour le slide Otaku */}
                    <h1 className="font-redhat flex flex-row items-center justify-center text-white mb-2 sm:mb-3 uppercase font-black" style={{
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                      fontWeight: '900',
                      textShadow: '2px 2px 8px rgba(0,0,0,0.7)',
                      fontSize: 'clamp(1rem, 4vw, 3.5rem)',
                      gap: '0.5rem',
                      lineHeight: 1,
                      letterSpacing: '0.01em',
                      whiteSpace: 'nowrap'
                    }}>
                      <span>{slide.title}</span>
                      {slide.collectionName === "Otaku" && slide.title === "LE STYLE" && (
                        <img
                          src="/landing_OTAKU.svg"
                          alt="Otaku Style"
                          style={{
                            width: 'clamp(3rem, 12vw, 10rem)',
                            height: 'auto',
                            marginLeft: '0.25rem',
                            filter: 'drop-shadow(2px 2px 6px rgba(0,0,0,0.6))'
                          }}
                        />
                      )}
                    </h1>

                    {/* Subtitle */}
                    <p className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl text-white font-light italic tracking-wide mb-1.5 sm:mb-2 md:mb-3" style={{
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                      textShadow: '1px 1px 6px rgba(0,0,0,0.8)',
                      fontWeight: '300',
                      lineHeight: 1.2,
                      fontSize: 'clamp(0.9rem, 3vw, 1.75rem)',
                      whiteSpace: 'normal'
                    }}>
                      {slide.subtitle}
                    </p>

                    {/* SVG décoratif sous le subtitle - centré */}
                    <div className="flex justify-center">
                      <img
                        src="/landing_Fichcvfoier.svg"
                        alt="Decoration"
                        className="w-12 xs:w-14 sm:w-16 md:w-20 lg:w-24 xl:w-28"
                        style={{
                          filter: 'drop-shadow(0 0 6px rgba(0,0,0,0.6))',
                          opacity: 0.9
                        }}
                      />
                    </div>
                  </div>

                  {/* Section milieu: Buttons */}
                  <div className={`flex flex-row gap-2 xs:gap-3 sm:gap-4 justify-center items-center mb-4 xs:mb-6 sm:mb-8 md:mb-10 transition-all duration-1000 w-full max-w-[280px] xs:max-w-[300px] sm:max-w-[340px] md:max-w-[380px] lg:max-w-[440px] mx-auto ${
                    index === currentSlide
                        ? 'translate-y-0 opacity-100'
                        : 'translate-y-8 opacity-0'
                  }`} style={{ transitionDelay: index === currentSlide ? '400ms' : '0ms' }}>

                    {/* Bouton "Je personnalise" - Couleur correcte pour chaque slide */}
                    <Button
                      onClick={handlePersonalize}
                      variant="primary"
                      size="lg"
                      className="hover:opacity-90 flex-1 whitespace-nowrap"
                      style={{
                        backgroundColor: slide.buttonColor,
                      }}
                    >
                      {slide.primaryBtn}
                    </Button>

                    {/* Bouton "Je Découvre" - Blanc avec texte noir */}
                    <Button
                      onClick={handleDiscover}
                      variant="outline"
                      size="lg"
                      className="bg-white text-black hover:opacity-90 flex-1 whitespace-nowrap"
                    >
                      {slide.secondaryBtn}
                    </Button>
                  </div>

                  {/* Section basse: Collection badge */}
                  <div className={`transition-all duration-1000 flex justify-center ${
                    index === currentSlide
                        ? 'translate-y-0 opacity-100'
                        : 'translate-y-6 opacity-0'
                  }`} style={{ transitionDelay: index === currentSlide ? '600ms' : '0ms' }}>
                    <div className="px-1 xs:px-1.5 sm:px-2 md:px-3 py-2 xs:py-2.5 sm:py-3 md:py-4 rounded-lg text-white w-full max-w-[280px] xs:max-w-[300px] sm:max-w-[340px] md:max-w-[380px] lg:max-w-[440px] mx-auto" style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.6)',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
                    }}>
                      <div className="text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl font-black mb-0.5 opacity-90" style={{
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        letterSpacing: '0.05em'
                      }}>
                        {slide.collection}
                      </div>
                      <div className="text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl font-black mb-0.5 opacity-90" style={{
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        letterSpacing: '0.05em'
                      }}>
                        {slide.collectionName}
                      </div>
                      <div className="text-sm xs:text-base sm:text-lg md:text-xl opacity-80 font-semibold italic" style={{
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        letterSpacing: '0.02em'
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

        {/* Navigation Buttons - Style simplifié sans effets lumineux */}
        <button
          className="absolute left-1 xs:left-1.5 sm:left-2 md:left-3 lg:left-4 top-1/2 transform -translate-y-1/2 z-30 w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 xl:w-12 lg:h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
          }}
          onClick={goToPrevious}
          aria-label="Slide précédent"
        >
          <svg className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          className="absolute right-1 xs:right-1.5 sm:right-2 md:right-3 lg:right-4 top-1/2 transform -translate-y-1/2 z-30 w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 xl:w-12 lg:h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
          }}
          onClick={goToNext}
          aria-label="Slide suivant"
        >
          <svg className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Dots Navigation - Style simplifié sans effets lumineux */}
        <div className="absolute bottom-2 xs:bottom-3 sm:bottom-4 md:bottom-6 lg:bottom-8 left-1/2 transform -translate-x-1/2 z-30 flex gap-1 xs:gap-1.5 sm:gap-2 md:gap-3">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`transition-all duration-300 rounded-full ${
                index === currentSlide
                    ? 'w-4 xs:w-5 sm:w-6 md:w-7 lg:w-8 h-1.5 xs:h-1.5 sm:h-2 md:h-2.5 lg:h-3'
                    : 'w-1.5 xs:w-1.5 sm:w-2 md:w-3 h-1.5 xs:h-1.5 sm:h-2 md:h-2.5 lg:h-3 opacity-60 hover:opacity-80'
              }`}
              onClick={() => goToSlide(index)}
              aria-label={`Aller au slide ${index + 1}`}
              style={{
                backgroundColor: index === currentSlide ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.5)',
                boxShadow: index === currentSlide ? '0 2px 6px rgba(0,0,0,0.2)' : 'none'
              }}
            />
          ))}
        </div>

      </div>
    </div>
  );
};

export default EnhancedCarousel;