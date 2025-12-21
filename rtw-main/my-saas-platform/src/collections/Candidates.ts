import type { CollectionConfig } from 'payload'
import type { CollectionBeforeChangeHook } from 'payload'

import { authenticated } from '../access/authenticated'

// Hook to generate candidate bio embedding for vector search
const generateBioEmbedding: CollectionBeforeChangeHook = async ({ data, req }) => {
  // Only generate if we have the required fields
  if (!data.jobTitle || !data.primarySkill || !data.experienceYears) {
    return data
  }

  const openaiKey = process.env.OPENAI_API_KEY
  if (!openaiKey) {
    console.warn('OPENAI_API_KEY not set, skipping bio embedding generation')
    return data
  }

  try {
    // Get skill name if it's a relationship
    let skillName = ''
    if (typeof data.primarySkill === 'object' && data.primarySkill?.name) {
      skillName = data.primarySkill.name
    } else if (typeof data.primarySkill === 'string') {
      // Fetch skill if it's just an ID
      const skill = await req.payload.findByID({
        collection: 'skills',
        id: data.primarySkill,
      })
      skillName = skill?.name || ''
    }

    // Combine job title, skill name, and experience into a searchable string
    const bioText = `${data.jobTitle} ${skillName} ${data.experienceYears} years experience`

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: bioText,
      }),
    })

    if (!response.ok) {
      console.error('Failed to generate bio embedding:', await response.text())
      return data
    }

    const result = await response.json()
    if (result.data && result.data[0] && result.data[0].embedding) {
      data.bio_embedding = result.data[0].embedding
    }
  } catch (error) {
    console.error('Error generating bio embedding:', error)
  }

  return data
}

export const Candidates: CollectionConfig = {
  slug: 'candidates',
  auth: true,
  access: {
    create: () => true, // Allow public registration
    read: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['firstName', 'lastName', 'email', 'primarySkill', 'updatedAt'],
  },
  fields: [
    // Identity
    {
      name: 'firstName',
      type: 'text',
      required: true,
    },
    {
      name: 'lastName',
      type: 'text',
      required: true,
    },
    {
      name: 'phone',
      type: 'text',
      required: true,
    },
    {
      name: 'whatsapp',
      type: 'text',
      admin: {
        description: 'WhatsApp number (leave empty if same as phone)',
      },
    },
    // Smart Matrix - Only store primary skill, infer rest
    {
      name: 'primarySkill',
      type: 'relationship',
      relationTo: 'skills',
      required: true,
      admin: {
        description: 'Primary skill determines discipline, category, and subcategory',
      },
    },
    // Demographics
    {
      name: 'gender',
      type: 'select',
      options: [
        { label: 'Male', value: 'male' },
        { label: 'Female', value: 'female' },
      ],
      required: true,
    },
    {
      name: 'dob',
      type: 'date',
      label: 'Date of Birth',
      required: true,
    },
    {
      name: 'nationality',
      type: 'text',
      required: true,
    },
    {
      name: 'languages',
      type: 'text',
      required: true,
      admin: {
        description: 'Languages speaking/reading and writing',
      },
    },
    // Work
    {
      name: 'jobTitle',
      type: 'text',
      required: true,
    },
    {
      name: 'experienceYears',
      type: 'number',
      label: 'Experience (Years)',
      required: true,
      min: 0,
    },
    {
      name: 'saudiExperience',
      type: 'number',
      label: 'Experience in Saudi Arabia (Years)',
      required: true,
      min: 0,
    },
    {
      name: 'currentEmployer',
      type: 'text',
      label: 'Name of Current Employer',
    },
    {
      name: 'availabilityDate',
      type: 'date',
      label: 'Date Availability to Join',
      required: true,
    },
    // Visa
    {
      name: 'location',
      type: 'text',
      required: true,
    },
    {
      name: 'visaStatus',
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Expired', value: 'expired' },
        { label: 'Nearly Expired', value: 'nearly_expired' },
        { label: 'None', value: 'none' },
      ],
      required: true,
    },
    {
      name: 'visaExpiry',
      type: 'date',
      label: 'Visa Expiry Date',
    },
    {
      name: 'visaProfession',
      type: 'text',
      label: 'Job Position in Visa',
    },
    // Vector Search Field
    {
      name: 'bio_embedding',
      type: 'json',
      admin: {
        hidden: true,
        description: 'Vector embedding for candidate matching',
      },
    },
    // Terms acceptance
    {
      name: 'termsAccepted',
      type: 'checkbox',
      label: 'Accept the terms and conditions / Agreement Accepted',
      required: true,
      defaultValue: false,
    },
  ],
  hooks: {
    beforeChange: [generateBioEmbedding],
  },
}

