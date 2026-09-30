// كل النصوص المعروضة التي ليست أسماء كتب — عدّلها من هنا.
// المصدر مذكور بجانب كل عبارة؛ لا نصوص مخترعة عن محتوى الكتب.
import { SERIES } from "./books";

export const COPY = {
  hook: {
    // أمر البناء الحقيقي في جذر المستودع
    command: "./build.sh",
    // README: «من الصفر إلى فهم الآلة»
    tagline: SERIES.tagline,
    series: "سلسلة سطر الأوامر",
  },
  fourWindows: {
    // README: «تبدأ السلسلة بأربع نوافذ (لِينُكس · ماك · ويندوز · BSD)»
    line1: "أربعُ نوافذ.",
    // README: «One craft, every system»
    line2: "حِرفةٌ واحدة.",
    en: "One craft, every system",
  },
  practice: {
    // README: «ثم تجمعها بالممارسة والحكاية»
    kicker: "ثم تجمعها بالممارسة والحكاية",
  },
  story: {
    // توطئة كتاب «رُوحٌ في الآلة» (frontmatter/preface.typ)
    quote: "في جيبك الآن جهازٌ يحمل رُوحًا\nعمرها أكثر من نصف قرن.",
    // الكتاب السادس: «بدأت حكايتُه سنة 1969»
    year: "1969",
  },
  realWorld: {
    // README: «وتمتد إلى الأتمتة والخوادم والشبكات والمشروعات»
    kicker: "وتمتدّ إلى العالم الحقيقي",
    steps: ["الأتمتة", "الخوادم", "الشبكات", "المشروعات"],
  },
  hero: {
    count: `${SERIES.bookCount} كتب`,
    pagesLabel: "صفحة",
    tagline: SERIES.tagline,
  },
  outro: {
    requirement: SERIES.requirement ?? "المتطلّب الوحيد: أن تعرف القراءة والكتابة.",
    repo: SERIES.repoUrl,
    site: (SERIES.siteUrl ?? "").replace(/^https?:\/\//, "").replace(/\/$/, ""),
    author: SERIES.author,
  },
} as const;
