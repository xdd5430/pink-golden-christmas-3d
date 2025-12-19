
import React, { useMemo, useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { CONFIG } from '../constants';
import { PhotoData, GalleryMode } from '../App';

const Group = 'group' as any;
const Mesh = 'mesh' as any;
const PlaneGeometry = 'planeGeometry' as any;
const MeshBasicMaterial = 'meshBasicMaterial' as any;

const createTextTexture = (text: string) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  canvas.width = 512;
  canvas.height = 128;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = 'italic 44px "Great Vibes", cursive, serif';
  ctx.fillStyle = '#FFD700';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
  ctx.shadowBlur = 15;
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
};

interface PhotoMeshProps {
  photo: PhotoData;
  index: number;
  total: number;
  galleryMode: GalleryMode;
  scrollPos: number;
  isFocused: boolean;
  isZoomed: boolean;
}

const PhotoMesh: React.FC<PhotoMeshProps> = ({ photo, index, total, galleryMode, scrollPos, isFocused, isZoomed }) => {
  const meshRef = useRef<THREE.Group>(null!);
  const photoMatRef = useRef<THREE.MeshBasicMaterial>(null!);
  const { camera, size } = useThree();
  
  const texture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const tex = loader.load(photo.url);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [photo.url]);

  const textTexture = useMemo(() => createTextTexture(photo.message), [photo.message]);

  const treeTargets = useMemo(() => {
    const yPercent = 0.2 + (index * 0.15) % 0.6;
    const y = yPercent * CONFIG.TREE_HEIGHT - CONFIG.TREE_HEIGHT/2;
    const t = (y + CONFIG.TREE_HEIGHT/2) / CONFIG.TREE_HEIGHT;
    const radius = (1.0 - t) * CONFIG.TREE_BASE_RADIUS + 0.35;
    const angle = (index * (Math.PI * 2 / 5));
    return {
      pos: new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius),
      rot: new THREE.Euler(0, -angle + Math.PI / 2, 0)
    };
  }, [index]);

  useFrame(() => {
    if (!meshRef.current) return;

    let targetPos = treeTargets.pos.clone();
    let targetQuat = new THREE.Quaternion().setFromEuler(treeTargets.rot);
    let targetScale = 1.0;
    let targetOpacity = 1.0;

    if (galleryMode === 'SPREAD') {
      const spacing = 5.5;
      const xOffset = (index - scrollPos) * spacing;
      targetPos.set(xOffset, 0, 8);
      const m = new THREE.Matrix4();
      m.lookAt(meshRef.current.position, camera.position, new THREE.Vector3(0, 1, 0));
      targetQuat.setFromRotationMatrix(m);
      targetScale = isFocused ? 2.2 : 1.2;
      targetOpacity = isFocused ? 1.0 : 0.75;
      targetPos.z += isFocused ? 2.0 : 0.5;
    }

    if (galleryMode === 'ZOOM') {
      if (isZoomed) {
        const distance = 8.0;
        const worldDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        const worldCenter = camera.position.clone().add(worldDir.multiplyScalar(distance));
        const parentWorldPos = new THREE.Vector3();
        meshRef.current.parent?.getWorldPosition(parentWorldPos);
        targetPos.copy(worldCenter).sub(parentWorldPos);
        targetQuat.copy(camera.quaternion);
        const vFov = THREE.MathUtils.degToRad((camera as THREE.PerspectiveCamera).fov);
        const visibleHeight = 2 * Math.tan(vFov / 2) * distance;
        const visibleWidth = visibleHeight * (size.width / size.height);
        const frameW = 1.6 + 0.25;
        const frameH = 1.6 / photo.aspectRatio + 0.6;
        targetScale = Math.min(visibleHeight / frameH, visibleWidth / frameW) * 0.85;
        targetOpacity = 1.0;
      } else {
        targetScale = 0.001;
        targetOpacity = 0.0;
        targetPos.y -= 20;
      }
    }

    meshRef.current.position.lerp(targetPos, 0.15);
    meshRef.current.quaternion.slerp(targetQuat, 0.15);
    meshRef.current.scale.setScalar(THREE.MathUtils.lerp(meshRef.current.scale.x, targetScale, 0.2));

    if (photoMatRef.current) {
      photoMatRef.current.opacity = THREE.MathUtils.lerp(photoMatRef.current.opacity, targetOpacity, 0.1);
    }
  });

  const photoW = 1.6;
  const photoH = photoW / photo.aspectRatio;
  const frameW = photoW + 0.25;
  const frameH = photoH + 0.6;

  return (
    <Group ref={meshRef}>
      <Mesh position={[0, -0.15, -0.01]}>
        <PlaneGeometry args={[frameW, frameH]} />
        <MeshBasicMaterial color="#FFFFFF" transparent opacity={0.98} side={THREE.DoubleSide} />
      </Mesh>
      <Mesh position={[0, 0, 0.02]}>
        <PlaneGeometry args={[photoW, photoH]} />
        <MeshBasicMaterial 
          ref={photoMatRef}
          map={texture} 
          side={THREE.DoubleSide} 
          toneMapped={false} 
          transparent
        />
      </Mesh>
      {textTexture && (
        <Mesh position={[0, -photoH / 2 - 0.25, 0.03]}>
          <PlaneGeometry args={[frameW * 0.9, 0.35]} />
          <MeshBasicMaterial map={textTexture} transparent side={THREE.DoubleSide} />
        </Mesh>
      )}
      <Mesh position={[0, -0.15, -0.02]}>
        <PlaneGeometry args={[frameW + 0.06, frameH + 0.06]} />
        <MeshBasicMaterial color="#FFD700" side={THREE.DoubleSide} opacity={isFocused ? 0.9 : 0.2} transparent />
      </Mesh>
    </Group>
  );
};

