"use client";

import { useState } from "react";
import { Download, FileText, FileSpreadsheet, Loader2 } from "lucide-react";

interface ExportButtonsProps {
  pdfUrl?: string;
  xlsxUrl?: string;
  label?: string;
  compact?: boolean;
}

export function ExportButtons({ pdfUrl, xlsxUrl, label = "Exportar", compact = false }: ExportButtonsProps) {
  const [loading, setLoading] = useState<"pdf" | "xlsx" | null>(null);

  async function download(url: string, type: "pdf" | "xlsx") {
    setLoading(type);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Error al generar");
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = url.split("/").pop()?.split("?")[0] + (type === "pdf" ? ".pdf" : ".xlsx") || `export.${type}`;
      // Use the Content-Disposition filename if available
      const cd = res.headers.get("content-disposition");
      if (cd) {
        const match = cd.match(/filename="([^"]+)"/);
        if (match) a.download = match[1];
      }
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      // silently ignore
    } finally {
      setLoading(null);
    }
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {pdfUrl && (
          <button
            onClick={() => download(pdfUrl, "pdf")}
            disabled={!!loading}
            title="Descargar PDF"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] text-[12px] text-slate-gray hover:text-pure-white hover:bg-ash-gray transition-colors disabled:opacity-50"
          >
            {loading === "pdf" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileText className="w-3.5 h-3.5" />
            )}
            PDF
          </button>
        )}
        {xlsxUrl && (
          <button
            onClick={() => download(xlsxUrl, "xlsx")}
            disabled={!!loading}
            title="Descargar Excel"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] text-[12px] text-slate-gray hover:text-pure-white hover:bg-ash-gray transition-colors disabled:opacity-50"
          >
            {loading === "xlsx" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-3.5 h-3.5" />
            )}
            Excel
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {pdfUrl && (
        <button
          onClick={() => download(pdfUrl, "pdf")}
          disabled={!!loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-[6px] text-[13px] font-medium text-slate-gray bg-ash-gray hover:text-pure-white hover:bg-white/10 transition-colors disabled:opacity-50"
        >
          {loading === "pdf" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <FileText className="w-3.5 h-3.5 text-blaze-orange" />
          )}
          {label} PDF
        </button>
      )}
      {xlsxUrl && (
        <button
          onClick={() => download(xlsxUrl, "xlsx")}
          disabled={!!loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-[6px] text-[13px] font-medium text-slate-gray bg-ash-gray hover:text-pure-white hover:bg-white/10 transition-colors disabled:opacity-50"
        >
          {loading === "xlsx" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-green" />
          )}
          {label} Excel
        </button>
      )}
    </div>
  );
}
