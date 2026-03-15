'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { CalendarCheck, TrendingUp, Users, Star, AlertCircle, Plus, Settings, Lock } from 'lucide-react'
import type { Booking } from '@/lib/types'

interface OverviewData {
  todayBookings: Booking[]
  weekStats: {
    bookings: number
    revenue: number
    newCustomers: number
    avgRating: number
  }
  alerts: { id: string; message: string; type: 'warning' | 'error' }[]
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(price)

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })

function SkeletonCard() {
  return <div className="animate-pulse bg-gray-100 rounded-2xl h-28" />
}

export default function DashboardOverviewPage() {
  const params = useParams()
  const locale = params.locale as string

  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/dashboard/overview')
      .then((r) => {
        if (!r.ok) throw new Error('Fehler beim Laden')
        return r.json()
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const quickActions = [
    {
      label: 'Termin blockieren',
      icon: Lock,
      href: `/${locale}/dashboard/calendar`,
      color: '#4ECDC4',
    },
    {
      label: 'Service hinzufügen',
      icon: Plus,
      href: `/${locale}/dashboard/services`,
      color: '#4ECDC4',
    },
    {
      label: 'Einstellungen',
      icon: Settings,
      href: `/${locale}/dashboard/settings`,
      color: '#6B7280',
    },
  ]

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Übersicht</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {new Date().toLocaleDateString('de-CH', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Week stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {loading ? (
          [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
        ) : data ? (
          <>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <CalendarCheck className="w-4 h-4 text-teal-500" />
                <span className="text-xs text-gray-500">Termine</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{data.weekStats.bookings}</p>
              <p className="text-xs text-gray-400 mt-0.5">diese Woche</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-teal-500" />
                <span className="text-xs text-gray-500">Umsatz</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatPrice(data.weekStats.revenue)}</p>
              <p className="text-xs text-gray-400 mt-0.5">diese Woche</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-teal-500" />
                <span className="text-xs text-gray-500">Neukunden</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{data.weekStats.newCustomers}</p>
              <p className="text-xs text-gray-400 mt-0.5">diese Woche</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="text-xs text-gray-500">Bewertung</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{data.weekStats.avgRating.toFixed(1)}</p>
              <p className="text-xs text-gray-400 mt-0.5">Ø Bewertung</p>
            </div>
          </>
        ) : null}
      </div>

      {/* Alerts */}
      {!loading && data && data.alerts.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-700">Aktionsmeldungen</h2>
          {data.alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-start gap-3 px-4 py-3 rounded-xl text-sm"
              style={{
                backgroundColor: alert.type === 'error' ? '#FFF5F5' : '#FFF7ED',
                color: alert.type === 'error' ? '#DC2626' : '#92400E',
              }}
            >
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {alert.message}
            </div>
          ))}
        </div>
      )}

      {/* Today's bookings */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700">Heutige Termine</h2>
          <Link
            href={`/${locale}/dashboard/bookings`}
            className="text-xs font-medium hover:underline"
            style={{ color: '#4ECDC4' }}
          >
            Alle anzeigen →
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse bg-gray-100 rounded-xl h-16" />
            ))}
          </div>
        ) : data && data.todayBookings.length > 0 ? (
          <div className="space-y-2">
            {data.todayBookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-xl p-3 shadow-sm flex items-center gap-3">
                <div
                  className="w-1 self-stretch rounded-full flex-shrink-0"
                  style={{ backgroundColor: booking.status === 'confirmed' ? '#4ECDC4' : '#9CA3AF' }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {formatTime(booking.starts_at)} – {formatTime(booking.ends_at)}
                    </span>
                    {booking.is_first_visit && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: '#FFF5F5', color: '#FF6B6B' }}>
                        Neukunde
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">{formatPrice(booking.price_paid)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-6 text-center text-gray-400 text-sm shadow-sm">
            Keine Termine heute
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Schnellaktionen</h2>
        <div className="grid grid-cols-3 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link
                key={action.label}
                href={action.href}
                className="bg-white rounded-2xl p-4 shadow-sm flex flex-col items-center gap-2 hover:shadow-md transition-shadow text-center"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${action.color}22` }}
                >
                  <Icon className="w-5 h-5" style={{ color: action.color }} />
                </div>
                <span className="text-xs font-medium text-gray-700 leading-tight">{action.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
