"use client"

import { Calendar, dateFnsLocalizer } from "react-big-calendar"
import { format, parse, startOfWeek, getDay } from "date-fns"
import { ja } from "date-fns/locale"
import "react-big-calendar/lib/css/react-big-calendar.css"
import { useState } from "react"

const locales = {
  ja: ja,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

interface TaskEvent {
  id: string
  title: string
  start: Date
  end: Date
  status: string
  facilityType: string
  daysUntilDue: number
}

interface TaskCalendarProps {
  tasks: Array<{
    id: string
    name: string
    dueDate: string
    status: string
    facilityType: string
    daysUntilDue: number
  }>
  onSelectEvent?: (event: TaskEvent) => void
}

export function TaskCalendar({ tasks, onSelectEvent }: TaskCalendarProps) {
  const [view, setView] = useState<"month" | "week" | "day" | "agenda">("month")

  // タスクをカレンダーイベントに変換
  const events: TaskEvent[] = tasks.map((task) => {
    const dueDate = new Date(task.dueDate)
    return {
      id: task.id,
      title: task.name,
      start: dueDate,
      end: dueDate,
      status: task.status,
      facilityType: task.facilityType,
      daysUntilDue: task.daysUntilDue,
    }
  })

  // イベントのスタイルをカスタマイズ
  const eventStyleGetter = (event: TaskEvent) => {
    let backgroundColor = "#3b82f6" // デフォルト: 青

    if (event.status === "COMPLETED") {
      backgroundColor = "#10b981" // 緑
    } else if (event.daysUntilDue < 0) {
      backgroundColor = "#ef4444" // 赤（期限超過）
    } else if (event.daysUntilDue <= 7) {
      backgroundColor = "#f59e0b" // オレンジ（期限間近）
    } else if (event.status === "IN_PROGRESS") {
      backgroundColor = "#3b82f6" // 青（進行中）
    } else {
      backgroundColor = "#6b7280" // グレー（未着手）
    }

    return {
      style: {
        backgroundColor,
        borderRadius: "4px",
        opacity: 0.9,
        color: "white",
        border: "none",
        display: "block",
        fontSize: "12px",
        padding: "2px 4px",
      },
    }
  }

  // カスタムメッセージ
  const messages = {
    allDay: "終日",
    previous: "前",
    next: "次",
    today: "今日",
    month: "月",
    week: "週",
    day: "日",
    agenda: "予定",
    date: "日付",
    time: "時間",
    event: "イベント",
    noEventsInRange: "この期間にタスクはありません",
    showMore: (total: number) => `+${total} 件`,
  }

  return (
    <div className="task-calendar" style={{ height: "600px" }}>
      <style jsx global>{`
        .rbc-calendar {
          font-family: inherit;
        }
        .rbc-header {
          padding: 8px 3px;
          font-weight: 600;
          background: #f3f4f6;
          border-bottom: 2px solid #d1d5db;
        }
        .rbc-today {
          background-color: #dbeafe;
        }
        .rbc-off-range-bg {
          background: #f9fafb;
        }
        .rbc-event {
          cursor: pointer;
        }
        .rbc-event:hover {
          opacity: 1 !important;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        .rbc-toolbar {
          padding: 12px 0;
          margin-bottom: 16px;
          flex-wrap: wrap;
          gap: 8px;
        }
        .rbc-toolbar button {
          color: #374151;
          border: 1px solid #d1d5db;
          padding: 6px 12px;
          border-radius: 6px;
          background: white;
          transition: all 0.2s;
        }
        .rbc-toolbar button:hover {
          background: #f3f4f6;
          border-color: #9ca3af;
        }
        .rbc-toolbar button.rbc-active {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }
        .rbc-month-view {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }
        .rbc-day-bg {
          border-left: 1px solid #e5e7eb;
        }
        .rbc-month-row {
          border-top: 1px solid #e5e7eb;
          min-height: 80px;
        }
      `}</style>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: "100%" }}
        eventPropGetter={eventStyleGetter}
        onSelectEvent={onSelectEvent}
        messages={messages}
        view={view}
        onView={(newView) => setView(newView as any)}
        culture="ja"
      />
    </div>
  )
}
