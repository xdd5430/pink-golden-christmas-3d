
import React, { useMemo, useRef, useState } from 'react';
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
  uniform float uProgress;
  attribute float aSize;
  attribute float aOffset; 
  attribute vec3 aRandom;
  varying float vAlpha;
  varying float vIsHead;

  void main() {
    vec3 pos = position;
    float angle = uTime * 20.0 + aOffset * 10.0;
    float wave = 0.015 * aOffset;
    pos.x += cos(angle) * wave;
    pos.z += sin(angle) * wave;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    float sizeScale = mix(0.7, 0.02, aOffset);
    
    if(aOffset < 0.01) {
        sizeScale *= (2.0 + 0.6 * sin(uTime * 60.0));
    }

    gl_PointSize = aSize * sizeScale * (350.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
    
    vAlpha = pow(max(0.0, 1.0 - aOffset), 2.5) * (0.9 + 0.1 * sin(uTime * 15.0 + aRandom.y));
    vIsHead = step(aOffset, 0.01);
  }
`;

const fragmentShader = `
  varying float vAlpha;
  varying float vIsHead;
  uniform vec3 uColorCore;
  uniform vec3 uColorTail;

  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    
    float strength = vIsHead > 0.5 ? pow(1.0 - dist * 2.0, 1.1) : pow(1.0 - dist * 2.0, 6.0);
    vec3 color = mix(uColorTail, uColorCore, vIsHead);
    
    if(vIsHead > 0.5 && dist < 0.18) {
        color = vec3(1.0, 1.0, 1.0);
    }

    gl_FragColor = vec4(color, strength * vAlpha);
  }
`;

interface WishStarProps {
  id: number;
  onArrived: () => void;
}

const WishStar: React.FC<WishStarProps> = ({ onArrived }) => {
  const pointsRef = useRef<THREE.Points>(null!);
  const [progress, setProgress] = useState(0);
  const count = 2000;

  const curve = useMemo(() => {
    const start = new THREE.Vector3(0, -10, 15);
    const side = (Math.random() - 0.5) * 20;
    const mid = new THREE.Vector3(side, 8, 5);
    const worldTopperY = -CONFIG.TREE_HEIGHT / 2 + (CONFIG.TREE_HEIGHT + 0.2);
    const end = new THREE.Vector3(0, worldTopperY, 0);
    return new THREE.QuadraticBezierCurve3(start, mid, end);
  }, []);

  const { positions, sizes, offsets, randoms } = useMemo(() => {
    const posArray = new Float32Array(count * 3);
    const sizeArray = new Float32Array(count);
    const offsetArray = new Float32Array(count); 
    const randArray = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      sizeArray[i] = 0.8 + Math.random() * 1.5;
      offsetArray[i] = i / count; 
      randArray[i * 3 + 0] = Math.random();
      randArray[i * 3 + 1] = Math.random();
      randArray[i * 3 + 2] = Math.random();
    }
    return { positions: posArray, sizes: sizeArray, offsets: offsetArray, randoms: randArray };
  }, [count]);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uProgress: { value: 0 },
    uColorCore: { value: new THREE.Color("#FFFFFF") },
    uColorTail: { value: new THREE.Color("#FFD700") }
  }), []);

  useFrame((state, delta) => {
    if (pointsRef.current) {
      const nextProgress = progress + delta * 0.95;
      
      if (nextProgress >= 1.0) {
        onArrived();
      } else {
        setProgress(nextProgress);
        const posAttr = pointsRef.current.geometry.getAttribute('position');
        const trailLen = 0.35;

        for (let i = 0; i < count; i++) {
          const t = Math.max(0, Math.min(1, nextProgress - offsets[i] * trailLen));
          const p = curve.getPointAt(t);
          const spread = offsets[i] * 0.02; 
          const angle = randoms[i * 3] * Math.PI * 2;
          
          posAttr.setXYZ(
            i, 
            p.x + Math.cos(angle) * spread, 
            p.y + Math.sin(angle) * spread, 
            p.z + (Math.random() - 0.5) * spread
          );
        }
        posAttr.needsUpdate = true;
        
        const mat = pointsRef.current.material as THREE.ShaderMaterial;
        mat.uniforms.uTime.value = state.clock.elapsedTime;
        mat.uniforms.uProgress.value = nextProgress;
      }
    }
  });

  return (
    <Points ref={pointsRef} frustumCulled={false}>
      <BufferGeometry>
        <BufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <BufferAttribute attach="attributes-aSize" count={count} array={sizes} itemSize={1} />
        <BufferAttribute attach="attributes-aOffset" count={count} array={offsets} itemSize={1} />
        <BufferAttribute attach="attributes-aRandom" count={count} array={randoms} itemSize={3} />
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

export default WishStar;
