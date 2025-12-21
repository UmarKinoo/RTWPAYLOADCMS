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

// Verify PAYLOAD_SECRET is loaded
if (!process.env.PAYLOAD_SECRET) {
  console.error('❌ Error: PAYLOAD_SECRET is not set')
  console.error(`   Checked .env file at: ${envPath}`)
  process.exit(1)
}

// Now dynamically import config and Payload after env vars are loaded
import { getPayload } from 'payload'
import { fileURLToPath } from 'url'
import fs from 'fs'
import XLSX from 'xlsx'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Dynamic import of config to ensure env vars are loaded first
const configPromise = import('@payload-config')

interface SkillRow {
  'Major Discipline'?: string
  '\ufeffMajor Discipline'?: string // Handle BOM
  Discipline?: string // Fallback for variations
  discipline?: string
  Category?: string
  category?: string
  'Subcategory / Job'?: string
  'Subcategory/Job'?: string
  'Subcategory'?: string // New CSV uses this
  'Sub Category'?: string // Fallback
  'SubCategory'?: string // Fallback
  'sub category'?: string
  'subcategory'?: string
  'Sub-Category'?: string
  Skill?: string
  skill?: string
  Class?: string
  class?: string
  [key: string]: any // Allow any other properties
}

async function deleteAllData(payload: any) {
  console.log('\n🗑️  Starting hard reset - deleting all existing data...\n')
  
  // Delete in order to respect foreign keys: 
  // Candidates (dependents) -> Skills -> SubCategories -> Categories -> Disciplines
  const collections = [
    { name: 'candidates', label: 'Candidates' },
    { name: 'skills', label: 'Skills' },
    { name: 'subcategories', label: 'SubCategories' },
    { name: 'categories', label: 'Categories' },
    { name: 'disciplines', label: 'Disciplines' },
  ]

  for (const collection of collections) {
    try {
      // Fetch ALL records using a very high limit to ensure we get everything
      // Using limit: 10000 to handle large datasets, with pagination disabled
      const allDocs = await payload.find({
        collection: collection.name,
        limit: 10000, // High limit to get all records
        pagination: false, // Disable pagination to get all results
      })

      const docs = allDocs.docs
      const totalCount = docs.length
      
      if (totalCount === 0) {
        console.log(`   ℹ️  No ${collection.label} records to delete`)
        continue
      }

      console.log(`   🔍 Found ${totalCount} ${collection.label} records to delete...`)

      let totalDeleted = 0

      // Delete all documents
      for (const doc of docs) {
        await payload.delete({
          collection: collection.name,
          id: doc.id,
        })
        totalDeleted++
      }
      
      if (totalDeleted > 0) {
        console.log(`   ✅ Deleted ${totalDeleted} existing ${collection.label} records`)
      }
    } catch (error: any) {
      console.error(`   ❌ Error deleting ${collection.label}:`, error.message)
      throw error
    }
  }
  
  console.log('\n✅ Hard reset complete - all existing data deleted\n')
}

