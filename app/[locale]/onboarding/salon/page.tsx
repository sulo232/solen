'use client'

import { useReducer, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChevronRight, ChevronLeft, Plus, Trash2, Check, AlertCircle } from 'lucide-react'
import type { SalonCategory, Quartier, AgeGroup } from '@/lib/types'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ServiceRow {
  id: string
  name_de: string
  name_en: string
  category: SalonCategory
  duration_minutes: number
  price: number
  suitable_for: AgeGroup[]
}

interface TeamRow {
  id: string
  name: string
  specialties: string
}

interface AvailabilityRow {
  id: string
  staffName: string
  dayKey: string
  startTime: string
  endTime: string
}

interface WizardState {
  // Step 0: Grunddaten
  salonName: string
  quartier: Quartier
  address: string
  phone: string

  // Step 1: Profil
  categories: SalonCategory[]
  descDe: string
  descEn: string
  coverPhotoUrl: string
  openingHours: Record<string, { open: boolean; from: string; to: string }>

  // Step 2: Services
  services: ServiceRow[]

  // Step 3: Team
  team: TeamRow[]

  // Step 4: Verfügbarkeit
  availability: AvailabilityRow[]

  // Step 5: Last-Minute
  lmEnabled: boolean
  lmDiscount: number
  lmHours: number
}

type Action =
  | { type: 'SET'; field: keyof WizardState; value: unknown }
  | { type: 'ADD_SERVICE'; service: ServiceRow }
  | { type: 'UPDATE_SERVICE'; id: string; field: keyof ServiceRow; value: unknown }
  | { type: 'REMOVE_SERVICE'; id: string }
  | { type: 'ADD_TEAM'; member: TeamRow }
  | { type: 'UPDATE_TEAM'; id: string; field: keyof TeamRow; value: string }
  | { type: 'REMOVE_TEAM'; id: string }
  | { type: 'ADD_AVAILABILITY'; row: AvailabilityRow }
  | { type: 'UPDATE_AVAILABILITY'; id: string; field: keyof AvailabilityRow; value: string }
  | { type: 'REMOVE_AVAILABILITY'; id: string }
  | { type: 'TOGGLE_CATEGORY'; cat: SalonCategory }
  | { type: 'TOGGLE_SUITABLE_FOR'; serviceId: string; ageGroup: AgeGroup }
  | { type: 'TOGGLE_OPENING'; day: string }
  | { type: 'SET_OPENING'; day: string; field: 'from' | 'to'; value: string }

const DAYS = [
  { key: 'mon', label: 'Montag' },
  { key: 'tue', label: 'Dienstag' },
  { key: 'wed', label: 'Mittwoch' },
  { key: 'thu', label: 'Donnerstag' },
  { key: 'fri', label: 'Freitag' },
  { key: 'sat', label: 'Samstag' },
  { key: 'sun', label: 'Sonntag' },
]

const QUARTIERS: { value: Quartier; label: string }[] = [
  { value: 'grossbasel', label: 'Grossbasel' },
  { value: 'kleinbasel', label: 'Kleinbasel' },
  { value: 'gundeli', label: 'Gundeli' },
  { value: 'st_johann', label: 'St. Johann' },
  { value: 'iselin', label: 'Iselin' },
  { value: 'bruderholz', label: 'Bruderholz' },
  { value: 'breite', label: 'Breite' },
]

const CATEGORIES: { value: SalonCategory; label: string }[] = [
  { value: 'coiffeur', label: 'Coiffeur' },
  { value: 'barbershop', label: 'Barbershop' },
  { value: 'nails', label: 'Nails' },
  { value: 'spa', label: 'Spa' },
  { value: 'makeup', label: 'Make-up' },
  { value: 'waxing', label: 'Waxing' },
]

const AGE_GROUPS: { value: AgeGroup; label: string }[] = [
  { value: 'child', label: 'Kind' },
  { value: 'teenager', label: 'Teenager' },
  { value: 'adult', label: 'Erwachsene' },
  { value: 'senior', label: 'Senior' },
]

