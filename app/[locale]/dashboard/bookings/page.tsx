'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Search, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react'
import BookingCard from '@/components/dashboard/BookingCard'
import type { Booking, BookingStatus } from '@/lib/types'

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Alle' },
  { value: 'confirmed', label: 'Bestätigt' },
  { value: 'cancelled', label: 'Storniert' },
  { value: 'completed', label: 'Abgeschlossen' },
  { value: 'no_show', label: 'Nicht erschienen' },
]

const PAGE_SIZE = 25

export default function BookingsPage() {
  const params = useParams()
  const locale = params.locale as string

  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const qs = new URLSearchParams()
      if (statusFilter) qs.set('status', statusFilter)
      if (dateFilter) qs.set('date', dateFilter)
      if (search) qs.set('search', search)
      qs.set('page', String(page))
      qs.set('limit', String(PAGE_SIZE))

      const res = await fetch(`/api/bookings?${qs}`)
      if (!res.ok) throw new Error('Fehler beim Laden')
      const data = await res.json()
      setBookings(data.items ?? data ?? [])
      setTotal(data.total ?? (data.items ?? data ?? []).length)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unbekannter Fehler')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, dateFilter, search, page])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  const updateBookingStatus = async (id: string, status: BookingStatus, cancellationReason?: string) => {
    try {
      const body: Record<string, unknown> = { status }
      if (cancellationReason) body.cancellation_reason = cancellationReason
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Fehler beim Aktualisieren')
      setBookings((prev) =>
        prev.map((b) =>
          b.id === id ? { ...b, status, cancellation_reason: cancellationReason ?? b.cancellation_reason } : b
        )
      )
    } catch {
      alert('Fehler beim Aktualisieren des Termins')
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Termine</h1>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(0) }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <input
          type="date"
          value={dateFilter}
          onChange={(e) => { setDateFilter(e.target.value); setPage(0) }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white"
        />

        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Suchen..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Booking list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-100 rounded-xl h-24" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center text-gray-400 shadow-sm">
          Keine Termine gefunden
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onMarkCompleted={(id) => updateBookingStatus(id, 'completed')}
              onMarkNoShow={(id) => updateBookingStatus(id, 'no_show')}
              onCancel={(id, reason) => updateBookingStatus(id, 'cancelled', reason)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-gray-500">
            Seite {page + 1} von {totalPages} · {total} Termine gesamt
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              Zurück
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Weiter
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
