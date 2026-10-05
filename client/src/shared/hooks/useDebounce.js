import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useDebounce Hook
 * Debounces a value by a specified delay in milliseconds.
 * Useful for search inputs, auto-save, and filter triggers.
 *
 * @param {*} value - The input value to debounce
 * @param {number} delay - The delay in ms (default 300ms)
 * @returns {*} debouncedValue
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

/**
 * useDebouncedCallback Hook
 * Returns a memoized callback that delays invoking func until after wait milliseconds.
 *
 * @param {Function} func - The callback function to debounce
 * @param {number} wait - The delay in ms (default 300ms)
 * @returns {Function} debounced function
 */
export function useDebouncedCallback(func, wait = 300) {
  const funcRef = useRef(func);
  const timeoutRef = useRef(null);

  useEffect(() => {
    funcRef.current = func;
  }, [func]);

  const debouncedFunc = useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      if (funcRef.current) {
        funcRef.current(...args);
      }
    }, wait);
  }, [wait]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedFunc;
}
