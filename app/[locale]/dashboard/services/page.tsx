'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, AlertCircle, X } from 'lucide-react'
import type { Service, SalonCategory, AgeGroup } from '@/lib/types'

const CATEGORIES: { value: SalonCategory; label: string }[] = [
  { value: 'coiffeur', label: 'Coiffeur' },
  { value: 'barbershop', label: 'Barbershop' },
  { value: 'nails', label: 'Nails' },
  { value: 'spa', label: 'Spa' },
  { value: 'makeup', label: 'Make-up' },
  { value: 'waxing', label: 'Waxing' },
]

const DURATIONS = [15, 30, 45, 60, 90, 120]
const AGE_GROUPS: { value: AgeGroup; label: string }[] = [
  { value: 'child', label: 'Kind' },
  { value: 'teenager', label: 'Teenager' },
  { value: 'adult', label: 'Erwachsene' },
  { value: 'senior', label: 'Senior' },
]
const GENDERS = [
  { value: 'male', label: 'Männer' },
  { value: 'female', label: 'Frauen' },
  { value: 'non_binary', label: 'Non-binary' },
  { value: 'prefer_not_to_say', label: 'Alle' },
]

type SortKey = 'name_de' | 'category' | 'duration_minutes' | 'price' | 'is_active'

const formatPrice = (p: number) =>
  new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(p)

interface ServiceForm {
  name_de: string
  name_en: string
  category: SalonCategory
  duration_minutes: number
  price: number
  description_de: string
  description_en: string
  suitable_for: AgeGroup[]
  suitable_gender: string[]
  is_active: boolean
}

const DEFAULT_FORM: ServiceForm = {
  name_de: '', name_en: '', category: 'coiffeur',
  duration_minutes: 60, price: 0,
  description_de: '', description_en: '',
  suitable_for: ['adult'], suitable_gender: ['prefer_not_to_say'],
  is_active: true,
}

