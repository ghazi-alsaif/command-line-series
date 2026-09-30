import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { enter, exit, lerp } from "../anim";
import { BookSpotlight } from "../components/BookSpotlight";
import { TypeLine } from "../components/Text";
import { BOOKS, byN } from "../data/books";
import { COPY } from "../data/copy";
import { BEATS, BOOK_OVERLAP } from "../timeline";
import { COLOR, FONT, glowFrom } from "../theme";

const NODE_X = [846, 642, 438, 234]; // من اليمين إلى اليسار
const RAIL_Y = 262;

// المشهد 4 — من الأمر إلى العالم الحقيقي: الأتمتة ← الخوادم ← الشبكات ← المشروعات
export const RealWorld: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const lead = BEATS.realLead;
  const slot = BEATS.realSlot;
  const books = [7, 8, 9, 10].map(byN);
  const accent = glowFrom(books[0].titleColor, 0.62);

  // تقدّم الخط على السكة
  const active = Math.max(0, Math.min(3, Math.floor((frame - lead) / slot)));
  const railP = lerp(
    0,
    1,
    Math.min(1, Math.max(0, (frame - lead + 10) / (slot * 3 + 10))),
  );
  const railIn = enter(frame, 0, 22);
  const railOut = exit(frame, dur - 18, 16);

  return (
    <AbsoluteFill>
      {/* السكة */}
      <div style={{ position: "absolute", inset: 0, opacity: railIn * (1 - railOut) }}>
        <div
          style={{
            position: "absolute",
            top: RAIL_Y,
            left: NODE_X[3],
            width: NODE_X[0] - NODE_X[3],
            height: 1,
            background: "rgba(243,238,226,0.16)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: RAIL_Y - 0.5,
            left: NODE_X[0] - (NODE_X[0] - NODE_X[3]) * railP,
            width: (NODE_X[0] - NODE_X[3]) * railP,
            height: 2,
            background: accent,
            boxShadow: `0 0 18px ${accent}`,
          }}
        />
        {COPY.realWorld.steps.map((label, i) => {
          const on = i <= active && frame >= lead + i * slot;
          const now = i === active;
          const pulse = enter(frame, lead + i * slot, 18);
          return (
            <React.Fragment key={label}>
              <div
                style={{
                  position: "absolute",
                  left: NODE_X[i],
                  top: RAIL_Y,
                  width: now ? 18 : 12,
                  height: now ? 18 : 12,
                  borderRadius: 3,
                  transform: `translate(-50%, -50%) rotate(45deg) scale(${on ? lerp(0.6, 1, pulse) : 1})`,
                  background: on ? accent : COLOR.night,
                  border: `1.5px solid ${on ? accent : "rgba(243,238,226,0.35)"}`,
                  boxShadow: now ? `0 0 24px ${accent}` : undefined,
                }}
              />
              <div
                dir="rtl"
                lang="ar"
                style={{
                  position: "absolute",
                  left: NODE_X[i] - 110,
                  width: 220,
                  top: RAIL_Y + 20,
                  textAlign: "center",
                  fontFamily: FONT.body,
                  fontWeight: now ? 600 : 400,
                  fontSize: 27,
                  color: on ? COLOR.text : "rgba(243,238,226,0.4)",
                  direction: "rtl",
                }}
              >
                {label}
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {books.map((b, i) => (
        <Sequence key={b.id} from={lead + i * slot} durationInFrames={slot + BOOK_OVERLAP} layout="none">
          <BookSpotlight
            book={b}
            total={BOOKS.length}
            hold={i === 3 ? slot + 4 : slot}
            exitDur={BOOK_OVERLAP}
            tempo="fast"
            coverWidth={490}
            cy={836}
          >
            <CommandChip text={b.command ?? ""} accent={accent} hold={slot} />
          </BookSpotlight>
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

// سطر أمر حقيقي من متن الكتاب — يتصل بالسكة بخيط رفيع
const CommandChip: React.FC<{ text: string; accent: string; hold: number }> = ({ text, accent, hold }) => {
  const frame = useCurrentFrame();
  const t = enter(frame, 2, 16);
  const o = exit(frame, hold, BOOK_OVERLAP);
  return (
    <div
      style={{
        position: "absolute",
        top: 348,
        width: "100%",
        display: "flex",
        justifyContent: "center",
        opacity: t * (1 - o),
        transform: `translateY(${(1 - t) * -12 + o * 10}px)`,
        filter: `blur(${(o * 6).toFixed(2)}px)`,
      }}
    >
      <div
        style={{
          padding: "10px 22px",
          borderRadius: 10,
          border: `1px solid ${glowFrom("#145A54", 0.6, 0.45)}`,
          background: "rgba(7,10,9,0.72)",
          boxShadow: `0 10px 30px rgba(0,0,0,0.4)`,
        }}
      >
        <TypeLine text={text} start={4} cps={30} size={30} color={COLOR.text} promptColor={accent} />
      </div>
    </div>
  );
};
