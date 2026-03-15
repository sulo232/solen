'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { AlertCircle, CheckCircle, Plus, Trash2, Shield } from 'lucide-react'
import type { Salon, SalonCategory, Quartier } from '@/lib/types'

const CATEGORIES: { value: SalonCategory; label: string }[] = [
  { value: 'coiffeur', label: 'Coiffeur' },
  { value: 'barbershop', label: 'Barbershop' },
  { value: 'nails', label: 'Nails' },
  { value: 'spa', label: 'Spa' },
  { value: 'makeup', label: 'Make-up' },
  { value: 'waxing', label: 'Waxing' },
]

const DAYS = [
  { key: 'mon' as const, label: 'Montag' },
  { key: 'tue' as const, label: 'Dienstag' },
  { key: 'wed' as const, label: 'Mittwoch' },
  { key: 'thu' as const, label: 'Donnerstag' },
  { key: 'fri' as const, label: 'Freitag' },
  { key: 'sat' as const, label: 'Samstag' },
  { key: 'sun' as const, label: 'Sonntag' },
]

const SECTIONS = [
  { id: 'profil', label: 'Profil' },
  { id: 'lastminute', label: 'Last-Minute' },
  { id: 'schnellantworten', label: 'Schnellantworten' },
  { id: 'verifizierung', label: 'Verifizierung' },
  { id: 'stornierung', label: 'Stornierungspolitik' },
]

type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

interface OpeningHourState {
  open: boolean
  from: string
  to: string
}

