import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, RefreshCw, AlertCircle, Search, Flashlight, Volume2 } from 'lucide-react';
import { JavaCornerAccent } from './JavaOrnament';

export default function QRScanner({ onScanSuccess, onOpenManualSearch }) {
  const [cameraError, setCameraError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [cooldown, setCooldown] = useState(false);
  const scannerRef = useRef(null);
  const html5QrcodeRef = useRef(null);

  // Initialize camera list
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setAvailableCameras(devices);
          // Prefer back camera (environment) if available
          const backCamera = devices.find(
            (d) => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('rear')
          );
          setSelectedCameraId(backCamera ? backCamera.id : devices[0].id);
        } else {
          setCameraError('Tidak ada kamera yang terdeteksi pada perangkat ini.');
        }
      })
      .catch((err) => {
        console.warn('Unable to get cameras:', err);
        setCameraError('Izin kamera diperlukan untuk melakukan scan QR.');
      });
  }, []);

  // Start scanner when camera ID changes or component mounts
  useEffect(() => {
    if (!selectedCameraId) return;

    let isMounted = true;
    const scannerId = 'qr-reader-viewport';

    const startScanner = async () => {
      try {
        if (html5QrcodeRef.current) {
          if (html5QrcodeRef.current.isScanning) {
            await html5QrcodeRef.current.stop();
          }
          html5QrcodeRef.current.clear();
        }

        const html5Qrcode = new Html5Qrcode(scannerId, {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
        });

        html5QrcodeRef.current = html5Qrcode;

        const config = {
          fps: 10,
          qrbox: { width: 240, height: 240 },
          aspectRatio: 1.0,
        };

        await html5Qrcode.start(
          selectedCameraId,
          config,
          (decodedText) => {
            if (!isMounted || cooldown) return;
            handleScanDecoded(decodedText);
          },
          (errorMessage) => {
            // Ignore frame scan errors
          }
        );

        if (isMounted) {
          setIsScanning(true);
          setCameraError(null);
        }
      } catch (err) {
        console.error('Camera start error:', err);
        if (isMounted) {
          setCameraError('Gagal membuka kamera. Pastikan izin kamera telah diberikan.');
          setIsScanning(false);
        }
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      if (html5QrcodeRef.current) {
        if (html5QrcodeRef.current.isScanning) {
          html5QrcodeRef.current.stop().catch(() => {});
        }
      }
    };
  }, [selectedCameraId]);

  const handleScanDecoded = (decodedText) => {
    if (!decodedText || cooldown) return;

    setCooldown(true);
    onScanSuccess(decodedText);

    // 2.5 second cooldown before accepting next scan
    setTimeout(() => {
      setCooldown(false);
    }, 2500);
  };

  const handleSwitchCamera = () => {
    if (availableCameras.length <= 1) return;
    const currentIndex = availableCameras.findIndex((c) => c.id === selectedCameraId);
    const nextIndex = (currentIndex + 1) % availableCameras.length;
    setSelectedCameraId(availableCameras[nextIndex].id);
  };

  return (
    <div className="relative rounded-2xl bg-[#FDFBF7] border-2 border-[#C5A880]/40 shadow-lg p-4 sm:p-6 overflow-hidden">
      {/* Decorative Corner Accents */}
      <div className="absolute top-2 left-2 pointer-events-none">
        <JavaCornerAccent className="w-5 h-5 text-[#C5A880]" />
      </div>
      <div className="absolute top-2 right-2 rotate-90 pointer-events-none">
        <JavaCornerAccent className="w-5 h-5 text-[#C5A880]" />
      </div>

      {/* Header title */}
      <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-[#C5A880]/20">
        <div>
          <h2 className="text-lg font-serif-luxury font-bold text-[#4A3E3D] flex items-center gap-2">
            <Camera className="w-5 h-5 text-[#C5A880]" />
            Scanner QR Undangan
          </h2>
          <p className="text-xs text-[#8C7A6B]">
            Arahkan kamera ke QR Code pada undangan tamu
          </p>
        </div>

        {/* Camera Selector / Switch Button */}
        {availableCameras.length > 1 && (
          <button
            onClick={handleSwitchCamera}
            className="px-3 py-1.5 rounded-lg bg-[#F7F3E9] text-[#4A3E3D] text-xs font-medium border border-[#C5A880]/40 hover:bg-[#EAE3D2] transition-colors flex items-center gap-1.5 active:scale-95"
            title="Ganti Kamera"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>Ganti Kamera</span>
          </button>
        )}
      </div>

      {/* Scanner Box Viewport */}
      <div className="relative w-full aspect-square max-w-sm mx-auto bg-[#2C2625] rounded-xl overflow-hidden shadow-inner flex items-center justify-center border-2 border-[#C5A880]/50">
        <div id="qr-reader-viewport" className="w-full h-full object-cover"></div>

        {/* Laser Scanner Frame Overlay */}
        {isScanning && !cameraError && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* Darkened Vignette */}
            <div className="absolute inset-0 bg-black/30"></div>

            {/* Clear Center Scanning Box */}
            <div className="relative w-60 h-60 border-2 border-[#C5A880] rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
              {/* Corner Indicators */}
              <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-[#B99A63]"></div>
              <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-[#B99A63]"></div>
              <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-[#B99A63]"></div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-[#B99A63]"></div>

              {/* Animated Scan Line */}
              <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-[#C5A880] to-transparent shadow-[0_0_8px_#C5A880] animate-scan-laser"></div>
            </div>
          </div>
        )}

        {/* Camera Error Message Display */}
        {cameraError && (
          <div className="absolute inset-0 bg-[#4A3E3D]/95 text-[#FDFBF7] p-6 flex flex-col items-center justify-center text-center z-10">
            <AlertCircle className="w-12 h-12 text-[#C5A880] mb-3" />
            <h3 className="text-base font-bold mb-1">Akses Kamera Gagal</h3>
            <p className="text-xs text-[#D8C4B6] max-w-xs mb-4 leading-relaxed">
              {cameraError}
            </p>
            <button
              onClick={onOpenManualSearch}
              className="px-4 py-2 rounded-lg bg-[#C5A880] text-[#4A3E3D] font-bold text-xs hover:bg-[#B99A63] transition-colors flex items-center gap-1.5 shadow-md"
            >
              <Search className="w-4 h-4" />
              Gunakan Pencarian Manual
            </button>
          </div>
        )}

        {/* Cooldown Overlay */}
        {cooldown && (
          <div className="absolute inset-0 bg-[#2D5A47]/80 text-white flex flex-col items-center justify-center z-20 backdrop-blur-xs animate-fade-in">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-2 animate-bounce">
              ✓
            </div>
            <span className="text-sm font-bold tracking-wide">QR Berhasil Dibaca</span>
            <span className="text-xs opacity-80 mt-1">Memproses Tamu...</span>
          </div>
        )}
      </div>

      {/* Footer Info & Manual Fallback Button */}
      <div className="mt-4 flex items-center justify-between text-xs text-[#8C7A6B]">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#2D5A47] animate-pulse"></span>
          Kamera Aktif
        </span>

        <button
          onClick={onOpenManualSearch}
          className="text-[#B99A63] hover:text-[#4A3E3D] font-medium flex items-center gap-1 underline underline-offset-2 transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          Ketik ID / Nama Manual
        </button>
      </div>
    </div>
  );
}
