import type { Student, Company, Position } from "@/data/mockStudents";
import { getToken } from "@/lib/auth";
import { clearSession } from "@/lib/auth";

/**
 * Called when the backend rejects our token (expired/invalid). Clears the stale
 * session so the UI reflects logged-out state and bounces the user to /login.
 */
function handleUnauthorized() {
  clearSession();
  if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
    const redirect = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.assign(`/login?expired=1&redirect=${redirect}`);
  }
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

type BackendStudent = Record<string, any>;
type StudentPageResponse = {
  students?: BackendStudent[];
  total?: number;
  page?: number;
  size?: number;
  hasMore?: boolean;
  placedCount?: number;
  unplacedCount?: number;
  internshipCount?: number;
  pendingCount?: number;
};

export type StudentFilters = {
  search?: string;
  status?: string;
  company?: string;
  branch?: string;
  batch?: string;
};

export type StudentPage = {
  students: Student[];
  total: number;
  page: number;
  size: number;
  hasMore: boolean;
  placedCount: number;
  unplacedCount: number;
  internshipCount: number;
  pendingCount: number;
};

export type StudentFilterOptions = {
  companies: string[];
  branches: string[];
  batches: string[];
};

function normalizeStatus(s: string | null | undefined): "placed" | "unplaced" | "internship" | "pending" {
  if (!s) return "unplaced";
  const v = s.toLowerCase().trim();
  // explicit unplaced check before generic "place" check
  if (v === "pending" || v === "p") return "pending";
  if (v === "unplaced" || v === "not placed" || v === "none") return "unplaced";
  if (v === "placed" || v === "place") return "placed";
  if (v.includes("intern")) return "internship";
  if (v.includes("place")) return "placed"; // fallback catch-all
  return "unplaced";
}

function mapBackendPosition(p: BackendStudent): Position {
  return {
    id: p.id ?? undefined,
    title: p.title ?? p.role ?? "",
    type: (p.type as Position["type"]) ?? "full-time",
    startDate: p.startDate ?? undefined,
    endDate: p.endDate ?? undefined,
    stipend: p.stipend ?? undefined,
    ctc: p.ctc ?? undefined,
  };
}

function mapBackendCompany(c: BackendStudent): Company {
  return {
    id: c.id ?? undefined,
    name: c.name ?? "",
    role: c.role ?? "",
    package: c.package ?? c.packageValue ?? "",
    stipend: c.stipend ?? c.internshipStipend ?? undefined,
    fullTimePackage: c.fullTimePackage ?? undefined,
    converted: c.converted ?? undefined,
    conversionType: c.conversionType ?? undefined,
    conversionDate: c.conversionDate ?? undefined,
    joinDate: c.joinDate ?? "",
    endDate: c.endDate ?? undefined,
    type: (c.type as Company["type"]) ?? "full-time",
    duration: c.duration ?? undefined,
    logo: c.logo ?? c.companyLogo ?? undefined,
    positions: Array.isArray(c.positions) ? c.positions.map(mapBackendPosition) : undefined,
  };
}

function mapBackendToStudent(b: BackendStudent): Student {
  const name: string = b.name ?? b.fullName ?? "Unknown";
  const status = normalizeStatus(b.status);
  const companyType = status === "internship" ? "internship" : "full-time";

  // Prefer the rich currentCompany object (carries stipend, CTC, conversion info).
  let currentCompany: Company | undefined;
  if (b.currentCompany && typeof b.currentCompany === "object") {
    currentCompany = mapBackendCompany(b.currentCompany);
  } else {
    const companyName: string | undefined = b.company ?? b.currentCompanyName ?? undefined;
    currentCompany = companyName
      ? {
          name: companyName,
          role: b.role ?? "",
          package: b.packageValue ?? b.package ?? "",
          joinDate: b.joinDate ?? "",
          type: (b.type as Company["type"]) ?? companyType,
          duration: b.duration ?? undefined,
          endDate: b.endDate ?? undefined,
          logo: b.companyLogo ?? undefined,
        }
      : undefined;
  }

  const pastCompanies: Company[] = Array.isArray(b.pastCompanies)
    ? b.pastCompanies.map(mapBackendCompany)
    : [];

  return {
    id: b.id ?? b._id ?? b.regno ?? b.regNo ?? "",
    regno: b.regno ?? b.regNo ?? undefined,
    name,
    email: b.email ?? "",
    phone: b.phone ?? "",
    avatar: b.profilePic ?? b.avatar ?? "",
    branch: b.branch ?? "Unknown",
    batch: (function(){
      if (b.batch) return b.batch;
      const reg = b.regno ?? b.regNo ?? b.regno;
      if (typeof reg === 'string'){
        const m = reg.match(/^(\d{4})/);
        if (m) return m[1];
      }
      return "Unknown";
    })(),
    status,
    currentCompany,
    pastCompanies,
    interviewExperiences: b.interviewExperiences ?? [],
    education: b.education ?? [],
    skills: b.skills ?? [],
    linkedin: b.linkedin ?? undefined,
    github: b.github ?? undefined,
    bio: b.bio ?? "",
  } as Student;
}

