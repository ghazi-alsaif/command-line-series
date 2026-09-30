import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { COLOR, VIDEO } from "../theme";

// خلفية داكنة موحّدة للفيديو كله: تدرّج، شبكة خفيفة تنزاح ببطء (parallax)،
// توهّج بلون الكتاب الحالي، وتظليل للحواف.
export const Background: React.FC<{ accent: string; accentStrength?: number }> = ({
  accent,
  accentStrength = 1,
}) => {
  const frame = useCurrentFrame();
  const drift = frame * 0.35;
  const grid = 108;

  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.night }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(120% 80% at 50% 38%, ${COLOR.deep} 0%, ${COLOR.night} 70%)`,
        }}
      />
      {/* توهّج بلون الغلاف */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(60% 38% at 50% 40%, ${accent} 0%, transparent 72%)`,
          opacity: 0.34 * accentStrength,
        }}
      />
      {/* شبكة رفيعة — طبقتان بسرعتين للعمق */}
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${COLOR.hairline} 1px, transparent 1px), linear-gradient(90deg, ${COLOR.hairline} 1px, transparent 1px)`,
          backgroundSize: `${grid}px ${grid}px`,
          backgroundPosition: `${VIDEO.width / 2}px ${-drift}px`,
          opacity: 0.55,
          maskImage: "radial-gradient(75% 60% at 50% 45%, #000 20%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(75% 60% at 50% 45%, #000 20%, transparent 80%)",
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(rgba(243,238,226,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(243,238,226,0.05) 1px, transparent 1px)`,
          backgroundSize: `${grid / 3}px ${grid / 3}px`,
          backgroundPosition: `${VIDEO.width / 2}px ${-drift * 0.5}px`,
          opacity: 0.5,
          maskImage: "radial-gradient(55% 40% at 50% 42%, #000 0%, transparent 85%)",
          WebkitMaskImage: "radial-gradient(55% 40% at 50% 42%, #000 0%, transparent 85%)",
        }}
      />
      {/* تظليل الحواف */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(115% 75% at 50% 45%, transparent 55%, rgba(0,0,0,0.65) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
