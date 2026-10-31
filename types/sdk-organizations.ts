import { apiFetch, type ApiClientConfig } from "./client";
import type { Paginated } from "./tenants";

export type OrgType = "REGISTERED" | "UNREGISTERED";
export type OrgStatus = "ACTIVATED" | "DEACTIVATED" | "ARCHIVED";

/** Mirrors apps/api's ORG_LIST_SELECT/OrganizationRecord — the lean shape used
 *  by list()/listForMember(). `primaryGstin`/`gstStatus` come from that
 *  record's org's primary (non-deleted) GstRegistration, resolved server-side
 *  via one batched nested-select join, never N+1. */
export interface OrganizationRecord {
  id: string;
  tenantId: string;
  slug: string;
  legalName: string;
  tradeName: string | null;
  displayName: string;
  type: OrgType;
  status: OrgStatus;
  stateCode: string | null;
  createdAt: string;
  primaryGstin: string | null;
  gstStatus: string | null;
}

export interface OrganizationAddressView {
  id: string;
  address1: string | null;
  address2: string | null;
  address3: string | null;
  landmark: string | null;
  city: string | null;
  district: string | null;
  stateName: string | null;
  stateCode: string | null;
  pincode: string | null;
  country: string;
}

export interface GstPlaceView {
  id: string;
  placeType: string;
  sortOrder: number;
  buildingName: string | null;
  doorNo: string | null;
  floorNo: string | null;
  street: string | null;
  location: string | null;
  locality: string | null;
  city: string | null;
  district: string | null;
  pincode: string | null;
  landmark: string | null;
  stateName: string | null;
  stateCode: string | null;
  nature: string | null;
}

/** Dates arrive as ISO strings over the wire (mirrors TenantRecord.createdAt's
 *  precedent) — apps/api's OrganizationDetailRecord has these as `Date | null`. */
export interface GstRegistrationView {
  id: string;
  gstin: string;
  isPrimary: boolean;
  internalLabel: string | null;
  legalName: string;
  tradeName: string | null;
  status: string;
  constitution: string | null;
  taxpayerType: string | null;
  registrationDate: string | null;
  cancellationDate: string | null;
  stateCode: string | null;
  stateJurisdiction: string | null;
  stateJurisdictionCode: string | null;
  centreJurisdiction: string | null;
  centreJurisdictionCode: string | null;
  eInvoiceEnabled: boolean;
  natureOfBusiness: string[];
  natureOfCoreBusinessActivity: string | null;
  portalLastUpdate: string | null;
  lastFetchedAt: string | null;
  fetchEnvironment: string | null;
  places: GstPlaceView[];
}

/** The wide, single-organization view (mirrors apps/api's OrganizationDetailRecord)
 *  — what getOrganization() returns and what the edit form seeds itself from.
 *  Deliberately a separate, heavier shape from OrganizationRecord above, same
 *  split as the API's own list-select vs detail-select (CLAUDE.md §5 KISS). */
export interface OrganizationDetail {
  id: string;
  tenantId: string;
  slug: string;
  legalName: string;
  tradeName: string | null;
  displayName: string;
  printName: string | null;
  abbreviation: string | null;
  type: OrgType;
  status: OrgStatus;
  dateOfIncorporation: string | null;
  isApproved: boolean;
  email: string | null;
  phone: string | null;
  alternatePhone: string | null;
  website: string | null;
  logoPath: string | null;
  stateCode: string | null;
  createdAt: string;
  updatedAt: string;
  principalAddress: OrganizationAddressView | null;
  gstRegistration: GstRegistrationView | null;
  pan: string | null;
}

/** Mirrors platform-gstin-lookup.controller.ts's response — deliberately has
 *  no `rawPayload` key (the raw vendor blob never leaves the server). */
export interface GstinLookupResponse {
  gstin: string;
  legalName: string | null;
  tradeName: string | null;
  status: string | null;
  constitution: string | null;
  taxpayerType: string | null;
  registrationDate: string | null;
  cancellationDate: string | null;
  stateJurisdiction: string | null;
  stateJurisdictionCode: string | null;
  centreJurisdiction: string | null;
  centreJurisdictionCode: string | null;
  eInvoiceEnabled: boolean;
  natureOfBusiness: string[];
  natureOfCoreBusinessActivity: string | null;
  portalLastUpdate: string | null;
  principalPlace: GstinLookupPlaceView | null;
  additionalPlaces: GstinLookupPlaceView[];
  derived: { stateCode: string; stateName: string | null; pan: string };
  conflict: { organizationId: string; displayName: string } | null;
}