function appendIfPresent(params: URLSearchParams, key: string, value?: string) {
  if (value && value !== "all") {
    params.append(key, value);
  }
}

async function extractErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const text = await res.text();
    if (!text) return fallback;
    try {
      const parsed = JSON.parse(text);
      return parsed?.message || parsed?.error || text;
    } catch {
      return text;
    }
  } catch {
    return fallback;
  }
}

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { ...extra };
  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: authHeaders(init.headers as Record<string, string> | undefined ?? {}),
  });
  if (res.status === 401) {
    handleUnauthorized();
    throw new Error("Your session has expired. Please sign in again.");
  }
  if (!res.ok) {
    throw new Error(await extractErrorMessage(res, `Request failed: ${res.status}`));
  }
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return res.json() as Promise<T>;
  }
  return res.text() as unknown as Promise<T>;
}

async function readJsonOrThrow<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: authHeaders(),
  });
  if (res.status === 401) {
    handleUnauthorized();
    throw new Error("Your session has expired. Please sign in again.");
  }
  if (!res.ok) {
    throw new Error(await extractErrorMessage(res, `Failed to fetch students: ${res.status}`));
  }
  return res.json();
}

export async function getStudents(status?: string): Promise<Student[]> {
  const params = new URLSearchParams();
  appendIfPresent(params, "status", status);
  
  const qs = params.toString() ? `?${params.toString()}` : "";
  const data = await readJsonOrThrow<BackendStudent[]>(`${API_BASE}/api/public/students${qs}`);
  
  if (Array.isArray(data)) {
    return data.map(mapBackendToStudent);
  }
  
  return [];
}

export async function getStudentsPage(
  filters: StudentFilters & { page?: number; size?: number } = {},
): Promise<StudentPage> {
  const params = new URLSearchParams();
  params.append("page", String(filters.page ?? 0));
  params.append("size", String(filters.size ?? 12));
  appendIfPresent(params, "search", filters.search);
  appendIfPresent(params, "status", filters.status);
  appendIfPresent(params, "company", filters.company);
  appendIfPresent(params, "branch", filters.branch);
  appendIfPresent(params, "batch", filters.batch);

  const data = await readJsonOrThrow<StudentPageResponse>(
    `${API_BASE}/api/public/students/page?${params.toString()}`,
  );

  return {
    students: Array.isArray(data.students) ? data.students.map(mapBackendToStudent) : [],
    total: data.total ?? 0,
    page: data.page ?? 0,
    size: data.size ?? filters.size ?? 12,
    hasMore: Boolean(data.hasMore),
    placedCount: data.placedCount ?? 0,
    unplacedCount: data.unplacedCount ?? 0,
    internshipCount: data.internshipCount ?? 0,
    pendingCount: data.pendingCount ?? 0,
  };
}

export async function getStudentFilterOptions(): Promise<StudentFilterOptions> {
  const data = await readJsonOrThrow<Partial<StudentFilterOptions>>(`${API_BASE}/api/public/students/filters`);
  return {
    companies: Array.isArray(data.companies) ? data.companies : [],
    branches: Array.isArray(data.branches) ? data.branches : [],
    batches: Array.isArray(data.batches) ? data.batches : [],
  };
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export type LoginResponse = {
  token: string;
  username: string;
  role: string;
};

export async function login(username: string, password: string): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
}

export type InitiateRegistrationResponse = {
  message: string;
  token?: string;
};

export async function initiateRegistration(regno: string): Promise<InitiateRegistrationResponse> {
  return apiFetch<InitiateRegistrationResponse>("/api/auth/initiate-registration", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ regno }),
  });
}

export async function completeRegistration(token: string, password: string): Promise<string> {
  return apiFetch<string>("/api/auth/complete-registration", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password }),
  });
}

// ---------------------------------------------------------------------------
// Admin: placement requests
// ---------------------------------------------------------------------------

export type PlacementRequest = {
  id: string;
  studentId: string;
  companyId: string;
  company: string;
  companyLogo?: string;
  role: string;
  ctc: number;
  stipend?: number;
  placementYear: number;
  startMonth?: string;
  campusMode?: string;
  placementNature?: string;
  engagementType?: string;
  requestType?: string;
  status: string;
};

