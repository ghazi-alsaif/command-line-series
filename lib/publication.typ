// عناصر النشر المشتركة — الإصدار والرخصة والإفصاح
#import "theme.typ": COLOR, FONT

#let project-version = str.trim(read("/VERSION"))

#let title-footer(book-name) = [
  سلسلة سطر الأوامر · #book-name · الطبعة العربية الأولى · الإصدار #project-version
]

#let rights-block(technical: false) = {
  text(weight: 700, fill: COLOR.primaryDeep)[الرخصة]
  linebreak()
  [المحتوى العام المحدد في خريطة التراخيص منشور بموجب *المشاع
  الإبداعي — نَسْبُ الـمُصنَّف، الترخيص بالمثل 4.0 دولي*
  (CC BY-SA 4.0). تسمح الرخصة بالنسخ والتوزيع والطباعة والبيع
  والترجمة والتعديل، مع النسب وبيان التغيير والمشاركة بالمثل.]

  v(0.45em)
  [النص القانوني في
  #text(font: FONT.mono, size: 8pt)[LICENSES/CC-BY-SA-4.0.txt]،
  والخريطة الدقيقة والاستثناءات في
  #text(font: FONT.mono, size: 8pt)[LICENSES/README.md]. لا تشمل
  الرخصة الأصول المستثناة أو مواد الأطراف الثالثة.]

  v(0.3em)
  text(font: FONT.mono, size: 6.8pt)[https://creativecommons.org/licenses/by-sa/4.0/]
  linebreak()
  text(font: FONT.mono, size: 6.8pt)[github.com/ghazi-alsaif/command-line-series/blob/main/LICENSES/README.md]

  v(0.7em)
  text(weight: 700, fill: COLOR.primaryDeep)[الإعداد والإفصاح]
  linebreak()
  [صاحب الفكرة والمشروع، والإعداد والإشراف والمراجعة: المهندس غازي
  السيف — أبو هيثم.]

  v(0.35em)
  [هذا المشروع من فكرة غازي السيف وتصميمه وإشرافه. جميع مسودات الكتب
  ونصوصها الأساسية وُلّدت باستخدام أدوات الذكاء الاصطناعي. وتولّى
  غازي وضع فكرة المشروع، وبناء هيكله، وتوجيه عملية الكتابة، وتنظيم
  مادته، ومراجعتها وتدقيقها، واختيار ما يُعتمد منها، واعتماد النسخة
  المنشورة، ويتحمّل مسؤولية القرارات التحريرية والمحتوى النهائي. لا
  تُنسب أدوات الذكاء الاصطناعي بوصفها مؤلفًا أو مؤلفًا مشاركًا.]

  v(0.7em)
  text(weight: 700, fill: COLOR.primaryDeep)[إخلاء مسؤولية]
  linebreak()
  [يُقدَّم هذا المحتوى للتعلّم العام كما هو، بلا ضمان لملاءمته لغرض
  بعينه. لا يُغني عن توثيق النظام الذي تستخدمه أو عن الاستعانة بمختص
  عند القرارات التقنية أو الأمنية أو النظامية عالية الأثر. يتحمّل
  القارئ مسؤولية التحقق والنسخ الاحتياطي والعمل ضمن الأنظمة
  والصلاحيات المأذونة له.]

  if technical {
    v(0.7em)
    text(weight: 700, fill: COLOR.primaryDeep)[تنبيه تقني]
    linebreak()
    [تتضمن هذه الكتب أوامر قد تغيّر الملفات أو إعدادات النظام أو
    الشبكة. نفّذها في بيئة تملكها أو تملك إذنًا بإدارتها، وخذ نسخة
    احتياطية قبل العمليات الحساسة، وتحقق من توثيق إصدار نظامك؛ فقد
    تتغير الخيارات والسلوكيات بين الإصدارات.]
  }
}

#let cover-license-line = [
  CC BY-SA 4.0 للنص المحدد · راجع LICENSES/README.md
]

// لوحة اسم موحّدة للأغلفة الأمامية. الخلفية الرقّية شبه المعتمة تحمي
// الاسم من تفاصيل الفنّ المولّد، مع إبقاء موضعه السفلي وهوية السلسلة.
#let cover-author-credit() = block(
  width: 84mm,
  fill: rgb("#F7E9C8").transparentize(50%),
  stroke: 0.5pt + rgb("#9A7848").transparentize(24%),
  radius: 3mm,
  inset: (x: 5mm, y: 2.2mm),
  {
    set align(center)
    text(font: FONT.bodyAr, size: 12pt, weight: 700, fill: rgb("#26242E"))[
      المهندس غازي السيف
    ]
    v(1.2mm)
    text(font: FONT.bodyAr, size: 9.5pt, weight: 600, fill: rgb("#4A4857"))[
      أبو هيثم
    ]
  },
)
