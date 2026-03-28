"use client";

import { useCallback, useState } from "react";

/**
 * Returns a triggerExport function that converts an array of objects
 * to CSV and triggers a browser download via a Blob URL.
 */
export function useExportCSV() {
  const [exporting, setExporting] = useState(false);

  const triggerExport = useCallback(
    (filename: string, rows: Record<string, unknown>[], headers?: string[]) => {
      if (!rows.length) return;
      setExporting(true);

      try {
        const keys = headers ?? Object.keys(rows[0]);
        const escape = (v: unknown) => {
          const s = v == null ? "" : String(v);
          return s.includes(",") || s.includes('"') || s.includes("\n")
            ? `"${s.replace(/"/g, '""')}"`
            : s;
        };

        const csvLines = [
          keys.join(","),
          ...rows.map((row) => keys.map((k) => escape(row[k])).join(",")),
        ];
        const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } finally {
        setExporting(false);
      }
    },
    []
  );

  return { triggerExport, exporting };
}