export async function getPlacementRequests(status = "PENDING"): Promise<PlacementRequest[]> {
  const params = new URLSearchParams();
  if (status) params.append("status", status);
  const qs = params.toString() ? `?${params.toString()}` : "";
  return apiFetch<PlacementRequest[]>(`/api/admin/placement-requests${qs}`);
}

export async function approvePlacementRequest(id: string): Promise<PlacementRequest> {
  return apiFetch<PlacementRequest>(`/api/admin/placement-requests/${id}/approve`, {
    method: "PUT",
  });
}

export async function rejectPlacementRequest(id: string): Promise<PlacementRequest> {
  return apiFetch<PlacementRequest>(`/api/admin/placement-requests/${id}/reject`, {
    method: "PUT",
  });
}

// ---------------------------------------------------------------------------
// Companies
// ---------------------------------------------------------------------------

export type CompanyOption = {
  id: string;
  name: string;
  logoUrl?: string;
};

export async function getCompanies(): Promise<CompanyOption[]> {
  return apiFetch<CompanyOption[]>("/api/companies");
}

// ---------------------------------------------------------------------------
// Student company: edit the role timeline (positions)
// ---------------------------------------------------------------------------

export type PositionInput = {
  id?: string;
  title: string;
  type: "internship" | "full-time";
  startDate?: string;
  endDate?: string;
  stipend?: string;
  ctc?: string;
};

/** Replace the positions of an existing student-company record (owner or admin). */
export async function updateStudentCompanyPositions(
  studentId: string,
  studentCompanyId: string,
  positions: PositionInput[],
): Promise<Company> {
  const raw = await apiFetch<BackendStudent>(
    `/api/students/${studentId}/companies/${studentCompanyId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ positions }),
    },
  );
  return mapBackendCompany(raw);
}

/** Delete a student-company record entirely (owner or admin). */
export async function deleteStudentCompany(
  studentId: string,
  studentCompanyId: string,
): Promise<void> {
  await apiFetch<void>(`/api/students/${studentId}/companies/${studentCompanyId}`, {
    method: "DELETE",
  });
}

/** Replace a student's full skill list (owner or admin). Returns saved skills. */
export async function updateStudentSkills(
  studentId: string,
  skills: string[],
): Promise<string[]> {
  return apiFetch<string[]>(`/api/students/${studentId}/skills`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ skills }),
  });
}

// ---------------------------------------------------------------------------
// Student: submit a placement request
// ---------------------------------------------------------------------------

export type PlacementRequestInput = {
  studentId?: string;
  companyId?: string;
  companyName?: string;
  role: string;
  ctc?: number;
  stipend?: number;
  placementYear: number;
  startMonth?: string;
  campusMode?: string;
  placementNature?: string;
  engagementType?: string;
  requestType?: "PLACEMENT" | "CONVERSION";
  targetCompanyRecordId?: string;
};

export async function submitPlacementRequest(input: PlacementRequestInput): Promise<PlacementRequest> {
  return apiFetch<PlacementRequest>("/api/placement-requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

// ---------------------------------------------------------------------------
// Profile: interview experiences
// ---------------------------------------------------------------------------

export type InterviewRoundInput = {
  name: string;
  description: string;
  tips: string;
};

export type InterviewExperienceInput = {
  company: string;
  rounds: InterviewRoundInput[];
  overallTips: string;
  difficulty: "Easy" | "Medium" | "Hard";
  rating: number;
  placementId?: string;
  studentId?: string;
  placedHere?: boolean;
};

export async function submitInterviewExperience(input: InterviewExperienceInput): Promise<unknown> {
  return apiFetch("/api/experiences", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

// ---------------------------------------------------------------------------
// Profile: education
// ---------------------------------------------------------------------------

export type EducationInput = {
  degree: string;
  institution: string;
  year: string;
  grade: string;
};

export type EducationRecord = EducationInput & { id: string };

export async  function submitEducation(
  studentId: string,
  input: EducationInput
): Promise<EducationRecord> {
  return apiFetch<EducationRecord>(`/api/students/${studentId}/education`, {
    method: "POST",
    headers: { "Content-Type": "application/json"},
    body: JSON.stringify(input)
  });
}

export async function deleteEducation(
  studentId: string,
  educationId: string
): Promise<void> {
  await apiFetch<void>(`/api/students/${studentId}/education/${educationId}`, {
    method: "DELETE"
  });
}

export default {
  getStudents,
  getStudentsPage,
  getStudentFilterOptions,
  login,
  initiateRegistration,
  completeRegistration,
  getPlacementRequests,
  approvePlacementRequest,
  rejectPlacementRequest,
  getCompanies,
  updateStudentCompanyPositions,
  deleteStudentCompany,
  updateStudentSkills,
  submitInterviewExperience,
  submitEducation,
  deleteEducation,
  submitPlacementRequest,
};
