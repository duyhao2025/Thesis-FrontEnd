"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { CheckCircle, AlertCircle, ListChecks } from "lucide-react";
import ReadOnlyBadge from "@/components/head/ReadOnlyBadge";

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

export default function HeadRubricsPage() {
  const [rubrics, setRubrics] = useState<RubricResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRubrics();
  }, []);

  const fetchRubrics = async () => {
    try {
      setLoading(true);
      const res = await api.get<RubricResponse[]>("/head/rubrics");
      setRubrics(res.data);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || "Không thể tải danh sách tiêu chí");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Quản lý tiêu chí chấm</h1>
          <p className="text-sm text-gray-500">
            Theo dõi các bộ tiêu chí chấm đang được sử dụng trong khoa
          </p>
        </div>
        <ReadOnlyBadge />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : rubrics.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8">
          <div className="flex items-start gap-3">
            <ListChecks className="h-6 w-6 text-gray-500 mt-1" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">
                Chưa có tiêu chí nào đang được sử dụng trong khoa
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Khi nhân viên khoa tạo và sử dụng tiêu chí chấm cho các hội đồng
                trong khoa, chúng sẽ xuất hiện tại đây.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {rubrics.map((rubric) => (
            <div
              key={rubric.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              <div className="p-4 flex items-center justify-between border-b bg-gray-50">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-gray-900">{rubric.name}</h3>
                  {rubric.isUsed && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Đang sử dụng
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  Tạo ngày {new Date(rubric.createdAt).toLocaleDateString("vi-VN")}
                </span>
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
