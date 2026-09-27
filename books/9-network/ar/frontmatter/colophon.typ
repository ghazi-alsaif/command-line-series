#import "/lib/theme.typ": COLOR, FONT
#import "/lib/publication.typ": project-version, rights-block

#page(header: none, footer: none, numbering: none, {
  set text(font: FONT.bodyAr, size: 8.05pt, fill: COLOR.ink)
  set par(leading: 0.72em, spacing: 0.56em)
  v(0.25fr)

  text(weight: 700, size: 11pt)[الشبكةُ من الطرفية]
  linebreak()
  text(fill: COLOR.muted)[دليلك لفهم الطريق بين جهازك والعالم وتشخيصه]

  v(0.75em)
  text(weight: 700, fill: COLOR.primaryDeep)[النسخة الرسمية]
  linebreak()
  [هذه النسخة جزء من الإصدار #project-version الرسمي. لا تمنحك
  تفويضًا لفحص شبكة لا تملكها أو لا تملك إذنًا صريحًا بإدارتها.]

  v(0.7em)
  [© #text(font: FONT.mono)[2026] المهندس غازي السيف (أبو هيثم).
  جميع الحقوق محفوظة ضمن حدود الرخصة أدناه.]

  v(0.65em)
  rights-block(technical: true)

  v(0.65em)
  text(weight: 700, fill: COLOR.primaryDeep)[الفن الأساسي للغلاف]
  linebreak()
  [وُلّد عبر ChatGPT Images من وصف نصي أصلي ولوحة أساس فارغة مولدة
  داخل المشروع لضبط هوية السلسلة، دون مدخلات بصرية خارجية. ثم
  أضيفت العناوين والهوية والتنسيق بأداة Typst. فن الغلاف مستثنى
  من CC BY-SA 4.0 وفق خريطة التراخيص.]

  v(0.65em)
  text(weight: 700, fill: COLOR.primaryDeep)[المصدر والتواصل]
  linebreak()
  text(font: FONT.mono, size: 7.7pt)[github.com/ghazi-alsaif/command-line-series]

  v(0.5fr)
})
