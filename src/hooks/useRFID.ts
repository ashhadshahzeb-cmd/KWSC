import { useState, useEffect } from 'react';

interface UseRFIDOptions {
    onScan?: (tag: string) => void;
    enabled?: boolean;
}

export const useRFID = ({ onScan, enabled = true }: UseRFIDOptions = {}) => {
    const [lastScannedTag, setLastScannedTag] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);

    useEffect(() => {
        if (!enabled) return;

        let buffer = '';
        let lastKeyTime = Date.now();
        const TIMEOUT = 50; // ms between keystrokes for it to be considered a scan

        const handleKeyDown = (e: KeyboardEvent) => {
            const currentTime = Date.now();

            // If time between keys is too long, reset buffer
            if (currentTime - lastKeyTime > TIMEOUT) {
                buffer = '';
            }

            lastKeyTime = currentTime;

            if (e.key === 'Enter') {
                if (buffer.length > 5) { // Assuming min tag length
                    setLastScannedTag(buffer);
                    setIsScanning(true);
                    onScan?.(buffer);

                    // Reset scanning state after a short delay
                    setTimeout(() => setIsScanning(false), 1000);

                    buffer = '';
                }
            } else if (e.key.length === 1) { // Only printable characters
                buffer += e.key;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [enabled, onScan]);

    return { lastScannedTag, isScanning };
};
