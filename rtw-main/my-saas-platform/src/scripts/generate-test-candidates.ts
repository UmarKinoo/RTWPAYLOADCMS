/**
 * Script to generate test candidates with various skills for testing search functionality
 */

// IMPORTANT: Load environment variables FIRST
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env file in project root
const envPath = path.resolve(process.cwd(), '.env')
const result = dotenv.config({ path: envPath })

if (result.error) {
  console.warn('⚠️  Warning: Could not load .env file:', result.error.message)
} else {
  console.log('✅ Environment variables loaded from:', envPath)
}

import { query as dbQuery, closePool } from '@/lib/db'

interface TestCandidate {
  firstName: string
  lastName: string
  email: string
  password: string
  phone: string
  primarySkillName: string // We'll look this up
  gender: 'male' | 'female'
  dob: string
  nationality: string
  languages: string
  jobTitle: string
  experienceYears: number
  saudiExperience: number
  currentEmployer?: string
  availabilityDate: string
  location: string
  visaStatus: 'active' | 'expired' | 'nearly_expired' | 'none'
  visaExpiry?: string
  visaProfession?: string
}

const testCandidates: TestCandidate[] = [
  {
    firstName: 'Ahmed',
    lastName: 'Al-Saud',
    email: 'test.plumber1@test.com',
    password: 'Test1234!@#$',
    phone: '+966501234567',
    primarySkillName: 'Plumbing',
    gender: 'male',
    dob: '1990-05-15',
    nationality: 'Saudi Arabia',
    languages: 'Arabic, English',
    jobTitle: 'Plumber',
    experienceYears: 8,
    saudiExperience: 8,
    currentEmployer: 'ABC Plumbing Co.',
    availabilityDate: '2025-02-01',
    location: 'Riyadh',
    visaStatus: 'active',
  },
  {
    firstName: 'Mohammed',
    lastName: 'Hassan',
    email: 'test.plumber2@test.com',
    password: 'Test1234!@#$',
    phone: '+966502345678',
    primarySkillName: 'Plumbing',
    gender: 'male',
    dob: '1988-03-20',
    nationality: 'Egyptian',
    languages: 'Arabic, English',
    jobTitle: 'Senior Plumber',
    experienceYears: 12,
    saudiExperience: 5,
    currentEmployer: 'XYZ Services',
    availabilityDate: '2025-02-15',
    location: 'Jeddah',
    visaStatus: 'active',
  },
  {
    firstName: 'Fatima',
    lastName: 'Ali',
    email: 'test.electrician1@test.com',
    password: 'Test1234!@#$',
    phone: '+966503456789',
    primarySkillName: 'Wiring',
    gender: 'female',
    dob: '1992-07-10',
    nationality: 'Saudi Arabia',
    languages: 'Arabic, English',
    jobTitle: 'Electrician',
    experienceYears: 6,
    saudiExperience: 6,
    availabilityDate: '2025-02-01',
    location: 'Dammam',
    visaStatus: 'active',
  },
  {
    firstName: 'Khalid',
    lastName: 'Ibrahim',
    email: 'test.welder1@test.com',
    password: 'Test1234!@#$',
    phone: '+966504567890',
    primarySkillName: 'Welding',
    gender: 'male',
    dob: '1985-11-25',
    nationality: 'Pakistani',
    languages: 'Urdu, English, Arabic',
    jobTitle: 'Welder',
    experienceYears: 10,
    saudiExperience: 7,
    currentEmployer: 'Metal Works Inc.',
    availabilityDate: '2025-03-01',
    location: 'Riyadh',
    visaStatus: 'active',
  },
  {
    firstName: 'Sara',
    lastName: 'Mohammed',
    email: 'test.irrigation1@test.com',
    password: 'Test1234!@#$',
    phone: '+966505678901',
    primarySkillName: 'Irrigation System',
    gender: 'female',
    dob: '1991-09-05',
    nationality: 'Saudi Arabia',
    languages: 'Arabic, English',
    jobTitle: 'Irrigation Specialist',
    experienceYears: 7,
    saudiExperience: 7,
    availabilityDate: '2025-02-10',
    location: 'Al Khobar',
    visaStatus: 'active',
  },
  {
    firstName: 'Omar',
    lastName: 'Abdullah',
    email: 'test.watertreatment1@test.com',
    password: 'Test1234!@#$',
    phone: '+966506789012',
    primarySkillName: 'Water Treatment',
    gender: 'male',
    dob: '1987-12-18',
    nationality: 'Saudi Arabia',
    languages: 'Arabic, English',
    jobTitle: 'Water Treatment Technician',
    experienceYears: 9,
    saudiExperience: 9,
    currentEmployer: 'Water Solutions Ltd.',
    availabilityDate: '2025-02-20',
    location: 'Riyadh',
    visaStatus: 'active',
  },
  {
    firstName: 'Layla',
    lastName: 'Ahmed',
    email: 'test.pipefitter1@test.com',
    password: 'Test1234!@#$',
    phone: '+966507890123',
    primarySkillName: 'Plumbing', // Using Plumbing as closest match
    gender: 'female',
    dob: '1993-04-30',
    nationality: 'Saudi Arabia',
    languages: 'Arabic, English',
    jobTitle: 'Pipe Fitter',
    experienceYears: 5,
    saudiExperience: 5,
    availabilityDate: '2025-02-05',
    location: 'Jeddah',
    visaStatus: 'active',
  },
  {
    firstName: 'Yusuf',
    lastName: 'Hassan',
    email: 'test.maintenance1@test.com',
    password: 'Test1234!@#$',
    phone: '+966508901234',
    primarySkillName: 'Plumbing', // Using Plumbing as closest match
    gender: 'male',
    dob: '1989-06-12',
    nationality: 'Yemeni',
    languages: 'Arabic, English',
    jobTitle: 'Maintenance Technician',
    experienceYears: 11,
    saudiExperience: 6,
    currentEmployer: 'Facilities Management Co.',
    availabilityDate: '2025-03-01',
    location: 'Riyadh',
    visaStatus: 'active',
  },
  // Additional 10 candidates with diverse skills
  {
    firstName: 'Noura',
    lastName: 'Al-Rashid',
    email: 'test.cook1@test.com',
    password: 'Test1234!@#$',
    phone: '+966509012345',
    primarySkillName: 'Cooking',
    gender: 'female',
    dob: '1990-08-20',
    nationality: 'Saudi Arabia',
    languages: 'Arabic, English',
    jobTitle: 'Chef',
    experienceYears: 9,
    saudiExperience: 9,
    currentEmployer: 'Fine Dining Restaurant',
    availabilityDate: '2025-02-15',
    location: 'Riyadh',
    visaStatus: 'active',
  },
  {
    firstName: 'Aisha',
    lastName: 'Mohammed',
    email: 'test.babysitter1@test.com',
    password: 'Test1234!@#$',
    phone: '+966510123456',
    primarySkillName: 'Babysitting',
    gender: 'female',
    dob: '1992-03-14',
    nationality: 'Filipino',
    languages: 'English, Tagalog, Arabic',
    jobTitle: 'Babysitter',
    experienceYears: 6,
    saudiExperience: 4,
    availabilityDate: '2025-02-01',
    location: 'Jeddah',
    visaStatus: 'active',
  },
  {
    firstName: 'Salem',
    lastName: 'Al-Mutairi',
    email: 'test.ac1@test.com',
    password: 'Test1234!@#$',
    phone: '+966511234567',
    primarySkillName: 'AC Technician / Cooling',
    gender: 'male',
    dob: '1986-11-08',
    nationality: 'Saudi Arabia',
    languages: 'Arabic, English',
    jobTitle: 'AC Technician',
    experienceYears: 12,
    saudiExperience: 12,
    currentEmployer: 'Cooling Solutions Co.',
    availabilityDate: '2025-02-20',
    location: 'Dammam',
    visaStatus: 'active',
  },
  {
    firstName: 'Hassan',
    lastName: 'Ibrahim',
    email: 'test.carpenter1@test.com',
    password: 'Test1234!@#$',
    phone: '+966512345678',
    primarySkillName: 'Carpenter',
    gender: 'male',
    dob: '1984-07-22',
    nationality: 'Pakistani',
    languages: 'Urdu, English, Arabic',
    jobTitle: 'Carpenter',
    experienceYears: 15,
    saudiExperience: 8,
    currentEmployer: 'Wood Works Ltd.',
    availabilityDate: '2025-03-01',
    location: 'Riyadh',
    visaStatus: 'active',
  },
  {
    firstName: 'Rashid',
    lastName: 'Al-Ghamdi',
    email: 'test.painter1@test.com',
    password: 'Test1234!@#$',
    phone: '+966513456789',
    primarySkillName: 'Painting / Interior And Exterior Painting',
    gender: 'male',
    dob: '1987-05-30',
    nationality: 'Saudi Arabia',
    languages: 'Arabic, English',
    jobTitle: 'Painter',
    experienceYears: 10,
    saudiExperience: 10,
    currentEmployer: 'Paint Masters',
    availabilityDate: '2025-02-10',
    location: 'Jeddah',
    visaStatus: 'active',
  },
  {
    firstName: 'Fahad',
    lastName: 'Al-Shehri',
    email: 'test.security1@test.com',
    password: 'Test1234!@#$',
    phone: '+966514567890',
    primarySkillName: 'Security',
    gender: 'male',
    dob: '1991-01-18',
    nationality: 'Saudi Arabia',
    languages: 'Arabic, English',
    jobTitle: 'Security Guard',
    experienceYears: 7,
    saudiExperience: 7,
    currentEmployer: 'Secure Guard Services',
    availabilityDate: '2025-02-05',
    location: 'Riyadh',
    visaStatus: 'active',
  },
  {
    firstName: 'Mariam',
    lastName: 'Al-Zahrani',
    email: 'test.cleaning1@test.com',
    password: 'Test1234!@#$',
    phone: '+966515678901',
    primarySkillName: 'General Cleaning',
    gender: 'female',
    dob: '1993-09-12',
    nationality: 'Saudi Arabia',
    languages: 'Arabic, English',
    jobTitle: 'Cleaner',
    experienceYears: 5,
    saudiExperience: 5,
    availabilityDate: '2025-02-01',
    location: 'Al Khobar',
    visaStatus: 'active',
  },
  {
    firstName: 'Khalid',
    lastName: 'Al-Otaibi',
    email: 'test.carcleaning1@test.com',
    password: 'Test1234!@#$',
    phone: '+966516789012',
    primarySkillName: 'Interior And Exterior Cleaning',
    gender: 'male',
    dob: '1988-12-25',
    nationality: 'Saudi Arabia',
    languages: 'Arabic, English',
    jobTitle: 'Car Detailer',
    experienceYears: 8,
    saudiExperience: 8,
    currentEmployer: 'Auto Shine Services',
    availabilityDate: '2025-02-15',
    location: 'Riyadh',
    visaStatus: 'active',
  },
  {
    firstName: 'Lina',
    lastName: 'Al-Mansouri',
    email: 'test.petgroomer1@test.com',
    password: 'Test1234!@#$',
    phone: '+966517890123',
    primarySkillName: 'Pet Groomer / Bathing',
    gender: 'female',
    dob: '1994-06-07',
    nationality: 'Saudi Arabia',
    languages: 'Arabic, English',
    jobTitle: 'Pet Groomer',
    experienceYears: 4,
    saudiExperience: 4,
    currentEmployer: 'Pet Care Center',
    availabilityDate: '2025-02-10',
    location: 'Jeddah',
    visaStatus: 'active',
  },
  {
    firstName: 'Tariq',
    lastName: 'Al-Harbi',
    email: 'test.music1@test.com',
    password: 'Test1234!@#$',
    phone: '+966518901234',
    primarySkillName: 'Music',
    gender: 'male',
    dob: '1990-04-16',
    nationality: 'Saudi Arabia',
    languages: 'Arabic, English',
    jobTitle: 'Music Instructor',
    experienceYears: 8,
    saudiExperience: 8,
    currentEmployer: 'Music Academy',
    availabilityDate: '2025-02-20',
    location: 'Riyadh',
    visaStatus: 'active',
  },
  {
    firstName: 'Zainab',
    lastName: 'Al-Fahad',
    email: 'test.swimming1@test.com',
    password: 'Test1234!@#$',
    phone: '+966519012345',
    primarySkillName: 'Swimming Trainer',
    gender: 'female',
    dob: '1992-10-28',
    nationality: 'Saudi Arabia',
    languages: 'Arabic, English',
    jobTitle: 'Swimming Coach',
    experienceYears: 6,
    saudiExperience: 6,
    currentEmployer: 'Aqua Sports Club',
    availabilityDate: '2025-02-01',
    location: 'Dammam',
    visaStatus: 'active',
  },
]