export interface GstinLookupPlaceView {
  buildingName: string | null;
  doorNo: string | null;
  floorNo: string | null;
  street: string | null;
  location: string | null;
  locality: string | null;
  city: string | null;
  district: string | null;
  pincode: string | null;
  landmark: string | null;
  stateName: string | null;
  natureOfBusiness: string | null;
  /** The portal's lt / lg / geocodelvl; absent from older servers. */
  latitude?: number | null;
  longitude?: number | null;
  geocodeLevel?: string | null;
}

/** Mirrors CreateOrganizationDto + CreatePlatformOrganizationDto (flat, no
 *  nested address object — matches the API's own DTO shape, see that class's
 *  docblock for why it avoids nesting). */
export interface CreateOrganizationInput {
  slug: string;
  legalName?: string;
  displayName: string;
  type: OrgType;
  ownerUserId: string;
  tradeName?: string;
  printName?: string;
  abbreviation?: string;
  gstin?: string;
  internalLabel?: string;
  address1: string;
  address2?: string;
  address3?: string;
  landmark?: string;
  city: string;
  district?: string;
  stateCode: string;
  pincode: string;
  /** First financial year, as the calendar year it starts in (2024 is 2024-25): 2017 up to the current financial year. */
  startingFinancialYear: number;
  email?: string;
  phone?: string;
  alternatePhone?: string;
  website?: string;
  pan?: string;
}

/** Mirrors UpdatePlatformOrganizationDto — no `type` (immutable after create)
 *  and no `gstin` (no re-fetch flow in this slice). `legalName`/`tradeName`/
 *  `pan` ARE here (editable for an UNREGISTERED org) — the freeze for a
 *  REGISTERED org is enforced server-side, not by this type. */
export interface UpdateOrganizationInput {
  legalName?: string;
  tradeName?: string;
  displayName?: string;
  printName?: string;
  abbreviation?: string;
  status?: OrgStatus;
  email?: string;
  phone?: string;
  alternatePhone?: string;
  website?: string;
  /** ISO 8601 date string. */
  dateOfIncorporation?: string;
  internalLabel?: string;
  pan?: string;
  address1?: string;
  address2?: string;
  address3?: string;
  landmark?: string;
  city?: string;
  district?: string;
  stateCode?: string;
  pincode?: string;
}

function orgsPath(tenantId: string, id?: string): string {
  const base = `/platform/tenants/${encodeURIComponent(tenantId)}/organizations`;
  return id ? `${base}/${encodeURIComponent(id)}` : base;
}

export function listOrganizations(
  config: ApiClientConfig,
  tenantId: string,
  params: { search?: string; page?: number; pageSize?: number } = {},
): Promise<Paginated<OrganizationRecord>> {
  const q = new URLSearchParams();
  if (params.search) q.set("search", params.search);
  if (params.page) q.set("page", String(params.page));
  if (params.pageSize) q.set("pageSize", String(params.pageSize));
  const qs = q.toString();
  return apiFetch<Paginated<OrganizationRecord>>(config, `${orgsPath(tenantId)}${qs ? `?${qs}` : ""}`);
}

/** Returns the WIDE detail view (address, GST registration + places, PAN) —
 *  GET :id now calls OrganizationsService.findDetailById() server-side, not
 *  the lean findById() that list()/listForMember() use. */
export function getOrganization(config: ApiClientConfig, tenantId: string, id: string): Promise<OrganizationDetail> {
  return apiFetch<OrganizationDetail>(config, orgsPath(tenantId, id));
}

export function createOrganization(
  config: ApiClientConfig,
  tenantId: string,
  data: CreateOrganizationInput,
): Promise<OrganizationRecord> {
  return apiFetch<OrganizationRecord>(config, orgsPath(tenantId), {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateOrganization(
  config: ApiClientConfig,
  tenantId: string,
  id: string,
  data: UpdateOrganizationInput,
): Promise<OrganizationRecord> {
  return apiFetch<OrganizationRecord>(config, orgsPath(tenantId, id), {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/** GET /platform/tenants/:tenantId/gst/taxpayers/:gstin — a read-only preview
 *  with no side effects (see platform-gstin-lookup.controller.ts's docblock).
 *  `gstin` is caller-supplied — encodeURIComponent guards against it steering
 *  the request to a different path (matches getTenant()'s precedent). */
export function lookupGstin(config: ApiClientConfig, tenantId: string, gstin: string): Promise<GstinLookupResponse> {
  return apiFetch<GstinLookupResponse>(
    config,
    `/platform/tenants/${encodeURIComponent(tenantId)}/gst/taxpayers/${encodeURIComponent(gstin)}`,
  );
}
