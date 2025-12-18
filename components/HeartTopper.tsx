
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
  uniform float uPulse;
  attribute float aSize;
  attribute float aRandom;
  varying float vAlpha;
  varying float vDist;

  void main() {
    vec3 pos = position;
    float breathing = sin(uTime * 1.5 + aRandom * 10.0) * 0.04;
    pos *= (1.0 + breathing + uPulse * 0.4);
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = aSize * (150.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;

    vAlpha = 0.4 + 0.6 * sin(uTime * 1.5 + aRandom * 20.0);
    vDist = length(position);
  }
`;

const fragmentShader = `
  varying float vAlpha;
  varying float vDist;
  uniform vec3 uColorCore;
  uniform vec3 uColorGlow;
  uniform float uPulse;

  void main() {
    float distToCenter = length(gl_PointCoord - vec2(0.5));
    if (distToCenter > 0.5) discard;

    float strength = pow(max(0.0, 1.0 - (distToCenter * 2.0)), 4.0);
    vec3 color = mix(uColorGlow, uColorCore, strength);
    
    vec3 flashColor = vec3(1.0, 0.9, 0.5); 
    color = mix(color, flashColor, uPulse * strength);
    
    float halo = exp(-vDist * 3.0);
    color += uColorGlow * halo * 0.5;

    gl_FragColor = vec4(color, strength * vAlpha);
  }
`;

interface HeartTopperProps {
  pulse: number;
}

const HeartTopper: React.FC<HeartTopperProps> = ({ pulse }) => {
  const pointsRef = useRef<THREE.Points>(null!);
  const count = 3000;

  const { positions, sizes, randoms } = useMemo(() => {
    const posArray = new Float32Array(count * 3);
    const sizeArray = new Float32Array(count);
    const randArray = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const t = Math.random() * Math.PI * 2;
      const r = Math.pow(Math.random(), 0.5); 
      
      const x = r * 16 * Math.pow(Math.sin(t), 3);
      const y = r * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
      const z = (Math.random() - 0.5) * 3 * r;

      const scale = 0.07;
      posArray[i * 3 + 0] = x * scale;
      posArray[i * 3 + 1] = y * scale;
      posArray[i * 3 + 2] = z * scale;

      sizeArray[i] = 1.0 + Math.random() * 2.0;
      randArray[i] = Math.random();
    }
    return { positions: posArray, sizes: sizeArray, randoms: randArray };
  }, [count]);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uPulse: { value: 0 },
    uColorCore: { value: new THREE.Color("#ff4d8d") },
    uColorGlow: { value: new THREE.Color("#800a35") }
  }), []);

  useFrame((state) => {
    if (pointsRef.current) {
      const material = pointsRef.current.material as THREE.ShaderMaterial;
      material.uniforms.uTime.value = state.clock.elapsedTime;
      material.uniforms.uPulse.value = pulse;
      
      pointsRef.current.position.y = CONFIG.TREE_HEIGHT + 0.2 + Math.sin(state.clock.elapsedTime * 1.8) * 0.1;
    }
  });

  return (
    <Points ref={pointsRef} frustumCulled={false}>
      <BufferGeometry>
        <BufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <BufferAttribute attach="attributes-aSize" count={count} array={sizes} itemSize={1} />
        <BufferAttribute attach="attributes-aRandom" count={count} array={randoms} itemSize={1} />
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

export default HeartTopper;