async function generateTestCandidates() {
  console.log('🚀 Generating test candidates...\n')

  try {
    // Step 1: Get skill IDs and billing classes for the skills we want to use
    console.log('Step 1: Fetching skills with billing classes...')
    const skillsMap = new Map<string, { id: number; billingClass: string }>()

    for (const skillName of [
      'Plumbing', 'Wiring', 'Welding', 'Irrigation System', 'Water Treatment',
      'Cooking', 'Babysitting', 'AC Technician / Cooling', 'Carpenter',
      'Painting / Interior And Exterior Painting', 'Security', 'General Cleaning',
      'Interior And Exterior Cleaning', 'Pet Groomer / Bathing', 'Music', 'Swimming Trainer'
    ]) {
      const skillsResult = await dbQuery<{ id: string; name: string; billing_class: string }>(`
        SELECT id, name, billing_class
        FROM skills
        WHERE name ILIKE $1
        LIMIT 1
      `, [`%${skillName}%`])

      if (skillsResult.rows.length > 0) {
        const skillId = parseInt(skillsResult.rows[0].id)
        const billingClass = skillsResult.rows[0].billing_class || 'B' // Default to B if not set
        skillsMap.set(skillName, { id: skillId, billingClass })
        console.log(`  ✓ Found skill: "${skillsResult.rows[0].name}" (ID: ${skillId}, Class: ${billingClass})`)
      } else {
        console.log(`  ⚠️  Skill not found: "${skillName}"`)
      }
    }
    console.log()

    // Step 2: Generate candidates using direct SQL
    console.log('Step 2: Creating test candidates...\n')
    let created = 0
    let skipped = 0
    let errors = 0

    // We need to hash passwords - Payload uses bcryptjs with 10 rounds
    // For test candidates, we'll use a simple approach: let Payload handle it via API
    // But since we're using direct SQL, we need bcryptjs
    // Let's use a workaround: create users table entry manually
    // Actually, let's just insert with a placeholder and note that passwords need to be set via Payload admin
    console.log('⚠️  Note: Direct SQL insertion requires password hashing.')
    console.log('   For now, we\'ll create candidates but you may need to reset passwords via Payload admin.\n')

    for (const candidateData of testCandidates) {
      try {
        // Check if candidate already exists
        const existing = await dbQuery<{ id: string }>(`
          SELECT id FROM candidates WHERE email = $1
        `, [candidateData.email.toLowerCase()])

        if (existing.rows.length > 0) {
          console.log(`⏭️  Skipping ${candidateData.email} - already exists`)
          skipped++
          continue
        }

        // Get skill ID and billing class
        const skillInfo = skillsMap.get(candidateData.primarySkillName)
        if (!skillInfo) {
          console.log(`❌ Skipping ${candidateData.email} - skill "${candidateData.primarySkillName}" not found`)
          errors++
          continue
        }
        const { id: skillId, billingClass } = skillInfo

        // Hash password using bcryptjs (Payload uses hash and salt columns)
        const bcrypt = await import('bcryptjs')
        const salt = await bcrypt.genSalt(10)
        const hash = await bcrypt.hash(candidateData.password, salt)

        // Create candidate directly in database
        // Note: This bypasses Payload hooks, so we need to set all fields manually
        // Payload stores passwords as hash and salt, not password
        // Billing class is automatically set from primary skill's billing class
        const result = await dbQuery<{ id: string }>(`
          INSERT INTO candidates (
            first_name, last_name, email, hash, salt, phone, whatsapp,
            phone_verified, email_verified, primary_skill_id, billing_class,
            gender, dob, nationality, languages,
            job_title, experience_years, saudi_experience, current_employer,
            availability_date, location, visa_status, visa_expiry, visa_profession,
            terms_accepted, updated_at, created_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7,
            $8, $9, $10, $11,
            $12, $13, $14, $15,
            $16, $17, $18, $19,
            $20, $21, $22, $23, $24,
            $25, NOW(), NOW()
          )
          RETURNING id
        `, [
          candidateData.firstName,
          candidateData.lastName,
          candidateData.email.toLowerCase(),
          hash, // bcrypt hash
          salt, // bcrypt salt
          candidateData.phone,
          candidateData.phone, // whatsapp same as phone
          true, // phoneVerified
          true, // emailVerified
          skillId,
          billingClass, // Set billing class from skill
          candidateData.gender,
          candidateData.dob,
          candidateData.nationality,
          candidateData.languages,
          candidateData.jobTitle,
          candidateData.experienceYears,
          candidateData.saudiExperience,
          candidateData.currentEmployer || null,
          candidateData.availabilityDate,
          candidateData.location,
          candidateData.visaStatus,
          candidateData.visaExpiry || null,
          candidateData.visaProfession || null,
          true, // termsAccepted
        ])

        if (result.rows.length > 0) {
          console.log(`✅ Created: ${candidateData.firstName} ${candidateData.lastName} (${candidateData.email})`)
          console.log(`   Skill: ${candidateData.primarySkillName} | Job: ${candidateData.jobTitle} | Location: ${candidateData.location} | Class: ${billingClass}`)
          created++
        }
      } catch (error: any) {
        console.error(`❌ Error creating ${candidateData.email}:`, error.message)
        errors++
      }
    }

    console.log(`\n📊 Summary:`)
    console.log(`   ✅ Created: ${created}`)
    console.log(`   ⏭️  Skipped: ${skipped}`)
    console.log(`   ❌ Errors: ${errors}`)
    console.log(`\n✅ Test candidates generation complete!`)
    console.log(`\n💡 Note: These candidates have phoneVerified=true and emailVerified=true for easy testing.`)
    
    await closePool()
  } catch (error) {
    console.error('Fatal error:', error)
    await closePool()
    process.exit(1)
  }
}

// Run the generation
generateTestCandidates()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
