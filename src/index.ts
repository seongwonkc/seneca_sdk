/**
 * @seneca/sdk — main entry.
 *
 * Most consumers should import from a specific surface:
 *   import { observe } from "@seneca/sdk/ingest";
 *   import { getUserModel } from "@seneca/sdk/query";
 *   import { queryInsights } from "@seneca/sdk/insights";
 */
export * as ingest from "./ingest/index.js";
export * as query from "./query/index.js";
export * as insights from "./insights/index.js";
export { SDK_VERSION } from "./version.js";
