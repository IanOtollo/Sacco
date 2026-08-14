/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as accounts_helpers from "../accounts/helpers.js";
import type * as accounts_mutations from "../accounts/mutations.js";
import type * as accounts_queries from "../accounts/queries.js";
import type * as announcements_mutations from "../announcements/mutations.js";
import type * as announcements_queries from "../announcements/queries.js";
import type * as audit from "../audit.js";
import type * as audit_queries from "../audit/queries.js";
import type * as auth from "../auth.js";
import type * as auth_actions from "../auth_actions.js";
import type * as authz from "../authz.js";
import type * as contributions_mutations from "../contributions/mutations.js";
import type * as contributions_queries from "../contributions/queries.js";
import type * as crons from "../crons.js";
import type * as dividends_mutations from "../dividends/mutations.js";
import type * as dividends_queries from "../dividends/queries.js";
import type * as http from "../http.js";
import type * as legal_mutations from "../legal/mutations.js";
import type * as legal_queries from "../legal/queries.js";
import type * as loanProducts_mutations from "../loanProducts/mutations.js";
import type * as loanProducts_queries from "../loanProducts/queries.js";
import type * as loans_crons from "../loans/crons.js";
import type * as loans_helpers from "../loans/helpers.js";
import type * as loans_mutations from "../loans/mutations.js";
import type * as loans_queries from "../loans/queries.js";
import type * as members_crons from "../members/crons.js";
import type * as members_helpers from "../members/helpers.js";
import type * as members_mutations from "../members/mutations.js";
import type * as members_queries from "../members/queries.js";
import type * as membershipApplications_mutations from "../membershipApplications/mutations.js";
import type * as membershipApplications_queries from "../membershipApplications/queries.js";
import type * as notifications_helpers from "../notifications/helpers.js";
import type * as notifications_mutations from "../notifications/mutations.js";
import type * as notifications_queries from "../notifications/queries.js";
import type * as passwordResets_mutations from "../passwordResets/mutations.js";
import type * as passwordResets_queries from "../passwordResets/queries.js";
import type * as reports_queries from "../reports/queries.js";
import type * as seed from "../seed.js";
import type * as settings_definitions from "../settings/definitions.js";
import type * as settings_mutations from "../settings/mutations.js";
import type * as settings_queries from "../settings/queries.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "accounts/helpers": typeof accounts_helpers;
  "accounts/mutations": typeof accounts_mutations;
  "accounts/queries": typeof accounts_queries;
  "announcements/mutations": typeof announcements_mutations;
  "announcements/queries": typeof announcements_queries;
  audit: typeof audit;
  "audit/queries": typeof audit_queries;
  auth: typeof auth;
  auth_actions: typeof auth_actions;
  authz: typeof authz;
  "contributions/mutations": typeof contributions_mutations;
  "contributions/queries": typeof contributions_queries;
  crons: typeof crons;
  "dividends/mutations": typeof dividends_mutations;
  "dividends/queries": typeof dividends_queries;
  http: typeof http;
  "legal/mutations": typeof legal_mutations;
  "legal/queries": typeof legal_queries;
  "loanProducts/mutations": typeof loanProducts_mutations;
  "loanProducts/queries": typeof loanProducts_queries;
  "loans/crons": typeof loans_crons;
  "loans/helpers": typeof loans_helpers;
  "loans/mutations": typeof loans_mutations;
  "loans/queries": typeof loans_queries;
  "members/crons": typeof members_crons;
  "members/helpers": typeof members_helpers;
  "members/mutations": typeof members_mutations;
  "members/queries": typeof members_queries;
  "membershipApplications/mutations": typeof membershipApplications_mutations;
  "membershipApplications/queries": typeof membershipApplications_queries;
  "notifications/helpers": typeof notifications_helpers;
  "notifications/mutations": typeof notifications_mutations;
  "notifications/queries": typeof notifications_queries;
  "passwordResets/mutations": typeof passwordResets_mutations;
  "passwordResets/queries": typeof passwordResets_queries;
  "reports/queries": typeof reports_queries;
  seed: typeof seed;
  "settings/definitions": typeof settings_definitions;
  "settings/mutations": typeof settings_mutations;
  "settings/queries": typeof settings_queries;
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

export declare const components: {};