export default function ServicesPage() {
  const params = useParams()

  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('name_de')
  const [sortAsc, setSortAsc] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [form, setForm] = useState<ServiceForm>(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/services')
      .then((r) => { if (!r.ok) throw new Error('Fehler beim Laden'); return r.json() })
      .then((data) => setServices(data.items ?? data ?? []))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Fehler'))
      .finally(() => setLoading(false))
  }, [])

  const sorted = [...services].sort((a, b) => {
    const av = a[sortKey]
    const bv = b[sortKey]
    if (typeof av === 'boolean') return sortAsc ? (av ? -1 : 1) : (av ? 1 : -1)
    if (typeof av === 'number' && typeof bv === 'number') return sortAsc ? av - bv : bv - av
    return sortAsc
      ? String(av).localeCompare(String(bv))
      : String(bv).localeCompare(String(av))
  })

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc)
    else { setSortKey(key); setSortAsc(true) }
  }

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ChevronUp className="w-3 h-3 text-gray-300" />
    return sortAsc ? <ChevronUp className="w-3 h-3 text-teal-500" /> : <ChevronDown className="w-3 h-3 text-teal-500" />
  }

  const openAdd = () => { setEditingService(null); setForm(DEFAULT_FORM); setModalOpen(true) }
  const openEdit = (s: Service) => {
    setEditingService(s)
    setForm({
      name_de: s.name_de, name_en: s.name_en ?? '', category: s.category,
      duration_minutes: s.duration_minutes, price: s.price,
      description_de: s.description_de ?? '', description_en: s.description_en ?? '',
      suitable_for: s.suitable_for ?? ['adult'],
      suitable_gender: s.suitable_gender ? [s.suitable_gender] : ['prefer_not_to_say'],
      is_active: s.is_active,
    })
    setModalOpen(true)
  }

  const toggleArrayItem = <T extends string>(arr: T[], item: T): T[] =>
    arr.includes(item) ? arr.filter((a) => a !== item) : [...arr, item]

  const handleSave = async () => {
    if (!form.name_de.trim()) return
    setSaving(true)
    const body = {
      ...form,
      suitable_gender: form.suitable_gender[0] ?? 'prefer_not_to_say',
    }
    try {
      if (editingService) {
        const res = await fetch(`/api/services/${editingService.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error()
        const updated = await res.json()
        setServices((prev) => prev.map((s) => s.id === editingService.id ? updated : s))
      } else {
        const res = await fetch('/api/services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error()
        const created = await res.json()
        setServices((prev) => [...prev, created])
      }
      setModalOpen(false)
    } catch {
      alert('Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/services/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setServices((prev) => prev.filter((s) => s.id !== id))
    } catch {
      alert('Fehler beim Löschen')
    } finally {
      setDeleteConfirm(null)
    }
  }

  const thClass = "px-3 py-3 text-left text-xs font-medium text-gray-500 cursor-pointer hover:text-gray-700 select-none"

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Services</h1>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-xl"
          style={{ backgroundColor: '#4ECDC4' }}
        >
          <Plus className="w-4 h-4" />
          Service hinzufügen
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-100 rounded-xl h-14" />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-auto">
          <table className="w-full min-w-[700px]">
            <thead className="border-b border-gray-100">
              <tr>
                <th className={thClass} onClick={() => toggleSort('name_de')}>
                  <div className="flex items-center gap-1">Name (DE/EN) <SortIcon k="name_de" /></div>
                </th>
                <th className={thClass} onClick={() => toggleSort('category')}>
                  <div className="flex items-center gap-1">Kategorie <SortIcon k="category" /></div>
                </th>
                <th className={thClass} onClick={() => toggleSort('duration_minutes')}>
                  <div className="flex items-center gap-1">Dauer <SortIcon k="duration_minutes" /></div>
                </th>
                <th className={thClass} onClick={() => toggleSort('price')}>
                  <div className="flex items-center gap-1">Preis <SortIcon k="price" /></div>
                </th>
                <th className={thClass}>Geeignet für</th>
                <th className={thClass} onClick={() => toggleSort('is_active')}>
                  <div className="flex items-center gap-1">Status <SortIcon k="is_active" /></div>
                </th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-400 text-sm">Keine Services erfasst</td>
                </tr>
              ) : sorted.map((service) => (
                <tr key={service.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-3">
                    <p className="text-sm font-medium text-gray-900">{service.name_de}</p>
                    {service.name_en && <p className="text-xs text-gray-400">{service.name_en}</p>}
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600 capitalize">
                      {CATEGORIES.find((c) => c.value === service.category)?.label ?? service.category}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-600">{service.duration_minutes} Min.</td>
                  <td className="px-3 py-3 text-sm font-medium text-gray-900">{formatPrice(service.price)}</td>
                  <td className="px-3 py-3 text-xs text-gray-500">
                    {(service.suitable_for ?? []).map((g) => AGE_GROUPS.find((a) => a.value === g)?.label).filter(Boolean).join(', ')}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className="text-xs px-2 py-1 rounded-full font-medium"
                      style={{
                        backgroundColor: service.is_active ? '#F0FFFE' : '#F9FAFB',
                        color: service.is_active ? '#0D9488' : '#6B7280',
                      }}
                    >
                      {service.is_active ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(service)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-teal-50 hover:text-teal-600 text-gray-400 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(service.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 hover:text-red-600 text-gray-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-base font-semibold text-gray-900">
                {editingService ? 'Service bearbeiten' : 'Service hinzufügen'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name (DE) <span className="text-red-500">*</span></label>
                  <input type="text" value={form.name_de} onChange={(e) => setForm({ ...form, name_de: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name (EN)</label>
                  <input type="text" value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategorie</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as SalonCategory })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white">
                    {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dauer (Min.)</label>
                  <select value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white">
                    {DURATIONS.map((d) => <option key={d} value={d}>{d} Min.</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preis (CHF)</label>
                <input type="number" min="0" step="0.5" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Beschreibung (DE)</label>
                <textarea rows={3} value={form.description_de} onChange={(e) => setForm({ ...form, description_de: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Beschreibung (EN)</label>
                <textarea rows={2} value={form.description_en} onChange={(e) => setForm({ ...form, description_en: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Geeignet für (Altersgruppe)</label>
                <div className="flex flex-wrap gap-2">
                  {AGE_GROUPS.map((g) => (
                    <button key={g.value} type="button"
                      onClick={() => setForm({ ...form, suitable_for: toggleArrayItem(form.suitable_for, g.value) })}
                      className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition-colors ${
                        form.suitable_for.includes(g.value) ? 'border-transparent text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                      style={form.suitable_for.includes(g.value) ? { backgroundColor: '#4ECDC4' } : {}}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Geeignet für (Geschlecht)</label>
                <div className="flex flex-wrap gap-2">
                  {GENDERS.map((g) => (
                    <button key={g.value} type="button"
                      onClick={() => setForm({ ...form, suitable_gender: toggleArrayItem(form.suitable_gender, g.value) })}
                      className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition-colors ${
                        form.suitable_gender.includes(g.value) ? 'border-transparent text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                      style={form.suitable_gender.includes(g.value) ? { backgroundColor: '#4ECDC4' } : {}}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setForm({ ...form, is_active: !form.is_active })}
                  className={`w-10 h-5 rounded-full relative transition-colors ${form.is_active ? 'bg-teal-400' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-sm text-gray-700">Aktiv</span>
              </label>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 sticky bottom-0 bg-white">
              <button
                onClick={handleSave}
                disabled={saving || !form.name_de.trim()}
                className="flex-1 py-2.5 text-sm font-medium text-white rounded-xl disabled:opacity-50"
                style={{ backgroundColor: '#4ECDC4' }}
              >
                {saving ? 'Speichern...' : 'Speichern'}
              </button>
              <button onClick={() => setModalOpen(false)} className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200">
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/50" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="font-semibold text-gray-900 mb-2">Service löschen?</h3>
            <p className="text-sm text-gray-500 mb-4">Diese Aktion kann nicht rückgängig gemacht werden.</p>
            <div className="flex gap-3">
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600">Löschen</button>
              <button onClick={() => setDeleteConfirm(null)} className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200">Abbrechen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
