'use client'

// Requires: pnpm add recharts

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { AlertCircle, TrendingUp, TrendingDown, Star } from 'lucide-react'

// Dynamic imports for recharts (ssr: false)
const DynamicResponsiveContainer = dynamic(
  () => import('recharts').then((m) => m.ResponsiveContainer),
  { ssr: false }
)
const DynamicLineChart = dynamic(
  () => import('recharts').then((m) => m.LineChart),
  { ssr: false }
)
const DynamicBarChart = dynamic(
  () => import('recharts').then((m) => m.BarChart),
  { ssr: false }
)
const DynamicPieChart = dynamic(
  () => import('recharts').then((m) => m.PieChart),
  { ssr: false }
)
const DynamicLine = dynamic(() => import('recharts').then((m) => m.Line), { ssr: false })
const DynamicBar = dynamic(() => import('recharts').then((m) => m.Bar), { ssr: false })
const DynamicPie = dynamic(() => import('recharts').then((m) => m.Pie), { ssr: false })
const DynamicCell = dynamic(() => import('recharts').then((m) => m.Cell), { ssr: false })
const DynamicXAxis = dynamic(() => import('recharts').then((m) => m.XAxis), { ssr: false })
const DynamicYAxis = dynamic(() => import('recharts').then((m) => m.YAxis), { ssr: false })
const DynamicTooltip = dynamic(() => import('recharts').then((m) => m.Tooltip), { ssr: false })
const DynamicCartesianGrid = dynamic(() => import('recharts').then((m) => m.CartesianGrid), { ssr: false })
const DynamicLegend = dynamic(() => import('recharts').then((m) => m.Legend), { ssr: false })

interface AnalyticsData {
  bookingsOverTime: { date: string; count: number }[]
  weeklyRevenue: { week: string; revenue: number }[]
  topServices: { name: string; count: number }[]
  customerTypes: { name: string; value: number }[]
  cancellationRate: number
  avgRating: number
  ratingTrend: 'up' | 'down' | 'stable'
  lastMinutePerformance: { week: string; booked: number; expired: number }[]
}

const DAYS = [7, 30, 90]
const formatPrice = (p: number) =>
  new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(p)

function SkeletonChart() {
  return <div className="animate-pulse bg-gray-100 rounded-2xl h-64" />
}

export default function AnalyticsPage() {
  const params = useParams()
  const [days, setDays] = useState(30)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch(`/api/analytics?days=${days}`)
      .then((r) => { if (!r.ok) throw new Error('Fehler beim Laden'); return r.json() })
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Fehler'))
      .finally(() => setLoading(false))
  }, [days])

  const PIE_COLORS = ['#4ECDC4', '#1A1A2E']

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Statistiken</h1>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {DAYS.map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
                days === d ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {d} Tage
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Stornierungsrate</p>
          {loading ? (
            <div className="animate-pulse bg-gray-100 h-8 w-16 rounded" />
          ) : (
            <p className="text-2xl font-bold" style={{ color: (data?.cancellationRate ?? 0) > 20 ? '#FF6B6B' : '#4ECDC4' }}>
              {data?.cancellationRate ?? 0}%
            </p>
          )}
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Ø Bewertung</p>
          {loading ? (
            <div className="animate-pulse bg-gray-100 h-8 w-16 rounded" />
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-gray-900">{data?.avgRating.toFixed(1) ?? '–'}</p>
              {data?.ratingTrend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
              {data?.ratingTrend === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
              <Star className="w-4 h-4 text-yellow-400" />
            </div>
          )}
        </div>
      </div>

      {/* Bookings over time */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Buchungen über Zeit</h2>
        {loading ? <SkeletonChart /> : (
          <div className="h-56">
            <DynamicResponsiveContainer width="100%" height="100%">
              <DynamicLineChart data={data?.bookingsOverTime ?? []}>
                <DynamicCartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <DynamicXAxis dataKey="date" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                <DynamicYAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                <DynamicTooltip />
                <DynamicLine type="monotone" dataKey="count" stroke="#4ECDC4" strokeWidth={2} dot={false} />
              </DynamicLineChart>
            </DynamicResponsiveContainer>
          </div>
        )}
      </div>

      {/* Weekly revenue */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Wöchentlicher Umsatz</h2>
        {loading ? <SkeletonChart /> : (
          <div className="h-56">
            <DynamicResponsiveContainer width="100%" height="100%">
              <DynamicBarChart data={data?.weeklyRevenue ?? []}>
                <DynamicCartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <DynamicXAxis dataKey="week" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                <DynamicYAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} tickFormatter={(v) => `${v}`} />
                <DynamicTooltip formatter={(v: number) => formatPrice(v)} />
                <DynamicBar dataKey="revenue" fill="#4ECDC4" radius={[4, 4, 0, 0]} />
              </DynamicBarChart>
            </DynamicResponsiveContainer>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Top services */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Top Services</h2>
          {loading ? <SkeletonChart /> : (
            <div className="h-48">
              <DynamicResponsiveContainer width="100%" height="100%">
                <DynamicBarChart data={data?.topServices ?? []} layout="vertical">
                  <DynamicXAxis type="number" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                  <DynamicYAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#9CA3AF' }} width={80} />
                  <DynamicTooltip />
                  <DynamicBar dataKey="count" fill="#1A1A2E" radius={[0, 4, 4, 0]} />
                </DynamicBarChart>
              </DynamicResponsiveContainer>
            </div>
          )}
        </div>

        {/* New vs returning */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Neukunden vs. Stammkunden</h2>
          {loading ? <SkeletonChart /> : (
            <div className="h-48 flex items-center justify-center">
              <DynamicResponsiveContainer width="100%" height="100%">
                <DynamicPieChart>
                  <DynamicPie
                    data={data?.customerTypes ?? []}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {(data?.customerTypes ?? []).map((_, index) => (
                      <DynamicCell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </DynamicPie>
                  <DynamicTooltip />
                </DynamicPieChart>
              </DynamicResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Last-Minute performance */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Last-Minute Performance</h2>
        {loading ? <SkeletonChart /> : (
          <div className="h-56">
            <DynamicResponsiveContainer width="100%" height="100%">
              <DynamicBarChart data={data?.lastMinutePerformance ?? []}>
                <DynamicCartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <DynamicXAxis dataKey="week" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                <DynamicYAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                <DynamicTooltip />
                <DynamicLegend />
                <DynamicBar dataKey="booked" name="Gebucht" fill="#4ECDC4" radius={[4, 4, 0, 0]} />
                <DynamicBar dataKey="expired" name="Abgelaufen" fill="#FF6B6B" radius={[4, 4, 0, 0]} />
              </DynamicBarChart>
            </DynamicResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
