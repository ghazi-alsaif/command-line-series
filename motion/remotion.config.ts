import { Config } from "@remotion/cli/config";

// صيغة الإطارات الوسيطة: JPEG بجودة عالية يسرّع الرندر دون أثر مرئي.
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(95);
Config.setOverwriteOutput(true);
// يتيح تحديد متصفح Chrome محلي عند الحاجة (بيئات بلا إنترنت):
//   REMOTION_BROWSER=/path/to/chrome-headless-shell npm run render
if (process.env.REMOTION_BROWSER) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER);
}
// GL أفضل لتأثيرات blur/3D في Chrome بلا واجهة.
Config.setChromiumOpenGlRenderer("angle");
