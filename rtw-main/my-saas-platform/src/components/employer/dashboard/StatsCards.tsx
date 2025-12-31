import React from 'react'
import Link from 'next/link'
import { Users, MessageSquare, UserCheck, Clock, ArrowUpRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { getEmployerStats } from '@/lib/payload/employer-dashboard'

interface StatsCardsProps {
  employerId: number
}

export async function StatsCards({ employerId }: StatsCardsProps) {
  const stats = await getEmployerStats(employerId)

  const statCards = [
    {
      icon: Users,
      value: stats.candidatesToReview.toString(),
      label: 'candidates to review',
      bgColor: 'bg-[#f9f9f9]',
      borderColor: 'border-[#cbcbcb]',
      href: '/candidates',
    },
    {
      icon: MessageSquare,
      value: stats.notificationsCount.toString(),
      label: 'Notifications',
      bgColor: 'bg-white',
      borderColor: 'border-[#ededed]',
      href: '/employer/dashboard/notifications',
    },
    {
      icon: UserCheck,
      value: stats.interviewsCount.toString(),
      label: 'Scheduled Interviews',
      bgColor: 'bg-white',
      borderColor: 'border-[#ededed]',
      href: '/employer/dashboard/interviews',
    },
    {
      icon: Clock,
      value: stats.pendingInterviewRequestsCount.toString(),
      label: 'Pending Requests',
      bgColor: stats.pendingInterviewRequestsCount > 0 ? 'bg-yellow-50' : 'bg-white',
      borderColor: stats.pendingInterviewRequestsCount > 0 ? 'border-yellow-200' : 'border-[#ededed]',
      href: '/employer/dashboard/interviews?status=pending',
    },
  ]

  return (
    <Card className="rounded-2xl bg-white p-4">
      <div className="flex flex-col gap-4 sm:flex-row">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Link
              key={index}
              href={stat.href}
              className={`relative flex flex-1 cursor-pointer items-center justify-between overflow-hidden rounded-2xl border px-4 py-6 transition-all hover:shadow-md ${stat.bgColor} ${stat.borderColor}`}
            >
              <div className="flex items-center gap-4">
                <div className="relative size-10 shrink-0">
                  <Icon className="size-10 text-[#4644b8]" />
                </div>
                <div className="flex flex-col text-[#222]">
                  <p className="text-xl font-semibold leading-normal sm:text-2xl">
                    {stat.value}
                  </p>
                  <p className="text-xs font-normal leading-normal">
                    {stat.label}
                  </p>
                </div>
              </div>
              <ArrowUpRight className="absolute right-4 top-4 size-6 shrink-0 text-[#222]" />
            </Link>
          )
        })}
      </div>
    </Card>
  )
}
