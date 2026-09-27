#import "/lib/theme.typ": COLOR, FONT
#import "/lib/publication.typ": project-version, rights-block

#page(header: none, footer: none, numbering: none, {
  set text(font: FONT.bodyAr, size: 8.05pt, fill: COLOR.ink)
  set par(leading: 0.72em, spacing: 0.56em)
  v(0.25fr)

  text(weight: 700, size: 11pt)[10+ مشاريع كبرى من الطرفية]
  linebreak()
  text(fill: COLOR.muted)[مشروعات عملية تجمع ما تعلمته في سلسلة سطر الأوامر]

  v(0.75em)
  text(weight: 700, fill: COLOR.primaryDeep)[بيانات الطبعة]
  linebreak()
  [سلسلة سطر الأوامر · الكتاب العاشر · الطبعة العربية الأولى ·
  الإصدار #project-version.]

  v(0.7em)
  [© #text(font: FONT.mono)[2026] المهندس غازي السيف (أبو هيثم).
  بعض الحقوق محفوظة؛ وتتاح المواد المحددة وفق الرخصة والخريطة أدناه.]

  v(0.65em)
  rights-block(technical: true)

  v(0.65em)
  text(weight: 700, fill: COLOR.primaryDeep)[الفن الأساسي للغلاف]
  linebreak()
  [وُلّد عبر ChatGPT Images من وصف نصي أصلي ولوحة أساس فارغة مولدة
  داخل المشروع، دون مدخلات بصرية خارجية أو طلب تقليد فنان أو عمل
  أو علامة. ثم أضيفت العناوين والهوية والتنسيق بأداة Typst. فن
  الغلاف مستثنى من CC BY-SA 4.0 وفق خريطة التراخيص، ولا يضمن هذا
  السجل حصرية الصورة أو تسجيل حق أو علامة تجارية.]

  v(0.65em)
  text(weight: 700, fill: COLOR.primaryDeep)[المصدر والتواصل]
  linebreak()
  text(font: FONT.mono, size: 7.7pt)[github.com/ghazi-alsaif/command-line-series]

  v(0.5fr)
})
