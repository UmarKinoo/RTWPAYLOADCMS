'use client'

import React, { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FolderOpen, Eye, FileText, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StatisticsDataPoint } from '@/lib/payload/employer-dashboard'

interface StatisticsChartProps {
  employerId: number
  initialData: StatisticsDataPoint[]
  initialPeriod: 'week' | 'month' | 'year'
}

export function StatisticsChart({
  employerId,
  initialData,
  initialPeriod,
}: StatisticsChartProps) {
  const t = useTranslations('employerDashboard.statisticsChart')
  const timePeriodKeys = ['week', 'month', 'year'] as const
  const [selectedPeriodKey, setSelectedPeriodKey] = useState<'week' | 'month' | 'year'>(initialPeriod)
  const [chartData, setChartData] = useState<StatisticsDataPoint[]>(initialData)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/employer/statistics?employerId=${employerId}&period=${selectedPeriodKey}`)
        if (response.ok) {
          const data = await response.json()
          setChartData(data)
        }
      } catch (error) {
        console.error('Failed to fetch statistics:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (selectedPeriodKey !== initialPeriod) {
      fetchData()
    }
  }, [selectedPeriodKey, employerId, initialPeriod])

  // Chart area height in px (must match h-40 = 10rem = 160px) for reliable bar heights
  const CHART_HEIGHT_PX = 160
  // Calculate max value for scaling (ensure at least 1 so we don't divide by zero)
  const maxValue = Math.max(
    ...chartData.map((d) => Math.max(d.views, d.interviewed, d.declined)),
    1,
  )
  const hasAnyData = chartData.some((d) => d.views > 0 || d.interviewed > 0 || d.declined > 0)
  // Convert value to pixel bar height with minimum 4px so bars are always visible
  const toBarHeight = (value: number) =>
    maxValue > 0 ? Math.max(4, (value / maxValue) * CHART_HEIGHT_PX) : 4

  // Calculate stats for current period
  const totalViews = chartData.reduce((sum, d) => sum + d.views, 0)
  const totalInterviewed = chartData.reduce((sum, d) => sum + d.interviewed, 0)
  const totalDeclined = chartData.reduce((sum, d) => sum + d.declined, 0)

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    if (selectedPeriodKey === 'week') {
      return date.toLocaleDateString('en-US', { weekday: 'short' })
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const statsCards = [
    {
      icon: FolderOpen,
      labelKey: 'opened' as const,
      value: totalViews.toString(),
      change: '+0',
      trend: 'up' as const,
      periodKey: selectedPeriodKey,
    },
    {
      icon: Eye,
      labelKey: 'views' as const,
      value: totalViews.toString(),
      change: '+0',
      trend: 'up' as const,
      periodKey: selectedPeriodKey,
    },
    {
      icon: FileText,
      labelKey: 'interviewed' as const,
      value: totalInterviewed.toString(),
      change: '+0',
      trend: 'up' as const,
      periodKey: selectedPeriodKey,
    },
  ]

  return (
    <Card className="rounded-2xl bg-white p-4 sm:p-6">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-semibold text-[#222] sm:text-lg">
            {t('title')}
          </h3>
          <p className="text-xs font-normal text-[#757575]">
            {t('showingFor', { period: t(selectedPeriodKey) })}
          </p>
        </div>

        {/* Time Period Selector */}
        <div className="flex h-8 overflow-hidden rounded-lg border border-[#cbcbcb]">
          {timePeriodKeys.map((periodKey) => (
            <button
              key={periodKey}
              onClick={() => setSelectedPeriodKey(periodKey)}
              disabled={isLoading}
              className={cn(
                'h-8 flex-1 px-4 py-1.5 text-sm font-medium transition-colors sm:flex-none',
                selectedPeriodKey === periodKey
                  ? 'bg-[#4644b8] text-white'
                  : 'text-[#757575] hover:bg-[#f4f4f4]',
                isLoading && 'opacity-50 cursor-not-allowed',
              )}
            >
              {t(periodKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Chart and Stats */}
      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Chart Section */}
        <div className="flex flex-1 flex-col gap-2">
          {/* Statistics Title */}
          <p className="text-base font-semibold text-[#222]">{t('statistics')}</p>

          {/* Legend */}
          <div className="mb-2 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="size-2 rounded bg-[#4644b8]" />
              <span className="text-xs font-normal text-[#757575]">{t('candidateViews')}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="size-2 rounded bg-[#6eabff]" />
              <span className="text-xs font-normal text-[#757575]">{t('candidateInterviewed')}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="size-2 rounded bg-[#d8e530]" />
              <span className="text-xs font-normal text-[#757575]">{t('candidateDeclined')}</span>
            </div>
          </div>

          {/* Chart */}
          <div className="flex h-40 items-end gap-2">
            {/* Y-axis labels - use whole numbers when maxValue < 1000 */}
            <div className="flex h-full flex-shrink-0 flex-col justify-between text-xs font-normal text-[#515151]">
              {maxValue >= 1000 ? (
                <>
                  <span>{Math.ceil(maxValue / 1000)}k</span>
                  <span>{Math.ceil((maxValue * 0.75) / 1000)}k</span>
                  <span>{Math.ceil((maxValue * 0.5) / 1000)}k</span>
                  <span>{Math.ceil((maxValue * 0.25) / 1000)}k</span>
                </>
              ) : (
                <>
                  <span>{Math.ceil(maxValue)}</span>
                  <span>{Math.ceil(maxValue * 0.75)}</span>
                  <span>{Math.ceil(maxValue * 0.5)}</span>
                  <span>{Math.ceil(maxValue * 0.25)}</span>
                </>
              )}
              <span>0</span>
            </div>

            {/* Chart bars */}
            <div className="flex flex-1 items-end gap-1 min-w-0">
              {chartData.length > 0 ? (
                chartData.map((data, index) => {
                  const viewsH = toBarHeight(data.views)
                  const interviewedH = toBarHeight(data.interviewed)
                  const declinedH = toBarHeight(data.declined)
                  return (
                    <div key={index} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                      <div
                        className="flex w-full min-w-0 items-end justify-center gap-1"
                        style={{ height: CHART_HEIGHT_PX }}
                      >
                        {/* Views bar */}
                        <div
                          className="min-w-[6px] w-2 flex-shrink-0 rounded-t bg-[#4644b8] transition-all"
                          style={{ height: viewsH }}
                        />
                        {/* Interviewed bar */}
                        <div
                          className="min-w-[6px] w-2 flex-shrink-0 rounded-t bg-[#6eabff] transition-all"
                          style={{ height: interviewedH }}
                        />
                        {/* Declined bar */}
                        <div
                          className="min-w-[6px] w-2 flex-shrink-0 rounded-t bg-[#d8e530] transition-all"
                          style={{ height: declinedH }}
                        />
                      </div>
                      <span className="truncate text-xs font-normal text-[#a5a5a5] max-w-full">
                        {formatDate(data.date)}
                      </span>
                    </div>
                  )
                })
              ) : (
                <div className="flex flex-1 items-center justify-center text-sm text-[#757575]">
                  {t('noDataAvailable')}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="flex flex-row gap-2 sm:flex-col lg:w-[157px]">
          {statsCards.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div
                key={index}
                className="flex flex-1 flex-col gap-2 rounded-lg border border-[#f4f4f4] bg-white p-3 sm:flex-none sm:p-4"
              >
                <Icon className="size-6 text-[#757575]" />
                <div className="flex items-center justify-between">
                  <div className="flex gap-0.5">
                    <span className="text-[10px] font-normal text-[#757575]">{t('candidate')}</span>
                    <span className="text-[10px] font-normal text-[#757575]">{t(stat.labelKey)}</span>
                  </div>
                  <span className="text-sm font-semibold text-[#353535]">{stat.value}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-normal text-[#a5a5a5]">{t('thisPeriod', { period: t(stat.periodKey) })}</span>
                  <div className="flex items-center gap-0.5">
                    {stat.trend === 'up' ? (
                      <>
                        <TrendingUp className="size-2 text-[#009e00]" />
                        <span className="text-xs font-medium text-[#009e00]">{stat.change}</span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="size-2 text-[#dc0000]" />
                        <span className="text-xs font-medium text-[#dc0000]">{stat.change}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
