// يصدّر خطة «الهبوط» إلى JSON ليقرأها مولّد الموسيقى.
import { writeFileSync, mkdirSync } from "node:fs";
import { exportPlan } from "../src/descent/plan.ts";
mkdirSync("out", { recursive: true });
writeFileSync("out/descent-plan.json", JSON.stringify(exportPlan()));
console.log("✓ out/descent-plan.json");
