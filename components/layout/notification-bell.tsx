"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { Bell, X, Check, CheckCheck, AlertTriangle, Clock, Package, Pill, FileText } from "lucide-react";
import { getAlerts, markAlertRead, markAllRead, generateSystemAlerts, type AlertItem } from "@/lib/actions/alerts";

const TYPE_CONFIG: Record<string, {
  icon: React.ElementType;
  color: string;
  bg: string;
  label: string;
}> = {
  STOCK_MINIMO:       { icon: Package,       color: "text-blaze-orange", bg: "bg-blaze-orange/15",   label: "Stock bajo" },
  VENCIMIENTO_PROXIMO:{ icon: Clock,         color: "text-sunbeam-yellow", bg: "bg-sunbeam-yellow/15", label: "Por vencer" },
  MEDICAMENTO_VENCIDO:{ icon: AlertTriangle, color: "text-blaze-orange", bg: "bg-blaze-orange/15",   label: "Vencido" },
  RECETA_VENCIDA:     { icon: FileText,      color: "text-blaze-orange", bg: "bg-blaze-orange/15",   label: "Receta vencida" },
  CITA_RECORDATORIO:  { icon: Bell,          color: "text-deep-sea-blue", bg: "bg-deep-sea-blue/15", label: "Cita" },
};

function timeAgo(date: Date) {
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 1)  return "ahora";
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `hace ${days}d`;
}

interface NotificationBellProps {
  tenantId: string;
}

export function NotificationBell({ tenantId }: NotificationBellProps) {
  const [open, setOpen]       = useState(false);
  const [alerts, setAlerts]   = useState<AlertItem[]>([]);
  const [loaded, setLoaded]   = useState(false);
  const [pending, startTransition] = useTransition();
  const panelRef = useRef<HTMLDivElement>(null);

  const unread = alerts.filter(a => a.status === "PENDIENTE").length;

  // Load alerts on open or every 2 minutes in background
  useEffect(() => {
    async function load() {
      await generateSystemAlerts(tenantId);
      const data = await getAlerts(tenantId);
      setAlerts(data);
      setLoaded(true);
    }
    load();
    const timer = setInterval(load, 120_000);
    return () => clearInterval(timer);
  }, [tenantId]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  function handleMarkRead(id: string) {
    startTransition(async () => {
      await markAlertRead(id);
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: "LEIDA" } : a));
    });
  }

  function handleMarkAllRead() {
    startTransition(async () => {
      await markAllRead(tenantId);
      setAlerts(prev => prev.map(a => ({ ...a, status: "LEIDA" })));
    });
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="relative w-8 h-8 flex items-center justify-center rounded-[4px] text-slate-gray hover:text-pure-white hover:bg-ash-gray transition-colors"
        title="Notificaciones"
      >
        <Bell className="w-4 h-4" strokeWidth={1.5} />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[14px] h-[14px] rounded-full bg-blaze-orange flex items-center justify-center">
            <span className="text-[9px] font-bold text-white leading-none px-0.5">
              {unread > 9 ? "9+" : unread}
            </span>
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="absolute right-0 top-10 w-[360px] rounded-[12px] shadow-2xl z-50 overflow-hidden border border-white/[0.06]"
          style={{ background: "#1a1917" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-medium text-pure-white">Notificaciones</span>
              {unread > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-blaze-orange text-[10px] font-bold text-white">
                  {unread}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={pending}
                  className="flex items-center gap-1 text-[11px] text-slate-gray hover:text-pure-white transition-colors px-2 py-1 rounded"
                  title="Marcar todas como leídas"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Leer todo
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-iron-gray hover:text-pure-white p-1 rounded">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Alerts list */}
          <div className="max-h-[400px] overflow-y-auto">
            {!loaded ? (
              <div className="py-8 text-center">
                <p className="text-[12px] text-iron-gray animate-pulse">Cargando...</p>
              </div>
            ) : alerts.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="w-8 h-8 text-iron-gray mx-auto mb-2" strokeWidth={1} />
                <p className="text-[13px] text-slate-gray">Sin notificaciones</p>
                <p className="text-[11px] text-iron-gray mt-1">Todo está en orden</p>
              </div>
            ) : (
              alerts.map(alert => {
                const cfg = TYPE_CONFIG[alert.type] ?? TYPE_CONFIG.CITA_RECORDATORIO;
                const Icon = cfg.icon;
                const isUnread = alert.status === "PENDIENTE";

                return (
                  <div
                    key={alert.id}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-white/[0.04] transition-colors ${
                      isUnread ? "bg-white/[0.03]" : ""
                    } hover:bg-white/[0.05]`}
                  >
                    <div className={`w-7 h-7 rounded-full ${cfg.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                      <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wide ${cfg.color}`}>
                          {cfg.label}
                        </span>
                        {isUnread && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blaze-orange shrink-0" />
                        )}
                      </div>
                      <p className="text-[12px] text-pure-white mt-0.5 leading-snug">{alert.message}</p>
                      <p className="text-[10px] text-iron-gray mt-1">{timeAgo(alert.createdAt)}</p>
                    </div>
                    {isUnread && (
                      <button
                        onClick={() => handleMarkRead(alert.id)}
                        className="text-iron-gray hover:text-pure-white transition-colors shrink-0 mt-0.5"
                        title="Marcar como leída"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
