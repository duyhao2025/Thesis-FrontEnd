"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { ArrowLeft, Users, GraduationCap, BookMarked, Mail } from "lucide-react";
import ReadOnlyBadge from "@/components/head/ReadOnlyBadge";
import StatCard from "@/components/head/StatCard";

interface MemberDto {
  id: string;
  fullName: string;
  email: string;
  userCode?: string;
  role: string;
  roleLabel: string;
  majorId?: string;
  majorName?: string;
  isActive: boolean;
  createdAt: string;
}

interface TopicDto {
  id: string;
  title: string;
  status: string;
  lecturerName: string;
  maxStudents: number;
  currentStudents: number;
  createdAt: string;
}

interface MajorDetail {
  id: string;
  name: string;
  code: string;
  description?: string;
  departmentId: string;
  departmentName: string;
  lecturerCount: number;
  studentCount: number;
  topicCount: number;
  topics: TopicDto[];
  lecturers: MemberDto[];
}

export default function HeadMajorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [data, setData] = useState<MajorDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api
      .get<MajorDetail>(`/head/departments/me/majors/${id}`)
      .then((r) => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Không thể tải thông tin chuyên ngành.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.push("/head/department")}
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại Khoa & chuyên ngành
      </button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{data.name}</h1>
          <p className="mt-1 text-sm text-gray-500">
            Mã: <span className="font-mono">{data.code}</span>
            {data.departmentName && <> · Thuộc {data.departmentName}</>}
          </p>
          {data.description && (
            <p className="mt-1 text-sm text-gray-600">{data.description}</p>
          )}
        </div>
        <ReadOnlyBadge />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Giảng viên" value={data.lecturerCount} icon={Users} iconClassName="blue" />
        <StatCard label="Sinh viên" value={data.studentCount} icon={GraduationCap} iconClassName="green" />
        <StatCard label="Tổng đề tài" value={data.topicCount} icon={BookMarked} iconClassName="amber" />
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Danh sách giảng viên ({data.lecturers.length})
        </h2>
        {data.lecturers.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-500">Chưa có giảng viên.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-2 font-medium">Họ tên</th>
                  <th className="py-2 font-medium">Email</th>
                  <th className="py-2 font-medium">Mã GV</th>
                </tr>
              </thead>
              <tbody>
                {data.lecturers.map((u) => (
                  <tr key={u.id} className="border-b last:border-0">
                    <td className="py-2 font-medium text-gray-900">{u.fullName}</td>
                    <td className="py-2 text-gray-700">
                      <a
                        href={`mailto:${u.email}`}
                        className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        <Mail className="h-3 w-3" />
                        {u.email}
                      </a>
                    </td>
                    <td className="py-2 text-gray-700">{u.userCode ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Đề tài thuộc chuyên ngành ({data.topics.length})
        </h2>
        {data.topics.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-500">Chưa có đề tài.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-2 font-medium">Tên đề tài</th>
                  <th className="py-2 font-medium">GV hướng dẫn</th>
                  <th className="py-2 font-medium">Trạng thái</th>
                  <th className="py-2 text-right font-medium">SV</th>
                </tr>
              </thead>
              <tbody>
                {data.topics.map((t) => (
                  <tr key={t.id} className="border-b last:border-0">
                    <td className="py-2 font-medium text-gray-900">{t.title}</td>
                    <td className="py-2 text-gray-700">{t.lecturerName}</td>
                    <td className="py-2">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                        {t.status}
                      </span>
                    </td>
                    <td className="py-2 text-right text-gray-700">
                      {t.currentStudents}/{t.maxStudents}
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
