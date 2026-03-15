'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { ChevronLeft, ChevronRight, Calendar, AlertCircle } from 'lucide-react'
import SlotEditor from '@/components/dashboard/SlotEditor'
import type { StaffMember } from '@/lib/types'

interface CalendarSlot {
  id: string
  starts_at: string
  ends_at: string
  status: 'available' | 'booked' | 'blocked'
  staff_member_id: string | null
  booking_id: string | null
  customer_name?: string
}

function addDays(date: Date, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function getWeekStart(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function isoDate(date: Date) {
  return date.toISOString().split('T')[0]
}

const HOUR_START = 8
const HOUR_END = 20
const HOURS = Array.from({ length: (HOUR_END - HOUR_START) * 2 }, (_, i) => {
  const h = HOUR_START + Math.floor(i / 2)
  const m = i % 2 === 0 ? '00' : '30'
  return `${String(h).padStart(2, '0')}:${m}`
})

const DAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

export default function CalendarPage() {
  const params = useParams()
  const locale = params.locale as string

  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))
  const [activeStaff, setActiveStaff] = useState<string>('all')
  const [slots, setSlots] = useState<CalendarSlot[]>([])
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [slotEditorOpen, setSlotEditorOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | undefined>()
  const [selectedSlot, setSelectedSlot] = useState<CalendarSlot | null>(null)

  const salonId = typeof window !== 'undefined' ? localStorage.getItem('solen_salon_id') ?? '' : ''

  useEffect(() => {
    fetch('/api/staff')
      .then((r) => r.json())
      .then((data) => setStaffMembers(data.items ?? data ?? []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    setError(null)
    const qs = new URLSearchParams({
      week_start: isoDate(weekStart),
      staff: activeStaff,
    })
    fetch(`/api/calendar/week?${qs}`)
      .then((r) => {
        if (!r.ok) throw new Error('Fehler beim Laden')
        return r.json()
      })
      .then((data) => setSlots(data.slots ?? data ?? []))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Fehler'))
      .finally(() => setLoading(false))
  }, [weekStart, activeStaff])

  const prevWeek = () => setWeekStart((w) => addDays(w, -7))
  const nextWeek = () => setWeekStart((w) => addDays(w, 7))
  const goToday = () => setWeekStart(getWeekStart(new Date()))

  const getSlotForCell = (dayIndex: number, time: string): CalendarSlot | undefined => {
    const cellDate = addDays(weekStart, dayIndex)
    const dateStr = isoDate(cellDate)
    const [hStr, mStr] = time.split(':')
    const cellMinutes = parseInt(hStr) * 60 + parseInt(mStr)
    return slots.find((s) => {
      const slotDate = s.starts_at.split('T')[0]
      if (slotDate !== dateStr) return false
      const [sh, sm] = s.starts_at.split('T')[1].split(':').map(Number)
      const [eh, em] = s.ends_at.split('T')[1].split(':').map(Number)
      const slotStart = sh * 60 + sm
      const slotEnd = eh * 60 + em
      return cellMinutes >= slotStart && cellMinutes < slotEnd
    })
  }

  const handleCellClick = (dayIndex: number, time: string) => {
    const cellDate = addDays(weekStart, dayIndex)
    setSelectedDate(isoDate(cellDate))
    setSelectedSlot(null)
    setSlotEditorOpen(true)
  }

  const handleSlotClick = (slot: CalendarSlot, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedSlot(slot)
  }

  const handleSaveSlot = async (data: {
    staffId: string; date: string; startTime: string; endTime: string;
    blockType: string; applyToWeek: boolean; weekDays: string[]
  }) => {
    try {
      await fetch('/api/calendar/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, salon_id: salonId }),
      })
      // Refresh
      const qs = new URLSearchParams({ week_start: isoDate(weekStart), staff: activeStaff })
      const res = await fetch(`/api/calendar/week?${qs}`)
      if (res.ok) {
        const d = await res.json()
        setSlots(d.slots ?? d ?? [])
      }
    } catch {
      alert('Fehler beim Speichern')
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-full space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <h1 className="text-xl font-bold text-gray-900">Kalender</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={prevWeek}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={goToday}
            className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Heute
          </button>
          <button
            onClick={nextWeek}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
          <span className="text-sm text-gray-600 font-medium">
            {weekStart.toLocaleDateString('de-CH', { day: 'numeric', month: 'short' })} –{' '}
            {addDays(weekStart, 6).toLocaleDateString('de-CH', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
        <button
          onClick={() => { setSelectedDate(undefined); setSlotEditorOpen(true) }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-xl"
          style={{ backgroundColor: '#4ECDC4' }}
        >
          <Calendar className="w-4 h-4" />
          Wochenplan erstellen
        </button>
      </div>

      {/* Staff tabs */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setActiveStaff('all')}
          className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
            activeStaff === 'all' ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          style={activeStaff === 'all' ? { backgroundColor: '#4ECDC4' } : {}}
        >
          Alle
        </button>
        {staffMembers.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveStaff(s.id)}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
              activeStaff === s.id ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            style={activeStaff === s.id ? { backgroundColor: '#4ECDC4' } : {}}
          >
            {s.name}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Calendar grid */}
      <div className="bg-white rounded-2xl shadow-sm overflow-auto">
        <div className="min-w-[600px]">
          {/* Day headers */}
          <div className="grid sticky top-0 bg-white z-10 border-b border-gray-100" style={{ gridTemplateColumns: '60px repeat(7, 1fr)' }}>
            <div className="border-r border-gray-100" />
            {DAY_LABELS.map((label, i) => {
              const day = addDays(weekStart, i)
              const isToday = isoDate(day) === isoDate(new Date())
              return (
                <div key={label} className={`p-2 text-center border-r border-gray-100 last:border-r-0 ${isToday ? 'bg-teal-50' : ''}`}>
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className={`text-sm font-semibold ${isToday ? 'text-teal-600' : 'text-gray-800'}`}>
                    {day.getDate()}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Time rows */}
          {loading ? (
            <div className="animate-pulse p-6 space-y-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-8 bg-gray-100 rounded" />
              ))}
            </div>
          ) : (
            <div>
              {HOURS.map((time) => (
                <div
                  key={time}
                  className="grid border-b border-gray-50 last:border-b-0"
                  style={{ gridTemplateColumns: '60px repeat(7, 1fr)', minHeight: '32px' }}
                >
                  <div className="px-2 py-0.5 text-right border-r border-gray-100">
                    {time.endsWith(':00') && (
                      <span className="text-xs text-gray-400">{time}</span>
                    )}
                  </div>
                  {[...Array(7)].map((_, dayIndex) => {
                    const slot = getSlotForCell(dayIndex, time)
                    const cellDate = addDays(weekStart, dayIndex)
                    return (
                      <div
                        key={dayIndex}
                        className="border-r border-gray-100 last:border-r-0 relative cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => !slot && handleCellClick(dayIndex, time)}
                      >
                        {slot && (
                          <div
                            onClick={(e) => handleSlotClick(slot, e)}
                            className="absolute inset-x-0.5 inset-y-0 rounded text-xs px-1 py-0.5 flex items-center overflow-hidden cursor-pointer z-10"
                            style={{
                              backgroundColor:
                                slot.status === 'available' ? '#4ECDC422' :
                                slot.status === 'booked' ? '#1A1A2E' :
                                'repeating-linear-gradient(45deg, #f3f4f6, #f3f4f6 4px, #e5e7eb 4px, #e5e7eb 8px)',
                              color: slot.status === 'booked' ? 'white' : '#374151',
                            }}
                          >
                            {slot.status === 'booked' && slot.customer_name && (
                              <span className="truncate">{slot.customer_name}</span>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Slot detail modal */}
      {selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/50" onClick={() => setSelectedSlot(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="font-semibold text-gray-900 mb-2">
              {selectedSlot.status === 'booked' ? 'Buchungsdetails' :
               selectedSlot.status === 'blocked' ? 'Blockierter Slot' : 'Verfügbarer Slot'}
            </h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p><span className="text-gray-400">Von:</span> {new Date(selectedSlot.starts_at).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}</p>
              <p><span className="text-gray-400">Bis:</span> {new Date(selectedSlot.ends_at).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}</p>
              {selectedSlot.customer_name && <p><span className="text-gray-400">Kunde:</span> {selectedSlot.customer_name}</p>}
            </div>
            <button
              onClick={() => setSelectedSlot(null)}
              className="mt-4 w-full py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200"
            >
              Schließen
            </button>
          </div>
        </div>
      )}

      <SlotEditor
        isOpen={slotEditorOpen}
        onClose={() => setSlotEditorOpen(false)}
        onSave={handleSaveSlot}
        initialDate={selectedDate}
        salonId={salonId}
        staffMembers={staffMembers.map((s) => ({ id: s.id, name: s.name }))}
      />
    </div>
  )
}
