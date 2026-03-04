import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeCameraScanConfig, QrcodeErrorCallback, QrcodeSuccessCallback } from 'html5-qrcode';
import { Camera, Image as ImageIcon, RotateCw, X, List, Hash, Check } from 'lucide-react';
import { Product } from '../../types/product';
import { playScanSound } from '../../utils/sound';

interface CameraScannerProps {
  onScan: (decodedText: string) => void;
  onMultipleScan?: (items: ScannedItem[]) => void;
  onClose: () => void;
  products: Product[];
  currentAction?: 'add' | 'deduct';
}

interface CameraDevice {
  id: string;
  label: string;
}

interface ScannedItem {
  product: Product;
  count: number;
}

const CameraScanner: React.FC<CameraScannerProps> = ({ onScan, onMultipleScan, onClose, products, currentAction = 'add' }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [activeCameraId, setActiveCameraId] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState<'single' | 'multiple'>('single');
  const scanModeRef = useRef<'single' | 'multiple'>('single');
  const [scannedItems, setScannedItems] = useState<Record<number, ScannedItem>>({});
  const lastScannedBarcode = useRef<string | null>(null);
  const lastScanTime = useRef<number>(0);

  // Keep ref in sync with state
  useEffect(() => {
    scanModeRef.current = scanMode;
  }, [scanMode]);

  // Initialize and start scanner
  useEffect(() => {
    const html5QrCode = new Html5Qrcode("reader");
    scannerRef.current = html5QrCode;

    const startScanner = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          setCameras(devices.map(d => ({ id: d.id, label: d.label })));
          
          // Prefer back camera by default
          const backCamera = devices.find(device => 
            device.label.toLowerCase().includes('back') || 
            device.label.toLowerCase().includes('rear') ||
            device.label.toLowerCase().includes('environment')
          );
          
          const cameraId = backCamera ? backCamera.id : devices[0].id;
          setActiveCameraId(cameraId);
          await startCamera(cameraId);
        } else {
          setError("No cameras found.");
        }
      } catch (err) {
        console.error("Error getting cameras", err);
        setError("Failed to access camera. Please check permissions.");
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(e => console.error("Failed to stop scanner", e));
      }
    };
  }, []);

  const handleScanSuccess = (decodedText: string) => {
    // Debounce scans to avoid rapid double-scans of the same item
    const now = Date.now();
    if (decodedText === lastScannedBarcode.current && now - lastScanTime.current < 2000) {
      return;
    }
    
    lastScannedBarcode.current = decodedText;
    lastScanTime.current = now;

    const product = products.find(p => p.barcode === decodedText);
    
    if (scanModeRef.current === 'single') {
      playScanSound();
      onScan(decodedText);
      onClose();
    } else {
      if (product) {
        playScanSound();
        setScannedItems(prev => {
          const current = prev[product.id] || { product, count: 0 };
          const nextCount = currentAction === 'add' ? current.count + 1 : Math.max(0, current.count - 1);
          
          if (nextCount === 0 && currentAction === 'deduct') {
            const copy = { ...prev };
            delete copy[product.id];
            return copy;
          }
          
          return {
            ...prev,
            [product.id]: { ...current, count: nextCount }
          };
        });
        // We don't call onScan here to allow batch commit on 'Done'
      } else {
        setError(`Product with barcode ${decodedText} not found`);
        setTimeout(() => setError(null), 3000);
      }
    }
  };

  const startCamera = async (cameraId: string) => {
    if (!scannerRef.current) return;
    
    // Stop if already scanning
    if (scannerRef.current.isScanning) {
      await scannerRef.current.stop();
    }

    const config: Html5QrcodeCameraScanConfig = {
      fps: 10,
      qrbox: { width: 250, height: 150 },
    };

    const successCallback: QrcodeSuccessCallback = (decodedText) => {
      handleScanSuccess(decodedText);
    };

    const errorCallback: QrcodeErrorCallback = (errorMessage) => {
      // Ignore "No QR code found" errors to avoid log spam
      if (errorMessage.includes("No barcode or QR code detected")) return;
    };

    try {
      await scannerRef.current.start(cameraId, config, successCallback, errorCallback);
      setIsScanning(true);
      setError(null);
    } catch (err) {
      console.error("Failed to start camera", err);
      setError("Failed to start camera scan.");
      setIsScanning(false);
    }
  };

  const handleSwitchCamera = async () => {
    if (cameras.length < 2) return;
    
    const currentIndex = cameras.findIndex(c => c.id === activeCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCamera = cameras[nextIndex];
    
    setActiveCameraId(nextCamera.id);
    await startCamera(nextCamera.id);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    const file = event.target.files[0];

    if (!scannerRef.current) return;

    try {
      const decodedText = await scannerRef.current.scanFile(file, true);
      handleScanSuccess(decodedText);
    } catch (err) {
      console.error("Failed to scan file", err);
      setError("No barcode found in image.");
    }
  };

  const scannedList = Object.values(scannedItems);

  return (
    <div className="fixed inset-0 z-[60] bg-black bg-opacity-75 flex flex-col items-center justify-center sm:p-4 overflow-hidden">
      <div className="relative bg-white sm:rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col h-full sm:h-auto sm:max-h-[90vh]">
        {/* Header */}
        <div className={`${currentAction === 'deduct' ? 'bg-red-600' : 'bg-blue-600'} px-4 py-3 flex items-center justify-between flex-shrink-0`}>
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-white" />
            <h3 className="text-white font-semibold text-sm sm:text-base">
              {currentAction === 'deduct' ? 'Deduct Items' : 'Scan Barcode'}
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-white hover:bg-blue-700 p-1 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {/* Scanner View */}
        <div className="bg-gray-900 relative flex-shrink-0">
          <div id="reader" className="w-full overflow-hidden sm:rounded-lg border-2 border-dashed border-gray-700 aspect-video sm:aspect-auto sm:min-h-[200px] bg-black"></div>
          
          {error && (
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center z-10">
              <div className="bg-red-50 p-4 rounded-lg border border-red-200 shadow-lg">
                <p className="text-sm text-red-600 font-medium">{error}</p>
              </div>
            </div>
          )}
          
          {/* Floating Controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-3">
            {cameras.length > 1 && (
              <button
                onClick={handleSwitchCamera}
                className="bg-white/90 p-3 rounded-full shadow-lg text-gray-700 hover:bg-white transition-colors active:scale-90"
                title="Switch camera"
              >
                <RotateCw className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-white/90 p-3 rounded-full shadow-lg text-gray-700 hover:bg-white transition-colors active:scale-90"
              title="Upload image"
            >
              <ImageIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="px-4 py-2 bg-gray-100 flex gap-2 flex-shrink-0">
          <button
            onClick={() => setScanMode('single')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              scanMode === 'single' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Hash className="h-4 w-4" /> Single
          </button>
          <button
            onClick={() => setScanMode('multiple')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              scanMode === 'multiple' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <List className="h-4 w-4" /> Multiple
          </button>
        </div>
        
        {/* Content Area - Shows Scanned List or settings */}
        <div className="flex-1 overflow-y-auto bg-gray-50 min-h-[100px]">
          {scanMode === 'multiple' && (
            <div className="p-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Scanned Items</h4>
              {scannedList.length === 0 ? (
                <p className="text-sm text-gray-400 italic text-center py-4">No items scanned yet in this session.</p>
              ) : (
                <ul className="divide-y divide-gray-200 bg-white rounded-lg border border-gray-200">
                  {scannedList.map(({ product, count }) => (
                    <li key={product.id} className="px-3 py-2 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">{product.name}</span>
                        <span className="text-xs text-gray-500">{product.barcode}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`${currentAction === 'deduct' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'} text-xs font-bold px-2.5 py-0.5 rounded-full`}>
                          {currentAction === 'deduct' ? '-' : 'x'}{count}
                        </span>
                      </div>
                    </li>
                  )).reverse()}
                </ul>
              )}
            </div>
          )}

          {scanMode === 'single' && (
             <div className="p-4 flex flex-col gap-3">
               {cameras.length > 0 && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Camera</label>
                  <select 
                    value={activeCameraId || ''} 
                    onChange={(e) => {
                      const id = e.target.value;
                      setActiveCameraId(id);
                      startCamera(id);
                    }}
                    className="block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white"
                  >
                    {cameras.map(cam => (
                      <option key={cam.id} value={cam.id}>{cam.label || `Camera ${cam.id}`}</option>
                    ))}
                  </select>
                </div>
              )}
              <p className="text-xs text-gray-500">Align barcode in frame. Scanner will close after a successful scan.</p>
             </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 bg-white border-t border-gray-100 flex-shrink-0 mb-safe sm:mb-0">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <ImageIcon className="h-4 w-4" />
              Upload Image
            </button>
            
            {scanMode === 'multiple' && (
              <button
                onClick={() => {
                  if (onMultipleScan) {
                    onMultipleScan(scannedList);
                  }
                  onClose();
                }}
                className="bg-green-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-green-700 shadow-md active:scale-95 transition-transform"
              >
                <Check className="h-4 w-4" /> Done
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept="image/*" 
        className="hidden" 
      />

      {/* Semi-transparent backdrop click also closes */}
      <div 
        className="absolute inset-0 -z-10" 
        onClick={onClose}
      />
    </div>
  );
};

export default CameraScanner;
