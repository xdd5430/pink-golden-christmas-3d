
import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { CONFIG } from '../constants';

// Fix for JSX intrinsic element errors
const Points = 'points' as any;
const BufferGeometry = 'bufferGeometry' as any;
const BufferAttribute = 'bufferAttribute' as any;
const PointsMaterial = 'pointsMaterial' as any;

const SnowParticles: React.FC = () => {
  const meshRef = useRef<THREE.Points>(null!);
  const count = CONFIG.SNOW_PARTICLES;

  const [positions, speeds, phases] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const speed = new Float32Array(count);
    const phase = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * 60;
      pos[i * 3 + 1] = Math.random() * 40 - 10;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 60;
      
      speed[i] = 1 + Math.random() * 2;
      phase[i] = Math.random() * Math.PI * 2;
    }
    return [pos, speed, phase];
  }, [count]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const positionAttribute = meshRef.current.geometry.getAttribute('position');
    
    for (let i = 0; i < count; i++) {
      let y = positionAttribute.getY(i);
      let x = positionAttribute.getX(i);
      
      y -= speeds[i] * delta * 2;
      x += Math.sin(state.clock.elapsedTime + phases[i]) * 0.01;
      
      if (y < -10) {
        y = 30;
      }
      
      positionAttribute.setY(i, y);
      positionAttribute.setX(i, x);
    }
    positionAttribute.needsUpdate = true;
  });

  return (
    <Points ref={meshRef} frustumCulled={false}>
      <BufferGeometry>
        <BufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </BufferGeometry>
      <PointsMaterial
        size={0.08}
        color={CONFIG.COLORS.SNOW}
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
};

export default SnowParticles;
