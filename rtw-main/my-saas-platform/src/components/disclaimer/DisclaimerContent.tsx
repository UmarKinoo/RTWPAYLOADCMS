import { getLocale } from 'next-intl/server'

export async function DisclaimerContent() {
  const locale = await getLocale()

  const isArabic = locale === 'ar'

  const content = {
    en: {
      title: 'Disclaimer',
      items: [
        'The platform is not an employment agency or job broker and does not intervene in any contractual or negotiation relationship between the job seeker and the employer.',
        'The platform\'s services are limited to displaying and organizing information and providing access within a subscription system.',
        'The platform does not guarantee the accuracy of information entered by users, and the responsibility for verification lies with the parties themselves.',
        'The platform does not charge any commission or percentage from recruitment or outsourcing transactions.',
        'The platform is not responsible for hiring outcomes.',
        'The employer is solely responsible for contracting with the job seeker.',
      ],
    },
    ar: {
      title: 'إخلاء المسؤولية',
      text: 'تُعد منصة ReadyToWork.sa منصة إعلانية رقمية مبتكرة تهدف إلى تمكين المنشآت الصغيرة والمتوسطة من الوصول إلى كفاءات مهنية عالية الجودة وجاهزة للتواصل داخل سوق العمل السعودي. ومن خلال نظام تصفية ذكي ومتطور، نُسهّل على فرق الأعمال استكشاف الأفراد المؤهلين القادرين على مناقشة الفرص المهنية بمرونة واحترافية.',
      text2: 'توفر المنصة بيئة فعّالة ومنخفضة التكلفة لعرض البيانات المهنية والتواصل مع الخبرات من مختلف التخصصات، مع إتاحة مساحة تواصل آمنة تمكّن أصحاب الأعمال من التواصل السريع وتقييم مدى الملاءمة قبل المضي قدمًا.',
      text3: 'في ReadyToWork.sa، نعيد تعريف تجربة الوصول إلى الكفاءات من خلال الجمع بين التقنية الحديثة والتواصل الإنساني، بما يدعم نمو الأعمال بثقة ويمنح الأفراد فرصًا واضحة للتقدّم المهني.',
    },
  }

  const data = isArabic ? content.ar : content.en

  return (
    <div className="pt-24 sm:pt-28 md:pt-32 pb-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#16252d] mb-4">
            {data.title}
          </h1>
          <div className="w-24 h-1 bg-[#4644b8] mx-auto rounded-full" />
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none prose-headings:text-[#4644b8] prose-p:text-[#16252d] prose-li:text-[#16252d]">
          {isArabic ? (
            <section className="mb-10">
              <p className="text-[#16252d] leading-relaxed mb-4">{data.text}</p>
              <p className="text-[#16252d] leading-relaxed mb-4">{data.text2}</p>
              <p className="text-[#16252d] leading-relaxed">{data.text3}</p>
            </section>
          ) : (
            <section className="mb-10">
              <ul className="space-y-4 list-disc list-inside text-[#16252d]">
                {data.items.map((item, index) => (
                  <li key={index} className="leading-relaxed">{item}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
