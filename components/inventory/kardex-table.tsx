import { Badge } from "@/components/ui/badge";
import type { getKardex } from "@/lib/actions/inventory";

type Movement = Awaited<ReturnType<typeof getKardex>>[number];

const TYPE_CONFIG: Record<string, { label: string; variant: "success" | "danger" | "warning" | "info" | "muted" }> = {
  ENTRADA:       { label: "Entrada",       variant: "success" },
  SALIDA:        { label: "Salida",        variant: "danger"  },
  AJUSTE:        { label: "Ajuste",        variant: "warning" },
  TRANSFERENCIA: { label: "Transferencia", variant: "info"    },
  VENCIMIENTO:   { label: "Vencimiento",   variant: "muted"   },
  DEVOLUCION:    { label: "Devolución",    variant: "muted"   },
};

const COL = {
  date:  "w-36  px-4 py-3",
  type:  "w-28  px-4 py-3",
  batch: "w-32  px-4 py-3",
  qty:   "w-24  px-4 py-3 text-right",
  reason:"w-auto px-4 py-3",
  ref:   "w-32  px-4 py-3",
  user:  "w-36  px-4 py-3",
};

const TH = "text-[11px] font-medium text-slate-gray uppercase tracking-wide";

export function KardexTable({ movements }: { movements: Movement[] }) {
  if (movements.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-[13px] text-slate-gray">Sin movimientos registrados.</p>
      </div>
    );
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="bg-ash-gray/40">
          <th className={`${COL.date}  ${TH} text-left`}>Fecha</th>
          <th className={`${COL.type}  ${TH} text-left`}>Tipo</th>
          <th className={`${COL.batch} ${TH} text-left`}>Lote</th>
          <th className={`${COL.qty}   ${TH}`}>Cantidad</th>
          <th className={`${COL.reason}${TH} text-left`}>Motivo</th>
          <th className={`${COL.ref}   ${TH} text-left`}>Referencia</th>
          <th className={`${COL.user}  ${TH} text-left`}>Usuario</th>
        </tr>
      </thead>
      <tbody className="">
        {movements.map((m) => {
          const cfg = TYPE_CONFIG[m.type] ?? { label: m.type, variant: "muted" as const };
          const isPositive = m.quantity > 0;
          return (
            <tr key={m.id} className="hover:bg-ash-gray/30 transition-colors">
              <td className={`${COL.date} text-[12px] text-slate-gray whitespace-nowrap`}>
                {new Date(m.createdAt).toLocaleString("es-HN", {
                  day: "2-digit", month: "2-digit", year: "numeric",
                  hour: "2-digit", minute: "2-digit",
                })}
              </td>
              <td className={COL.type}>
                <Badge variant={cfg.variant}>{cfg.label}</Badge>
              </td>
              <td className={`${COL.batch} font-mono text-[12px] text-slate-gray`}>
                {m.batch?.batchNumber ?? "—"}
              </td>
              <td className={`${COL.qty} text-[13px] font-medium tabular-nums ${isPositive ? "text-emerald-green" : "text-blaze-orange"}`}>
                {isPositive ? "+" : ""}{m.quantity}
              </td>
              <td className={`${COL.reason} text-[12px] text-slate-gray`}>
                <span className="line-clamp-1">{m.reason ?? "—"}</span>
              </td>
              <td className={`${COL.ref} font-mono text-[12px] text-iron-gray`}>
                {m.reference ?? "—"}
              </td>
              <td className={`${COL.user} text-[12px] text-slate-gray`}>
                {m.user.name ?? m.user.email}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
