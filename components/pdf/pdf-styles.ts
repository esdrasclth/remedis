import { StyleSheet } from "@react-pdf/renderer";

const TA_R = "right" as const;
const TA_L = "left"  as const;

export const BRAND = {
  navy:      "#1a2744",
  navyLight: "#243258",
  accent:    "#f5a623",
  text:      "#1a1a1a",
  textMuted: "#6b7280",
  border:    "#e5e7eb",
  bg:        "#f9fafb",
  white:     "#ffffff",
  danger:    "#dc2626",
  success:   "#16a34a",
};

export const base = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: BRAND.text,
    backgroundColor: BRAND.white,
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 40,
  },
  // ── Header ──
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: BRAND.navy,
  },
  headerLeft: { flex: 1 },
  headerRight: { alignItems: "flex-end" },
  tenantName: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: BRAND.navy,
    marginBottom: 2,
  },
  tenantSub: { fontSize: 9, color: BRAND.textMuted },
  docTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: BRAND.navy,
    textAlign: TA_R,
  },
  docMeta: { fontSize: 9, color: BRAND.textMuted, textAlign: TA_R, marginTop: 2 },
  // ── Section ──
  section: { marginTop: 14 },
  sectionTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: BRAND.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.border,
  },
  // ── Info grid ──
  infoRow: { flexDirection: "row", marginBottom: 4 },
  infoLabel: { width: 90, fontSize: 9, color: BRAND.textMuted, fontFamily: "Helvetica-Bold" },
  infoValue: { flex: 1, fontSize: 10, color: BRAND.text },
  // ── Table ──
  table: { marginTop: 8 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: BRAND.navy,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: BRAND.white,
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.border,
  },
  tableRowAlt: { backgroundColor: BRAND.bg },
  tableCell: { fontSize: 9.5, color: BRAND.text },
  tableCellMuted: { fontSize: 9, color: BRAND.textMuted },
  // ── Footer ──
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: BRAND.border,
  },
  footerText: { fontSize: 8, color: BRAND.textMuted },
  // ── Misc ──
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  badgeText: { fontSize: 8, fontFamily: "Helvetica-Bold" },
  row: { flexDirection: "row" },
  col2: { flex: 1 },
});
