
import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

// Fix for JSX intrinsic element errors
const Group = 'group' as any;
const Points = 'points' as any;
const BufferGeometry = 'bufferGeometry' as any;
const BufferAttribute = 'bufferAttribute' as any;
const ShaderMaterial = 'shaderMaterial' as any;

const vertexShader = `
  uniform float uTime;
  attribute float aSize;
  attribute vec3 aVelocity;
  attribute float aRandom;
  varying float vAlpha;
  varying float vRandom;

  void main() {
    vec3 pos = position;
    float t = uTime;
    
    float drag = 1.0 - pow(t, 0.5);
    pos += aVelocity * t * 2.0 * drag;
    pos.y -= 0.5 * 4.0 * t * t; 
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    float sizeAttenuation = 180.0 / -mvPosition.z;
    gl_PointSize = aSize * sizeAttenuation * (1.0 - t * 0.8); 
    gl_Position = projectionMatrix * mvPosition;
    
    float distToCamera = -mvPosition.z;
    float distanceFade = smoothstep(0.0, 4.0, distToCamera);
    
    vAlpha = pow(1.0 - t, 1.5) * distanceFade;
    vRandom = aRandom;
  }
`;

const fragmentShader = `
  varying float vAlpha;
  varying float vRandom;
  uniform float uGlobalTime;
  uniform vec3 uColor;

  void main() {
    vec2 uv = gl_PointCoord - vec2(0.5);
    float dist = length(uv);
    if (dist > 0.45) discard;
    
    float glow = 0.012 / dist;
    float rays = max(0.0, 1.0 - abs(uv.x) * 40.0) * max(0.0, 1.0 - abs(uv.y) * 4.0);
    rays += max(0.0, 1.0 - abs(uv.y) * 40.0) * max(0.0, 1.0 - abs(uv.x) * 4.0);
    
    float twinkle = 0.6 + 0.4 * sin(uGlobalTime * 30.0 + vRandom * 1000.0);
    float finalMask = (glow + rays) * vAlpha * twinkle;
    
    if (finalMask < 0.01) discard;
    gl_FragColor = vec4(uColor * 1.5, finalMask);
  }
`;

interface StarExplosionProps {
  position: [number, number, number];
  onComplete: () => void;
}

const StarExplosion: React.FC<StarExplosionProps> = ({ position, onComplete }) => {
  const pointsRef = useRef<THREE.Points>(null!);
  const timeRef = useRef(0);
  const count = 500;

  const { positions, sizes, velocities, randoms } = useMemo(() => {
    const posArr = new Float32Array(count * 3);
    const sizeArr = new Float32Array(count);
    const velArr = new Float32Array(count * 3);
    const randArr = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed = 2.0 + Math.random() * 8.0;
      
      velArr[i * 3 + 0] = speed * Math.sin(phi) * Math.cos(theta);
      velArr[i * 3 + 1] = speed * Math.sin(phi) * Math.sin(theta) + 1.0; 
      velArr[i * 3 + 2] = speed * Math.sin(phi);

      sizeArr[i] = 1.0 + Math.random() * 2.5;
      randArr[i] = Math.random();
    }
    return { positions: posArr, sizes: sizeArr, velocities: velArr, randoms: randArr };
  }, [count]);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uGlobalTime: { value: 0 },
    uColor: { value: new THREE.Color("#FFD700") }
  }), []);

  useFrame((state, delta) => {
    if (pointsRef.current) {
      timeRef.current += delta;
      if (timeRef.current >= 1.5) {
        onComplete();
      } else {
        const material = pointsRef.current.material as THREE.ShaderMaterial;
        material.uniforms.uTime.value = timeRef.current;
        material.uniforms.uGlobalTime.value = state.clock.elapsedTime;
      }
    }
  });

  return (
    <Group position={position}>
      <Points ref={pointsRef}>
        <BufferGeometry>
          <BufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
          <BufferAttribute attach="attributes-aSize" count={count} array={sizes} itemSize={1} />
          <BufferAttribute attach="attributes-aVelocity" count={count} array={velocities} itemSize={3} />
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
    </Group>
  );
};

export default StarExplosion;
