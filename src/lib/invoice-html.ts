// Renders the same invoice look as `admin/invoice-design` live preview,
// as a standalone printable HTML document. Used by the admin invoice
// generator for "Preview & Print" and "Download PDF" (via browser print).

import accessNowLogo from "@/assets/logo-gold-a.webp";
import { supabase } from "@/integrations/supabase/client";

export type InvoiceDesign = {
  brandColor: string;
  brandLight: string;
  headerBg: string;
  headerText: string;
  totalColor: string; // "auto" or hex
  bodyDark: string;
  cardRadius: number;
  showLogo: boolean;
  invoiceTitle: string;
  companyName: string;
  companyWebsite: string;
  companyEmail: string;
  companyPhone: string;
  companyAddress: string;
  thankYouText: string;
  footerNote: string;
  billingLabel: string;
  paymentLabel: string;
  itemColumn: string;
  qtyColumn: string;
  priceColumn: string;
  totalColumn: string;
  subtotalRow: string;
  discountRow: string;
  grandTotalRow: string;
};

export const INVOICE_DESIGN_DEFAULTS: InvoiceDesign = {
  brandColor: "#7c3aed",
  brandLight: "#f3e8ff",
  headerBg: "#bfdbfe",
  headerText: "#0f172a",
  totalColor: "auto",
  bodyDark: "#1e1a2e",
  cardRadius: 18,
  showLogo: true,
  invoiceTitle: "INVOICE",
  companyName: "AccessNow BD",
  companyWebsite: "accessnowbd.com",
  companyEmail: "support@accessnowbd.com",
  companyPhone: "+880 1580-607614",
  companyAddress: "",
  thankYouText:
    "AccessNow BD থেকে কেনার জন্য ধন্যবাদ! যেকোনো সমস্যায় WhatsApp: 01580607614",
  footerNote:
    "This is a computer-generated invoice from AccessNow BD (accessnowbd.com) and does not require a signature.",
  billingLabel: "Billing Info",
  paymentLabel: "Payment Info",
  itemColumn: "Item",
  qtyColumn: "Qty",
  priceColumn: "Price",
  totalColumn: "Total",
  subtotalRow: "Subtotal",
  discountRow: "Discount",
  grandTotalRow: "Total",
};

export async function loadInvoiceDesign(): Promise<InvoiceDesign> {
  try {
    const { data } = await supabase
      .from("admin_records")
      .select("data")
      .eq("kind", "invoice_design")
      .limit(1);
    const row = (data ?? [])[0] as { data?: Partial<InvoiceDesign> } | undefined;
    return { ...INVOICE_DESIGN_DEFAULTS, ...(row?.data ?? {}) };
  } catch {
    return INVOICE_DESIGN_DEFAULTS;
  }
}

const escapeHtml = (s: string) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const fmtBDT = (n: number) =>
  "৳" + Math.round(Number(n || 0)).toLocaleString("en-IN");

export type RenderInvoiceItem = { name: string; qty: number; price: number };

export type RenderInvoiceInput = {
  design: InvoiceDesign;
  invoiceNo: string;
  date: string;
  customer: { name: string; email?: string; phone?: string; address?: string };
  payment: { method: string; trxId?: string; status?: string };
  items: RenderInvoiceItem[];
  discount?: number;
  note?: string;
};