export default function SettingsPage() {
  const params = useParams()
  const locale = params.locale as string

  const [salon, setSalon] = useState<Salon | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState('profil')
  const [verifying, setVerifying] = useState(false)
  const [verifySuccess, setVerifySuccess] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [descDe, setDescDe] = useState('')
  const [descEn, setDescEn] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [instagram, setInstagram] = useState('')
  const [coverPhoto, setCoverPhoto] = useState('')
  const [categories, setCategories] = useState<SalonCategory[]>([])
  const [hours, setHours] = useState<Record<DayKey, OpeningHourState>>({
    mon: { open: true, from: '09:00', to: '18:00' },
    tue: { open: true, from: '09:00', to: '18:00' },
    wed: { open: true, from: '09:00', to: '18:00' },
    thu: { open: true, from: '09:00', to: '18:00' },
    fri: { open: true, from: '09:00', to: '18:00' },
    sat: { open: true, from: '09:00', to: '17:00' },
    sun: { open: false, from: '10:00', to: '16:00' },
  })

  // Last-minute
  const [lmEnabled, setLmEnabled] = useState(false)
  const [lmDiscount, setLmDiscount] = useState(20)
  const [lmHours, setLmHours] = useState(6)

  // Quick replies
  const [quickReplies, setQuickReplies] = useState<string[]>([])
  const [newReply, setNewReply] = useState('')

  useEffect(() => {
    fetch('/api/salons/me')
      .then((r) => { if (!r.ok) throw new Error('Fehler'); return r.json() })
      .then((data: Salon) => {
        setSalon(data)
        setName(data.name)
        setDescDe(data.description_de ?? '')
        setDescEn(data.description_en ?? '')
        setAddress(data.address)
        setPhone(data.phone ?? '')
        setInstagram(data.instagram_url ?? '')
        setCoverPhoto(data.cover_photo_url ?? '')
        setCategories(data.categories)
        setLmEnabled(data.last_minute_discount_percent > 0)
        setLmDiscount(data.last_minute_discount_percent || 20)
        setLmHours(data.last_minute_window_hours || 6)
        if (data.opening_hours) {
          const h = { ...hours }
          DAYS.forEach(({ key }) => {
            const oh = data.opening_hours[key]
            h[key] = oh
              ? { open: true, from: oh.open, to: oh.close }
              : { open: false, from: '09:00', to: '18:00' }
          })
          setHours(h)
        }
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Fehler'))
      .finally(() => setLoading(false))
  }, [])

  const toggleCategory = (cat: SalonCategory) => {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    )
  }

  const handleSave = async () => {
    if (!salon) return
    setSaving(true)
    setError(null)
    setSaved(false)
    const opening_hours = Object.fromEntries(
      DAYS.map(({ key }) => [
        key,
        hours[key].open ? { open: hours[key].from, close: hours[key].to } : null,
      ])
    )
    try {
      const res = await fetch(`/api/salons/${salon.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, description_de: descDe, description_en: descEn,
          address, phone: phone || null, instagram_url: instagram || null,
          cover_photo_url: coverPhoto || null, categories, opening_hours,
          last_minute_discount_percent: lmEnabled ? lmDiscount : 0,
          last_minute_window_hours: lmHours,
        }),
      })
      if (!res.ok) throw new Error('Fehler beim Speichern')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Fehler')
    } finally {
      setSaving(false)
    }
  }

  const handleVerify = async () => {
    if (!salon) return
    setVerifying(true)
    try {
      await fetch('/api/salons/verify', { method: 'POST' })
      setVerifySuccess(true)
    } catch {}
    finally { setVerifying(false) }
  }

  const addReply = () => {
    if (newReply.trim()) {
      setQuickReplies((prev) => [...prev, newReply.trim()])
      setNewReply('')
    }
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
        <div className="animate-pulse bg-gray-100 rounded-2xl h-10 w-40" />
        {[...Array(5)].map((_, i) => <div key={i} className="animate-pulse bg-gray-100 rounded-2xl h-32" />)}
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Einstellungen</h1>
        {saved && (
          <div className="flex items-center gap-1.5 text-sm text-teal-600">
            <CheckCircle className="w-4 h-4" />
            Gespeichert
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Section tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`px-4 py-2 text-sm rounded-lg font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
              activeSection === s.id ? 'text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
            style={activeSection === s.id ? { backgroundColor: '#4ECDC4' } : {}}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* PROFIL */}
      {activeSection === 'profil' && (
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Profil</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Salonname</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Beschreibung (DE)</label>
            <textarea rows={4} value={descDe} onChange={(e) => setDescDe(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Beschreibung (EN)</label>
            <textarea rows={3} value={descEn} onChange={(e) => setDescEn(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instagram URL</label>
            <input type="url" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="https://instagram.com/..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cover Photo URL</label>
            <input type="url" value={coverPhoto} onChange={(e) => setCoverPhoto(e.target.value)} placeholder="https://..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
            {coverPhoto && (
              <img src={coverPhoto} alt="Cover" className="mt-2 w-full h-32 object-cover rounded-lg" />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Kategorien</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button key={c.value} type="button" onClick={() => toggleCategory(c.value)}
                  className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition-colors ${
                    categories.includes(c.value) ? 'border-transparent text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                  style={categories.includes(c.value) ? { backgroundColor: '#4ECDC4' } : {}}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Opening hours */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Öffnungszeiten</label>
            <div className="space-y-2">
              {DAYS.map(({ key, label }) => (
                <div key={key} className="flex items-center gap-3">
                  <label className="flex items-center gap-2 w-32">
                    <div
                      onClick={() => setHours((h) => ({ ...h, [key]: { ...h[key], open: !h[key].open } }))}
                      className={`w-8 h-4 rounded-full relative transition-colors cursor-pointer flex-shrink-0 ${hours[key].open ? 'bg-teal-400' : 'bg-gray-200'}`}
                    >
                      <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${hours[key].open ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </div>
                    <span className="text-sm text-gray-700">{label}</span>
                  </label>
                  {hours[key].open && (
                    <div className="flex items-center gap-2">
                      <input type="time" value={hours[key].from}
                        onChange={(e) => setHours((h) => ({ ...h, [key]: { ...h[key], from: e.target.value } }))}
                        className="border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-teal-400" />
                      <span className="text-gray-400 text-sm">–</span>
                      <input type="time" value={hours[key].to}
                        onChange={(e) => setHours((h) => ({ ...h, [key]: { ...h[key], to: e.target.value } }))}
                        className="border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-teal-400" />
                    </div>
                  )}
                  {!hours[key].open && <span className="text-sm text-gray-400">Geschlossen</span>}
                </div>
              ))}
            </div>
          </div>

          <button onClick={handleSave} disabled={saving}
            className="w-full py-2.5 text-sm font-medium text-white rounded-xl disabled:opacity-50"
            style={{ backgroundColor: '#4ECDC4' }}>
            {saving ? 'Speichern...' : 'Profil speichern'}
          </button>
        </div>
      )}

      {/* LAST-MINUTE */}
      {activeSection === 'lastminute' && (
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-5">
          <h2 className="font-semibold text-gray-900">Last-Minute Angebote</h2>
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setLmEnabled(!lmEnabled)}
              className={`w-10 h-5 rounded-full relative transition-colors ${lmEnabled ? 'bg-teal-400' : 'bg-gray-200'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${lmEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-sm text-gray-700 font-medium">Last-Minute aktivieren</span>
          </label>

          {lmEnabled && (
            <>
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Rabatt</label>
                  <span className="text-sm font-semibold" style={{ color: '#4ECDC4' }}>{lmDiscount}%</span>
                </div>
                <input type="range" min="5" max="50" step="5" value={lmDiscount}
                  onChange={(e) => setLmDiscount(Number(e.target.value))}
                  className="w-full accent-teal-400" />
                <div className="flex justify-between text-xs text-gray-400 mt-1"><span>5%</span><span>50%</span></div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Buchungsfenster</label>
                  <span className="text-sm font-semibold" style={{ color: '#4ECDC4' }}>{lmHours}h vor Termin</span>
                </div>
                <input type="range" min="2" max="24" step="2" value={lmHours}
                  onChange={(e) => setLmHours(Number(e.target.value))}
                  className="w-full accent-teal-400" />
                <div className="flex justify-between text-xs text-gray-400 mt-1"><span>2h</span><span>24h</span></div>
              </div>

              {/* Preview */}
              <div className="bg-teal-50 rounded-xl p-4 border border-teal-100">
                <p className="text-xs font-medium text-teal-700 mb-1">Vorschau</p>
                <p className="text-sm text-teal-800">
                  Freie Termine werden {lmHours}h vor dem Termin mit <strong>{lmDiscount}% Rabatt</strong> in der Last-Minute-Liste angezeigt.
                </p>
              </div>
            </>
          )}

          <button onClick={handleSave} disabled={saving}
            className="w-full py-2.5 text-sm font-medium text-white rounded-xl disabled:opacity-50"
            style={{ backgroundColor: '#4ECDC4' }}>
            {saving ? 'Speichern...' : 'Einstellungen speichern'}
          </button>
        </div>
      )}

      {/* SCHNELLANTWORTEN */}
      {activeSection === 'schnellantworten' && (
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Schnellantworten</h2>
          <p className="text-sm text-gray-500">Vordefinierte Antworten für häufige Kundenanfragen.</p>

          <div className="flex gap-2">
            <input type="text" value={newReply} onChange={(e) => setNewReply(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addReply()}
              placeholder="Neue Schnellantwort eingeben..."
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
            <button onClick={addReply}
              className="w-10 h-10 flex items-center justify-center rounded-xl text-white"
              style={{ backgroundColor: '#4ECDC4' }}>
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {quickReplies.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Noch keine Schnellantworten</p>
          ) : (
            <div className="space-y-2">
              {quickReplies.map((reply, i) => (
                <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2.5">
                  <p className="flex-1 text-sm text-gray-700">{reply}</p>
                  <button onClick={() => setQuickReplies((prev) => prev.filter((_, j) => j !== i))}
                    className="text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VERIFIZIERUNG */}
      {activeSection === 'verifizierung' && (
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-teal-500" />
            <h2 className="font-semibold text-gray-900">Verifizierung</h2>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-gray-600">Letzte Prüfung</span>
              <span className="text-gray-900 font-medium">
                {salon?.last_verified_at
                  ? new Date(salon.last_verified_at).toLocaleDateString('de-CH', { day: 'numeric', month: 'long', year: 'numeric' })
                  : 'Noch nicht geprüft'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-gray-600">Warnungen</span>
              <span
                className="font-semibold"
                style={{ color: (salon?.verification_warnings ?? 0) > 0 ? '#FF6B6B' : '#4ECDC4' }}
              >
                {salon?.verification_warnings ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-600">Status</span>
              <span
                className="text-xs font-medium px-2 py-1 rounded-full"
                style={{
                  backgroundColor: salon?.is_active ? '#F0FFFE' : '#FFF5F5',
                  color: salon?.is_active ? '#0D9488' : '#FF6B6B',
                }}
              >
                {salon?.is_active ? 'Aktiv' : 'Inaktiv'}
              </span>
            </div>
          </div>

          {verifySuccess ? (
            <div className="flex items-center gap-2 text-teal-600 text-sm bg-teal-50 px-4 py-3 rounded-xl">
              <CheckCircle className="w-4 h-4" />
              Verifizierungsanfrage gesendet
            </div>
          ) : (
            <button
              onClick={handleVerify}
              disabled={verifying}
              className="w-full py-2.5 text-sm font-medium text-white rounded-xl disabled:opacity-50"
              style={{ backgroundColor: '#4ECDC4' }}
            >
              {verifying ? 'Wird geprüft...' : 'Jetzt bestätigen'}
            </button>
          )}
        </div>
      )}

      {/* STORNIERUNGSPOLITIK */}
      {activeSection === 'stornierung' && (
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
          <h2 className="font-semibold text-gray-900">Stornierungspolitik</h2>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-700 leading-relaxed">
              Kunden können bis 24h vor dem Termin kostenlos stornieren.
            </p>
          </div>
          <p className="text-xs text-gray-400">
            Diese Richtlinie ist plattformweit einheitlich und kann nicht individuell angepasst werden.
          </p>
        </div>
      )}
    </div>
  )
}
