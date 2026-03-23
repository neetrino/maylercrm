'use client';

import { useEffect, useState, type CSSProperties } from 'react';

type LayerKind = 'back' | 'mid' | 'front';

type Flake = {
  id: string;
  leftPct: number;
  delayS: number;
  durationS: number;
  sizePx: number;
  d1: number;
  d2: number;
  d3: number;
  d4: number;
  driftPx: number;
  opacity: number;
};

function randomDrift(mag: number): number {
  return (Math.random() * 2 - 1) * mag;
}

function buildLayerFlakes(count: number, layer: LayerKind): Flake[] {
  return Array.from({ length: count }, (_, i) => {
    let size: number;
    let durationS: number;
    let opacity: number;
    let chaos: number;

    if (layer === 'back') {
      size = 1 + Math.random() * 3.2;
      durationS = 10 + Math.random() * 14;
      opacity = 0.14 + Math.random() * 0.22;
      chaos = 22 + size * 1.4;
    } else if (layer === 'mid') {
      size = 2 + Math.random() * 4.5;
      durationS = 7.5 + Math.random() * 10;
      opacity = 0.42 + Math.random() * 0.32;
      chaos = 32 + size * 2;
    } else {
      size = 4 + Math.random() * 10;
      durationS = 6 + Math.random() * 8;
      opacity = 0.82 + Math.random() * 0.18;
      chaos = 38 + size * 2.2;
    }

    return {
      id: `${layer}-${i}`,
      leftPct: Math.random() * 100,
      delayS: Math.random() * 9,
      durationS,
      sizePx: size,
      d1: randomDrift(chaos),
      d2: randomDrift(chaos * 1.08),
      d3: randomDrift(chaos * 0.98),
      d4: randomDrift(chaos * 1.02),
      driftPx: randomDrift(chaos * 1.12),
      opacity,
    };
  });
}

const FLAKES_PER_LAYER = 60;

function FlakeSpan({ f }: { f: Flake }) {
  const glow = Math.max(1, f.sizePx * 0.4);
  return (
    <span
      className="login-snowflake absolute rounded-full"
      style={
        {
          left: `${f.leftPct}%`,
          width: f.sizePx,
          height: f.sizePx,
          animationDuration: `${f.durationS}s`,
          animationDelay: `${f.delayS}s`,
          backgroundColor: `rgba(255, 255, 255, ${f.opacity})`,
          boxShadow: `0 0 ${glow}px rgba(255,255,255,${0.2 + f.opacity * 0.55})`,
          '--snow-d1': `${f.d1}px`,
          '--snow-d2': `${f.d2}px`,
          '--snow-d3': `${f.d3}px`,
          '--snow-d4': `${f.d4}px`,
          '--snow-drift': `${f.driftPx}px`,
        } as CSSProperties
      }
    />
  );
}

export default function Snowfall() {
  const [back, setBack] = useState<Flake[]>([]);
  const [mid, setMid] = useState<Flake[]>([]);
  const [front, setFront] = useState<Flake[]>([]);

  useEffect(() => {
    setBack(buildLayerFlakes(FLAKES_PER_LAYER, 'back'));
    setMid(buildLayerFlakes(FLAKES_PER_LAYER, 'mid'));
    setFront(buildLayerFlakes(FLAKES_PER_LAYER, 'front'));
  }, []);

  if (back.length === 0) {
    return null;
  }

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[2] overflow-hidden"
      aria-hidden
    >
      {/* Дальний план: мельче, слабее, чуть размытие — глубина */}
      <div className="absolute inset-0 [filter:blur(0.55px)]">
        {back.map((f) => (
          <FlakeSpan key={f.id} f={f} />
        ))}
      </div>
      {/* Середина */}
      <div className="absolute inset-0">
        {mid.map((f) => (
          <FlakeSpan key={f.id} f={f} />
        ))}
      </div>
      {/* Ближний план: крупнее и ярче */}
      <div className="absolute inset-0">
        {front.map((f) => (
          <FlakeSpan key={f.id} f={f} />
        ))}
      </div>
    </div>
  );
}
