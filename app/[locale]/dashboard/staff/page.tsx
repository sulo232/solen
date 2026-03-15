'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Plus, AlertCircle, X } from 'lucide-react'
import StaffCard from '@/components/dashboard/StaffCard'
import type { StaffMember } from '@/lib/types'

interface StaffFormData {
  name: string
  avatar_url: string
  specialties: string
  is_active: boolean
}

const DEFAULT_FORM: StaffFormData = {
  name: '',
  avatar_url: '',
  specialties: '',
  is_active: true,
}

export default function StaffPage() {
  const params = useParams()

  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null)
  const [form, setForm] = useState<StaffFormData>(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/staff')
      .then((r) => {
        if (!r.ok) throw new Error('Fehler beim Laden')
        return r.json()
      })
      .then((data) => setStaff(data.items ?? data ?? []))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Fehler'))
      .finally(() => setLoading(false))
  }, [])

  const openAdd = () => {
    setEditingStaff(null)
    setForm(DEFAULT_FORM)
    setModalOpen(true)
  }

  const openEdit = (s: StaffMember) => {
    setEditingStaff(s)
    setForm({
      name: s.name,
      avatar_url: s.avatar_url ?? '',
      specialties: s.specialties.join(', '),
      is_active: s.is_active,
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    const body = {
      name: form.name.trim(),
      avatar_url: form.avatar_url.trim() || null,
      specialties: form.specialties.split(',').map((s) => s.trim()).filter(Boolean),
      is_active: form.is_active,
    }
    try {
      if (editingStaff) {
        const res = await fetch(`/api/staff/${editingStaff.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error('Fehler')
        const updated = await res.json()
        setStaff((prev) => prev.map((s) => s.id === editingStaff.id ? updated : s))
      } else {
        const res = await fetch('/api/staff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error('Fehler')
        const created = await res.json()
        setStaff((prev) => [...prev, created])
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
      const res = await fetch(`/api/staff/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Fehler')
      setStaff((prev) => prev.filter((s) => s.id !== id))
    } catch {
      alert('Fehler beim Löschen. Möglicherweise hat dieses Teammitglied noch Buchungen.')
    } finally {
      setDeleteConfirm(null)
    }
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/staff/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: isActive }),
      })
      if (!res.ok) throw new Error('Fehler')
      setStaff((prev) => prev.map((s) => s.id === id ? { ...s, is_active: isActive } : s))
    } catch {
      alert('Fehler beim Aktualisieren')
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Team</h1>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-xl"
          style={{ backgroundColor: '#4ECDC4' }}
        >
          <Plus className="w-4 h-4" />
          Mitarbeiter hinzufügen
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-100 rounded-2xl h-48" />
          ))}
        </div>
      ) : staff.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center text-gray-400 shadow-sm">
          <p className="text-sm">Noch keine Teammitglieder erfasst.</p>
          <button
            onClick={openAdd}
            className="mt-4 text-sm font-medium"
            style={{ color: '#4ECDC4' }}
          >
            Jetzt hinzufügen →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {staff.map((s) => (
            <StaffCard
              key={s.id}
              staff={s}
              onEdit={openEdit}
              onDelete={(id) => setDeleteConfirm(id)}
              onToggleActive={handleToggleActive}
            />
          ))}
        </div>
      )}

      {/* Add/Edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">
                {editingStaff ? 'Mitarbeiter bearbeiten' : 'Mitarbeiter hinzufügen'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="z.B. Maria Müller"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Foto URL</label>
                <input
                  type="url"
                  value={form.avatar_url}
                  onChange={(e) => setForm({ ...form, avatar_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Spezialgebiete (kommagetrennt)</label>
                <input
                  type="text"
                  value={form.specialties}
                  onChange={(e) => setForm({ ...form, specialties: e.target.value })}
                  placeholder="z.B. Färben, Schnitt, Brautfrisuren"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setForm({ ...form, is_active: !form.is_active })}
                  className={`w-10 h-5 rounded-full relative transition-colors ${form.is_active ? 'bg-teal-400' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-sm text-gray-700">Buchbar</span>
              </label>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving || !form.name.trim()}
                className="flex-1 py-2.5 text-sm font-medium text-white rounded-xl disabled:opacity-50"
                style={{ backgroundColor: '#4ECDC4' }}
              >
                {saving ? 'Speichern...' : 'Speichern'}
              </button>
              <button
                onClick={() => setModalOpen(false)}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200"
              >
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
            <h3 className="font-semibold text-gray-900 mb-2">Mitarbeiter löschen?</h3>
            <p className="text-sm text-gray-500 mb-4">
              Diese Aktion kann nicht rückgängig gemacht werden. Bestehende Buchungen bleiben erhalten.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2.5 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600"
              >
                Löschen
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
