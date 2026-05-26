export type Tenant = {
  id: string;
  name: string;
  voiceDid: string;
  faxDid: string;
  email: string;
  devices: number;
  e911Status: "Registered" | "Pending";
  e911: { street: string; city: string; province: string; postal: string };
  createdAt: string;
  sipUser: string;
  sipPass: string;
  msiUrl: string;
};

export const tenants: Tenant[] = [
  { id: "t1", name: "Oakwood Pharmacy", voiceDid: "+1 604 555 0142", faxDid: "+1 604 555 0143", email: "fax@oakwoodrx.ca", devices: 4, e911Status: "Registered", e911: { street: "1842 Oak St", city: "Vancouver", province: "BC", postal: "V6H 1S5" }, createdAt: "2024-11-04", sipUser: "oakwood_sip", sipPass: "k9!fLp2qXe7m", msiUrl: "https://provision.onerx.health/msi/oakwood-v1.4.msi" },
  { id: "t2", name: "MediCare Drug Store", voiceDid: "+1 416 555 0188", faxDid: "+1 416 555 0189", email: "notifications@medicarerx.ca", devices: 3, e911Status: "Registered", e911: { street: "204 Yonge St", city: "Toronto", province: "ON", postal: "M5B 1M4" }, createdAt: "2025-01-18", sipUser: "medicare_sip", sipPass: "M3d!cR7qZx21", msiUrl: "https://provision.onerx.health/msi/medicare-v1.4.msi" },
  { id: "t3", name: "Westside Rx", voiceDid: "+1 604 555 0211", faxDid: "+1 604 555 0212", email: "office@westsiderx.ca", devices: 2, e911Status: "Pending", e911: { street: "3201 W Broadway", city: "Vancouver", province: "BC", postal: "V6K 2H4" }, createdAt: "2025-03-02", sipUser: "westside_sip", sipPass: "Ws!Br0d7XmQ4", msiUrl: "https://provision.onerx.health/msi/westside-v1.4.msi" },
  { id: "t4", name: "CityPharm Dispensary", voiceDid: "+1 647 555 0301", faxDid: "+1 647 555 0302", email: "admin@citypharm.ca", devices: 4, e911Status: "Registered", e911: { street: "488 Queen St W", city: "Toronto", province: "ON", postal: "M5V 2B3" }, createdAt: "2025-04-22", sipUser: "citypharm_sip", sipPass: "C!tyPh4rm9zZ", msiUrl: "https://provision.onerx.health/msi/citypharm-v1.4.msi" },
  { id: "t5", name: "Northgate Compounding", voiceDid: "+1 416 555 0455", faxDid: "+1 416 555 0456", email: "rx@northgaterx.ca", devices: 3, e911Status: "Registered", e911: { street: "9501 Yonge St", city: "Richmond Hill", province: "ON", postal: "L4C 0H6" }, createdAt: "2025-02-11", sipUser: "northgate_sip", sipPass: "N0rth!G8tR9x", msiUrl: "https://provision.onerx.health/msi/northgate-v1.4.msi" },
];

export type Device = { ext: string; mac: string; model: "T54W" | "DD10K"; status: "Registered" | "Offline"; lastSeen: string };
export const devicesByTenant: Record<string, Device[]> = {
  t1: [
    { ext: "1001", mac: "80:5E:C0:1A:24:F1", model: "T54W", status: "Registered", lastSeen: "2 min ago" },
    { ext: "1002", mac: "80:5E:C0:1A:24:F2", model: "T54W", status: "Registered", lastSeen: "5 min ago" },
    { ext: "1003", mac: "00:15:65:88:AA:11", model: "DD10K", status: "Registered", lastSeen: "1 min ago" },
    { ext: "1004", mac: "80:5E:C0:1A:24:F4", model: "T54W", status: "Offline", lastSeen: "3 hours ago" },
  ],
  t2: [
    { ext: "2001", mac: "80:5E:C0:2B:11:01", model: "T54W", status: "Registered", lastSeen: "1 min ago" },
    { ext: "2002", mac: "80:5E:C0:2B:11:02", model: "T54W", status: "Registered", lastSeen: "4 min ago" },
    { ext: "2003", mac: "00:15:65:88:BB:22", model: "DD10K", status: "Registered", lastSeen: "2 min ago" },
  ],
  t3: [
    { ext: "3001", mac: "80:5E:C0:3C:33:01", model: "T54W", status: "Registered", lastSeen: "8 min ago" },
    { ext: "3002", mac: "00:15:65:88:CC:33", model: "DD10K", status: "Offline", lastSeen: "1 day ago" },
  ],
  t4: [
    { ext: "4001", mac: "80:5E:C0:4D:44:01", model: "T54W", status: "Registered", lastSeen: "just now" },
    { ext: "4002", mac: "80:5E:C0:4D:44:02", model: "T54W", status: "Registered", lastSeen: "3 min ago" },
    { ext: "4003", mac: "80:5E:C0:4D:44:03", model: "T54W", status: "Registered", lastSeen: "6 min ago" },
    { ext: "4004", mac: "00:15:65:88:DD:44", model: "DD10K", status: "Registered", lastSeen: "1 min ago" },
  ],
  t5: [
    { ext: "5001", mac: "80:5E:C0:5E:55:01", model: "T54W", status: "Registered", lastSeen: "2 min ago" },
    { ext: "5002", mac: "80:5E:C0:5E:55:02", model: "T54W", status: "Registered", lastSeen: "12 min ago" },
    { ext: "5003", mac: "00:15:65:88:EE:55", model: "DD10K", status: "Offline", lastSeen: "5 hours ago" },
  ],
};

