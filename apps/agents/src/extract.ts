import Anthropic from "@anthropic-ai/sdk";
import { deliverySchema, type Invoice, type InvoiceDocument } from "@pinky/shared";

const months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

function toCents(amount: string): number {
  return Math.round(Number(amount.replace(/[$,]/g, "")) * 100);
}

function titleCase(text: string): string {
  return text.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function pad(value: string | number): string {
  return String(value).padStart(2, "0");
}

function parseDate(text: string): string | null {
  const iso = text.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return iso[0];
  const us = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (us) return `${us[3]}-${pad(us[1] as string)}-${pad(us[2] as string)}`;
  const long = text.match(/([A-Za-z]+) (\d{1,2}), (\d{4})/);
  if (long) {
    const month = months.indexOf((long[1] as string).toLowerCase());
    if (month >= 0) return `${long[3]}-${pad(month + 1)}-${pad(long[2] as string)}`;
  }
  return null;
}

export function parseInvoice({ invoiceId, document }: InvoiceDocument): Invoice | null {
  const lines = document.split("\n");
  const first = lines[0] ?? "";

  const vendor =
    first.match(/^Statement from (.+)$/)?.[1] ?? first.match(/^(.+?) \| Invoice #/)?.[1] ?? (first === first.toUpperCase() ? titleCase(first) : null);
  const invoiceNumber = document.match(/(?:Invoice No: |Invoice #|Reference )([A-Z]+-\d+)/)?.[1];
  const total = document.match(/(?:TOTAL DUE: |Amount due |Please remit )(\$[\d,]+\.\d{2})/)?.[1];
  const date = parseDate(document.match(/(?:Date: |Issued |dated )(.+)/)?.[1] ?? "");

  if (!vendor || !invoiceNumber || !total || !date) return null;
  return { invoiceId, vendor, invoiceNumber, date, amountCents: toCents(total) };
}

const extractionPrompt = `You extract structured data from vendor invoices.
Return only JSON shaped like {"invoices":[{"invoiceId":"","vendor":"","invoiceNumber":"","date":"YYYY-MM-DD","amountCents":0}]}.
Use the invoice total, not individual line items. amountCents is an integer number of cents.`;

export async function extractWithModel(documents: InvoiceDocument[], apiKey: string, model: string): Promise<Invoice[]> {
  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model,
    max_tokens: 2000,
    system: extractionPrompt,
    messages: [{ role: "user", content: JSON.stringify(documents) }],
  });
  const text = response.content.map((block) => (block.type === "text" ? block.text : "")).join("");
  const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  return deliverySchema.parse(JSON.parse(json)).invoices;
}

export function extractWithParser(documents: InvoiceDocument[]): Invoice[] {
  return documents.map((doc) => {
    const invoice = parseInvoice(doc);
    if (!invoice) throw new Error(`Could not read invoice ${doc.invoiceId}`);
    return invoice;
  });
}
