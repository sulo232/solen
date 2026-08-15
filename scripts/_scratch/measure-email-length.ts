// Throwaway measurement: how long are the emails actually, in words a reader sees.
import { EMAIL_PREVIEWS } from "../../lib/email-preview-samples";
const strip = (h: string) => h.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const rows = EMAIL_PREVIEWS.map((e) => {
  const p = e.build("de");
  return { id: e.id, subjLen: p.subject.length, bodyWords: strip(p.html).split(/\s+/).length };
}).sort((a, b) => b.bodyWords - a.bodyWords);
const w = rows.map((r) => r.bodyWords).sort((a, b) => a - b);
console.log("body words: min", w[0], "median", w[Math.floor(w.length / 2)], "max", w[w.length - 1]);
console.log("longest 8:"); rows.slice(0, 8).forEach((r) => console.log("   ", r.bodyWords, r.id));
console.log("shortest 5:"); rows.slice(-5).forEach((r) => console.log("   ", r.bodyWords, r.id));
const subj = rows.map((r) => r.subjLen).sort((a, b) => a - b);
console.log("subject chars: median", subj[Math.floor(subj.length / 2)], "max", subj[subj.length - 1],
  "| over 45 (cut off on a phone):", subj.filter((s) => s > 45).length, "of", subj.length);
