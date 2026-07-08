// Topic Registration
export interface CreateTopicRegistrationRequest {
  topicId: string;
  groupId?: string;
}

export interface TopicRegistrationResponse {
  id: string;
  registrationPeriodId: string;
  topicId: string;
  topicTitle: string;
  groupId?: string;
  registrationType: string;
  status: string;
  submittedAt: string;
}

export interface AvailableTopicResponse {
  id: string;
  title: string;
  description: string;
  objective: string;
  scope: string;
  expectedOutput: string;
  lecturerName: string;
  departmentName: string;
  majorName: string;
  topicCategoryName: string;
  maxStudents: number;
  currentStudents: number;
  availableSlots: number;
  createdAt: string;
}

export interface AvailableTopicsResponse {
  topics: AvailableTopicResponse[];
  totalCount: number;
  isRegistrationPeriodOpen: boolean;
  registrationPeriodName?: string;
  registrationPeriodEndDate?: string;
}

// Topic Proposal
export type TopicProposalStatus = "PENDING" | "LECTURER_APPROVED" | "APPROVED" | "REJECTED";

export interface CreateTopicProposalRequest {
  title: string;
  description: string;
  objective: string;
  scope: string;
  suggestedLecturerId?: string;
  topicCategoryId?: string;
}

export interface TopicProposalResponse {
  id: string;
  studentId: string;
  studentName: string;
  suggestedLecturerId?: string;
  suggestedLecturerName?: string;
  lecturerId?: string;
  lecturerName?: string;
  topicCategoryId?: string;
  topicCategoryName?: string;
  title: string;
  description: string;
  objective: string;
  scope: string;
  maxStudents: number;
  status: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt?: string;
  reason?: string; // For lecturer rejection reason
  reviewedByName?: string; // For lecturer rejection reason
  reviewedAt?: string; // For lecturer rejection reason
  rejectReason?: string; // For HoD rejection reason
}

// Progress Log
export type ProgressLogStatus = "Draft" | "Submitted" | "Reviewed" | "Rejected";

export interface CreateProgressLogRequest {
  topicId: string;
  studentId: string;
  content: string;
  completionPercentage: number;
  Status?: ProgressLogStatus;
}

export interface UpdateProgressLogRequest {
  content: string;
  completionPercentage: number;
}

export interface ProgressLogResponse {
  id: string;
  topicId: string;
  studentId: string;
  content: string;
  completionPercentage: number;
  submittedAt: string;
  /** Latest lecturer feedback comment (if any). */
  lecturerFeedback?: string;
  /** When the latest feedback was created (if any). */
  lecturerFeedbackAt?: string;
  /** Display name of the lecturer who gave feedback. */
  lecturerFullName?: string;
  /** All feedback entries (chronological). */
  feedbacks?: ProgressLogFeedbackEntry[];
}

export interface ProgressLogFeedbackEntry {
  id: string;
  comment: string;
  lecturerFullName: string;
  createdAt: string;
}

// Lecturer Feedback
export interface CreateFeedbackRequest {
  Comment: string;
}

