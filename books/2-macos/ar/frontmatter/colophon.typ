// صفحة الحقوق — «ماك من الطرفية»
#import "/lib/theme.typ": COLOR, FONT
#import "/lib/publication.typ": rights-block

#page(header: none, footer: none, numbering: none, {
  set text(font: FONT.bodyAr, size: 8.5pt, fill: COLOR.ink)
  set par(leading: 0.76em, spacing: 0.65em)
  v(0.45fr)

  text(weight: 700, size: 11pt)[ماك من الطرفية]
  linebreak()
  text(fill: COLOR.muted)[الدليل الشامل إلى سطر الأوامر على macOS — من سلسلة سطر الأوامر (الكتاب الثاني)]

  v(1.4em)
  [© #text(font: FONT.mono)[2026] المهندس غازي السيف (أبو هيثم). جميع الحقوق محفوظة ضمن حدود الرخصة أدناه.]

  v(0.8em)
  rights-block(technical: true)

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
    صُفَّ بأداة #text(font: FONT.mono)[Typst]، بخطّ IBM Plex Sans Arabic للمتن،
    وNoto Kufi Arabic للعناوين، وJetBrains Mono للأكواد. المصادر المعتمدة في ملحق «المصادر والمراجع».
  ]
  v(0.8fr)
})
