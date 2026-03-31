/** Example structured parse aligned with agent JSON guardrails. */
export function getDemoParsedPayload(docId: string) {
  return {
    document_id: docId,
    document_type: "receipt",
    currency: "USD",
    issuer: "Metro Fuel Co.",
    issued_at: "2026-03-28",
    line_items: [
 { description: "Diesel — pump 4", quantity: 1, unit_price: 412.05, total: 412.05 },
    ],
    subtotal: 412.05,
    tax_total: 0,
    grand_total: 412.05,
    confidence: 0.91,
  } as const;
}
