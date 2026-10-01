import React from "react";
import { Img, interpolate, interpolateColors, staticFile, useCurrentFrame } from "remotion";
import { enter, exit, fmtThousands, lerp } from "../anim";
import { Book3D } from "../components/Book3D";
import { titleSize } from "../components/BookSpotlight";
import { Cursor, FadeText, RevealText } from "../components/Text";
import { BOOKS, SERIES } from "../data/books";
import { COLOR, FONT, glowFrom } from "../theme";
import { hash, MARK_H, MARK_W } from "./geometry";
import {
  BOOK_ANCHOR, COMMANDS, COVER_H, COVER_W, ENTER_AT, H, LAND, QUOTE_REVEAL, TYPING, W, WORLD, typedCount,
} from "./plan";

const SHADOW = "0 0 28px rgba(0,0,0,0.95), 0 0 8px rgba(0,0,0,0.9)";

// ── شعار الطرفية: الجزء العلوي من series-mark.png كما هو (بلا جذوره المرسومة) ──
export const MarkHead: React.FC<{ width?: number; style?: React.CSSProperties }> = ({ width = MARK_W, style }) => {
  const s = width / 228; // عرض الصندوق في الصورة الأصلية
  return (
    <div style={{ width, height: (MARK_H / MARK_W) * width, overflow: "hidden", position: "relative", ...style }}>
      <Img
        src={staticFile("brand/series-mark.png")}
        style={{ position: "absolute", width: 348 * s, left: -59 * s, top: -10 * s, maxWidth: "none" }}
      />
    </div>
  );
};

// ── سطر الأوامر في الافتتاح (وهو نفسه آخر إطار في الحلقة) ─────────────
export const Prompt: React.FC<{ y: number; text: string; typing?: boolean; opacity?: number; scale?: number }> = ({
  y, text, typing, opacity = 1, scale = 1,
}) => (
  <div
    dir="ltr"
    style={{
      position: "absolute",
      top: y - 40,
      width: "100%",
      display: "flex",
      justifyContent: "center",
      fontFamily: FONT.mono,
      fontSize: 58,
      fontWeight: 500,
      color: COLOR.text,
      opacity,
      transform: `scale(${scale})`,
      whiteSpace: "pre",
      alignItems: "baseline",
    }}
  >
    <span style={{ color: glowFrom("#1F6F5C", 0.62) }}>$&nbsp;</span>
    <span>{text}</span>
    <Cursor size={58} color={glowFrom("#1F6F5C", 0.66)} solid={typing} />
  </div>
);

// ── الخلفية: لون الطبقة يتغير مع العمق، وشبكة وغبار بحركة اختلاف المنظر ──
const STRATA: [number, string][] = [
  [0, "#070A09"],
  [1700, "#0E0B08"],
  [7400, "#0B0D0A"],
  [9000, "#0D0B11"],
  [10300, "#0B0A16"],
  [12100, "#04100E"],
  [17300, "#040807"],
];

export const Depths: React.FC<{ cam: number }> = ({ cam }) => {
  const frame = useCurrentFrame();
  const bg = interpolateColors(cam, STRATA.map((s) => s[0]), STRATA.map((s) => s[1]));
  const dust = (p: number, cell: number, seed: number, rMin: number, rMax: number, op: number, blur: number) => {
    const out: React.ReactNode[] = [];
    const off = cam * p;
    const k0 = Math.floor(off / cell) - 1;
    for (let k = k0; k < k0 + Math.ceil(H / cell) + 3; k++) {
      for (let j = 0; j < 3; j++) {
        const n = k * 3 + j + seed;
        const x = hash(n) * W;
        const y = k * cell + hash(n + 0.5) * cell - off + Math.sin(frame / 40 + n) * 4;
        const r = rMin + hash(n + 0.25) * (rMax - rMin);
        out.push(
          <div
            key={n}
            style={{
              position: "absolute", left: x, top: y, width: r * 2, height: r * 2, borderRadius: "50%",
              background: "#E9DCC0", opacity: op * (0.4 + hash(n + 0.75) * 0.6), filter: blur ? `blur(${blur}px)` : undefined,
            }}
          />,
        );
      }
    }
    return out;
  };
  const grid = 120;
  return (
    <div style={{ position: "absolute", inset: 0, background: bg }}>
      <div
        style={{
          position: "absolute", inset: 0,
          backgroundImage: `linear-gradient(rgba(243,238,226,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(243,238,226,0.045) 1px, transparent 1px)`,
          backgroundSize: `${grid}px ${grid}px`,
          backgroundPosition: `${W / 2}px ${-cam * 0.3}px`,
          maskImage: "radial-gradient(80% 60% at 50% 45%, #000 15%, transparent 85%)",
          WebkitMaskImage: "radial-gradient(80% 60% at 50% 45%, #000 15%, transparent 85%)",
        }}
      />
      {dust(0.45, 150, 11, 0.8, 1.8, 0.35, 0)}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(110% 70% at 50% 45%, transparent 50%, rgba(0,0,0,0.7) 100%)" }} />
    </div>
  );
};

