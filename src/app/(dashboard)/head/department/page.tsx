"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { Building2, ArrowRight, Users, GraduationCap, BookMarked } from "lucide-react";
import ReadOnlyBadge from "@/components/head/ReadOnlyBadge";

interface MajorReadOnly {
  id: string;
  name: string;
  code: string;
  description?: string;
  departmentId: string;
  departmentName: string;
  lecturerCount: number;
  studentCount: number;
  topicCount: number;
  createdAt: string;
}

interface DepartmentReadOnly {
  id: string;
  name: string;
  code: string;
  description?: string;
  createdAt: string;
  majors: MajorReadOnly[];
}

export default function HeadDepartmentPage() {
  const [dept, setDept] = useState<DepartmentReadOnly | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<DepartmentReadOnly>("/head/departments/me")
      .then((r) => setDept(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!dept) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Không thể tải thông tin khoa.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{dept.name}</h1>
          <p className="mt-1 text-sm text-gray-500">
            Mã khoa: <span className="font-mono">{dept.code}</span>
          </p>
          {dept.description && (
            <p className="mt-1 text-sm text-gray-600">{dept.description}</p>
          )}
        </div>
        <ReadOnlyBadge />
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
          <Building2 className="h-4 w-4" />
          Danh sách chuyên ngành ({dept.majors.length})
        </h2>

        {dept.majors.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-500">
            Khoa chưa có chuyên ngành nào.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-2 font-medium">Chuyên ngành</th>
                  <th className="py-2 text-right font-medium">Giảng viên</th>
                  <th className="py-2 text-right font-medium">Sinh viên</th>
                  <th className="py-2 text-right font-medium">Đề tài</th>
                  <th className="py-2 text-right font-medium">Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {dept.majors.map((m) => (
                  <tr key={m.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-3">
                      <div className="font-medium text-gray-900">{m.name}</div>
                      <div className="text-xs text-gray-500">{m.code}</div>
                      {m.description && (
                        <div className="mt-1 text-xs text-gray-500">{m.description}</div>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                        <Users className="h-3 w-3" />
                        {m.lecturerCount}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                        <GraduationCap className="h-3 w-3" />
                        {m.studentCount}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                        <BookMarked className="h-3 w-3" />
                        {m.topicCount}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        href={`/head/department/${m.id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                      >
                        Xem
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
