// صفحة الحقوق والنشر (Colophon)
#import "/lib/theme.typ": COLOR, FONT
#import "/lib/publication.typ": rights-block

#page(header: none, footer: none, numbering: none, {
  set text(font: FONT.bodyAr, size: 8.3pt, fill: COLOR.ink)
  set par(leading: 0.74em, spacing: 0.6em)
  v(0.35fr)

  text(weight: 700, size: 11pt)[رُوحٌ في الآلة]
  linebreak()
  text(fill: COLOR.muted)[حكايةُ يونيكس — الفكرةُ التي امتدّ أثرُها في الحوسبة الحديثة]

  v(1.4em)
  [© #text(font: FONT.mono)[2026] المهندس غازي السيف (أبو هيثم). جميع الحقوق محفوظة ضمن حدود الرخصة أدناه.]

  v(0.8em)
  rights-block()

  v(1.2em)
  text(weight: 700, fill: COLOR.primaryDeep)[في التوثيق والمصادر]
  linebreak()
  [استندت الوقائعُ الرئيسيّة والادعاءاتُ التاريخيّة الحسّاسة في هذا
  الكتاب إلى المصادر المدرجة في ملحق «المصادر والمراجع». تستند
  التواريخُ والأرقامُ الرئيسيّة إلى تلك المصادر، بينما استُخدمت بعض
  الصور والمشاهد السرديّة لتقريب الحكاية، لا بوصفها نقلًا حرفيًّا
  لشهادةٍ تاريخيّة. يوضّح الملحق الفرقَ بين الواقعة الموثقة،
  والاستنتاج التحريري، والتصوير الأدبي، والحوار المتخيّل، والتشبيه.]

  v(1.2em)
  text(weight: 700, fill: COLOR.primaryDeep)[التواصل والمصدر]
  linebreak()
  grid(columns: (auto, 1fr), row-gutter: 0.4em, column-gutter: 10pt,
    text(fill: COLOR.muted)[صاحب المشروع], [المهندس غازي السيف — أبو هيثم],
    text(fill: COLOR.muted)[التواصل], text(font: FONT.mono, size: 8.5pt)[github.com/ghazi-alsaif/command-line-series/issues],
    text(fill: COLOR.muted)[المستودع], text(font: FONT.mono, size: 8.5pt)[github.com/ghazi-alsaif/command-line-series],
  )

  v(1.2em)
  text(size: 8.5pt, fill: COLOR.muted)[
    صُفَّ هذا الكتاب بأداة تايبست #text(font: FONT.mono)[Typst]، بخطّ
    #text(font: FONT.mono)[IBM Plex Sans Arabic] للمتن،
    و#text(font: FONT.mono)[Noto Kufi Arabic] للعناوين،
    و#text(font: FONT.mono)[JetBrains Mono] للأسماء اللاتينية.
  ]
  v(0.8fr)
})
