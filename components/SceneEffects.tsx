
import React from 'react';
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing';
import { CONFIG } from '../constants';

const SceneEffects: React.FC = () => {
  return (
    <EffectComposer enableNormalPass={false} multisampling={4}>
      <Bloom 
        intensity={CONFIG.BLOOM.INTENSITY}
        luminanceThreshold={CONFIG.BLOOM.THRESHOLD} 
        luminanceSmoothing={0.05}
        radius={CONFIG.BLOOM.RADIUS}
        mipmapBlur={false}
      />
      <Noise opacity={0.02} />
      <Vignette eskil={false} offset={0.15} darkness={1.2} />
    </EffectComposer>
  );
};

export default SceneEffects;
