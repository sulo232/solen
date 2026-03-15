'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { MessageCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import TempChatWindow from '@/components/dashboard/TempChatWindow'
import type { Conversation } from '@/lib/types'

interface ConversationWithCustomer extends Conversation {
  customer_name?: string
  customer_avatar?: string | null
  is_first_visit?: boolean
}

function getInitials(name: string) {
  const words = name.trim().split(/\s+/)
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

function formatTime(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 86400000) {
    return d.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString('de-CH', { day: 'numeric', month: 'short' })
}

export default function MessagesPage() {
  const params = useParams()
  const locale = params.locale as string

  const [conversations, setConversations] = useState<ConversationWithCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mobileShowChat, setMobileShowChat] = useState(false)

  useEffect(() => {
    fetch('/api/conversations')
      .then((r) => {
        if (!r.ok) throw new Error('Fehler beim Laden')
        return r.json()
      })
      .then((data) => setConversations(data.items ?? data ?? []))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Fehler'))
      .finally(() => setLoading(false))
  }, [])

  const handleSelectConversation = async (conv: ConversationWithCustomer) => {
    setSelectedId(conv.id)
    setMobileShowChat(true)
    if (conv.unread_count_salon > 0) {
      try {
        await fetch(`/api/conversations/${conv.id}/read`, { method: 'POST' })
        setConversations((prev) =>
          prev.map((c) => c.id === conv.id ? { ...c, unread_count_salon: 0 } : c)
        )
      } catch {}
    }
  }

  const selectedConv = conversations.find((c) => c.id === selectedId)

  return (
    <div className="flex h-[calc(100vh-64px)] md:h-screen overflow-hidden">
      {/* Conversation list */}
      <div className={`w-full md:w-80 border-r border-gray-100 bg-white flex flex-col flex-shrink-0 ${mobileShowChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="px-4 py-4 border-b border-gray-100">
          <h1 className="text-lg font-bold text-gray-900">Nachrichten</h1>
        </div>

        {error && (
          <div className="mx-4 mt-3 bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-red-700 text-xs">
            <AlertCircle className="w-3 h-3 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                    <div className="h-3 bg-gray-100 rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm">
              <MessageCircle className="w-8 h-8 mb-2 opacity-30" />
              Keine Gespräche
            </div>
          ) : (
            conversations.map((conv) => {
              const name = conv.customer_name ?? 'Kunde'
              const isSelected = selectedId === conv.id
              return (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv)}
                  className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors border-b border-gray-50 ${
                    isSelected ? 'bg-teal-50' : 'hover:bg-gray-50'
                  }`}
                >
                  {/* Avatar */}
                  {conv.customer_avatar ? (
                    <img src={conv.customer_avatar} alt={name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
                      style={{ backgroundColor: '#4ECDC4' }}
                    >
                      {getInitials(name)}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-sm font-medium text-gray-900 truncate">{name}</span>
                        {conv.is_first_visit && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0" style={{ backgroundColor: '#FFF5F5', color: '#FF6B6B' }}>
                            Neukunde
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0">{formatTime(conv.last_message_at)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs text-gray-500 truncate">{conv.last_message_preview ?? '...'}</p>
                      {conv.unread_count_salon > 0 && (
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: '#FF6B6B' }}
                        />
                      )}
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Chat window */}
      <div className={`flex-1 flex flex-col ${!mobileShowChat ? 'hidden md:flex' : 'flex'}`}>
        {/* Mobile back button */}
        {mobileShowChat && (
          <div className="md:hidden px-4 py-3 border-b border-gray-100 bg-white flex items-center gap-3">
            <button
              onClick={() => setMobileShowChat(false)}
              className="flex items-center gap-1 text-sm text-gray-600"
            >
              <ArrowLeft className="w-4 h-4" />
              Zurück
            </button>
            {selectedConv && (
              <span className="text-sm font-medium text-gray-900">{selectedConv.customer_name ?? 'Kunde'}</span>
            )}
          </div>
        )}
        <TempChatWindow conversationId={selectedId} />
      </div>
    </div>
  )
}