export function renderInvoiceHtml(input: RenderInvoiceInput): string {
  const { design, invoiceNo, date, customer, payment, items, discount = 0, note } =
    input;
  const totalColor =
    design.totalColor === "auto" ? design.brandColor : design.totalColor;
  const subtotal = items.reduce(
    (s, i) => s + Number(i.qty || 0) * Number(i.price || 0),
    0,
  );
  const total = Math.max(0, subtotal - Number(discount || 0));

  const logoUrl = typeof accessNowLogo === "string" ? accessNowLogo : "";

  const rowsHtml = items
    .map(
      (it, i) => `
      <tr>
        <td class="cell">${i + 1}</td>
        <td class="cell">${escapeHtml(it.name)}</td>
        <td class="cell right">x${it.qty}</td>
        <td class="cell right">${fmtBDT(it.price)}</td>
        <td class="cell right bold">${fmtBDT(it.qty * it.price)}</td>
      </tr>`,
    )
    .join("");

  const logoBlock = design.showLogo
    ? `<div class="brand">
        <div class="logo-ring">
          <img src="${logoUrl}" alt="${escapeHtml(design.companyName)}" />
        </div>
        <div class="brand-text">
          <div class="wordmark">
            <span class="w-blue">Access</span><span class="w-green">Now</span><span class="w-gold">BD</span>
          </div>
          <div class="tagline">FAST • SECURE • RELIABLE</div>
        </div>
      </div>`
    : `<div class="brand">
        <div class="brand-text">
          <div class="company">${escapeHtml(design.companyName)}</div>
          <div class="tagline">${escapeHtml(design.companyWebsite)}</div>
        </div>
      </div>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(design.invoiceTitle)} ${escapeHtml(invoiceNo)}</title>
<meta name="viewport" content="width=device-width,initial-scale=1" />
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #f5f6fb; color: ${design.bodyDark}; font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
  .page { max-width: 820px; margin: 24px auto; padding: 0 16px; }
  .card { background: #fff; border: 1px solid #e2e8f0; border-radius: ${design.cardRadius}px; overflow: hidden; box-shadow: 0 10px 30px -18px rgba(15,23,42,.25); }
  .head { display: flex; align-items: flex-start; justify-content: space-between; padding: 24px 28px 12px; gap: 16px; }
  .brand { display: flex; align-items: center; gap: 12px; }
  .logo-ring { width: 56px; height: 56px; border-radius: 999px; padding: 2px; background: conic-gradient(from 0deg,#2f6dff,#1fc796,#f59e0b,#2f6dff); display:grid; place-items:center; }
  .logo-ring img { width: 100%; height: 100%; border-radius: 999px; background: #fff; object-fit: contain; }
  .wordmark { font-weight: 800; font-size: 22px; letter-spacing: .2px; line-height: 1; }
  .wordmark span + span { margin-left: 4px; }
  .w-blue  { color: #2f6dff; }
  .w-green { color: #1fc796; }
  .w-gold  { color: #f59e0b; }
  .company { font-weight: 800; font-size: 20px; color: ${design.brandColor}; }
  .tagline { font-size: 10px; font-weight: 700; color: #64748b; letter-spacing: .18em; margin-top: 4px; text-transform: uppercase; }
  .inv-title { text-align: right; }
  .inv-title .t { font-weight: 900; font-size: 26px; letter-spacing: .12em; color: ${design.brandColor}; }
  .inv-title .n { font-family: ui-monospace,SFMono-Regular,Menlo,Consolas,monospace; font-size: 11px; color: #64748b; margin-top: 4px; }
  .inv-title .d { font-size: 11px; color: #64748b; margin-top: 2px; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 4px 28px 0; }
  .tile { border-radius: 14px; padding: 12px 14px; background: ${design.brandLight}; }
  .tile .lbl { font-size: 10px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; opacity: .7; }
  .tile .val { font-size: 14px; font-weight: 700; margin-top: 4px; }
  .tile .sub { font-size: 11px; opacity: .8; margin-top: 2px; }
  .pill { display: inline-block; margin-top: 6px; padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: 800; color: #fff; background: ${design.brandColor}; letter-spacing: .06em; }
  table { width: 100%; border-collapse: collapse; }
  .table-wrap { padding: 16px 28px 0; }
  thead th { background: ${design.headerBg}; color: ${design.headerText}; font-size: 11px; font-weight: 800; text-align: left; padding: 10px 12px; letter-spacing: .06em; text-transform: uppercase; }
  thead th.right { text-align: right; }
  .cell { padding: 10px 12px; font-size: 12.5px; border-bottom: 1px solid #f1f5f9; }
  .cell.right { text-align: right; }
  .cell.bold { font-weight: 700; }
  .totals-wrap { display: flex; justify-content: flex-end; padding: 12px 28px 0; }
  .totals { width: 280px; border-radius: 14px; background: ${design.brandLight}; padding: 12px 14px; font-size: 12.5px; }
  .totals .row { display: flex; justify-content: space-between; padding: 2px 0; }
  .totals .grand { border-top: 1px solid rgba(255,255,255,.7); margin-top: 6px; padding-top: 8px; font-size: 15px; }
  .totals .grand .l, .totals .grand .r { color: ${totalColor}; font-weight: 900; }
  .foot { text-align: center; padding: 18px 28px 22px; margin-top: 12px; border-top: 1px solid #eef2f7; }
  .foot .thanks { font-weight: 700; font-size: 13.5px; color: ${design.brandColor}; }
  .foot .meta { font-size: 11px; color: #64748b; margin-top: 6px; display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; }
  .foot .note { font-size: 10px; color: #94a3b8; margin-top: 8px; }
  .note-block { padding: 8px 28px 0; font-size: 11.5px; color: #475569; }
  .note-block .lbl { font-weight: 800; color: #334155; margin-right: 6px; }
  .actions { text-align: center; margin-top: 14px; }
  .actions button { background: ${design.brandColor}; color: #fff; border: 0; border-radius: 999px; padding: 10px 18px; font-weight: 700; font-size: 13px; cursor: pointer; box-shadow: 0 8px 20px -8px rgba(124,58,237,.55); }
  @media print {
    body { background: #fff; }
    .page { margin: 0; padding: 0; max-width: none; }
    .card { border: 0; box-shadow: none; border-radius: 0; }
    .actions { display: none; }
    @page { size: A4; margin: 12mm; }
  }
</style>
</head>
<body>
  <div class="page">
    <div class="card">
      <div class="head">
        ${logoBlock}
        <div class="inv-title">
          <div class="t">${escapeHtml(design.invoiceTitle)}</div>
          <div class="n">#${escapeHtml(invoiceNo)}</div>
          <div class="d">${escapeHtml(date)}</div>
        </div>
      </div>

      <div class="grid2">
        <div class="tile">
          <div class="lbl">${escapeHtml(design.billingLabel)}</div>
          <div class="val">${escapeHtml(customer.name || "—")}</div>
          ${customer.email ? `<div class="sub">${escapeHtml(customer.email)}</div>` : ""}
          ${customer.phone ? `<div class="sub">${escapeHtml(customer.phone)}</div>` : ""}
          ${customer.address ? `<div class="sub">${escapeHtml(customer.address)}</div>` : ""}
        </div>
        <div class="tile">
          <div class="lbl">${escapeHtml(design.paymentLabel)}</div>
          <div class="val">Method: ${escapeHtml(payment.method)}</div>
          ${payment.trxId ? `<div class="sub">TrxID: ${escapeHtml(payment.trxId)}</div>` : ""}
          <span class="pill">${escapeHtml(payment.status || "PAID")}</span>
        </div>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th style="width:36px">#</th>
              <th>${escapeHtml(design.itemColumn)}</th>
              <th class="right">${escapeHtml(design.qtyColumn)}</th>
              <th class="right">${escapeHtml(design.priceColumn)}</th>
              <th class="right">${escapeHtml(design.totalColumn)}</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>

      <div class="totals-wrap">
        <div class="totals">
          <div class="row"><span style="opacity:.7">${escapeHtml(design.subtotalRow)}</span><span style="font-weight:700">${fmtBDT(subtotal)}</span></div>
          <div class="row"><span style="opacity:.7">${escapeHtml(design.discountRow)}</span><span style="font-weight:700">−${fmtBDT(discount)}</span></div>
          <div class="row grand"><span class="l">${escapeHtml(design.grandTotalRow)}:</span><span class="r">${fmtBDT(total)}</span></div>
        </div>
      </div>

      ${note ? `<div class="note-block"><span class="lbl">Note:</span>${escapeHtml(note)}</div>` : ""}

      <div class="foot">
        <div class="thanks">${escapeHtml(design.thankYouText)}</div>
        <div class="meta">
          ${design.companyWebsite ? `<span>🌐 ${escapeHtml(design.companyWebsite)}</span>` : ""}
          ${design.companyEmail ? `<span>✉ ${escapeHtml(design.companyEmail)}</span>` : ""}
          ${design.companyPhone ? `<span>📞 ${escapeHtml(design.companyPhone)}</span>` : ""}
        </div>
        <div class="note">${escapeHtml(design.footerNote)}</div>
      </div>
    </div>

    <div class="actions">
      <button onclick="window.print()">🖨 Print / Save as PDF</button>
    </div>
  </div>
</body>
</html>`;
}

export function openInvoiceInNewWindow(html: string, autoPrint = false) {
  const w = window.open("", "_blank");
  if (!w) return null;
  w.document.open();
  w.document.write(html);
  w.document.close();
  if (autoPrint) {
    setTimeout(() => {
      try {
        w.focus();
        w.print();
      } catch {
        /* ignore */
      }
    }, 600);
  }
  return w;
}
