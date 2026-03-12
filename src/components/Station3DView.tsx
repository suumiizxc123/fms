import { OrbitControls, PerspectiveCamera, Text } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import type { Station, VehicleEvent } from "@/types";
import { CarSimulation } from "./CarSimulation";
import { FuelTank3D } from "./FuelTank3D";

interface Station3DViewProps {
  station: Station;
  liveMetrics: Station;
  vehicleEvents: VehicleEvent[];
  selectedTankId: string;
  onSelectTank: (tankId: string) => void;
}

export const Station3DView = ({
  station,
  liveMetrics,
  vehicleEvents,
  selectedTankId,
  onSelectTank,
}: Station3DViewProps) => (
  <div className="h-[520px] overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/60">
    <Canvas shadows>
      <PerspectiveCamera makeDefault position={[0, 7.5, 12]} fov={42} />
      <color attach="background" args={["#08101f"]} />
      <ambientLight intensity={0.8} />
      <directionalLight
        castShadow
        position={[6, 8, 5]}
        intensity={1.9}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-5, 5, -4]} color="#4DE2D1" intensity={1.2} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.15, 0]} receiveShadow>
        <planeGeometry args={[18, 13]} />
        <meshStandardMaterial color="#0f182d" />
      </mesh>
      <mesh position={[0, 0.04, 0]} receiveShadow>
        <boxGeometry args={[11, 0.08, 6.2]} />
        <meshStandardMaterial color="#101b30" />
      </mesh>
      <mesh position={[0, 0.06, 0]} receiveShadow>
        <boxGeometry args={[8.3, 0.1, 3.5]} />
        <meshStandardMaterial color="#202f4c" />
      </mesh>
      <mesh position={[0, 2.9, 0]} castShadow receiveShadow>
        <boxGeometry args={[8.8, 0.28, 4.3]} />
        <meshStandardMaterial color="#1a2438" metalness={0.5} roughness={0.35} />
      </mesh>
      <mesh position={[0, 2.85, 0]}>
        <boxGeometry args={[9.05, 0.06, 4.55]} />
        <meshStandardMaterial color="#f2b93b" emissive="#f2b93b" emissiveIntensity={0.4} />
      </mesh>
      {[
        [-3.5, 1.42, -1.55],
        [-3.5, 1.42, 1.55],
        [3.5, 1.42, -1.55],
        [3.5, 1.42, 1.55],
      ].map((position, index) => (
        <mesh key={index} position={position as [number, number, number]} castShadow>
          <boxGeometry args={[0.22, 2.8, 0.22]} />
          <meshStandardMaterial color="#d9deea" metalness={0.75} roughness={0.18} />
        </mesh>
      ))}
      {[-1.55, 0, 1.55].map((laneZ, index) => (
        <group key={laneZ} position={[-0.65, 0.28, laneZ]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.42, 0.55, 0.42]} />
            <meshStandardMaterial color="#f2b93b" />
          </mesh>
          <mesh position={[0, 0.58, 0]}>
            <boxGeometry args={[0.34, 0.42, 0.28]} />
            <meshStandardMaterial color="#162339" />
          </mesh>
          <mesh position={[0.18, 0.18, 0]}>
            <boxGeometry args={[0.05, 0.3, 0.05]} />
            <meshStandardMaterial color="#d8dfef" />
          </mesh>
          <mesh position={[0.48, 0.68, 0]}>
            <boxGeometry args={[0.06, 0.95, 0.06]} />
            <meshStandardMaterial color="#1f2a40" />
          </mesh>
          <mesh position={[0.48, 1.12, 0]}>
            <boxGeometry args={[0.05, 0.16, 0.05]} />
            <meshStandardMaterial color="#f2b93b" emissive="#f2b93b" emissiveIntensity={0.5} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.05, -3.55]} receiveShadow>
        <boxGeometry args={[14, 0.06, 1.6]} />
        <meshStandardMaterial color="#161d2d" />
      </mesh>
      <mesh position={[0, 0.06, 3.55]} receiveShadow>
        <boxGeometry args={[14, 0.06, 1.6]} />
        <meshStandardMaterial color="#161d2d" />
      </mesh>
      <mesh position={[1.8, 0.12, -5.6]} receiveShadow>
        <boxGeometry args={[8.2, 0.1, 3.5]} />
        <meshStandardMaterial color="#1b273d" />
      </mesh>
      <mesh position={[1.8, 0.56, -7.35]} receiveShadow>
        <boxGeometry args={[8.45, 0.84, 0.12]} />
        <meshStandardMaterial color="#f2b93b" emissive="#f2b93b" emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[1.8, 0.56, -3.85]} receiveShadow>
        <boxGeometry args={[8.45, 0.84, 0.12]} />
        <meshStandardMaterial color="#f2b93b" emissive="#f2b93b" emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[-2.35, 0.56, -5.6]} receiveShadow>
        <boxGeometry args={[0.12, 0.84, 3.6]} />
        <meshStandardMaterial color="#f2b93b" emissive="#f2b93b" emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[5.95, 0.56, -5.6]} receiveShadow>
        <boxGeometry args={[0.12, 0.84, 3.6]} />
        <meshStandardMaterial color="#f2b93b" emissive="#f2b93b" emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[1.8, 0.24, -5.6]} receiveShadow>
        <boxGeometry args={[8.3, 0.2, 3.7]} />
        <meshStandardMaterial color="#111827" />
      </mesh>
      {station.tanks.map((tank, index) => (
        <FuelTank3D
          key={tank.id}
          tank={tank}
          position={[-0.2 + index * 2.1, 0.25, -5.6]}
          selected={tank.id === selectedTankId}
          onSelect={onSelectTank}
        />
      ))}
      <mesh position={[5.95, 1.4, -7.05]}>
        <boxGeometry args={[0.12, 3.2, 0.12]} />
        <meshStandardMaterial color="#d7def0" metalness={0.75} roughness={0.18} />
      </mesh>
      <mesh position={[5.95, 2.9, -7.05]}>
        <boxGeometry args={[0.88, 0.24, 0.88]} />
        <meshStandardMaterial color="#4DE2D1" emissive="#4DE2D1" emissiveIntensity={0.42} />
      </mesh>
      <CarSimulation vehicleEvents={vehicleEvents} />
      <Text position={[0, 5.25, -4.8]} fontSize={0.38} color="#ffffff" anchorX="center">
        {liveMetrics.name}
      </Text>
      <Text position={[0, 4.62, -4.8]} fontSize={0.22} color="#8fa2c9" anchorX="center">
        {liveMetrics.currentFuelLitres.toLocaleString()} L available · {liveMetrics.queueLevel} vehicles queued
      </Text>
      <Text position={[1.8, 4.15, -7.35]} fontSize={0.18} color="#f2b93b" anchorX="center">
        Rear tank farm · click tank to inspect
      </Text>
      <OrbitControls minDistance={8} maxDistance={16} maxPolarAngle={1.46} target={[1.4, 1.15, 0]} />
    </Canvas>
  </div>
);
