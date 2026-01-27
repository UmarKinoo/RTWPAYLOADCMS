'use client'

import React from 'react'
import { format } from 'date-fns'
import { Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Link } from '@/i18n/routing'
import type { Candidate } from '@/payload-types'
import type { ActivityItem } from '@/lib/payload/candidate-activity'
import { cn } from '@/lib/utils'

interface ActivityViewProps {
  candidate: Candidate
  activities: ActivityItem[]
}

export function ActivityView({
  candidate,
  activities: initialActivities,
}: ActivityViewProps) {
  const getStatusBadge = (status?: string) => {
    if (!status) return null

    const statusConfig: Record<string, { label: string; className: string }> = {
      scheduled: { label: 'Scheduled', className: 'bg-blue-500 text-white' },
      completed: { label: 'Completed', className: 'bg-green-500 text-white' },
      cancelled: { label: 'Cancelled', className: 'bg-gray-500 text-white' },
      rejected: { label: 'Rejected', className: 'bg-red-500 text-white' },
      pending: { label: 'Pending', className: 'bg-yellow-500 text-white' },
    }

    const config = statusConfig[status]
    if (!config) return null

    return (
      <Badge className={cn('text-xs', config.className)}>
        {config.label}
      </Badge>
    )
  }

  return (
    <div className="mt-6">
      {/* Activity List — title lives in DashboardHeader above */}
      {initialActivities.length > 0 ? (
        <div className="space-y-3">
          {initialActivities.map((activity) => (
            <Card
              key={activity.id}
              className="transition-colors border-l-4 border-l-[#4644b8] bg-white"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="text-2xl">{activity.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-base font-semibold text-[#282828]">
                          {activity.title}
                        </CardTitle>
                        {getStatusBadge(activity.status)}
                      </div>
                      <CardDescription className="mt-1 text-sm text-[#757575]">
                        {format(new Date(activity.timestamp), 'MMM d, yyyy • h:mm a')}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[#515151] leading-relaxed mb-2">
                  {activity.description}
                </p>
                {activity.employer && (
                  <p className="text-xs text-[#757575] mb-2">
                    Company: <span className="font-medium text-[#282828]">{activity.employer.companyName}</span>
                  </p>
                )}
                {activity.interview && activity.interview.jobPosition && (
                  <div className="mt-3 space-y-1">
                    {activity.interview.jobLocation && (
                      <p className="text-xs text-[#757575]">
                        Location: <span className="text-[#282828]">{activity.interview.jobLocation}</span>
                      </p>
                    )}
                    {activity.interview.salary && (
                      <p className="text-xs text-[#757575]">
                        Salary: <span className="text-[#282828]">{activity.interview.salary}</span>
                      </p>
                    )}
                    {activity.interview.meetingLink && (
                      <Link href={activity.interview.meetingLink} target="_blank" rel="noopener noreferrer">
                        <Button variant="link" className="mt-2 h-auto p-0 text-[#4644b8] text-xs">
                          Join meeting →
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Activity className="mb-4 h-12 w-12 text-[#cbcbcb]" />
            <h3 className="mb-2 text-lg font-semibold text-[#282828]">No activity</h3>
            <p className="text-sm text-[#757575]">
              Your activity history will appear here when employers interact with your profile.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

