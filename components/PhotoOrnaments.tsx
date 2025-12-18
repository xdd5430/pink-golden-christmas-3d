
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
  ctx.shadowColor = 'rgba(255, 215, 0, 0.6)';
  ctx.shadowBlur = 12;
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
  const { camera } = useThree();
  
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
    const radius = (1.0 - t) * CONFIG.TREE_BASE_RADIUS + 0.3;
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

    if (galleryMode === 'SPREAD' || galleryMode === 'ZOOM') {
      const spacing = 4.5; // 水平间距
      const xOffset = (index - scrollPos) * spacing;
      
      targetPos.set(xOffset, 0, 8); 
      
      const m = new THREE.Matrix4();
      m.lookAt(meshRef.current.position, camera.position, new THREE.Vector3(0, 1, 0));
      targetQuat.setFromRotationMatrix(m);

      if (galleryMode === 'ZOOM') {
        if (isZoomed) {
          // 绝对居中：抵消 InteractionWrapper 的视差偏移
          const parentPos = meshRef.current.parent ? meshRef.current.parent.position : new THREE.Vector3();
          const camDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
          const worldTarget = camera.position.clone().add(camDir.multiplyScalar(6.0));
          
          targetPos.copy(worldTarget).sub(parentPos);
          targetQuat.copy(camera.quaternion);
          targetScale = 4.5;
        } else {
          targetScale = 0.01; // 非选中照片完全隐藏或下沉
          targetPos.y -= 15;
        }
      } else {
        targetScale = isFocused ? 1.6 : 0.9;
        if (isFocused) {
          targetPos.z += 1.5;
        }
      }
    }

    meshRef.current.position.lerp(targetPos, 0.1);
    meshRef.current.quaternion.slerp(targetQuat, 0.1);
    meshRef.current.scale.setScalar(THREE.MathUtils.lerp(meshRef.current.scale.x, targetScale, 0.1));
  });

  const photoW = 1.4;
  const photoH = photoW / photo.aspectRatio;
  const frameW = photoW + 0.2;
  const frameH = photoH + 0.5;

  return (
    <Group ref={meshRef}>
      <Mesh position={[0, -0.15, -0.01]}>
        <PlaneGeometry args={[frameW, frameH]} />
        <MeshBasicMaterial color="#FFFFFF" side={THREE.DoubleSide} />
      </Mesh>
      <Mesh position={[0, 0, 0]}>
        <PlaneGeometry args={[photoW, photoH]} />
        <MeshBasicMaterial map={texture} side={THREE.DoubleSide} toneMapped={false} />
      </Mesh>
      {textTexture && (
        <Mesh position={[0, -photoH / 2 - 0.2, 0.01]}>
          <PlaneGeometry args={[frameW * 0.9, 0.3]} />
          <MeshBasicMaterial map={textTexture} transparent side={THREE.DoubleSide} />
        </Mesh>
      )}
      <Mesh position={[0, -0.15, -0.02]}>
        <PlaneGeometry args={[frameW + 0.04, frameH + 0.04]} />
        <MeshBasicMaterial color="#FFD700" side={THREE.DoubleSide} opacity={isFocused ? 0.7 : 0.2} transparent />
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
}

const PhotoOrnaments: React.FC<PhotoOrnamentsProps> = ({ photos, galleryMode, handPos, selectedPhotoId, onSelectPhoto }) => {
  const [scrollPos, setScrollPos] = useState(0);
  const [treeFocusedIdx, setTreeFocusedIdx] = useState(0);
  const prevHandX = useRef(handPos.x);
  const prevMode = useRef(galleryMode);

  // 1. 焦点继承逻辑：在树模式下预锁定的索引
  useFrame(() => {
    if (galleryMode === 'TREE' && photos.length > 0) {
      const idx = Math.floor(handPos.x * photos.length);
      setTreeFocusedIdx(Math.max(0, Math.min(photos.length - 1, idx)));
    }
  });

  useEffect(() => {
    // 刚进入相册模式时，将滚动位置同步到树模式下看到的照片
    if (prevMode.current === 'TREE' && galleryMode === 'SPREAD') {
      setScrollPos(treeFocusedIdx);
      prevHandX.current = handPos.x;
    }
    prevMode.current = galleryMode;
  }, [galleryMode, treeFocusedIdx]);

  // 2. 动力学滑动
  useFrame(() => {
    if ((galleryMode === 'SPREAD' || galleryMode === 'ZOOM') && photos.length > 0) {
      const deltaX = handPos.x - prevHandX.current;
      
      // 灵敏度系数，手部小幅度移动即可大幅滑动
      const sensitivity = 18; 
      const targetScroll = scrollPos + deltaX * sensitivity;
      const clampedScroll = Math.max(0, Math.min(photos.length - 1, targetScroll));
      
      setScrollPos(THREE.MathUtils.lerp(scrollPos, clampedScroll, 0.15));
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
