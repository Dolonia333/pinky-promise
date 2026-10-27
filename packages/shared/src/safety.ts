const SAFE_TEXT =
  /^(\d{4}-\d{2}-\d{2}|\d+\.\d+\.\d+|git|claude_code|codex|challenge|chatgpt|claude_chat|strong|medium|weak|none)$/;

export function assertOnlyNumbers(value: unknown, path = "payload"): void {
  if (typeof value === "string") {
    if (!SAFE_TEXT.test(value)) throw new Error(`Refusing to upload free text at ${path}`);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertOnlyNumbers(item, `${path}[${index}]`));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) assertOnlyNumbers(item, `${path}.${key}`);
  }
}