const DURATIONS = [15, 30, 45, 60, 90, 120]

const DEFAULT_HOURS = Object.fromEntries(
  DAYS.map(({ key }) => [key, { open: key !== 'sun', from: '09:00', to: '18:00' }])
)

const INITIAL_STATE: WizardState = {
  salonName: '', quartier: 'grossbasel', address: '', phone: '',
  categories: [], descDe: '', descEn: '', coverPhotoUrl: '',
  openingHours: DEFAULT_HOURS,
  services: [], team: [], availability: [],
  lmEnabled: false, lmDiscount: 20, lmHours: 6,
}

function uid() {
  return Math.random().toString(36).slice(2)
}

function reducer(state: WizardState, action: Action): WizardState {
  switch (action.type) {
    case 'SET': return { ...state, [action.field]: action.value }
    case 'TOGGLE_CATEGORY':
      return {
        ...state,
        categories: state.categories.includes(action.cat)
          ? state.categories.filter((c) => c !== action.cat)
          : [...state.categories, action.cat],
      }
    case 'TOGGLE_OPENING':
      return {
        ...state,
        openingHours: {
          ...state.openingHours,
          [action.day]: { ...state.openingHours[action.day], open: !state.openingHours[action.day].open },
        },
      }
    case 'SET_OPENING':
      return {
        ...state,
        openingHours: {
          ...state.openingHours,
          [action.day]: { ...state.openingHours[action.day], [action.field]: action.value },
        },
      }
    case 'ADD_SERVICE': return { ...state, services: [...state.services, action.service] }
    case 'UPDATE_SERVICE':
      return {
        ...state,
        services: state.services.map((s) =>
          s.id === action.id ? { ...s, [action.field]: action.value } : s
        ),
      }
    case 'REMOVE_SERVICE': return { ...state, services: state.services.filter((s) => s.id !== action.id) }
    case 'TOGGLE_SUITABLE_FOR':
      return {
        ...state,
        services: state.services.map((s) =>
          s.id === action.serviceId
            ? {
                ...s,
                suitable_for: s.suitable_for.includes(action.ageGroup)
                  ? s.suitable_for.filter((a) => a !== action.ageGroup)
                  : [...s.suitable_for, action.ageGroup],
              }
            : s
        ),
      }
    case 'ADD_TEAM': return { ...state, team: [...state.team, action.member] }
    case 'UPDATE_TEAM':
      return { ...state, team: state.team.map((m) => m.id === action.id ? { ...m, [action.field]: action.value } : m) }
    case 'REMOVE_TEAM': return { ...state, team: state.team.filter((m) => m.id !== action.id) }
    case 'ADD_AVAILABILITY': return { ...state, availability: [...state.availability, action.row] }
    case 'UPDATE_AVAILABILITY':
      return { ...state, availability: state.availability.map((r) => r.id === action.id ? { ...r, [action.field]: action.value } : r) }
    case 'REMOVE_AVAILABILITY': return { ...state, availability: state.availability.filter((r) => r.id !== action.id) }
    default: return state
  }
}

const STEP_LABELS = [
  'Grunddaten', 'Profil', 'Services', 'Team', 'Verfügbarkeit', 'Last-Minute',
]