export interface FeedbackResponse {
  id: string;
  progressLogId: string;
  lecturerId: string;
  lecturerFullName: string;
  Comment: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

// Periodic Report
export type ReportType = "Weekly" | "Monthly" | "Quarterly" | "Semester";

export interface CreatePeriodicReportRequest {
  topicId: string;
  reportType: ReportType;
  fileUrl: string;
}

export interface UpdatePeriodicReportRequest {
  reportType: ReportType;
  fileUrl: string;
}

export interface PeriodicReportResponse {
  id: string;
  topicId: string;
  reportType: ReportType;
  fileUrl: string;
  submittedAt: string;
  lecturerFeedback?: string;
  score?: number;
}

// Topic
export interface TopicResponse {
  id: string;
  title: string;
  description: string;
  objective: string;
  scope: string;
  lecturerId: string;
  lecturerName: string;
  supervisingLecturerId?: string;
  supervisingLecturerName?: string;
  departmentId: string;
  departmentName: string;
  majorId: string;
  majorName: string;
  topicCategoryId: string;
  topicCategoryName: string;
  maxStudents: number;
  currentStudents: number;
  status: string;
  createdAt: string;
}

// Topic Category
export interface TopicCategoryResponse {
  id: string;
  name: string;
  description: string;
  departmentId?: string;
  departmentName?: string;
  majorId?: string;
  majorName?: string;
  createdByStaffName?: string;
}

// Registration Period
export type RegistrationPeriodStatus = "DRAFT" | "OPEN" | "CLOSED" | "ARCHIVED";

export interface RegistrationPeriodResponse {
  id: string;
  term: number;
  name: string;
  startDate: string;
  endDate: string;
  status: RegistrationPeriodStatus;
  minGPA: number;
  maxStudentsPerTopic: number;
  maxTopicPerLecturer: number;
  maxStudentPerGroup: number;
  departmentId?: string;
  departmentName?: string;
  majorId?: string;
  majorName?: string;
}

// Milestone Submission - Student view
export interface StudentMilestoneSubmissionResponse {
  id: string;
  milestoneId: string;
  milestoneTitle: string;
  milestoneDeadline: string;
  topicId: string;
  topicTitle: string;
  studentId: string;
  studentFullName: string;
  title: string;
  fileUrl: string;
  feedback?: string;
  submittedAt: string;
  status: string;
  version: number;
  revisionDeadline?: string;
  canResubmit: boolean;
  versions: SubmissionVersionResponse[];
}

export interface StudentMilestoneWithSubmissionResponse {
  id: string;
  title: string;
  deadline: string;
  requiredSubmission: boolean;
  isCompleted: boolean;
  topicId: string;
  topicTitle: string;
  submissionId?: string;
  submissionTitle?: string;
  submissionFileUrl?: string;
  submittedAt?: string;
  submissionStatus?: string;
  feedback?: string;
  canResubmit?: boolean;
}

export interface SubmissionVersionResponse {
  id: string;
  version: number;
  title: string;
  fileUrl: string;
  feedback?: string;
  submittedAt: string;
  status: string;
}

// Milestone - Lecturer view
export interface MilestoneDetail {
  id: string;
  title: string;
  deadline: string;
  requiredSubmission: boolean;
  isCompleted: boolean;
  submissionId?: string;
  submissionTitle?: string;
  submissionFileUrl?: string;
  submittedAt?: string;
  submissionStatus?: string;
  feedback?: string;
}

export interface MilestoneResponse {
  id: string;
  title: string;
  deadline: string;
  requiredSubmission: boolean;
  isCompleted: boolean;
}

export interface ProgressPlanResponse {
  id: string;
  topicId: string;
  topicTitle: string;
  startDate: string;
  endDate: string;
  status: string;
  milestones: MilestoneResponse[];
}

export interface ProgressPlanDetailResponse {
  id: string;
  topicId: string;
  topicTitle: string;
  startDate: string;
  endDate: string;
  status: string;
  milestones: MilestoneDetail[];
}

// Lecturer student list
export interface StudentGroupResponse {
  id: string;
  groupName: string;
  members: {
    id: string;
    name: string;
    email: string;
  }[];
  topicId?: string;
  topicTitle?: string;
}

// ===== HOD - Supervisor Assignment / Gale-Shapley =====
export interface LecturerWorkloadItem {
  topicId: string;
  topicTitle: string;
  assignedAt: string;
}

export interface LecturerWorkload {
  lecturerId: string;
  lecturerFullName: string;
  lecturerEmail: string;
  assignedCount: number;
  topics: LecturerWorkloadItem[];
}

export interface MatchingItem {
  topicId: string;
  topicTitle: string;
  lecturerId: string;
  lecturerFullName: string;
  workloadAfter: number;
  priorityOrder: number;
}

export interface UnmatchedTopic {
  topicId: string;
  topicTitle: string;
  reason: string;
}

export interface GaleShapleyPreview {
  matchings: MatchingItem[];
  unmatched: UnmatchedTopic[];
  lecturerWorkloadAfter: Record<string, number>;
}

// ===== HOD - Council =====
export interface CouncilMemberItem {
  id: string;
  lecturerId: string;
  lecturerFullName: string;
  lecturerEmail: string;
  departmentName?: string | null;
  majorName?: string | null;
  role: string;
  createdAt: string;
}

export interface CouncilItem {
  id: string;
  name: string;
  defenseDate: string;
  location: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  members: CouncilMemberItem[];
}

export interface CouncilTopicItem {
  assignmentId: string;
  topicId: string;
  topicTitle: string;
  studentGroupName: string;
  status: string;
  assignedAt: string;
  evaluatorNames: string[];
}

export interface LecturerOption {
  id: string;
  fullName: string;
  email: string;
  roleLabel: string;
  departmentName: string;
  majorName: string;
  /** Other roles the lecturer already holds in active councils (for HoD conflict hint). */
  currentCouncilRoles: string[];
}

export interface LecturerTopicOption {
  id: string;
  title: string;
  status: string;
  isPrimary: boolean;
}

// ===== Student group self-management =====
export interface GroupMemberResponse {
  id: string;
  studentId: string;
  fullName: string;
  email: string;
  isLeader: boolean;
}

export interface MyGroupResponse {
  id: string;
  topicId?: string | null;
  topicTitle?: string | null;
  leaderId: string;
  leaderFullName: string;
  status: string;
  createdAt: string;
  members: GroupMemberResponse[];
}

export interface StudentLookupItem {
  id: string;
  fullName: string;
  email: string;
}