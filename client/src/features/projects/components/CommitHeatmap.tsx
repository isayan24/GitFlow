import { useEffect, useRef } from 'react'
import CalHeatmap from 'cal-heatmap'
import Tooltip from 'cal-heatmap/plugins/Tooltip'
import 'cal-heatmap/cal-heatmap.css'
import { CalendarDays } from 'lucide-react'

interface CommitHeatmapProps {
  commitActivity: {
    id: string
    week: number
    days: number[]
    total: number
  }[]
}

export function CommitHeatmap({ commitActivity = [] }: CommitHeatmapProps) {
  const calRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!calRef.current || commitActivity.length === 0) return

    // Transform daily commit counts into flat date-value pairs for Cal-Heatmap
    const sourceData: { date: string; value: number }[] = []
    commitActivity.forEach((weekData) => {
      const startOfWeek = new Date(weekData.week * 1000)
      weekData.days.forEach((dayCount, dayIndex) => {
        const dayDate = new Date(startOfWeek)
        dayDate.setDate(startOfWeek.getDate() + dayIndex)
        
        // Format date string as YYYY-MM-DD
        const yyyy = dayDate.getFullYear()
        const mm = String(dayDate.getMonth() + 1).padStart(2, '0')
        const dd = String(dayDate.getDate()).padStart(2, '0')
        
        sourceData.push({
          date: `${yyyy}-${mm}-${dd}`,
          value: dayCount,
        })
      })
    })

    const cal = new CalHeatmap()
    cal.paint({
      itemSelector: calRef.current,
      domain: {
        type: 'month',
        gutter: 8,
        label: { text: 'MMM', position: 'top', textAlign: 'start' },
      },
      subDomain: {
        type: 'ghDay',
        radius: 2,
        width: 11,
        height: 11,
        gutter: 3,
      },
      date: {
        // Start 1 year ago to show historical graph
        start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      },
      data: {
        source: sourceData,
        x: 'date',
        y: 'value',
        groupY: 'sum',
      },
      scale: {
        color: {
          type: 'threshold',
          range: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'],
          domain: [1, 3, 6, 10],
        },
      },
      range: 12,
    }, [
      [
        Tooltip,
        {
          enabled: true,
          text: (_timestamp: number, value: number, dayjsDate: any) => {
            return `${value || 0} commits on ${dayjsDate.format('LL')}`
          },
        },
      ],
    ])

    return () => {
      cal.destroy()
    }
  }, [commitActivity])

  if (commitActivity.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 border border-dashed border-border rounded-2xl bg-card/20 text-muted-foreground text-xs text-center">
        <span>No commit activity statistics cached. Commit calendar will populate once statistics are compiled by GitHub.</span>
      </div>
    )
  }

  return (
    <div className="p-6 rounded-2xl border border-border bg-card/40 backdrop-blur-sm flex flex-col gap-4 text-left overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays size={16} className="text-primary" />
          <div>
            <h4 className="text-sm font-bold text-foreground">Repository Contribution Calendar</h4>
            <p className="text-muted-foreground text-[10px] mt-0.5">Standalone development activity heatmap powered by Cal-Heatmap.</p>
          </div>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span>Less</span>
          <div className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: '#161b22' }} />
          <div className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: '#0e4429' }} />
          <div className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: '#006d32' }} />
          <div className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: '#26a641' }} />
          <div className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: '#39d353' }} />
          <span>More</span>
        </div>
      </div>

      <div className="overflow-x-auto no-scrollbar py-2">
        <div ref={calRef} id="cal-heatmap" className="cal-heatmap-dark" />
      </div>
    </div>
  )
}
