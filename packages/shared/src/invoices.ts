import { formatCents } from "./money.ts";
import { seededRandom, type Random } from "./random.ts";
import type { Invoice, InvoiceDocument } from "./types.ts";

interface Vendor {
  name: string;
  prefix: string;
  items: readonly string[];
  layout: "classic" | "compact" | "statement";
}

const vendors: readonly Vendor[] = [
  { name: "Hill Country Flour Co.", prefix: "HCF", items: ["Bread flour, 50 lb", "Rye flour, 25 lb", "Semolina, 25 lb"], layout: "classic" },
  { name: "Lone Star Packaging", prefix: "LSP", items: ["Pastry boxes, case of 200", "Kraft bags, case of 500"], layout: "compact" },
  { name: "Oven Repair Pros", prefix: "ORP", items: ["Deck oven service call", "Thermostat replacement"], layout: "statement" },
  { name: "Pecan Valley Dairy", prefix: "PVD", items: ["Unsalted butter, 36 lb", "Heavy cream, 4 gal"], layout: "classic" },
  { name: "Riverbend Eggs", prefix: "RBE", items: ["Large eggs, 15 dozen", "Liquid whites, 2 gal"], layout: "compact" },
  { name: "Capital Sugar Supply", prefix: "CSS", items: ["Cane sugar, 50 lb", "Powdered sugar, 25 lb"], layout: "statement" },
];

const buyer = "Barton Creek Bakery";

function pick<T>(items: readonly T[], random: Random): T {
  return items[Math.floor(random() * items.length)] as T;
}

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function usDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${month}/${day}/${year}`;
}

function longDate(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function render(invoice: Invoice, vendor: Vendor, lines: { item: string; cents: number }[]): string {
  const amount = formatCents(invoice.amountCents);
  const items = lines.map((line) => `  ${line.item.padEnd(32)} ${formatCents(line.cents)}`).join("\n");

  switch (vendor.layout) {
    case "classic":
      return [
        vendor.name.toUpperCase(),
        "INVOICE",
        `Invoice No: ${invoice.invoiceNumber}`,
        `Date: ${usDate(invoice.date)}`,
        `Bill To: ${buyer}`,
        "",
        items,
        "",
        `TOTAL DUE: ${amount}`,
      ].join("\n");
    case "compact":
      return [
        `${vendor.name} | Invoice #${invoice.invoiceNumber} | Issued ${longDate(invoice.date)}`,
        `Customer: ${buyer}`,
        items,
        `Amount due ${amount}, net 30`,
      ].join("\n");
    case "statement":
      return [
        `Statement from ${vendor.name}`,
        `Reference ${invoice.invoiceNumber}, dated ${invoice.date}`,
        `Prepared for ${buyer}`,
        "",
        items,
        "",
        `Please remit ${amount} by check or ACH.`,
      ].join("\n");
  }
}

export function generateInvoices(seed: number, count = 10): { invoices: Invoice[]; documents: InvoiceDocument[] } {
  const random = seededRandom(seed);
  const invoices: Invoice[] = [];
  const documents: InvoiceDocument[] = [];

  for (let i = 0; i < count; i++) {
    const vendor = vendors[i % vendors.length] as Vendor;
    const lineCount = 1 + Math.floor(random() * 2);
    const lines = Array.from({ length: lineCount }, () => ({
      item: pick(vendor.items, random),
      cents: 2500 + Math.floor(random() * 45000),
    }));
    const invoice: Invoice = {
      invoiceId: `doc-${String(i + 1).padStart(2, "0")}`,
      vendor: vendor.name,
      invoiceNumber: `${vendor.prefix}-${10000 + Math.floor(random() * 90000)}`,
      date: isoDate(2026, 9 + Math.floor(random() * 2), 1 + Math.floor(random() * 28)),
      amountCents: lines.reduce((sum, line) => sum + line.cents, 0),
    };
    invoices.push(invoice);
    documents.push({ invoiceId: invoice.invoiceId, document: render(invoice, vendor, lines) });
  }

  return { invoices, documents };
}
