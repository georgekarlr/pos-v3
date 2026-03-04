import { useEffect, useRef } from 'react';

export const useHardwareScanner = (onScan: (barcode: string) => void, enabled: boolean) => {
  const buffer = useRef('');
  const lastKeyTime = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field (unless it's specifically for searching/scanning)
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        // If the focused element has a specific data attribute or is our search field, maybe we want to allow it?
        // For now, let's keep it simple and skip if in input.
        return;
      }

      const currentTime = Date.now();
      
      // Hardware scanners are very fast. If delay between keys > 50ms, it's likely manual typing.
      if (currentTime - lastKeyTime.current > 50) {
        buffer.current = '';
      }

      if (e.key === 'Enter') {
        if (buffer.current.length > 2) {
          onScan(buffer.current);
          buffer.current = '';
        }
      } else if (e.key.length === 1) {
        buffer.current += e.key;
      }
      
      lastKeyTime.current = currentTime;
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, onScan]);
};
