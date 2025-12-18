
import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

const Points = 'points' as any;
const BufferGeometry = 'bufferGeometry' as any;
const BufferAttribute = 'bufferAttribute' as any;
const ShaderMaterial = 'shaderMaterial' as any;

const vertexShader = `
  uniform float uTime;
  uniform float uActive;
  attribute float aSize;
  attribute float aSpeed;
  attribute vec3 aRandom;
  varying float vAlpha;

  void main() {
    vec3 pos = position;
    // 匀速下落
    float time = uTime * aSpeed * 0.4;
    pos.y = mod(pos.y - time + 25.0, 50.0) - 25.0;
    // 随机偏移
    pos.x += sin(uTime + aRandom.x * 20.0) * 0.6;
    pos.z += cos(uTime + aRandom.y * 20.0) * 0.6;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = aSize * (160.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;

    // 渐显渐隐
    vAlpha = uActive * (0.2 + 0.8 * sin(uTime * 2.5 + aRandom.z * 15.0));
  }
`;

const fragmentShader = `
  varying float vAlpha;

  void main() {
    // 归一化点内坐标
    vec2 uv = gl_PointCoord * 2.0 - 1.0;
    float x = uv.x;
    // 反转 Y 以修正心形方向
    float y = - (uv.y + 0.3);
    
    // 心形方程: (x^2 + (1.2y - sqrt(abs(x)))^2) < 1
    float heart = x * x + pow(1.2 * y - sqrt(abs(x)), 2.0);
    
    if (heart > 1.0) discard;

    // 渐变颜色：外围深粉，中心亮粉
    vec3 color = mix(vec3(1.0, 0.1, 0.3), vec3(1.0, 0.5, 0.6), 1.0 - heart);
    gl_FragColor = vec4(color, vAlpha);
  }
`;

const HeartRain: React.FC<{ active: boolean }> = ({ active }) => {
  const pointsRef = useRef<THREE.Points>(null!);
  const count = 400;
  const targetActive = useRef(0);

  const { positions, sizes, speeds, randoms } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const size = new Float32Array(count);
    const speed = new Float32Array(count);
    const rand = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * 50;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 50;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 25;
      size[i] = 0.6 + Math.random() * 1.6;
      speed[i] = 1.2 + Math.random() * 2.5;
      rand[i * 3 + 0] = Math.random();
      rand[i * 3 + 1] = Math.random();
      rand[i * 3 + 2] = Math.random();
    }
    return { positions: pos, sizes: size, speeds: speed, randoms: rand };
  }, []);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uActive: { value: 0 }
  }), []);

  useFrame((state) => {
    if (pointsRef.current) {
      targetActive.current = THREE.MathUtils.lerp(targetActive.current, active ? 1 : 0, 0.05);
      const material = pointsRef.current.material as THREE.ShaderMaterial;
      material.uniforms.uTime.value = state.clock.elapsedTime;
      material.uniforms.uActive.value = targetActive.current;
    }
  });

  return (
    <Points ref={pointsRef} frustumCulled={false}>
      <BufferGeometry>
        <BufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <BufferAttribute attach="attributes-aSize" count={count} array={sizes} itemSize={1} />
        <BufferAttribute attach="attributes-aSpeed" count={count} array={speeds} itemSize={1} />
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

export default HeartRain;
