import { Easing } from "remotion";

// ── الإطار ──────────────────────────────────────────────────────────
export const VIDEO = { width: 1080, height: 1920, fps: 30 } as const;

// المنطقة الآمنة لواجهات Reels / TikTok / Shorts:
// أعلى: شريط الحساب والعنوان · أسفل: الوصف والأزرار · يمين: أزرار التفاعل.
export const SAFE = { top: 230, bottom: 400, left: 80, right: 120 } as const;
export const SAFE_BOTTOM_Y = VIDEO.height - SAFE.bottom; // 1520

// ── الألوان: من lib/theme.typ وهوية السلسلة ─────────────────────────
export const COLOR = {
  night: "#070A09", // الخلفية الأعمق
  deep: "#0C1512", // أخضر شبه أسود
  pine: "#1F6F5C", // الأخضر الصنوبري (primary)
  pineDeep: "#164A3E", // primaryDeep
  brandGreen: "#0F4D3C", // أخضر الهوية
  paper: "#FCFBF9", // ورق الكتب الدافئ
  cream: "#FFF8DC", // كريم الهوية
  sand: "#EFE6D2", // ورق دافئ للمشهد الأخير
  ink: "#26242E",
  muted: "#8E8A80",
  accent: "#C0592B", // الطوبي
  brandOrange: "#C85C2C",
  text: "#F3EEE2", // نص فاتح دافئ على الداكن
  textDim: "rgba(243,238,226,0.62)",
  hairline: "rgba(243,238,226,0.10)",
} as const;

// ── الخطوط (تُحمّل محليًا من public/fonts) ───────────────────────────
export const FONT = {
  display: "'Noto Kufi Arabic', 'IBM Plex Sans Arabic', sans-serif",
  body: "'IBM Plex Sans Arabic', sans-serif",
  mono: "'JetBrains Mono', monospace",
} as const;

// ── لغة الحركة الواحدة ───────────────────────────────────────────────
// منحنى دخول واحد، ومنحنى خروج واحد، ومنحنى حركة كاميرا واحد.
export const EASE = {
  in: Easing.bezier(0.16, 1, 0.3, 1), // دخول سينمائي هادئ
  out: Easing.bezier(0.7, 0, 0.84, 0), // خروج متسارع
  cam: Easing.bezier(0.45, 0, 0.55, 1), // حركة كاميرا ناعمة
} as const;

// نابض بلا ارتداد تقريبًا
export const SPRING = { damping: 200, stiffness: 90, mass: 1 } as const;

// ── أدوات لونية ─────────────────────────────────────────────────────
const hexToHsl = (hex: string): [number, number, number] => {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h * 60, s, l];
};

/** يرفع إضاءة لون عنوان الغلاف ليصلح لمسةً على خلفية داكنة، مع الإبقاء على درجته. */
export const glowFrom = (hex: string, lightness = 0.6, alpha = 1): string => {
  const [h, s] = hexToHsl(hex);
  return `hsla(${h.toFixed(1)}, ${Math.min(0.62, s * 0.9 + 0.08) * 100}%, ${lightness * 100}%, ${alpha})`;
};
