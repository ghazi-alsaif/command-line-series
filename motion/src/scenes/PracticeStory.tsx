import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { cam, enter, exit, lerp } from "../anim";
import { BookSpotlight, titleSize } from "../components/BookSpotlight";
import { Book3D } from "../components/Book3D";
import { FadeText, RevealText } from "../components/Text";
import { BOOKS, byN } from "../data/books";
import { COPY } from "../data/copy";
import { BEATS, BOOK_OVERLAP } from "../timeline";
import { COLOR, FONT, glowFrom } from "../theme";

// المشهد 3 — الممارسة ثم الحكاية
export const PracticeStory: React.FC = () => {
  const slot = BEATS.practiceSlot;
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={slot + BOOK_OVERLAP} layout="none">
        <BookSpotlight book={byN(5)} total={BOOKS.length} hold={slot} exitDur={BOOK_OVERLAP} />
      </Sequence>
      <Sequence from={slot} layout="none">
        <StoryBook dur={BEATS.storySlot} />
      </Sequence>
    </AbsoluteFill>
  );
};

// «رُوحٌ في الآلة»: حركة أهدأ، ضوء أدفأ، وخط زمني مجرّد يبدأ من 1969
const StoryBook: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const book = byN(6);
  const tIn = enter(frame, 0, 40);
  const drift = cam(frame, 0, dur);
  const accent = glowFrom(book.titleColor, 0.72);
  const w = 470;
  const cy = 700;

  const lineT = enter(frame, 10, 60);

  return (
    <AbsoluteFill>
      {/* سنة البداية بخط شبحي كبير */}
      <div
        dir="ltr"
        style={{
          position: "absolute",
          top: 330,
          width: "100%",
          textAlign: "center",
          fontFamily: FONT.mono,
          fontWeight: 700,
          fontSize: 300,
          letterSpacing: 12,
          color: COLOR.text,
          opacity: 0.05 * enter(frame, 6, 50),
          transform: `translateY(${lerp(30, -30, drift)}px)`,
        }}
      >
        {COPY.story.year}
      </div>

      {/* خط زمني مجرّد: يُرسم من اليمين إلى اليسار */}
      <div style={{ position: "absolute", top: 292, right: 170, left: 170, height: 40 }}>
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 19,
            height: 1,
            width: `${lineT * 100}%`,
            background: `linear-gradient(to left, ${accent}, rgba(243,238,226,0.15))`,
          }}
        />
        {[0, 0.26, 0.52, 0.78].map((p, i) => (
          <div
            key={p}
            style={{
              position: "absolute",
              right: `${p * 100}%`,
              top: i === 0 ? 13 : 16,
              width: i === 0 ? 13 : 7,
              height: i === 0 ? 13 : 7,
              borderRadius: "50%",
              background: i === 0 ? accent : "rgba(243,238,226,0.35)",
              transform: "translateX(50%)",
              opacity: lineT >= p ? enter(frame, 10 + p * 60, 12) : 0,
            }}
          />
        ))}
        <div
          dir="ltr"
          style={{
            position: "absolute",
            right: -8,
            top: -30,
            fontFamily: FONT.mono,
            fontSize: 22,
            color: accent,
            opacity: enter(frame, 16, 20),
            letterSpacing: 2,
          }}
        >
          {COPY.story.year}
        </div>
      </div>

      <Book3D
        src={book.cover}
        width={w}
        cy={cy}
        x={lerp(-120, 0, tIn)}
        z={lerp(-260, 0, tIn) + drift * 70}
        rotY={lerp(14, 0, tIn) + lerp(3, -3, drift)}
        blur={(1 - tIn) * 10}
        opacity={Math.min(1, tIn * 1.4)}
        glow={glowFrom(book.titleColor, 0.55, 0.35)}
      />

      <div
        style={{
          position: "absolute",
          top: cy + (w * 1.419) / 2 + 38,
          left: 90,
          right: 90,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
        }}
      >
        <FadeText
          dir="ltr"
          text={`${String(book.n).padStart(2, "0")} / ${String(BOOKS.length).padStart(2, "0")}`}
          start={16}
          size={24}
          font={FONT.mono}
          weight={500}
          color={accent}
          letterSpacing={4}
        />
        <RevealText text={book.title} start={20} dur={34} size={titleSize(book.title, 76)} weight={800} />
        <FadeText text={book.topic} start={34} size={32} weight={500} color={accent} />
        <RevealText
          text={COPY.story.quote}
          start={54}
          dur={40}
          size={42}
          weight={300}
          font={FONT.body}
          color={COLOR.text}
          lineHeight={1.7}
          maxWidth={860}
          style={{ marginTop: 18 }}
        />
      </div>
    </AbsoluteFill>
  );
};
