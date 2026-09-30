import React from "react";
import { useCurrentFrame } from "remotion";
import { enter, exit } from "../anim";
import { COLOR, FONT } from "../theme";

type TextStyle = {
  size: number;
  weight?: number;
  color?: string;
  font?: string;
  lineHeight?: number;
  letterSpacing?: number;
  align?: "center" | "right" | "left";
  maxWidth?: number;
};

// سطر عربي متصل يظهر بمسح ناعم من اليمين إلى اليسار (اتجاه القراءة).
// النص يبقى عقدة واحدة في DOM: لا تقسيم إلى حروف، فالتشكيل والوصل سليمان.
export const RevealText: React.FC<
  TextStyle & {
    text: string;
    start: number;
    dur?: number;
    exitAt?: number; // إطار بدء الخروج (اختياري)
    exitDur?: number;
    rise?: number;
    dir?: "rtl" | "ltr";
    lang?: string;
    style?: React.CSSProperties;
  }
> = ({
  text,
  start,
  dur = 26,
  exitAt,
  exitDur = 14,
  rise = 26,
  size,
  weight = 700,
  color = COLOR.text,
  font = FONT.display,
  lineHeight = 1.45,
  letterSpacing = 0,
  align = "center",
  maxWidth,
  dir = "rtl",
  lang = "ar",
  style,
}) => {
  const frame = useCurrentFrame();
  const t = enter(frame, start, dur);
  const o = exitAt !== undefined ? exit(frame, exitAt, exitDur) : 0;
  if (t <= 0) return null;

  // المسح: قناع متدرّج يتقدّم باتجاه القراءة
  const p = -20 + t * 140; // من -20% إلى 120%
  const toward = dir === "rtl" ? "to left" : "to right";
  const mask = `linear-gradient(${toward}, #000 ${p - 20}%, transparent ${p}%)`;

  return (
    <div
      dir={dir}
      lang={lang}
      style={{
        fontFamily: font,
        fontSize: size,
        fontWeight: weight,
        color,
        lineHeight,
        letterSpacing,
        textAlign: align,
        direction: dir,
        unicodeBidi: "isolate",
        maxWidth,
        padding: "0.12em 0.2em",
        transform: `translateY(${(1 - t) * rise - o * rise * 0.6}px)`,
        filter: `blur(${((1 - t) * 6 + o * 8).toFixed(2)}px)`,
        opacity: 1 - o,
        maskImage: t < 1 ? mask : undefined,
        WebkitMaskImage: t < 1 ? mask : undefined,
        whiteSpace: "pre-line",
        ...style,
      }}
    >
      {text}
    </div>
  );
};

// نص ثابت بتلاشي بسيط (للمعلومات الثانوية)
export const FadeText: React.FC<
  TextStyle & {
    text: string;
    start: number;
    dur?: number;
    exitAt?: number;
    exitDur?: number;
    dir?: "rtl" | "ltr";
    style?: React.CSSProperties;
  }
> = ({
  text,
  start,
  dur = 20,
  exitAt,
  exitDur = 12,
  size,
  weight = 400,
  color = COLOR.textDim,
  font = FONT.body,
  lineHeight = 1.5,
  letterSpacing = 0,
  align = "center",
  maxWidth,
  dir = "rtl",
  style,
}) => {
  const frame = useCurrentFrame();
  const t = enter(frame, start, dur);
  const o = exitAt !== undefined ? exit(frame, exitAt, exitDur) : 0;
  if (t <= 0) return null;
  return (
    <div
      dir={dir}
      lang={dir === "rtl" ? "ar" : "en"}
      style={{
        fontFamily: font,
        fontSize: size,
        fontWeight: weight,
        color,
        lineHeight,
        letterSpacing,
        textAlign: align,
        direction: dir,
        unicodeBidi: "isolate",
        maxWidth,
        opacity: t * (1 - o),
        transform: `translateY(${(1 - t) * 14}px)`,
        filter: `blur(${((1 - t) * 4 + o * 6).toFixed(2)}px)`,
        ...style,
      }}
    >
      {text}
    </div>
  );
};

// مؤشر الطرفية
export const Cursor: React.FC<{ size: number; color?: string; solid?: boolean }> = ({
  size,
  color = COLOR.text,
  solid,
}) => {
  const frame = useCurrentFrame();
  const on = solid || Math.floor(frame / 15) % 2 === 0;
  return (
    <span
      style={{
        display: "inline-block",
        width: size * 0.55,
        height: size * 0.12,
        background: color,
        opacity: on ? 1 : 0.15,
        transform: `translateY(${size * 0.08}px)`,
        marginInlineStart: size * 0.12,
        boxShadow: on ? `0 0 ${size * 0.4}px ${color}` : undefined,
      }}
    />
  );
};

// سطر أوامر لاتيني يُكتب حرفًا حرفًا (مسموح هنا لأنه نص لاتيني أحادي الاتجاه)
export const TypeLine: React.FC<{
  prompt?: string;
  text: string;
  start: number;
  cps?: number; // حروف في الثانية
  size: number;
  color?: string;
  promptColor?: string;
  cursor?: boolean;
  fps?: number;
}> = ({ prompt = "$", text, start, cps = 24, size, color = COLOR.text, promptColor, cursor = true, fps = 30 }) => {
  const frame = useCurrentFrame();
  const n = Math.max(0, Math.min(text.length, Math.floor(((frame - start) / fps) * cps)));
  const typing = n < text.length && frame >= start;
  return (
    <div
      dir="ltr"
      lang="en"
      style={{
        fontFamily: FONT.mono,
        fontSize: size,
        fontWeight: 500,
        color,
        direction: "ltr",
        unicodeBidi: "isolate",
        whiteSpace: "pre",
        display: "flex",
        alignItems: "baseline",
      }}
    >
      {prompt ? <span style={{ color: promptColor ?? color, opacity: 0.8 }}>{prompt}&nbsp;</span> : null}
      <span>{text.slice(0, n)}</span>
      {cursor ? <Cursor size={size} color={promptColor ?? color} solid={typing} /> : null}
    </div>
  );
};
