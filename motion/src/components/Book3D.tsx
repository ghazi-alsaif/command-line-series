import React from "react";
import { Img, staticFile } from "remotion";

export const COVER_RATIO = 1419 / 1000; // ارتفاع/عرض صفحة الغلاف الرسمية (A5 تقريبًا)

export type BookPose = {
  x?: number; // إزاحة أفقية (px) من المركز
  y?: number; // إزاحة رأسية (px) من المركز
  z?: number; // العمق (px) — سالب = أبعد
  rotY?: number; // درجة
  rotX?: number;
  rotZ?: number;
  scale?: number;
  blur?: number;
  opacity?: number;
};

// كتاب بعمق ثلاثي الأبعاد حول الغلاف الأصلي كما هو:
// لا قصّ ولا تغيير للألوان ولا تشويه للنسبة. الكعب على اليمين (كتاب عربي).
export const Book3D: React.FC<
  BookPose & {
    src: string;
    width: number;
    glow?: string; // لون التوهّج خلف الكتاب
    shadow?: number; // 0..1
    perspective?: number;
    cx?: number; // مركز الكتاب داخل الإطار
    cy?: number;
  }
> = ({
  src,
  width,
  x = 0,
  y = 0,
  z = 0,
  rotY = 0,
  rotX = 0,
  rotZ = 0,
  scale = 1,
  blur = 0,
  opacity = 1,
  glow,
  shadow = 1,
  perspective = 1800,
  cx = 540,
  cy = 960,
}) => {
  const height = Math.round(width * COVER_RATIO);
  const depth = Math.max(8, Math.round(width * 0.05));

  if (opacity <= 0.001) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: "100%",
        height: "100%",
        opacity,
        filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : undefined,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          perspective,
          perspectiveOrigin: `${cx}px ${cy}px`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: cx - width / 2,
            top: cy - height / 2,
            width,
            height,
            transformStyle: "preserve-3d",
            transform: `translate3d(${x}px, ${y}px, ${z}px) rotateY(${rotY}deg) rotateX(${rotX}deg) rotateZ(${rotZ}deg) scale(${scale})`,
          }}
        >
          {/* ظل أرضي ناعم */}
          <div
            style={{
              position: "absolute",
              left: "8%",
              right: "8%",
              bottom: -height * 0.06,
              height: height * 0.12,
              borderRadius: "50%",
              background: "rgba(0,0,0,0.55)",
              filter: `blur(${Math.round(width * 0.06)}px)`,
              transform: `translateZ(${-depth - 2}px)`,
              opacity: shadow,
            }}
          />
          {/* الكعب (يمين) */}
          <div
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              width: depth,
              height,
              transformOrigin: "right center",
              transform: "rotateY(-90deg)",
              background:
                "linear-gradient(90deg, #3a2b18 0%, #6b5536 45%, #4a3822 100%)",
            }}
          />
          {/* حافة الصفحات (يسار) */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 2,
              width: depth,
              height: height - 4,
              transformOrigin: "left center",
              transform: "rotateY(90deg)",
              background:
                "repeating-linear-gradient(90deg, #efe4c8 0px, #efe4c8 2px, #d9cba8 2px, #d9cba8 3px)",
            }}
          />
          {/* الغلاف الأصلي */}
          <Img
            src={staticFile(src)}
            style={{
              position: "absolute",
              inset: 0,
              width,
              height,
              objectFit: "contain",
              borderRadius: Math.max(2, width * 0.008),
              boxShadow: `0 ${Math.round(width * 0.06)}px ${Math.round(width * 0.14)}px rgba(0,0,0,${0.55 * shadow})${
                glow ? `, 0 0 ${Math.round(width * 0.35)}px ${glow}` : ""
              }`,
              backfaceVisibility: "hidden",
            }}
          />
        </div>
      </div>
    </div>
  );
};