export type Extension = { ext: string; name: string; vmEmail: string };
export const extensionsByTenant: Record<string, Extension[]> = {
  t1: [
    { ext: "1001", name: "Front Counter", vmEmail: "fax@oakwoodrx.ca" },
    { ext: "1002", name: "Pharmacist Desk", vmEmail: "rx@oakwoodrx.ca" },
    { ext: "1003", name: "Consult Room", vmEmail: "consult@oakwoodrx.ca" },
  ],
  t2: [{ ext: "2001", name: "Reception", vmEmail: "vm@medicarerx.ca" }, { ext: "2002", name: "Pharmacy", vmEmail: "rx@medicarerx.ca" }],
  t3: [{ ext: "3001", name: "Main Line", vmEmail: "office@westsiderx.ca" }],
  t4: [{ ext: "4001", name: "Front Counter", vmEmail: "front@citypharm.ca" }, { ext: "4002", name: "Dispensary", vmEmail: "disp@citypharm.ca" }],
  t5: [{ ext: "5001", name: "Compounding Lab", vmEmail: "lab@northgaterx.ca" }, { ext: "5002", name: "Consultation", vmEmail: "consult@northgaterx.ca" }],
};

export type FaxStatus = "Delivered" | "Failed" | "Queued" | "Canceled" | "Emailed";
export type FaxRecord = {
  id: string;
  tenantId: string;
  direction: "in" | "out";
  from: string;
  to: string;
  did: string;
  pages: number;
  at: string;
  status: FaxStatus;
  emailSentAt?: string;
  jobId?: string;
};

export const faxes: FaxRecord[] = [
  { id: "f1", tenantId: "t1", direction: "in", from: "+1 604 555 0922", to: "—", did: "+1 604 555 0143", pages: 3, at: "2026-05-11 09:42", status: "Emailed", emailSentAt: "2026-05-11 09:43" },
  { id: "f2", tenantId: "t1", direction: "in", from: "+1 778 555 0188", to: "—", did: "+1 604 555 0143", pages: 1, at: "2026-05-11 08:14", status: "Emailed", emailSentAt: "2026-05-11 08:14" },
  { id: "f3", tenantId: "t2", direction: "in", from: "+1 416 555 0700", to: "—", did: "+1 416 555 0189", pages: 7, at: "2026-05-11 07:55", status: "Failed" },
  { id: "f4", tenantId: "t4", direction: "in", from: "+1 647 555 0411", to: "—", did: "+1 647 555 0302", pages: 2, at: "2026-05-10 22:01", status: "Emailed", emailSentAt: "2026-05-10 22:01" },
  { id: "f5", tenantId: "t1", direction: "out", from: "+1 604 555 0143", to: "+1 604 555 9911", did: "+1 604 555 0143", pages: 4, at: "2026-05-11 10:11", status: "Delivered", jobId: "txn_4f2a91b8" },
  { id: "f6", tenantId: "t2", direction: "out", from: "+1 416 555 0189", to: "+1 905 555 0444", did: "+1 416 555 0189", pages: 2, at: "2026-05-11 09:30", status: "Queued", jobId: "txn_5b12cc01" },
  { id: "f7", tenantId: "t3", direction: "out", from: "+1 604 555 0212", to: "+1 250 555 0111", did: "+1 604 555 0212", pages: 1, at: "2026-05-11 06:22", status: "Failed", jobId: "txn_6c33dd99" },
  { id: "f8", tenantId: "t4", direction: "out", from: "+1 647 555 0302", to: "+1 416 555 0808", did: "+1 647 555 0302", pages: 5, at: "2026-05-10 18:44", status: "Delivered", jobId: "txn_7d44ee21" },
  { id: "f9", tenantId: "t5", direction: "out", from: "+1 416 555 0456", to: "+1 905 555 0212", did: "+1 416 555 0456", pages: 3, at: "2026-05-11 11:02", status: "Delivered", jobId: "txn_8e55ff42" },
  { id: "f10", tenantId: "t5", direction: "in", from: "+1 416 555 0290", to: "—", did: "+1 416 555 0456", pages: 6, at: "2026-05-11 10:40", status: "Emailed", emailSentAt: "2026-05-11 10:41" },
];

