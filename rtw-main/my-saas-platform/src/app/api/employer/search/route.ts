import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUserType } from '@/lib/currentUserType'

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })

    // Get current user type
    const userType = await getCurrentUserType()

    if (!userType) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Allow admin or employer
    let employerId: number
    if (userType.kind === 'admin') {
      // Admin can search, but we need an employer ID for tracking interactions
      // For now, return error - you may want to handle admin search differently
      return NextResponse.json({ error: 'Admin search not yet supported' }, { status: 403 })
    } else if (userType.kind === 'employer') {
      employerId = userType.employer.id
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const { query, limit = 20 } = body

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    // Search candidates by name, job title, or skills
    const candidates = await payload.find({
      collection: 'candidates',
      where: {
        and: [
          {
            termsAccepted: {
              equals: true,
            },
          },
          {
            or: [
              {
                firstName: {
                  contains: query,
                },
              },
              {
                lastName: {
                  contains: query,
                },
              },
              {
                jobTitle: {
                  contains: query,
                },
              },
            ],
          },
        ],
      },
      limit,
      depth: 1,
      overrideAccess: true,
    })

    // Track view interaction for each candidate
    for (const candidate of candidates.docs) {
      try {
        await payload.create({
          collection: 'candidate-interactions',
          data: {
            employer: employerId,
            candidate: candidate.id,
            interactionType: 'view',
            metadata: {
              source: 'dashboard_search',
              query,
            },
          },
        })
      } catch (error) {
        // Ignore duplicate interaction errors
        console.warn('Failed to track interaction:', error)
      }
    }

    return NextResponse.json({
      candidates: candidates.docs.map((candidate) => ({
        id: candidate.id,
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        jobTitle: candidate.jobTitle,
        location: candidate.location,
        experienceYears: candidate.experienceYears,
        profilePicture:
          candidate.profilePicture && typeof candidate.profilePicture === 'object'
            ? candidate.profilePicture.url
            : null,
      })),
      total: candidates.totalDocs,
    })
  } catch (error: any) {
    console.error('Search error:', error)
    return NextResponse.json({ error: error.message || 'Search failed' }, { status: 500 })
  }
}



