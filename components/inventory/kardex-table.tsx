import { Badge } from "@/components/ui/badge";
import type { getKardex } from "@/lib/actions/inventory";

type Movement = Awaited<ReturnType<typeof getKardex>>[number];

const TYPE_CONFIG: Record<
  string,
  { label: string; variant: "success" | "danger" | "warning" | "info" | "muted" }
> = {
  ENTRADA:       { label: "Entrada",       variant: "success" },
  SALIDA:        { label: "Salida",        variant: "danger"  },
  AJUSTE:        { label: "Ajuste",        variant: "warning" },
  TRANSFERENCIA: { label: "Transferencia", variant: "info"    },
  VENCIMIENTO:   { label: "Vencimiento",   variant: "muted"   },
  DEVOLUCION:    { label: "Devolución",    variant: "muted"   },
};

export function KardexTable({ movements }: { movements: Movement[] }) {
  if (movements.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-slate-gray text-[14px]">Sin movimientos registrados.</p>
      </div>
    );
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-iron-gray/40">
          <Th>Fecha</Th>
          <Th>Tipo</Th>
          <Th>Lote</Th>
          <Th align="right">Cantidad</Th>
          <Th>Motivo</Th>
          <Th>Referencia</Th>
          <Th>Usuario</Th>
        </tr>
      </thead>
      <tbody>
        {movements.map((m) => {
          const config = TYPE_CONFIG[m.type] ?? { label: m.type, variant: "muted" as const };
          const isPositive = m.quantity > 0;
          return (
            <tr key={m.id} className="border-b border-iron-gray/20 hover:bg-ocean-abyss/40 transition-colors">
              <td className="px-4 py-3 text-[12px] text-slate-gray whitespace-nowrap">
                {new Date(m.createdAt).toLocaleString("es-HN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </td>
              <td className="px-4 py-3">
                <Badge variant={config.variant}>{config.label}</Badge>
              </td>
              <td className="px-4 py-3 text-[12px] text-slate-gray font-mono">
                {m.batch?.batchNumber ?? "—"}
              </td>
              <td className="px-4 py-3 text-right">
                <span
                  className={`text-[13px] font-medium ${isPositive ? "text-emerald-green" : "text-blaze-orange"}`}
                  style={{ fontFeatureSettings: '"ss01"' }}
                >
                  {isPositive ? "+" : ""}{m.quantity}
                </span>
              </td>
              <td className="px-4 py-3 text-[12px] text-slate-gray max-w-[200px] truncate">
                {m.reason ?? "—"}
              </td>
              <td className="px-4 py-3 text-[12px] text-slate-gray font-mono">
                {m.reference ?? "—"}
              </td>
              <td className="px-4 py-3 text-[12px] text-slate-gray">
                {m.user.name ?? m.user.email}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function Th({ children, align = "left" }: { children?: React.ReactNode; align?: "left" | "right" }) {
  return (
    <th className={`px-4 py-3 text-[11px] text-slate-gray uppercase tracking-wide font-medium text-${align}`}>
      {children}
    </th>
  );
}
