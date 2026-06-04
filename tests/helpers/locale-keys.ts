import { readFileSync } from "node:fs";

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type JsonObject = { [key: string]: JsonValue };

export const flattenKeys = (value: JsonObject, prefix = ""): string[] =>
  Object.entries(value).flatMap(([key, child]) =>
    child !== null && typeof child === "object" && !Array.isArray(child)
      ? flattenKeys(child, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  );

export const loadCatalog = (locale: string): JsonObject =>
  JSON.parse(readFileSync(`messages/${locale}.json`, "utf8")) as JsonObject;
