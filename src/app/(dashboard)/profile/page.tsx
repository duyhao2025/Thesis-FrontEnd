"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Mail,
  Building2,
  GraduationCap,
  Hash,
  IdCard,
  CalendarDays,
  ShieldCheck,
  KeyRound,
  Clock,
  CheckCircle2,
  XCircle,
  Sparkles,
  BookOpen,
  FileText,
  ClipboardList,
  Users,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { MyProfileResponse } from "@/types/api";
import Card from "@/components/ui/Card";
import { CardSkeleton } from "@/components/ui/Skeleton";
import EmailVerificationCard from "@/components/common/EmailVerificationCard";

interface RoleTheme {
  roleLabel: string;
  gradient: string;
  initialsBg: string;
  accentRing: string;
  statColor: string;
  icon: React.ReactNode;
}

const roleThemes: Record<string, RoleTheme> = {
  Admin: {
    roleLabel: "Quản trị viên",
    gradient: "from-indigo-600 via-indigo-500 to-violet-600",
    initialsBg: "bg-indigo-600",
    accentRing: "ring-indigo-200",
    statColor: "text-indigo-600",
    icon: <ShieldCheck className="h-5 w-5" />,
  },
  Lecturer: {
    roleLabel: "Giảng viên",
    gradient: "from-teal-600 via-teal-500 to-emerald-600",
    initialsBg: "bg-teal-600",
    accentRing: "ring-teal-200",
    statColor: "text-teal-600",
    icon: <GraduationCap className="h-5 w-5" />,
  },
  HeadOfDepartment: {
    roleLabel: "Trưởng bộ môn",
    gradient: "from-teal-600 via-teal-500 to-emerald-600",
    initialsBg: "bg-teal-600",
    accentRing: "ring-teal-200",
    statColor: "text-teal-600",
    icon: <GraduationCap className="h-5 w-5" />,
  },
  FacultyStaff: {
    roleLabel: "Nhân viên khoa",
    gradient: "from-amber-600 via-amber-500 to-orange-500",
    initialsBg: "bg-amber-600",
    accentRing: "ring-amber-200",
    statColor: "text-amber-600",
    icon: <Building2 className="h-5 w-5" />,
  },
  Student: {
    roleLabel: "Sinh viên",
    gradient: "from-emerald-600 via-emerald-500 to-teal-600",
    initialsBg: "bg-emerald-600",
    accentRing: "ring-emerald-200",
    statColor: "text-emerald-600",
    icon: <BookOpen className="h-5 w-5" />,
  },
};

const defaultTheme: RoleTheme = {
  roleLabel: "Người dùng",
  gradient: "from-blue-600 via-blue-500 to-indigo-600",
  initialsBg: "bg-blue-600",
  accentRing: "ring-blue-200",
  statColor: "text-blue-600",
  icon: <Sparkles className="h-5 w-5" />,
};

interface StudentStats {
  registrations: number;
  proposals: number;
  pendingProposals: number;
  approvedProposals: number;
  finalResults: number;
}

interface LecturerStats {
  topics: number;
  proposals: number;
  pendingProposals: number;
  students: number;
}

interface AdminStats {
  users: number;
  departments: number;
  majors: number;
  topics: number;
}

interface FacultyStats {
  pendingAssignments: number;
  registrationPeriods: number;
  topics: number;
}

interface HodStats {
  councils: number;
  rubrics: number;
  eligibleLecturers: number;
}

const ROLE_HOME: Record<string, string> = {
  Student: "/student/dashboard",
  Lecturer: "/lecturer/dashboard",
  FacultyStaff: "/faculty-staff/dashboard",
  HeadOfDepartment: "/head/dashboard",
  Admin: "/admin/dashboard",
};

