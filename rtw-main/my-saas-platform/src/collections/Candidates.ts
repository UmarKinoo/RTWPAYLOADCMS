import type { CollectionConfig } from 'payload'
import type { CollectionBeforeChangeHook } from 'payload'

import { authenticated } from '../access/authenticated'
import {
  revalidateCandidate,
  revalidateCandidateDelete,
} from './Candidates/hooks/revalidateCandidate'
import { updateBioEmbeddingVector } from './Candidates/hooks/updateBioEmbeddingVector'

// Hook to set billing class from primary skill and generate bio embedding
const setBillingClassAndGenerateEmbedding: CollectionBeforeChangeHook = async ({ data, req }) => {
  // Set billing class from primary skill
  if (data.primarySkill) {
    try {
      let skillDoc
      if (typeof data.primarySkill === 'object' && data.primarySkill?.billingClass) {
        // Already populated
        skillDoc = data.primarySkill
      } else {
        // Need to fetch
        const skillId = typeof data.primarySkill === 'object' && data.primarySkill.id
          ? data.primarySkill.id
          : (typeof data.primarySkill === 'string' ? data.primarySkill : String(data.primarySkill))
        
        skillDoc = await req.payload.findByID({
          collection: 'skills',
          id: skillId,
        })
      }

      if (skillDoc && skillDoc.billingClass) {
        // Automatically set billing class from skill
        data.billingClass = skillDoc.billingClass
      }
    } catch (error) {
      console.error('Error fetching skill for billing class:', error)
    }
  }

  // Generate bio embedding if we have the required fields
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
      // Store in JSONB for backward compatibility
      // The afterChange hook will update bio_embedding_vec column
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
    defaultColumns: ['firstName', 'lastName', 'email', 'primarySkill', 'billingClass', 'updatedAt'],
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
      name: 'phoneVerified',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Has the candidate verified their phone number via OTP',
      },
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
    // Billing Class - Automatically set from primarySkill
    {
      name: 'billingClass',
      type: 'select',
      options: [
        { label: 'A - Essential (Aamel) - General Staff', value: 'A' },
        { label: 'B - Skilled (Maher) - Skilled Workers', value: 'B' },
        { label: 'C - Specialty (Teqani) - Certified Technical', value: 'C' },
        { label: 'D - Elite Specialty (Khibra) - Expert Licensed staff', value: 'D' },
        { label: 'S - Saudi Nationals', value: 'S' },
      ],
      admin: {
        description: 'Billing class automatically inherited from primary skill (A=Essential, B=Skilled, C=Specialty, D=Elite Specialty, S=Saudi Nationals)',
        readOnly: true, // Auto-populated, not manually editable
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
    // Email Verification Fields
    {
      name: 'emailVerified',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Has the candidate verified their email address',
      },
    },
    {
      name: 'emailVerificationToken',
      type: 'text',
      admin: {
        hidden: true,
      },
    },
    {
      name: 'emailVerificationExpires',
      type: 'date',
      admin: {
        hidden: true,
      },
    },
    // Password Reset Fields
    {
      name: 'passwordResetToken',
      type: 'text',
      admin: {
        hidden: true,
      },
    },
    {
      name: 'passwordResetExpires',
      type: 'date',
      admin: {
        hidden: true,
      },
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
    // Profile Picture Upload
    {
      name: 'profilePicture',
      type: 'upload',
      relationTo: 'media',
      label: 'Profile Picture',
      admin: {
        description: 'Upload your profile picture (JPG, PNG, etc.)',
      },
    },
    // Resume/CV Upload
    {
      name: 'resume',
      type: 'upload',
      relationTo: 'media',
      label: 'Resume/CV Document',
      admin: {
        description: 'Upload your resume or CV document (PDF, DOC, DOCX)',
      },
    },
    // About Me / Bio
    {
      name: 'aboutMe',
      type: 'textarea',
      label: 'About Me',
      admin: {
        description: 'Tell employers about yourself, your background, and what makes you unique',
      },
    },
    // Education
    {
      name: 'education',
      type: 'array',
      label: 'Education',
      fields: [
        {
          name: 'degree',
          type: 'text',
          label: 'Degree/Certification',
          required: true,
        },
        {
          name: 'institution',
          type: 'text',
          label: 'Institution Name',
          required: true,
        },
        {
          name: 'fieldOfStudy',
          type: 'text',
          label: 'Field of Study',
        },
        {
          name: 'graduationYear',
          type: 'number',
          label: 'Graduation Year',
        },
        {
          name: 'description',
          type: 'textarea',
          label: 'Description',
        },
      ],
    },
    // Job Preferences
    {
      name: 'jobPreferences',
      type: 'group',
      label: 'Job Preferences',
      fields: [
        {
          name: 'preferredJobTitle',
          type: 'text',
          label: 'Preferred Job Title',
        },
        {
          name: 'preferredLocation',
          type: 'text',
          label: 'Preferred Location',
        },
        {
          name: 'preferredSalary',
          type: 'text',
          label: 'Preferred Salary Range',
        },
        {
          name: 'workType',
          type: 'select',
          label: 'Work Type',
          options: [
            { label: 'Full-time', value: 'full-time' },
            { label: 'Part-time', value: 'part-time' },
            { label: 'Contract', value: 'contract' },
            { label: 'Freelance', value: 'freelance' },
            { label: 'Any', value: 'any' },
          ],
        },
        {
          name: 'shiftPreference',
          type: 'select',
          label: 'Shift Preference',
          options: [
            { label: 'Day Shift', value: 'day' },
            { label: 'Night Shift', value: 'night' },
            { label: 'Rotating', value: 'rotating' },
            { label: 'Any', value: 'any' },
          ],
        },
      ],
    },
    // Preferred Job Benefits
    {
      name: 'preferredBenefits',
      type: 'array',
      label: 'Preferred Job Benefits',
      fields: [
        {
          name: 'benefit',
          type: 'select',
          label: 'Benefit',
          required: true,
          options: [
            { label: 'Health Insurance', value: 'health_insurance' },
            { label: 'Accommodation Provided', value: 'accommodation' },
            { label: 'Transportation Provided', value: 'transportation' },
            { label: 'Annual Leave', value: 'annual_leave' },
            { label: 'End of Service Benefits', value: 'end_of_service' },
            { label: 'Training & Development', value: 'training' },
            { label: 'Performance Bonus', value: 'performance_bonus' },
            { label: 'Overtime Pay', value: 'overtime_pay' },
            { label: 'Meal Allowance', value: 'meal_allowance' },
            { label: 'Other', value: 'other' },
          ],
        },
        {
          name: 'otherBenefit',
          type: 'text',
          label: 'Other Benefit (if Other selected)',
          admin: {
            condition: (data: any) => data.benefit === 'other',
          },
        },
      ],
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
    beforeChange: [setBillingClassAndGenerateEmbedding],
    afterChange: [updateBioEmbeddingVector, revalidateCandidate],
    afterDelete: [revalidateCandidateDelete],
  },
}

