"use client";

import { Badge } from "@/components/ui/badge";
import type { getDispensations } from "@/lib/actions/pharmacy";

type Dispensation = Awaited<ReturnType<typeof getDispensations>>[number];

const TYPE_LABEL: Record<string, string> = {
  VENTANILLA:            "Ventanilla",
  CON_RECETA:            "Con receta",
  MEDICAMENTO_PERMANENTE:"Med. permanente",
};
const TYPE_VARIANT: Record<string, "info" | "success" | "muted"> = {
  VENTANILLA:            "muted",
  CON_RECETA:            "success",
  MEDICAMENTO_PERMANENTE:"info",
};

const COL = {
  date:      "w-36  px-4 py-3",
  patient:   "w-auto px-4 py-3",
  type:      "w-40  px-4 py-3",
  items:     "w-auto px-4 py-3",
  pharmacist:"w-40  px-4 py-3",
};

interface Props { dispensations: Dispensation[] }

export function DispensationHistory({ dispensations }: Props) {
  if (dispensations.length === 0) {
    return <p className="text-[13px] text-iron-gray py-6 text-center">Sin despachos registrados aún</p>;
  }

  return (
    <div className="rounded-[12px] overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-[#222120]">
            <th className={`${COL.date}       text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide`}>Fecha</th>
            <th className={`${COL.patient}    text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide`}>Paciente</th>
            <th className={`${COL.type}       text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide`}>Modalidad</th>
            <th className={`${COL.items}      text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide`}>Medicamentos</th>
            <th className={`${COL.pharmacist} text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide`}>Despachado por</th>
          </tr>
        </thead>
        <tbody className="bg-ash-gray">
          {dispensations.map(d => {
            const patient = d.employee
              ? `${d.employee.lastName}, ${d.employee.firstName}`
              : d.dependent
              ? `${d.dependent.lastName}, ${d.dependent.firstName}`
              : "—";

            // Deduplicate products in items
            const products = [...new Map(d.items.map(i => [i.productId, i.product.genericName])).values()];

            return (
              <tr key={d.id} className="hover:bg-white/[0.04] transition-colors">
                <td className={`${COL.date} text-[12px] text-slate-gray`}>
                  <p>{new Date(d.createdAt).toLocaleDateString("es-HN")}</p>
                  <p className="text-[10px] text-iron-gray mt-0.5">
                    {new Date(d.createdAt).toLocaleTimeString("es-HN", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </td>
                <td className={COL.patient}>
                  <p className="text-[13px] text-pure-white">{patient}</p>
                  {d.employee?.employeeNumber && (
                    <p className="text-[11px] text-slate-gray font-mono mt-0.5">{d.employee.employeeNumber}</p>
                  )}
                </td>
                <td className={COL.type}>
                  <Badge variant={TYPE_VARIANT[d.type]}>{TYPE_LABEL[d.type]}</Badge>
                </td>
                <td className={COL.items}>
                  <div className="flex flex-wrap gap-1">
                    {products.slice(0, 3).map(name => (
                      <span key={name} className="text-[11px] text-slate-gray bg-[#222120] rounded px-1.5 py-0.5 truncate max-w-[140px]">
                        {name}
                      </span>
                    ))}
                    {products.length > 3 && (
                      <span className="text-[11px] text-iron-gray">+{products.length - 3}</span>
                    )}
                  </div>
                </td>
                <td className={`${COL.pharmacist} text-[12px] text-slate-gray`}>
                  {d.pharmacist.name ?? "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
