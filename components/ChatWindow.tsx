"use client";

// Phase 6 — ChatWindow (generic, reused by Dev 3)
// Full implementation in roadmap Phase 6 (Messaging UI).
// Props are typed per spec so Dev 3 can reference this interface now.

interface ChatWindowProps {
  conversationId: string;
  perspective: "customer" | "salon";
  currentUserId: string;
}

export default function ChatWindow({ conversationId, perspective }: ChatWindowProps) {
  return (
    <div className="flex flex-col h-full min-h-[400px] rounded-card border border-gray-100 bg-white">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-dark/40">
          <p className="text-sm font-medium">Chat</p>
          <p className="text-xs mt-1">Konversation: {conversationId}</p>
          <p className="text-xs text-dark/25 mt-2">
            {perspective === "salon" ? "Salon-Ansicht" : "Kunden-Ansicht"}
          </p>
          <p className="text-xs text-coral/60 mt-2">(Phase 6 — noch nicht implementiert)</p>
        </div>
      </div>
    </div>
  );
}
