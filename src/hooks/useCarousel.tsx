import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";

// Définir un type pour les options du carrousel
interface EmblaOptions {
    loop?: boolean;
    align?: 'start' | 'center' | 'end';
    dragFree?: boolean;
    containScroll?: 'trimSnaps' | 'keepSnaps';
    skipSnaps?: boolean;
}

const useCarousel = (options: EmblaOptions) => {
    const [emblaRef, emblaApi] = useEmblaCarousel(options);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [prevBtnEnabled, setPrevBtnEnabled] = useState(false);
    const [nextBtnEnabled, setNextBtnEnabled] = useState(false);

    const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
    const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

    const onSelect = useCallback(() => {
        if (!emblaApi) return;
        setPrevBtnEnabled(emblaApi.canScrollPrev());
        setNextBtnEnabled(emblaApi.canScrollNext());
        setSelectedIndex(emblaApi.selectedScrollSnap());
    }, [emblaApi]);

    useEffect(() => {
        if (!emblaApi) return;
        setSelectedIndex(emblaApi.selectedScrollSnap());
        emblaApi.on('select', onSelect);
        onSelect();

        const autoplay = setInterval(() => {
            if (emblaApi.canScrollNext()) {
                emblaApi.scrollNext();
            } else {
                emblaApi.scrollTo(0);
            }
        }, 5000);

        return () => {
            emblaApi.off('select', onSelect);
            clearInterval(autoplay);
        };
    }, [emblaApi, onSelect]);

    return {
        emblaRef,
        emblaApi, // Ajoutez emblaApi ici
        selectedIndex,
        prevBtnEnabled,
        nextBtnEnabled,
        scrollPrev,
        scrollNext,
    };
};

export default useCarousel;
