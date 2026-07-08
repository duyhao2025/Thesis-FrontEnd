"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import {
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  AlertCircle,
  ListChecks,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface RubricCriteriaReq {
  id?: string;
  criteriaName: string;
  weight: number;
  maxScore: number;
}

interface RubricResponse {
  id: string;
  name: string;
  totalWeight: number;
  createdAt: string;
  updatedAt?: string;
  isDeleted: boolean;
  isUsed: boolean;
  criteria: RubricCriteriaResponse[];
}

interface RubricCriteriaResponse {
  id: string;
  rubricId: string;
  criteriaName: string;
  weight: number;
  maxScore: number;
}

const DEFAULT_CRITERIA: RubricCriteriaReq[] = [
  { criteriaName: "Nội dung",            weight: 0.30, maxScore: 10 },
  { criteriaName: "Trình bày",          weight: 0.20, maxScore: 10 },
  { criteriaName: "Kỹ năng trả lời",   weight: 0.25, maxScore: 10 },
  { criteriaName: "Tính thực tiễn",     weight: 0.15, maxScore: 10 },
  { criteriaName: "Tài liệu",           weight: 0.10, maxScore: 10 },
];

export default function StaffRubricsPage() {
  const { showToast } = useToast();
  const [rubrics, setRubrics] = useState<RubricResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [seedingDefault, setSeedingDefault] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    totalWeight: 1, // percentages total to 1.00
    criteria: [{ criteriaName: "", weight: 0, maxScore: 10 } as RubricCriteriaReq],
  });

  const fetchRubrics = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<RubricResponse[]>("/rubrics");
      setRubrics(res.data);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || "Không thể tải danh sách rubric");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRubrics();
  }, [fetchRubrics]);

  const resetForm = () => {
    setFormData({
      name: "",
      totalWeight: 1,
      criteria: [{ criteriaName: "", weight: 0, maxScore: 10 }],
    });
    setEditingId(null);
    setShowForm(false);
  };

  const addCriteria = () => {
    setFormData((prev) => ({
      ...prev,
      criteria: [...prev.criteria, { criteriaName: "", weight: 0, maxScore: 10 }],
    }));
  };

  const removeCriteria = (index: number) => {
    if (formData.criteria.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      criteria: prev.criteria.filter((_, i) => i !== index),
    }));
  };

  const updateCriteria = (
    index: number,
    field: keyof RubricCriteriaReq,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      criteria: prev.criteria.map((c, i) =>
        i === index
          ? { ...c, [field]: field === "criteriaName" ? value : Number(value) }
          : c
      ),
    }));
  };

  const totalWeight = formData.criteria.reduce((sum, c) => sum + (c.weight || 0), 0);
  const weightValid = Math.abs(totalWeight - formData.totalWeight) < 0.001;

  const seedDefaultRubric = async () => {
    setSeedingDefault(true);
    try {
      const payload = {
        name: "Thang điểm mặc định",
        totalWeight: 1,
        criteria: DEFAULT_CRITERIA,
      };
      await api.post("/rubrics", payload);
      showToast("success", "Đã tạo thang điểm mặc định (5 tiêu chí).");
      resetForm();
      await fetchRubrics();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      showToast(
        "error",
        axiosError.response?.data?.message || "Không thể tạo thang điểm mặc định."
      );
    } finally {
      setSeedingDefault(false);
    }
  };

  const applyDefaultPreset = () => {
    setFormData({
      name: "Thang điểm mặc định",
      totalWeight: 1,
      criteria: DEFAULT_CRITERIA.map((c) => ({ ...c })),
    });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError("Vui lòng nhập tên rubric");
      return;
    }

    if (formData.criteria.some((c) => !c.criteriaName.trim())) {
      setError("Vui lòng nhập tên cho tất cả tiêu chí");
      return;
    }

    if (!weightValid) {
      setError(
        `Tổng trọng số (${totalWeight}) phải bằng TotalWeight (${formData.totalWeight})`
      );
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (editingId) {
        await api.put(`/rubrics/${editingId}`, formData);
      } else {
        await api.post("/rubrics", formData);
      }

      showToast("success", editingId ? "Đã cập nhật rubric." : "Đã tạo rubric mới.");
      await fetchRubrics();
      resetForm();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (rubric: RubricResponse) => {
    if (rubric.isUsed) {
      showToast("warning", "Không thể sửa rubric đã được sử dụng");
      return;
    }
    setFormData({
      name: rubric.name,
      totalWeight: rubric.totalWeight,
      criteria: rubric.criteria.map((c) => ({
        id: c.id,
        criteriaName: c.criteriaName,
        weight: c.weight,
        maxScore: c.maxScore,
      })),
    });
    setEditingId(rubric.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Xóa rubric này?")) return;

    try {
      await api.delete(`/rubrics/${id}`);
      showToast("success", "Đã xóa rubric.");
      await fetchRubrics();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || "Xóa thất bại");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Tiêu chí chấm</h1>
          <p className="text-sm text-gray-500">
            Quản lý bộ tiêu chí chấm điểm đồ án (dành cho nhân viên khoa)
          </p>
        </div>
        <div className="flex gap-2">
          {rubrics.length === 0 && (
            <button
              onClick={seedDefaultRubric}
              disabled={seedingDefault}
              className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              {seedingDefault ? "Đang tạo..." : "Tạo thang điểm mặc định"}
            </button>
          )}
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-white hover:bg-amber-700"
          >
            <Plus className="h-4 w-4" />
            Tạo rubric mới
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {rubrics.length === 0 && !loading && (
        <div className="rounded-lg border-2 border-dashed border-amber-300 bg-amber-50 p-6">
          <div className="flex items-start gap-3">
            <ListChecks className="h-6 w-6 text-amber-700 mt-1" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900">
                Bạn chưa có thang điểm nào
              </p>
              <p className="text-xs text-amber-800 mt-1">
                Bấm <strong>"Tạo thang điểm mặc định"</strong> ở góc trên bên phải để khởi
                tạo nhanh 5 tiêu chí (Nội dung, Trình bày, Kỹ năng trả lời, Tính thực tiễn,
                Tài liệu). Bạn có thể chỉnh sửa sau.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="m-4 w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-lg max-h-[90vh]">
            <div className="border-b p-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {editingId ? "Sửa Rubric" : "Tạo Rubric mới"}
              </h2>
              {!editingId && (
                <button
                  onClick={applyDefaultPreset}
                  className="text-sm font-medium text-amber-700 hover:text-amber-800 flex items-center gap-1"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Dùng thang điểm mặc định
                </button>
              )}
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Tên rubric</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  placeholder="VD: Thang điểm chấm Khóa luận"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Tổng trọng số (Total Weight)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.totalWeight}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      totalWeight: Number(e.target.value),
                    }))
                  }
                  className="w-32 rounded-lg border border-gray-300 px-3 py-2"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Tổng trọng số các tiêu chí phải bằng giá trị này
                </p>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Tiêu chí chấm điểm</label>
                  <button
                    onClick={addCriteria}
                    className="flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700"
                  >
                    <Plus className="h-4 w-4" /> Thêm tiêu chí
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.criteria.map((criteria, index) => (
                    <div key={index} className="flex items-start gap-3 rounded-lg bg-gray-50 p-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={criteria.criteriaName}
                          onChange={(e) => updateCriteria(index, "criteriaName", e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          placeholder="Tên tiêu chí (VD: Nội dung)"
                        />
                      </div>
                      <div className="w-24">
                        <label className="mb-1 block text-xs text-gray-500">Trọng số</label>
                        <input
                          type="number"
                          step="0.01"
                          value={criteria.weight}
                          onChange={(e) => updateCriteria(index, "weight", e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="w-24">
                        <label className="mb-1 block text-xs text-gray-500">Tối đa</label>
                        <input
                          type="number"
                          value={criteria.maxScore}
                          onChange={(e) => updateCriteria(index, "maxScore", e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <button
                        onClick={() => removeCriteria(index)}
                        disabled={formData.criteria.length <= 1}
                        className="mt-6 rounded p-2 text-red-500 hover:bg-red-50 disabled:opacity-30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    Tổng trọng số:{" "}
                    <span className={weightValid ? "text-green-600" : "text-red-600"}>
                      {totalWeight}
                    </span>
                  </span>
                  {!weightValid && (
                    <span className="text-red-500">Phải bằng {formData.totalWeight}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t p-6">
              <button
                onClick={resetForm}
                className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || !weightValid}
                className="rounded-lg bg-amber-600 px-4 py-2 text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {saving ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rubrics List */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-amber-600" />
        </div>
      ) : rubrics.length === 0 ? null : (
        <div className="grid gap-4">
          {rubrics.map((rubric) => (
            <div key={rubric.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="flex items-center justify-between border-b bg-gray-50 p-4">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-gray-900">{rubric.name}</h3>
                  {rubric.isUsed && (
                    <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                      <CheckCircle className="h-3 w-3" />
                      Đang sử dụng
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(rubric)}
                    disabled={rubric.isUsed}
                    className="rounded p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                    title={rubric.isUsed ? "Không thể sửa rubric đang sử dụng" : "Sửa"}
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(rubric.id)}
                    disabled={rubric.isUsed}
                    className="rounded p-2 text-red-500 hover:bg-red-50 disabled:opacity-30"
                    title={rubric.isUsed ? "Không thể xóa rubric đang sử dụng" : "Xóa"}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="p-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="pb-2 font-medium">Tiêu chí</th>
                      <th className="pb-2 w-24 text-right font-medium">Trọng số</th>
                      <th className="pb-2 w-24 text-right font-medium">Tối đa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rubric.criteria.map((criteria) => (
                      <tr key={criteria.id} className="border-b last:border-0">
                        <td className="py-2">{criteria.criteriaName}</td>
                        <td className="py-2 text-right">
                          {(criteria.weight * 100).toFixed(0)}%
                        </td>
                        <td className="py-2 text-right">{criteria.maxScore}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}