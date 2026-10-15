"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { createWarehouse, updateWarehouse, deactivateWarehouse } from "@/lib/actions/settings";

type Warehouse = { id: string; name: string; source: string; isActive: boolean };

interface Props {
  tenantId: string;
  warehouses: Warehouse[];
  clinicType?: "EMPRESA" | "PRIVADA";
}

const SOURCE_LABEL: Record<string, string> = { EMPRESA: "Empresa", IHSS: "Seguro Social" };
const SOURCES_EMPRESA = ["EMPRESA", "IHSS"] as const;
const SOURCES_PRIVADA = ["EMPRESA"] as const;

type ModalMode = "create" | "edit";

export function WarehousesPanel({ tenantId, warehouses: initial, clinicType = "EMPRESA" }: Props) {
  const sources = clinicType === "PRIVADA" ? SOURCES_PRIVADA : SOURCES_EMPRESA;
  const router   = useRouter();
  const [wh,     setWh]     = useState(initial);
  const [modal,  setModal]  = useState(false);
  const [mode,   setMode]   = useState<ModalMode>("create");
  const [editId, setEditId] = useState<string | null>(null);

  const [name,   setName]   = useState("");
  const [source, setSource] = useState<string>("EMPRESA");
  const [error,  setError]  = useState("");
  const [busy,   setBusy]   = useState(false);

  function openCreate() {
    setMode("create"); setName(""); setSource("EMPRESA"); setError(""); setModal(true);
  }

  function openEdit(w: Warehouse) {
    setMode("edit"); setEditId(w.id); setName(w.name); setSource(w.source); setError(""); setModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    const payload = { name, source };
    const res = mode === "create"
      ? await createWarehouse(tenantId, payload)
      : await updateWarehouse(tenantId, editId!, payload);

    if (res.success) {
      setModal(false);
      router.refresh();
    } else setError(res.error);
    setBusy(false);
  }

  async function handleDeactivate(id: string) {
    if (!confirm("¿Desactivar este almacén? Los lotes existentes no se verán afectados.")) return;
    await deactivateWarehouse(tenantId, id);
    setWh(w => w.filter(x => x.id !== id));
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-slate-gray">{wh.length} almacén{wh.length !== 1 ? "es" : ""}</p>
        <Button size="sm" onClick={openCreate}>
          <Plus className="w-3.5 h-3.5" /> Nuevo almacén
        </Button>
      </div>

      <div className="bg-ash-gray rounded-[12px] overflow-hidden">
        {wh.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-[13px] text-slate-gray">Sin almacenes configurados</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-table-header">
                <th className="px-4 py-2.5 text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide">Nombre</th>
                <th className="w-28 px-4 py-2.5 text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide">Fuente</th>
                <th className="w-28 px-4 py-2.5 text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide">Estado</th>
                <th className="w-20 px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {wh.map(w => (
                <tr key={w.id} className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-[13px] text-pure-white font-medium">{w.name}</td>
                  <td className="px-4 py-3">
                    <Badge variant={w.source === "IHSS" ? "info" : "muted"}>
                      {SOURCE_LABEL[w.source] ?? w.source}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={w.isActive ? "success" : "muted"}>
                      {w.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(w)}
                        className="text-iron-gray hover:text-pure-white transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeactivate(w.id)}
                        className="text-iron-gray hover:text-blaze-orange transition-colors"
                        title="Desactivar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && <Modal
        onClose={() => setModal(false)}
        title={mode === "create" ? "Nuevo almacén" : "Editar almacén"}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nombre del almacén" value={name} onChange={e => setName(e.target.value)} required />
          <div>
            <label className="block text-[11px] font-medium text-slate-gray uppercase tracking-wide mb-1.5">
              Fuente de abastecimiento
            </label>
            <div className="relative">
              <select
                value={source}
                onChange={e => setSource(e.target.value)}
                className="w-full appearance-none bg-input-bg border border-iron-gray/40 rounded-[10px] px-3 py-2.5 text-[13px] text-pure-white pr-8 focus:outline-none focus:border-iron-gray"
              >
                {sources.map(s => <option key={s} value={s}>{SOURCE_LABEL[s]}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-iron-gray pointer-events-none" />
            </div>
          </div>
          {error && <p className="text-[12px] text-blaze-orange">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setModal(false)}>Cancelar</Button>
            <Button type="submit" size="sm" disabled={busy}>
              {busy ? "Guardando…" : mode === "create" ? "Crear almacén" : "Guardar cambios"}
            </Button>
          </div>
        </form>
      </Modal>}
    </div>
  );
}
