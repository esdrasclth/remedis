"use client";

import { useState, useTransition, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ChevronLeft, ChevronRight, Plus, CalendarDays, LayoutGrid,
  X, CheckCircle, Stethoscope, ArrowRight, List,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getAppointmentsRange, updateAppointmentStatus } from "@/lib/actions/appointments";

type AppointmentItem = Awaited<ReturnType<typeof getAppointmentsRange>>[number];
type View = "week" | "month" | "list";

// ─── Constants ────────────────────────────────────────────────────────────────

const HOUR_START  = 7;
const HOUR_END    = 20;
const TOTAL_HOURS = HOUR_END - HOUR_START;
const HOUR_PX     = 64; // px per hour

const STATUS_COLOR: Record<string, string> = {
  PROGRAMADA:  "#5683d2",
  CONFIRMADA:  "#00d638",
  EN_CONSULTA: "#e4f222",
  COMPLETADA:  "#4d505d",
  CANCELADA:   "#ff492c",
  NO_ASISTIO:  "#4d505d",
};
const STATUS_BG: Record<string, string> = {
  PROGRAMADA:  "rgba(86,131,210,0.18)",
  CONFIRMADA:  "rgba(0,214,56,0.18)",
  EN_CONSULTA: "rgba(228,242,34,0.18)",
  COMPLETADA:  "rgba(77,80,93,0.22)",
  CANCELADA:   "rgba(255,73,44,0.18)",
  NO_ASISTIO:  "rgba(77,80,93,0.22)",
};
const STATUS_LABEL: Record<string, string> = {
  PROGRAMADA:  "Programada",
  CONFIRMADA:  "Confirmada",
  EN_CONSULTA: "En consulta",
  COMPLETADA:  "Completada",
  CANCELADA:   "Cancelada",
  NO_ASISTIO:  "No asistió",
};
const STATUS_VARIANT: Record<string, "info" | "success" | "warning" | "danger" | "muted"> = {
  PROGRAMADA:  "info",
  CONFIRMADA:  "success",
  EN_CONSULTA: "warning",
  COMPLETADA:  "muted",
  CANCELADA:   "danger",
  NO_ASISTIO:  "muted",
};
const TYPE_LABEL: Record<string, string> = {
  PRIMERA_VEZ: "Primera vez",
  CONTROL:     "Control",
  URGENCIA:    "Urgencia",
  SEGUIMIENTO: "Seguimiento",
};
const DAY_SHORT   = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTH_NAMES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

// ─── Date helpers ─────────────────────────────────────────────────────────────

function mondayOf(d: Date): Date {
  const r = new Date(d);
  const day = r.getDay();
  r.setDate(r.getDate() - (day === 0 ? 6 : day - 1));
  r.setHours(0, 0, 0, 0);
  return r;
}
function addDays(d: Date, n: number): Date {
  const r = new Date(d); r.setDate(r.getDate() + n); return r;
}
function addMonths(d: Date, n: number): Date {
  const r = new Date(d); r.setMonth(r.getMonth() + n); return r;
}
function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function isToday(d: Date): boolean { return sameDay(d, new Date()); }
function monthStart(d: Date): Date { return new Date(d.getFullYear(), d.getMonth(), 1); }
function monthEnd(d: Date): Date   { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }

function fmt2(n: number): string { return String(n).padStart(2, "0"); }
function timeStr(d: Date): string { return `${fmt2(d.getHours())}:${fmt2(d.getMinutes())}`; }
function minsFrom7(d: Date): number { return (d.getHours() - HOUR_START) * 60 + d.getMinutes(); }

function patientName(a: AppointmentItem): string {
  if (a.employee)  return `${a.employee.firstName} ${a.employee.lastName}`;
  if (a.dependent) return `${a.dependent.firstName} ${a.dependent.lastName}`;
  return "Sin paciente";
}

// ─── Overlap layout ───────────────────────────────────────────────────────────

function layoutOverlaps(apts: AppointmentItem[]) {
  if (!apts.length) return [] as { apt: AppointmentItem; col: number; cols: number }[];
  const sorted = [...apts].sort((a, b) =>
    new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  );
  const columns: { endMs: number; items: AppointmentItem[] }[] = [];

  for (const apt of sorted) {
    const startMs = new Date(apt.scheduledAt).getTime();
    let placed = false;
    for (const col of columns) {
      if (startMs >= col.endMs) {
        col.items.push(apt);
        col.endMs = startMs + apt.duration * 60000;
        placed = true;
        break;
      }
    }
    if (!placed) columns.push({ endMs: startMs + apt.duration * 60000, items: [apt] });
  }

  const result: { apt: AppointmentItem; col: number; cols: number }[] = [];
  const totalCols = columns.length;
  columns.forEach((col, ci) => {
    col.items.forEach(apt => result.push({ apt, col: ci, cols: totalCols }));
  });
  return result;
}

