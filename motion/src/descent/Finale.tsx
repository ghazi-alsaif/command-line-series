import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { cam as camEase, enter, exit, fmtThousands, lerp } from "../anim";
import { Book3D, COVER_RATIO } from "../components/Book3D";
import { FadeText, RevealText } from "../components/Text";
import { BOOKS, SERIES } from "../data/books";
import { COPY } from "../data/copy";
import { COLOR, FONT, glowFrom } from "../theme";
import { MarkHead, Prompt } from "./World";
import { HERO, HERO_LAND, HERO_TEXT, LOOP_CLOSE, OUTRO, TOTAL, W } from "./plan";

// ── الشجرة: الكتب العشرة معلّقة على جذور الشعار، بترتيب السلسلة ────────────
const CW = 168;
const CH = Math.round(CW * COVER_RATIO);
const MARK_Y = 330;
const MARK_HEAD_W = 150;
const MARK_BOTTOM = MARK_Y + (234 / 300) * MARK_HEAD_W / 2;
const ROWS = [
  { ids: [0, 1, 2, 3], y: 552 },
  { ids: [4, 5], y: 552 + CH + 30 },
  { ids: [6, 7, 8, 9], y: 552 + 2 * (CH + 30) },
];
const SLOTS = (() => {
  const s: { i: number; x: number; y: number }[] = [];
  ROWS.forEach((r) => {
    const rowW = r.ids.length * CW + (r.ids.length - 1) * 22;
    r.ids.forEach((i, k) => s.push({ i, x: W / 2 + rowW / 2 - CW / 2 - k * (CW + 22), y: r.y }));
  });
  return s.sort((a, b) => a.i - b.i);
})();

const bez = (x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, u: number) => {
  const m = 1 - u;
  return [
    m * m * m * x0 + 3 * m * m * u * x1 + 3 * m * u * u * x2 + u * u * u * x3,
    m * m * m * y0 + 3 * m * m * u * y1 + 3 * m * u * u * y2 + u * u * u * y3,
  ];
};

