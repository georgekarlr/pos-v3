import React, { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X } from 'lucide-react';

interface CameraScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

const CameraScanner: React.FC<CameraScannerProps> = ({ onScan, onClose }) => {
  useEffect(() => {
    // Config: 10 FPS, qrbox for scanning area (250x150)
    const scanner = new Html5QrcodeScanner("reader", { 
      fps: 10, 
      qrbox: { width: 250, height: 150 } 
    }, /* verbose= */ false);

    scanner.render(
      (text) => {
        onScan(text);
        // Clean up and close after first success to avoid double scans
        scanner.clear().catch(error => console.error("Failed to clear scanner", error));
        onClose();
      }, 
      (err) => {
        // Log errors but don't crash, it could just be "no QR code detected"
        if (typeof err === 'string' && err.includes("No barcode or QR code detected")) {
          return;
        }
        console.warn("Scanner error:", err);
      }
    );

    return () => {
      // Best-effort cleanup
      scanner.clear().catch(error => {
        // Sometimes clear fails if div is already gone, but we should try.
        if (document.getElementById('reader')) {
            console.error("Failed to clear scanner explicitly", error);
        }
      });
    };
  }, [onScan, onClose]);

  return (
    <div className="fixed inset-0 z-[60] bg-black bg-opacity-75 flex flex-col items-center justify-center p-4">
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-blue-600 px-4 py-3 flex items-center justify-between">
          <h3 className="text-white font-semibold">Scan Barcode</h3>
          <button 
            onClick={onClose} 
            className="text-white hover:bg-blue-700 p-1 rounded-full transition-colors"
            title="Close camera"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-4 bg-gray-900">
          <div id="reader" className="w-full"></div>
        </div>
        
        <div className="p-4 text-center">
          <p className="text-sm text-gray-600">
            Center the barcode in the camera view to scan.
          </p>
        </div>
      </div>
      {/* Semi-transparent backdrop click also closes */}
      <div 
        className="absolute inset-0 -z-10" 
        onClick={onClose}
      />
    </div>
  );
};

export default CameraScanner;
