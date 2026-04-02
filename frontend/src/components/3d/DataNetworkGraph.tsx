import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, Line, Billboard, Text } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

type NodeStatus = 'safe' | 'suspicious' | 'compromised' | 'isolated';

interface GraphNode {
  id: string;
  label: string;
  position: [number, number, number];
  status: NodeStatus;
}

interface GraphEdge {
  from: string;
  to: string;
  active: boolean;
}

const STATUS_COLORS: Record<NodeStatus, string> = {
  safe:        '#00ff80',
  suspicious:  '#facc15',
  compromised: '#ff4d4f',
  isolated:    '#6b7280',
};

// ── Animated edge with flowing data particles ─────────────────────────────────
function FlowingEdge({ from, to, active, color }: { from: THREE.Vector3; to: THREE.Vector3; active: boolean; color: string }) {
  const p1Ref = useRef<THREE.Mesh>(null!);
  const p2Ref = useRef<THREE.Mesh>(null!);
  const t1 = useRef(0);
  const t2 = useRef(0.5);

  useFrame((_, delta) => {
    if (!active) return;
    t1.current = (t1.current + delta * 0.4) % 1;
    t2.current = (t2.current + delta * 0.4) % 1;
    const pos1 = new THREE.Vector3().lerpVectors(from, to, t1.current);
    const pos2 = new THREE.Vector3().lerpVectors(from, to, t2.current);
    if (p1Ref.current) p1Ref.current.position.copy(pos1);
    if (p2Ref.current) p2Ref.current.position.copy(pos2);
  });

  return (
    <group>
      <Line
        points={[from, to]}
        color={active ? color : '#ffffff0a'}
        lineWidth={active ? 1.2 : 0.4}
        transparent
        opacity={active ? 0.55 : 0.15}
      />
      {active && (
        <>
          <mesh ref={p1Ref}>
            <sphereGeometry args={[0.04, 6, 6]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.5} transparent opacity={0.85} />
          </mesh>
          <mesh ref={p2Ref}>
            <sphereGeometry args={[0.03, 6, 6]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} transparent opacity={0.6} />
          </mesh>
        </>
      )}
    </group>
  );
}

// ── Network node ──────────────────────────────────────────────────────────────
function NetworkNode({ node }: { node: GraphNode }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const pulseRef= useRef<THREE.Mesh>(null!);
  const color   = STATUS_COLORS[node.status];
  const isHot   = node.status === 'compromised';

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.elapsedTime;
    meshRef.current.position.y = node.position[1] + Math.sin(t * 0.6 + node.position[0]) * 0.06;
    if (pulseRef.current && isHot) {
      const s = 1 + Math.sin(t * 3) * 0.15;
      pulseRef.current.scale.setScalar(s);
      (pulseRef.current.material as THREE.MeshStandardMaterial).opacity = 0.3 - Math.sin(t * 3) * 0.15;
    }
  });

  return (
    <group position={node.position}>
      {/* Pulse ring for compromised */}
      {isHot && (
        <mesh ref={pulseRef}>
          <sphereGeometry args={[0.22, 16, 16]} />
          <meshStandardMaterial color={color} transparent opacity={0.2} />
        </mesh>
      )}

      {/* Main sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.14, 20, 20]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isHot ? 2.5 : 1}
          roughness={0.2}
          metalness={0.6}
        />
      </mesh>

      {/* Label */}
      <Billboard>
        <Text
          position={[0, 0.28, 0]}
          fontSize={0.09}
          color={color}
          anchorX="center"
          anchorY="bottom"
          maxWidth={1}
        >
          {node.label}
        </Text>
      </Billboard>
    </group>
  );
}

// ── Scene ─────────────────────────────────────────────────────────────────────
function NetworkScene({ nodes, edges }: { nodes: GraphNode[]; edges: GraphEdge[] }) {
  const nodeMap = useMemo(() => {
    const m = new Map<string, THREE.Vector3>();
    nodes.forEach((n) => m.set(n.id, new THREE.Vector3(...n.position)));
    return m;
  }, [nodes]);

  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[0, 3, 0]}  intensity={1.5} color="#ffffff" />
      <pointLight position={[-2, 0, 1]} intensity={0.8} color="#60a5fa" />
      <pointLight position={[2, 0, -1]} intensity={0.8} color="#ff4d4f" />

      {edges.map((edge, i) => {
        const from = nodeMap.get(edge.from);
        const to   = nodeMap.get(edge.to);
        if (!from || !to) return null;
        const fromNode = nodes.find((n) => n.id === edge.from);
        const edgeColor = edge.active ? (STATUS_COLORS[fromNode?.status ?? 'safe']) : '#ffffff';
        return (
          <FlowingEdge key={i} from={from} to={to} active={edge.active} color={edgeColor} />
        );
      })}

      {nodes.map((node) => (
        <NetworkNode key={node.id} node={node} />
      ))}

      <EffectComposer>
        <Bloom intensity={1.4} luminanceThreshold={0.35} luminanceSmoothing={0.85} mipmapBlur />
      </EffectComposer>
    </>
  );
}

// ── Default graph for INC-001 ─────────────────────────────────────────────────
const DEFAULT_NODES: GraphNode[] = [
  { id: 'vpn',   label: 'VPN GW',   status: 'compromised', position: [-2, 0.2,  0]    },
  { id: 'dc01',  label: 'DC-01',    status: 'compromised', position: [-0.6, 0.8, -0.5] },
  { id: 'web03', label: 'WEB-03',   status: 'compromised', position: [-0.6,-0.6,  0.5] },
  { id: 'db02',  label: 'DB-02',    status: 'suspicious',  position: [1.2,  0,   0]    },
  { id: 'fs01',  label: 'FS-01',    status: 'safe',        position: [2.4,  0.6, 0.3]  },
  { id: 'ws15',  label: 'WS-15',    status: 'isolated',    position: [0.5,  1.4, -0.8] },
];

const DEFAULT_EDGES: GraphEdge[] = [
  { from: 'vpn',   to: 'dc01',  active: true  },
  { from: 'vpn',   to: 'web03', active: true  },
  { from: 'web03', to: 'db02',  active: true  },
  { from: 'dc01',  to: 'db02',  active: false },
  { from: 'db02',  to: 'fs01',  active: false },
  { from: 'dc01',  to: 'ws15',  active: false },
];

// ── Public component ──────────────────────────────────────────────────────────
interface DataNetworkGraphProps {
  nodes?: GraphNode[];
  edges?: GraphEdge[];
  height?: number;
  className?: string;
}

export function DataNetworkGraph({
  nodes = DEFAULT_NODES,
  edges = DEFAULT_EDGES,
  height = 320,
  className,
}: DataNetworkGraphProps) {
  return (
    <div
      className={className}
      style={{ height, borderRadius: '16px', overflow: 'hidden', background: 'hsl(220 30% 4%)' }}
    >
      <Canvas camera={{ position: [0, 0, 5], fov: 55 }} dpr={[1, 2]}>
        <NetworkScene nodes={nodes} edges={edges} />
      </Canvas>
    </div>
  );
}
