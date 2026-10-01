import React from "react";
import { Composition } from "remotion";
import { Descent } from "./descent/Descent";
import { TOTAL as DESCENT_TOTAL } from "./descent/plan";
import { Promo } from "./Promo";
import { TOTAL_FRAMES } from "./timeline";
import { VIDEO } from "./theme";

export const Root: React.FC = () => (
  <>
    <Composition id="Promo" component={Promo} width={VIDEO.width} height={VIDEO.height} fps={VIDEO.fps} durationInFrames={TOTAL_FRAMES} />
    <Composition id="Descent" component={Descent} width={VIDEO.width} height={VIDEO.height} fps={VIDEO.fps} durationInFrames={DESCENT_TOTAL} />
  </>
);