export type AuditEvent = "FAX_RECEIVED" | "FAX_SENT" | "VOICEMAIL" | "E911_UPDATE" | "PROVISIONING" | "SIP_AUTH_FAILURE";
export type AuditRow = { id: string; tenantId: string; at: string; type: AuditEvent; description: string; operator: string };
export const auditByTenant: Record<string, AuditRow[]> = {
  t1: [
    { id: "a1", tenantId: "t1", at: "2026-05-11 10:11", type: "FAX_SENT", description: "Outbound fax to +1 604 555 9911 (4 pages)", operator: "system" },
    { id: "a2", tenantId: "t1", at: "2026-05-11 09:42", type: "FAX_RECEIVED", description: "Inbound fax from +1 604 555 0922 emailed to fax@oakwoodrx.ca", operator: "system" },
    { id: "a3", tenantId: "t1", at: "2026-05-10 14:30", type: "E911_UPDATE", description: "E911 civic address verified with provider", operator: "admin@onerx" },
    { id: "a4", tenantId: "t1", at: "2024-11-04 09:00", type: "PROVISIONING", description: "Tenant provisioned, MSI generated", operator: "admin@onerx" },
    { id: "a5", tenantId: "t1", at: "2026-05-09 03:12", type: "SIP_AUTH_FAILURE", description: "Failed SIP auth from 185.220.101.44 (3 attempts)", operator: "system" },
    { id: "a6", tenantId: "t1", at: "2026-05-08 16:55", type: "VOICEMAIL", description: "Voicemail left at ext 1002, emailed to rx@oakwoodrx.ca", operator: "system" },
  ],
  t2: [], t3: [], t4: [], t5: [],
};

export type Blacklist = { id: string; number: string; scope: "Platform" | string; addedBy: string; addedAt: string };
export const blacklist: Blacklist[] = [
  { id: "b1", number: "+1 800 555 0100", scope: "Platform", addedBy: "admin@onerx", addedAt: "2026-04-22" },
  { id: "b2", number: "+1 888 555 0144", scope: "Platform", addedBy: "admin@onerx", addedAt: "2026-04-12" },
  { id: "b3", number: "+1 416 555 9999", scope: "MediCare Drug Store", addedBy: "ops@onerx", addedAt: "2026-05-02" },
  { id: "b4", number: "+1 604 555 8800", scope: "Oakwood Pharmacy", addedBy: "ops@onerx", addedAt: "2026-05-08" },
];

