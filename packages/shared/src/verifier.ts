import { z } from "zod";
import { formatCents } from "./money.ts";
import type { CheckName, CheckResult, Invoice, VerificationResult } from "./types.ts";

export const deliverySchema = z.object({
  invoices: z.array(
    z.object({
      invoiceId: z.string(),
      vendor: z.string(),
      invoiceNumber: z.string(),
      date: z.string(),
      amountCents: z.number(),
    }),
  ),
});

export type Delivery = z.infer<typeof deliverySchema>;

export interface VerificationInput {
  delivery: unknown;
  invoiceIds: readonly string[];
  spotChecks: readonly Invoice[];
  expectedTotalCents: number;
  deadline: Date;
  submittedAt: Date;
}

const verifierDirectedPatterns = [
  /approve (the |this )?(payment|payout|release)/i,
  /release (the |my )?(funds|payment|money)/i,
  /ignore (all |any |your |previous |prior )*(instructions|rules|checks)/i,
  /mark (this|the task|it) (as )?(complete|passed|verified)/i,
  /\b(verifier|checker|system)\s*[:,]/i,
  /you (must|should) (pay|approve)/i,
];

const sanityTolerance = 0.01;
const hardChecks: readonly CheckName[] = ["format", "completeness", "spot_checks", "deadline", "verifier_directed_text"];

function normalize(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

function findVerifierDirectedText(raw: string): string | null {
  for (const pattern of verifierDirectedPatterns) {
    const match = raw.match(pattern);
    if (match) return match[0];
  }
  return null;
}

function checkCompleteness(delivery: Delivery, invoiceIds: readonly string[]): CheckResult {
  const delivered = delivery.invoices.map((invoice) => invoice.invoiceId);
  const missing = invoiceIds.filter((id) => !delivered.includes(id));
  const duplicates = delivered.filter((id, index) => delivered.indexOf(id) !== index);
  const unexpected = delivered.filter((id) => !invoiceIds.includes(id));

  if (missing.length === 0 && duplicates.length === 0 && unexpected.length === 0) {
    return { name: "completeness", passed: true, detail: `All ${invoiceIds.length} invoices delivered` };
  }
  const problems = [
    missing.length ? `missing ${missing.join(", ")}` : "",
    duplicates.length ? `duplicated ${[...new Set(duplicates)].join(", ")}` : "",
    unexpected.length ? `unexpected ${unexpected.join(", ")}` : "",
  ].filter(Boolean);
  return { name: "completeness", passed: false, detail: `Delivery ${problems.join("; ")}` };
}

function checkSpotChecks(delivery: Delivery, spotChecks: readonly Invoice[]): CheckResult {
  for (const expected of spotChecks) {
    const actual = delivery.invoices.find((invoice) => invoice.invoiceId === expected.invoiceId);
    if (!actual) {
      return { name: "spot_checks", passed: false, detail: `Invoice ${expected.invoiceNumber} was not delivered` };
    }
    if (normalize(actual.invoiceNumber) !== normalize(expected.invoiceNumber)) {
      return {
        name: "spot_checks",
        passed: false,
        detail: `Invoice ${expected.invoiceNumber}: delivered number ${actual.invoiceNumber}`,
      };
    }
    if (actual.amountCents !== expected.amountCents) {
      return {
        name: "spot_checks",
        passed: false,
        detail: `Invoice ${expected.invoiceNumber}: expected ${formatCents(expected.amountCents)}, got ${formatCents(actual.amountCents)}`,
      };
    }
  }
  return { name: "spot_checks", passed: true, detail: `${spotChecks.length} hidden spot checks matched` };
}

function checkSanity(delivery: Delivery, expectedTotalCents: number): CheckResult {
  const badAmount = delivery.invoices.find((invoice) => !Number.isInteger(invoice.amountCents) || invoice.amountCents <= 0);
  if (badAmount) {
    return { name: "sanity", passed: false, detail: `Invoice ${badAmount.invoiceNumber} has an invalid amount` };
  }
  const badDate = delivery.invoices.find(
    (invoice) => !/^\d{4}-\d{2}-\d{2}$/.test(invoice.date) || Number.isNaN(Date.parse(invoice.date)),
  );
  if (badDate) {
    return { name: "sanity", passed: false, detail: `Invoice ${badDate.invoiceNumber} has an invalid date "${badDate.date}"` };
  }
  const total = delivery.invoices.reduce((sum, invoice) => sum + invoice.amountCents, 0);
  if (Math.abs(total - expectedTotalCents) > expectedTotalCents * sanityTolerance) {
    return {
      name: "sanity",
      passed: false,
      detail: `Delivered total ${formatCents(total)} is more than 1% off the expected ${formatCents(expectedTotalCents)}`,
    };
  }
  return { name: "sanity", passed: true, detail: `Amounts, dates, and total ${formatCents(total)} look right` };
}

function decide(checks: readonly CheckResult[]): VerificationResult["verdict"] {
  const failed = checks.filter((check) => !check.passed).map((check) => check.name);
  if (failed.length === 0) return "release";
  if (failed.some((name) => hardChecks.includes(name))) return "refund";
  return "dispute";
}

export function verifyDelivery(input: VerificationInput): VerificationResult {
  const raw = typeof input.delivery === "string" ? input.delivery : JSON.stringify(input.delivery ?? "");
  const directed = findVerifierDirectedText(raw);
  const directedCheck: CheckResult = directed
    ? { name: "verifier_directed_text", passed: false, detail: `Delivery tried to instruct the verifier: "${directed}"` }
    : { name: "verifier_directed_text", passed: true, detail: "No instructions aimed at the verifier" };

  const onTime = input.submittedAt.getTime() <= input.deadline.getTime();
  const deadlineCheck: CheckResult = {
    name: "deadline",
    passed: onTime,
    detail: onTime ? "Delivered before the deadline" : "Delivered after the deadline",
  };

  const parsed = deliverySchema.safeParse(input.delivery);
  if (!parsed.success) {
    const checks: CheckResult[] = [
      { name: "format", passed: false, detail: "Delivery is not valid invoice JSON" },
      deadlineCheck,
      directedCheck,
    ];
    return { verdict: "refund", flagged: Boolean(directed), checks };
  }

  const checks: CheckResult[] = [
    { name: "format", passed: true, detail: "Delivery matches the invoice schema" },
    checkCompleteness(parsed.data, input.invoiceIds),
    checkSpotChecks(parsed.data, input.spotChecks),
    deadlineCheck,
    checkSanity(parsed.data, input.expectedTotalCents),
    directedCheck,
  ];
  return { verdict: decide(checks), flagged: Boolean(directed), checks };
}
