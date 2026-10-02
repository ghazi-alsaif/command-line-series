import React, { useMemo } from "react";
import { staticFile } from "remotion";
import * as THREE from "three";
import { BOOK_H, COVER_W, SPINE_W, type Pose } from "./choreo";

// ── النسيج: يُحمَّل كله مسبقًا قبل رسم المشهد (Remotion ينتظر) ───────────
const cache = new Map<string, THREE.Texture>();
const keyOf = (src: string, rotate: boolean, flipX: boolean) => `${src}|${rotate}|${flipX}`;

export const preloadTextures = (list: [string, boolean?, boolean?][]) =>
  Promise.all(
    list.map(
      ([src, rotate = false, flipX = false]) =>
        new Promise<void>((resolve, reject) => {
          const key = keyOf(src, rotate, flipX);
          if (cache.has(key)) return resolve();
          new THREE.TextureLoader().load(
            staticFile(src),
            (t) => {
              t.colorSpace = THREE.SRGBColorSpace;
              t.anisotropy = 8;
              if (rotate) {
                t.center.set(0.5, 0.5);
                t.rotation = Math.PI / 2;
              }
              if (flipX) {
                t.wrapS = THREE.RepeatWrapping;
                t.repeat.x = -1;
                t.offset.x = 1;
              }
              cache.set(key, t);
              resolve();
            },
            undefined,
            reject,
          );
        }),
    ),
  );

export const useTex = (src: string, rotate = false, flipX = false): THREE.Texture => {
  const t = cache.get(keyOf(src, rotate, flipX));
  if (!t) throw new Error(`texture not preloaded: ${src}`);
  return t;
};

const PAPER = "#F4EEDF";
const BOARD_EDGE = "#3B2C1C";

const mat = (opts: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial({ roughness: 0.62, metalness: 0, ...opts });

// ── ورقة تنقلب بانحناء ────────────────────────────────────────────────
const LEAF_W = COVER_W - 0.5;
const LEAF_H = BOOK_H - 0.5;
const Leaf: React.FC<{ turn: number; front: THREE.Texture; back: THREE.Texture }> = ({ turn, front, back }) => {
  const geo = useMemo(() => new THREE.PlaneGeometry(LEAF_W, LEAF_H, 28, 1), []);
  const base = useMemo(() => Float32Array.from(geo.attributes.position.array as Float32Array), [geo]);
  // الانحناء: الطرف الحر يرتفع ويتأخر عن المفصل
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const lift = Math.sin(turn * Math.PI);
  for (let k = 0; k < pos.count; k++) {
    const x0 = base[k * 3]; // من -W/2 إلى W/2 ؛ المفصل عند +W/2
    const u = (LEAF_W / 2 - x0) / LEAF_W; // 0 عند المفصل، 1 عند الطرف
    const bend = lift * 0.9 * u * u;
    pos.setX(k, LEAF_W / 2 - (LEAF_W * u) * Math.cos(bend));
    pos.setZ(k, -(LEAF_W * u) * Math.sin(bend) * 0.45);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return (
    <group position={[COVER_W / 2 - LEAF_W / 2 - 0.05, 0, 0]}>
      <group position={[LEAF_W / 2, 0, 0]} rotation={[0, turn * Math.PI * 0.99, 0]}>
        <group position={[-LEAF_W / 2, 0, 0]}>
          <mesh geometry={geo} castShadow receiveShadow>
            <meshStandardMaterial map={front} roughness={0.85} side={THREE.FrontSide} />
          </mesh>
          <mesh geometry={geo} rotation={[0, 0, 0]} castShadow>
            <meshStandardMaterial map={back} roughness={0.85} side={THREE.BackSide} />
          </mesh>
        </group>
      </group>
    </group>
  );
};

// ── الكتاب: لوح خلفي + كتلة صفحات + كعب + غلاف أمامي على مفصل ─────────────
// الإطار المحلي: الكتاب واقف، الغلاف يواجه +Z، الكعب على +X (كتاب عربي).
export const BookMesh: React.FC<{
  id: string;
  thickness: number;
  pose: Pose;
  pages?: { leafFront: string; leafBack: string; block: string };
}> = ({ id, thickness: t, pose, pages }) => {
  const cover = useTex(`covers/${id}.jpg`);
  const back = useTex(`3d/back-${id}.jpg`);
  const spine = useTex(`3d/spine-${id}.jpg`);
  const edgeV = useTex("3d/page-edge.jpg");
  const edgeH = useTex("3d/page-edge.jpg", true);
  const blockTop = useTex(pages ? pages.block : "3d/page-edge.jpg");
  const leafF = useTex(pages ? pages.leafFront : "3d/page-edge.jpg");
  const leafB = useTex(pages ? pages.leafBack : "3d/page-edge.jpg", false, true);

  const board = 0.18;
  const blockT = t - board * 2;
  const mats = useMemo(() => {
    const edge = mat({ color: BOARD_EDGE, roughness: 0.8 });
    const paper = mat({ color: PAPER, roughness: 0.9 });
    return {
      back: [edge, edge, edge, edge, mat({ color: PAPER }), mat({ map: back, roughness: 0.55 })],
      front: [edge, edge, edge, edge, mat({ map: cover, roughness: 0.5 }), paper],
      block: [
        paper,
        mat({ map: edgeV, roughness: 0.95 }),
        mat({ map: edgeH, roughness: 0.95 }),
        mat({ map: edgeH, roughness: 0.95 }),
        pages ? mat({ map: blockTop, roughness: 0.85 }) : paper,
        paper,
      ],
      spine: [mat({ map: spine, roughness: 0.55 }), edge, edge, edge, edge, edge],
    };
  }, [cover, back, spine, edgeV, edgeH, blockTop, pages]);

  if (!pose.visible) return null;
  const hingeX = BOOK_W_HALF - SPINE_W;

  return (
    <group position={pose.pos} quaternion={pose.quat}>
      {/* اللوح الخلفي */}
      <mesh material={mats.back} position={[hingeX - COVER_W / 2, 0, -t / 2 + board / 2]} castShadow receiveShadow>
        <boxGeometry args={[COVER_W, BOOK_H, board]} />
      </mesh>
      {/* كتلة الصفحات */}
      <mesh material={mats.block} position={[hingeX - (COVER_W - 0.35) / 2 - 0.05, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[COVER_W - 0.35, BOOK_H - 0.4, blockT]} />
      </mesh>
      {/* الكعب */}
      <mesh material={mats.spine} position={[BOOK_W_HALF - SPINE_W / 2, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[SPINE_W, BOOK_H, t]} />
      </mesh>
      {/* ورقة تنقلب (الكتاب الأول فقط) */}
      {pages ? (
        <group position={[hingeX - COVER_W / 2, 0, blockT / 2 + 0.03 + pose.turn * (board + 0.08)]}>
          <Leaf turn={pose.turn} front={leafF} back={leafB} />
        </group>
      ) : null}
      {/* الغلاف الأمامي على مفصل عند الكعب */}
      <group position={[hingeX, 0, t / 2 - board / 2]} rotation={[0, pose.open * Math.PI * 0.995, 0]}>
        <mesh material={mats.front} position={[-COVER_W / 2, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[COVER_W, BOOK_H, board]} />
        </mesh>
      </group>
    </group>
  );
};

const BOOK_W_HALF = (COVER_W + SPINE_W) / 2;
