// Script to create a blog post in Payload CMS
// IMPORTANT: Load environment variables FIRST
import dotenv from 'dotenv'
import path from 'path'
import { getPayload } from 'payload'

// Load environment variables from .env file in project root
const envPath = path.resolve(process.cwd(), '.env')
const result = dotenv.config({ path: envPath })

if (result.error) {
  console.warn('⚠️  Warning: Could not load .env file:', result.error.message)
} else {
  console.log('✅ Environment variables loaded from:', envPath)
}

// Verify required env vars
if (!process.env.PAYLOAD_SECRET) {
  console.error('❌ Error: PAYLOAD_SECRET is not set')
  process.exit(1)
}

// Now dynamically import config after env vars are loaded
const configPromise = import('@payload-config')

// Helper function to create a paragraph node
function createParagraph(text: string) {
  return {
    children: [
      {
        detail: 0,
        format: 0,
        mode: 'normal' as const,
        style: '',
        text: text,
        type: 'text' as const,
        version: 1,
      },
    ],
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    type: 'paragraph' as const,
    version: 1,
  }
}

// Helper function to create a heading node
function createHeading(text: string, level: 1 | 2 | 3 | 4 = 2) {
  return {
    children: [
      {
        detail: 0,
        format: 0,
        mode: 'normal' as const,
        style: '',
        text: text,
        type: 'text' as const,
        version: 1,
      },
    ],
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    tag: `h${level}`,
    type: 'heading' as const,
    version: 1,
  }
}

// Convert content to Lexical format
function createLexicalContent() {
  const content = [
    createParagraph('Hiring talent isn\'t about the interviews. It starts from the representation of the role. What your job description tells about your company and the role matters the most; besides, when you are presenting your company in the market, there are dozens of talented people looking for the role. However, many candidates pass on the job because the description often lacks conviction.'),
    createParagraph('So, they move to the more compelling job offer, even if it might be just in words, but you will lose a skilled talent only because you were not smart about the job role description. So, how can you make smarter job listings? This question remains unanswered.'),
    createHeading('Why Traditional Job Listings Fall Short', 2),
    createParagraph('When you open the same old job listings, what do you see? Many employers are just copying and pasting similar job descriptions for similar roles in the market. People see it and think of you as one of them. Many even rely on the same jargon like "rockstar candidate," or "must handle pressure, but what insight in the role? Completely missing. This discourages a candidate from applying, especially those who know their worth.'),
    createParagraph('Another underlying issue is unrealistic expectations, which is also one of the Job seeker challenges. Your market may not work the same way it did in the last few years. Things are changing, so asking for 8-10 years of experience for mid-level roles in these times is absurd. This can significantly shrink the pool.'),
    createParagraph('Smart job listings or job listing platforms for employers keep their focus on what really matters. They plan and get creative with their job roles as they draft the description.'),
    createHeading('How To Attract Better Talent Through Smart Job Listings?', 2),
    createParagraph('Remember that smart job listings can make measurable differences. When you write with intent and are transparent about the role, your job listings are not merely descriptions but strategies to attract top talent through job postings.'),
    createParagraph('This is the first step to implement a powerful narrative about your company.'),
    createHeading('Writing With the Candidate in Mind', 3),
    createParagraph('The most effective job listing strategies for employers are to write from the candidate\'s perspective. Instead of focusing on "What do we want from an employee?" smart employers ask, "What does the candidate want to know before applying?"'),
    createParagraph('So, how to write better job listings?'),
    createParagraph('It\'s all about being clear on daily tasks, who reports to whom, the chances for advancement, and what success looks like.'),
    createParagraph('Job seekers want to know how their efforts will impact the company and what their career path could look like in the long run.'),
    createParagraph('Effective job postings clearly outline what\'s expected during the first 30, 60, and 90 days, helping candidates picture themselves in the position.'),
    createParagraph('And let\'s not forget about the language. Using inclusive, simple language can attract a wider, more diverse group of applicants.'),
    createParagraph('Studies have shown that using gender-neutral and unbiased language can boost application rates, especially from groups that are often underrepresented.'),
    createHeading('Transparency Builds Trust - and Better Applications', 3),
    createParagraph('A key aspect of Smarter Job Listings is transparency. For best practices for employer job listings, include all details. Salary ranges, benefits, work arrangements, and performance expectations must be clear rather than unclear or vague.'),
    createParagraph('When employers openly share compensation details and benefits. They tend to get fewer unqualified applicants and attract more serious candidates.'),
    createParagraph('Transparency is also crucial when it comes to company culture.'),
    createParagraph('Rather than just throwing around phrases like "great culture" or "supportive team," smarter listings offer specific examples, like how teams work together, how feedback is shared, and how success is acknowledged.'),
    createParagraph('This kind of honesty helps build trust and draws in candidates who really match the company\'s values.'),
    createHeading('Optimizing Job Listings for Search and Visibility', 3),
    createParagraph('Smart job listings for talent acquisition aren\'t just made for people; they\'re also designed to be friendly for search engines and job boards.'),
    createParagraph('By using the right keywords, clear job titles, and a well-organized layout, these listings can appear in search results where the right candidates are looking.'),
    createParagraph('While creative job titles might sound great in-house, they can really hurt your visibility. The best employers find a sweet spot between being clear and maintaining their brand so that potential applicants can easily find their positions.'),
    createParagraph('And let\'s not forget about formatting.'),
    createParagraph('Keeping paragraphs short, using bullet points, and creating easy-to-scan sections really boost readability, especially since many job seekers browse on mobile devices these days.'),
    createHeading('Using Data to Improve Job Listings Continuously', 3),
    createParagraph('Smarter job listings aren\'t just set-and-forget documents. In fact, employers hiring through job portals should focus on data. Employers who want to attract top talent view these job ads as dynamic tools that improve over time, thanks to data and feedback.'),
    createParagraph('Things like:'),
    createParagraph('Application conversion rates'),
    createParagraph('How long does it take to fill a position'),
    createParagraph('The quality of candidates can really help figure out what\'s working well and what needs tweaking.'),
    createParagraph('Trying out different job titles, descriptions, or calls to action can show how even small adjustments can lead to much better results. Moreover, getting feedback from candidates, especially those who were interviewed or turned down offers, can highlight any gaps or mismatches between the job listing and what the role actually entails.'),
    createHeading('Conclusion', 2),
    createParagraph('Smarter job listings are no longer optional; they are a core part of modern talent acquisition solutions for companies. Clear, transparent, and candidate-focused job descriptions help employers stand out, attract qualified applicants, and reduce hiring friction. When combined with data-driven optimisation, job listings become strategic assets rather than static postings.'),
    createParagraph('Platforms like Ready to Work support this shift by connecting workers and companies through a smarter talent sourcing portal that prioritises clarity, relevance, and fit.'),
    createParagraph('By aligning job listings with real candidate expectations and business goals, employers can build stronger pipelines, improve hiring outcomes, and compete effectively in today\'s evolving talent market.'),
    createHeading('FAQs', 2),
    createHeading('How can employers attract better talent through smarter job listings?', 3),
    createParagraph('Employers attract better talent by writing clear, transparent, and candidate-focused job listings that explain responsibilities, growth paths, and compensation, helping qualified candidates confidently decide to apply.'),
    createHeading('Why do traditional job listings fail to attract top candidates?', 3),
    createParagraph('Traditional job listings often rely on vague language, unrealistic requirements, and generic templates, which discourages skilled candidates who seek clarity, fairness, and meaningful insight into the role.'),
    createHeading('How do job platforms support smarter job listings for employers?', 3),
    createParagraph('Modern job platforms use data, keyword optimisation, and performance insights to improve visibility and relevance, helping employers refine listings and connect with the right candidates efficiently.'),
  ]

  return {
    root: {
      children: content,
      direction: 'ltr' as const,
      format: '' as const,
      indent: 0,
      type: 'root' as const,
      version: 1,
    },
  }
}