// ── Component ─────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const params = useParams()
  const locale = params.locale as string
  const router = useRouter()

  const [step, setStep] = useState(0)
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totalSteps = STEP_LABELS.length

  const canProceed = (): boolean => {
    if (step === 0) return !!state.salonName.trim() && !!state.address.trim()
    if (step === 1) return state.categories.length > 0 && !!state.descDe.trim()
    if (step === 2) return state.services.length >= 1
    return true
  }

  const next = () => {
    if (step < totalSteps - 1 && canProceed()) setStep((s) => s + 1)
  }
  const back = () => setStep((s) => Math.max(0, s - 1))

  const addService = () => {
    dispatch({
      type: 'ADD_SERVICE',
      service: {
        id: uid(),
        name_de: '',
        name_en: '',
        category: state.categories[0] ?? 'coiffeur',
        duration_minutes: 60,
        price: 0,
        suitable_for: ['adult'],
      },
    })
  }

  const addTeamMember = (name = '') => {
    dispatch({ type: 'ADD_TEAM', member: { id: uid(), name, specialties: '' } })
  }

  const addAvailability = () => {
    dispatch({
      type: 'ADD_AVAILABILITY',
      row: { id: uid(), staffName: state.team[0]?.name ?? '', dayKey: 'mon', startTime: '09:00', endTime: '17:00' },
    })
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const opening_hours = Object.fromEntries(
        DAYS.map(({ key }) => [
          key,
          state.openingHours[key].open
            ? { open: state.openingHours[key].from, close: state.openingHours[key].to }
            : null,
        ])
      )
      const res = await fetch('/api/salons/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: state.salonName,
          quartier: state.quartier,
          address: state.address,
          phone: state.phone || null,
          categories: state.categories,
          description_de: state.descDe,
          description_en: state.descEn || null,
          cover_photo_url: state.coverPhotoUrl || null,
          opening_hours,
          services: state.services.map(({ id: _, ...s }) => ({
            ...s,
            suitable_gender: 'prefer_not_to_say',
          })),
          staff: state.team.map(({ id: _, ...m }) => ({
            name: m.name,
            specialties: m.specialties.split(',').map((s) => s.trim()).filter(Boolean),
          })),
          availability: state.availability,
          last_minute_discount_percent: state.lmEnabled ? state.lmDiscount : 0,
          last_minute_window_hours: state.lmHours,
        }),
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.message ?? 'Fehler beim Einreichen')
      }
      router.push(`/${locale}/dashboard`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unbekannter Fehler')
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
  const labelClass = "block text-sm font-medium text-gray-700 mb-1"

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: '#4ECDC4' }}>
            S
          </div>
          <span className="font-semibold text-gray-900">solen.ch</span>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {STEP_LABELS.map((label, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                    i < step ? 'text-white' :
                    i === step ? 'text-white ring-2 ring-offset-2' :
                    'bg-gray-200 text-gray-400'
                  }`}
                  style={i <= step ? { backgroundColor: '#4ECDC4' } : {}}
                >
                  {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <span className={`text-xs hidden md:block ${i === step ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
                  {label}
                </span>
              </div>
            ))}
          </div>
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ backgroundColor: '#4ECDC4', width: `${((step) / (totalSteps - 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">{STEP_LABELS[step]}</h2>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* STEP 0: Grunddaten */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Salonname <span className="text-red-500">*</span></label>
                <input type="text" value={state.salonName} onChange={(e) => dispatch({ type: 'SET', field: 'salonName', value: e.target.value })}
                  placeholder="z.B. Salon Mia" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Quartier <span className="text-red-500">*</span></label>
                <select value={state.quartier} onChange={(e) => dispatch({ type: 'SET', field: 'quartier', value: e.target.value as Quartier })}
                  className={inputClass + ' bg-white'}>
                  {QUARTIERS.map((q) => <option key={q.value} value={q.value}>{q.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Adresse <span className="text-red-500">*</span></label>
                <input type="text" value={state.address} onChange={(e) => dispatch({ type: 'SET', field: 'address', value: e.target.value })}
                  placeholder="Strasse Nr, PLZ Basel" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Telefon (optional)</label>
                <input type="tel" value={state.phone} onChange={(e) => dispatch({ type: 'SET', field: 'phone', value: e.target.value })}
                  placeholder="+41 61 ..." className={inputClass} />
              </div>
            </div>
          )}

          {/* STEP 1: Profil */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Kategorien <span className="text-red-500">*</span></label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => (
                    <button key={c.value} type="button"
                      onClick={() => dispatch({ type: 'TOGGLE_CATEGORY', cat: c.value })}
                      className={`px-3 py-1.5 text-sm rounded-lg border font-medium transition-colors ${
                        state.categories.includes(c.value) ? 'border-transparent text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                      style={state.categories.includes(c.value) ? { backgroundColor: '#4ECDC4' } : {}}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>Beschreibung (DE) <span className="text-red-500">*</span></label>
                <textarea rows={5} value={state.descDe} maxLength={500}
                  onChange={(e) => dispatch({ type: 'SET', field: 'descDe', value: e.target.value })}
                  placeholder="Beschreiben Sie Ihren Salon..." className={inputClass + ' resize-none'} />
                <p className="text-xs text-gray-400 mt-1 text-right">{state.descDe.length}/500</p>
              </div>
              <div>
                <label className={labelClass}>Beschreibung (EN, optional)</label>
                <textarea rows={3} value={state.descEn}
                  onChange={(e) => dispatch({ type: 'SET', field: 'descEn', value: e.target.value })}
                  className={inputClass + ' resize-none'} />
              </div>
              <div>
                <label className={labelClass}>Cover Photo URL</label>
                <input type="url" value={state.coverPhotoUrl}
                  onChange={(e) => dispatch({ type: 'SET', field: 'coverPhotoUrl', value: e.target.value })}
                  placeholder="https://..." className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Öffnungszeiten</label>
                <div className="space-y-2">
                  {DAYS.map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-3 flex-wrap">
                      <label className="flex items-center gap-2 w-36">
                        <div
                          onClick={() => dispatch({ type: 'TOGGLE_OPENING', day: key })}
                          className={`w-8 h-4 rounded-full relative transition-colors cursor-pointer flex-shrink-0 ${state.openingHours[key]?.open ? 'bg-teal-400' : 'bg-gray-200'}`}
                        >
                          <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${state.openingHours[key]?.open ? 'translate-x-4' : 'translate-x-0.5'}`} />
                        </div>
                        <span className="text-sm text-gray-700">{label}</span>
                      </label>
                      {state.openingHours[key]?.open && (
                        <div className="flex items-center gap-2">
                          <input type="time" value={state.openingHours[key].from}
                            onChange={(e) => dispatch({ type: 'SET_OPENING', day: key, field: 'from', value: e.target.value })}
                            className="border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-teal-400" />
                          <span className="text-gray-400">–</span>
                          <input type="time" value={state.openingHours[key].to}
                            onChange={(e) => dispatch({ type: 'SET_OPENING', day: key, field: 'to', value: e.target.value })}
                            className="border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-teal-400" />
                        </div>
                      )}
                      {!state.openingHours[key]?.open && <span className="text-sm text-gray-400">Geschlossen</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Services */}
          {step === 2 && (
            <div className="space-y-4">
              {state.services.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">Mindestens 1 Service erforderlich</p>
              )}
              {state.services.map((service, idx) => (
                <div key={service.id} className="bg-gray-50 rounded-xl p-4 space-y-3 relative">
                  <button
                    onClick={() => dispatch({ type: 'REMOVE_SERVICE', id: service.id })}
                    className="absolute top-3 right-3 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <p className="text-xs font-semibold text-gray-500">Service {idx + 1}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Name (DE)</label>
                      <input type="text" value={service.name_de} placeholder="z.B. Haarschnitt"
                        onChange={(e) => dispatch({ type: 'UPDATE_SERVICE', id: service.id, field: 'name_de', value: e.target.value })}
                        className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Name (EN)</label>
                      <input type="text" value={service.name_en} placeholder="e.g. Haircut"
                        onChange={(e) => dispatch({ type: 'UPDATE_SERVICE', id: service.id, field: 'name_en', value: e.target.value })}
                        className={inputClass} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Kategorie</label>
                      <select value={service.category}
                        onChange={(e) => dispatch({ type: 'UPDATE_SERVICE', id: service.id, field: 'category', value: e.target.value })}
                        className={inputClass + ' bg-white'}>
                        {(state.categories.length > 0 ? CATEGORIES.filter((c) => state.categories.includes(c.value)) : CATEGORIES)
                          .map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Dauer</label>
                      <select value={service.duration_minutes}
                        onChange={(e) => dispatch({ type: 'UPDATE_SERVICE', id: service.id, field: 'duration_minutes', value: Number(e.target.value) })}
                        className={inputClass + ' bg-white'}>
                        {DURATIONS.map((d) => <option key={d} value={d}>{d} Min.</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Preis (CHF)</label>
                      <input type="number" min="0" step="0.5" value={service.price}
                        onChange={(e) => dispatch({ type: 'UPDATE_SERVICE', id: service.id, field: 'price', value: Number(e.target.value) })}
                        className={inputClass} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Geeignet für</label>
                    <div className="flex gap-2 flex-wrap">
                      {AGE_GROUPS.map((g) => (
                        <button key={g.value} type="button"
                          onClick={() => dispatch({ type: 'TOGGLE_SUITABLE_FOR', serviceId: service.id, ageGroup: g.value })}
                          className={`px-2.5 py-1 text-xs rounded-lg border font-medium transition-colors ${
                            service.suitable_for.includes(g.value) ? 'border-transparent text-white' : 'border-gray-200 text-gray-600'
                          }`}
                          style={service.suitable_for.includes(g.value) ? { backgroundColor: '#4ECDC4' } : {}}
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={addService}
                className="w-full py-2.5 text-sm font-medium border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-teal-300 hover:text-teal-600 transition-colors flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" />
                Service hinzufügen
              </button>
            </div>
          )}

          {/* STEP 3: Team */}
          {step === 3 && (
            <div className="space-y-4">
              {state.team.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">Fügen Sie Teammitglieder hinzu</p>
              )}
              {state.team.map((member, idx) => (
                <div key={member.id} className="bg-gray-50 rounded-xl p-4 space-y-2 relative">
                  <button onClick={() => dispatch({ type: 'REMOVE_TEAM', id: member.id })}
                    className="absolute top-3 right-3 text-gray-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <p className="text-xs font-semibold text-gray-500">Mitarbeiter {idx + 1}</p>
                  <input type="text" value={member.name} placeholder="Name"
                    onChange={(e) => dispatch({ type: 'UPDATE_TEAM', id: member.id, field: 'name', value: e.target.value })}
                    className={inputClass} />
                  <input type="text" value={member.specialties} placeholder="Spezialgebiete (kommagetrennt)"
                    onChange={(e) => dispatch({ type: 'UPDATE_TEAM', id: member.id, field: 'specialties', value: e.target.value })}
                    className={inputClass} />
                </div>
              ))}
              <div className="flex gap-2">
                <button onClick={() => addTeamMember()}
                  className="flex-1 py-2.5 text-sm font-medium border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-teal-300 hover:text-teal-600 transition-colors flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" />
                  Mitarbeiter hinzufügen
                </button>
                <button onClick={() => addTeamMember('Nur ich')}
                  className="px-4 py-2.5 text-sm font-medium bg-gray-100 rounded-xl text-gray-600 hover:bg-gray-200 transition-colors">
                  Nur ich
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Verfügbarkeit */}
          {step === 4 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Definieren Sie die wöchentliche Verfügbarkeit Ihres Teams.</p>
              {state.availability.map((row, idx) => (
                <div key={row.id} className="bg-gray-50 rounded-xl p-4 space-y-2 relative">
                  <button onClick={() => dispatch({ type: 'REMOVE_AVAILABILITY', id: row.id })}
                    className="absolute top-3 right-3 text-gray-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Mitarbeiter</label>
                      <select value={row.staffName}
                        onChange={(e) => dispatch({ type: 'UPDATE_AVAILABILITY', id: row.id, field: 'staffName', value: e.target.value })}
                        className={inputClass + ' bg-white'}>
                        {state.team.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
                        <option value="">Alle</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Tag</label>
                      <select value={row.dayKey}
                        onChange={(e) => dispatch({ type: 'UPDATE_AVAILABILITY', id: row.id, field: 'dayKey', value: e.target.value })}
                        className={inputClass + ' bg-white'}>
                        {DAYS.map(({ key, label }) => <option key={key} value={key}>{label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Von</label>
                      <input type="time" value={row.startTime}
                        onChange={(e) => dispatch({ type: 'UPDATE_AVAILABILITY', id: row.id, field: 'startTime', value: e.target.value })}
                        className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Bis</label>
                      <input type="time" value={row.endTime}
                        onChange={(e) => dispatch({ type: 'UPDATE_AVAILABILITY', id: row.id, field: 'endTime', value: e.target.value })}
                        className={inputClass} />
                    </div>
                  </div>
                  {row.startTime && row.endTime && (
                    <p className="text-xs text-teal-600">
                      ≈ {Math.round((
                        (parseInt(row.endTime.split(':')[0]) * 60 + parseInt(row.endTime.split(':')[1])) -
                        (parseInt(row.startTime.split(':')[0]) * 60 + parseInt(row.startTime.split(':')[1]))
                      ) / 30)} Slots verfügbar
                    </p>
                  )}
                </div>
              ))}
              <button onClick={addAvailability}
                className="w-full py-2.5 text-sm font-medium border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-teal-300 hover:text-teal-600 transition-colors flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" />
                Verfügbarkeit hinzufügen
              </button>
            </div>
          )}

          {/* STEP 5: Last-Minute */}
          {step === 5 && (
            <div className="space-y-5">
              <p className="text-sm text-gray-500">
                Last-Minute-Angebote ermöglichen es Ihnen, kurzfristig freie Termine mit Rabatt zu füllen.
              </p>
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => dispatch({ type: 'SET', field: 'lmEnabled', value: !state.lmEnabled })}
                  className={`w-10 h-5 rounded-full relative transition-colors ${state.lmEnabled ? 'bg-teal-400' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${state.lmEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-sm font-medium text-gray-700">Last-Minute aktivieren</span>
              </label>

              {state.lmEnabled && (
                <>
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">Rabatt</label>
                      <span className="text-sm font-semibold" style={{ color: '#4ECDC4' }}>{state.lmDiscount}%</span>
                    </div>
                    <input type="range" min="5" max="50" step="5" value={state.lmDiscount}
                      onChange={(e) => dispatch({ type: 'SET', field: 'lmDiscount', value: Number(e.target.value) })}
                      className="w-full accent-teal-400" />
                    <div className="flex justify-between text-xs text-gray-400 mt-1"><span>5%</span><span>50%</span></div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">Buchungsfenster</label>
                      <span className="text-sm font-semibold" style={{ color: '#4ECDC4' }}>{state.lmHours}h vor Termin</span>
                    </div>
                    <input type="range" min="2" max="24" step="2" value={state.lmHours}
                      onChange={(e) => dispatch({ type: 'SET', field: 'lmHours', value: Number(e.target.value) })}
                      className="w-full accent-teal-400" />
                    <div className="flex justify-between text-xs text-gray-400 mt-1"><span>2h</span><span>24h</span></div>
                  </div>
                  <div className="bg-teal-50 rounded-xl p-4 border border-teal-100">
                    <p className="text-sm text-teal-800">
                      Freie Termine werden {state.lmHours}h vor dem Termin mit <strong>{state.lmDiscount}% Rabatt</strong> in der Last-Minute-Liste angezeigt.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-3 mt-6">
          {step > 0 && (
            <button onClick={back}
              className="flex items-center gap-1 px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50">
              <ChevronLeft className="w-4 h-4" />
              Zurück
            </button>
          )}
          {step < totalSteps - 1 ? (
            <button onClick={next} disabled={!canProceed()}
              className="flex-1 flex items-center justify-center gap-1 py-2.5 text-sm font-medium text-white rounded-xl disabled:opacity-50 transition-opacity"
              style={{ backgroundColor: '#4ECDC4' }}>
              Weiter
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting}
              className="flex-1 flex items-center justify-center gap-1 py-2.5 text-sm font-medium text-white rounded-xl disabled:opacity-50 transition-opacity"
              style={{ backgroundColor: '#4ECDC4' }}>
              {submitting ? 'Wird übermittelt...' : 'Profil einreichen'}
              {!submitting && <Check className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
