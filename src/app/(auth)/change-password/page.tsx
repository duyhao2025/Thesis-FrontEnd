"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";

const MIN_PASSWORD_LENGTH = 8;

const roleRoutes: Record<string, string> = {
  Student: "/student/dashboard",
  Lecturer: "/lecturer/dashboard",
  FacultyStaff: "/faculty-staff/dashboard",
  HeadOfDepartment: "/head/dashboard",
  Admin: "/admin/dashboard",
};

export default function ChangePasswordPage() {
  const { user, login, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  const isForced = !!user?.requirePasswordChange;

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`Mật khẩu mới phải có ít nhất ${MIN_PASSWORD_LENGTH} ký tự`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu mới và xác nhận mật khẩu không khớp");
      return;
    }
    if (!isForced && !currentPassword) {
      setError("Vui lòng nhập mật khẩu hiện tại");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      // DEBUG: kiểm tra token thực sự gửi đi
      console.log("[DEBUG change-password] token =", token);
      console.log("[DEBUG change-password] isForced =", isForced);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5115/api"}/auth/change-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword: isForced ? undefined : currentPassword,
            newPassword,
          }),
        }
      );
      const resData = await res.json().catch(() => ({}));
      // DEBUG: in response chi tiết
      console.log("[DEBUG change-password] status =", res.status);
      console.log("[DEBUG change-password] body =", resData);
      if (!res.ok) {
        setError(resData.message || `HTTP ${res.status}: Đổi mật khẩu thất bại`);
        return;
      }
      setSuccess(true);

      if (isForced) {
        const email = user?.email || "";
        try {
          await login({ email, password: newPassword });
        } catch {
          // ignore - user can still log in manually
        }
        const target = roleRoutes[user?.role || ""] || "/student/dashboard";
        setTimeout(() => {
          router.push(target);
        }, 800);
      } else {
        const target = roleRoutes[user?.role || ""] || "/student/dashboard";
        setTimeout(() => {
          router.push(target);
        }, 1200);
      }
    } catch {
      setError("Đổi mật khẩu thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const subheading = isForced
    ? `Xin chào, ${user?.fullName}. Bạn cần đổi mật khẩu trước khi tiếp tục.`
    : `Xin chào, ${user?.fullName}. Nhập mật khẩu hiện tại và mật khẩu mới để thay đổi.`;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white p-8 shadow-xl">
          <div className="mb-6 text-center">
            <div
              className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${
                isForced ? "bg-orange-100" : "bg-blue-100"
              }`}
            >
              <Lock
                className={`h-7 w-7 ${isForced ? "text-orange-600" : "text-blue-600"}`}
              />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Đổi mật khẩu</h1>
            <p className="mt-1 text-sm text-gray-500">{subheading}</p>
          </div>

          {success ? (
            <div className="rounded-lg bg-green-50 p-4 text-center text-sm text-green-700">
              <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              {isForced
                ? "Đổi mật khẩu thành công! Đang chuyển hướng..."
                : "Đổi mật khẩu thành công!"}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {!isForced && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Mật khẩu hiện tại
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrent ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Nhập mật khẩu hiện tại"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-10 text-sm text-gray-900 placeholder-gray-400 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showCurrent ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={`Ít nhất ${MIN_PASSWORD_LENGTH} ký tự`}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-10 text-sm text-gray-900 placeholder-gray-400 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNew ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Đang xử lý..." : "Đổi mật khẩu"}
              </button>

              {!isForced && (
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Hủy
                </button>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