// Blog post data
const blogPostData = {
  title: 'How Employers Can Attract Better Talent Through Smarter Job Listings',
  slug: 'how-employers-can-attract-better-talent-through-smarter-job-listings',
  meta: {
    title: 'How to Attract Top Talent with Smarter Job Listings',
    description: 'Use smarter job listings to engage the right candidates, boost applications, and improve hiring outcomes with clear, transparent, and effective job postings.',
  },
  publishedAt: new Date().toISOString(),
  content: createLexicalContent(),
}

async function createBlogPost() {
  console.log('📝 Creating blog post...')
  console.log(`📁 Environment loaded from: ${envPath}`)
  console.log(`🔑 PAYLOAD_SECRET: ${process.env.PAYLOAD_SECRET ? '✅ Set' : '❌ Missing'}`)
  console.log('⏳ Initializing Payload (this may take a moment on first run)...\n')

  const config = await configPromise
  console.log('📦 Config loaded, connecting to database...')

  try {
    const payload = await getPayload({ config: config.default })
    console.log('✅ Payload initialized successfully!\n')

    // Check if post already exists
    const existing = await payload.find({
      collection: 'posts',
      where: {
        slug: {
          equals: blogPostData.slug,
        },
      },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      console.log(`⚠️  Post with slug "${blogPostData.slug}" already exists.`)
      console.log('   You can update it manually in Payload CMS admin panel.')
      console.log(`   Post ID: ${existing.docs[0].id}`)
      process.exit(0)
    }

    // Get first user as author (or you can specify a user ID)
    const users = await payload.find({
      collection: 'users',
      limit: 1,
    })

    const authorId = users.docs.length > 0 ? users.docs[0].id : null

    // Create the post
    const post = await payload.create({
      collection: 'posts',
      data: {
        ...blogPostData,
        authors: authorId ? [authorId] : [],
      },
      draft: false,
    })

    console.log(`\n✅ Blog post created successfully!`)
    console.log(`   Title: ${post.title}`)
    console.log(`   Slug: ${post.slug}`)
    console.log(`   ID: ${post.id}`)
    console.log(`\n📝 Next steps:`)
    console.log(`   1. Go to Payload CMS admin panel`)
    console.log(`   2. Navigate to Posts collection`)
    console.log(`   3. Edit the post with ID: ${post.id}`)
    console.log(`   4. Add the full content in the rich text editor`)
    console.log(`   5. Upload a hero image if needed`)
    console.log(`   6. Add categories if needed`)
    console.log(`\n✨ Post is ready for content editing!\n`)

    process.exit(0)
  } catch (error: any) {
    console.error('❌ Error creating blog post:', error.message)
    if (error.stack) {
      console.error(error.stack)
    }
    process.exit(1)
  }
}

createBlogPost()