interface PhotoOrnamentsProps {
  photos: PhotoData[];
  galleryMode: GalleryMode;
  handPos: { x: number, y: number };
  selectedPhotoId: string | null;
  onSelectPhoto: (id: string | null) => void;
  onIndexChange?: (idx: number) => void;
  jumpToIdx?: number | null;
}

const PhotoOrnaments: React.FC<PhotoOrnamentsProps> = ({
  photos,
  galleryMode,
  handPos,
  selectedPhotoId,
  onSelectPhoto,
  onIndexChange,
  jumpToIdx
}) => {
  const [scrollPos, setScrollPos] = useState(0);
  const prevHandX = useRef(handPos.x);
  const prevMode = useRef(galleryMode);
  const scrollVelocity = useRef(0);
  const lastActiveIdx = useRef(-1);

  // Sync index to parent
  useEffect(() => {
    const currentIdx = Math.round(scrollPos);
    if (currentIdx !== lastActiveIdx.current && photos.length > 0) {
      lastActiveIdx.current = currentIdx;
      onIndexChange?.(currentIdx);
    }
  }, [scrollPos, photos.length, onIndexChange]);

  // Handle jumping to index from 2D nav
  useEffect(() => {
    if (jumpToIdx !== null && jumpToIdx !== undefined && photos.length > 0) {
      setScrollPos(jumpToIdx);
      scrollVelocity.current = 0;
    }
  }, [jumpToIdx, photos.length]);

  useEffect(() => {
    if (prevMode.current !== galleryMode) {
      scrollVelocity.current = 0;
      prevHandX.current = handPos.x;
    }
    prevMode.current = galleryMode;
  }, [galleryMode, handPos.x]);

  useFrame(() => {
    if (galleryMode === 'SPREAD' || galleryMode === 'ZOOM') {
      const deltaX = handPos.x - prevHandX.current;
      scrollVelocity.current += deltaX * 60;
      scrollVelocity.current *= 0.85;
      let nextScroll = scrollPos + scrollVelocity.current * 0.016;
      nextScroll = THREE.MathUtils.clamp(nextScroll, 0, photos.length - 1);
      setScrollPos(nextScroll);
      prevHandX.current = handPos.x;
    }
  });

  const currentFocusedIdx = Math.round(scrollPos);
  const focusedId = photos[currentFocusedIdx]?.id || null;

  return (
    <Group>
      {photos.map((photo, i) => (
        <PhotoMesh
          key={photo.id}
          photo={photo}
          index={i}
          total={photos.length}
          galleryMode={galleryMode}
          scrollPos={scrollPos}
          isFocused={focusedId === photo.id}
          isZoomed={galleryMode === 'ZOOM' && focusedId === photo.id}
        />
      ))}
    </Group>
  );
};

export default PhotoOrnaments;
