import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group } from "three";
import type { VehicleEvent } from "@/types";

interface CarSimulationProps {
  vehicleEvents: VehicleEvent[];
}

const carColor = {
  entering: "#4A9CFF",
  fueling: "#4DE2D1",
  leaving: "#F7B955",
};

export const CarSimulation = ({ vehicleEvents }: CarSimulationProps) => {
  const groups = useRef<Group[]>([]);
  const activeCars = useMemo(
    () => vehicleEvents.filter((event) => event.active).slice(0, 6),
    [vehicleEvents],
  );

  const laneZPositions = [-1.55, 0, 1.55];

  const getTargetPosition = (event: VehicleEvent) => {
    const laneZ = laneZPositions[event.bay - 1] ?? 0;

    if (event.direction === "entering") {
      return {
        x: -6.4 + event.progress * 5.2,
        y: 0.34,
        z: laneZ,
        rotationY: 0,
      };
    }

    if (event.direction === "fueling") {
      return {
        x: -0.8,
        y: 0.34,
        z: laneZ,
        rotationY: 0,
      };
    }

    return {
      x: 0.8 + event.progress * 5.8,
      y: 0.34,
      z: laneZ,
      rotationY: 0,
    };
  };

  useFrame(({ clock }) => {
    activeCars.forEach((event, index) => {
      const group = groups.current[index];
      if (!group) {
        return;
      }

      const target = getTargetPosition(event);
      const fuelingIdleBob =
        event.direction === "fueling" ? Math.sin(clock.elapsedTime * 1.8 + index) * 0.015 : 0;

      group.position.x += (target.x - group.position.x) * 0.06;
      group.position.y += (target.y + fuelingIdleBob - group.position.y) * 0.08;
      group.position.z += (target.z - group.position.z) * 0.08;
      group.rotation.y += (target.rotationY - group.rotation.y) * 0.1;
    });
  });

  return (
    <>
      {activeCars.map((event, index) => (
        <group
          key={event.id}
          ref={(element) => {
            if (element) {
              groups.current[index] = element;
            }
          }}
          position={[-6.4 + index * 0.8, 0.34, laneZPositions[event.bay - 1] ?? 0]}
        >
          <mesh>
            <boxGeometry
              args={
                event.vehicleType === "Truck" || event.vehicleType === "Bus"
                  ? [1.25, 0.4, 0.46]
                  : [0.92, 0.34, 0.42]
              }
            />
            <meshStandardMaterial color={carColor[event.direction]} />
          </mesh>
          <mesh position={[0, 0.2, 0]}>
            <boxGeometry
              args={
                event.vehicleType === "Truck" || event.vehicleType === "Bus"
                  ? [0.56, 0.16, 0.34]
                  : [0.46, 0.14, 0.3]
              }
            />
            <meshStandardMaterial color="#d7def0" />
          </mesh>
          {event.direction === "fueling" ? (
            <mesh position={[0.42, 0.38, 0]}>
              <boxGeometry args={[0.08, 0.36, 0.05]} />
              <meshStandardMaterial color="#F7B955" emissive="#F7B955" emissiveIntensity={0.45} />
            </mesh>
          ) : null}
        </group>
      ))}
    </>
  );
};