export type ApiLog = { id: string; at: string; endpoint: string; tenantId: string; status: 200 | 400 | 500; durationMs: number; operator: string; request: object; response: object };
export const apiLogs: ApiLog[] = [
  { id: "l6", at: "2026-05-26 11:42", endpoint: "GET /api/v1/tenants/t1/health", tenantId: "t1", status: 200, durationMs: 34, operator: "system", request: { probe: "sip-registrar" }, response: { ok: true, extensionsOnline: 3, latencyMs: 12 } },
  { id: "l7", at: "2026-05-26 11:18", endpoint: "POST /api/v1/faxes/send", tenantId: "t4", status: 200, durationMs: 96, operator: "ops@onerx", request: { to: "+1 647 555 0301", pages: 2, coverSheet: true }, response: { jobId: "txn_v07_smoke_01", status: "queued" } },
  { id: "l8", at: "2026-05-26 10:55", endpoint: "PATCH /tenants/t5/voice", tenantId: "t5", status: 200, durationMs: 178, operator: "admin@onerx", request: { ringTimeoutSec: 30, voicemail: true }, response: { ok: true, appliedAt: "2026-05-26T10:55:01Z" } },
  { id: "l9", at: "2026-05-26 10:31", endpoint: "POST /api/v1/blacklist", tenantId: "t2", status: 400, durationMs: 51, operator: "ops@onerx", request: { number: "not-a-phone" }, response: { error: "E.164 format required" } },
  { id: "l10", at: "2026-05-26 09:47", endpoint: "GET /api/v1/faxes/inbox", tenantId: "t3", status: 200, durationMs: 63, operator: "system", request: { since: "2026-05-25T00:00:00Z", limit: 50 }, response: { count: 7, unread: 2 } },
  { id: "l11", at: "2026-05-26 09:12", endpoint: "POST /tenants/t1/extensions", tenantId: "t1", status: 500, durationMs: 891, operator: "admin@onerx", request: { ext: "1004", name: "Delivery Desk" }, response: { error: "provisioner unavailable — retry later" } },
  { id: "l1", at: "2026-05-11 10:14", endpoint: "POST /tenants", tenantId: "t5", status: 200, durationMs: 412, operator: "admin@onerx", request: { name: "Northgate Compounding", voiceDid: "+1 416 555 0455" }, response: { id: "t5", msiUrl: "https://provision.onerx.health/msi/northgate-v1.4.msi" } },
  { id: "l2", at: "2026-05-11 09:42", endpoint: "POST /api/v1/faxes/send", tenantId: "t1", status: 200, durationMs: 88, operator: "system", request: { to: "+1 604 555 9911", pages: 4 }, response: { jobId: "txn_4f2a91b8", status: "queued" } },
  { id: "l3", at: "2026-05-11 08:01", endpoint: "PUT /tenants/t3/e911", tenantId: "t3", status: 400, durationMs: 122, operator: "admin@onerx", request: { postal: "INVALID" }, response: { error: "postal code format invalid" } },
  { id: "l4", at: "2026-05-10 22:48", endpoint: "POST /tenants/t2/extensions", tenantId: "t2", status: 200, durationMs: 201, operator: "admin@onerx", request: { ext: "2003", name: "Consult" }, response: { ok: true } },
  { id: "l5", at: "2026-05-10 18:09", endpoint: "POST /api/v1/faxes/send", tenantId: "t3", status: 500, durationMs: 30412, operator: "system", request: { to: "+1 250 555 0111" }, response: { error: "telnyx upstream timeout" } },
];

export const recentActivity = [
  { at: "2026-05-11 10:14", text: "Fax sent — Oakwood Pharmacy → +1 604 555 9911 (4 pages)", kind: "fax" as const },
  { at: "2026-05-11 10:11", text: "SIP registered — ext 4001 (CityPharm Dispensary)", kind: "sip" as const },
  { at: "2026-05-11 09:42", text: "Fax received — Oakwood Pharmacy, emailed to fax@oakwoodrx.ca", kind: "fax" as const },
  { at: "2026-05-11 09:30", text: "Voicemail delivered — MediCare Drug Store ext 2002", kind: "vm" as const },
  { at: "2026-05-11 08:14", text: "Fax received — Oakwood Pharmacy (1 page)", kind: "fax" as const },
  { at: "2026-05-11 07:55", text: "Fax FAILED — MediCare Drug Store from +1 416 555 0700", kind: "fax-fail" as const },
  { at: "2026-05-11 06:22", text: "Outbound fax FAILED — Westside Rx (Telnyx timeout)", kind: "fax-fail" as const },
  { at: "2026-05-09 03:12", text: "SIP auth failure — Oakwood Pharmacy from 185.220.101.44", kind: "alert" as const },
];

export type CallDisposition = "Answered" | "Missed" | "Busy" | "Failed" | "Voicemail";

export type CallLogRecord = {
  id: string;
  tenantId: string;
  direction: "in" | "out";
  from: string;
  to: string;
  did: string;
  extension: string;
  extensionName: string;
  startedAt: string;
  endedAt: string;
  durationSec: number;
  ringSec: number;
  disposition: CallDisposition;
  codec: string;
  sipCallId: string;
  hangupCause: string;
  recordingAvailable: boolean;
  notes?: string;
};

