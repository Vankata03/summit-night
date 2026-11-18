// PROTOTYPE — throwaway. Shared uniform objects: the spotlight layer writes them, the terrain material reads them.
import * as THREE from 'three';
export const spotUniforms = {
  uSpot: { value: new THREE.Vector4(0, 0, 0, 0.2) },
  uSpotMode: { value: 0 },
  uSpotK: { value: 0 },
  uTime: { value: 0 },
};
