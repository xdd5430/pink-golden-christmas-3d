
import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { CONFIG } from '../constants';
import PinkTreeParticles from './PinkTreeParticles';
import SnowParticles from './SnowParticles';
import BaseRings from './BaseRings';
import SceneEffects from './SceneEffects';
import WishStar from './WishStar';
import HeartTopper from './HeartTopper';
import PhotoOrnaments from './PhotoOrnaments';
import StarExplosion from './StarExplosion';
import HeartRain from './HeartRain';
import { PhotoData, GalleryMode } from '../App';

const Group = 'group' as any;
const Color = 'color' as any;

const InteractionWrapper: React.FC<{ 
  handPos: { x: number, y: number }, 
  galleryMode: GalleryMode,
  isFist: boolean,
  children: React.ReactNode
}> = ({ handPos, galleryMode, isFist, children }) => {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame(() => {
    if (!groupRef.current) return;
    
    const lerpFactor = galleryMode === 'ZOOM' ? 0.02 : 0.06;
    const movementScale = galleryMode === 'ZOOM' ? 0.4 : 4.5;

    if (galleryMode === 'SPREAD' || galleryMode === 'ZOOM') {
      const targetX = (handPos.x - 0.5) * movementScale;
      const targetY = -(handPos.y - 0.5) * movementScale;
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, lerpFactor);
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, lerpFactor);
      
      const rotY = (handPos.x - 0.5) * (galleryMode === 'ZOOM' ? 0.05 : 0.8);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, rotY, lerpFactor);
    } else {
      groupRef.current.position.set(0, 0, 0);
      if (isFist) {
        groupRef.current.rotation.y += ( (handPos.x - 0.5) * 2 - groupRef.current.rotation.y ) * 0.1;
      }
    }
  });

  return <Group ref={groupRef}>{children}</Group>;
};

const TreeLayer: React.FC<{ 
  treePulse: number,
  setTreePulse: (v: number) => void,
  galleryMode: GalleryMode
}> = ({ treePulse, setTreePulse, galleryMode }) => {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame((state, delta) => {
    if (groupRef.current) {
      const targetScale = galleryMode === 'TREE' ? 1.0 : 0.4;
      const targetY = galleryMode === 'TREE' ? -CONFIG.TREE_HEIGHT / 2 : -CONFIG.TREE_HEIGHT / 2 - 8;
      
      groupRef.current.scale.setScalar(THREE.MathUtils.lerp(groupRef.current.scale.x, targetScale, 0.08));
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.08);

      if (treePulse > 0) {
        setTreePulse(Math.max(0, treePulse - delta * 1.5));
      }
    }
  });

  return (
    <Group ref={groupRef}>
      <PinkTreeParticles wishEnergy={treePulse} />
      <BaseRings />
      <HeartTopper pulse={treePulse} />
    </Group>
  );
};

interface PinkParticleTreeSceneProps {
  isHandOpen: boolean;
  isFist: boolean;
  isHeart: boolean;
  handPos: { x: number, y: number };
  galleryMode: GalleryMode;
  wishes: { id: number; text: string }[];
  onWishArrival: (id: number) => void;
  treePulse: number;
  setTreePulse: (v: number) => void;
  photos: PhotoData[];
  selectedPhotoId: string | null;
  onSelectPhoto: (id: string | null) => void;
  onIndexChange?: (idx: number) => void;
  jumpToIdx?: number | null;
}

const PinkParticleTreeScene: React.FC<PinkParticleTreeSceneProps> = ({ 
  isHandOpen, isFist, isHeart, handPos, galleryMode, wishes, onWishArrival, treePulse, setTreePulse, photos, selectedPhotoId, onSelectPhoto, onIndexChange, jumpToIdx
}) => {
  const [explosions, setExplosions] = useState<{ id: number; pos: [number, number, number] }[]>([]);

  const handleWishArrival = (id: number) => {
    const explosionPos: [number, number, number] = [0, -CONFIG.TREE_HEIGHT / 2 + CONFIG.TREE_HEIGHT + 0.2, 0];
    setExplosions(prev => [...prev, { id: Date.now(), pos: explosionPos }]);
    onWishArrival(id);
  };

  return (
    <Canvas
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      dpr={[1, 2]}
    >
      <Color attach="background" args={['#050205']} />
      <PerspectiveCamera makeDefault position={[0, 0, 20]} fov={40} />
      
      <OrbitControls 
        enableRotate={galleryMode === 'TREE'} 
        enableZoom={false}
        enablePan={false}
        autoRotate={galleryMode === 'TREE' && !isFist}
        autoRotateSpeed={0.5}
      />

      <InteractionWrapper handPos={handPos} galleryMode={galleryMode} isFist={isFist}>
        <TreeLayer treePulse={treePulse} setTreePulse={setTreePulse} galleryMode={galleryMode} />
        
        <PhotoOrnaments 
          photos={photos} 
          galleryMode={galleryMode} 
          handPos={handPos}
          selectedPhotoId={selectedPhotoId}
          onSelectPhoto={onSelectPhoto}
          onIndexChange={onIndexChange}
          jumpToIdx={jumpToIdx}
        />

        {explosions.map(exp => (
          <StarExplosion 
            key={exp.id} 
            position={exp.pos} 
            onComplete={() => setExplosions(prev => prev.filter(e => e.id !== exp.id))} 
          />
        ))}
      </InteractionWrapper>

      <SnowParticles />
      <HeartRain active={isHeart} />

      {wishes.map((wish) => (
        <WishStar 
          key={wish.id} 
          id={wish.id} 
          onArrived={() => handleWishArrival(wish.id)} 
        />
      ))}

      <SceneEffects />
    </Canvas>
  );
};

export default PinkParticleTreeScene;
