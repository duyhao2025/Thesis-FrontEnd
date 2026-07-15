export type UserRole =
  | "Student"
  | "Lecturer"
  | "HeadOfDepartment"
  | "FacultyStaff"
  | "Admin";

export interface RoleTheme {
  role: UserRole | string;
  roleLabel: string;
  gradient: string;
  initialsBg: string;
  ring: string;
  accent: string;
  accentBg: string;
  accentText: string;
  accentSoft: string;
  // Sidebar shell colors (used by DashboardShell)
  sidebarBg: string;
  sidebarText: string;
  sidebarActiveBg: string;
  sidebarActiveText: string;
  // Logo block on sidebar
  logoBg: string;
  logoFg: string;
  // Footer gradient (matches hero)
  footerGradient: string;
}

export const ROLE_THEMES: Record<string, RoleTheme> = {
  Admin: {
    role: "Admin",
    roleLabel: "Quản trị viên",
    gradient: "from-indigo-600 via-indigo-500 to-violet-600",
    initialsBg: "bg-indigo-600",
    ring: "ring-indigo-300",
    accent: "#4f46e5",
    accentBg: "bg-indigo-600",
    accentText: "text-indigo-600",
    accentSoft: "bg-indigo-50",
    sidebarBg: "bg-slate-800",
    sidebarText: "text-slate-200",
    sidebarActiveBg: "bg-slate-700",
    sidebarActiveText: "text-white",
    logoBg: "bg-indigo-500",
    logoFg: "text-indigo-300",
    footerGradient: "from-indigo-700 via-indigo-600 to-violet-700",
  },
  Lecturer: {
    role: "Lecturer",
    roleLabel: "Giảng viên",
    gradient: "from-teal-600 via-teal-500 to-emerald-600",
    initialsBg: "bg-teal-600",
    ring: "ring-teal-300",
    accent: "#0d9488",
    accentBg: "bg-teal-600",
    accentText: "text-teal-600",
    accentSoft: "bg-teal-50",
    sidebarBg: "bg-indigo-950",
    sidebarText: "text-indigo-100",
    sidebarActiveBg: "bg-indigo-900",
    sidebarActiveText: "text-teal-200",
    logoBg: "bg-teal-500",
    logoFg: "text-teal-300",
    footerGradient: "from-teal-700 via-teal-600 to-emerald-700",
  },
  HeadOfDepartment: {
    role: "HeadOfDepartment",
    roleLabel: "Trưởng bộ môn",
    gradient: "from-cyan-700 via-cyan-600 to-sky-600",
    initialsBg: "bg-cyan-700",
    ring: "ring-cyan-300",
    accent: "#0891b2",
    accentBg: "bg-cyan-600",
    accentText: "text-cyan-600",
    accentSoft: "bg-cyan-50",
    sidebarBg: "bg-slate-700",
    sidebarText: "text-slate-100",
    sidebarActiveBg: "bg-slate-600",
    sidebarActiveText: "text-cyan-200",
    logoBg: "bg-cyan-500",
    logoFg: "text-cyan-300",
    footerGradient: "from-cyan-700 via-cyan-600 to-sky-700",
  },
  FacultyStaff: {
    role: "FacultyStaff",
    roleLabel: "Nhân viên khoa",
    gradient: "from-amber-600 via-amber-500 to-orange-500",
    initialsBg: "bg-amber-600",
    ring: "ring-amber-300",
    accent: "#d97706",
    accentBg: "bg-amber-600",
    accentText: "text-amber-600",
    accentSoft: "bg-amber-50",
    sidebarBg: "bg-stone-800",
    sidebarText: "text-stone-100",
    sidebarActiveBg: "bg-stone-700",
    sidebarActiveText: "text-amber-200",
    logoBg: "bg-amber-500",
    logoFg: "text-amber-300",
    footerGradient: "from-amber-700 via-amber-600 to-orange-700",
  },
  Student: {
    role: "Student",
    roleLabel: "Sinh viên",
    gradient: "from-emerald-600 via-emerald-500 to-teal-600",
    initialsBg: "bg-emerald-600",
    ring: "ring-emerald-300",
    accent: "#059669",
    accentBg: "bg-emerald-600",
    accentText: "text-emerald-600",
    accentSoft: "bg-emerald-50",
    sidebarBg: "bg-emerald-900",
    sidebarText: "text-emerald-50",
    sidebarActiveBg: "bg-emerald-800",
    sidebarActiveText: "text-emerald-100",
    logoBg: "bg-emerald-500",
    logoFg: "text-emerald-300",
    footerGradient: "from-emerald-700 via-emerald-600 to-teal-700",
  },
};

export const DEFAULT_THEME: RoleTheme = {
  role: "User",
  roleLabel: "Người dùng",
  gradient: "from-blue-600 via-blue-500 to-indigo-600",
  initialsBg: "bg-blue-600",
  ring: "ring-blue-300",
  accent: "#2563eb",
  accentBg: "bg-blue-600",
  accentText: "text-blue-600",
  accentSoft: "bg-blue-50",
  sidebarBg: "bg-slate-800",
  sidebarText: "text-slate-200",
  sidebarActiveBg: "bg-slate-700",
  sidebarActiveText: "text-white",
  logoBg: "bg-blue-500",
  logoFg: "text-blue-300",
  footerGradient: "from-blue-700 via-blue-600 to-indigo-700",
};

export function getRoleTheme(role?: string | null): RoleTheme {
  return (role && ROLE_THEMES[role]) || DEFAULT_THEME;
}