// ─── Root component ───────────────────────────────────────────────────────────

interface Props {
  tenantId:            string;
  initialAppointments: AppointmentItem[];
  initialWeekStart:    string; // ISO date string
}

export function CalendarView({ tenantId, initialAppointments, initialWeekStart }: Props) {
  const [view,         setView]         = useState<View>("week");
  const [currentDate,  setCurrentDate]  = useState(new Date());
  const [appointments, setAppointments] = useState<AppointmentItem[]>(initialAppointments);
  const [selected,     setSelected]     = useState<AppointmentItem | null>(null);
  const [isPending,    startTransition]  = useTransition();
  const firstRender = useRef(true);

  const weekStart = mondayOf(currentDate);
  const weekEnd   = addDays(weekStart, 6);
  const mStart    = monthStart(currentDate);
  const mEnd      = monthEnd(currentDate);

  const fetchRange = useCallback((start: Date, end: Date) => {
    const endOfDay = new Date(end); endOfDay.setHours(23, 59, 59, 999);
    startTransition(async () => {
      const data = await getAppointmentsRange(tenantId, start, endOfDay);
      setAppointments(data);
    });
  }, [tenantId]);

  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    if (view === "week" || view === "list") {
      fetchRange(weekStart, weekEnd);
    } else {
      fetchRange(mondayOf(mStart), addDays(mondayOf(mEnd), 6));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, currentDate.toDateString()]);

  function prev() {
    if (view === "month") setCurrentDate(d => addMonths(d, -1));
    else setCurrentDate(d => addDays(d, -7));
  }
  function next() {
    if (view === "month") setCurrentDate(d => addMonths(d, 1));
    else setCurrentDate(d => addDays(d, 7));
  }
  function goToday() { setCurrentDate(new Date()); }

  const headerText = view === "month"
    ? `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`
    : `${weekStart.getDate()} – ${weekEnd.getDate()} ${MONTH_NAMES[weekEnd.getMonth()]} ${weekEnd.getFullYear()}`;

  // Update selected when appointments refresh
  useEffect(() => {
    if (!selected) return;
    const fresh = appointments.find(a => a.id === selected.id);
    if (fresh) setSelected(fresh);
  }, [appointments]);

  return (
    <div className="flex flex-col gap-4" style={{ minHeight: "calc(100vh - 140px)" }}>

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={goToday}
            className="px-3 py-1.5 rounded-[6px] text-[12px] font-medium text-pure-white border border-white/[0.12] hover:border-white/[0.25] transition-colors"
          >
            Hoy
          </button>
          <div className="flex items-center">
            <button
              onClick={prev}
              className="p-1.5 rounded-l-[6px] text-iron-gray hover:text-pure-white hover:bg-white/[0.05] transition-colors border border-white/[0.08]"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={next}
              className="p-1.5 rounded-r-[6px] text-iron-gray hover:text-pure-white hover:bg-white/[0.05] transition-colors border border-white/[0.08] border-l-0"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <span className="text-[15px] font-medium text-pure-white capitalize select-none">
            {headerText}
          </span>
          {isPending && (
            <span className="text-[11px] text-iron-gray animate-pulse">Actualizando…</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center rounded-[8px] border border-white/[0.08] overflow-hidden">
            {(["week", "month", "list"] as View[]).map(v => {
              const Icon = v === "week" ? CalendarDays : v === "month" ? LayoutGrid : List;
              const label = v === "week" ? "Semana" : v === "month" ? "Mes" : "Lista";
              return (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium transition-colors border-r border-white/[0.08] last:border-r-0 ${
                    view === v
                      ? "bg-white/[0.1] text-pure-white"
                      : "text-iron-gray hover:text-slate-gray hover:bg-white/[0.03]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" /> {label}
                </button>
              );
            })}
          </div>
          <Link href="/appointments/new">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[13px] font-medium bg-sunbeam-yellow text-charcoal-black hover:opacity-90 transition-opacity">
              <Plus className="w-3.5 h-3.5" /> Nueva cita
            </button>
          </Link>
        </div>
      </div>

      {/* ── Legend ── */}
      <div className="flex items-center gap-4 flex-wrap">
        {Object.entries(STATUS_LABEL).map(([key, label]) => (
          <span key={key} className="flex items-center gap-1.5 text-[11px] text-iron-gray">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: STATUS_COLOR[key] }} />
            {label}
          </span>
        ))}
      </div>

      {/* ── Main ── */}
      <div className="flex gap-4 flex-1 min-h-0">
        <div className={`flex-1 min-w-0 transition-all overflow-hidden`}>
          {view === "week" && (
            <WeekView
              appointments={appointments}
              weekStart={weekStart}
              onSelect={setSelected}
              selectedId={selected?.id}
            />
          )}
          {view === "month" && (
            <MonthView
              appointments={appointments}
              currentDate={currentDate}
              onSelect={setSelected}
              selectedId={selected?.id}
              onDayDrill={d => { setCurrentDate(d); setView("week"); }}
            />
          )}
          {view === "list" && (
            <ListView
              appointments={appointments}
              weekStart={weekStart}
              weekEnd={weekEnd}
              onSelect={setSelected}
              selectedId={selected?.id}
            />
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-72 flex-shrink-0">
            <DetailPanel
              apt={selected}
              tenantId={tenantId}
              onClose={() => setSelected(null)}
              onStatusChange={() => {
                const range = view === "month"
                  ? { start: mondayOf(mStart), end: addDays(mondayOf(mEnd), 6) }
                  : { start: weekStart, end: weekEnd };
                fetchRange(range.start, range.end);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Week View ────────────────────────────────────────────────────────────────

function WeekView({
  appointments, weekStart, onSelect, selectedId,
}: {
  appointments: AppointmentItem[];
  weekStart: Date;
  onSelect: (a: AppointmentItem) => void;
  selectedId?: string;
}) {
  const days       = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const totalPx    = TOTAL_HOURS * HOUR_PX;
  const scrollRef  = useRef<HTMLDivElement>(null);

  // Scroll to ~8am on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = HOUR_PX * 1; // 1 hour offset (8am)
    }
  }, []);

  // Group by day
  const byDay = new Map<number, AppointmentItem[]>();
  for (let i = 0; i < 7; i++) byDay.set(i, []);
  for (const apt of appointments) {
    const d = new Date(apt.scheduledAt);
    for (let i = 0; i < 7; i++) {
      if (sameDay(d, days[i])) { byDay.get(i)!.push(apt); break; }
    }
  }

  const hours = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => HOUR_START + i);

  return (
    <div className="rounded-[12px] border border-white/[0.07] bg-[#141210] overflow-hidden" style={{ minHeight: 600 }}>
      {/* Single scroll container — header is sticky inside so columns always align */}
      <div
        ref={scrollRef}
        className="overflow-y-auto"
        style={{
          maxHeight: "calc(100vh - 200px)",
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(255,255,255,0.1) transparent",
        }}
      >
        {/* Sticky day headers */}
        <div
          className="grid sticky top-0 z-10 bg-[#1a1917] border-b border-white/[0.07]"
          style={{ gridTemplateColumns: "52px repeat(7, 1fr)" }}
        >
          <div /> {/* spacer for time column */}
          {days.map((day, i) => {
            const today = isToday(day);
            return (
              <div key={i} className="border-l border-white/[0.07] py-3 text-center">
                <p className="text-[10px] font-medium uppercase tracking-widest text-iron-gray">{DAY_SHORT[i]}</p>
                <div className={`mx-auto mt-1 w-7 h-7 rounded-full flex items-center justify-center ${today ? "bg-sunbeam-yellow" : ""}`}>
                  <span className={`text-[14px] font-semibold ${today ? "text-[#0c0a08]" : "text-pure-white"}`}>
                    {day.getDate()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Time grid */}
        <div className="grid relative" style={{ gridTemplateColumns: "52px repeat(7, 1fr)", height: totalPx }}>

          {/* Time labels — skip HOUR_START to avoid clipping; first visible at HOUR_START+1 */}
          <div className="relative select-none">
            {hours.map(h => (
              h > HOUR_START && h < HOUR_END && (
                <div
                  key={h}
                  className="absolute right-2 text-[10px] font-mono text-iron-gray"
                  style={{ top: (h - HOUR_START) * HOUR_PX - 7 }}
                >
                  {`${fmt2(h)}:00`}
                </div>
              )
            ))}
          </div>

          {/* Day columns */}
          {days.map((day, dayIdx) => {
            const today  = isToday(day);
            const laidOut = layoutOverlaps(byDay.get(dayIdx) ?? []);

            return (
              <div
                key={dayIdx}
                className={`relative border-l border-white/[0.06] ${today ? "bg-white/[0.01]" : ""}`}
              >
                {/* Hour grid lines */}
                {hours.map(h => (
                  <div
                    key={h}
                    className="absolute inset-x-0 border-t border-white/[0.06]"
                    style={{ top: (h - HOUR_START) * HOUR_PX }}
                  />
                ))}
                {/* Half-hour dashed lines */}
                {Array.from({ length: TOTAL_HOURS }, (_, i) => (
                  <div
                    key={`h${i}`}
                    className="absolute inset-x-0 border-t border-white/[0.03]"
                    style={{ top: i * HOUR_PX + HOUR_PX / 2 }}
                  />
                ))}

                {/* Current time indicator */}
                {today && <NowLine />}

                {/* Appointments */}
                {laidOut.map(({ apt, col, cols }) => {
                  const start  = new Date(apt.scheduledAt);
                  const mins   = minsFrom7(start);
                  if (mins < 0 || mins >= TOTAL_HOURS * 60) return null;
                  const top    = mins * (HOUR_PX / 60);
                  const height = Math.max(apt.duration * (HOUR_PX / 60), 22);
                  const color  = STATUS_COLOR[apt.status];
                  const bg     = STATUS_BG[apt.status];
                  const wPct   = 100 / cols;
                  const lPct   = col * wPct;
                  const isSelected = apt.id === selectedId;
                  const compact = height < 36;

                  return (
                    <button
                      key={apt.id}
                      onClick={() => onSelect(apt)}
                      className="absolute text-left overflow-hidden transition-all hover:brightness-110 focus:outline-none"
                      style={{
                        top:     top + 1,
                        height:  height - 2,
                        left:    `calc(${lPct}% + 2px)`,
                        width:   `calc(${wPct}% - 4px)`,
                        background: bg,
                        borderLeft: `2.5px solid ${color}`,
                        borderRadius: "0 4px 4px 0",
                        boxShadow: isSelected ? `0 0 0 1.5px ${color}` : "none",
                        padding:  compact ? "1px 4px" : "3px 6px",
                      }}
                    >
                      <p className="text-[10px] font-semibold leading-tight truncate" style={{ color }}>
                        {timeStr(start)}
                      </p>
                      {!compact && (
                        <p className="text-[11px] font-medium text-pure-white truncate leading-tight">
                          {patientName(apt)}
                        </p>
                      )}
                      {height >= 52 && apt.doctor.name && (
                        <p className="text-[10px] text-iron-gray truncate">{apt.doctor.name}</p>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div> {/* end time grid */}
      </div> {/* end scroll container */}
    </div>
  );
}

function NowLine() {
  const now  = new Date();
  const mins = minsFrom7(now);
  if (mins < 0 || mins > TOTAL_HOURS * 60) return null;
  const top = mins * (HOUR_PX / 60);
  return (
    <div className="absolute inset-x-0 z-10 pointer-events-none flex items-center" style={{ top }}>
      <div className="w-2 h-2 rounded-full bg-red-400 -ml-1 flex-shrink-0" />
      <div className="flex-1 h-px bg-red-400 opacity-60" />
    </div>
  );
}

// ─── Month View ───────────────────────────────────────────────────────────────

function MonthView({
  appointments, currentDate, onSelect, selectedId, onDayDrill,
}: {
  appointments: AppointmentItem[];
  currentDate: Date;
  onSelect: (a: AppointmentItem) => void;
  selectedId?: string;
  onDayDrill: (d: Date) => void;
}) {
  const mStart_   = monthStart(currentDate);
  const mEnd_     = monthEnd(currentDate);
  const gridStart = mondayOf(mStart_);

  // Always show 6 weeks (42 cells)
  const cells: Date[] = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const curMonth = currentDate.getMonth();

  function getDayApts(day: Date) {
    return appointments.filter(a => sameDay(new Date(a.scheduledAt), day));
  }

  const MAX = 3;

  return (
    <div className="rounded-[12px] border border-white/[0.07] bg-[#141210] overflow-hidden" style={{ minHeight: 600 }}>
      {/* Day names header */}
      <div className="grid grid-cols-7 bg-[#1a1917] border-b border-white/[0.07]">
        {DAY_SHORT.map(d => (
          <div key={d} className="py-2.5 text-center text-[10px] font-medium text-iron-gray uppercase tracking-widest">
            {d}
          </div>
        ))}
      </div>

      {/* Month grid */}
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          const dayApts  = getDayApts(day);
          const inMonth  = day.getMonth() === curMonth;
          const today_   = isToday(day);
          const isLastRow = i >= 35;

          return (
            <div
              key={i}
              className={`border-r border-b border-white/[0.05] p-1.5 min-h-[100px] ${
                !inMonth ? "opacity-25" : ""
              } ${today_ ? "bg-white/[0.015]" : ""} ${isLastRow ? "border-b-0" : ""}`}
            >
              <button
                onClick={() => onDayDrill(day)}
                className={`w-6 h-6 flex items-center justify-center rounded-full text-[12px] font-medium mb-1 transition-colors hover:bg-white/[0.08] ${
                  today_ ? "bg-sunbeam-yellow text-[#0c0a08]" : "text-pure-white"
                }`}
              >
                {day.getDate()}
              </button>

              <div className="space-y-0.5">
                {dayApts.slice(0, MAX).map(apt => {
                  const color = STATUS_COLOR[apt.status];
                  const bg    = STATUS_BG[apt.status];
                  return (
                    <button
                      key={apt.id}
                      onClick={e => { e.stopPropagation(); onSelect(apt); }}
                      className="w-full text-left rounded-[3px] px-1 py-0.5 flex items-center gap-1 hover:brightness-110 transition-all overflow-hidden"
                      style={{
                        background:  bg,
                        borderLeft:  `2px solid ${color}`,
                        boxShadow:   apt.id === selectedId ? `0 0 0 1px ${color}` : "none",
                      }}
                    >
                      <span className="text-[10px] font-mono flex-shrink-0" style={{ color }}>
                        {timeStr(new Date(apt.scheduledAt))}
                      </span>
                      <span className="text-[10px] text-pure-white truncate">
                        {patientName(apt)}
                      </span>
                    </button>
                  );
                })}
                {dayApts.length > MAX && (
                  <button
                    onClick={() => onDayDrill(day)}
                    className="text-[10px] text-iron-gray hover:text-slate-gray transition-colors w-full text-left px-1"
                  >
                    +{dayApts.length - MAX} más
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── List View ────────────────────────────────────────────────────────────────

function ListView({
  appointments, weekStart, weekEnd, onSelect, selectedId,
}: {
  appointments: AppointmentItem[];
  weekStart: Date;
  weekEnd: Date;
  onSelect: (a: AppointmentItem) => void;
  selectedId?: string;
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="space-y-3">
      {days.map((day, di) => {
        const dayApts = appointments.filter(a => sameDay(new Date(a.scheduledAt), day));
        const today_  = isToday(day);
        return (
          <div key={di}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-[12px] font-semibold uppercase tracking-wide ${today_ ? "text-sunbeam-yellow" : "text-iron-gray"}`}>
                {DAY_SHORT[di]} {day.getDate()}
              </span>
              {dayApts.length > 0 && (
                <span className="text-[11px] text-iron-gray">{dayApts.length} cita{dayApts.length !== 1 ? "s" : ""}</span>
              )}
              <div className="flex-1 h-px bg-white/[0.05]" />
            </div>
            {dayApts.length === 0 ? (
              <p className="text-[12px] text-iron-gray pl-1 pb-2">Sin citas</p>
            ) : (
              <div className="rounded-[10px] overflow-hidden border border-white/[0.06]">
                {dayApts.map((apt, ai) => {
                  const color    = STATUS_COLOR[apt.status];
                  const isLast   = ai === dayApts.length - 1;
                  const isSel    = apt.id === selectedId;
                  return (
                    <button
                      key={apt.id}
                      onClick={() => onSelect(apt)}
                      className={`w-full text-left flex items-center gap-4 px-4 py-3 transition-colors hover:bg-white/[0.04] ${
                        !isLast ? "border-b border-white/[0.04]" : ""
                      } ${isSel ? "bg-white/[0.05]" : "bg-[#141210]"}`}
                    >
                      <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: color }} />
                      <div className="w-12 flex-shrink-0">
                        <p className="text-[13px] font-mono font-medium text-pure-white">{timeStr(new Date(apt.scheduledAt))}</p>
                        <p className="text-[10px] text-iron-gray">{apt.duration} min</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-pure-white truncate">{patientName(apt)}</p>
                        <p className="text-[11px] text-iron-gray truncate">{TYPE_LABEL[apt.type]} · {apt.doctor.name ?? "—"}</p>
                      </div>
                      <Badge variant={STATUS_VARIANT[apt.status]}>{STATUS_LABEL[apt.status]}</Badge>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function DetailPanel({
  apt, tenantId, onClose, onStatusChange,
}: {
  apt: AppointmentItem;
  tenantId: string;
  onClose: () => void;
  onStatusChange: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const color    = STATUS_COLOR[apt.status];
  const patient  = patientName(apt);
  const dateTime = new Date(apt.scheduledAt);

  function advance(status: "CONFIRMADA" | "EN_CONSULTA" | "COMPLETADA" | "NO_ASISTIO") {
    startTransition(async () => {
      await updateAppointmentStatus(tenantId, apt.id, status);
      onStatusChange();
    });
  }

  return (
    <div
      className="rounded-[12px] border border-white/[0.08] bg-[#1a1917] flex flex-col overflow-y-auto"
      style={{ borderTop: `3px solid ${color}`, maxHeight: "calc(100vh - 180px)" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between p-4 pb-3">
        <div className="space-y-1">
          <Badge variant={STATUS_VARIANT[apt.status]}>{STATUS_LABEL[apt.status]}</Badge>
          <p className="text-[14px] font-semibold text-pure-white mt-1">{patient}</p>
          <p className="text-[11px] text-iron-gray">{TYPE_LABEL[apt.type]}</p>
        </div>
        <button onClick={onClose} className="text-iron-gray hover:text-pure-white transition-colors mt-0.5">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Info rows */}
      <div className="px-4 space-y-3 pb-4 border-b border-white/[0.06]">
        <Row label="Fecha">
          {dateTime.toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </Row>
        <Row label="Hora">
          {timeStr(dateTime)} — {timeStr(new Date(dateTime.getTime() + apt.duration * 60000))}
        </Row>
        <Row label="Duración">{apt.duration} minutos</Row>
        <Row label="Médico">{apt.doctor.name ?? "—"}</Row>
        {apt.employee?.employeeNumber && (
          <Row label="N° empleado">{apt.employee.employeeNumber}</Row>
        )}
        {apt.notes && <Row label="Notas">{apt.notes}</Row>}
      </div>

      {/* Actions */}
      <div className="p-4 space-y-2">
        {apt.status === "PROGRAMADA" && (
          <ActionBtn
            onClick={() => advance("CONFIRMADA")}
            color="#00d638"
            icon={<CheckCircle className="w-3.5 h-3.5" />}
            label="Confirmar cita"
            disabled={isPending}
          />
        )}
        {(apt.status === "PROGRAMADA" || apt.status === "CONFIRMADA") && (
          <Link href={`/medical-records/new?appointmentId=${apt.id}`} className="block">
            <ActionBtn
              color="#e4f222"
              icon={<Stethoscope className="w-3.5 h-3.5" />}
              label="Iniciar consulta"
              disabled={isPending}
            />
          </Link>
        )}
        {(apt.status === "PROGRAMADA" || apt.status === "CONFIRMADA") && (
          <ActionBtn
            onClick={() => advance("NO_ASISTIO")}
            color="#4d505d"
            icon={<X className="w-3.5 h-3.5" />}
            label="No asistió"
            disabled={isPending}
          />
        )}
        {apt.medicalRecord && (
          <Link href={`/medical-records/${apt.medicalRecord.id}`} className="block">
            <ActionBtn
              color="#5683d2"
              icon={<ArrowRight className="w-3.5 h-3.5" />}
              label="Ver expediente"
              disabled={false}
            />
          </Link>
        )}
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-medium text-iron-gray uppercase tracking-wide">{label}</p>
      <p className="text-[12px] text-pure-white mt-0.5 capitalize">{children}</p>
    </div>
  );
}

function ActionBtn({
  onClick, color, icon, label, disabled,
}: {
  onClick?: () => void;
  color: string;
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-[8px] text-[12px] font-medium transition-all disabled:opacity-40"
      style={{
        background: `${color}1f`,
        color,
        border: `1px solid ${color}40`,
      }}
    >
      {icon} {label}
    </button>
  );
}
