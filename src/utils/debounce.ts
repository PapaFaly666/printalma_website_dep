/**
 * Crée une fonction debounce qui retarde l'exécution de la fonction originale
 * @param func La fonction à debouncer
 * @param wait Le délai en millisecondes
 * @returns Une fonction debouncée
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function debounced(...args: Parameters<T>) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, wait);
  };
}

/**
 * Crée une fonction throttle qui limite la fréquence d'exécution
 * @param func La fonction à throttler
 * @param limit L'intervalle minimum en millisecondes
 * @returns Une fonction throttlée
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return function throttled(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}
