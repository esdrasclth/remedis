"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Plus, ArrowRight, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { getEmployees } from "@/lib/actions/patients";

type Employee = Awaited<ReturnType<typeof getEmployees>>[number];

const COL = {
  name:   "w-auto  px-4 py-3",
  emp:    "w-36    px-4 py-3",
  dept:   "w-44    px-4 py-3",
  gender: "w-28    px-4 py-3",
  appts:  "w-24    px-4 py-3 text-right",
  action: "w-20    px-4 py-3 text-right",
};

export function EmployeeTable({
  employees,
  clinicType = "EMPRESA",
}: {
  employees: Employee[];
  clinicType?: "EMPRESA" | "PRIVADA";
}) {
  const isPrivada = clinicType === "PRIVADA";
  const [search, setSearch] = useState("");

  const filtered = employees.filter(e => {
    const q = search.toLowerCase();
    return (
      e.firstName.toLowerCase().includes(q) ||
      e.lastName.toLowerCase().includes(q) ||
      e.employeeNumber.toLowerCase().includes(q) ||
      (e.department ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-iron-gray" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o número..."
            className="w-full bg-ash-gray rounded-[4px] pl-9 pr-3 py-2 text-[13px] text-pure-white placeholder:text-iron-gray focus:outline-none h-9"
          />
        </div>
        <Link href="/patients/new">
          <Button size="md">
            <Plus className="w-3.5 h-3.5" /> {isPrivada ? "Nuevo paciente" : "Nuevo empleado"}
          </Button>
        </Link>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-[12px] py-16 flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-ash-gray flex items-center justify-center">
            <Users className="w-5 h-5 text-iron-gray" />
          </div>
          <p className="text-[13px] text-slate-gray">
            {search
              ? "Sin resultados para esa búsqueda"
              : isPrivada ? "No hay pacientes registrados" : "No hay empleados registrados"}
          </p>
          {!search && (
            <Link href="/patients/new">
              <Button size="sm">
                <Plus className="w-3.5 h-3.5" />
                {isPrivada ? "Registrar primer paciente" : "Registrar primer empleado"}
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="rounded-[12px] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-table-header">
                <th className={`${COL.name}   text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide`}>Paciente</th>
                <th className={`${COL.emp}    text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide`}>
                  {isPrivada ? "N° Expediente" : "N° Empleado"}
                </th>
                {!isPrivada && (
                  <th className={`${COL.dept}   text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide`}>Departamento</th>
                )}
                <th className={`${COL.gender} text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide`}>Género</th>
                <th className={`${COL.appts}  text-[11px] font-medium text-slate-gray uppercase tracking-wide`}>Citas</th>
                <th className={COL.action} />
              </tr>
            </thead>
            <tbody className="bg-ash-gray">
              {filtered.map(e => (
                <tr key={e.id} className="hover:bg-white/[0.04] transition-colors group">
                  <td className={COL.name}>
                    <p className="text-[13px] text-pure-white font-medium">
                      {e.lastName}, {e.firstName}
                    </p>
                    {e.position && <p className="text-[11px] text-slate-gray mt-0.5">{e.position}</p>}
                  </td>
                  <td className={`${COL.emp} font-mono text-[12px] text-slate-gray`}>
                    {e.employeeNumber}
                  </td>
                  {!isPrivada && (
                    <td className={`${COL.dept} text-[12px] text-slate-gray`}>
                      {e.department ?? "—"}
                    </td>
                  )}
                  <td className={COL.gender}>
                    {e.gender ? (
                      <Badge variant="muted">
                        {e.gender === "MASCULINO" ? "M" : e.gender === "FEMENINO" ? "F" : "Otro"}
                      </Badge>
                    ) : <span className="text-[12px] text-iron-gray">—</span>}
                  </td>
                  <td className={`${COL.appts} text-[13px] text-slate-gray tabular-nums`}>
                    {e._count.appointments}
                  </td>
                  <td className={COL.action}>
                    <Link
                      href={`/patients/${e.id}`}
                      className="inline-flex items-center gap-1 text-[12px] text-iron-gray hover:text-pure-white opacity-0 group-hover:opacity-100 transition-all"
                    >
                      Ver <ArrowRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
