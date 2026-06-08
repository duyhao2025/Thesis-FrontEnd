export type UserRole = "Student" | "Lecturer" | "HeadOfDepartment" | "FacultyStaff" | "Admin";

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  requirePasswordChange?: boolean;
  avatarUrl?: string;
  department?: string;
  major?: string;
  studentCode?: string;
  lecturerCode?: string;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  expiresIn: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  statusCode: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}
