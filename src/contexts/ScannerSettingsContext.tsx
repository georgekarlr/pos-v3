import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ScanMode = 'hardware' | 'camera';

interface ScannerSettingsContextType {
  scanMode: ScanMode;
  setScanMode: (mode: ScanMode) => void;
}

const ScannerSettingsContext = createContext<ScannerSettingsContextType | undefined>(undefined);

const STORAGE_KEY = 'pos_scan_mode';

export const ScannerSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [scanMode, setScanModeState] = useState<ScanMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return (saved === 'camera' || saved === 'hardware') ? saved : 'hardware';
  });

  const setScanMode = (mode: ScanMode) => {
    setScanModeState(mode);
    localStorage.setItem(STORAGE_KEY, mode);
  };

  return (
    <ScannerSettingsContext.Provider value={{ scanMode, setScanMode }}>
      {children}
    </ScannerSettingsContext.Provider>
  );
};

export const useScannerSettings = () => {
  const context = useContext(ScannerSettingsContext);
  if (context === undefined) {
    throw new Error('useScannerSettings must be used within a ScannerSettingsProvider');
  }
  return context;
};
