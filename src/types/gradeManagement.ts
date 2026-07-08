// ============================================================
// Phase 3 & 4: Grade-management workflow
// ============================================================

import type { EvaluationScoreResponse } from "./evaluation";

// ----- Lecturer side -----
export interface LecturerEvaluationItem {
  evaluationId: string;
  assignmentId: string;
  topicId: string;
  topicTitle: string;
  studentGroupName: string;
  councilName: string;
  defenseDate: string;
  status: string;
  totalScore: number;
  comment?: string;
  createdAt: string;
  updatedAt?: string;
  scores: EvaluationScoreResponse[];
}

export interface LecturerGradeManagementResponse {
  drafts: LecturerEvaluationItem[];
  submittedToStaff: LecturerEvaluationItem[];
  draftsCount: number;
  submittedCount: number;
}

export interface SendToStaffRequest {
  evaluationIds: string[];
}

export interface SendToStaffResponse {
  sent: number;
  skipped: number;
  sentIds: string[];
  skippedReasons: string[];
}

// ----- Staff side -----
export interface StaffEvaluationSummary {
  evaluationId: string;
  topicId: string;
  topicTitle: string;
  status: string;
  totalScore: number;
  submittedAt?: string;
  sentToStudentAt?: string;
}

export interface StaffLecturerGroup {
  lecturerId: string;
  lecturerFullName: string;
  lecturerCode?: string;
  departmentName: string;
  majorName: string;
  email?: string;
  submittedEvaluationCount: number;
  sentToStudentCount: number;
  evaluations: StaffEvaluationSummary[];
}

export interface StaffGradeManagementResponse {
  lecturerGroups: StaffLecturerGroup[];
  totalLecturers: number;
  totalEvaluations: number;
}

export interface StaffEvaluationScoreItem {
  criteriaId: string;
  criteriaName: string;
  weight: number;
  maxScore: number;
  score: number;
  weightedScore: number;
  comment?: string;
}

export interface StaffEvaluationDetail {
  evaluationId: string;
  assignmentId: string;
  topicId: string;
  topicTitle: string;
  studentNames: string[];
  councilName: string;
  defenseDate: string;
  status: string;
  totalScore: number;
  comment?: string;
  submittedAt?: string;
  sentToStudentAt?: string;
  scores: StaffEvaluationScoreItem[];
}

export interface StaffLecturerEvaluationsResponse {
  lecturerId: string;
  lecturerFullName: string;
  lecturerCode?: string;
  departmentName: string;
  majorName: string;
  evaluations: StaffEvaluationDetail[];
}

export interface SendToStudentsRequest {
  evaluationIds: string[];
}

export interface SendToStudentsResponse {
  sent: number;
  skipped: number;
  sentIds: string[];
  skippedReasons: string[];
}

// ----- Student side -----
export interface StudentScoreItem {
  criteriaName: string;
  score: number;
  maxScore: number;
  weight: number;
  comment?: string;
}

export interface StudentEvaluationItem {
  lecturerName: string;
  lecturerCode?: string | null;
  departmentName: string;
  majorName: string;
  role: string;
  totalScore: number;
  comment?: string;
  status: string;
  scores: StudentScoreItem[];
}

export interface StudentDefenderInfo {
  studentId: string;
  fullName: string;
  studentCode?: string | null;
  departmentName: string;
  majorName: string;
  isLeader: boolean;
}

export interface StudentFinalResultDetail {
  averageScore: number;
  grade: string;
  resultStatus: string;
}

export interface StudentEvaluationResultResponse {
  assignmentId: string;
  topicTitle: string;
  councilName: string;
  defenseDate?: string;
  assignmentStatus: string;
  evaluations: StudentEvaluationItem[];
  finalResult?: StudentFinalResultDetail | null;
}

export interface StudentFinalResultResponse {
  topicId: string;
  topicTitle: string;
  groupName: string;
  defenseDate?: string;
  location?: string;
  averageScore?: number | null;
  grade?: string | null;
  resultStatus?: string | null;
  isFinalized: boolean;
  students?: StudentDefenderInfo[];
}