import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce rapidly changing values (such as search queries)
 * @param {any} value - The input value to debounce
 * @param {number} delay - Debounce duration in milliseconds (default: 300ms)
 * @returns {any} Debounced value
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
