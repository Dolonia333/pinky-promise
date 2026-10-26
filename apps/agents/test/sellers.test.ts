import { generateInvoices, verifyDelivery } from "@pinky/shared";
import { describe, expect, it } from "vitest";
import { extractWithParser } from "../src/extract.ts";
import { coastingCarl, honestAbe, slySal } from "../src/sellers.ts";

const { invoices, documents } = generateInvoices(2026);
const invoiceIds = invoices.map((invoice) => invoice.invoiceId);
const expectedTotalCents = invoices.reduce((sum, invoice) => sum + invoice.amountCents, 0);

function verify(delivery: unknown, spotCheckIds: string[]) {
  return verifyDelivery({
    delivery,
    invoiceIds,
    spotChecks: invoices.filter((invoice) => spotCheckIds.includes(invoice.invoiceId)),
    expectedTotalCents,
    deadline: new Date(Date.now() + 60_000),
    submittedAt: new Date(),
  });
}

describe("invoice parser", () => {
  it("reads every invoice layout exactly", () => {
    expect(extractWithParser(documents)).toEqual(invoices);
  });
});

describe("sellers", () => {
  it("Honest Abe gets paid", async () => {
    const delivery = await honestAbe({ model: "unused" }).work(documents);
    expect(verify(delivery, ["doc-02", "doc-09"]).verdict).toBe("release");
  });

  it("Coasting Carl is never paid, whichever invoices get spot checked", async () => {
    const delivery = await coastingCarl(1).work(documents);
    for (const spotChecks of [["doc-01", "doc-02"], ["doc-03", "doc-08"], ["doc-06", "doc-07"]]) {
      expect(verify(delivery, spotChecks).verdict).not.toBe("release");
    }
  });

  it("Sly Sal is refunded and flagged", async () => {
    const result = verify(await slySal().work(documents), ["doc-01", "doc-02"]);
    expect(result).toMatchObject({ verdict: "refund", flagged: true });
  });
});
