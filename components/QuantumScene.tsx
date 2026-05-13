/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Stars, Environment, Torus, Octahedron, Box } from '@react-three/drei';
import * as THREE from 'three';

// Intrinsic elements workaround
const ThreeGroup = 'group' as any;
const ThreeMesh = 'mesh' as any;
const ThreeMeshStandardMaterial = 'meshStandardMaterial' as any;
const ThreeMeshBasicMaterial = 'meshBasicMaterial' as any;
const ThreeSphereGeometry = 'sphereGeometry' as any;
const ThreeAmbientLight = 'ambientLight' as any;
const ThreePointLight = 'pointLight' as any;
const ThreeSpotLight = 'spotLight' as any;

const DigitalAsset = ({ position, color, scale = 1, speed = 1 }: { position: [number, number, number]; color: string; scale?: number; speed?: number }) => {
  const ref = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.getElapsedTime();
      // Mutating position components is generally safe in Three.js/R3F
      // but we add a safety check for the component itself.
      if (ref.current.position) {
        ref.current.position.y = position[1] + Math.sin(t * speed + position[0]) * 0.1;
        ref.current.rotation.y += 0.01;
        ref.current.rotation.z += 0.005;
      }
    }
  });

  return (
    <Octahedron ref={ref} args={[1, 0]} position={position} scale={scale}>
      <ThreeMeshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.5}
        metalness={1}
        roughness={0.1}
        wireframe
      />
    </Octahedron>
  );
};

const DataPulse = () => {
    // Generate raw numbers instead of Vector3 objects to avoid prop-sync issues with read-only objects
    const points = useMemo(() => {
        const p = [];
        for (let i = 0; i < 50; i++) {
            p.push([
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10
            ]);
        }
        return p;
    }, []);

    return (
        <ThreeGroup>
            {points.map((p, i) => (
                <ThreeMesh key={i} position={p as [number, number, number]}>
                    <ThreeSphereGeometry args={[0.02, 8, 8]} />
                    <ThreeMeshBasicMaterial color="#C5A059" transparent opacity={0.3} />
                </ThreeMesh>
            ))}
        </ThreeGroup>
    )
}

export const CryptoHeroScene: React.FC = () => {
  return (
    <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
        <ThreeAmbientLight intensity={0.5} />
        <ThreePointLight position={[10, 10, 10]} intensity={2} color="#C5A059" />
        <ThreePointLight position={[-10, -10, -10]} intensity={1} color="#10b981" />
        
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
          <DigitalAsset position={[0, 0, 0]} color="#C5A059" scale={1.5} speed={0.5} />
          
          <Torus args={[3, 0.02, 16, 100]} rotation={[Math.PI / 2, 0, 0]}>
            <ThreeMeshBasicMaterial color="#C5A059" transparent opacity={0.1} />
          </Torus>
          <Torus args={[4, 0.01, 16, 100]} rotation={[Math.PI / 3, 0.5, 0]}>
            <ThreeMeshBasicMaterial color="#10b981" transparent opacity={0.05} />
          </Torus>
        </Float>
        
        <DataPulse />
        
        <Stars radius={50} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
        <Environment resolution={256}>
          <ThreeGroup rotation={[Math.PI / 2, 0, 0]}>
            <ThreePointLight intensity={1} color="#C5A059" position={[10, 10, 10]} />
            <ThreePointLight intensity={0.5} color="#10b981" position={[-10, 10, -10]} />
            <ThreePointLight intensity={0.5} color="#ffffff" position={[0, -10, 0]} />
          </ThreeGroup>
        </Environment>
      </Canvas>
    </div>
  );
};

const VaultContent = () => {
  const ref = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.getElapsedTime() * 0.2;
    }
  });

  return (
    <ThreeGroup ref={ref}>
      <Box args={[1.5, 1.5, 1.5]}>
          <ThreeMeshStandardMaterial 
            color="#0A0A0B" 
            metalness={1} 
            roughness={0.05} 
            emissive="#C5A059"
            emissiveIntensity={0.1}
        />
      </Box>
      
      <Box args={[1.8, 1.8, 1.8]}>
        <ThreeMeshStandardMaterial color="#C5A059" wireframe transparent opacity={0.2} />
      </Box>

      {[0, 1, 2, 3].map((i) => (
          <ThreeGroup key={i} rotation={[0, (i * Math.PI) / 2, 0]}>
            <ThreeMesh position={[2, 0, 0]}>
                <ThreeSphereGeometry args={[0.1, 16, 16]} />
                <ThreeMeshStandardMaterial color="#C5A059" emissive="#C5A059" emissiveIntensity={2} />
            </ThreeMesh>
            <Torus args={[2, 0.01, 8, 64]} rotation={[Math.PI/2, 0, 0]}>
                <ThreeMeshBasicMaterial color="#C5A059" transparent opacity={0.1} />
            </Torus>
          </ThreeGroup>
      ))}
    </ThreeGroup>
  );
};

export const SecurityVaultScene: React.FC = () => {
  return (
    <div className="w-full h-full absolute inset-0">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ThreeAmbientLight intensity={1} />
        <ThreeSpotLight position={[5, 5, 5]} angle={0.15} penumbra={1} intensity={5} color="#C5A059" />
        
        <VaultContent />

        <Environment resolution={256}>
          <ThreeGroup rotation={[Math.PI / 2, 0, 0]}>
            <ThreePointLight intensity={3} color="#ffffff" position={[10, 10, 10]} />
            <ThreePointLight intensity={1} color="#ffffff" position={[-10, 10, -10]} />
            <ThreePointLight intensity={1} color="#C5A059" position={[0, -10, 0]} />
          </ThreeGroup>
        </Environment>
      </Canvas>
    </div>
  );
}
