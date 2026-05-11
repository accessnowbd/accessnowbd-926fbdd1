import jsPDF from "jspdf";

export type ReceiptOrder = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  payment_method: string;
  transaction_id: string;
  total: number;
  created_at: string;
  items: Array<{
    name?: string;
    slug: string;
    planPeriod: string;
    qty: number;
    price?: number;
    /** Original (pre-discount) unit price; used to render per-item discount. */
    originalPrice?: number;
  }>;
  /** Optional explicit shipping cost in BDT. Defaults to 0 (FREE). */
  shipping?: number;
  /** Optional explicit tax amount in BDT. Defaults to 0. */
  tax?: number;
  /** Optional coupon discount in BDT (applied on top of item-level discounts). */
  couponDiscount?: number;
  /** Optional coupon code label. */
  couponCode?: string;
};

export function downloadReceiptPdf(order: ReceiptOrder) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 48;
  let y = margin;

  // Header bar
  doc.setFillColor(99, 102, 241); // violet
  doc.rect(0, 0, pageW, 90, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("AccessNow BD", margin, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Payment Receipt", margin, 64);

  doc.setFontSize(10);
  doc.text(
    `Date: ${new Date(order.created_at).toLocaleString()}`,
    pageW - margin,
    42,
    { align: "right" },
  );
  doc.text(
    `Receipt #${order.id.slice(0, 8).toUpperCase()}`,
    pageW - margin,
    64,
    { align: "right" },
  );

  y = 130;
  doc.setTextColor(20, 20, 30);

  // Customer + Payment columns
  const colW = (pageW - margin * 2) / 2;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Billed to", margin, y);
  doc.text("Payment", margin + colW, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 90);

  const billLines = [order.full_name, order.email, order.phone];
  billLines.forEach((line, i) => doc.text(line, margin, y + 18 + i * 14));

  // Payment column — labeled rows for clarity
  const payX = margin + colW;
  const labelColor: [number, number, number] = [130, 130, 140];
  const valueColor: [number, number, number] = [30, 30, 40];
  const methodLabel = (order.payment_method || "").toUpperCase();
  const refLabel =
    /stripe|card|visa|master/i.test(order.payment_method)
      ? "Reference ID"
      : "Transaction ID";

  const payRows: Array<[string, string]> = [
    ["Method", methodLabel || "—"],
    [refLabel, order.transaction_id || "—"],
  ];
  payRows.forEach(([label, value], i) => {
    const rowY = y + 18 + i * 28;
    doc.setTextColor(...labelColor);
    doc.setFontSize(9);
    doc.text(label.toUpperCase(), payX, rowY);
    doc.setTextColor(...valueColor);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    // Wrap long IDs so they don't overflow the column.
    const wrapped = doc.splitTextToSize(value, colW - 8);
    doc.text(wrapped, payX, rowY + 12);
    doc.setFont("helvetica", "normal");
  });

  y += 90;

  // Items table header
  doc.setDrawColor(220, 220, 230);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageW - margin, y);
  y += 18;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(20, 20, 30);
  doc.text("Item", margin, y);
  doc.text("Plan", margin + 240, y);
  doc.text("Qty", pageW - margin - 110, y, { align: "right" });
  doc.text("Amount", pageW - margin, y, { align: "right" });
  y += 8;
  doc.line(margin, y, pageW - margin, y);
  y += 14;

  // Items rows — show original price strikethrough when discounted
  doc.setFont("helvetica", "normal");
  doc.setTextColor(40, 40, 50);
  let itemsSubtotal = 0;
  let itemDiscountTotal = 0;
  order.items.forEach((it) => {
    const unit = it.price ?? 0;
    const original = it.originalPrice ?? unit;
    const lineTotal = unit * it.qty;
    const lineOriginal = original * it.qty;
    itemsSubtotal += lineOriginal;
    itemDiscountTotal += Math.max(0, lineOriginal - lineTotal);

    doc.text(String(it.name ?? it.slug).slice(0, 40), margin, y);
    doc.text(String(it.planPeriod), margin + 240, y);
    doc.text(String(it.qty), pageW - margin - 110, y, { align: "right" });
    if (original > unit) {
      // Strikethrough original
      doc.setTextColor(150, 150, 160);
      const origStr = `BDT ${lineOriginal.toLocaleString()}`;
      doc.text(origStr, pageW - margin - 70, y, { align: "right" });
      const w = doc.getTextWidth(origStr);
      doc.setDrawColor(150, 150, 160);
      doc.line(pageW - margin - 70 - w, y - 3, pageW - margin - 70, y - 3);
      // Discounted
      doc.setTextColor(40, 40, 50);
      doc.text(`BDT ${lineTotal.toLocaleString()}`, pageW - margin, y, { align: "right" });
    } else {
      doc.text(`BDT ${lineTotal.toLocaleString()}`, pageW - margin, y, { align: "right" });
    }
    y += 18;
  });

  y += 6;
  doc.line(margin, y, pageW - margin, y);
  y += 18;

  // Totals breakdown — right-aligned mini table
  const shipping = order.shipping ?? 0;
  const tax = order.tax ?? 0;
  const couponDiscount = order.couponDiscount ?? 0;
  const expectedTotal = Math.max(
    0,
    itemsSubtotal - itemDiscountTotal - couponDiscount + shipping + tax,
  );
  // If caller's total disagrees with the breakdown, treat the difference as
  // an additional adjustment so the figures always reconcile.
  const adjustment = Number(order.total) - expectedTotal;

  const labelX = pageW - margin - 180;
  const valueX = pageW - margin;
  const drawRow = (label: string, value: string, opts?: { muted?: boolean; accent?: boolean }) => {
    if (opts?.muted) doc.setTextColor(110, 110, 120);
    else if (opts?.accent) doc.setTextColor(13, 148, 136);
    else doc.setTextColor(40, 40, 50);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(label, labelX, y);
    doc.text(value, valueX, y, { align: "right" });
    y += 16;
  };

  drawRow("Subtotal", `BDT ${itemsSubtotal.toLocaleString()}`, { muted: true });
  if (itemDiscountTotal > 0) {
    drawRow("Item discounts", `− BDT ${itemDiscountTotal.toLocaleString()}`, { accent: true });
  }
  if (couponDiscount > 0) {
    const label = order.couponCode ? `Coupon (${order.couponCode})` : "Coupon discount";
    drawRow(label, `− BDT ${couponDiscount.toLocaleString()}`, { accent: true });
  }
  drawRow("Shipping", shipping > 0 ? `BDT ${shipping.toLocaleString()}` : "FREE", {
    accent: shipping === 0,
    muted: shipping > 0,
  });
  drawRow("Tax", tax > 0 ? `BDT ${tax.toLocaleString()}` : "BDT 0", { muted: true });
  if (Math.abs(adjustment) >= 1) {
    drawRow(
      adjustment > 0 ? "Adjustment" : "Additional discount",
      `${adjustment > 0 ? "" : "− "}BDT ${Math.abs(Math.round(adjustment)).toLocaleString()}`,
      { muted: true },
    );
  }

  y += 6;
  doc.setDrawColor(220, 220, 230);
  doc.line(labelX, y, pageW - margin, y);
  y += 20;

  // Total
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(20, 20, 30);
  doc.text("Total Paid", labelX, y);
  doc.setFontSize(16);
  doc.setTextColor(99, 102, 241);
  doc.text(`BDT ${Number(order.total).toLocaleString()}`, valueX, y, {
    align: "right",
  });

  // Footer
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(140, 140, 150);
  const footerY = doc.internal.pageSize.getHeight() - 50;
  doc.text(
    "Thank you for your purchase! For support, contact us anytime.",
    pageW / 2,
    footerY,
    { align: "center" },
  );
  doc.text(
    "AccessNow BD · Premium digital subscriptions",
    pageW / 2,
    footerY + 14,
    { align: "center" },
  );

  doc.save(`AccessNowBD-Receipt-${order.id.slice(0, 8).toUpperCase()}.pdf`);
}
