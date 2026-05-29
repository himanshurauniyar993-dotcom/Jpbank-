import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Html5Qrcode, CameraDevice } from 'html5-qrcode';
import { ArrowLeft, ScanLine, RefreshCcw, Zap, Image as ImageIcon, QrCode, X } from 'lucide-react';

export default function ScanQR() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [error, setError] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [activeCameraId, setActiveCameraId] = useState<string | null>(null);
  const [flashOn, setFlashOn] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerLifecycleRef = useRef<Promise<void>>(Promise.resolve());
  const readerIdCounter = useRef(0);
  const [retryKey, setRetryKey] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleResetCamera = () => {
    setError('');
    setIsScanning(false);
    setCameras([]);
    setActiveCameraId(null);
    setRetryKey(prev => prev + 1);
  };

  useEffect(() => {
    let isMounted = true;
    
    const initCameras = async (retryCount = 0) => {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (isMounted && devices && devices.length > 0) {
          setCameras(devices);
          let backCam = devices.find(c => c.label.toLowerCase().includes('back') || c.label.toLowerCase().includes('environment'));
          const id = backCam ? backCam.id : devices[0].id;
          setActiveCameraId(id);
          setError(''); 
        } else if (isMounted) {
          setError('No cameras found on this device.');
        }
      } catch (err: any) {
        console.error('getCameras Error Details:', err);
        
        if (err.toString().includes('Could not start video source') && retryCount < 3) {
          const delay = (retryCount + 1) * 1500;
          setTimeout(() => {
            if (isMounted) initCameras(retryCount + 1);
          }, delay);
          return;
        }

        if (isMounted) {
          if (err.toString().includes('NotAllowedError') || err.toString().includes('Permission denied')) {
            setError('Camera permission denied. Please enable camera access in your browser settings.');
          } else if (err.toString().includes('Could not start video source')) {
            setError('Camera is currently locked or in use by another application. Please close other tabs/apps and try the "Retry" button below.');
          } else {
            setError('Failed to access camera. Please ensure permissions are granted and no other app is using it.');
          }
        }
      }
    };

    initCameras();

    return () => { isMounted = false; };
  }, [retryKey]);

  useEffect(() => {
    if (!activeCameraId) return;

    let isMounted = true;
    let html5QrCode: Html5Qrcode | null = null;
    let localStartPromise: Promise<any> | null = null;

    readerIdCounter.current += 1;
    const readerId = `reader-${readerIdCounter.current}`;
    const readerEl = document.createElement('div');
    readerEl.id = readerId;
    readerEl.className = 'w-full rounded-xl overflow-hidden';

    const startScanner = async (retryCount = 0) => {
      try {
        if (!isMounted) return;

        // Reduced delay for faster initial attempt
        const startDelay = retryCount === 0 ? 300 : 1000;
        await new Promise(resolve => setTimeout(resolve, startDelay));
        if (!isMounted) return;

        // Aggressive cleanup of any existing scanner
        if (scannerRef.current) {
          try {
            if (scannerRef.current.isScanning) {
              await scannerRef.current.stop();
            }
            scannerRef.current.clear();
          } catch (e) {
            console.warn('Pre-start cleanup failed:', e);
          }
          scannerRef.current = null;
        }

        // Clean up any stray video elements in the container
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
          containerRef.current.appendChild(readerEl);
        } else {
          return;
        }

        html5QrCode = new Html5Qrcode(readerId);
        scannerRef.current = html5QrCode;

        const config = { 
          fps: 15, // Slightly higher FPS for better responsiveness
          qrbox: undefined,
          aspectRatio: 1.0,
          // Experimental: discourage some computationally expensive features during start
          disableFlip: false, 
        };

        // Attempt start
        try {
          // If we have an ID AND it's the first try, try starting immediately
          localStartPromise = html5QrCode.start(
            activeCameraId,
            config,
            (decodedText) => {
              if (isMounted && decodedText) {
                if (html5QrCode && html5QrCode.isScanning) {
                  html5QrCode.stop().then(() => {
                    navigate(`/pay/${decodedText}`);
                  }).catch(err => console.error('Stop error on success:', err));
                }
              }
            },
            () => {} 
          );
          await localStartPromise;
        } catch (startErr) {
          console.warn('Start with ID failed, trying facingMode environment:', startErr);
          localStartPromise = html5QrCode.start(
            { facingMode: "environment" },
            config,
            (decodedText) => {
              if (isMounted && decodedText) {
                if (html5QrCode && html5QrCode.isScanning) {
                  html5QrCode.stop().then(() => {
                    navigate(`/pay/${decodedText}`);
                  }).catch(err => console.error('Stop error on success:', err));
                }
              }
            },
            () => {}
          );
          await localStartPromise;
        }

        if (isMounted) {
          setIsScanning(true);
          setError(''); 
        }
      } catch (err: any) {
        console.error('Camera Error Details:', err);
        
        if (err.toString().includes('Could not start video source') && retryCount < 3) {
          const delay = (retryCount + 1) * 1500;
          setTimeout(() => {
            if (isMounted) startScanner(retryCount + 1);
          }, delay);
          return;
        }

        if (isMounted) {
          if (err.toString().includes('NotAllowedError')) {
            setError('Camera permission denied. Please enable camera access in your browser settings.');
          } else if (err.toString().includes('Could not start video source')) {
            setError('Camera is currently locked or in use by another application. Please close other tabs/apps and try the "Retry" button below.');
          } else {
            setError('Failed to start scanner. Please try typing the ID manually or check if another app is using the camera.');
          }
        }
      }
    };

    scannerLifecycleRef.current = scannerLifecycleRef.current.then(() => startScanner()).catch(() => {});

    return () => {
      isMounted = false;
      setIsScanning(false);

      if (readerEl.parentNode) {
        readerEl.style.display = 'none';
        document.body.appendChild(readerEl);
      }

      scannerLifecycleRef.current = scannerLifecycleRef.current.then(async () => {
        if (html5QrCode) {
          try {
            if (localStartPromise) {
              await localStartPromise.catch(() => {});
            }
            
            // Check state before stopping/clearing
            // getState() is safer than isScanning property
            const state = html5QrCode.getState();
            if (state === 2) { // 2 = SCANNING
              await html5QrCode.stop();
            }
            
            if (html5QrCode.getState() === 1) { // 1 = IDLE/CLEARED
               // Already cleared or never started
            } else {
               html5QrCode.clear();
            }
          } catch (e) {
            // Only log if it's not the "ongoing" error which we are trying to avoid
            if (e instanceof Error && !e.message.includes('ongoing')) {
              console.error('Error during scanner cleanup:', e);
            }
          }
        }
        
        if (readerEl.parentNode) {
          readerEl.parentNode.removeChild(readerEl);
        }
      }).catch(() => {});
    };
  }, [activeCameraId, navigate]);

  const handleBack = () => {
    navigate('/');
  };

  const handleSwitchCamera = () => {
    if (cameras.length < 2) return;
    const currentIndex = cameras.findIndex(c => c.id === activeCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    setIsScanning(false);
    setActiveCameraId(cameras[nextIndex].id);
  };

  const handleToggleFlash = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        const newState = !flashOn;
        await scannerRef.current.applyVideoConstraints({
          advanced: [{ torch: newState } as any]
        });
        setFlashOn(newState);
      } catch (err) {
        console.error('Flash toggle failed:', err);
      }
    }
  };

  const handleFileScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const html5QrCode = new Html5Qrcode("reader-file-scan");
    try {
      const decodedText = await html5QrCode.scanFile(file, true);
      if (decodedText) {
        navigate(`/pay/${decodedText}`);
      }
    } catch (err) {
      setError('Could not find a valid QR code in this image.');
    } finally {
      try {
        html5QrCode.clear();
      } catch (e) {}
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col relative overflow-hidden">
      {/* Hidden element for file scanning */}
      <div id="reader-file-scan" className="hidden"></div>
      
      {/* Header */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-50">
        <button onClick={handleToggleFlash} className="p-3 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-black/40 transition-all">
          <Zap className={`w-6 h-6 ${flashOn ? 'text-yellow-400 fill-yellow-400' : ''}`} />
        </button>
        <h1 className="text-white font-bold text-sm tracking-widest uppercase opacity-80">Scan QR Code to Pay</h1>
        <button onClick={handleBack} className="p-3 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-black/40 transition-all">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center pt-24 px-6 relative z-10">
        {/* Logo Area */}
        <div className="mb-8 flex flex-col items-center">
          <div className="flex justify-center items-center mb-4">
            <img 
              src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDUwMCAxNTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNzUiIGN5PSI3NSIgcj0iNjUiIGZpbGw9IiMxQjQzMzIiIHN0cm9rZT0iI0M1QTA1OSIgc3Ryb2tlLXdpZHRoPSIzIiAvPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDc1LCA2MCkgc2NhbGUoMC44KSIgZmlsbD0iIzJENkE0RiI+PHBhdGggZD0iTTAsLTI1IEM1LC0xNSAxNSwtMTUgMjAsLTIwIEMxNSwtMTAgMTUsMCAyNSwwIEMxNSwwIDE1LDEwIDIwLDIwIEMxNSwxNSA1LDE1IDAsMjUgQy01LDE1IC0xNSwxNSAtMjAsMjAgQy0xNSwxMCAtMTUsMCAtMjUsMCBDLTE1LDAgLTE1LC0xMCAtMjAsLTIwIEMtMTUsLTE1IC01LC0xNSAwLC0yNSBaIiAvPjwvZz48dGV4dCB4PSI3NSIgeT0iMTA1IiBmb250LWZhbWlseT0iJ1RpbWVzIE5ldyBSb21hbicsIHNlcmlmIiBmb250LXNpemU9IjM2IiBmaWxsPSIjQzVBMDU5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXdlaWdodD0iYm9sZCI+SlA8L3RleHQ+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTYwLCAwKSI+PHRleHQgeT0iNjUiIGZvbnQtZmFtaWx5PSInVGltZXMgTmV3IFJvbWFuJywgc2VyaWYiIGZvbnQtc2l6ZT0iNDgiIGZpbGw9IiNDNUEwNTkiIGZvbnQtd2VpZ2h0PSJib2xkIj5KQVBBTiBCQU5LPC90ZXh0Pjx0ZXh0IHk9IjExMCIgZm9udC1mYW1pbHk9IidUaW1lcyBOZXcgUm9tYW4nLCBzZXJpZiIgZm9udC1zaXplPSIzMiIgZmlsbD0iI0M1QTA1OSI+44K444Oj44OR44Oz6YqA6KGMPC90ZXh0PjwvZz48L3N2Zz4=" 
              alt="Japan Bank Logo"
              className="w-[240px] h-auto drop-shadow-[0_0_15px_rgba(197,160,89,0.3)]"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex items-center space-x-2 text-white/60 text-[10px] font-black uppercase tracking-[0.3em]">
            <span>Secure</span>
            <div className="w-1 h-1 bg-red-500 rounded-full"></div>
            <span>Verified</span>
            <div className="w-1 h-1 bg-red-500 rounded-full"></div>
            <span>Instant</span>
          </div>
        </div>

        {/* Gallery Button */}
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="mb-12 flex items-center space-x-3 px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white text-xs font-black uppercase tracking-widest hover:bg-white/20 transition-all active:scale-95"
        >
          <ImageIcon className="w-4 h-4" />
          <span>Add QR Code from Gallery</span>
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleFileScan} 
        />

        {/* Scanner Area */}
        <div className="relative w-full max-w-[280px] aspect-square">
          {/* Corner Accents */}
          <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-red-600 rounded-tl-xl z-20"></div>
          <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-red-600 rounded-tr-xl z-20"></div>
          <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-red-600 rounded-bl-xl z-20"></div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-red-600 rounded-br-xl z-20"></div>

          {/* Scanning Line Animation */}
          {isScanning && (
            <div className="absolute left-0 w-full h-1 bg-red-600/50 shadow-[0_0_15px_rgba(178,34,34,0.8)] z-30 animate-scan-line"></div>
          )}

          <div className="w-full h-full rounded-3xl overflow-hidden bg-black/40 border border-white/10 relative">
            {!isScanning && !error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Initializing...</span>
              </div>
            )}
            
            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <p className="text-red-400 text-xs font-bold mb-4">{error}</p>
                <button onClick={handleResetCamera} className="px-4 py-2 bg-white/10 rounded-lg text-white text-[10px] font-bold uppercase">Retry</button>
              </div>
            )}

            <div ref={containerRef} className="w-full h-full"></div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-12 flex flex-col items-center space-y-6 w-full max-w-xs">
          <button 
            onClick={() => navigate('/qr')}
            className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-white text-black rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-gray-100 transition-all active:scale-95 shadow-xl"
          >
            <QrCode className="w-5 h-5" />
            <span>My QR Code</span>
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan-line {
          0% { top: 0; }
          100% { top: 100%; }
        }
        .animate-scan-line {
          animation: scan-line 2s linear infinite;
        }
      `}} />
    </div>
  );
}
