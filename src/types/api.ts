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
  expiresAt: string;
  requirePasswordChange: boolean;
  role: string;
  email: string;
  fullName: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// ============================================================
// My Profile — user self-service
// ============================================================
export interface MyProfileResponse {
  userId: string;
  fullName: string;
  email: string;
  userCode?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  // Personal email channel (Students only)
  personalEmail?: string;
  isEmailVerified: boolean;
  departmentId?: string;
  departmentName?: string;
  departmentCode?: string;
  majorId?: string;
  majorName?: string;
  majorCode?: string;
  statusLabel: string;
}

// ============================================================
// Personal email verification
// ============================================================
export interface SendVerificationRequest {
  email: string;
}

export interface SendVerificationResponse {
  message: string;
  retryAfterSeconds: number;
}

export interface ConfirmVerificationResponse {
  success: boolean;
  message: string;
  personalEmail?: string;
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

// ============================================================
// Notification
// ============================================================
export interface NotificationResponse {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  referenceId?: string;
  createdAt: string;
  readAt?: string;
}

// ============================================================
// Group Invitation
// ============================================================
export interface GroupInvitationResponse {
  id: string;
  groupId: string;
  groupName: string;
  inviterId: string;
  inviterFullName: string;
  inviterEmail: string;
  inviteeId: string;
  inviteeFullName: string;
  inviteeEmail: string;
  title: string;
  message: string;
  status: InvitationStatus;
  rejectionReason?: string;
  createdAt: string;
  respondedAt?: string;
}

export type InvitationStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED" | "EXPIRED";

export interface SendInvitationRequest {
  studentId: string;
  title: string;
  message: string;
}

export interface RespondToInvitationRequest {
  accepted: boolean;
  rejectionReason?: string;
}
