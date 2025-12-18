
import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { CONFIG } from '../constants';

// Fix for JSX intrinsic element errors
const Group = 'group' as any;
const Points = 'points' as any;
const BufferGeometry = 'bufferGeometry' as any;
const BufferAttribute = 'bufferAttribute' as any;
const PointsMaterial = 'pointsMaterial' as any;

const BaseRings: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null!);
  const count = CONFIG.RING_PARTICLES;

  const particles = useMemo(() => {
    const rings = [
      { radius: CONFIG.TREE_BASE_RADIUS * 1.1, count: Math.floor(count / 3), speed: 0.3, yOffset: 0.1 },
      { radius: CONFIG.TREE_BASE_RADIUS * 1.3, count: Math.floor(count / 3), speed: -0.2, yOffset: 0.3 },
      { radius: CONFIG.TREE_BASE_RADIUS * 1.5, count: Math.floor(count / 3), speed: 0.15, yOffset: 0.5 },
    ];

    return rings.map((ring) => {
      const pos = new Float32Array(ring.count * 3);
      for (let i = 0; i < ring.count; i++) {
        const angle = (i / ring.count) * Math.PI * 2;
        const randomR = ring.radius + (Math.random() - 0.5) * 0.5;
        pos[i * 3 + 0] = Math.cos(angle) * randomR;
        pos[i * 3 + 1] = ring.yOffset + (Math.random() - 0.5) * 0.2;
        pos[i * 3 + 2] = Math.sin(angle) * randomR;
      }
      return { pos, ...ring };
    });
  }, [count]);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child, idx) => {
        child.rotation.y = state.clock.elapsedTime * particles[idx].speed;
      });
    }
  });

  return (
    <Group ref={groupRef}>
      {particles.map((ring, idx) => (
        <Points key={idx}>
          <BufferGeometry>
            <BufferAttribute
              attach="attributes-position"
              count={ring.pos.length / 3}
              array={ring.pos}
              itemSize={3}
            />
          </BufferGeometry>
          <PointsMaterial
            size={0.15}
            color={CONFIG.COLORS.GOLD_HALO}
            transparent
            opacity={0.8}
            blending={THREE.AdditiveBlending}
            sizeAttenuation
          />
        </Points>
      ))}
    </Group>
  );
};

export default BaseRings;
