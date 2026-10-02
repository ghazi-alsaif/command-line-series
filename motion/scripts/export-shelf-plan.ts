// يصدّر خطة «رف السلسلة» إلى JSON ليقرأها مولّد الموسيقى.
import { mkdirSync, writeFileSync } from "node:fs";
import { exportPlan } from "../src/shelf/plan.ts";
mkdirSync("out", { recursive: true });
writeFileSync("out/shelf-plan.json", JSON.stringify(exportPlan()));
console.log("✓ out/shelf-plan.json");
