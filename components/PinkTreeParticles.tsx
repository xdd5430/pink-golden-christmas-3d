
import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { CONFIG } from '../constants';

// Fix for JSX intrinsic element errors
const Points = 'points' as any;
const BufferGeometry = 'bufferGeometry' as any;
const BufferAttribute = 'bufferAttribute' as any;
const ShaderMaterial = 'shaderMaterial' as any;

const vertexShader = `
  uniform float uTime;
  uniform float uHeight;
  uniform float uWishEnergy;
  attribute float aSize;
  attribute vec3 aRandom;
  
  varying float vHeightPercent;
  varying float vRandomAlpha;
  varying float vWishBoost;

  void main() {
    vec3 pos = position;
    
    pos.x += sin(uTime * 0.5 + aRandom.x * 10.0) * 0.01;
    pos.z += cos(uTime * 0.5 + aRandom.z * 10.0) * 0.01;

    pos.xz *= (1.0 + uWishEnergy * 0.05);

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    
    gl_PointSize = (aSize * (1.0 + uWishEnergy)) * (80.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;

    vHeightPercent = pos.y / uHeight;
    vRandomAlpha = 0.8 + 0.2 * sin(uTime * 3.0 + aRandom.y * 50.0);
    vWishBoost = uWishEnergy;
  }
`;

const fragmentShader = `
  varying float vHeightPercent;
  varying float vRandomAlpha;
  varying float vWishBoost;
  
  uniform vec3 uColorWhite;
  uniform vec3 uColorPink;
  uniform vec3 uColorPinkDark;
  uniform vec3 uColorGold;

  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.45) discard;
    
    float edge = smoothstep(0.45, 0.4, dist);
    float alpha = edge * vRandomAlpha;

    vec3 baseColor = mix(uColorPinkDark, uColorPink, vHeightPercent);
    baseColor *= (1.0 + vWishBoost * 2.0);
    
    float core = pow(max(0.0, 1.0 - dist * 2.5), 8.0); 
    vec3 coreColor = mix(baseColor, uColorGold, core * 0.5);
    
    vec3 finalColor = mix(coreColor, uColorWhite, smoothstep(0.98, 1.0, vHeightPercent));

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

interface PinkTreeParticlesProps {
  wishEnergy?: number;
}

const PinkTreeParticles: React.FC<PinkTreeParticlesProps> = ({ wishEnergy = 0 }) => {
  const meshRef = useRef<THREE.Points>(null!);
  const count = CONFIG.TREE_PARTICLES;

  const { positions, sizes, randoms } = useMemo(() => {
    const posArray = new Float32Array(count * 3);
    const sizeArray = new Float32Array(count);
    const randArray = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const y = Math.random() * CONFIG.TREE_HEIGHT;
      const t = y / CONFIG.TREE_HEIGHT;
      const radius = (1.0 - t) * CONFIG.TREE_BASE_RADIUS;
      
      const angle = Math.random() * Math.PI * 2;
      const isSurface = Math.random() > 0.4;
      const r = isSurface 
        ? radius * (0.97 + Math.random() * 0.03) 
        : (0.2 + Math.random() * 0.8) * radius; 
      
      posArray[i * 3 + 0] = Math.cos(angle) * r;
      posArray[i * 3 + 1] = y;
      posArray[i * 3 + 2] = Math.sin(angle) * r;

      sizeArray[i] = 0.6 + Math.random() * 1.2;
      if (y > CONFIG.TREE_HEIGHT * 0.98) sizeArray[i] *= 1.4;

      randArray[i * 3 + 0] = Math.random();
      randArray[i * 3 + 1] = Math.random();
      randArray[i * 3 + 2] = Math.random();
    }

    return { positions: posArray, sizes: sizeArray, randoms: randArray };
  }, [count]);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uHeight: { value: CONFIG.TREE_HEIGHT },
    uWishEnergy: { value: 0 },
    uColorWhite: { value: new THREE.Color(CONFIG.COLORS.WHITE_TOP) },
    uColorPink: { value: new THREE.Color(CONFIG.COLORS.PINK_MAIN) },
    uColorPinkDark: { value: new THREE.Color(CONFIG.COLORS.PINK_DARK) },
    uColorGold: { value: new THREE.Color(CONFIG.COLORS.GOLD_HALO) }
  }), []);

  useFrame((state) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.ShaderMaterial;
      material.uniforms.uTime.value = state.clock.elapsedTime;
      material.uniforms.uWishEnergy.value = wishEnergy;
    }
  });

  return (
    <Points ref={meshRef} frustumCulled={false}>
      <BufferGeometry>
        <BufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
        <BufferAttribute attach="attributes-aSize" count={sizes.length} array={sizes} itemSize={1} />
        <BufferAttribute attach="attributes-aRandom" count={randoms.length / 3} array={randoms} itemSize={3} />
      </BufferGeometry>
      <ShaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
};

export default PinkTreeParticles;
