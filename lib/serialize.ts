import { ObjectId } from "mongodb";

export function serializeDocument(
  doc: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(doc)) {
    if (value instanceof ObjectId) {
      out[key] = value.toHexString();
    } else if (value instanceof Date) {
      out[key] = value.toISOString();
    } else {
      out[key] = value;
    }
  }

  return out;
}
