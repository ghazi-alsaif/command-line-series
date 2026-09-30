import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// كل الخطوط من مجلد fonts/ في المستودع (تُنسخ إلى public/fonts قبل التشغيل)
const faces: { family: string; file: string; weight: string }[] = [
  { family: "IBM Plex Sans Arabic", file: "IBMPlexSansArabic-Light.ttf", weight: "300" },
  { family: "IBM Plex Sans Arabic", file: "IBMPlexSansArabic-Regular.ttf", weight: "400" },
  { family: "IBM Plex Sans Arabic", file: "IBMPlexSansArabic-Medium.ttf", weight: "500" },
  { family: "IBM Plex Sans Arabic", file: "IBMPlexSansArabic-SemiBold.ttf", weight: "600" },
  { family: "IBM Plex Sans Arabic", file: "IBMPlexSansArabic-Bold.ttf", weight: "700" },
  { family: "Noto Kufi Arabic", file: "NotoKufiArabic-Regular.ttf", weight: "400" },
  { family: "Noto Kufi Arabic", file: "NotoKufiArabic-SemiBold.ttf", weight: "600" },
  { family: "Noto Kufi Arabic", file: "NotoKufiArabic-Bold.ttf", weight: "700" },
  { family: "Noto Kufi Arabic", file: "NotoKufiArabic-ExtraBold.ttf", weight: "800" },
  { family: "JetBrains Mono", file: "JetBrainsMono-Regular.ttf", weight: "400" },
  { family: "JetBrains Mono", file: "JetBrainsMono-Medium.ttf", weight: "500" },
  { family: "JetBrains Mono", file: "JetBrainsMono-Bold.ttf", weight: "700" },
];

let loaded = false;
export const loadLocalFonts = () => {
  if (loaded) return;
  loaded = true;
  for (const f of faces) {
    loadFont({
      family: f.family,
      url: staticFile(`fonts/${f.file}`),
      weight: f.weight,
      format: "truetype",
    });
  }
};
