// ============================================================
// Evaluation / Grading
// ============================================================
export interface EvaluationTopicResponse {
  assignmentId: string;
  topicId: string;
  topicTitle: string;
  studentGroupName: string;
  councilName: string;
  defenseDate: string;
  status: string;
  myEvaluationId?: string;
  myEvaluationStatus: string;
  rubricId?: string;
  rubricName?: string;
}

export interface RubricCriteriaDetail {
  id: string;
  criteriaName: string;
  weight: number;
  maxScore: number;
}

export interface RubricWithCriteria {
  rubricId: string;
  rubricName: string;
  totalWeight: number;
  criteria: RubricCriteriaDetail[];
}

export interface AssignmentRubricResponse {
  assignmentId: string;
  topicId: string;
  topicTitle: string;
  studentGroupName: string;
  studentNames: string[];
  councilName: string;
  defenseDate: string;
  rubric?: RubricWithCriteria;
}

export interface EvaluationScoreResponse {
  id: string;
  criteriaId: string;
  criteriaName: string;
  weight: number;
  maxScore: number;
  score: number;
  comment?: string;
}

export interface EvaluationResponse {
  id: string;
  assignmentId: string;
  topicTitle: string;
  lecturerId: string;
  lecturerFullName: string;
  totalScore: number;
  comment?: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  scores: EvaluationScoreResponse[];
}

export interface GradeScoreItem {
  criteriaId: string;
  score: number;
  comment?: string;
}

export interface SaveGradesRequest {
  scores: GradeScoreItem[];
  comment?: string;
}
