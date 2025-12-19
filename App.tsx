
import React, { useState, useCallback, useRef, useEffect } from 'react';
import PinkParticleTreeScene from './components/PinkParticleTreeScene';
import HandTracker from './components/HandTracker';

export interface WishData {
  id: number;
  text: string;
}

export type GalleryMode = 'TREE' | 'SPREAD' | 'ZOOM';

export interface PhotoData {
  id: string;
  url: string;
  aspectRatio: number;
  message: string;
}

const App: React.FC = () => {
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [isHandOpen, setIsHandOpen] = useState(false);
  const [isHeart, setIsHeart] = useState(false);
  const [isFist, setIsFist] = useState(false);
  const [isPinching, setIsPinching] = useState(false);
  const [handPos, setHandPos] = useState({ x: 0.5, y: 0.5 });
  
  const [galleryMode, setGalleryMode] = useState<GalleryMode>('TREE');
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [jumpToIdx, setJumpToIdx] = useState<number | null>(null);

  const [loveRecipient, setLoveRecipient] = useState('U');
  const [isEditingRecipient, setIsEditingRecipient] = useState(false);

  const [wishText, setWishText] = useState('');
  const [wishes, setWishes] = useState<WishData[]>([]);
  const [treePulse, setTreePulse] = useState(0);
  const wishIdRef = useRef(0);

  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleHandUpdate = useCallback((isOpen: boolean, isHeartDetected: boolean, isFistDetected: boolean, isPinchDetected: boolean, position: { x: number, y: number }) => {
    setIsHandOpen(isOpen);
    setIsHeart(isHeartDetected);
    setIsFist(isFistDetected);
    setIsPinching(isPinchDetected);
    setHandPos(position);

    if (isFistDetected) {
      setGalleryMode('TREE');
      setSelectedPhotoId(null);
    } else if (isOpen) {
      if (galleryMode === 'TREE') setGalleryMode('SPREAD');
    }
    
    if (isPinchDetected && galleryMode === 'SPREAD') {
      setGalleryMode('ZOOM');
    } else if (!isPinchDetected && galleryMode === 'ZOOM') {
      setGalleryMode('SPREAD');
    }
  }, [galleryMode]);

  const sendWish = () => {
    if (!wishText.trim()) return;
    const newWish = { id: wishIdRef.current++, text: wishText };
    setWishes(prev => [...prev, newWish]);
  };

  const onWishArrival = useCallback((id: number) => {
    setWishes(prev => prev.filter(w => w.id !== id));
    setTreePulse(1.0);
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const aspectRatio = img.width / img.height;
          setPhotos(prev => [...prev, {
            id: Math.random().toString(36).substring(2, 11),
            url,
            aspectRatio,
            message: wishText.trim() || 'Merry Christmas'
          }]);
        };
        img.src = url;
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="relative w-full h-full bg-[#050205] text-white overflow-hidden font-sans select-none">
      <PinkParticleTreeScene 
        isHandOpen={isHandOpen} 
        handPos={handPos} 
        isFist={isFist}
        isHeart={isHeart}
        galleryMode={galleryMode}
        wishes={wishes}
        onWishArrival={onWishArrival}
        treePulse={treePulse}
        setTreePulse={setTreePulse}
        photos={photos}
        selectedPhotoId={selectedPhotoId}
        onSelectPhoto={setSelectedPhotoId}
        onIndexChange={setActivePhotoIdx}
        jumpToIdx={jumpToIdx}
      />

      {/* 2D Thumbnail Navigation Bar - Only shown in SPREAD mode */}
      <div className={`absolute bottom-32 left-0 w-full flex justify-center px-8 transition-all duration-500 z-50 ${galleryMode === 'SPREAD' && photos.length > 0 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
        <div className="flex gap-3 overflow-x-auto pb-4 max-w-full no-scrollbar px-10 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 py-4 shadow-2xl">
          {photos.map((photo, idx) => (
            <button
              key={photo.id}
              onClick={() => setJumpToIdx(idx)}
              className={`relative flex-shrink-0 w-16 h-20 rounded-lg overflow-hidden border-2 transition-all duration-300 transform ${activePhotoIdx === idx ? 'border-pink-500 scale-110 shadow-[0_0_15px_rgba(236,72,153,0.5)]' : 'border-white/20 hover:border-white/50 scale-100'}`}
            >
              <img src={photo.url} className="w-full h-full object-cover" alt="nav thumb" />
              <div className={`absolute inset-0 bg-pink-500/20 transition-opacity ${activePhotoIdx === idx ? 'opacity-100' : 'opacity-0'}`} />
            </button>
          ))}
        </div>
      </div>

      <div className="absolute top-12 left-12 text-left pointer-events-none z-10">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-widest text-pink-300 drop-shadow-[0_0_15px_rgba(255,105,180,0.6)] mb-2 uppercase">
          Merry Christmas
        </h1>
        <div className="h-[2px] w-24 bg-pink-500/50 mb-3"></div>
        <p className="text-[10px] text-yellow-200/60 uppercase tracking-[0.4em]">
          Mode: {galleryMode} | Hand: {isFist ? 'Fist' : isHandOpen ? 'Palm' : 'None'}
        </p>
        
        <div className="mt-4 pointer-events-auto flex gap-2">
           <button 
             onClick={() => fileInputRef.current?.click()} 
             className="text-[10px] border border-pink-500/30 px-3 py-1 rounded bg-black/60 hover:bg-pink-500/40 transition-all uppercase tracking-widest backdrop-blur-md"
           >
             Upload Polaroid +
           </button>
           <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" multiple className="hidden" />
        </div>
      </div>

      <div className={`absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-30 transition-all duration-700 ${isHeart ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
        <div className="relative">
          <h2 className="cursive-font text-8xl md:text-[12rem] text-yellow-400 drop-shadow-[0_0_30px_rgba(255,215,0,0.9)]">
              I Love {loveRecipient}
          </h2>
          <div className="absolute -bottom-4 right-0 pointer-events-auto">
             <button 
               onClick={() => setIsEditingRecipient(true)}
               className="text-[10px] bg-pink-500/20 hover:bg-pink-500/40 px-2 py-1 rounded text-pink-200 border border-pink-500/30"
             >
               Edit Name
             </button>
          </div>
        </div>
      </div>

      {isEditingRecipient && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center">
          <div className="bg-zinc-900 border border-pink-500/50 p-8 rounded-2xl shadow-2xl max-w-xs w-full text-center">
            <h3 className="text-pink-300 font-bold mb-4 uppercase tracking-widest">Who do you love?</h3>
            <input 
              autoFocus
              className="w-full bg-black border-b border-pink-500 px-4 py-2 text-center text-2xl outline-none text-yellow-400 font-serif mb-6"
              value={loveRecipient}
              onChange={(e) => setLoveRecipient(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingRecipient(false)}
            />
            <button 
              onClick={() => setIsEditingRecipient(false)}
              className="w-full bg-pink-600 hover:bg-pink-500 py-3 rounded-full font-bold uppercase tracking-widest transition-all"
            >
              Confirm
            </button>
          </div>
        </div>
      )}

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-6 w-full max-w-md px-6">
        <div className="flex w-full items-center bg-black/60 backdrop-blur-2xl rounded-full border border-pink-500/40 overflow-hidden shadow-[0_0_30px_rgba(255,105,180,0.2)] focus-within:border-pink-500/80 transition-all">
          <input 
            type="text" 
            value={wishText}
            onChange={(e) => setWishText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendWish()}
            placeholder="Write a message for your polaroid..."
            className="flex-1 bg-transparent px-6 py-4 text-pink-100 outline-none text-sm placeholder-pink-300/30"
          />
          <button 
            onClick={sendWish} 
            className="px-8 py-4 bg-pink-500/30 hover:bg-pink-500/50 text-pink-100 text-xs font-bold uppercase tracking-widest transition-colors"
          >
            Send
          </button>
        </div>
        
        <div className="flex gap-6 text-pink-200/50">
           <div className="flex flex-col items-center gap-1">
              <span className="text-sm">✊</span>
              <span className="text-[8px] uppercase tracking-tighter">Tree</span>
           </div>
           <div className="flex flex-col items-center gap-1">
              <span className="text-sm">🖐️</span>
              <span className="text-[8px] uppercase tracking-tighter">Gallery</span>
           </div>
           <div className="flex flex-col items-center gap-1">
              <span className="text-sm">👌</span>
              <span className="text-[8px] uppercase tracking-tighter">Zoom Focus</span>
           </div>
        </div>
      </div>

      <div className="absolute top-10 right-10 z-20">
        <button 
          onClick={() => setCameraEnabled(!cameraEnabled)}
          className={`flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border transition-all ${cameraEnabled ? 'border-pink-500 shadow-[0_0_15px_rgba(255,105,180,0.3)]' : 'border-pink-500/30'}`}
        >
          <span className="text-[10px] font-bold tracking-widest uppercase text-pink-100">Magic Sensor</span>
          <div className={`w-8 h-4 rounded-full relative transition-colors ${cameraEnabled ? 'bg-pink-500' : 'bg-gray-700'}`}>
            <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${cameraEnabled ? 'left-4.5' : 'left-0.5'}`} />
          </div>
        </button>
      </div>

      {cameraEnabled && <HandTracker onUpdate={handleHandUpdate} />}
    </div>
  );
};

export default App;
