import * as XLSX from "xlsx";

// ─── Medical Records ──────────────────────────────────────────────────────────

export function generateMedicalRecordsExcel(
  tenantName: string,
  records: Array<{
    id: string;
    createdAt: Date;
    subjective: string | null;
    objective: string | null;
    assessment: string | null;
    plan: string | null;
    notes: string | null;
    referral: string | null;
    doctor: { name: string | null };
    employee: { firstName: string; lastName: string; employeeNumber: string } | null;
    dependent: { firstName: string; lastName: string } | null;
    vitalSigns: {
      weight: number | null; height: number | null; bmi: number | null;
      systolicBp: number | null; diastolicBp: number | null;
      heartRate: number | null; temperature: number | null;
      glucose: number | null; spo2: number | null; respiratoryRate: number | null;
    } | null;
    diagnoses: Array<{ cie10Code: string; description: string; isPrimary: boolean }>;
    prescriptions: Array<{ status: string }>;
  }>
): Buffer {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Consultas resumen
  const headers1 = [
    "Fecha", "Paciente", "Nº Empleado", "Médico",
    "Diagnóstico principal (CIE-10)", "Descripción diagnóstico",
    "Diagnósticos secundarios", "Receta",
    "Peso (kg)", "Talla (cm)", "IMC", "T/A sistólica", "T/A diastólica",
    "FC (lpm)", "Temperatura (°C)", "Glucosa (mg/dL)", "SpO2 (%)", "FR (rpm)",
  ];

  const rows1 = records.map(r => {
    const patient = r.employee
      ? `${r.employee.lastName}, ${r.employee.firstName}`
      : r.dependent
      ? `${r.dependent.lastName}, ${r.dependent.firstName}`
      : "";
    const empNum = r.employee?.employeeNumber ?? "";
    const primary = r.diagnoses.find(d => d.isPrimary) ?? r.diagnoses[0];
    const secondary = r.diagnoses
      .filter(d => !d.isPrimary)
      .map(d => `${d.cie10Code} ${d.description}`)
      .join("; ");
    const rx = r.prescriptions[0]?.status ?? "";
    const v = r.vitalSigns;
    return [
      new Date(r.createdAt).toLocaleDateString("es-HN"),
      patient, empNum,
      r.doctor.name ?? "",
      primary?.cie10Code ?? "",
      primary?.description ?? "",
      secondary,
      rx,
      v?.weight ?? "", v?.height ?? "", v?.bmi ?? "",
      v?.systolicBp ?? "", v?.diastolicBp ?? "",
      v?.heartRate ?? "", v?.temperature ?? "",
      v?.glucose ?? "", v?.spo2 ?? "", v?.respiratoryRate ?? "",
    ];
  });

  const ws1 = XLSX.utils.aoa_to_sheet([
    [`${tenantName} — Consultas Médicas`],
    [`Exportado: ${new Date().toLocaleDateString("es-HN")} · ${records.length} consultas`],
    [],
    headers1,
    ...rows1,
  ]);
  ws1["!cols"] = [
    { wch: 12 }, { wch: 24 }, { wch: 12 }, { wch: 20 },
    { wch: 16 }, { wch: 30 }, { wch: 36 }, { wch: 12 },
    { wch: 10 }, { wch: 10 }, { wch: 8 }, { wch: 14 }, { wch: 14 },
    { wch: 10 }, { wch: 16 }, { wch: 14 }, { wch: 10 }, { wch: 10 },
  ];
  XLSX.utils.book_append_sheet(wb, ws1, "Consultas");

  // Sheet 2: SOAP detalle
  const headers2 = [
    "Fecha", "Paciente", "Médico",
    "Subjetivo (S)", "Objetivo (O)", "Evaluación (A)", "Plan (P)",
    "Notas", "Referimiento",
  ];
  const rows2 = records.map(r => {
    const patient = r.employee
      ? `${r.employee.lastName}, ${r.employee.firstName}`
      : r.dependent
      ? `${r.dependent.lastName}, ${r.dependent.firstName}`
      : "";
    return [
      new Date(r.createdAt).toLocaleDateString("es-HN"),
      patient,
      r.doctor.name ?? "",
      r.subjective ?? "",
      r.objective ?? "",
      r.assessment ?? "",
      r.plan ?? "",
      r.notes ?? "",
      r.referral ?? "",
    ];
  });

  const ws2 = XLSX.utils.aoa_to_sheet([
    [`${tenantName} — Notas SOAP`],
    [`Exportado: ${new Date().toLocaleDateString("es-HN")}`],
    [],
    headers2,
    ...rows2,
  ]);
  ws2["!cols"] = [
    { wch: 12 }, { wch: 24 }, { wch: 20 },
    { wch: 36 }, { wch: 36 }, { wch: 36 }, { wch: 36 },
    { wch: 30 }, { wch: 24 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, "SOAP");

  // Sheet 3: Diagnósticos (para análisis de morbilidad)
  const headers3 = ["Fecha", "Paciente", "Médico", "CIE-10", "Diagnóstico", "Tipo"];
  const rows3: (string | number)[][] = [];
  for (const r of records) {
    const patient = r.employee
      ? `${r.employee.lastName}, ${r.employee.firstName}`
      : r.dependent
      ? `${r.dependent.lastName}, ${r.dependent.firstName}`
      : "";
    for (const d of r.diagnoses) {
      rows3.push([
        new Date(r.createdAt).toLocaleDateString("es-HN"),
        patient,
        r.doctor.name ?? "",
        d.cie10Code,
        d.description,
        d.isPrimary ? "Principal" : "Secundario",
      ]);
    }
  }

  const ws3 = XLSX.utils.aoa_to_sheet([
    [`${tenantName} — Diagnósticos (Morbilidad)`],
    [`Exportado: ${new Date().toLocaleDateString("es-HN")} · ${rows3.length} diagnósticos`],
    [],
    headers3,
    ...rows3,
  ]);
  ws3["!cols"] = [
    { wch: 12 }, { wch: 24 }, { wch: 20 }, { wch: 12 }, { wch: 40 }, { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, ws3, "Diagnósticos");

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}

function applyHeaderStyle(ws: XLSX.WorkSheet, range: string) {
  // xlsx CE (community edition) has limited style support; we set column widths and freeze
  return ws;
}

// ─── Patients ─────────────────────────────────────────────────────────────────

export function generatePatientsExcel(
  tenantName: string,
  employees: Array<{
    employeeNumber: string;
    firstName: string;
    lastName: string;
    gender: string | null;
    birthDate: Date | null;
    department: string | null;
    position: string | null;
    phone: string | null;
    email: string | null;
    _count: { appointments: number; medicalRecords: number };
  }>
): Buffer {
  const headers = [
    "Nº Empleado", "Apellidos", "Nombres", "Género",
    "Fecha nacimiento", "Departamento", "Cargo",
    "Teléfono", "Correo", "Citas", "Consultas",
  ];

  const rows = employees.map(e => [
    e.employeeNumber,
    e.lastName,
    e.firstName,
    e.gender ?? "",
    e.birthDate ? new Date(e.birthDate).toLocaleDateString("es-HN") : "",
    e.department ?? "",
    e.position ?? "",
    e.phone ?? "",
    e.email ?? "",
    e._count.appointments,
    e._count.medicalRecords,
  ]);

  const ws = XLSX.utils.aoa_to_sheet([
    [`${tenantName} — Listado de Pacientes`],
    [`Exportado: ${new Date().toLocaleDateString("es-HN")}`],
    [],
    headers,
    ...rows,
  ]);

  ws["!cols"] = [
    { wch: 14 }, { wch: 20 }, { wch: 20 }, { wch: 12 },
    { wch: 16 }, { wch: 18 }, { wch: 18 },
    { wch: 14 }, { wch: 24 }, { wch: 8 }, { wch: 10 },
  ];
  ws["!freeze"] = { xSplit: 0, ySplit: 4 };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Pacientes");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}

// ─── Inventory ────────────────────────────────────────────────────────────────

export function generateInventoryExcel(
  tenantName: string,
  products: Array<{
    genericName: string;
    commercialName: string | null;
    category: string;
    form: string | null;
    concentration: string | null;
    unit: string | null;
    minStock: number;
    unitCost: number | null;
    requiresPrescription: boolean;
    batches: Array<{
      batchNumber: string;
      expiryDate: Date;
      currentQty: number;
      source: string;
      warehouse?: { name: string } | null;
    }>;
  }>
): Buffer {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Products summary
  const prodHeaders = [
    "Nombre genérico", "Nombre comercial", "Categoría",
    "Forma", "Concentración", "Unidad",
    "Stock total", "Stock mínimo", "Costo unit. (L)",
    "Valor inventario (L)", "Lotes activos", "Rx requerida",
  ];

  const prodRows = products.map(p => {
    const totalStock = p.batches.reduce((s, b) => s + b.currentQty, 0);
    const invValue   = totalStock * (p.unitCost ?? 0);
    return [
      p.genericName,
      p.commercialName ?? "",
      p.category === "MEDICAMENTO" ? "Medicamento" : p.category === "INSUMO_DESCARTABLE" ? "Insumo" : "Equipo",
      p.form ?? "",
      p.concentration ?? "",
      p.unit ?? "",
      totalStock,
      p.minStock,
      p.unitCost ?? "",
      p.unitCost != null ? invValue : "",
      p.batches.filter(b => b.currentQty > 0).length,
      p.requiresPrescription ? "Sí" : "No",
    ];
  });

  const totalValue = products.reduce((s, p) => {
    const stock = p.batches.reduce((a, b) => a + b.currentQty, 0);
    return s + stock * (p.unitCost ?? 0);
  }, 0);

  const ws1 = XLSX.utils.aoa_to_sheet([
    [`${tenantName} — Inventario de Productos`],
    [`Exportado: ${new Date().toLocaleDateString("es-HN")} · Valor total: L ${totalValue.toFixed(2)}`],
    [],
    prodHeaders,
    ...prodRows,
  ]);
  ws1["!cols"] = [
    { wch: 28 }, { wch: 22 }, { wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 10 },
    { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 18 }, { wch: 12 }, { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, ws1, "Productos");

  // Sheet 2: Batches detail
  const batchHeaders = [
    "Producto", "Nº Lote", "Almacén", "Fuente",
    "Vencimiento", "Días restantes", "Stock actual",
  ];
  const batchRows: (string | number)[][] = [];
  for (const p of products) {
    for (const b of p.batches) {
      const days = Math.ceil((new Date(b.expiryDate).getTime() - Date.now()) / 86400000);
      batchRows.push([
        p.genericName,
        b.batchNumber,
        b.warehouse?.name ?? "",
        b.source === "EMPRESA" ? "Empresa" : "Seguro Social",
        new Date(b.expiryDate).toLocaleDateString("es-HN"),
        days,
        b.currentQty,
      ]);
    }
  }

  const ws2 = XLSX.utils.aoa_to_sheet([
    [`${tenantName} — Detalle de Lotes`],
    [`Exportado: ${new Date().toLocaleDateString("es-HN")}`],
    [],
    batchHeaders,
    ...batchRows,
  ]);
  ws2["!cols"] = [
    { wch: 28 }, { wch: 16 }, { wch: 18 }, { wch: 10 },
    { wch: 14 }, { wch: 14 }, { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, "Lotes");

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}

// ─── Suppliers ────────────────────────────────────────────────────────────────

export function generateSuppliersExcel(
  tenantName: string,
  suppliers: Array<{
    name: string;
    rtn: string | null;
    contact: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    purchaseOrders: Array<{
      id: string;
      status: string;
      orderDate: Date;
      items: Array<{
        requestedQty: number;
        receivedQty: number;
        unitCost: number | null;
        product: { genericName: string };
      }>;
    }>;
  }>
): Buffer {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Suppliers
  const supHeaders = [
    "Proveedor", "RTN", "Contacto", "Teléfono", "Correo", "Dirección", "Órdenes",
  ];
  const supRows = suppliers.map(s => [
    s.name, s.rtn ?? "", s.contact ?? "", s.phone ?? "",
    s.email ?? "", s.address ?? "", s.purchaseOrders.length,
  ]);

  const ws1 = XLSX.utils.aoa_to_sheet([
    [`${tenantName} — Proveedores`],
    [`Exportado: ${new Date().toLocaleDateString("es-HN")}`],
    [],
    supHeaders,
    ...supRows,
  ]);
  ws1["!cols"] = [
    { wch: 28 }, { wch: 16 }, { wch: 20 }, { wch: 14 }, { wch: 24 }, { wch: 28 }, { wch: 8 },
  ];
  XLSX.utils.book_append_sheet(wb, ws1, "Proveedores");

  // Sheet 2: Purchase orders
  const orderHeaders = [
    "Proveedor", "Nº Orden", "Estado", "Fecha", "Producto",
    "Cant. solicitada", "Cant. recibida", "Costo unit.", "Total línea",
  ];
  const orderRows: (string | number)[][] = [];
  const STATUS_LABEL: Record<string, string> = {
    BORRADOR: "Borrador", ENVIADA: "Enviada", PARCIAL: "Parcial",
    RECIBIDA: "Recibida", CANCELADA: "Cancelada",
  };
  for (const sup of suppliers) {
    for (const order of sup.purchaseOrders) {
      for (const item of order.items) {
        const lineTotal = item.receivedQty * (item.unitCost ?? 0);
        orderRows.push([
          sup.name,
          order.id.slice(-8).toUpperCase(),
          STATUS_LABEL[order.status] ?? order.status,
          new Date(order.orderDate).toLocaleDateString("es-HN"),
          item.product.genericName,
          item.requestedQty,
          item.receivedQty,
          item.unitCost ?? "",
          lineTotal > 0 ? lineTotal : "",
        ]);
      }
    }
  }

  const ws2 = XLSX.utils.aoa_to_sheet([
    [`${tenantName} — Órdenes de Compra`],
    [`Exportado: ${new Date().toLocaleDateString("es-HN")}`],
    [],
    orderHeaders,
    ...orderRows,
  ]);
  ws2["!cols"] = [
    { wch: 22 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 28 },
    { wch: 16 }, { wch: 16 }, { wch: 12 }, { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, "Órdenes");

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}
