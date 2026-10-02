import { ThreeCanvas } from "@remotion/three";
import React, { useEffect, useMemo, useState } from "react";
import { AbsoluteFill, Audio, Img, Sequence, cancelRender, continueRender, delayRender, interpolate, staticFile, useCurrentFrame } from "remotion";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { enter, exit, fmtThousands } from "../anim";
import { Cursor, FadeText, RevealText } from "../components/Text";
import { BOOKS, SERIES } from "../data/books";
import { COPY } from "../data/copy";
import { loadLocalFonts } from "../fonts";
import { COLOR, FONT, glowFrom } from "../theme";
import { BookMesh, preloadTextures } from "./BookMesh";
import { BOOK_H, FRONT_POS, T, TOWER_H, bookPose, camera, prog, easeInOut } from "./choreo";
import {
  COUNT, DIVE, DOLLY, ENTER, FADE, FRONT, HELIX_END, LAND, LIFT, LIGHT_ON, OPEN, OUTRO, TOTAL, TYPE,
} from "./plan";

loadLocalFonts();

const SHADOW = "0 0 24px rgba(0,0,0,0.95), 0 0 6px rgba(0,0,0,0.9)";
const BG = "#060504";

const lightLevel = (f: number) => {
  if (f < LIGHT_ON) return 0;
  // وميض مصباح يشتعل
  const k = [1, 0.25, 0.9, 0.5, 1, 0.85, 1];
  const i = f - LIGHT_ON;
  return i < k.length ? k[i] : 1;
};

// ── الكاميرا ─────────────────────────────────────────────────────────
const CameraRig: React.FC<{ frame: number }> = ({ frame }) => {
  const cam = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const c = camera(frame);
  let shake = 0;
  for (const l of LAND) {
    const d = frame - l;
    if (d >= 0 && d < 12) shake += Math.sin(d * 2.2) * 0.22 * Math.exp(-d / 3.5);
  }
  cam.position.set(c.pos.x, c.pos.y + shake, c.pos.z);
  cam.fov = c.fov;
  cam.near = 0.5;
  cam.far = 1500;
  cam.lookAt(c.target);
  // إزاحة الإطار لأعلى في لقطات البرج لتبقى المساحة السفلية للنص
  const off = 300 * easeInOut(prog(frame, LAND[2], LAND[8])) * (1 - easeInOut(prog(frame, LIFT, LIFT + 50)));
  if (off > 0.5) cam.setViewOffset(1080, 1920, 0, off, 1080, 1920);
  else cam.clearViewOffset();
  cam.updateProjectionMatrix();
  return null;
};