export const callLogs: CallLogRecord[] = [
  {
    id: "c1",
    tenantId: "t1",
    direction: "in",
    from: "+1 604 555 0922",
    to: "ext 1001",
    did: "+1 604 555 0142",
    extension: "1001",
    extensionName: "Front Counter",
    startedAt: "2026-05-11 09:15:02",
    endedAt: "2026-05-11 09:18:44",
    durationSec: 222,
    ringSec: 8,
    disposition: "Answered",
    codec: "G.711u",
    sipCallId: "sip-7f3a2b1c@onerx-voice",
    hangupCause: "Normal Clearing",
    recordingAvailable: true,
    notes: "Prescription refill inquiry",
  },
  {
    id: "c2",
    tenantId: "t1",
    direction: "in",
    from: "+1 778 555 0188",
    to: "ext 1002",
    did: "+1 604 555 0142",
    extension: "1002",
    extensionName: "Pharmacist Desk",
    startedAt: "2026-05-11 08:42:11",
    endedAt: "2026-05-11 08:42:41",
    durationSec: 0,
    ringSec: 30,
    disposition: "Missed",
    codec: "—",
    sipCallId: "sip-9a1d4e8f@onerx-voice",
    hangupCause: "No Answer",
    recordingAvailable: false,
  },
  {
    id: "c3",
    tenantId: "t1",
    direction: "out",
    from: "ext 1001",
    to: "+1 604 555 9911",
    did: "+1 604 555 0142",
    extension: "1001",
    extensionName: "Front Counter",
    startedAt: "2026-05-11 10:05:33",
    endedAt: "2026-05-11 10:07:18",
    durationSec: 105,
    ringSec: 12,
    disposition: "Answered",
    codec: "G.711u",
    sipCallId: "sip-2c8b5f0a@onerx-voice",
    hangupCause: "Normal Clearing",
    recordingAvailable: true,
    notes: "Callback to patient re: delivery",
  },
  {
    id: "c4",
    tenantId: "t2",
    direction: "in",
    from: "+1 416 555 0700",
    to: "ext 2001",
    did: "+1 416 555 0188",
    extension: "2001",
    extensionName: "Reception",
    startedAt: "2026-05-11 07:55:20",
    endedAt: "2026-05-11 07:55:50",
    durationSec: 0,
    ringSec: 4,
    disposition: "Busy",
    codec: "—",
    sipCallId: "sip-4d6e9a2b@onerx-voice",
    hangupCause: "User Busy",
    recordingAvailable: false,
  },
  {
    id: "c5",
    tenantId: "t2",
    direction: "in",
    from: "+1 905 555 0444",
    to: "ext 2002",
    did: "+1 416 555 0188",
    extension: "2002",
    extensionName: "Pharmacy",
    startedAt: "2026-05-11 09:30:05",
    endedAt: "2026-05-11 09:31:42",
    durationSec: 0,
    ringSec: 22,
    disposition: "Voicemail",
    codec: "G.711u",
    sipCallId: "sip-1f7c3d8e@onerx-voice",
    hangupCause: "Voicemail",
    recordingAvailable: true,
    notes: "Voicemail emailed to rx@medicarerx.ca",
  },
  {
    id: "c6",
    tenantId: "t2",
    direction: "out",
    from: "ext 2002",
    to: "+1 416 555 0290",
    did: "+1 416 555 0188",
    extension: "2002",
    extensionName: "Pharmacy",
    startedAt: "2026-05-11 11:02:18",
    endedAt: "2026-05-11 11:04:55",
    durationSec: 157,
    ringSec: 6,
    disposition: "Answered",
    codec: "G.711u",
    sipCallId: "sip-8b2a6c4d@onerx-voice",
    hangupCause: "Normal Clearing",
    recordingAvailable: true,
  },
  {
    id: "c7",
    tenantId: "t3",
    direction: "in",
    from: "+1 250 555 0111",
    to: "ext 3001",
    did: "+1 604 555 0211",
    extension: "3001",
    extensionName: "Main Line",
    startedAt: "2026-05-11 06:22:44",
    endedAt: "2026-05-11 06:22:49",
    durationSec: 0,
    ringSec: 0,
    disposition: "Failed",
    codec: "—",
    sipCallId: "sip-5e9f1a7c@onerx-voice",
    hangupCause: "Network Error",
    recordingAvailable: false,
    notes: "Upstream carrier timeout",
  },
  {
    id: "c8",
    tenantId: "t3",
    direction: "in",
    from: "+1 604 555 8800",
    to: "ext 3001",
    did: "+1 604 555 0211",
    extension: "3001",
    extensionName: "Main Line",
    startedAt: "2026-05-10 16:18:33",
    endedAt: "2026-05-10 16:21:10",
    durationSec: 157,
    ringSec: 5,
    disposition: "Answered",
    codec: "G.711u",
    sipCallId: "sip-3a7b2d9f@onerx-voice",
    hangupCause: "Normal Clearing",
    recordingAvailable: false,
  },
  {
    id: "c9",
    tenantId: "t4",
    direction: "in",
    from: "+1 647 555 0411",
    to: "ext 4001",
    did: "+1 647 555 0301",
    extension: "4001",
    extensionName: "Front Counter",
    startedAt: "2026-05-11 10:11:02",
    endedAt: "2026-05-11 10:13:28",
    durationSec: 146,
    ringSec: 3,
    disposition: "Answered",
    codec: "G.711u",
    sipCallId: "sip-6c4e8b1a@onerx-voice",
    hangupCause: "Normal Clearing",
    recordingAvailable: true,
  },
  {
    id: "c10",
    tenantId: "t4",
    direction: "out",
    from: "ext 4002",
    to: "+1 416 555 0808",
    did: "+1 647 555 0301",
    extension: "4002",
    extensionName: "Dispensary",
    startedAt: "2026-05-10 18:44:12",
    endedAt: "2026-05-10 18:44:42",
    durationSec: 0,
    ringSec: 30,
    disposition: "Missed",
    codec: "—",
    sipCallId: "sip-9d2f5a8c@onerx-voice",
    hangupCause: "No Answer",
    recordingAvailable: false,
  },
  {
    id: "c11",
    tenantId: "t5",
    direction: "in",
    from: "+1 416 555 0290",
    to: "ext 5001",
    did: "+1 416 555 0455",
    extension: "5001",
    extensionName: "Compounding Lab",
    startedAt: "2026-05-11 10:40:18",
    endedAt: "2026-05-11 10:42:05",
    durationSec: 107,
    ringSec: 7,
    disposition: "Answered",
    codec: "G.711u",
    sipCallId: "sip-2b8c4e6f@onerx-voice",
    hangupCause: "Normal Clearing",
    recordingAvailable: true,
    notes: "Compounding order status",
  },
  {
    id: "c12",
    tenantId: "t5",
    direction: "in",
    from: "+1 905 555 0212",
    to: "ext 5002",
    did: "+1 416 555 0455",
    extension: "5002",
    extensionName: "Consultation",
    startedAt: "2026-05-11 08:55:44",
    endedAt: "2026-05-11 08:56:14",
    durationSec: 0,
    ringSec: 18,
    disposition: "Voicemail",
    codec: "G.711u",
    sipCallId: "sip-7a3d9b5e@onerx-voice",
    hangupCause: "Voicemail",
    recordingAvailable: true,
    notes: "Voicemail emailed to consult@northgaterx.ca",
  },
  {
    id: "c13",
    tenantId: "t1",
    direction: "in",
    from: "+1 604 555 8800",
    to: "ext 1003",
    did: "+1 604 555 0142",
    extension: "1003",
    extensionName: "Consult Room",
    startedAt: "2026-05-10 14:22:08",
    endedAt: "2026-05-10 14:25:33",
    durationSec: 205,
    ringSec: 4,
    disposition: "Answered",
    codec: "G.711u",
    sipCallId: "sip-1e6f8c2b@onerx-voice",
    hangupCause: "Normal Clearing",
    recordingAvailable: true,
  },
  {
    id: "c14",
    tenantId: "t4",
    direction: "in",
    from: "+1 888 555 0144",
    to: "ext 4001",
    did: "+1 647 555 0301",
    extension: "4001",
    extensionName: "Front Counter",
    startedAt: "2026-05-11 07:10:00",
    endedAt: "2026-05-11 07:10:01",
    durationSec: 0,
    ringSec: 0,
    disposition: "Failed",
    codec: "—",
    sipCallId: "sip-blocked@onerx-voice",
    hangupCause: "Blocked (Blacklist)",
    recordingAvailable: false,
    notes: "Number on platform blacklist",
  },
  {
    id: "c15",
    tenantId: "t2",
    direction: "out",
    from: "ext 2001",
    to: "+1 416 555 9999",
    did: "+1 416 555 0188",
    extension: "2001",
    extensionName: "Reception",
    startedAt: "2026-05-10 15:33:22",
    endedAt: "2026-05-10 15:33:52",
    durationSec: 0,
    ringSec: 2,
    disposition: "Failed",
    codec: "—",
    sipCallId: "sip-4f9a2c7d@onerx-voice",
    hangupCause: "Blocked (Tenant Blacklist)",
    recordingAvailable: false,
    notes: "Destination on tenant blacklist",
  },
];
