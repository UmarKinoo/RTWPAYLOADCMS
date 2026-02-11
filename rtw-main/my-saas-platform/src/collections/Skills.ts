import type { CollectionConfig } from 'payload'
import type { CollectionBeforeChangeHook } from 'payload'

import { hiddenFromBlogEditor } from '../access/hiddenFromBlogEditor'
import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'

// Helper function to normalize text
function normalizeText(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\s*\/\s*/g, ' / ') // Normalize slashes
    .replace(/\s*&\s*/g, ' & ') // Normalize ampersands
}

// Helper function to build group_text from hierarchy
function buildGroupText(
  discipline: string | null | undefined,
  category: string | null | undefined,
  subcategory: string | null | undefined,
  skill: string | null | undefined,
  billingClass: string | null | undefined,
): string {
  const parts: string[] = []
  
  if (discipline) parts.push(`Major Discipline: ${normalizeText(discipline)}`)
  if (category) parts.push(`Category: ${normalizeText(category)}`)
  if (subcategory) parts.push(`Subcategory: ${normalizeText(subcategory)}`)
  if (skill) parts.push(`Skill: ${normalizeText(skill)}`)
  if (billingClass) parts.push(`Class: ${billingClass}`)
  
  return parts.join(' | ')
}

// Hook to generate embedding for vector search using composite group_text
const generateEmbedding: CollectionBeforeChangeHook = async ({ data, req }) => {
  // Only generate embedding if OpenAI API key is available
  const openaiKey = process.env.OPENAI_API_KEY
  if (!openaiKey) {
    // Don't set embedding if API key is not available
    // This prevents errors during seeding
    return data
  }

  try {
    // Fetch full hierarchy to build group_text
    let disciplineName: string | null = null
    let categoryName: string | null = null
    let subcategoryName: string | null = null
    let skillName: string | null = data.name || null
    const billingClass = data.billingClass || null

    // Get subcategory details
    if (data.subCategory) {
      let subCategoryDoc
      if (typeof data.subCategory === 'object' && data.subCategory.name) {
        // Already populated
        subCategoryDoc = data.subCategory
      } else {
        // Need to fetch
        const subCategoryId = typeof data.subCategory === 'object' && data.subCategory.id
          ? data.subCategory.id
          : (typeof data.subCategory === 'string' ? data.subCategory : String(data.subCategory))
        
        subCategoryDoc = await req.payload.findByID({
          collection: 'subcategories',
          id: subCategoryId,
          depth: 2, // Include category and discipline
        })
      }

      if (subCategoryDoc) {
        subcategoryName = subCategoryDoc.name || null

        // Get category details
        let categoryDoc
        if (typeof subCategoryDoc.category === 'object' && subCategoryDoc.category.name) {
          categoryDoc = subCategoryDoc.category
        } else if (subCategoryDoc.category) {
          const categoryId = typeof subCategoryDoc.category === 'object' && subCategoryDoc.category.id
            ? subCategoryDoc.category.id
            : (typeof subCategoryDoc.category === 'string' ? subCategoryDoc.category : String(subCategoryDoc.category))
          
          categoryDoc = await req.payload.findByID({
            collection: 'categories',
            id: categoryId,
            depth: 1, // Include discipline
          })
        }

        if (categoryDoc) {
          categoryName = categoryDoc.name || null

          // Get discipline details
          let disciplineDoc
          if (typeof categoryDoc.discipline === 'object' && categoryDoc.discipline.name) {
            disciplineDoc = categoryDoc.discipline
          } else if (categoryDoc.discipline) {
            const disciplineId = typeof categoryDoc.discipline === 'object' && categoryDoc.discipline.id
              ? categoryDoc.discipline.id
              : (typeof categoryDoc.discipline === 'string' ? categoryDoc.discipline : String(categoryDoc.discipline))
            
            disciplineDoc = await req.payload.findByID({
              collection: 'disciplines',
              id: disciplineId,
            })
          }

          if (disciplineDoc) {
            disciplineName = disciplineDoc.name || null
          }
        }
      }
    }

    // Apply inference rules for missing Skill (as specified):
    // 1. If Skill is missing and Subcategory exists: set Skill = Subcategory
    // 2. Else if Skill is missing and Subcategory missing but Category exists: set Skill = Category
    // 3. Else if only Major Discipline exists: set Skill = Major Discipline
    let effectiveSkillName = skillName
    if (!effectiveSkillName || effectiveSkillName.trim() === '') {
      if (subcategoryName && subcategoryName.trim() !== '') {
        effectiveSkillName = subcategoryName
      } else if (categoryName && categoryName.trim() !== '') {
        effectiveSkillName = categoryName
      } else if (disciplineName && disciplineName.trim() !== '') {
        effectiveSkillName = disciplineName
      }
    }

    // Build group_text from available fields (only include non-empty values)
    const groupText = buildGroupText(
      disciplineName,
      categoryName,
      subcategoryName,
      effectiveSkillName,
      billingClass ? String(billingClass) : null,
    )

    // Store group_text in data for reference
    data.group_text = groupText

    // Generate embedding from group_text
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: groupText,
      }),
    })

    if (!response.ok) {
      console.error('Failed to generate embedding:', await response.text())
      return data
    }

    const result = await response.json()
    if (result.data && result.data[0] && result.data[0].embedding) {
      // Store embedding array directly as JSON
      data.name_embedding = result.data[0].embedding
    }
  } catch (error) {
    console.error('Error generating embedding:', error)
  }

  return data
}

export const Skills: CollectionConfig = {
  slug: 'skills',
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  admin: {
    hidden: hiddenFromBlogEditor,
    useAsTitle: 'name',
    defaultColumns: ['name', 'subCategory', 'billingClass', 'updatedAt'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'English name (fallback if name_en is not set)',
      },
    },
    {
      name: 'name_en',
      type: 'text',
      required: false,
      admin: {
        description: 'English name (used when locale is "en")',
      },
    },
    {
      name: 'name_ar',
      type: 'text',
      required: false,
      admin: {
        description: 'Arabic name (used when locale is "ar")',
      },
    },
    {
      name: 'subCategory',
      type: 'relationship',
      relationTo: 'subcategories',
      required: true,
    },
    {
      name: 'billingClass',
      type: 'select',
      options: [
        { label: 'A', value: 'A' },
        { label: 'B', value: 'B' },
        { label: 'C', value: 'C' },
        { label: 'D', value: 'D' },
      ],
      required: true,
      admin: {
        description: 'Billing class for pricing calculation',
      },
    },
    {
      name: 'group_text',
      type: 'text',
      admin: {
        hidden: true,
        description: 'Composite text used for embedding generation',
      },
    },
    {
      name: 'name_embedding',
      type: 'json',
      admin: {
        hidden: true,
        description: 'Vector embedding for semantic search (generated from group_text)',
      },
    },
  ],
  hooks: {
    beforeChange: [generateEmbedding],
  },
}

