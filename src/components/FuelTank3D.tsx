import { Text } from "@react-three/drei";
import type { Tank } from "@/types";

interface FuelTank3DProps {
  tank: Tank;
  position: [number, number, number];
  selected?: boolean;
  onSelect?: (tankId: string) => void;
}

const tankColor = {
  "AI-92": "#4DE2D1",
  "AI-95": "#4A9CFF",
  Diesel: "#F7B955",
  LPG: "#B07CFF",
};

export const FuelTank3D = ({ tank, position, selected = false, onSelect }: FuelTank3DProps) => {
  const fillRatio = tank.inventory.currentLitres / Math.max(tank.inventory.capacityLitres, 1);
  const fillHeight = Math.max(0.18, fillRatio * 2.5);
  const fuelColor = tankColor[tank.inventory.fuelType];

  return (
    <group position={position}>
      <mesh
        position={[0, 1.5, 0]}
        onClick={() => onSelect?.(tank.id)}
        onPointerEnter={() => {
          document.body.style.cursor = "pointer";
        }}
        onPointerLeave={() => {
          document.body.style.cursor = "default";
        }}
      >
        <cylinderGeometry args={[0.86, 0.86, 3, 42, 1, true]} />
        <meshStandardMaterial
          color={selected ? "#e6efff" : "#ced9f5"}
          emissive={selected ? "#4DE2D1" : "#000000"}
          emissiveIntensity={selected ? 0.22 : 0}
          metalness={0.55}
          roughness={0.24}
          transparent
          opacity={0.36}
        />
      </mesh>
      <mesh position={[0, fillHeight / 2 + 0.1, 0]}>
        <cylinderGeometry args={[0.78, 0.78, fillHeight, 36]} />
        <meshStandardMaterial
          color={fuelColor}
          emissive={fuelColor}
          emissiveIntensity={selected ? 0.62 : 0.35}
        />
      </mesh>
      <mesh position={[0, 3.02, 0]}>
        <cylinderGeometry args={[0.88, 0.88, 0.12, 36]} />
        <meshStandardMaterial color="#d6def0" metalness={0.8} roughness={0.18} />
      </mesh>
      {selected ? (
        <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.02, 1.26, 48]} />
          <meshBasicMaterial color="#4DE2D1" />
        </mesh>
      ) : null}
      <Text position={[0, 3.6, 0]} fontSize={0.23} color="#dce3f3" anchorX="center" anchorY="middle">
        {tank.label}
      </Text>
      {selected ? (
        <Text position={[0, 4.02, 0]} fontSize={0.15} color="#4DE2D1" anchorX="center" anchorY="middle">
          Inspecting
        </Text>
      ) : null}
    </group>
  );
};
