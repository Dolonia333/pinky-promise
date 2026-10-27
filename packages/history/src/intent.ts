import type { Topic } from "@pinky-promise/shared";

export type Intent = "plan" | "research" | "draft" | "verify" | "pushback";

const INTENTS: Array<[Intent, RegExp]> = [
  [
    "plan",
    /\b(plan|planning|outline|roadmap|strategy|strategi[sz]e|step[- ]by[- ]step|framework|prioriti[sz]e|priorities|milestones?|timeline|game plan|break (it|this|that) down)\b/i,
  ],
  [
    "research",
    /\b(research|compare|comparison|competitors?|alternatives|market size|benchmarks?|statistics|pros and cons|trade-?offs|look up|what are the (best|options|main)|find (me )?(sources|examples|studies|data))\b/i,
  ],
  [
    "draft",
    /\b(write|rewrite|draft|compose|create|generate|make me|e-?mail|post|tweet|deck|slides?|landing page|proposal|cover letter|one-?pager|script)\b/i,
  ],
  [
    "verify",
    /\b(sources?|citations?|cite|verify|double[- ]check|fact[- ]check|is (this|that|it) (true|accurate|right|correct)|are you sure|proofread|critique|feedback on|poke holes|edge cases|what('s| is) wrong with)\b/i,
  ],
  [
    "pushback",
    /(^\s*(no|nope|not quite|wrong|incorrect|actually|instead|try again|redo|start over)\b)|\b(that'?s (wrong|not right|not what)|not what i (asked|meant|wanted)|you misunderstood|too (long|generic|formal|casual|salesy|wordy)|make it shorter|less (formal|salesy|generic))\b/i,
  ],
];

const TOPIC_PATTERNS: Array<[Topic, RegExp]> = [
  [
    "customers",
    /\b(customers?|users?|customer interviews?|personas?|pain points?|surveys?|ideal customer|icp|churn|onboarding)\b/i,
  ],
  ["product", /\b(product|features?|mvp|prototype|wireframes?|user flow|product spec|requirements|ux)\b/i],
  ["sales", /\b(sales|selling|leads?|outreach|cold (email|call)|pipeline|crm|prospects?|pricing|close the deal)\b/i],
  [
    "marketing",
    /\b(marketing|brand(ing)?|social media|seo|ads|ad campaign|campaigns?|newsletter|launch|positioning|messaging|go-to-market|gtm)\b/i,
  ],
  [
    "fundraising",
    /\b(investors?|vcs?|venture|fundrais(e|ing)|raise (a|our|money)|pre-?seed|seed round|series a|pitch deck|term sheet|valuation|accelerator)\b/i,
  ],
  [
    "finance",
    /\b(budget|revenue|costs?|expenses?|cash ?flow|runway|burn rate|profit|margins?|forecast|accounting|taxes|invoices?|financial model)\b/i,
  ],
  [
    "hiring",
    /\b(hire|hiring|recruit(ing|er)?|candidates?|job description|interview questions|co-?founders?|equity split)\b/i,
  ],
  [
    "operations",
    /\b(operations|logistics|legal|contracts?|compliance|incorporat(e|ion)|llc|vendors?|suppliers?|processes)\b/i,
  ],
];

export function intentsOf(text: string): Set<Intent> {
  return new Set(INTENTS.filter(([, pattern]) => pattern.test(text)).map(([intent]) => intent));
}

export function topicsOf(text: string): Set<Topic> {
  return new Set(TOPIC_PATTERNS.filter(([, pattern]) => pattern.test(text)).map(([topic]) => topic));
}
