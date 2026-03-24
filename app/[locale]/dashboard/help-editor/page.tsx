"use client";

import { useEffect, useState } from "react";
import { BookOpen, Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Spinner from "@/components/ui/Spinner";

interface HelpArticle {
  id: string;
  slug: string;
  title: string;
  content: string;
  category: string;
  locale: string;
  published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

const EMPTY_FORM = {
  slug: "",
  title: "",
  content: "",
  category: "customers",
  locale: "de",
  published: false,
  sort_order: 0,
};

export default function HelpEditorPage() {
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<HelpArticle | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const fetchArticles = () => {
    setLoading(true);
    fetch("/api/admin/help")
      .then((r) => r.json())
      .then((data) => { setArticles(data.articles ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchArticles(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (article: HelpArticle) => {
    setEditing(article);
    setForm({
      slug: article.slug,
      title: article.title,
      content: article.content,
      category: article.category,
      locale: article.locale,
      published: article.published,
      sort_order: article.sort_order,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) {
        await fetch("/api/admin/help", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editing.id, ...form }),
        });
      } else {
        await fetch("/api/admin/help", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }
      setShowForm(false);
      fetchArticles();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Artikel wirklich löschen?")) return;
    await fetch(`/api/admin/help?id=${id}`, { method: "DELETE" });
    fetchArticles();
  };

  const togglePublish = async (article: HelpArticle) => {
    await fetch("/api/admin/help", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: article.id, published: !article.published }),
    });
    fetchArticles();
  };

  const categoryLabel = (cat: string) =>
    cat === "customers" ? "Für Kunden" : cat === "salons" ? "Für Salons" : "Kontakt";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-s-coral/10 flex items-center justify-center">
              <BookOpen size={20} className="text-s-coral" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-xl text-s-ink">Hilfe-Artikel</h1>
              <p className="text-xs text-s-ink/40 font-body">{articles.length} Artikel</p>
            </div>
          </div>
          <button
            onClick={openNew}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-btn bg-s-coral text-white text-sm font-body font-medium hover:bg-s-coral/90 transition-colors"
          >
            <Plus size={16} />
            Neuer Artikel
          </button>
        </div>

        {/* Form modal */}
        {showForm && (
          <div className="bg-white border border-s-ink/10 rounded-card p-5 space-y-4 shadow-card">
            <h2 className="font-heading font-semibold text-base text-s-ink">
              {editing ? "Artikel bearbeiten" : "Neuer Artikel"}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="slug (z.B. wie-buche-ich)"
                className="col-span-2 sm:col-span-1 px-3 py-2 rounded-btn border border-s-ink/10 text-sm font-body focus:outline-none focus:ring-2 focus:ring-s-coral/30"
              />
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="px-3 py-2 rounded-btn border border-s-ink/10 text-sm font-body focus:outline-none focus:ring-2 focus:ring-s-coral/30"
              >
                <option value="customers">Für Kunden</option>
                <option value="salons">Für Salons</option>
                <option value="contact">Kontakt</option>
              </select>
            </div>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Titel"
              className="w-full px-3 py-2 rounded-btn border border-s-ink/10 text-sm font-body focus:outline-none focus:ring-2 focus:ring-s-coral/30"
            />
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Inhalt (Markdown unterstützt: ## Überschrift, - Liste)"
              rows={10}
              className="w-full px-3 py-2 rounded-btn border border-s-ink/10 text-sm font-body focus:outline-none focus:ring-2 focus:ring-s-coral/30 resize-y"
            />
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm font-body text-s-ink/60">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) => setForm({ ...form, published: e.target.checked })}
                  className="rounded border-s-ink/20 text-s-coral focus:ring-s-coral"
                />
                Veröffentlicht
              </label>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                className="w-20 px-2 py-1 rounded-btn border border-s-ink/10 text-sm font-body"
                placeholder="Reihenfolge"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                disabled={saving || !form.slug || !form.title || !form.content}
                className="px-5 py-2 rounded-btn bg-s-coral text-white text-sm font-body font-medium hover:bg-s-coral/90 transition-colors disabled:opacity-50"
              >
                {saving ? "Speichern…" : editing ? "Aktualisieren" : "Erstellen"}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-btn text-sm font-body text-s-ink/50 hover:text-s-ink/70"
              >
                Abbrechen
              </button>
            </div>
          </div>
        )}

        {/* Article list */}
        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : articles.length === 0 ? (
          <div className="text-center py-12 text-s-ink/40 font-body text-sm">
            Noch keine Hilfe-Artikel. Erstelle den ersten!
          </div>
        ) : (
          <div className="space-y-2">
            {articles.map((article) => (
              <div
                key={article.id}
                className="flex items-center justify-between px-4 py-3 rounded-card bg-s-bg-surface hover:bg-s-bg-sunken transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-body text-sm font-medium text-s-ink truncate">{article.title}</span>
                    <span className="px-2 py-0.5 rounded-pill text-[10px] font-medium bg-s-sand text-s-ink/50">
                      {categoryLabel(article.category)}
                    </span>
                    {!article.published && (
                      <span className="px-2 py-0.5 rounded-pill text-[10px] font-medium bg-s-coral/10 text-s-coral">
                        Entwurf
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-s-ink/30 font-body mt-0.5">/{article.slug} · {article.locale}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-3">
                  <button
                    onClick={() => togglePublish(article)}
                    className="p-1.5 rounded-btn text-s-ink/30 hover:text-s-ink/60 transition-colors"
                    title={article.published ? "Verbergen" : "Veröffentlichen"}
                  >
                    {article.published ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button
                    onClick={() => openEdit(article)}
                    className="p-1.5 rounded-btn text-s-ink/30 hover:text-s-coral transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(article.id)}
                    className="p-1.5 rounded-btn text-s-ink/30 hover:text-s-coral transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
