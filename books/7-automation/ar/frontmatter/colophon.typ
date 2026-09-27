#import "/lib/theme.typ": COLOR, FONT
#import "/lib/publication.typ": project-version, rights-block

#page(header: none, footer: none, numbering: none, {
  set text(font: FONT.bodyAr, size: 8.2pt, fill: COLOR.ink)
  set par(leading: 0.73em, spacing: 0.58em)
  v(0.3fr)

  text(weight: 700, size: 11pt)[مِن الأمر إلى الأتمتة]
  linebreak()
  text(fill: COLOR.muted)[كيف تحوّل أوامر الطرفية إلى أدوات تعمل من أجلك]

  v(0.8em)
  text(weight: 700, fill: COLOR.primaryDeep)[النسخة الرسمية]
  linebreak()
  [هذه النسخة جزء من الإصدار #project-version الرسمي لسلسلة سطر الأوامر.]

  v(0.8em)
  [© #text(font: FONT.mono)[2026] المهندس غازي السيف (أبو هيثم).
  جميع الحقوق محفوظة ضمن حدود الرخصة أدناه.]

  v(0.7em)
  rights-block(technical: true)

  v(0.7em)
  text(weight: 700, fill: COLOR.primaryDeep)[الفن الأساسي للغلاف]
  linebreak()
  [وُلّد عبر ChatGPT Images من وصف نصي أصلي ولوحة أساس فارغة مولدة
  داخل المشروع، دون مدخلات بصرية خارجية. ثم أضيفت العناوين والهوية
  والتنسيق بأداة Typst. فن الغلاف مستثنى من CC BY-SA 4.0 وفق خريطة
  التراخيص.]

  v(0.9em)
  text(weight: 700, fill: COLOR.primaryDeep)[المصدر والتواصل]
  linebreak()
  grid(columns: (auto, 1fr), row-gutter: 0.35em, column-gutter: 10pt,
    text(fill: COLOR.muted)[صاحب المشروع], [المهندس غازي السيف — أبو هيثم],
    text(fill: COLOR.muted)[التواصل], text(font: FONT.mono, size: 8pt)[github.com/ghazi-alsaif/command-line-series/issues],
    text(fill: COLOR.muted)[المستودع], text(font: FONT.mono, size: 8pt)[github.com/ghazi-alsaif/command-line-series],
  )

  v(0.8fr)
})
