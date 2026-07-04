"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Plus, Trash2, Edit, CheckCircle, AlertCircle } from "lucide-react";

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

export default function RubricsPage() {
  const [rubrics, setRubrics] = useState<RubricResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    totalWeight: 100,
    criteria: [{ criteriaName: "", weight: 0, maxScore: 10 } as RubricCriteriaReq],
  });

  useEffect(() => {
    fetchRubrics();
  }, []);

  const fetchRubrics = async () => {
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
  };

  const resetForm = () => {
    setFormData({
      name: "",
      totalWeight: 100,
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

  const updateCriteria = (index: number, field: keyof RubricCriteriaReq, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      criteria: prev.criteria.map((c, i) =>
        i === index ? { ...c, [field]: field === "criteriaName" ? value : Number(value) } : c
      ),
    }));
  };

  const totalWeight = formData.criteria.reduce((sum, c) => sum + (c.weight || 0), 0);
  const weightValid = Math.abs(totalWeight - formData.totalWeight) < 0.001;

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
      setError(`Tổng trọng số (${totalWeight}) phải bằng TotalWeight (${formData.totalWeight})`);
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
      setError("Không thể sửa rubric đã được sử dụng");
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
    if (!confirm("Bạn có chắc muốn xóa rubric này?")) return;

    try {
      await api.delete(`/rubrics/${id}`);
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
          <p className="text-sm text-gray-500">Quản lý bộ tiêu chí chấm điểm đồ án</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Tạo rubric mới
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold">
                {editingId ? "Sửa Rubric" : "Tạo Rubric mới"}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên rubric</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="VD: Thang điểm chấm Khóa luận"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tổng trọng số (Total Weight)
                </label>
                <input
                  type="number"
                  value={formData.totalWeight}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, totalWeight: Number(e.target.value) }))
                  }
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tổng trọng số các tiêu chí phải bằng giá trị này
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Tiêu chí chấm điểm</label>
                  <button
                    onClick={addCriteria}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" /> Thêm tiêu chí
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.criteria.map((criteria, index) => (
                    <div key={index} className="flex gap-3 items-start p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={criteria.criteriaName}
                          onChange={(e) => updateCriteria(index, "criteriaName", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          placeholder="Tên tiêu chí (VD: Nội dung)"
                        />
                      </div>
                      <div className="w-24">
                        <label className="text-xs text-gray-500 block mb-1">Trọng số</label>
                        <input
                          type="number"
                          step="0.01"
                          value={criteria.weight}
                          onChange={(e) => updateCriteria(index, "weight", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div className="w-24">
                        <label className="text-xs text-gray-500 block mb-1">Tối đa</label>
                        <input
                          type="number"
                          value={criteria.maxScore}
                          onChange={(e) => updateCriteria(index, "maxScore", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <button
                        onClick={() => removeCriteria(index)}
                        disabled={formData.criteria.length <= 1}
                        className="mt-6 p-2 text-red-500 hover:bg-red-50 rounded disabled:opacity-30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    Tổng trọng số: <span className={weightValid ? "text-green-600" : "text-red-600"}>{totalWeight}</span>
                  </span>
                  {!weightValid && (
                    <span className="text-red-500">Phải bằng {formData.totalWeight}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || !weightValid}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rubrics List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : rubrics.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p>Chưa có rubric nào. Tạo rubric đầu tiên để bắt đầu.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {rubrics.map((rubric) => (
            <div key={rubric.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-4 flex items-center justify-between border-b bg-gray-50">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-gray-900">{rubric.name}</h3>
                  {rubric.isUsed && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                      Đang sử dụng
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(rubric)}
                    disabled={rubric.isUsed}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded disabled:opacity-30"
                    title={rubric.isUsed ? "Không thể sửa rubric đang sử dụng" : "Sửa"}
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(rubric.id)}
                    disabled={rubric.isUsed}
                    className="p-2 text-red-500 hover:bg-red-50 rounded disabled:opacity-30"
                    title={rubric.isUsed ? "Không thể xóa rubric đang sử dụng" : "Xóa"}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="p-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b">
                      <th className="pb-2 font-medium">Tiêu chí</th>
                      <th className="pb-2 font-medium w-24 text-right">Trọng số</th>
                      <th className="pb-2 font-medium w-24 text-right">Tối đa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rubric.criteria.map((criteria) => (
                      <tr key={criteria.id} className="border-b last:border-0">
                        <td className="py-2">{criteria.criteriaName}</td>
                        <td className="py-2 text-right">{(criteria.weight * 100).toFixed(0)}%</td>
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
