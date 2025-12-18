
import React, { useEffect, useRef } from 'react';

interface HandTrackerProps {
  onUpdate: (isOpen: boolean, isHeart: boolean, isFist: boolean, isPinch: boolean, position: { x: number, y: number }) => void;
}

const HandTracker: React.FC<HandTrackerProps> = ({ onUpdate }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraRef = useRef<any>(null);

  useEffect(() => {
    let hands: any = null;
    
    const initHands = () => {
        hands = new (window as any).Hands({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });

        hands.setOptions({
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.7
        });

        hands.onResults((results: any) => {
          if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const allLandmarks = results.multiHandLandmarks;
            const mainHand = allLandmarks[0];
            
            const wrist = mainHand[0];
            const thumbTip = mainHand[4];
            const indexTip = mainHand[8];
            const pos = { x: wrist.x, y: wrist.y };

            const getDist = (p1: any, p2: any) => Math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2);
            
            const fingerTips = [8, 12, 16, 20];
            const openDistances = fingerTips.map(idx => getDist(wrist, mainHand[idx]));
            const avgDist = openDistances.reduce((a, b) => a + b, 0) / 4;
            
            const isOpen = avgDist > 0.4;
            const isFist = avgDist < 0.25;
            
            // 捏合：大拇指和食指尖端非常接近
            const isPinch = getDist(thumbTip, indexTip) < 0.05;

            let isHeart = false;
            if (allLandmarks.length === 2) {
                const h1 = allLandmarks[0];
                const h2 = allLandmarks[1];
                const indexDist = getDist(h1[8], h2[8]);
                const thumbDist = getDist(h1[4], h2[4]);
                // 双手比心检测
                if (indexDist < 0.1 && thumbDist < 0.1) isHeart = true;
            }

            onUpdate(isOpen, isHeart, isFist, isPinch, pos);
          } else {
            onUpdate(false, false, false, false, { x: 0.5, y: 0.5 });
          }
        });
    };

    initHands();

    if (videoRef.current) {
      cameraRef.current = new (window as any).Camera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current && videoRef.current.readyState >= 2) {
            try {
              await hands.send({ image: videoRef.current });
            } catch (e) {}
          }
        },
        width: 320,
        height: 240
      });
      cameraRef.current.start();
    }

    return () => {
      if (cameraRef.current) cameraRef.current.stop();
      if (hands) hands.close();
    };
  }, [onUpdate]);

  return (
    <video 
      ref={videoRef} 
      className="fixed bottom-4 left-4 w-40 h-30 rounded-lg border border-pink-500/30 scale-x-[-1] opacity-60 pointer-events-none z-50 bg-black shadow-lg" 
      autoPlay 
      playsInline 
    />
  );
};

export default HandTracker;
