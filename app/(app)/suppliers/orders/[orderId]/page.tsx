import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Send, XCircle } from "lucide-react";
import { getTenantFromHeaders } from "@/lib/tenant";
import { auth } from "@/lib/auth";
import { getPurchaseOrder, updateOrderStatus } from "@/lib/actions/suppliers";
import { getWarehouses } from "@/lib/actions/inventory";
import { ReceiveForm } from "@/components/suppliers/receive-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const STATUS_VARIANT: Record<string, "muted" | "info" | "warning" | "success" | "danger"> = {
  BORRADOR: "muted", ENVIADA: "info", PARCIAL: "warning", RECIBIDA: "success", CANCELADA: "danger",
};
const STATUS_LABEL: Record<string, string> = {
  BORRADOR: "Borrador", ENVIADA: "Enviada", PARCIAL: "Parcial recibida",
  RECIBIDA: "Recibida", CANCELADA: "Cancelada",
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const { tenantId } = await getTenantFromHeaders();
  const session = await auth();
  if (!tenantId || !session?.user?.id) return null;

  const [order, warehouses] = await Promise.all([
    getPurchaseOrder(tenantId, orderId),
    getWarehouses(tenantId),
  ]);
  if (!order) notFound();

  const canSend    = order.status === "BORRADOR";
  const canReceive = order.status === "ENVIADA" || order.status === "PARCIAL";
  const canCancel  = order.status === "BORRADOR" || order.status === "ENVIADA";

  const totalValue = order.items.reduce(
    (s, i) => s + i.requestedQty * (i.unitCost ?? 0), 0
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/suppliers?tab=ordenes" className="text-iron-gray hover:text-pure-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[20px] font-medium text-pure-white">
                OC-{order.id.slice(-8).toUpperCase()}
              </h1>
              <Badge variant={STATUS_VARIANT[order.status]}>{STATUS_LABEL[order.status]}</Badge>
            </div>
            <p className="text-[13px] text-slate-gray mt-0.5">
              {order.supplier?.name ?? "Sin proveedor"} ·{" "}
              {new Date(order.orderDate).toLocaleDateString("es-HN")} ·{" "}
              Fuente: {order.source}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {canSend && (
            <form action={async () => {
              "use server";
              await updateOrderStatus(tenantId, orderId, "ENVIADA");
            }}>
              <Button type="submit" size="sm">
                <Send className="w-3.5 h-3.5" /> Marcar como enviada
              </Button>
            </form>
          )}
          {canCancel && (
            <form action={async () => {
              "use server";
              await updateOrderStatus(tenantId, orderId, "CANCELADA");
            }}>
              <Button type="submit" variant="ghost" size="sm">
                <XCircle className="w-3.5 h-3.5" /> Cancelar orden
              </Button>
            </form>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Order items */}
        <div className="col-span-2 space-y-4">
          <div className="bg-ash-gray rounded-[12px] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <h2 className="text-[13px] font-medium text-pure-white">Productos solicitados</h2>
            </div>
            <table className="w-full">
              <thead>
                <tr className="bg-[#222120]">
                  <th className="px-4 py-2.5 text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide">Producto</th>
                  <th className="w-28 px-4 py-2.5 text-right text-[11px] font-medium text-slate-gray uppercase tracking-wide">Solicitado</th>
                  <th className="w-28 px-4 py-2.5 text-right text-[11px] font-medium text-slate-gray uppercase tracking-wide">Recibido</th>
                  <th className="w-32 px-4 py-2.5 text-right text-[11px] font-medium text-slate-gray uppercase tracking-wide">Costo unit.</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map(item => {
                  const pending = item.requestedQty - item.receivedQty;
                  return (
                    <tr key={item.id} className="border-t border-white/[0.04]">
                      <td className="px-4 py-3">
                        <p className="text-[13px] text-pure-white font-medium">{item.product.genericName}</p>
                        {item.product.form && (
                          <p className="text-[11px] text-slate-gray mt-0.5">{item.product.form}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-[13px] text-slate-gray tabular-nums">
                        {item.requestedQty} {item.product.unit ?? "u."}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        <span className={`text-[13px] font-medium ${
                          item.receivedQty >= item.requestedQty ? "text-emerald-green"
                          : item.receivedQty > 0 ? "text-sunbeam-yellow"
                          : "text-iron-gray"
                        }`}>
                          {item.receivedQty}
                        </span>
                        {pending > 0 && (
                          <p className="text-[10px] text-iron-gray mt-0.5">Pendiente: {pending}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-[12px] text-slate-gray tabular-nums">
                        {item.unitCost != null ? `L ${item.unitCost.toFixed(2)}` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {totalValue > 0 && (
                <tfoot>
                  <tr className="border-t border-white/[0.06]">
                    <td colSpan={3} className="px-4 py-3 text-right text-[12px] text-slate-gray">Valor estimado total</td>
                    <td className="px-4 py-3 text-right text-[13px] font-medium text-pure-white tabular-nums">
                      L {totalValue.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Receipts history */}
          {order.receipts.length > 0 && (
            <div className="bg-ash-gray rounded-[12px] p-5 space-y-2">
              <h2 className="text-[13px] font-medium text-pure-white">Recepciones</h2>
              {order.receipts.map(r => (
                <div key={r.id} className="flex items-center justify-between py-1.5">
                  <p className="text-[12px] text-slate-gray">
                    {new Date(r.receivedAt).toLocaleDateString("es-HN", {
                      day: "numeric", month: "long", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                  {r.notes && <p className="text-[11px] text-iron-gray">{r.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Receive panel */}
        <div className="col-span-1">
          {canReceive ? (
            <div className="bg-ash-gray rounded-[12px] p-5 space-y-4">
              <h2 className="text-[13px] font-medium text-pure-white">Registrar recepción</h2>
              <p className="text-[12px] text-slate-gray">
                Ingresa los datos del lote por cada producto recibido. Se actualizará el inventario automáticamente.
              </p>
              <ReceiveForm
                tenantId={tenantId}
                userId={session.user.id}
                order={order}
                warehouses={warehouses}
              />
            </div>
          ) : (
            <div className="bg-ash-gray rounded-[12px] p-5">
              <h2 className="text-[13px] font-medium text-pure-white mb-3">Estado</h2>
              {order.status === "RECIBIDA" && (
                <p className="text-[12px] text-emerald-green">
                  Todos los productos han sido recibidos e ingresados al inventario.
                </p>
              )}
              {order.status === "BORRADOR" && (
                <p className="text-[12px] text-slate-gray">
                  Marca la orden como enviada para habilitar la recepción de mercancía.
                </p>
              )}
              {order.status === "CANCELADA" && (
                <p className="text-[12px] text-blaze-orange">Esta orden fue cancelada.</p>
              )}
              {order.notes && (
                <div className="mt-3 pt-3 border-t border-white/[0.06]">
                  <p className="text-[11px] text-slate-gray uppercase tracking-wide mb-1">Notas</p>
                  <p className="text-[12px] text-pure-white">{order.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
