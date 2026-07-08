import api from "@/lib/api";

export interface ImportUserDto {
  fullName: string;
  email: string;
  userCode?: string;
  role: string;
  departmentCode?: string;
  majorCode?: string;
}

export interface ImportPreview {
  validUsers: ValidUserRow[];
  invalidRows: InvalidUserRow[];
  duplicateEmails: string[];
  summary: ImportSummary;
}

export interface ValidUserRow {
  rowNumber: number;
  fullName: string;
  email: string;
  userCode?: string;
  role: string;
  departmentCode?: string;
  majorCode?: string;
  isSelected: boolean;
}

export interface InvalidUserRow {
  rowNumber: number;
  fullName: string;
  email: string;
  userCode?: string;
  role: string;
  departmentCode?: string;
  majorCode?: string;
  errorMessage: string;
}

export interface ImportSummary {
  totalRows: number;
  validCount: number;
  invalidCount: number;
  duplicateEmailCount: number;
}

export interface ImportResult {
  successCount: number;
  failedCount: number;
  errors: { email: string; error: string }[];
}

export async function previewImport(file: File): Promise<ImportPreview> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post("/admin/users/import/preview", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

export async function executeImport(users: ImportUserDto[]): Promise<ImportResult> {
  const response = await api.post("/admin/users/import/execute", { users });
  return response.data;
}

export async function exportUsers(params?: {
  role?: string;
  search?: string;
  isActive?: boolean;
}): Promise<Blob> {
  const queryParams = new URLSearchParams();
  if (params?.role) queryParams.append("role", params.role);
  if (params?.search) queryParams.append("search", params.search);
  if (params?.isActive !== undefined) queryParams.append("isActive", String(params.isActive));

  const query = queryParams.toString();
  const url = `/admin/users/export${query ? `?${query}` : ""}`;

  const response = await api.get(url, { responseType: "blob" });
  return response.data;
}

export async function downloadTemplate(): Promise<Blob> {
  const response = await api.get("/admin/users/template", { responseType: "blob" });
  return response.data;
}

export function saveBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
