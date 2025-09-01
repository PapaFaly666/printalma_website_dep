import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel, { EmblaViewportRefType } from 'embla-carousel-react';

// Définir un type pour les options du carousel
interface EmblaOptionsType {
    loop?: boolean;
    align?: 'start' | 'center' | 'end';
    skipSnaps?: boolean;
    containScroll?: 'trimSnaps' | 'keepSnaps';
}

// Définir un type pour les valeurs retournées par le hook
interface UseFeaturedSliderReturn {
    emblaRef: EmblaViewportRefType; 
    prevBtnEnabled: boolean;
    nextBtnEnabled: boolean;
    selectedIndex: number;
    scrollSnaps: number[];
    scrollPrev: () => void;
    scrollNext: () => void;
    scrollTo: (index: number) => void;
    scrollProgress: number;
}

const useFeaturedSlider = (options: EmblaOptionsType): UseFeaturedSliderReturn => {
    const [emblaRef, emblaApi] = useEmblaCarousel(options);
    const [prevBtnEnabled, setPrevBtnEnabled] = useState(false);
    const [nextBtnEnabled, setNextBtnEnabled] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

    const onSelect = useCallback(() => {
        if (!emblaApi) return;
        setPrevBtnEnabled(emblaApi.canScrollPrev());
        setNextBtnEnabled(emblaApi.canScrollNext());
        setSelectedIndex(emblaApi.selectedScrollSnap());
    }, [emblaApi]);

    useEffect(() => {
        if (!emblaApi) return;

        emblaApi.on('select', onSelect);
        setScrollSnaps(emblaApi.scrollSnapList());
        onSelect();

        return () => {
            emblaApi.off('select', onSelect);
        };
    }, [emblaApi, onSelect]);

    const scrollPrev = useCallback(() => {
        emblaApi?.scrollPrev();
    }, [emblaApi]);
    
    const scrollNext = useCallback(() => {
        emblaApi?.scrollNext();
    }, [emblaApi]);
    
    const scrollTo = useCallback((index: number) => {
        emblaApi && emblaApi.scrollTo(index);
    }, [emblaApi]);

    const scrollProgress = selectedIndex / (scrollSnaps.length - 1);

    return {
        emblaRef,
        prevBtnEnabled,
        nextBtnEnabled,
        selectedIndex,
        scrollSnaps,
        scrollPrev,
        scrollNext,
        scrollTo,
        scrollProgress,
    };
};

export default useFeaturedSlider;