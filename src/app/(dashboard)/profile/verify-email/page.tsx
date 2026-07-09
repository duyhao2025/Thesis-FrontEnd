"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MailCheck, MailX, Loader2, ArrowLeft } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { confirmVerification } from "@/lib/emailVerification";

type State =
  | { kind: "loading" }
  | { kind: "success"; email?: string; message: string }
  | { kind: "error"; message: string };

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<LoadingShell />}>
      <VerifyEmailContent />
    </Suspense>
  );
}

function LoadingShell() {
  return (
    <Card>
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="text-base font-medium text-gray-700">Đang tải...</p>
      </div>
    </Card>
  );
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      queueMicrotask(() =>
        setState({
          kind: "error",
          message: "Thiếu token xác nhận trên đường dẫn.",
        }),
      );
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await confirmVerification(token);
        if (cancelled) return;
        if (res.success) {
          setState({
            kind: "success",
            email: res.personalEmail,
            message: res.message,
          });
        } else {
          setState({ kind: "error", message: res.message });
        }
      } catch (err) {
        if (cancelled) return;
        const e = err as {
          response?: { data?: { message?: string } };
        };
        setState({
          kind: "error",
          message:
            e.response?.data?.message ??
            "Đường dẫn xác nhận không hợp lệ hoặc đã hết hạn.",
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Xác nhận email cá nhân
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Hoàn tất liên kết email cá nhân với tài khoản của bạn.
        </p>
      </div>

      <Card>
        {state.kind === "loading" ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            <p className="text-base font-medium text-gray-700">
              Đang xác nhận email của bạn...
            </p>
          </div>
        ) : null}

        {state.kind === "success" ? (
          <div className="flex flex-col items-center gap-4 py-2 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <MailCheck className="h-9 w-9 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              Xác nhận email thành công
            </h2>
            {state.email ? (
              <p className="text-sm text-gray-600">
                Email cá nhân <span className="font-semibold">{state.email}</span>{" "}
                đã được liên kết với tài khoản của bạn.
              </p>
            ) : null}
            <p className="text-sm text-gray-500">{state.message}</p>
            <Link href="/profile">
              <Button variant="primary" className="mt-2">
                <ArrowLeft className="h-4 w-4" />
                Về trang hồ sơ
              </Button>
            </Link>
          </div>
        ) : null}

        {state.kind === "error" ? (
          <div className="flex flex-col items-center gap-4 py-2 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <MailX className="h-9 w-9 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              Không thể xác nhận email
            </h2>
            <p className="text-sm text-red-700">{state.message}</p>
            <p className="text-xs text-gray-500">
              Nếu đường dẫn đã hết hạn (15 phút), vui lòng vào trang hồ sơ để
              yêu cầu gửi lại email xác nhận.
            </p>
            <div className="mt-2 flex gap-2">
              <Link href="/profile">
                <Button variant="primary">Về trang hồ sơ</Button>
              </Link>
              <Link href="/">
                <Button variant="outline">Về trang chủ</Button>
              </Link>
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
}