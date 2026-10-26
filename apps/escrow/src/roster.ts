import type { Agent } from "@pinky/shared";

export const roster: readonly Omit<Agent, "trustScore" | "frozen">[] = [
  { id: "buyer-bakery", name: "Barton Creek Bakery", role: "buyer" },
  { id: "seller-abe", name: "Honest Abe", role: "seller" },
  { id: "seller-carl", name: "Coasting Carl", role: "seller" },
  { id: "seller-sal", name: "Sly Sal", role: "seller" },
];

export const startingTrustScore = 50;