export default function ProfilePage() {
  const { user: authUser } = useAuth();
  const role = authUser?.role || "";
  const theme = roleThemes[role] || defaultTheme;

  const [profile, setProfile] = useState<MyProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileVersion, setProfileVersion] = useState(0);

  const [studentStats, setStudentStats] = useState<StudentStats | null>(null);
  const [lecturerStats, setLecturerStats] = useState<LecturerStats | null>(null);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [facultyStats, setFacultyStats] = useState<FacultyStats | null>(null);
  const [hodStats, setHodStats] = useState<HodStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<MyProfileResponse>("/shared/me/profile");
        if (cancelled) return;
        setProfile(res.data);
      } catch (err: unknown) {
        const e = err as { response?: { data?: { message?: string } } };
        if (!cancelled)
          setError(e.response?.data?.message || "Không thể tải thông tin hồ sơ");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profileVersion]);

  useEffect(() => {
    if (!role || loading) return;
    let cancelled = false;
    const safeCall = <T,>(p: Promise<{ data: T }>) =>
      p.catch(() => ({ data: null as unknown as T }));

    const load = async () => {
      try {
        if (role === "Student") {
          const [regs, props, finals] = await Promise.all([
            safeCall(api.get("/topic-registrations/my")),
            safeCall(api.get("/topic-proposals/my")),
            safeCall(api.get("/student/final-results/my")),
          ]);
          if (cancelled) return;
          const regsArr: { status: string }[] = Array.isArray(regs.data)
            ? regs.data
            : [];
          const propsArr: { status: string }[] = Array.isArray(props.data)
            ? props.data
            : [];
          const finalsArr = Array.isArray(finals.data) ? finals.data : [];
          setStudentStats({
            registrations: regsArr.length,
            proposals: propsArr.length,
            pendingProposals: propsArr.filter(
              (p) => p.status === "PENDING" || p.status === "Pending",
            ).length,
            approvedProposals: propsArr.filter(
              (p) => p.status === "APPROVED" || p.status === "Approved",
            ).length,
            finalResults: finalsArr.length,
          });
        } else if (role === "Lecturer") {
          const [topics, props, students] = await Promise.all([
            safeCall(api.get("/topics/my")),
            safeCall(api.get("/topic-proposals/lecturer")),
            safeCall(api.get("/students/my")),
          ]);
          if (cancelled) return;
          const topicsArr: unknown[] = Array.isArray(topics.data)
            ? topics.data
            : [];
          const propsArr: { status: string }[] = Array.isArray(props.data)
            ? props.data
            : [];
          const studentsArr = Array.isArray(students.data)
            ? students.data
            : [];
          setLecturerStats({
            topics: topicsArr.length,
            proposals: propsArr.length,
            pendingProposals: propsArr.filter(
              (p) => p.status === "PENDING" || p.status === "Pending",
            ).length,
            students: studentsArr.length,
          });
        } else if (role === "Admin") {
          const [users, depts, majors, topics] = await Promise.all([
            safeCall(api.get("/admin/users")),
            safeCall(api.get("/admin/departments")),
            safeCall(api.get("/admin/majors")),
            safeCall(api.get("/topics")),
          ]);
          if (cancelled) return;
          setAdminStats({
            users: Array.isArray(users.data) ? users.data.length : 0,
            departments: Array.isArray(depts.data) ? depts.data.length : 0,
            majors: Array.isArray(majors.data) ? majors.data.length : 0,
            topics: Array.isArray(topics.data) ? topics.data.length : 0,
          });
        } else if (role === "FacultyStaff") {
          const [pending, periods, topics] = await Promise.all([
            safeCall(api.get("/faculty-staff/assignments/pending-assignment")),
            safeCall(api.get("/faculty-staff/registration-periods")),
            safeCall(api.get("/topics")),
          ]);
          if (cancelled) return;
          setFacultyStats({
            pendingAssignments: Array.isArray(pending.data)
              ? pending.data.length
              : 0,
            registrationPeriods: Array.isArray(periods.data)
              ? periods.data.length
              : 0,
            topics: Array.isArray(topics.data) ? topics.data.length : 0,
          });
        } else if (role === "HeadOfDepartment") {
          const [councils, rubrics, eligible] = await Promise.all([
            safeCall(api.get("/head/councils")),
            safeCall(api.get("/head/rubrics")),
            safeCall(api.get("/head/councils/eligible-lecturers")),
          ]);
          if (cancelled) return;
          setHodStats({
            councils: Array.isArray(councils.data) ? councils.data.length : 0,
            rubrics: Array.isArray(rubrics.data) ? rubrics.data.length : 0,
            eligibleLecturers: Array.isArray(eligible.data)
              ? eligible.data.length
              : 0,
          });
        }
      } catch {
        // ignore
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [role, loading]);

  const initials = useMemo(() => {
    const name = profile?.fullName || authUser?.fullName || "";
    return (
      name
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "?"
    );
  }, [profile, authUser]);

  if (loading) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <CardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="flex items-center gap-3 py-6 text-red-600">
          <XCircle className="h-6 w-6" />
          <p className="font-medium">{error}</p>
        </div>
      </Card>
    );
  }

  if (!profile) return null;

  const fullName = profile.fullName || authUser?.fullName || "";

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${theme.gradient} px-6 py-8 text-white shadow-lg sm:px-10`}
      >
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-12 -left-10 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
        <div className="relative z-10 flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:gap-8">
          <div
            className={`flex h-24 w-24 items-center justify-center rounded-2xl text-3xl font-bold ring-4 ring-white/20 ${theme.initialsBg}`}
          >
            {initials}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold sm:text-3xl">{fullName}</h1>
              {profile.isActive ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium backdrop-blur">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Hoạt động
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-500/30 px-2.5 py-0.5 text-xs font-medium backdrop-blur">
                  <XCircle className="h-3.5 w-3.5" />
                  Ngừng hoạt động
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-white/80">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 backdrop-blur">
                {theme.icon}
                {theme.roleLabel}
              </span>
              {profile.userCode && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 backdrop-blur">
                  <Hash className="h-3 w-3" />
                  {profile.userCode}
                </span>
              )}
              {(profile.departmentName || profile.majorName) && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 backdrop-blur">
                  <Building2 className="h-3 w-3" />
                  {profile.departmentName || "Chưa gán khoa"}
                  {profile.majorName ? ` / ${profile.majorName}` : ""}
                </span>
              )}
            </div>
            <p className="mt-3 flex items-center gap-2 text-sm text-white/80">
              <Mail className="h-4 w-4" />
              {profile.email}
            </p>
          </div>
          <div className="flex gap-2 sm:flex-col">
            <Link
              href="/change-password"
              className="inline-flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-white/30"
            >
              <KeyRound className="h-4 w-4" />
              Đổi mật khẩu
            </Link>
            <Link
              href={ROLE_HOME[role] || "/"}
              className="inline-flex items-center gap-2 rounded-lg border border-white/30 bg-transparent px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Quay lại Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <RoleStats
        role={role}
        theme={theme}
        studentStats={studentStats}
        lecturerStats={lecturerStats}
        adminStats={adminStats}
        facultyStats={facultyStats}
        hodStats={hodStats}
      />

      {/* Main info */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <IdCard className={`h-5 w-5 ${theme.statColor}`} />
            <span>Thông tin chi tiết</span>
          </div>
        }
        subtitle="Thông tin tài khoản và đơn vị công tác / học tập"
      >
        <div className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2">
          <InfoRow
            icon={<Mail className="h-4 w-4" />}
            label="Email"
            value={profile.email}
          />
          <InfoRow
            icon={<IdCard className="h-4 w-4" />}
            label="Họ và tên"
            value={fullName}
          />
          <InfoRow
            icon={<Hash className="h-4 w-4" />}
            label={
              role === "Student"
                ? "Mã số sinh viên"
                : role === "Lecturer" || role === "HeadOfDepartment"
                  ? "Mã giảng viên"
                  : role === "FacultyStaff"
                    ? "Mã nhân viên"
                    : "Mã người dùng"
            }
            value={profile.userCode || "—"}
          />
          <InfoRow
            icon={<ShieldCheck className="h-4 w-4" />}
            label="Vai trò"
            value={theme.roleLabel}
          />
          <InfoRow
            icon={<Building2 className="h-4 w-4" />}
            label="Khoa"
            value={
              profile.departmentName
                ? `${profile.departmentName}${
                    profile.departmentCode ? ` (${profile.departmentCode})` : ""
                  }`
                : "—"
            }
          />
          <InfoRow
            icon={<GraduationCap className="h-4 w-4" />}
            label="Chuyên ngành"
            value={
              profile.majorName
                ? `${profile.majorName}${
                    profile.majorCode ? ` (${profile.majorCode})` : ""
                  }`
                : "—"
            }
          />
          <InfoRow
            icon={<CalendarDays className="h-4 w-4" />}
            label="Ngày tạo tài khoản"
            value={format(parseISO(profile.createdAt), "dd/MM/yyyy HH:mm", {
              locale: vi,
            })}
          />
          <InfoRow
            icon={<Clock className="h-4 w-4" />}
            label="Cập nhật lần cuối"
            value={
              profile.updatedAt
                ? format(parseISO(profile.updatedAt), "dd/MM/yyyy HH:mm", {
                    locale: vi,
                  })
                : "—"
            }
          />
        </div>
      </Card>

      {/* Personal email (Students only) */}
      {role === "Student" && (
        <EmailVerificationCard
          personalEmail={profile.personalEmail}
          isEmailVerified={profile.isEmailVerified}
          onChange={() => setProfileVersion((v) => v + 1)}
        />
      )}

      {/* Quick actions */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <Sparkles className={`h-5 w-5 ${theme.statColor}`} />
            <span>Hành động nhanh</span>
          </div>
        }
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <ActionTile
            href="/change-password"
            icon={<KeyRound className="h-6 w-6" />}
            label="Đổi mật khẩu"
            colorClass="bg-rose-50 text-rose-600 hover:bg-rose-100"
          />
          <ActionTile
            href={ROLE_HOME[role] || "/"}
            icon={<Sparkles className="h-6 w-6" />}
            label="Về Dashboard"
            colorClass="bg-blue-50 text-blue-600 hover:bg-blue-100"
          />
          {role === "Admin" && (
            <ActionTile
              href="/admin/users"
              icon={<Users className="h-6 w-6" />}
              label="Người dùng"
              colorClass="bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
            />
          )}
          {role === "Admin" && (
            <ActionTile
              href="/admin/audit-log"
              icon={<ClipboardList className="h-6 w-6" />}
              label="Nhật ký"
              colorClass="bg-amber-50 text-amber-600 hover:bg-amber-100"
            />
          )}
          {role === "Lecturer" && (
            <ActionTile
              href="/lecturer/students"
              icon={<Users className="h-6 w-6" />}
              label="Sinh viên"
              colorClass="bg-teal-50 text-teal-600 hover:bg-teal-100"
            />
          )}
          {role === "Lecturer" && (
            <ActionTile
              href="/lecturer/grading"
              icon={<FileText className="h-6 w-6" />}
              label="Chấm điểm"
              colorClass="bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
            />
          )}
          {role === "Student" && (
            <ActionTile
              href="/student/my-topic"
              icon={<BookOpen className="h-6 w-6" />}
              label="Đề tài của tôi"
              colorClass="bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
            />
          )}
          {role === "Student" && (
            <ActionTile
              href="/student/topic-registrations"
              icon={<FileText className="h-6 w-6" />}
              label="Đăng ký đề tài"
              colorClass="bg-violet-50 text-violet-600 hover:bg-violet-100"
            />
          )}
          {role === "FacultyStaff" && (
            <ActionTile
              href="/faculty-staff/registration-periods"
              icon={<CalendarDays className="h-6 w-6" />}
              label="Đợt đăng ký"
              colorClass="bg-amber-50 text-amber-600 hover:bg-amber-100"
            />
          )}
          {role === "FacultyStaff" && (
            <ActionTile
              href="/faculty-staff/assignments"
              icon={<ClipboardList className="h-6 w-6" />}
              label="Phân công"
              colorClass="bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
            />
          )}
          {role === "HeadOfDepartment" && (
            <ActionTile
              href="/head/councils"
              icon={<Users className="h-6 w-6" />}
              label="Hội đồng"
              colorClass="bg-teal-50 text-teal-600 hover:bg-teal-100"
            />
          )}
          {role === "HeadOfDepartment" && (
            <ActionTile
              href="/head/rubrics"
              icon={<FileText className="h-6 w-6" />}
              label="Tiêu chí"
              colorClass="bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
            />
          )}
        </div>
      </Card>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50/50 p-3">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white text-gray-500 ring-1 ring-gray-200">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          {label}
        </p>
        <p className="mt-0.5 truncate text-sm font-semibold text-gray-900">
          {value}
        </p>
      </div>
    </div>
  );
}

function ActionTile({
  href,
  icon,
  label,
  colorClass,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  colorClass: string;
}) {
  return (
    <Link href={href}>
      <div
        className={`flex flex-col items-center gap-2 rounded-xl border border-transparent p-4 text-center transition-all hover:-translate-y-0.5 ${colorClass}`}
      >
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
    </Link>
  );
}

function Stat({
  label,
  value,
  icon,
  colorClass,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  colorClass: string;
}) {
  return (
    <Card className="transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center gap-3">
        <div className={`rounded-xl p-3 ${colorClass}`}>{icon}</div>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-gray-500">
            {label}
          </p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </Card>
  );
}

function RoleStats({
  role,
  theme,
  studentStats,
  lecturerStats,
  adminStats,
  facultyStats,
  hodStats,
}: {
  role: string;
  theme: RoleTheme;
  studentStats: StudentStats | null;
  lecturerStats: LecturerStats | null;
  adminStats: AdminStats | null;
  facultyStats: FacultyStats | null;
  hodStats: HodStats | null;
}) {
  if (role === "Student" && studentStats) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat
          label="Đề tài đã đăng ký"
          value={studentStats.registrations}
          icon={<BookOpen className="h-6 w-6" />}
          colorClass="bg-emerald-50 text-emerald-600"
        />
        <Stat
          label="Đề xuất"
          value={studentStats.proposals}
          icon={<FileText className="h-6 w-6" />}
          colorClass="bg-violet-50 text-violet-600"
        />
        <Stat
          label="Chờ duyệt"
          value={studentStats.pendingProposals}
          icon={<ClipboardList className="h-6 w-6" />}
          colorClass="bg-amber-50 text-amber-600"
        />
        <Stat
          label="Đã duyệt"
          value={studentStats.approvedProposals}
          icon={<CheckCircle2 className="h-6 w-6" />}
          colorClass="bg-green-50 text-green-600"
        />
      </div>
    );
  }
  if (role === "Lecturer" && lecturerStats) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat
          label="Đề tài phụ trách"
          value={lecturerStats.topics}
          icon={<BookOpen className="h-6 w-6" />}
          colorClass="bg-teal-50 text-teal-600"
        />
        <Stat
          label="Đề xuất"
          value={lecturerStats.proposals}
          icon={<FileText className="h-6 w-6" />}
          colorClass="bg-violet-50 text-violet-600"
        />
        <Stat
          label="Chờ duyệt"
          value={lecturerStats.pendingProposals}
          icon={<ClipboardList className="h-6 w-6" />}
          colorClass="bg-amber-50 text-amber-600"
        />
        <Stat
          label="Sinh viên"
          value={lecturerStats.students}
          icon={<Users className="h-6 w-6" />}
          colorClass="bg-emerald-50 text-emerald-600"
        />
      </div>
    );
  }
  if (role === "Admin" && adminStats) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat
          label="Người dùng"
          value={adminStats.users}
          icon={<Users className="h-6 w-6" />}
          colorClass="bg-indigo-50 text-indigo-600"
        />
        <Stat
          label="Khoa"
          value={adminStats.departments}
          icon={<Building2 className="h-6 w-6" />}
          colorClass="bg-violet-50 text-violet-600"
        />
        <Stat
          label="Chuyên ngành"
          value={adminStats.majors}
          icon={<GraduationCap className="h-6 w-6" />}
          colorClass="bg-emerald-50 text-emerald-600"
        />
        <Stat
          label="Đề tài"
          value={adminStats.topics}
          icon={<BookOpen className="h-6 w-6" />}
          colorClass="bg-amber-50 text-amber-600"
        />
      </div>
    );
  }
  if (role === "FacultyStaff" && facultyStats) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat
          label="Đề tài"
          value={facultyStats.topics}
          icon={<BookOpen className="h-6 w-6" />}
          colorClass="bg-amber-50 text-amber-600"
        />
        <Stat
          label="Chờ phân công"
          value={facultyStats.pendingAssignments}
          icon={<ClipboardList className="h-6 w-6" />}
          colorClass="bg-rose-50 text-rose-600"
        />
        <Stat
          label="Đợt đăng ký"
          value={facultyStats.registrationPeriods}
          icon={<CalendarDays className="h-6 w-6" />}
          colorClass="bg-emerald-50 text-emerald-600"
        />
        <Stat
          label="Hệ thống"
          value={<Sparkles className="h-6 w-6 opacity-50" />}
          icon={<BarChart3 className="h-6 w-6" />}
          colorClass="bg-violet-50 text-violet-600"
        />
      </div>
    );
  }
  if (role === "HeadOfDepartment" && hodStats) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat
          label="Hội đồng"
          value={hodStats.councils}
          icon={<Users className="h-6 w-6" />}
          colorClass="bg-teal-50 text-teal-600"
        />
        <Stat
          label="Tiêu chí"
          value={hodStats.rubrics}
          icon={<FileText className="h-6 w-6" />}
          colorClass="bg-indigo-50 text-indigo-600"
        />
        <Stat
          label="GV đủ điều kiện"
          value={hodStats.eligibleLecturers}
          icon={<GraduationCap className="h-6 w-6" />}
          colorClass="bg-emerald-50 text-emerald-600"
        />
        <Stat
          label="Hệ thống"
          value={<Sparkles className="h-6 w-6 opacity-50" />}
          icon={<ShieldCheck className="h-6 w-6" />}
          colorClass="bg-violet-50 text-violet-600"
        />
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <Stat
        label="Trạng thái"
        value={theme.roleLabel}
        icon={theme.icon}
        colorClass="bg-gray-50 text-gray-600"
      />
    </div>
  );
}
