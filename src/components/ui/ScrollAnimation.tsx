import React, { useEffect, useRef, useState } from 'react';

interface ScrollAnimationProps {
  children: React.ReactNode;
  animation?: 'fadeUp' | 'fadeIn' | 'slideLeft' | 'slideRight' | 'scaleUp' | 'stagger';
  delay?: number;
  duration?: number;
  threshold?: number;
  className?: string;
  staggerDelay?: number; // Pour l'animation stagger
  once?: boolean; // Si l'animation ne doit jouer qu'une seule fois
}

const ScrollAnimation: React.FC<ScrollAnimationProps> = ({
  children,
  animation = 'fadeUp',
  delay = 0,
  duration = 400, // Réduit pour plus de fluidité
  threshold = 0.15, // Un peu plus tard pour éviter les animations trop rapides
  className = '',
  staggerDelay = 50, // Réduit pour des cascades plus fluides
  once = true
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!hasAnimated) {
            // Délai court pour une réponse immédiate mais fluide
            setTimeout(() => {
              setIsVisible(true);
              if (once) {
                setHasAnimated(true);
              }
            }, delay);
          }
        } else if (!once) {
          // Réinitialiser l'animation si l'élément n'est plus visible (pour les animations répétées)
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin: '50px 0px -25px 0px' // Plus proche pour une réactivité accrue
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [delay, hasAnimated, threshold, once]);

  // Définir les classes d'animation optimisées pour la fluidité
  const getAnimationClasses = () => {
    const baseClasses = 'transition-all will-change-transform'; // Optimisation GPU

    if (!isVisible) {
      // État initial (caché) - valeurs réduites pour plus de fluidité
      switch (animation) {
        case 'fadeUp':
          return `${baseClasses} opacity-0 translate-y-6`; // Réduit de 12px à 6px
        case 'fadeIn':
          return `${baseClasses} opacity-0`;
        case 'slideLeft':
          return `${baseClasses} opacity-0 translate-x-6`; // Réduit de 12px à 6px
        case 'slideRight':
          return `${baseClasses} opacity-0 -translate-x-6`; // Réduit de 12px à 6px
        case 'scaleUp':
          return `${baseClasses} opacity-0 scale-98`; // Plus proche de 100
        case 'stagger':
          return `${baseClasses} opacity-0 translate-y-4`; // Réduit de 8px à 4px
        default:
          return `${baseClasses} opacity-0 translate-y-6`;
      }
    } else {
      // État animé (visible)
      return `${baseClasses} opacity-100 translate-y-0 translate-x-0 scale-100`;
    }
  };

  // Gérer l'animation stagger pour les enfants multiples
  if (animation === 'stagger' && Array.isArray(children)) {
    return (
      <div ref={elementRef} className={className}>
        {React.Children.map(children, (child, index) => (
          <div
            className={getAnimationClasses()}
            style={{
              transitionDuration: `${duration}ms`,
              transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', // Même easing fluide
              transitionDelay: `${delay + index * staggerDelay}ms`
            }}
          >
            {child}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={elementRef}
      className={`${getAnimationClasses()} ${className}`}
      style={{
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' // easing fluide et naturel
      }}
    >
      {children}
    </div>
  );
};

export default ScrollAnimation;