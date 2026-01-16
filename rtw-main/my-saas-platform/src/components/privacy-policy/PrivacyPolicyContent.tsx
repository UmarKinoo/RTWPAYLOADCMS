import { getLocale } from 'next-intl/server'
import { Mail, Phone, MapPin } from 'lucide-react'

export async function PrivacyPolicyContent() {
  const locale = await getLocale()

  const isArabic = locale === 'ar'

  const content = {
    en: {
      title: 'Privacy Policy',
      intro: {
        title: '1. Introduction',
        text: 'ReadyToWork.SA values its users\' trust and is committed to protecting their privacy and personal data in accordance with the provisions of the Personal Data Protection Law adopted in the Kingdom of Saudi Arabia, its executive regulations, and all related systems. This policy aims to clarify how information is collected, used, stored, and shared, as well as users\' rights and mechanisms for protecting their data on the platform.',
      },
      definitions: {
        title: 'Article (2): Definitions',
        items: [
          { term: 'Platform', definition: 'The electronic site or application "ReadyToWork.SA," owned and operated by Ready To Work Establishment.' },
          { term: 'User', definition: 'Any natural or legal person who uses the platform or registers on it as an Employer or job seeker (Experts).' },
          { term: 'Personal Data', definition: 'Any information that identifies or can identify a user, such as their name, email address, identification number, phone number, or address.' },
          { term: 'Processing', definition: 'Any operation conducted on personal data, such as collection, storage, transmission, modification, or deletion.' },
          { term: 'Third Parties', definition: 'Any external entity that obtains or accesses data under legal or contractual consent.' },
        ],
      },
      scope: {
        title: 'Article (3): Scope of Application',
        text: 'This policy applies to all users who access or use the services of ReadyToWork.SA, whether via the website, smart application, or any other digital means associated with it.',
      },
      dataProcessing: {
        title: 'Article (4): Nature of Data Processing',
        items: [
          'Experts voluntarily submit and publish professional information for visibility to subscribed Employers. Employers access such data strictly for evaluation and communication purposes.',
          'The Platform does not verify, endorse, or validate the accuracy of published data.',
        ],
      },
      dataCollected: {
        title: 'Article (5): Data Collected',
        items: [
          'Identity & contact data',
          'Professional qualifications & experience',
          'Technical usage data',
          'Subscription and payment confirmation data',
        ],
      },
      legalBasis: {
        title: 'Article (6): Legal Basis for Processing',
        text: 'Processing is conducted based on:',
        items: [
          'Explicit user consent',
          'Contractual necessity',
          'Legal obligations',
          'Legitimate business interest',
        ],
      },
      storage: {
        title: 'Article (7): Data Storage & Security',
        items: [
          'Data hosted on secure servers inside KSA or compliant jurisdictions',
          'Encryption, access control, and monitoring applied',
        ],
      },
      sharing: {
        title: 'Article (8): Data Sharing',
        text: 'Data is never sold. Sharing occurs only:',
        items: [
          'With user consent',
          'With regulators upon lawful request',
          'With licensed technical service providers',
        ],
      },
      userRights: {
        title: 'Article (9): User Rights',
        text: 'Users have the following rights under the Personal Data Protection Law:',
        items: [
          { right: 'Right of access', description: 'To view their personal data held by the platform.' },
          { right: 'Right of rectification', description: 'To request corrections or updates to any inaccurate data.' },
          { right: 'Right of withdrawal', description: 'To withdraw consent for data processing or sharing.' },
          { right: 'Right of deletion', description: 'To request permanent deletion of data when there is no legal justification for retaining it.' },
          { right: 'Right to object', description: 'To object to the use of their data for specific purposes.' },
        ],
        note: 'Requests can be submitted via email or the platform\'s official contact form, and the platform is obligated to respond within 10 working days.',
      },
      governingLaw: {
        title: 'Article (10): Governing Law',
        text: 'Saudi law applies exclusively.',
      },
      amendments: {
        title: 'Article (11): Amendments to the Policy',
        text: 'The platform reserves the right to amend this privacy policy from time to time to align with regulatory or technical updates. Users will be notified of any substantial amendments via email or through a notification within the platform. Continuing to use the platform after amendments constitutes explicit acceptance of the revised terms.',
      },
      contact: {
        title: 'Article (12): Contact and Inquiries',
        text: 'For any inquiries or complaints related to the protection of personal data, you can contact us at:',
        email: 'Marketing@ReadyToWork.sa',
        phone: '053-969-6922',
        address: 'Jeddah City – Kingdom of Saudi Arabia',
      },
      general: {
        title: 'Article (13): General Provisions',
        items: [
          'In the event of a conflict between this policy and any other document published on the platform, the provisions of this policy shall prevail.',
          'This policy is governed and interpreted in accordance with the laws of the Kingdom of Saudi Arabia, and Saudi courts shall have jurisdiction over any dispute arising from it.',
          'Using the platform constitutes explicit consent from the user to all that is stated in this policy.',
        ],
      },
    },
    ar: {
      title: 'سياسة الخصوصية',
      intro: {
        title: 'المقدمة (1)',
        text: 'تُقدّر منصة ReadyToWork.sa ثقة مستخدميها، وتلتزم بحماية خصوصيتهم وبياناتهم الشخصية وفقًا لأحكام نظام حماية البيانات الشخصية المعتمد في المملكة العربية السعودية، ولائحته التنفيذية، وجميع الأنظمة ذات الصلة. وتهدف هذه السياسة إلى توضيح كيفية جمع المعلومات واستخدامها وتخزينها ومشاركتها، بالإضافة إلى حقوق المستخدمين والآليات المعتمدة لحماية بياناتهم على المنصة.',
      },
      definitions: {
        title: 'التعريفات (2)',
        items: [
          { term: 'المنصة', definition: 'الموقع الإلكتروني أو التطبيق «ReadyToWork.sa» المملوك والمدار من قبل مؤسسة Ready To Work.' },
          { term: 'المستخدم', definition: 'أي شخص طبيعي أو اعتباري يستخدم المنصة أو يسجل فيها كصاحب عمل أو كباحث عن عمل («الخبراء»).' },
          { term: 'البيانات الشخصية', definition: 'أي معلومات تُعرّف المستخدم أو يمكن أن تؤدي إلى التعرف عليه، مثل الاسم، وعنوان البريد الإلكتروني، ورقم الهوية، ورقم الهاتف، أو العنوان.' },
          { term: 'المعالجة', definition: 'أي عملية تُجرى على البيانات الشخصية، مثل الجمع أو التخزين أو الإرسال أو التعديل أو الحذف.' },
          { term: 'الأطراف الثالثة', definition: 'أي جهة خارجية تحصل على البيانات أو تطّلع عليها بموجب موافقة قانونية أو تعاقدية.' },
        ],
      },
      scope: {
        title: 'المادة (3): نطاق التطبيق',
        text: 'تُطبّق هذه السياسة على جميع المستخدمين الذين يصلون إلى خدمات ReadyToWork.sa أو يستخدمونها، سواء عبر الموقع الإلكتروني، أو التطبيق الذكي، أو أي وسيلة رقمية أخرى مرتبطة بها.',
      },
      dataProcessing: {
        title: '4. طبيعة معالجة البيانات',
        items: [
          'يقوم الخبراء بشكل طوعي بتقديم ونشر معلوماتهم المهنية لتكون مرئية لأصحاب العمل المشتركين. ويقوم أصحاب العمل بالاطلاع على هذه البيانات Strictly لأغراض التقييم والتواصل فقط.',
          'ولا تقوم المنصة بالتحقق من صحة البيانات المنشورة أو المصادقة عليها أو التأكد من دقتها.',
        ],
      },
      dataCollected: {
        title: 'المادة (5): البيانات التي يتم جمعها',
        items: [
          'بيانات الهوية والتواصل',
          'المؤهلات المهنية والخبرة',
          'بيانات الاستخدام التقنية',
          'بيانات الاشتراك وتأكيد الدفع',
        ],
      },
      legalBasis: {
        title: 'المادة (6): الأساس القانوني للمعالجة',
        text: 'تتم معالجة البيانات بناءً على ما يلي:',
        items: [
          'الموافقة الصريحة من المستخدم',
          'الضرورة التعاقدية',
          'الالتزامات القانونية',
          'المصلحة التجارية المشروعة',
        ],
      },
      storage: {
        title: 'المادة (7): تخزين البيانات وأمنها',
        items: [
          'تُخزّن البيانات على خوادم آمنة داخل المملكة العربية السعودية أو في نطاقات قضائية متوافقة.',
          'تُطبق أساليب التشفير، وضبط الوصول، والمراقبة لضمان حماية البيانات.',
        ],
      },
      sharing: {
        title: 'المادة (8): مشاركة البيانات',
        text: 'لا تُباع البيانات أبدًا. وتتم المشاركة فقط في الحالات التالية:',
        items: [
          'بموافقة المستخدم.',
          'مع الجهات الرقابية عند الطلب القانوني.',
          'مع مقدمي الخدمات التقنية المرخصين.',
        ],
      },
      userRights: {
        title: 'المادة (9): حقوق المستخدمين',
        text: 'يتمتع المستخدمون بالحقوق التالية بموجب نظام حماية البيانات الشخصية:',
        items: [
          { right: 'حق الوصول', description: 'الاطلاع على بياناتهم الشخصية المحتفظ بها لدى المنصة.' },
          { right: 'حق التصحيح', description: 'طلب تصحيح أو تحديث أي بيانات غير دقيقة.' },
          { right: 'حق السحب', description: 'سحب الموافقة على معالجة البيانات أو مشاركتها.' },
          { right: 'حق الحذف', description: 'طلب الحذف الدائم للبيانات عندما لا يكون هناك مبرر قانوني للاحتفاظ بها.' },
          { right: 'حق الاعتراض', description: 'الاعتراض على استخدام بياناتهم لأغراض محددة.' },
        ],
        note: 'يمكن تقديم الطلبات عبر البريد الإلكتروني أو نموذج التواصل الرسمي على المنصة، ويُلزم المنصة بالرد خلال 10 أيام عمل.',
      },
      governingLaw: {
        title: 'المادة (10): القانون الواجب التطبيق',
        text: 'يُطبق القانون السعودي حصريًا.',
      },
      amendments: {
        title: 'المادة (11): تعديلات على السياسة',
        text: 'تحتفظ المنصة بالحق في تعديل سياسة الخصوصية هذه من وقت لآخر لمواكبة التحديثات التنظيمية أو التقنية. وسيتم إخطار المستخدمين بأي تعديلات جوهرية عبر البريد الإلكتروني أو من خلال إشعار داخل المنصة. ويُعد استمرار استخدام المنصة بعد التعديلات قبولًا صريحًا للشروط المعدلة.',
      },
      contact: {
        title: 'المادة (12): الاتصال والاستفسارات',
        text: 'لأي استفسارات أو شكاوى تتعلق بحماية البيانات الشخصية، يمكنكم التواصل معنا عبر:',
        email: 'Marketing@ReadyToWork.sa',
        phone: '053-969-6922',
        address: 'مدينة جدة – المملكة العربية السعودية',
      },
      general: {
        title: 'المادة (13): أحكام عامة',
        items: [
          'في حال تعارض هذه السياسة مع أي مستند آخر منشور على المنصة، تسود أحكام هذه السياسة.',
          'تُفسَّر هذه السياسة وتخضع لقوانين المملكة العربية السعودية، وتختص المحاكم السعودية بالنظر في أي نزاع ينشأ عنها.',
          'يُعد استخدام المنصة موافقة صريحة من المستخدم على جميع ما ورد في هذه السياسة.',
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
          {/* Introduction */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-[#4644b8] mb-4">{data.intro.title}</h2>
            <p className="text-[#16252d] leading-relaxed">{data.intro.text}</p>
          </section>

          {/* Definitions */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-[#4644b8] mb-4">{data.definitions.title}</h2>
            <div className="space-y-4">
              {data.definitions.items.map((item, index) => (
                <div key={index} className="border-l-4 border-[#4644b8] pl-4">
                  <p className="font-semibold text-[#16252d] mb-1">{item.term}:</p>
                  <p className="text-[#353535]">{item.definition}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Scope */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-[#4644b8] mb-4">{data.scope.title}</h2>
            <p className="text-[#16252d] leading-relaxed">{data.scope.text}</p>
          </section>

          {/* Data Processing */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-[#4644b8] mb-4">{data.dataProcessing.title}</h2>
            <ul className="space-y-3 list-disc list-inside text-[#16252d]">
              {data.dataProcessing.items.map((item, index) => (
                <li key={index} className="leading-relaxed">{item}</li>
              ))}
            </ul>
          </section>

          {/* Data Collected */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-[#4644b8] mb-4">{data.dataCollected.title}</h2>
            <ul className="space-y-2 list-disc list-inside text-[#16252d]">
              {data.dataCollected.items.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>

          {/* Legal Basis */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-[#4644b8] mb-4">{data.legalBasis.title}</h2>
            <p className="text-[#16252d] mb-3 leading-relaxed">{data.legalBasis.text}</p>
            <ul className="space-y-2 list-disc list-inside text-[#16252d]">
              {data.legalBasis.items.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>

          {/* Storage */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-[#4644b8] mb-4">{data.storage.title}</h2>
            <ul className="space-y-2 list-disc list-inside text-[#16252d]">
              {data.storage.items.map((item, index) => (
                <li key={index} className="leading-relaxed">{item}</li>
              ))}
            </ul>
          </section>

          {/* Sharing */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-[#4644b8] mb-4">{data.sharing.title}</h2>
            <p className="text-[#16252d] mb-3 leading-relaxed">{data.sharing.text}</p>
            <ul className="space-y-2 list-disc list-inside text-[#16252d]">
              {data.sharing.items.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>

          {/* User Rights */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-[#4644b8] mb-4">{data.userRights.title}</h2>
            <p className="text-[#16252d] mb-4 leading-relaxed">{data.userRights.text}</p>
            <div className="space-y-3 mb-4">
              {data.userRights.items.map((item, index) => (
                <div key={index} className="bg-[#f5f5f5] p-4 rounded-lg border-l-4 border-[#4644b8]">
                  <p className="font-semibold text-[#16252d] mb-1">{item.right}:</p>
                  <p className="text-[#353535]">{item.description}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-[#757575] italic">{data.userRights.note}</p>
          </section>

          {/* Governing Law */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-[#4644b8] mb-4">{data.governingLaw.title}</h2>
            <p className="text-[#16252d] leading-relaxed">{data.governingLaw.text}</p>
          </section>

          {/* Amendments */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-[#4644b8] mb-4">{data.amendments.title}</h2>
            <p className="text-[#16252d] leading-relaxed">{data.amendments.text}</p>
          </section>

          {/* Contact */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-[#4644b8] mb-4">{data.contact.title}</h2>
            <p className="text-[#16252d] mb-6 leading-relaxed">{data.contact.text}</p>
            <div className="bg-[#ecf2ff] p-6 rounded-lg space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-[#4644b8] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-[#16252d] mb-1">Email</p>
                  <a 
                    href={`mailto:${data.contact.email}`}
                    className="text-[#4644b8] hover:underline"
                  >
                    {data.contact.email}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-[#4644b8] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-[#16252d] mb-1">Phone</p>
                  <a 
                    href={`tel:${data.contact.phone}`}
                    className="text-[#4644b8] hover:underline"
                  >
                    {data.contact.phone}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-[#4644b8] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-[#16252d] mb-1">Address</p>
                  <p className="text-[#353535]">{data.contact.address}</p>
                </div>
              </div>
            </div>
          </section>

          {/* General Provisions */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-[#4644b8] mb-4">{data.general.title}</h2>
            <ul className="space-y-3 list-disc list-inside text-[#16252d]">
              {data.general.items.map((item, index) => (
                <li key={index} className="leading-relaxed">{item}</li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}

