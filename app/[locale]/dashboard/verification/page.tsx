"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components-legacy/dashboard/DashboardLayout";
import Spinner from "@/components-legacy/ui/Spinner";
import { ShieldCheck, Upload, Trash2, File, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import type { SalonDocument } from "@/lib/types";

export default function VerificationPage() {
  const [documents, setDocuments] = useState<SalonDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<string>("trade_license");
  const [error, setError] = useState("");

  const docTypes = [
    { value: "trade_license", label: "Handelsregistereintrag" },
    { value: "professional_cert", label: "Gewerbebewilligung / Zertifikat" },
    { value: "hygiene_cert", label: "Hygienezertifikat" },
    { value: "id_proof", label: "Ausweiskopie" },
    { value: "address_proof", label: "Adressnachweis" },
    { value: "other", label: "Sonstiges" },
  ];

  const fetchDocuments = async () => {
    try {
      const res = await fetch("/api/salon/documents");
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("document_type", docType);

    const res = await fetch("/api/salon/documents", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      setFile(null);
      await fetchDocuments();
    } else {
      const { error } = await res.json();
      setError(error || "Upload failed");
    }
    setUploading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Dokument unwiderruflich löschen?")) return;
    const res = await fetch(`/api/salon/documents?id=${id}`, { method: "DELETE" });
    if (res.ok) fetchDocuments();
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 text-s-ink mb-2">
            <ShieldCheck size={28} className="text-s-coral" />
            <h1 className="font-heading text-2xl">Dokumente & Verifizierung</h1>
          </div>
          <p className="text-sm text-s-ink/60">
            Optional, aber empfohlen — solen.ch kann jederzeit Nachweise anfordern (AGB §2.4). 
            Laden Sie Dokumente wie Gewerbebewilligungen oder Zertifikate hoch, um das Vertrauen Ihrer Kunden zu stärken.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-sm font-bold text-s-ink mb-4">Neues Dokument</h2>
            <div className="bg-white rounded-[12px] shadow-warm-md p-5 border border-s-ink/5 space-y-4">
              {error && <p className="text-xs text-s-error bg-s-error-bg p-2 rounded-btn">{error}</p>}
              
              <div>
                <label className="block text-xs font-medium text-s-ink/50 mb-1">Dokumentenart</label>
                <select 
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-btn border border-s-ink/10 text-sm focus:outline-none focus:border-s-coral"
                >
                  {docTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-s-ink/50 mb-1">Datei (PDF, JPG, PNG - Max 10MB)</label>
                <div className="border-2 border-dashed border-s-ink/10 rounded-btn p-4 text-center hover:bg-s-bg-surface transition-colors relative cursor-pointer">
                  <input 
                    type="file" 
                    accept="application/pdf,image/jpeg,image/png"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  />
                  <div className="pointer-events-none">
                    <Upload className="mx-auto h-6 w-6 text-s-ink/30 mb-2" />
                    {file ? (
                      <span className="text-sm text-s-ink font-medium">{file.name}</span>
                    ) : (
                      <span className="text-sm text-s-ink/50">Klicken oder Datei hier ablegen</span>
                    )}
                  </div>
                </div>
              </div>

              <button 
                onClick={handleUpload} 
                disabled={!file || uploading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-btn bg-s-coral text-white font-medium text-sm disabled:opacity-50"
              >
                {uploading ? <Spinner size="sm" invert /> : <Upload size={16} />}
                Hochladen
              </button>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-bold text-s-ink mb-4">Ihre Dokumente</h2>
            {loading ? (
              <div className="flex justify-center p-8"><Spinner size="md" /></div>
            ) : documents.length === 0 ? (
              <div className="bg-white border-dashed border-2 border-s-ink/10 rounded-[12px] p-8 text-center text-s-ink/40 text-sm">
                Noch keine Dokumente hochgeladen.
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div key={doc.id} className="bg-white rounded-[12px] shadow-elevation-1 border border-s-ink/5 p-4 flex items-start gap-3">
                    <div className="p-2 bg-s-bg-surface rounded-btn shrink-0 text-s-ink/40">
                      <File size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-s-ink truncate">{doc.file_name}</p>
                      <p className="text-xs text-s-ink/50 mt-0.5">
                        {docTypes.find(t => t.value === doc.document_type)?.label || doc.document_type}
                        {" • "} 
                        {new Date(doc.uploaded_at).toLocaleDateString()}
                      </p>
                      
                      <div className="mt-2 flex items-center gap-1.5">
                        {doc.status === 'approved' && <><CheckCircle2 size={14} className="text-s-sage" /><span className="text-xs font-medium text-s-sage">Anerkannt</span></>}
                        {doc.status === 'pending' && <><Clock size={14} className="text-s-ink/40" /><span className="text-xs font-medium text-s-ink/60">In Prüfung</span></>}
                        {doc.status === 'rejected' && <><AlertCircle size={14} className="text-s-error" /><span className="text-xs font-medium text-s-error">Abgelehnt</span></>}
                        
                        {doc.admin_note && <span className="text-xs text-s-error ml-2 italic truncate">"{doc.admin_note}"</span>}
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => handleDelete(doc.id)} 
                      className="p-1.5 text-s-ink/30 hover:text-s-error hover:bg-s-error/5 rounded transition-colors"
                      title="Löschen"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
