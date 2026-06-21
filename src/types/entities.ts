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
  title: string;
  description: string;
  objective: string;
  scope: string;
  status: TopicProposalStatus;
  reason?: string;
  rejectReason?: string;
  rejectionReason?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
  topicCategoryId?: string;
  topicCategoryName?: string;
  departmentId?: string;
  departmentName?: string;
  majorId?: string;
  majorName?: string;
  maxStudents?: number;
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
  Status?: ProgressLogStatus;
  lecturerFeedback?: string;
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
}

// Registration Period
export type RegistrationPeriodStatus = "DRAFT" | "OPEN" | "CLOSED" | "ARCHIVED";

export interface RegistrationPeriodResponse {
  id: string;
  semesterId: string;
  semesterName: string;
  name: string;
  startDate: string;
  endDate: string;
  status: RegistrationPeriodStatus;
  maxTopicPerLecturer: number;
  maxStudentPerGroup: number;
}

// Milestone
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
