/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as CustomPassword from "../CustomPassword.js";
import type * as agentLogs from "../agentLogs.js";
import type * as auth from "../auth.js";
import type * as chat from "../chat.js";
import type * as chatAgent from "../chatAgent.js";
import type * as chatGenerate from "../chatGenerate.js";
import type * as citysuperTool from "../citysuperTool.js";
import type * as citysuper_productValidators from "../citysuper/productValidators.js";
import type * as citysuper_relevance from "../citysuper/relevance.js";
import type * as citysuper_searchProducts from "../citysuper/searchProducts.js";
import type * as citysuper_turnGuard from "../citysuper/turnGuard.js";
import type * as firecrawl_agent from "../firecrawl/agent.js";
import type * as firecrawl_client from "../firecrawl/client.js";
import type * as firecrawl_crawl from "../firecrawl/crawl.js";
import type * as firecrawl_interact from "../firecrawl/interact.js";
import type * as firecrawl_map from "../firecrawl/map.js";
import type * as firecrawl_scrape from "../firecrawl/scrape.js";
import type * as firecrawl_search from "../firecrawl/search.js";
import type * as http from "../http.js";
import type * as showCitysuperProductsTool from "../showCitysuperProductsTool.js";
import type * as tasks from "../tasks.js";
import type * as thinkTool from "../thinkTool.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  CustomPassword: typeof CustomPassword;
  agentLogs: typeof agentLogs;
  auth: typeof auth;
  chat: typeof chat;
  chatAgent: typeof chatAgent;
  chatGenerate: typeof chatGenerate;
  citysuperTool: typeof citysuperTool;
  "citysuper/productValidators": typeof citysuper_productValidators;
  "citysuper/relevance": typeof citysuper_relevance;
  "citysuper/searchProducts": typeof citysuper_searchProducts;
  "citysuper/turnGuard": typeof citysuper_turnGuard;
  "firecrawl/agent": typeof firecrawl_agent;
  "firecrawl/client": typeof firecrawl_client;
  "firecrawl/crawl": typeof firecrawl_crawl;
  "firecrawl/interact": typeof firecrawl_interact;
  "firecrawl/map": typeof firecrawl_map;
  "firecrawl/scrape": typeof firecrawl_scrape;
  "firecrawl/search": typeof firecrawl_search;
  http: typeof http;
  showCitysuperProductsTool: typeof showCitysuperProductsTool;
  tasks: typeof tasks;
  thinkTool: typeof thinkTool;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  agent: import("@convex-dev/agent/_generated/component.js").ComponentApi<"agent">;
};
