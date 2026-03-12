import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import type { Mesh } from "three";
import type { Station } from "@/types";

interface StationMarkerProps {
  station: Station;
  selected: boolean;
  onSelect: (stationId: string) => void;
}

const statusColor = {
  normal: "#55D89B",
  low_fuel: "#F7B955",
  critical: "#FF5D73",
  maintenance: "#94A3B8",
};

export const StationMarker = ({ station, selected, onSelect }: StationMarkerProps) => {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(({ clock }) => {
    if (!meshRef.current) {
      return;
    }

    meshRef.current.position.y = selected ? 1.5 + Math.sin(clock.elapsedTime * 2) * 0.1 : 1.1;
    meshRef.current.rotation.y += 0.01;
  });

  return (
    <group position={[(station.mapX - 50) / 6, 0, (station.mapY - 50) / 5.8]}>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.02, 0]}
        onClick={() => onSelect(station.id)}
      >
        <ringGeometry args={[0.36, 0.58, 32]} />
        <meshBasicMaterial color={selected ? "#4DE2D1" : "rgba(255,255,255,0.14)"} />
      </mesh>
      <mesh
        ref={meshRef}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onClick={() => onSelect(station.id)}
      >
        <cylinderGeometry args={[0.32, 0.32, selected ? 2.8 : 2.2, 24]} />
        <meshStandardMaterial
          color={statusColor[station.status]}
          emissive={statusColor[station.status]}
          emissiveIntensity={selected ? 0.85 : 0.35}
          metalness={0.4}
          roughness={0.25}
        />
      </mesh>
      {(hovered || selected) && (
        <Html position={[0, 3.1, 0]} center>
          <div className="rounded-2xl border border-white/10 bg-slate-950/90 px-3 py-2 text-xs text-white shadow-2xl backdrop-blur">
            <p className="font-semibold">{station.name}</p>
            <p className="mt-1 text-slate-300">{station.status.replace(/_/g, " ")}</p>
            <p className="mt-1 text-slate-400">{Math.round(station.currentFuelLitres).toLocaleString()} L</p>
          </div>
        </Html>
      )}
    </group>
  );
};
