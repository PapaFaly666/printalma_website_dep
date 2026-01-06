import Footer from '../components/Footer';
import CarousselContainer from '../components/CarousselContainer';
import FeaturedSlider from '../components/FeaturedSlider';
import { useProducts } from '@/hooks/useProducts';
import CategoryTabs from '../components/CategoryTabs';
import ArtistesSection from '../components/ArtisteSection';
import DesignersSection from './DesignersSection';
import InfluenceursSection from './InfluenceurSection';
import ThemesTendances from './ThemesTendances';
import ServiceFeatures from './ServiceFeatures ';
import PersonalizationSection from './PersonalizationSection';
import NouveautesGrid from './NouveauteSection';
import ScrollAnimation from '../components/ui/ScrollAnimation';

export default function ModernTShirtEcommerce() {
    const { isLoading } = useProducts();

    // Composant de loading optimisé et responsive
    const LoadingSlider = () => (
        <div className="w-full bg-gray-50">
            <div className="w-full px-4 sm:px-6 py-6 sm:py-8">
                <div className="text-center mb-6 sm:mb-8">
                    <div className="h-6 sm:h-8 md:h-10 bg-gray-200 rounded-lg max-w-md mx-auto mb-3 sm:mb-4 animate-pulse"></div>
                    <div className="h-3 sm:h-4 bg-gray-100 rounded max-w-lg mx-auto animate-pulse"></div>
                </div>

                <div className="flex gap-2 sm:gap-3 md:gap-4 overflow-x-auto pb-3 sm:pb-4">
                    {[...Array(4)].map((_, index) => (
                        <div key={index} className="flex-none w-56 sm:w-64 md:w-72 lg:w-80">
                            <div className="h-full bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                                <div className="aspect-[4/5] bg-gray-200 animate-pulse"></div>
                                <div className="p-3 sm:p-4">
                                    <div className="h-3 sm:h-4 bg-gray-200 rounded mb-2 animate-pulse"></div>
                                    <div className="h-2 sm:h-3 bg-gray-100 rounded w-3/4 animate-pulse"></div>
                                    <div className="h-3 sm:h-4 bg-gray-200 rounded w-1/2 mt-2 sm:mt-3 animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
            {/* Container principal responsive */}
            <div className="w-full relative mx-auto max-w-[1920px]">
                {/* Carousel Hero Section */}
                <div className="relative w-full">
                    <CarousselContainer />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-50/80 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* CategoryTabs sticky */}
                <div className="sticky top-0 z-40 backdrop-blur-md bg-white/80 shadow-sm transition-all duration-300">
                    <CategoryTabs />
                </div>

                {/* Section de personnalisation */}
                <ScrollAnimation animation="fadeUp" delay={100}>
                    <section className="w-full px-0 py-0">
                        <PersonalizationSection />
                    </section>
                </ScrollAnimation>

                {/* Nouveaux produits (Les meilleures ventes) */}
                <ScrollAnimation animation="slideLeft" delay={150}>
                    <section className="w-full px-0 py-0 relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 via-transparent to-purple-50/30 rounded-3xl -z-10" />
                        {isLoading ? (
                            <LoadingSlider />
                        ) : (
                            <FeaturedSlider />
                        )}
                    </section>
                </ScrollAnimation>

                {/* Grille des nouveautés */}
                <ScrollAnimation animation="slideRight" delay={200}>
                    <section className="w-full px-0 py-0">
                        <NouveautesGrid />
                    </section>
                </ScrollAnimation>

                {/* Thèmes tendances */}
                <ScrollAnimation animation="scaleUp" delay={250}>
                    <section className="w-full px-0 py-0 relative">
                        <div className="absolute inset-0 bg-gradient-to-l from-amber-50/30 via-transparent to-pink-50/30 rounded-3xl -z-10" />
                        <ThemesTendances />
                    </section>
                </ScrollAnimation>

                {/* DesignersSection */}
                <section className="w-full px-0 py-0">
                    <DesignersSection />
                </section>

                {/* ArtistesSection */}
                <section className="w-full px-0 py-0">
                    <ArtistesSection />
                </section>

                {/* InfluenceursSection */}
                <section className="w-full px-0 py-0">
                    <InfluenceursSection />
                </section>

                {/* ServiceFeatures */}
                <ScrollAnimation animation="fadeIn" delay={450}>
                    <section className="w-full px-0 py-0 relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/20 via-transparent to-cyan-50/20 rounded-3xl -z-10" />
                        <ServiceFeatures />
                    </section>
                </ScrollAnimation>
            </div>

            {/* Footer */}
            <ScrollAnimation animation="fadeUp" delay={500}>
                <footer className="mt-8 sm:mt-12 md:mt-16 border-t border-gray-200 bg-gradient-to-b from-white to-gray-50">
                    <Footer />
                </footer>
            </ScrollAnimation>
        </div>
    );
}