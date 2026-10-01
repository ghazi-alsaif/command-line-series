import React from "react";
import { useCurrentFrame } from "remotion";
import { byN } from "../data/books";
import { glowFrom } from "../theme";
import { CIRCUIT, MARK_BOTTOM, braidAmp, circuitX, hash, rootX, strandX, trunkX } from "./geometry";
import { H, W, WORLD } from "./plan";

const STEP = 10;

const sample = (f: (y: number) => number, y0: number, y1: number) => {
  if (y1 <= y0) return "";
  let d = "";
  for (let y = y0; y <= y1; y += STEP) d += `${d ? "L" : "M"}${f(y).toFixed(1)} ${y.toFixed(1)}`;
  d += `L${f(y1).toFixed(1)} ${y1.toFixed(1)}`;
  return d;
};

const Glow: React.FC<{ d: string; color: string; width: number; opacity?: number }> = ({ d, color, width, opacity = 1 }) =>
  d ? (
    <>
      <path d={d} stroke={color} strokeWidth={width * 5} strokeOpacity={0.09 * opacity} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} stroke={color} strokeWidth={width * 2.2} strokeOpacity={0.18 * opacity} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} stroke={color} strokeWidth={width} strokeOpacity={0.95 * opacity} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ) : null;

const STRAND_COLORS = [1, 2, 3, 4].map((n) => glowFrom(byN(n).titleColor, 0.62));
const TRUNK = glowFrom("#1F6F5C", 0.6);
const TRACE = glowFrom("#145A54", 0.64);

/**
 * الجذور في فضاء الشاشة: تُرسم فقط الشريحة المرئية من العالم.
 * grow: أعمق نقطة نبتت حتى الآن (لتأثير النمو في الافتتاح).
 */
export const Roots: React.FC<{ cam: number; grow: number }> = ({ cam, grow }) => {
  const frame = useCurrentFrame();
  const top = Math.max(MARK_BOTTOM, cam - 200);
  const bottom = Math.min(grow, cam + H + 200, WORLD.tip);
  if (bottom <= top) return null;

  const orgEnd = Math.min(bottom, WORLD.circuitStart);
  const braidEnd = Math.min(orgEnd, WORLD.junction);

  // جُذيرات جانبية عضوية
  const rootlets: React.ReactNode[] = [];
  const first = Math.floor(Math.max(MARK_BOTTOM + 200, top - 400) / 230);
  const last = Math.floor(Math.min(orgEnd, bottom) / 230);
  for (let k = first; k <= last; k++) {
    const y = k * 230;
    if (y < MARK_BOTTOM + 200 || y > Math.min(bottom, WORLD.circuitStart - 100)) continue;
    const side = hash(k) > 0.5 ? 1 : -1;
    const len = 130 + hash(k + 7) * 230;
    const x = trunkX(y) + side * braidAmp(y) * 0.6;
    const d = `M${x} ${y} Q${x + side * len * 0.55} ${y + len * 0.15} ${x + side * len} ${y + len * 0.75}`;
    const d2 = `M${x + side * len * 0.55} ${y + len * 0.28} q${side * 50} ${30} ${side * 60} ${90}`;
    rootlets.push(
      <g key={k} opacity={0.55}>
        <path d={d} stroke={TRUNK} strokeWidth={1.6} strokeOpacity={0.5} fill="none" strokeLinecap="round" />
        <path d={d2} stroke={TRUNK} strokeWidth={1} strokeOpacity={0.4} fill="none" strokeLinecap="round" />
      </g>,
    );
  }

  // نبضات ضوء تسري في الجذر — أسرع في الدارة
  const pulses: React.ReactNode[] = [];
  const gap = 340;
  const phase = (frame * 22) % gap;
  for (let y = Math.floor(top / gap) * gap + phase; y < bottom; y += gap) {
    if (y < MARK_BOTTOM || y > Math.min(grow, WORLD.tip)) continue;
    const inBraid = y < WORLD.junction;
    const xs = inBraid ? [0, 1, 2, 3].map((i) => strandX(i, y)) : [rootX(y)];
    xs.forEach((x, i) => {
      const yy = inBraid ? y + i * 85 : y;
      const xx = inBraid ? strandX(i, yy) : x;
      const c = inBraid ? STRAND_COLORS[i] : y >= WORLD.circuitStart ? TRACE : TRUNK;
      pulses.push(
        <g key={`${y}-${i}`}>
          <circle cx={xx} cy={yy} r={12} fill={c} opacity={0.16} />
          <circle cx={xx} cy={yy} r={4.2} fill="#FFF8DC" opacity={0.95} />
        </g>,
      );
    });
  }

  // الدارة
  const circ = bottom > WORLD.circuitStart;
  const pts = CIRCUIT.filter(([, y]) => y <= bottom + 600);
  const lastPt: [number, number] = [circuitX(Math.min(bottom, WORLD.tip)), Math.min(bottom, WORLD.tip)];
  const poly = (dx: number) =>
    [...pts.filter(([, y]) => y < lastPt[1]), lastPt].map(([x, y], i) => `${i ? "L" : "M"}${x + dx} ${y}`).join("");
  const vias = CIRCUIT.slice(1, -1).filter(([, y]) => y > top && y < bottom);

  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <g transform={`translate(0 ${-cam})`}>
        {rootlets}
        {/* الضفيرة: أربع خيوط بألوان الكتب الأربعة الأولى */}
        {[0, 1, 2, 3].map((i) => (
          <Glow key={i} d={sample((y) => strandX(i, y), top, braidEnd)} color={STRAND_COLORS[i]} width={3} />
        ))}
        {/* الجذع الواحد بعد الملتقى */}
        <Glow d={sample(trunkX, Math.max(top, WORLD.junction - 40), orgEnd)} color={TRUNK} width={6.5} />
        {circ ? (
          <>
            <Glow d={poly(0)} color={TRACE} width={5} />
            <Glow d={poly(-26)} color={TRACE} width={2} opacity={0.6} />
            <Glow d={poly(26)} color={TRACE} width={2} opacity={0.6} />
            {vias.map(([x, y], i) => (
              <g key={i}>
                <circle cx={x} cy={y} r={11} fill="none" stroke={TRACE} strokeWidth={2.5} opacity={0.85} />
                <circle cx={x} cy={y} r={4} fill={TRACE} />
                <path
                  d={`M${x + (i % 2 ? 26 : -26)} ${y} h${i % 2 ? 120 : -120}`}
                  stroke={TRACE}
                  strokeWidth={2}
                  opacity={0.5}
                />
                <circle cx={x + (i % 2 ? 152 : -152)} cy={y} r={6} fill="none" stroke={TRACE} strokeWidth={2} opacity={0.6} />
              </g>
            ))}
          </>
        ) : null}
        {pulses}
      </g>
    </svg>
  );
};