async function seedSkills() {
  console.log('🌱 Starting skills seeding with group_text embeddings...')
  console.log(`📁 Environment loaded from: ${envPath}`)
  console.log(`🔑 PAYLOAD_SECRET: ${process.env.PAYLOAD_SECRET ? '✅ Set' : '❌ Missing'}`)
  console.log('⏳ Initializing Payload (this may take a moment on first run)...\n')

  // Dynamically import config after env vars are loaded
  const config = await configPromise
  console.log('📦 Config loaded, connecting to database...')
  const payload = await getPayload({ config: config.default })
  console.log('✅ Payload initialized successfully!\n')

  try {
    // Perform hard reset to clean tables and regenerate embeddings with new group_text logic
    console.log('🔄 Performing hard reset to regenerate embeddings with group_text...\n')

    // Read the CSV file - try multiple possible locations
    const csvPaths = [
      path.resolve(process.cwd(), 'skills_clean_final_strict_v4.csv'),
      path.resolve(process.cwd(), 'skills_FINAL_industry_standard.csv'),
      path.resolve(process.cwd(), 'Job Master Skills List.csv'),
      path.resolve(process.cwd(), 'src/scripts/skills_clean_final_strict_v4.csv'),
      path.resolve(process.cwd(), 'src/scripts/skills_FINAL_industry_standard.csv'),
    ]
    
    let csvPath: string | null = null
    for (const testPath of csvPaths) {
      if (fs.existsSync(testPath)) {
        csvPath = testPath
        break
      }
    }
    
    if (!csvPath) {
      throw new Error(`CSV file not found. Checked:\n${csvPaths.map(p => `  - ${p}`).join('\n')}`)
    }
    
    console.log(`📄 Reading CSV file from: ${csvPath}`)
    let fileContent = fs.readFileSync(csvPath, 'utf-8')
    // Remove BOM (Byte Order Mark) if present
    if (fileContent.charCodeAt(0) === 0xFEFF) {
      fileContent = fileContent.slice(1)
    }
    const workbook = XLSX.read(fileContent, { type: 'string' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet) as SkillRow[]
    console.log(`📊 Found ${data.length} rows in CSV file\n`)
    
    // Debug: Show first row structure
    if (data.length > 0) {
      console.log('🔍 First row keys:', Object.keys(data[0]))
      console.log('🔍 First row sample:', JSON.stringify(data[0], null, 2))
    }

    // Perform hard reset to clean tables and regenerate embeddings with new group_text logic
    await deleteAllData(payload)

    // Track created entities to avoid duplicates
    const disciplineMap = new Map<string, number>()
    const categoryMap = new Map<string, number>()
    const subCategoryMap = new Map<string, number>()

    let created = 0
    let skipped = 0
    const skippedRows: Array<{
      row: number
      reason: string
      data: Partial<SkillRow>
    }> = []
    const stats = {
      disciplines: 0,
      categories: 0,
      subCategories: 0,
      skills: 0,
    }

    console.log(`🚀 Starting to seed ${data.length} rows...\n`)
    
    for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
      const row = data[rowIndex]
      
      // Log progress every 10 rows or on first/last row
      if ((rowIndex + 1) % 10 === 0 || rowIndex === 0 || rowIndex === data.length - 1) {
        console.log(`📝 Seeding row ${rowIndex + 1}/${data.length}...`)
      }
      console.log(`📝 Seeding row ${rowIndex + 1}/${data.length}...`)
      // Map column names - CSV uses "Major Discipline" and "Subcategory / Job"
      // Handle BOM character in column name
      const disciplineName = (
        row['Major Discipline'] || 
        row['\ufeffMajor Discipline'] || // Handle BOM
        row.Discipline || 
        row.discipline || 
        row['Discipline'] || 
        row['discipline']
      )?.toString()?.trim()
      
      const categoryName = (
        row.Category || 
        row.category || 
        row['Category'] || 
        row['category']
      )?.toString()?.trim()
      
      const subCategoryName = (
        row['Subcategory'] || // New CSV uses this
        row['Subcategory / Job'] ||
        row['Subcategory/Job'] ||
        row['Sub Category'] || 
        row['SubCategory'] || 
        row['sub category'] || 
        row['subcategory'] || 
        row['Sub-Category']
      )?.toString()?.trim()
      
      const skillName = (
        row.Skill || 
        row.skill || 
        row['Skill'] || 
        row['skill']
      )?.toString()?.trim()
      
      const billingClass = (
        row.Class || 
        row.class || 
        row['Class'] || 
        row['class']
      )?.toString()?.trim()?.toUpperCase()

      // Handle "Nan" values (case-insensitive check)
      const isNan = (value: string | undefined) => {
        if (!value) return true
        const normalized = value.trim().toLowerCase()
        return normalized === 'nan' || normalized === '' || normalized === 'null'
      }

      // Only Discipline is required - Category, Subcategory, and Skill are all optional
      // Skip rows only if Discipline is missing
      if (!disciplineName || isNan(disciplineName)) {
        skippedRows.push({
          row: rowIndex + 2, // +2 because rowIndex is 0-based and CSV has header
          reason: `Missing required field: Discipline`,
          data: { Discipline: disciplineName, Category: categoryName, 'Sub Category': subCategoryName, Skill: skillName, Class: billingClass },
        })
        skipped++
        console.log(`   ⚠️  Skipped row ${rowIndex + 2}: Missing Discipline`)
        continue
      }

      // Ensure disciplineName is a string (TypeScript safety)
      const safeDisciplineName = disciplineName.toString().trim()

      // If Category is missing or "Nan", use the Discipline name as the Category name
      const effectiveCategoryName: string = (!categoryName || isNan(categoryName)) 
        ? safeDisciplineName 
        : categoryName.toString().trim()

      // If Subcategory is missing or "Nan", use the Category name (or Discipline if Category was also missing) as the Subcategory name
      const effectiveSubCategoryName: string = (!subCategoryName || isNan(subCategoryName)) 
        ? effectiveCategoryName 
        : subCategoryName.toString().trim()

      // Apply inference rules for Skill (as specified):
      // 1. If Skill is missing and Subcategory exists: set Skill = Subcategory
      // 2. Else if Skill is missing and Subcategory missing but Category exists: set Skill = Category
      // 3. Else if only Major Discipline exists: set Skill = Major Discipline
      let effectiveSkillName: string
      if (!skillName || isNan(skillName)) {
        if (subCategoryName && !isNan(subCategoryName)) {
          effectiveSkillName = subCategoryName.toString().trim()
        } else if (categoryName && !isNan(categoryName)) {
          effectiveSkillName = categoryName.toString().trim()
        } else {
          effectiveSkillName = safeDisciplineName
        }
      } else {
        effectiveSkillName = skillName.toString().trim()
      }

      // Validate billing class
      if (!['A', 'B', 'C', 'D'].includes(billingClass || '')) {
        skippedRows.push({
          row: rowIndex + 2,
          reason: `Invalid billing class "${billingClass}" (must be A, B, C, or D)`,
          data: { Discipline: disciplineName, Category: categoryName, 'Sub Category': subCategoryName, Skill: skillName, Class: billingClass },
        })
        skipped++
        continue
      }

      try {
        // 1. Create or get Discipline
        let disciplineId = disciplineMap.get(safeDisciplineName)
        if (!disciplineId) {
          const existing = await payload.find({
            collection: 'disciplines',
            where: { name: { equals: safeDisciplineName } },
            limit: 1,
          })

          if (existing.docs.length > 0) {
            disciplineId = existing.docs[0].id
          } else {
            const created = await payload.create({
              collection: 'disciplines',
              data: { name: safeDisciplineName },
            })
            disciplineId = created.id
            stats.disciplines++
            console.log(`   ✅ Created discipline: ${safeDisciplineName}`)
          }
          disciplineMap.set(safeDisciplineName, disciplineId)
        }

        // 2. Create or get Category (using effectiveCategoryName)
        const categoryKey = `${disciplineId}:${effectiveCategoryName}`
        let categoryId = categoryMap.get(categoryKey)
        if (!categoryId) {
          const existing = await payload.find({
            collection: 'categories',
            where: {
              and: [
                { name: { equals: effectiveCategoryName } },
                { discipline: { equals: disciplineId } },
              ],
            },
            limit: 1,
          })

          if (existing.docs.length > 0) {
            categoryId = existing.docs[0].id
          } else {
            const created = await payload.create({
              collection: 'categories',
              data: {
                name: effectiveCategoryName,
                discipline: disciplineId,
              },
            })
            categoryId = created.id
            stats.categories++
            if (!categoryName || isNan(categoryName)) {
              console.log(`   ✅ Created default category: ${effectiveCategoryName} (using Discipline name)`)
            } else {
              console.log(`   ✅ Created category: ${effectiveCategoryName} (${safeDisciplineName})`)
            }
          }
          categoryMap.set(categoryKey, categoryId)
        }

        // 3. Create or get SubCategory (use effectiveSubCategoryName which defaults to categoryName if missing)
        const subCategoryKey = `${categoryId}:${effectiveSubCategoryName}`
        let subCategoryId = subCategoryMap.get(subCategoryKey)
        if (!subCategoryId) {
          const existing = await payload.find({
            collection: 'subcategories',
            where: {
              and: [
                { name: { equals: effectiveSubCategoryName } },
                { category: { equals: categoryId } },
              ],
            },
            limit: 1,
          })

          if (existing.docs.length > 0) {
            subCategoryId = existing.docs[0].id
          } else {
            const created = await payload.create({
              collection: 'subcategories',
              data: {
                name: effectiveSubCategoryName,
                category: categoryId,
              },
            })
            subCategoryId = created.id
            stats.subCategories++
            if (!subCategoryName || isNan(subCategoryName)) {
              console.log(`   ✅ Created default subcategory: ${effectiveSubCategoryName} (using Category name)`)
            } else {
              console.log(`   ✅ Created subcategory: ${effectiveSubCategoryName} (${categoryName})`)
            }
          }
          subCategoryMap.set(subCategoryKey, subCategoryId)
        }

        // 4. Create Skill (hooks enabled by default - will generate group_text and name_embedding)
        // Note: Since we're doing a hard reset, we don't need to check for existing skills
        await payload.create({
          collection: 'skills',
          data: {
            name: effectiveSkillName,
            subCategory: subCategoryId,
            billingClass: billingClass as 'A' | 'B' | 'C' | 'D',
          },
          // DO NOT use disableHooks: true - we need the beforeChange hook to generate embeddings
        })
        created++
        stats.skills++
        if (!skillName || isNan(skillName)) {
          console.log(`   ✅ Created default skill: ${effectiveSkillName} (using Category name, Class: ${billingClass})`)
        } else {
          console.log(`   ✅ Created skill: ${effectiveSkillName} (Class: ${billingClass})`)
        }
      } catch (error: any) {
        skippedRows.push({
          row: rowIndex + 2,
          reason: `Error: ${error.message || 'Unknown error'}`,
          data: { Discipline: disciplineName, Category: categoryName, 'Sub Category': subCategoryName, Skill: skillName, Class: billingClass },
        })
        console.error(`❌ Error processing row ${rowIndex + 2}:`, error.message || error)
        skipped++
      }
    }

    // Generate comprehensive report
    console.log(`\n${'='.repeat(60)}`)
    console.log(`✨ SEEDING COMPLETE - SUMMARY REPORT`)
    console.log(`${'='.repeat(60)}\n`)
    
    console.log(`📊 STATISTICS:`)
    console.log(`   Total rows processed: ${data.length}`)
    console.log(`   Skills created: ${created}`)
    console.log(`   Rows skipped: ${skipped}`)
    console.log(`   Success rate: ${((created / data.length) * 100).toFixed(1)}%\n`)
    
    console.log(`📁 ENTITIES CREATED:`)
    console.log(`   Disciplines: ${stats.disciplines} (Total unique: ${disciplineMap.size})`)
    console.log(`   Categories: ${stats.categories} (Total unique: ${categoryMap.size})`)
    console.log(`   SubCategories: ${stats.subCategories} (Total unique: ${subCategoryMap.size})`)
    console.log(`   Skills: ${stats.skills}\n`)
    
    if (skippedRows.length > 0) {
      console.log(`⚠️  SKIPPED ROWS (${skippedRows.length}):`)
      console.log(`${'-'.repeat(60)}`)
      
      // Group by reason
      const groupedByReason = skippedRows.reduce((acc, item) => {
        const reason = item.reason
        if (!acc[reason]) {
          acc[reason] = []
        }
        acc[reason].push(item)
        return acc
      }, {} as Record<string, typeof skippedRows>)
      
      for (const [reason, rows] of Object.entries(groupedByReason)) {
        console.log(`\n   ${reason}: ${rows.length} row(s)`)
        if (rows.length <= 10) {
          // Show all rows if 10 or fewer
          rows.forEach((item) => {
            console.log(`      Row ${item.row}: ${item.data.Skill || 'N/A'} | ${item.data.Discipline || 'N/A'} > ${item.data.Category || 'N/A'} > ${item.data['Sub Category'] || 'N/A'}`)
          })
        } else {
          // Show first 5 and last 5 if more than 10
          console.log(`      First 5 rows:`)
          rows.slice(0, 5).forEach((item) => {
            console.log(`         Row ${item.row}: ${item.data.Skill || 'N/A'}`)
          })
          console.log(`      ... and ${rows.length - 10} more ...`)
          console.log(`      Last 5 rows:`)
          rows.slice(-5).forEach((item) => {
            console.log(`         Row ${item.row}: ${item.data.Skill || 'N/A'}`)
          })
        }
      }
    } else {
      console.log(`✅ No rows were skipped!`)
    }
    
    console.log(`\n${'='.repeat(60)}\n`)

    // Save skipped rows to file
    const reportDir = path.resolve(process.cwd(), 'reports')
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true })
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    const skippedRowsFile = path.join(reportDir, `skipped-rows-${timestamp}.json`)
    const reportFile = path.join(reportDir, `seeding-report-${timestamp}.txt`)

    // Save skipped rows as JSON
    if (skippedRows.length > 0) {
      fs.writeFileSync(
        skippedRowsFile,
        JSON.stringify(skippedRows, null, 2),
        'utf-8'
      )
      console.log(`📄 Skipped rows saved to: ${skippedRowsFile}`)
    }

    // Save full report as text
    const reportContent = [
      '='.repeat(60),
      'SEEDING COMPLETE - SUMMARY REPORT',
      '='.repeat(60),
      '',
      'STATISTICS:',
      `   Total rows processed: ${data.length}`,
      `   Skills created: ${created}`,
      `   Rows skipped: ${skipped}`,
      `   Success rate: ${((created / data.length) * 100).toFixed(1)}%`,
      '',
      'ENTITIES CREATED:',
      `   Disciplines: ${stats.disciplines} (Total unique: ${disciplineMap.size})`,
      `   Categories: ${stats.categories} (Total unique: ${categoryMap.size})`,
      `   SubCategories: ${stats.subCategories} (Total unique: ${subCategoryMap.size})`,
      `   Skills: ${stats.skills}`,
      '',
    ]

    if (skippedRows.length > 0) {
      reportContent.push(
        `SKIPPED ROWS (${skippedRows.length}):`,
        '-'.repeat(60),
        ''
      )

      // Group by reason
      const groupedByReason = skippedRows.reduce((acc, item) => {
        const reason = item.reason
        if (!acc[reason]) {
          acc[reason] = []
        }
        acc[reason].push(item)
        return acc
      }, {} as Record<string, typeof skippedRows>)

      for (const [reason, rows] of Object.entries(groupedByReason)) {
        reportContent.push(`\n${reason}: ${rows.length} row(s)`)
        rows.forEach((item) => {
          reportContent.push(
            `   Row ${item.row}: ${item.data.Skill || 'N/A'} | ${item.data.Discipline || 'N/A'} > ${item.data.Category || 'N/A'} > ${item.data['Sub Category'] || 'N/A'} | Class: ${item.data.Class || 'N/A'}`
          )
        })
      }
    } else {
      reportContent.push('✅ No rows were skipped!')
    }

    reportContent.push('', '='.repeat(60))

    fs.writeFileSync(reportFile, reportContent.join('\n'), 'utf-8')
    console.log(`📄 Full report saved to: ${reportFile}`)

    process.exit(0)
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  }
}

seedSkills()