// ── شعاع الضوء الحجمي ─────────────────────────────────────────────────
const beamMat = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  side: THREE.DoubleSide,
  uniforms: { uStrength: { value: 0 }, uColor: { value: new THREE.Color("#ffd9a0") } },
  vertexShader: `varying vec2 vUv; varying vec3 vN; varying vec3 vV;
    void main(){ vUv=uv; vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `uniform float uStrength; uniform vec3 uColor; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
    void main(){ float edge=pow(abs(dot(vN,vV)),1.6); float fall=pow(vUv.y,1.4); gl_FragColor=vec4(uColor, edge*fall*uStrength); }`,
});

const Beam: React.FC<{ from: THREE.Vector3; to: THREE.Vector3; angle: number; strength: number }> = ({ from, to, angle, strength }) => {
  const len = from.distanceTo(to);
  const mid = from.clone().add(to).multiplyScalar(0.5);
  const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), from.clone().sub(to).normalize());
  beamMat.uniforms.uStrength.value = strength;
  return (
    <mesh position={mid} quaternion={quat} material={beamMat}>
      <coneGeometry args={[Math.tan(angle) * len, len, 64, 1, true]} />
    </mesh>
  );
};

// ── غبار يسبح في الضوء ───────────────────────────────────────────────
const Dust: React.FC<{ frame: number; center: THREE.Vector3; opacity: number }> = ({ frame, center, opacity }) => {
  const base = useMemo(() => {
    const n = 500;
    const a = new Float32Array(n * 3);
    let s = 7;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < n; i++) {
      const rr = Math.sqrt(r()) * 22;
      const t = r() * Math.PI * 2;
      a[i * 3] = Math.cos(t) * rr;
      a[i * 3 + 1] = r() * 90;
      a[i * 3 + 2] = Math.sin(t) * rr;
    }
    return a;
  }, []);
  const geo = useMemo(() => new THREE.BufferGeometry(), []);
  const arr = new Float32Array(base.length);
  for (let i = 0; i < base.length; i += 3) {
    arr[i] = base[i] + Math.sin(frame / 50 + i) * 0.8 + center.x;
    arr[i + 1] = ((base[i + 1] + frame * 0.05) % 90) + center.y - 10;
    arr[i + 2] = base[i + 2] + Math.cos(frame / 60 + i) * 0.8 + center.z;
  }
  geo.setAttribute("position", new THREE.BufferAttribute(arr, 3));
  return (
    <points geometry={geo}>
      <pointsMaterial size={0.32} color="#ffe2b0" transparent opacity={0.32 * opacity} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
    </points>
  );
};

// ── المشهد ثلاثي الأبعاد ──────────────────────────────────────────────
const World: React.FC<{ frame: number }> = ({ frame }) => {
  const L = lightLevel(frame);
  const target = useMemo(() => new THREE.Object3D(), []);
  const frontTarget = useMemo(() => {
    const o = new THREE.Object3D();
    o.position.copy(FRONT_POS);
    o.updateMatrixWorld();
    return o;
  }, []);
  const c = camera(frame);

  // الضوء يتبع الحدث
  const stackAim = new THREE.Vector3(0, Math.min(TOWER_H, 6 + TOWER_H * prog(frame, LAND[0], LAND[9])) * 0.5, 0);
  const helixAim = new THREE.Vector3(0, c.target.y, 0);
  const frontAim = FRONT_POS.clone();
  const tH = easeInOut(prog(frame, LIFT, LIFT + 60));
  const tF = easeInOut(prog(frame, FRONT, FRONT + 40));
  const aim = stackAim.clone().lerp(helixAim, tH).lerp(frontAim, tF);
  target.position.copy(aim);
  target.updateMatrixWorld();
  const lightPos = new THREE.Vector3(8, aim.y + 150, 34);
  const angle = 0.3 + tH * 0.16 - tF * 0.12;
  const beam = L * (1 - tH) * 0.11;

  return (
    <>
      <color attach="background" args={[BG]} />
      <fog attach="fog" args={[BG, 150, 430]} />
      <CameraRig frame={frame} />
      <primitive object={target} />
      <primitive object={frontTarget} />
      <ambientLight intensity={0.05 * L} />
      <hemisphereLight args={["#ffe9c4", "#0b0806", 0.22 * L]} />
      <spotLight
        position={lightPos}
        target={target}
        angle={angle}
        penumbra={0.75}
        intensity={3.4 * L}
        decay={0}
        color="#ffdcae"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0003}
        shadow-camera-near={20}
        shadow-camera-far={600}
      />
      {/* حافة خضراء صنوبرية من الخلف */}
      <directionalLight position={[-40, 80, -120]} intensity={0.9 * L} color="#4FB89A" />
      <directionalLight position={[60, 30, 90]} intensity={0.16 * L} color="#ffe6c8" />
      {/* إضاءة أمامية دافئة للكتاب المفتوح */}
      <spotLight position={[18, FRONT_POS.y + 40, 90]} target={frontTarget} angle={0.35} penumbra={0.8} intensity={2.6 * tF} decay={0} color="#ffe4bd" />
      {/* الطاولة */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[900, 900]} />
        <meshStandardMaterial color="#1a140f" roughness={0.9} />
      </mesh>
      {beam > 0.001 ? <Beam from={lightPos} to={new THREE.Vector3(aim.x, 0, aim.z)} angle={angle} strength={beam} /> : null}
      <Dust frame={frame} center={new THREE.Vector3(0, aim.y * 0.6, 0)} opacity={L * (1 - tF)} />
      {BOOKS.map((b, i) => (
        <BookMesh
          key={b.id}
          id={b.id}
          thickness={T[i]}
          pose={bookPose(i, frame)}
          pages={i === 0 ? { leafFront: "3d/page-1-linux-13.jpg", leafBack: "3d/page-1-linux-14.jpg", block: "3d/page-1-linux-15.jpg" } : undefined}
        />
      ))}
    </>
  );
};

// ── الطبقة النصية ─────────────────────────────────────────────────────
const Terminal: React.FC<{ frame: number }> = ({ frame }) => {
  const n = Math.max(0, Math.min(TYPE.text.length, Math.floor((frame - TYPE.start) / TYPE.step) + 1));
  const out = 1 - enter(frame, LIGHT_ON, 8);
  if (out <= 0) return null;
  const dirs = BOOKS.map((b) => b.id);
  const shown = frame >= ENTER ? Math.min(dirs.length, Math.floor((frame - ENTER) * 2.2) + 1) : 0;
  return (
    <div dir="ltr" style={{ position: "absolute", top: 780, left: 150, right: 150, fontFamily: FONT.mono, color: COLOR.text, opacity: out }}>
      <div style={{ fontSize: 50, display: "flex", alignItems: "baseline", whiteSpace: "pre" }}>
        <span style={{ color: glowFrom("#1F6F5C", 0.64) }}>$ </span>
        {TYPE.text.slice(0, frame >= TYPE.start ? n : 0)}
        {frame < ENTER ? <Cursor size={50} color={glowFrom("#1F6F5C", 0.66)} solid={frame >= TYPE.start} /> : null}
      </div>
      <div style={{ marginTop: 22, display: "grid", gridTemplateColumns: "1fr 1fr", rowGap: 8, fontSize: 32, color: "rgba(243,238,226,0.75)" }}>
        {dirs.slice(0, shown).map((d) => (
          <div key={d}>{d}/</div>
        ))}
      </div>
    </div>
  );
};

const Labels: React.FC<{ frame: number }> = ({ frame }) => (
  <>
    <div style={{ position: "absolute", top: 300, width: "100%", display: "flex", justifyContent: "center" }}>
      <RevealText text={"من الصفر\nإلى فهم الآلة"} start={LIGHT_ON + 6} exitAt={LAND[0] + 30} size={88} weight={800} lineHeight={1.35} style={{ textShadow: SHADOW }} />
    </div>
    {BOOKS.map((b, i) => {
      const s = LAND[i] + 1;
      if (frame < s - 2 || frame > s + 46) return null;
      const accent = glowFrom(b.titleColor, 0.68);
      return (
        <div key={b.id} style={{ position: "absolute", top: 1290, left: 90, right: 90, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <FadeText dir="ltr" text={`${String(b.n).padStart(2, "0")} / 10`} start={s} exitAt={s + 34} size={24} font={FONT.mono} weight={500} color={accent} letterSpacing={4} style={{ textShadow: SHADOW }} />
          <RevealText text={b.title} start={s + 1} dur={16} exitAt={s + 34} size={Math.min(76, Math.round(860 / (b.title.replace(/[ً-ْ]/g, "").length * 0.58)))} weight={800} style={{ textShadow: SHADOW }} />
          <FadeText text={b.topic} start={s + 6} exitAt={s + 34} size={32} weight={500} color={accent} style={{ textShadow: SHADOW }} />
        </div>
      );
    })}
    {/* البرج كاملًا */}
    <div style={{ position: "absolute", top: 1240, width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <RevealText text={COPY.hero.count} start={COUNT + 30} exitAt={LIFT + 10} size={80} weight={800} lineHeight={1.3} style={{ textShadow: SHADOW }} />
      <div dir="rtl" style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 40, color: glowFrom("#C0592B", 0.7), opacity: enter(frame, COUNT + 40, 12) * (1 - exit(frame, LIFT + 10, 12)), textShadow: SHADOW }}>
        <bdi>{fmtThousands(SERIES.totalPages * enter(frame, COUNT + 40, 40))}</bdi> {COPY.hero.pagesLabel}
      </div>
      <FadeText text="سماكة كل كتاب هنا بعدد صفحاته" start={COUNT + 60} exitAt={LIFT + 10} size={30} weight={400} style={{ marginTop: 10, textShadow: SHADOW }} />
    </div>
    {/* اللولب: درج يصعد — تعتيم علوي خلف النص */}
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 720, background: "linear-gradient(rgba(6,5,4,0.92) 30%, transparent)", opacity: enter(frame, LIFT + 40, 16) * (1 - exit(frame, HELIX_END - 20, 14)) }} />
    <div style={{ position: "absolute", top: 270, left: 90, right: 90, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <RevealText text="كل كتاب يبدأ من الصفر" start={LIFT + 50} exitAt={HELIX_END - 20} size={64} weight={800} style={{ textShadow: SHADOW }} />
      <RevealText text={"ويعطي القارئ مفتاحًا\nيفتح به الباب التالي"} start={LIFT + 80} exitAt={HELIX_END - 20} size={50} weight={600} lineHeight={1.5} color={glowFrom("#1F6F5C", 0.68)} style={{ marginTop: 6, textShadow: SHADOW }} />
    </div>
    {/* الكتاب المفتوح */}
    <div style={{ position: "absolute", top: 300, width: "100%", display: "flex", justifyContent: "center" }}>
      <RevealText text="مفهوم ← جرّب بنفسك ← تحدٍّ" start={OPEN[0] + 20} exitAt={DOLLY[0] + 30} size={56} weight={700} style={{ textShadow: SHADOW }} />
    </div>
  </>
);

const Outro: React.FC<{ frame: number }> = ({ frame }) => {
  const a = enter(frame, DIVE[0] + 12, 18);
  if (a <= 0) return null;
  const idIn = enter(frame, OUTRO + 4, 30);
  return (
    <AbsoluteFill style={{ opacity: a }}>
      <AbsoluteFill style={{ background: `radial-gradient(90% 70% at 50% 42%, ${COLOR.paper} 0%, ${COLOR.sand} 80%, #E3D6B8 100%)` }} />
      <div style={{ position: "absolute", top: 400, width: "100%", display: "flex", justifyContent: "center", opacity: idIn, transform: `scale(${1.06 - idIn * 0.06})`, filter: `blur(${((1 - idIn) * 8).toFixed(2)}px)` }}>
        <Img src={staticFile("brand/series-identity.png")} style={{ width: 820 }} />
      </div>
      <div style={{ position: "absolute", top: 990, left: 90, right: 90, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <FadeText text={COPY.outro.requirement} start={OUTRO + 30} size={40} weight={500} color={COLOR.ink} />
        <FadeText text={COPY.outro.author} start={OUTRO + 46} size={34} weight={600} color={COLOR.pineDeep} style={{ marginTop: 40 }} />
        <FadeText dir="ltr" text={COPY.outro.repo} start={OUTRO + 62} size={30} weight={500} font={FONT.mono} color={COLOR.pineDeep} style={{ marginTop: 36 }} />
        <FadeText dir="ltr" text={COPY.outro.site} start={OUTRO + 72} size={26} font={FONT.mono} color="#5E5B66" />
      </div>
    </AbsoluteFill>
  );
};

const TEXTURES: [string, boolean?, boolean?][] = [
  ...BOOKS.flatMap((b): [string, boolean?, boolean?][] => [[`covers/${b.id}.jpg`], [`3d/back-${b.id}.jpg`], [`3d/spine-${b.id}.jpg`]]),
  ["3d/page-edge.jpg"],
  ["3d/page-edge.jpg", true],
  ["3d/page-edge.jpg", false, true],
  ["3d/page-1-linux-13.jpg"],
  ["3d/page-1-linux-14.jpg", false, true],
  ["3d/page-1-linux-15.jpg"],
];

export const Shelf: React.FC = () => {
  const frame = useCurrentFrame();
  const [handle] = useState(() => delayRender("textures"));
  const [ready, setReady] = useState(false);
  useEffect(() => {
    preloadTextures(TEXTURES)
      .then(() => {
        setReady(true);
        continueRender(handle);
      })
      .catch((e) => cancelRender(e));
  }, [handle]);
  const fade = interpolate(frame, [FADE[0], FADE[1]], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      {ready && frame < OUTRO + 4 ? (
        <ThreeCanvas
          width={1080}
          height={1920}
          shadows="soft"
          gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05, preserveDrawingBuffer: true }}
        >
          <World frame={frame} />
        </ThreeCanvas>
      ) : null}
      {/* تظليل الحواف */}
      <AbsoluteFill style={{ background: "radial-gradient(120% 80% at 50% 45%, transparent 55%, rgba(0,0,0,0.6) 100%)", pointerEvents: "none" }} />
      <Terminal frame={frame} />
      <Labels frame={frame} />
      <Outro frame={frame} />
      <AbsoluteFill style={{ background: "#000", opacity: fade }} />
      <Sequence durationInFrames={TOTAL}>
        <Audio src={staticFile("audio/shelf-score.wav")} />
      </Sequence>
    </AbsoluteFill>
  );
};

export { BOOK_H };
