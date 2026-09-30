import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { cam, enter, exit, lerp } from "../anim";
import { Book } from "../data/books";
import { COLOR, FONT, glowFrom } from "../theme";
import { Book3D } from "./Book3D";
import { FadeText, RevealText } from "./Text";

const stripMarks = (s: string) => s.replace(/[ً-ٰٟ]/g, "");

/** حجم عنوان يتسع في سطر واحد تقريبًا ضمن العرض المتاح */
export const titleSize = (title: string, max = 80, maxWidth = 860) =>
  Math.round(Math.min(max, maxWidth / (stripMarks(title).length * 0.6)));

export type Tempo = "calm" | "normal" | "fast";

const TEMPO = {
  calm: { enterDur: 34, textDelay: 14, travel: 180, rot: 18, z: 380 },
  normal: { enterDur: 26, textDelay: 9, travel: 280, rot: 30, z: 520 },
  fast: { enterDur: 20, textDelay: 6, travel: 320, rot: 34, z: 560 },
} as const;

// كتاب واحد في الضوء: الغلاف بطل المشهد، ثم العنوان، ثم وصف قصير من README.
// يدخل من اليسار ويخرج إلى اليمين (تقدّم القراءة العربية).
export const BookSpotlight: React.FC<{
  book: Book;
  total: number;
  hold: number; // الإطار الذي يبدأ عنده الخروج
  exitDur: number;
  tempo?: Tempo;
  coverWidth?: number;
  cy?: number;
  textTop?: number;
  children?: React.ReactNode; // عناصر إضافية (سطر أوامر…)
  subtitle?: string;
}> = ({
  book,
  total,
  hold,
  exitDur,
  tempo = "normal",
  coverWidth = 560,
  cy = 790,
  textTop,
  children,
  subtitle,
}) => {
  const frame = useCurrentFrame();
  const T = TEMPO[tempo];
  const tIn = enter(frame, 0, T.enterDur);
  const tOut = exit(frame, hold, exitDur);
  const drift = cam(frame, 0, hold + exitDur);

  const x = lerp(-T.travel, 0, tIn) + lerp(0, T.travel * 1.1, tOut);
  const z = lerp(-T.z, 0, tIn) + drift * 60 - tOut * T.z * 0.6;
  const rotY = lerp(T.rot, 0, tIn) + lerp(5, -5, drift) - tOut * T.rot;
  const rotX = lerp(6, 0, tIn) + tOut * 3;
  const blur = (1 - tIn) * 14 + tOut * 12;
  const opacity = Math.min(1, tIn * 1.6) * (1 - tOut);

  const coverH = coverWidth * (1419 / 1000);
  const top = textTop ?? cy + coverH / 2 + 46;
  const accent = glowFrom(book.titleColor, 0.66);
  const d = T.textDelay;
  const tSize = titleSize(book.title);

  return (
    <AbsoluteFill>
      {/* إطار رفيع بلون الغلاف خلف الكتاب */}
      <div
        style={{
          position: "absolute",
          left: 540 - (coverWidth + 90) / 2,
          top: cy - (coverH + 90) / 2,
          width: coverWidth + 90,
          height: coverH + 90,
          border: `1px solid ${glowFrom(book.titleColor, 0.6, 0.35)}`,
          borderRadius: 6,
          opacity: enter(frame, 6, 30) * (1 - tOut),
          transform: `scale(${lerp(1.08, 1, enter(frame, 6, 30))})`,
        }}
      />
      <Book3D
        src={book.cover}
        width={coverWidth}
        cy={cy}
        x={x}
        z={z}
        rotY={rotY}
        rotX={rotX}
        blur={blur}
        opacity={opacity}
        glow={glowFrom(book.titleColor, 0.5, 0.28)}
      />
      {children}
      <div
        style={{
          position: "absolute",
          top,
          left: 80,
          right: 80,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
        }}
      >
        <FadeText
          dir="ltr"
          text={`${String(book.n).padStart(2, "0")} / ${String(total).padStart(2, "0")}`}
          start={d}
          exitAt={hold - 8}
          exitDur={10}
          size={24}
          font={FONT.mono}
          weight={500}
          color={accent}
          letterSpacing={4}
        />
        <RevealText
          text={book.title}
          start={d + 3}
          exitAt={hold - 8}
          exitDur={10}
          size={tSize}
          weight={800}
          color={COLOR.text}
          lineHeight={1.5}
        />
        <FadeText
          text={subtitle ?? book.topic}
          start={d + 12}
          exitAt={hold - 8}
          exitDur={10}
          size={36}
          weight={500}
          color={accent}
        />
      </div>
    </AbsoluteFill>
  );
};