export const HeroTree: React.FC = () => {
  const frame = useCurrentFrame(); // مطلق
  const t = frame - HERO;
  const zoom = enter(frame, HERO, 30);
  const push = camEase(frame, HERO, OUTRO - HERO);
  const draw = enter(frame, HERO + 2, 34);
  const markIn = enter(frame, HERO, 16);

  return (
    <AbsoluteFill style={{ transform: `scale(${lerp(1.7, 1, zoom) * (1 + push * 0.012)})`, transformOrigin: "50% 40%" }}>
      <svg width={W} height={1920} style={{ position: "absolute", inset: 0 }}>
        {SLOTS.map((s) => {
          const top = s.y - CH / 2 + 8;
          const d = `M540 ${MARK_BOTTOM} C540 ${MARK_BOTTOM + (top - MARK_BOTTOM) * 0.55} ${s.x} ${top - (top - MARK_BOTTOM) * 0.45} ${s.x} ${top}`;
          const c = glowFrom(BOOKS[s.i].titleColor, 0.62);
          const p = Math.min(1, Math.max(0, draw * 1.25 - s.i * 0.025));
          return (
            <g key={s.i}>
              <path d={d} stroke={c} strokeWidth={9} strokeOpacity={0.12} fill="none" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} />
              <path d={d} stroke={c} strokeWidth={2.4} fill="none" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} strokeLinecap="round" />
              {/* نبضة تسري على كل جذر */}
              {p >= 1
                ? [0, 0.5].map((o) => {
                    const u = (((frame - HERO) * 0.025 + o + s.i * 0.13) % 1 + 1) % 1;
                    const P = bez(540, MARK_BOTTOM, 540, MARK_BOTTOM + (top - MARK_BOTTOM) * 0.55, s.x, top - (top - MARK_BOTTOM) * 0.45, s.x, top, u);
                    return (
                      <g key={o}>
                        <circle cx={P[0]} cy={P[1]} r={9} fill={c} opacity={0.25} />
                        <circle cx={P[0]} cy={P[1]} r={3.2} fill="#FFF8DC" />
                      </g>
                    );
                  })
                : null}
            </g>
          );
        })}
      </svg>
      <div
        style={{
          position: "absolute", left: W / 2 - MARK_HEAD_W / 2, top: MARK_Y - (234 / 300) * MARK_HEAD_W / 2,
          opacity: markIn, filter: `drop-shadow(0 0 30px ${glowFrom("#1F6F5C", 0.5, 0.7)})`,
        }}
      >
        <MarkHead width={MARK_HEAD_W} />
      </div>
      {SLOTS.map((s) => {
        const land = HERO_LAND[s.i];
        const k = enter(frame, land - 8, 16);
        const ring = interpolate(frame, [land, land + 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const b = BOOKS[s.i];
        return (
          <React.Fragment key={s.i}>
            {ring > 0 && ring < 1 ? (
              <div
                style={{
                  position: "absolute", left: s.x - CW / 2, top: s.y - CH / 2, width: CW, height: CH, borderRadius: 4,
                  border: `1.5px solid ${glowFrom(b.titleColor, 0.66)}`, opacity: 1 - ring, transform: `scale(${1 + ring * 0.25})`,
                }}
              />
            ) : null}
            <Book3D
              src={b.cover}
              width={CW}
              cx={s.x}
              cy={s.y}
              y={lerp(160, 0, k)}
              z={lerp(-500, 0, k)}
              rotX={lerp(-24, 0, k)}
              blur={(1 - k) * 10}
              opacity={Math.min(1, k * 1.6)}
              glow={glowFrom(b.titleColor, 0.5, 0.25)}
              shadow={0.6}
              perspective={1600}
            />
          </React.Fragment>
        );
      })}
      <div style={{ position: "absolute", top: 1226, width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <RevealText text={COPY.hero.count} start={HERO_TEXT.count} size={76} weight={800} lineHeight={1.3} />
        <div
          dir="rtl"
          style={{
            fontFamily: FONT.body, fontWeight: 600, fontSize: 38, color: glowFrom("#C0592B", 0.68), direction: "rtl",
            opacity: enter(frame, HERO_TEXT.pages, 12),
          }}
        >
          <bdi>{fmtThousands(SERIES.totalPages * enter(frame, HERO_TEXT.pages, 30))}</bdi> {COPY.hero.pagesLabel}
        </div>
        <FadeText text={COPY.hero.tagline} start={HERO_TEXT.tagline} size={40} weight={600} font={FONT.display} color={COLOR.text} style={{ marginTop: 8 }} />
      </div>
      {/* وميض الانفجار */}
      <AbsoluteFill
        style={{
          background: "#FFF8DC",
          opacity: t < 0 ? 0 : interpolate(t, [0, 1, 14], [0, 0.35, 0], { extrapolateRight: "clamp" }),
        }}
      />
    </AbsoluteFill>
  );
};

// ── الخاتمة: الشعار ينفتح ورقًا دافئًا، ثم ينغلق على المؤشر فتعود الحلقة ──
export const PaperOutro: React.FC = () => {
  const frame = useCurrentFrame();
  const open = enter(frame, OUTRO, 40);
  const close = exit(frame, LOOP_CLOSE, 28);
  const soft = 220;
  const rOpen = lerp(0, 2000, open);
  const rClose = lerp(2000, 0, close);
  const cx = 540;
  const cy = close > 0 ? lerp(330, 900, Math.min(1, close * 1.4)) : 330;
  const r = close > 0 ? rClose : rOpen;
  const mask = `radial-gradient(circle at ${cx}px ${cy}px, #000 ${Math.max(0, r - soft)}px, transparent ${r}px)`;
  const idIn = enter(frame, OUTRO + 16, 34);
  const out = 1 - enter(frame, LOOP_CLOSE - 6, 14);

  return (
    <AbsoluteFill style={{ maskImage: mask, WebkitMaskImage: mask }}>
      <AbsoluteFill style={{ background: `radial-gradient(90% 70% at 50% 42%, ${COLOR.paper} 0%, ${COLOR.sand} 75%, #E3D6B8 100%)` }} />
      <AbsoluteFill
        style={{
          backgroundImage: "linear-gradient(rgba(22,74,62,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(22,74,62,0.06) 1px, transparent 1px)",
          backgroundSize: "120px 120px",
          backgroundPosition: `540px ${-frame * 0.25}px`,
          maskImage: "radial-gradient(70% 55% at 50% 45%, #000 10%, transparent 85%)",
          WebkitMaskImage: "radial-gradient(70% 55% at 50% 45%, #000 10%, transparent 85%)",
        }}
      />
      <div style={{ opacity: out }}>
        <div
          style={{
            position: "absolute", top: 400, width: "100%", display: "flex", justifyContent: "center",
            opacity: idIn, transform: `scale(${lerp(1.06, 1, idIn)})`, filter: `blur(${((1 - idIn) * 8).toFixed(2)}px)`,
          }}
        >
          <Img src={staticFile("brand/series-identity.png")} style={{ width: 820 }} />
        </div>
        <div style={{ position: "absolute", top: 990, left: 90, right: 90, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <FadeText text={COPY.outro.requirement} start={OUTRO + 44} size={40} weight={500} color={COLOR.ink} />
          <FadeText text={COPY.outro.author} start={OUTRO + 60} size={34} weight={600} color={COLOR.pineDeep} style={{ marginTop: 40 }} />
          <FadeText dir="ltr" text={COPY.outro.repo} start={OUTRO + 76} size={30} weight={500} font={FONT.mono} color={COLOR.pineDeep} style={{ marginTop: 36 }} />
          <FadeText dir="ltr" text={COPY.outro.site} start={OUTRO + 86} size={26} font={FONT.mono} color="#5E5B66" />
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** الإطار الأخير يطابق الإطار الأول: الحلقة بلا خياطة ظاهرة */
export const LoopPrompt: React.FC = () => {
  const frame = useCurrentFrame();
  const a = enter(frame, LOOP_CLOSE + 26, 8);
  if (a <= 0 || frame >= TOTAL) return null;
  return <Prompt y={900} text="" opacity={a} />;
};
