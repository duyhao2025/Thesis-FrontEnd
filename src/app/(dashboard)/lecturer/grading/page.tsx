"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { EvaluationTopicResponse, AssignmentRubricResponse, EvaluationResponse } from "@/types/evaluation";
import { Calendar, Users, BookOpen, ClipboardCheck, Eye, Edit, CheckCircle } from "lucide-react";

export default function GradingPage() {
  const [assignments, setAssignments] = useState<EvaluationTopicResponse[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<EvaluationTopicResponse | null>(null);
  const [rubricData, setRubricData] = useState<AssignmentRubricResponse | null>(null);
  const [existingEvaluation, setExistingEvaluation] = useState<EvaluationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  // Form state
  const [scores, setScores] = useState<Record<string, { score: number; comment: string }>>({});
  const [comment, setComment] = useState("");

  useEffect(() => {
    fetchAssignments();
  }, []);

  useEffect(() => {
    if (selectedAssignment) {
      fetchRubricData();
      if (selectedAssignment.myEvaluationId) {
        fetchExistingEvaluation(selectedAssignment.myEvaluationId);
      } else {
        setExistingEvaluation(null);
      }
    }
  }, [selectedAssignment]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await api.get<EvaluationTopicResponse[]>("/evaluations/my-assignments");
      setAssignments(res.data);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || "Không thể tải danh sách đề tài");
    } finally {
      setLoading(false);
    }
  };

  const fetchRubricData = async () => {
    if (!selectedAssignment) return;
    try {
      const res = await api.get<AssignmentRubricResponse>(
        `/evaluations/assignments/${selectedAssignment.assignmentId}/rubric`
      );
      setRubricData(res.data);

      // Initialize scores
      if (res.data.rubric?.criteria) {
        const initialScores: Record<string, { score: number; comment: string }> = {};
        res.data.rubric.criteria.forEach((c) => {
          initialScores[c.id] = { score: 0, comment: "" };
        });
        setScores(initialScores);
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || "Không thể tải rubric");
    }
  };

  const fetchExistingEvaluation = async (evaluationId: string) => {
    try {
      const res = await api.get<EvaluationResponse>(`/evaluations/${evaluationId}`);
      setExistingEvaluation(res.data);

      // Populate form with existing scores
      const initialScores: Record<string, { score: number; comment: string }> = {};
      res.data.scores.forEach((s) => {
        initialScores[s.criteriaId] = { score: s.score, comment: s.comment || "" };
      });
      setScores(initialScores);
      setComment(res.data.comment || "");
    } catch {
      // Ignore error
    }
  };

  const handleScoreChange = (criteriaId: string, field: "score" | "comment", value: string | number) => {
    setScores((prev) => ({
      ...prev,
      [criteriaId]: {
        ...prev[criteriaId],
        [field]: field === "score" ? Number(value) : value,
      },
    }));
  };

  // TotalScore is on a 0–10 scale. Weight is stored as a 0–1 fraction of
  // the rubric, so we multiply by 10 to scale the weighted sum to 0–10.
  const calculateTotalScore = () => {
    if (!rubricData?.rubric?.criteria) return 0;

    let total = 0;
    rubricData.rubric.criteria.forEach((c) => {
      const scoreData = scores[c.id];
      if (scoreData) {
        const normalizedScore = scoreData.score / c.maxScore;
        total += normalizedScore * c.weight;
      }
    });
    return Math.round(total * 10 * 100) / 100;
  };

  const handleSaveGrades = async () => {
    if (!selectedAssignment) return;

    // Validate all scores filled
    const hasEmptyScores = rubricData?.rubric?.criteria?.some(
      (c) => !scores[c.id] || scores[c.id].score < 0
    );
    if (hasEmptyScores) {
      setError("Vui lòng nhập điểm cho tất cả tiêu chí");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        scores: Object.entries(scores).map(([criteriaId, data]) => ({
          criteriaId,
          score: data.score,
          comment: data.comment || undefined,
        })),
        comment,
      };

      if (existingEvaluation) {
        // Update existing
        await api.put(`/evaluations/${existingEvaluation.id}`, payload);
      } else {
        // Create new
        await api.post("/evaluations", {
          assignmentId: selectedAssignment.assignmentId,
          ...payload,
        });
      }

      // Refresh data
      await fetchAssignments();
      if (selectedAssignment.myEvaluationId) {
        await fetchExistingEvaluation(selectedAssignment.myEvaluationId);
      } else {
        // Fetch the newly created evaluation
        await fetchAssignments();
        const updated = assignments.find(
          (a) => a.assignmentId === selectedAssignment.assignmentId
        );
        if (updated?.myEvaluationId) {
          await fetchExistingEvaluation(updated.myEvaluationId);
        }
      }
      alert("Lưu thành công!");
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitEvaluation = async () => {
    if (!existingEvaluation) return;

    if (!comment.trim()) {
      setError("Vui lòng nhập nhận xét trước khi nộp");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await api.post(`/evaluations/${existingEvaluation.id}/submit`);
      await fetchExistingEvaluation(existingEvaluation.id);
      await fetchAssignments();
      alert("Nộp thành công!");
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || "Nộp thất bại");
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      NotStarted: "bg-gray-100 text-gray-600",
      InProgress: "bg-yellow-100 text-yellow-700",
      Completed: "bg-green-100 text-green-700",
      Cancelled: "bg-red-100 text-red-600",
    };
    return badges[status] || "bg-gray-100 text-gray-600";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Chấm điểm khóa luận</h1>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Assignment List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Danh sách đề tài được phân công</h2>
            <p className="text-sm text-gray-500 mt-1">
              {assignments.length} đề tài
            </p>
          </div>
          <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
            {assignments.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                Chưa có đề tài nào được phân công chấm điểm
              </div>
            ) : (
              assignments.map((assignment) => (
                <button
                  key={assignment.assignmentId}
                  onClick={() => setSelectedAssignment(assignment)}
                  className={`w-full px-4 py-4 text-left hover:bg-gray-50 transition-colors ${
                    selectedAssignment?.assignmentId === assignment.assignmentId
                      ? "bg-blue-50 border-l-4 border-blue-600"
                      : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {assignment.topicTitle}
                      </h3>
                      <div className="mt-1 space-y-1">
                        <div className="flex items-center gap-1.5 text-sm text-gray-500">
                          <Users className="h-3.5 w-3.5" />
                          <span className="truncate">{assignment.studentGroupName}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-gray-500">
                          <BookOpen className="h-3.5 w-3.5" />
                          <span>{assignment.councilName}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-gray-500">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>
                            {new Date(assignment.defenseDate).toLocaleDateString("vi-VN")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                          assignment.myEvaluationStatus
                        )}`}
                      >
                        {assignment.myEvaluationStatus === "NotStarted"
                          ? "Chưa chấm"
                          : assignment.myEvaluationStatus === "InProgress"
                          ? "Đang chấm"
                          : assignment.myEvaluationStatus === "Completed"
                          ? "Đã nộp"
                          : assignment.myEvaluationStatus}
                      </span>
                      {assignment.rubricName && (
                        <span className="text-xs text-gray-400">{assignment.rubricName}</span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: Grading Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {selectedAssignment ? (
            <>
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h2 className="font-semibold text-gray-900">Chấm điểm: {selectedAssignment.topicTitle}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {rubricData?.rubric?.rubricName}
                </p>
              </div>

              {existingEvaluation?.status === "Completed" ? (
                <div className="p-6">
                  <div className="text-center py-8">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900">Đã nộp điểm</h3>
                    <p className="text-gray-500 mt-2">
                      Bạn đã hoàn thành chấm điểm cho đề tài này
                    </p>
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg inline-block">
                      <p className="text-3xl font-bold text-blue-600">
                        {existingEvaluation.totalScore.toFixed(2)} / 10
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  {/* Topic Info */}
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-medium text-gray-900">Thông tin đề tài</h3>
                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      <p>
                        <span className="font-medium">Nhóm sinh viên:</span>{" "}
                        {rubricData?.studentNames?.join(", ")}
                      </p>
                      <p>
                        <span className="font-medium">Hội đồng:</span> {rubricData?.councilName}
                      </p>
                      <p>
                        <span className="font-medium">Ngày bảo vệ:</span>{" "}
                        {rubricData?.defenseDate &&
                          new Date(rubricData.defenseDate).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                  </div>

                  {/* Rubric Criteria */}
                  {rubricData?.rubric?.criteria && (
                    <div className="space-y-4">
                      <h3 className="font-medium text-gray-900">Tiêu chí chấm điểm</h3>
                      {rubricData.rubric.criteria.map((criteria) => (
                        <div
                          key={criteria.id}
                          className="p-4 border border-gray-200 rounded-lg"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {criteria.criteriaName}
                              </h4>
                              <p className="text-sm text-gray-500">
                                Trọng số: {(criteria.weight * 100).toFixed(0)}% | Tối đa:{" "}
                                {criteria.maxScore} điểm
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Điểm
                              </label>
                              <input
                                type="number"
                                min="0"
                                max={criteria.maxScore}
                                step="0.1"
                                value={scores[criteria.id]?.score || ""}
                                onChange={(e) =>
                                  handleScoreChange(criteria.id, "score", e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="0"
                              />
                              <p className="text-xs text-gray-400 mt-1">
                                0 - {criteria.maxScore}
                              </p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nhận xét
                              </label>
                              <input
                                type="text"
                                value={scores[criteria.id]?.comment || ""}
                                onChange={(e) =>
                                  handleScoreChange(criteria.id, "comment", e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Nhận xét..."
                              />
                            </div>
                          </div>
                          {/* Score preview */}
                          <div className="mt-2 text-sm text-gray-500">
                            Điểm có trọng số:{" "}
                            <span className="font-medium text-blue-600">
                              {scores[criteria.id]
                                ? (
                                    (scores[criteria.id].score / criteria.maxScore) *
                                    criteria.weight *
                                    10
                                  ).toFixed(2)
                                : "0.00"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Total Score Preview */}
                  <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">Tổng điểm:</span>
                      <span className="text-2xl font-bold text-blue-600">
                        {calculateTotalScore().toFixed(2)} / 10
                      </span>
                    </div>
                  </div>

                  {/* Comment */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nhận xét chung <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nhập nhận xét chung về bài bảo vệ..."
                    />
                  </div>

                  {/* Actions — Phase 1: hide the in-page "Nộp điểm" button.
                      Submitting is now done from lecturer/grade-management
                      (built in Phase 3) where lecturers batch-send completed
                      evaluations to the faculty staff. */}
                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={handleSaveGrades}
                      disabled={saving}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Edit className="h-4 w-4" />
                      {saving ? "Đang lưu..." : existingEvaluation ? "Cập nhật" : "Lưu nháp"}
                    </button>
                    {/* Submit button intentionally hidden — see comment above. */}
                    {false && existingEvaluation && (
                      <button
                        onClick={handleSubmitEvaluation}
                        disabled={saving}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <CheckCircle className="h-4 w-4" />
                        {saving ? "Đang nộp..." : "Nộp điểm"}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-96 text-gray-500">
              <ClipboardCheck className="h-12 w-12 mb-4 text-gray-300" />
              <p>Chọn một đề tài để bắt đầu chấm điểm</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