export const NearDust: React.FC<{ cam: number }> = ({ cam }) => {
  const out: React.ReactNode[] = [];
  const p = 1.45;
  const cell = 420;
  const off = cam * p;
  const k0 = Math.floor(off / cell) - 1;
  for (let k = k0; k < k0 + 8; k++) {
    const n = k * 7 + 3;
    const x = hash(n) * W;
    const y = k * cell + hash(n + 0.5) * cell - off;
    const r = 3 + hash(n + 0.25) * 5;
    out.push(
      <div
        key={n}
        style={{
          position: "absolute", left: x, top: y, width: r * 2, height: r * 2, borderRadius: "50%",
          background: "#F3EEE2", opacity: 0.18, filter: "blur(3px)",
        }}
      />,
    );
  }
  return <>{out}</>;
};

// ── كتاب في العالم ───────────────────────────────────────────────────
export const WorldBook: React.FC<{ i: number; cam: number; vel: number }> = ({ i, cam, vel }) => {
  const frame = useCurrentFrame();
  const book = BOOKS[i];
  const sy = WORLD.books[i] - cam;
  if (sy < -1000 || sy > H + 900) return null;
  const land = LAND[i];
  const accent = glowFrom(book.titleColor, 0.68);
  const tilt = Math.max(-16, Math.min(16, -vel * 0.05));
  const sway = Math.sin((frame + i * 40) / 38) * 2.5;
  const ring = interpolate(frame, [land, land + 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const textTop = sy + COVER_H / 2 + 34;
  const calm = i === 5;
  const n = `${String(book.n).padStart(2, "0")} / ${String(BOOKS.length).padStart(2, "0")}`;
  const cmd = i >= 6 ? TYPING[1 + (i - 6)] : null;

  return (
    <>
      {/* هالة لون الكتاب */}
      <div
        style={{
          position: "absolute", left: 0, right: 0, top: sy - 700, height: 1400,
          background: `radial-gradient(48% 42% at 50% 50%, ${glowFrom(book.titleColor, 0.42, 0.5)} 0%, transparent 70%)`,
        }}
      />
      {/* حلقة الارتطام عند الهبوط */}
      {ring > 0 && ring < 1 ? (
        <div
          style={{
            position: "absolute", left: W / 2 - COVER_W / 2, top: sy - COVER_H / 2, width: COVER_W, height: COVER_H,
            border: `2px solid ${accent}`, borderRadius: 8, opacity: (1 - ring) * 0.8,
            transform: `scale(${1 + ring * 0.22})`,
          }}
        />
      ) : null}
      <Book3D
        src={book.cover}
        width={COVER_W}
        cy={sy}
        rotX={tilt}
        rotY={sway + (i % 2 ? -3 : 3)}
        glow={glowFrom(book.titleColor, 0.5, 0.3)}
      />
      {cmd ? (
        <div
          style={{
            position: "absolute", top: sy - COVER_H / 2 - 104, width: "100%", display: "flex", justifyContent: "center",
            opacity: enter(frame, land - 2, 8),
          }}
        >
          <div
            dir="ltr"
            style={{
              padding: "10px 22px", borderRadius: 10, border: `1px solid ${glowFrom("#145A54", 0.6, 0.5)}`,
              background: "rgba(4,10,9,0.85)", fontFamily: FONT.mono, fontSize: 32, color: COLOR.text, whiteSpace: "pre",
              display: "flex", alignItems: "baseline",
            }}
          >
            <span style={{ color: glowFrom("#145A54", 0.64) }}>$&nbsp;</span>
            {cmd.text.slice(0, typedCount(cmd, frame))}
            <Cursor size={32} color={glowFrom("#145A54", 0.64)} solid={typedCount(cmd, frame) < cmd.text.length} />
          </div>
        </div>
      ) : null}
      <div style={{ position: "absolute", top: textTop, left: 90, right: 90, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <FadeText dir="ltr" text={n} start={land - 4} size={24} font={FONT.mono} weight={500} color={accent} letterSpacing={4} style={{ textShadow: SHADOW }} />
        <RevealText text={book.title} start={land + (calm ? 6 : 1)} dur={calm ? 34 : 22} size={titleSize(book.title, 80)} weight={800} lineHeight={1.45} style={{ textShadow: SHADOW }} />
        <FadeText text={book.topic} start={land + (calm ? 18 : 9)} size={34} weight={500} color={accent} style={{ textShadow: SHADOW }} />
        {calm ? (
          <RevealText
            text={"في جيبك الآن جهازٌ يحمل رُوحًا\nعمرها أكثر من نصف قرن."}
            start={QUOTE_REVEAL.start}
            dur={QUOTE_REVEAL.dur}
            size={42}
            weight={300}
            font={FONT.body}
            lineHeight={1.7}
            style={{ marginTop: 20, textShadow: SHADOW }}
          />
        ) : null}
      </div>
    </>
  );
};

// ── علامات العالم: الافتتاح، الملتقى، طبقة 1969، الطرف ─────────────────
export const WorldMarks: React.FC<{ cam: number }> = ({ cam }) => {
  const frame = useCurrentFrame();
  const y = (wy: number) => wy - cam;

  // الافتتاح
  const hookOn = cam < 2000;
  const markIn = interpolate(frame, [58, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const typed = typedCount(TYPING[0], frame);
  const promptOut = enter(frame, 58, 10);

  // 1969
  const fy = y(WORLD.fossil);
  // الملتقى
  const jy = y(WORLD.junction);
  // الطرف
  const ty = y(WORLD.tip);

  return (
    <>
      {hookOn ? (
        <>
          <div style={{ position: "absolute", top: y(330), width: "100%", display: "flex", justifyContent: "center" }}>
            <FadeText text="سلسلة سطر الأوامر" start={66} size={42} weight={700} font={FONT.display} color={glowFrom("#1F6F5C", 0.66)} />
          </div>
          <div style={{ position: "absolute", top: y(430), width: "100%", display: "flex", justifyContent: "center" }}>
            <RevealText text={"من الصفر\nإلى فهم الآلة"} start={24} dur={26} size={108} weight={800} lineHeight={1.35} />
          </div>
          {promptOut < 1 ? (
            <Prompt y={y(WORLD.mark)} text={TYPING[0].text.slice(0, typed)} typing={frame >= 8 && frame <= ENTER_AT} opacity={1 - promptOut} scale={1 + promptOut * 0.5} />
          ) : null}
          {markIn > 0 ? (
            <div
              style={{
                position: "absolute", left: W / 2 - MARK_W / 2, top: y(WORLD.mark) - MARK_H / 2,
                opacity: markIn, transform: `scale(${lerp(0.55, 1, markIn)})`,
                filter: `drop-shadow(0 0 ${lerp(80, 36, markIn)}px ${glowFrom("#1F6F5C", 0.5, 0.7)})`,
              }}
            >
              <MarkHead />
            </div>
          ) : null}
          {/* وميض الانفجار */}
          <div
            style={{
              position: "absolute", left: W / 2 - 400, top: y(WORLD.mark) - 400, width: 800, height: 800, borderRadius: "50%",
              background: `radial-gradient(circle, rgba(255,248,220,0.55) 0%, transparent 60%)`,
              opacity: interpolate(frame, [60, 62, 80], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            }}
          />
        </>
      ) : null}

      {/* الملتقى: أربع خيوط تصير جذعًا واحدًا */}
      {jy > -400 && jy < H + 400 ? (
        <div style={{ position: "absolute", top: jy - 170, width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <RevealText text="أربعُ نوافذ." start={350} size={86} weight={800} style={{ textShadow: SHADOW }} />
          <RevealText text="حِرفةٌ واحدة." start={362} size={86} weight={800} color={glowFrom("#1F6F5C", 0.66)} style={{ textShadow: SHADOW }} />
          <FadeText dir="ltr" text="One craft, every system" start={376} size={28} font={FONT.mono} letterSpacing={2} style={{ marginTop: 10, textShadow: SHADOW }} />
        </div>
      ) : null}

      {/* طبقة 1969 */}
      {fy > -1200 && fy < H + 1200 ? (
        <>
          <div
            dir="ltr"
            style={{
              position: "absolute", top: fy - 700, width: "100%", textAlign: "center", fontFamily: FONT.mono, fontWeight: 700,
              fontSize: 330, letterSpacing: 10, color: "#C9C6E8", opacity: 0.06,
            }}
          >
            1969
          </div>
          <div style={{ position: "absolute", top: fy - 610, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(201,198,232,0.35), transparent)" }} />
          <div dir="ltr" style={{ position: "absolute", top: fy - 640, left: 110, fontFamily: FONT.mono, fontSize: 22, letterSpacing: 3, color: "rgba(201,198,232,0.6)" }}>
            1969 ─
          </div>
        </>
      ) : null}

      {/* الطرف: الجذر ينتهي بمؤشر */}
      {ty > -400 && ty < H + 400 ? (
        <>
          <div
            style={{
              position: "absolute", left: W / 2 - 300, top: ty - 300, width: 600, height: 600, borderRadius: "50%",
              background: `radial-gradient(circle, ${glowFrom("#145A54", 0.6, 0.45)} 0%, transparent 65%)`,
            }}
          />
          <div style={{ position: "absolute", top: ty - 30, width: "100%", display: "flex", justifyContent: "center" }}>
            <Cursor size={110} color="#FFF8DC" />
          </div>
          <div style={{ position: "absolute", top: ty + 110, width: "100%", display: "flex", justifyContent: "center" }}>
            <RevealText text="كل كتاب يبدأ من الصفر" start={852} size={58} weight={700} style={{ textShadow: SHADOW }} />
          </div>
        </>
      ) : null}
    </>
  );
};

// ── عدّاد العمق: يُقاس بالصفحات ───────────────────────────────────────
export const DepthMeter: React.FC<{ cam: number }> = ({ cam }) => {
  const frame = useCurrentFrame();
  const show = enter(frame, 100, 16) * (1 - exit(frame, 896, 10));
  if (show <= 0) return null;
  let pages = 0;
  BOOKS.forEach((b, i) => {
    pages += b.pages * interpolate(frame, [LAND[i], LAND[i] + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  });
  const ticks: React.ReactNode[] = [];
  const spacing = 60;
  const off = (cam * 0.6) % spacing;
  for (let k = 0; k < 9; k++) {
    const yy = 420 + k * spacing - off;
    if (yy < 410 || yy > 900) continue;
    const big = Math.round((cam * 0.6 + yy) / spacing) % 5 === 0;
    ticks.push(<div key={k} style={{ position: "absolute", top: yy, right: 0, width: big ? 22 : 11, height: 1.5, background: "rgba(243,238,226,0.5)" }} />);
  }
  return (
    <div style={{ position: "absolute", top: 250, right: 136, width: 220, height: 680, opacity: show }}>
      <div dir="rtl" style={{ textAlign: "right", fontFamily: FONT.body, fontSize: 24, color: COLOR.textDim, letterSpacing: 1 }}>
        العمق
      </div>
      <div dir="ltr" style={{ textAlign: "right", fontFamily: FONT.mono, fontSize: 52, fontWeight: 700, color: COLOR.text, lineHeight: 1.1 }}>
        {fmtThousands(pages)}
      </div>
      <div dir="rtl" style={{ textAlign: "right", fontFamily: FONT.body, fontSize: 24, color: COLOR.textDim }}>
        صفحة
      </div>
      <div style={{ position: "absolute", top: 160, right: 0, width: 1.5, height: 490, background: "linear-gradient(rgba(243,238,226,0.45), transparent)" }} />
      <div style={{ position: "absolute", top: 0, right: 0, width: 30, height: 680, maskImage: "linear-gradient(transparent 22%, #000 35%, #000 70%, transparent)", WebkitMaskImage: "linear-gradient(transparent 22%, #000 35%, #000 70%, transparent)" }}>
        {ticks}
      </div>
    </div>
  );
};

export { BOOK_ANCHOR, COMMANDS, SERIES };
