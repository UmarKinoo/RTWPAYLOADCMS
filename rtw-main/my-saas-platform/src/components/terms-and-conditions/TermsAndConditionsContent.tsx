import { getLocale } from 'next-intl/server'

export async function TermsAndConditionsContent() {
  const locale = await getLocale()

  const isArabic = locale === 'ar'

  const content = {
    en: {
      title: 'Terms and Conditions',
      intro: {
        title: 'Article (1): Definitions',
        text: 'For this agreement, the following definitions shall apply:',
        items: [
          { term: 'Platform', definition: 'The electronic service owned and operated by Ready To Work Establishment, dedicated to displaying professional data and job advertisements.' },
          { term: 'User', definition: 'Any natural or legal person who registers on the platform as either a "Job Seeker" or "Employer."' },
          { term: 'Employer', definition: 'The entity or individual who uses the platform to access the database of job seekers.' },
          { term: 'Job Seeker', definition: 'The individual who registers their professional data or CV on the platform.' },
          { term: 'Service', definition: 'All tools provided by the platform for displaying, subscribing, classifying, or publishing professional data. Providing a professional database for job seekers, with access for employers through paid subscriptions.' },
        ],
      },
      legalRelationship: {
        title: 'Article (2): Nature of the Legal Relationship',
        items: [
          'The platform is not an employment agency or job broker and does not intervene in any contractual or negotiation relationship between the job seeker and the employer.',
          'The platform\'s services are limited to displaying and organizing information and providing access within a subscription system.',
          'The platform does not guarantee the accuracy of information entered by users, and the responsibility for verification lies with the parties themselves.',
          'The platform does not charge any commission or percentage from recruitment or outsourcing transactions.',
        ],
      },
      registration: {
        title: 'Article (3): Registration and Use',
        items: [
          'Registration on the platform signifies complete agreement to all terms of this agreement without any conditions.',
          'The user is obligated to provide accurate and updated information and is solely responsible for any legal consequences resulting from violations.',
          'The platform reserves the right to suspend or delete any account containing misleading or false information.',
          'Use of the platform for any activities contrary to Saudi regulations or public morals is prohibited.',
        ],
      },
      subscriptions: {
        title: 'Article (4): Subscriptions and Paid Services',
        items: [
          'Some of the platform\'s services are available only to users subscribed to paid packages.',
          'Paid fees are non-refundable after service activation, unless the service is down due to technical reasons on the part of the platform.',
          'The platform reserves the right to modify prices or subscription packages with prior notification to users.',
        ],
      },
      legalResponsibility: {
        title: 'Article (5): Legal Responsibility',
        items: [
          'The platform is not responsible for any direct or indirect damage arising from the use of services or reliance on the published data.',
          'The user is solely responsible for the content of their Profile or competency advertisement posted.',
          'The platform bears no financial or legal obligations resulting from agreements or contracts made outside of it.',
        ],
      },
      intellectualProperty: {
        title: 'Article (6): Intellectual Property Rights',
        items: [
          'All content on the platform (texts, designs, codes, logos) is protected under the Saudi Copyright Law.',
          'Reproduction, use, or distribution of any part of the platform\'s content without written permission from the owner is prohibited.',
        ],
      },
      dataProtection: {
        title: 'Article (7): Data Protection and Privacy',
        items: [
          'The platform is committed to protecting users\' privacy in accordance with the Personal Data Protection Law issued in the Kingdom.',
          'Personal data will only be shared with the user\'s consent or for specific legal purposes.',
          'The platform is responsible for securely storing data according to the highest technical security standards.',
        ],
      },
      amendments: {
        title: 'Article (8): Amendments to the Agreement',
        text: 'The platform reserves the right to amend or update the terms of use at any time, and any amendments shall take effect on the date they are published on the website or application.',
      },
      governingLaw: {
        title: 'Article (9): Governing Law',
        text: 'This agreement is governed and interpreted in accordance with the laws of the Kingdom of Saudi Arabia, and the courts of Jeddah shall have jurisdiction based on the platform owner\'s location.',
      },
      antiCircumvention: {
        title: 'Article (10): Anti-Circumvention',
        text: 'Employers shall not bypass the Platform to exploit published data commercially without an active subscription.',
      },
      obligations: {
        title: 'Article (11): Employer and Job Seeker\'s Obligation',
        items: [
          'Verify the applicability of the legal documents with the government entity.',
          'Conduct an official communication channel with the official sponsors and liaise formally before any engagement.',
          'Employer is liable to ensure compliance with the Labour Law and regulations set by the Human Resources and Social Development before any commencement.',
        ],
      },
    },
    ar: {
      title: 'الشروط والأحكام',
      intro: {
        title: 'المقدمة',
        text: 'تُعد منصة ReadyToWork.sa منصة إعلانية رقمية مبتكرة تهدف إلى تمكين المنشآت الصغيرة والمتوسطة من الوصول إلى كفاءات مهنية عالية الجودة وجاهزة للتواصل داخل سوق العمل السعودي. ومن خلال نظام تصفية ذكي ومتطور، نُسهّل على فرق الأعمال استكشاف الأفراد المؤهلين القادرين على مناقشة الفرص المهنية بمرونة واحترافية.',
        text2: 'توفر المنصة بيئة فعّالة ومنخفضة التكلفة لعرض البيانات المهنية والتواصل مع الخبرات من مختلف التخصصات، مع إتاحة مساحة تواصل آمنة تمكّن أصحاب الأعمال من التواصل السريع وتقييم مدى الملاءمة قبل المضي قدمًا.',
        text3: 'في ReadyToWork.sa، نعيد تعريف تجربة الوصول إلى الكفاءات من خلال الجمع بين التقنية الحديثة والتواصل الإنساني، بما يدعم نمو الأعمال بثقة ويمنح الأفراد فرصًا واضحة للتقدّم المهني.',
      },
      legalRelationship: {
        title: 'المادة (2): طبيعة العلاقة القانونية',
        items: [
          'المنصة ليست وكالة توظيف أو وسيطًا وظيفيًا، ولا تتدخل في أي علاقة تعاقدية أو تفاوضية بين الباحث عن عمل وصاحب العمل.',
          'تقتصر خدمات المنصة على عرض وتنظيم المعلومات وتوفير الوصول إليها ضمن نظام الاشتراك.',
          'لا تضمن المنصة دقة المعلومات المدخلة من قبل المستخدمين، وتقع مسؤولية التحقق على عاتق الأطراف نفسها.',
          'لا تقوم المنصة بفرض أي عمولة أو نسبة من عمليات التوظيف أو الاستعانة بمصادر خارجية.',
        ],
      },
      registration: {
        title: 'المادة (3): التسجيل والاستخدام',
        items: [
          'يُعد التسجيل في المنصة موافقة كاملة على جميع شروط هذه الاتفاقية دون أي شروط.',
          'يلتزم المستخدم بتقديم معلومات دقيقة ومحدثة، ويكون مسؤولاً وحده عن أي تبعات قانونية ناتجة عن المخالفات.',
          'تحتفظ المنصة بالحق في تعليق أو حذف أي حساب يحتوي على معلومات مضللة أو غير صحيحة.',
          'يحظر استخدام المنصة لأي أنشطة تتعارض مع الأنظمة السعودية أو الآداب العامة.',
        ],
      },
      subscriptions: {
        title: 'المادة (4): الاشتراكات والخدمات المدفوعة',
        items: [
          'بعض خدمات المنصة متاحة فقط للمستخدمين المشتركين في الباقات المدفوعة.',
          'الرسوم المدفوعة غير قابلة للاسترداد بعد تفعيل الخدمة، إلا في حال تعطل الخدمة لأسباب تقنية تقع على عاتق المنصة.',
          'تحتفظ المنصة بالحق في تعديل الأسعار أو باقات الاشتراك مع إشعار مسبق للمستخدمين.',
        ],
      },
      legalResponsibility: {
        title: 'المادة (5): المسؤولية القانونية',
        items: [
          'لا تتحمل المنصة أي ضرر مباشر أو غير مباشر ناتج عن استخدام الخدمات أو الاعتماد على البيانات المنشورة.',
          'يكون المستخدم وحده مسؤولاً عن محتوى ملفه الشخصي أو الإعلان عن مهاراته المنشور على المنصة.',
          'لا تتحمل المنصة أي التزامات مالية أو قانونية ناتجة عن الاتفاقيات أو العقود المبرمة خارج المنصة.',
        ],
      },
      intellectualProperty: {
        title: 'المادة (6): حقوق الملكية الفكرية',
        items: [
          'جميع المحتويات على المنصة (النصوص، التصاميم، الأكواد، الشعارات) محمية بموجب نظام حقوق المؤلف السعودي.',
          'يُحظر نسخ أو استخدام أو توزيع أي جزء من محتوى المنصة دون إذن كتابي من المالك.',
        ],
      },
      dataProtection: {
        title: 'المادة (7): حماية البيانات والخصوصية',
        items: [
          'تلتزم المنصة بحماية خصوصية المستخدمين وفقًا لنظام حماية البيانات الشخصية الصادر في المملكة.',
          'لن يتم مشاركة البيانات الشخصية إلا بموافقة المستخدم أو لأغراض قانونية محددة.',
          'تتحمل المنصة مسؤولية تخزين البيانات بشكل آمن وفق أعلى معايير الأمن التقنية.',
        ],
      },
      amendments: {
        title: 'المادة (8): تعديلات على الاتفاقية',
        text: 'تحتفظ المنصة بالحق في تعديل أو تحديث شروط الاستخدام في أي وقت، وتصبح أي تعديلات سارية المفعول اعتبارًا من تاريخ نشرها على الموقع الإلكتروني أو التطبيق.',
      },
      governingLaw: {
        title: 'المادة (9): القانون الواجب التطبيق',
        text: 'تخضع هذه الاتفاقية وتفسر وفقًا لقوانين المملكة العربية السعودية، وتختص محاكم جدة بالنظر فيها استنادًا إلى موقع مالك المنصة.',
      },
      antiCircumvention: {
        title: 'المادة (10): منع التحايل',
        text: 'يحظر على أصحاب العمل تجاوز المنصة لاستغلال البيانات المنشورة تجاريًا دون وجود اشتراك نشط.',
      },
      obligations: {
        title: 'المادة (11): التزامات صاحب العمل والباحث عن عمل',
        items: [
          'التحقق من صحة الوثائق القانونية لدى الجهة الحكومية المختصة.',
          'إجراء قناة اتصال رسمية مع الكفلاء الرسميين والتواصل الرسمي قبل أي التزام أو تعامل.',
          'يكون صاحب العمل مسؤولاً عن ضمان الالتزام بنظام العمل واللوائح الصادرة عن وزارة الموارد البشرية والتنمية الاجتماعية قبل أي بدء في العمل.',
        ],
      },
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
          {/* Introduction / Article 1 */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-[#4644b8] mb-4">{data.intro.title}</h2>
            {isArabic ? (
              <>
                <p className="text-[#16252d] leading-relaxed mb-4">{data.intro.text}</p>
                {'text2' in data.intro && (
                  <p className="text-[#16252d] leading-relaxed mb-4">{data.intro.text2}</p>
                )}
                {'text3' in data.intro && (
                  <p className="text-[#16252d] leading-relaxed">{data.intro.text3}</p>
                )}
              </>
            ) : (
              <>
                <p className="text-[#16252d] leading-relaxed mb-4">{data.intro.text}</p>
                {'items' in data.intro && (
                  <div className="space-y-4 mt-6">
                    {data.intro.items.map((item, index) => (
                      <div key={index} className="border-l-4 border-[#4644b8] pl-4">
                        <p className="font-semibold text-[#16252d] mb-1">{item.term}:</p>
                        <p className="text-[#353535]">{item.definition}</p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>

          {/* Legal Relationship */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-[#4644b8] mb-4">{data.legalRelationship.title}</h2>
            <ul className="space-y-3 list-disc list-inside text-[#16252d]">
              {data.legalRelationship.items.map((item, index) => (
                <li key={index} className="leading-relaxed">{item}</li>
              ))}
            </ul>
          </section>

          {/* Registration */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-[#4644b8] mb-4">{data.registration.title}</h2>
            <ul className="space-y-3 list-disc list-inside text-[#16252d]">
              {data.registration.items.map((item, index) => (
                <li key={index} className="leading-relaxed">{item}</li>
              ))}
            </ul>
          </section>

          {/* Subscriptions */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-[#4644b8] mb-4">{data.subscriptions.title}</h2>
            <ul className="space-y-3 list-disc list-inside text-[#16252d]">
              {data.subscriptions.items.map((item, index) => (
                <li key={index} className="leading-relaxed">{item}</li>
              ))}
            </ul>
          </section>

          {/* Legal Responsibility */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-[#4644b8] mb-4">{data.legalResponsibility.title}</h2>
            <ul className="space-y-3 list-disc list-inside text-[#16252d]">
              {data.legalResponsibility.items.map((item, index) => (
                <li key={index} className="leading-relaxed">{item}</li>
              ))}
            </ul>
          </section>

          {/* Intellectual Property */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-[#4644b8] mb-4">{data.intellectualProperty.title}</h2>
            <ul className="space-y-3 list-disc list-inside text-[#16252d]">
              {data.intellectualProperty.items.map((item, index) => (
                <li key={index} className="leading-relaxed">{item}</li>
              ))}
            </ul>
          </section>

          {/* Data Protection */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-[#4644b8] mb-4">{data.dataProtection.title}</h2>
            <ul className="space-y-3 list-disc list-inside text-[#16252d]">
              {data.dataProtection.items.map((item, index) => (
                <li key={index} className="leading-relaxed">{item}</li>
              ))}
            </ul>
          </section>

          {/* Amendments */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-[#4644b8] mb-4">{data.amendments.title}</h2>
            <p className="text-[#16252d] leading-relaxed">{data.amendments.text}</p>
          </section>

          {/* Governing Law */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-[#4644b8] mb-4">{data.governingLaw.title}</h2>
            <p className="text-[#16252d] leading-relaxed">{data.governingLaw.text}</p>
          </section>

          {/* Anti-Circumvention */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-[#4644b8] mb-4">{data.antiCircumvention.title}</h2>
            <p className="text-[#16252d] leading-relaxed">{data.antiCircumvention.text}</p>
          </section>

          {/* Obligations */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-[#4644b8] mb-4">{data.obligations.title}</h2>
            <ul className="space-y-3 list-disc list-inside text-[#16252d]">
              {data.obligations.items.map((item, index) => (
                <li key={index} className="leading-relaxed">{item}</li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}

