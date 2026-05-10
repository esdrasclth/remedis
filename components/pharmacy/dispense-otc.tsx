"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Plus, X, ShoppingCart, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { searchProductsWithStock, dispenseOTC } from "@/lib/actions/pharmacy";
import { searchEmployees as searchPts } from "@/lib/actions/patients";

// Re-use patients search
type ProductResult = {
  id: string; genericName: string; commercialName: string | null;
  unit: string | null; form: string | null; concentration: string | null;
  requiresPrescription: boolean; totalStock: number;
};
type PatientOption = { id: string; firstName: string; lastName: string; employeeNumber: string; department: string | null };
type CartItem = ProductResult & { quantity: number };

interface Props { tenantId: string; pharmacistId: string; onSuccess: () => void; }

export function DispenseOTC({ tenantId, pharmacistId, onSuccess }: Props) {
  const [error, setSaving]        = useState("");
  const [saving, setSavingState]  = useState(false);

  // Patient search
  const [ptQuery, setPtQuery]           = useState("");
  const [ptResults, setPtResults]       = useState<PatientOption[]>([]);
  const [selectedPt, setSelectedPt]     = useState<PatientOption | null>(null);
  const ptRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Product search
  const [prodQuery, setProdQuery]       = useState("");
  const [prodResults, setProdResults]   = useState<ProductResult[]>([]);
  const prodRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    if (selectedPt) return;
    if (ptRef.current) clearTimeout(ptRef.current);
    if (!ptQuery) { setPtResults([]); return; }
    ptRef.current = setTimeout(async () => {
      const r = await searchPts(tenantId, ptQuery);
      setPtResults(r);
    }, 250);
  }, [ptQuery, tenantId, selectedPt]);

  useEffect(() => {
    if (prodRef.current) clearTimeout(prodRef.current);
    if (!prodQuery) { setProdResults([]); return; }
    prodRef.current = setTimeout(async () => {
      const r = await searchProductsWithStock(tenantId, prodQuery);
      setProdResults(r);
    }, 250);
  }, [prodQuery, tenantId]);

  function addToCart(p: ProductResult) {
    setCart(prev => {
      const existing = prev.find(c => c.id === p.id);
      if (existing) return prev.map(c => c.id === p.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { ...p, quantity: 1 }];
    });
    setProdQuery("");
    setProdResults([]);
  }

  function updateQty(id: string, qty: number) {
    if (qty < 1) return;
    setCart(prev => prev.map(c => c.id === id ? { ...c, quantity: qty } : c));
  }

  function removeFromCart(id: string) {
    setCart(prev => prev.filter(c => c.id !== id));
  }

  async function handleDispense() {
    if (cart.length === 0) { setSaving("Agrega al menos un producto."); return; }
    setSavingState(true);
    setSaving("");
    const result = await dispenseOTC(tenantId, pharmacistId, {
      employeeId: selectedPt?.id,
      items: cart.map(c => ({ productId: c.id, quantity: c.quantity })),
    });
    setSavingState(false);
    if (!result.success) { setSaving(result.error); return; }
    setCart([]);
    setSelectedPt(null);
    setPtQuery("");
    onSuccess();
  }

  return (
    <div className="space-y-5">
      {/* Patient (optional for OTC) */}
      <div className="space-y-2">
        <p className="text-[11px] font-medium text-slate-gray uppercase tracking-wide">
          Paciente <span className="normal-case font-normal text-iron-gray">(opcional)</span>
        </p>
        {selectedPt ? (
          <div className="flex items-center justify-between bg-[#2a2825] rounded-[8px] px-4 py-2.5">
            <div>
              <p className="text-[13px] text-pure-white">{selectedPt.lastName}, {selectedPt.firstName}</p>
              <p className="text-[11px] font-mono text-slate-gray">{selectedPt.employeeNumber}</p>
            </div>
            <button onClick={() => { setSelectedPt(null); setPtQuery(""); }} className="text-iron-gray hover:text-pure-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-iron-gray" />
            <input
              value={ptQuery}
              onChange={e => setPtQuery(e.target.value)}
              placeholder="Buscar paciente..."
              className="w-full bg-[#2a2825] rounded-[8px] pl-9 pr-3 py-2 text-[13px] text-pure-white placeholder:text-iron-gray focus:outline-none h-9"
            />
            {ptResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#2a2825] rounded-[8px] overflow-hidden z-10">
                {ptResults.map(p => (
                  <button key={p.id} type="button" onClick={() => { setSelectedPt(p); setPtResults([]); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-white/[0.06] transition-colors">
                    <p className="text-[13px] text-pure-white">{p.lastName}, {p.firstName}</p>
                    <p className="text-[11px] text-slate-gray font-mono">{p.employeeNumber}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Product search */}
      <div className="space-y-2">
        <p className="text-[11px] font-medium text-slate-gray uppercase tracking-wide">Agregar producto</p>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-iron-gray" />
          <input
            value={prodQuery}
            onChange={e => setProdQuery(e.target.value)}
            placeholder="Buscar medicamento o insumo..."
            className="w-full bg-[#2a2825] rounded-[8px] pl-9 pr-3 py-2 text-[13px] text-pure-white placeholder:text-iron-gray focus:outline-none h-9"
          />
          {prodResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#2a2825] rounded-[8px] overflow-hidden z-10 max-h-64 overflow-y-auto">
              {prodResults.map(p => (
                <button key={p.id} type="button" onClick={() => addToCart(p)}
                  className="w-full text-left px-4 py-2.5 hover:bg-white/[0.06] transition-colors flex items-center justify-between gap-3"
                  disabled={p.totalStock === 0}
                >
                  <div className="min-w-0">
                    <p className={`text-[13px] ${p.totalStock === 0 ? "text-iron-gray" : "text-pure-white"}`}>
                      {p.genericName}
                    </p>
                    {p.commercialName && <p className="text-[11px] text-slate-gray">{p.commercialName}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {p.requiresPrescription && <Badge variant="warning">Rx</Badge>}
                    <span className={`text-[12px] font-mono tabular-nums ${p.totalStock === 0 ? "text-blaze-orange" : "text-slate-gray"}`}>
                      {p.totalStock === 0 ? "Sin stock" : `${p.totalStock} ${p.unit ?? "u."}`}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cart */}
      {cart.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-medium text-slate-gray uppercase tracking-wide flex items-center gap-1.5">
            <ShoppingCart className="w-3.5 h-3.5" /> Carrito ({cart.length})
          </p>
          <div className="space-y-1.5">
            {cart.map(item => (
              <div key={item.id} className="flex items-center gap-3 bg-[#2a2825] rounded-[8px] px-4 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-pure-white font-medium truncate">{item.genericName}</p>
                  <p className="text-[11px] text-slate-gray">
                    Stock disponible: {item.totalStock} {item.unit ?? "u."}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {item.quantity > item.totalStock && (
                    <AlertTriangle className="w-3.5 h-3.5 text-blaze-orange" />
                  )}
                  <input
                    type="number"
                    min={1}
                    max={item.totalStock}
                    value={item.quantity}
                    onChange={e => updateQty(item.id, Number(e.target.value))}
                    className="w-16 bg-[#1a1919] rounded-[4px] px-2 py-1 text-[13px] text-pure-white text-center focus:outline-none tabular-nums"
                  />
                  <span className="text-[11px] text-iron-gray">{item.unit ?? "u."}</span>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="text-iron-gray hover:text-blaze-orange transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-blaze-orange/10 rounded-[4px] px-3 py-2.5">
          <p className="text-[13px] text-blaze-orange">{error}</p>
        </div>
      )}

      <Button
        size="md"
        onClick={handleDispense}
        disabled={saving || cart.length === 0}
        className="w-full"
      >
        {saving ? "Procesando..." : `Despachar${cart.length > 0 ? ` (${cart.reduce((s, c) => s + c.quantity, 0)} unidades)` : ""}`}
      </Button>
    </div>
  );
}
