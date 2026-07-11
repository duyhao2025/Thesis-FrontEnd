"use client";

import { useEffect, useRef, useState } from "react";
import {
  Mail,
  MailCheck,
  MailPlus,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import {
  requestVerification,
  unlinkPersonalEmail,
} from "@/lib/emailVerification";

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ok"; message: string }
  | { kind: "cooldown"; message: string; retryAfterSeconds: number }
  | { kind: "error"; message: string };

interface EmailVerificationCardProps {
  personalEmail?: string;
  isEmailVerified: boolean;
  onChange: () => void;
}

const COOLDOWN_STORAGE_KEY = "personalEmailCooldownUntil";

function readCooldownUntil(): number {
  if (typeof window === "undefined") return 0;
  return Number(localStorage.getItem(COOLDOWN_STORAGE_KEY) || 0);
}

function remainingSecondsFrom(until: number, now: number): number {
  return Math.max(0, Math.ceil((until - now) / 1000));
}

export default function EmailVerificationCard({
  personalEmail,
  isEmailVerified,
  onChange,
}: EmailVerificationCardProps) {
  const { user } = useAuth();
  const [emailInput, setEmailInput] = useState(personalEmail ?? "");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const lastSyncedEmail = useRef<string | undefined>(personalEmail);

  // Sync the visible email input ONLY when the persisted personalEmail
  // actually changes from the outside (e.g. after the parent refetches
  // the profile). We must NOT depend on `emailInput` — that would cause
  // the effect to reset the user's typed value on every keystroke.
  useEffect(() => {
    if (lastSyncedEmail.current === personalEmail) return;
    lastSyncedEmail.current = personalEmail;
    setEmailInput(personalEmail ?? "");
  }, [personalEmail]);

  // Tick once a second so the cooldown countdown updates without action.
  useEffect(() => {
    const tick = () =>
      setRemainingSeconds(remainingSecondsFrom(readCooldownUntil(), Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const isOnCooldown =
    status.kind === "cooldown"
      ? status.retryAfterSeconds > 0
      : remainingSeconds > 0;

  const handleSend = async () => {
    const accessToken =
      typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (!accessToken) {
      setStatus({ kind: "error", message: "Phiên đăng nhập đã hết hạn." });
      return;
    }
    if (!emailInput.trim()) {
      setStatus({ kind: "error", message: "Vui lòng nhập email cá nhân." });
      return;
    }

    setStatus({ kind: "loading" });
    try {
      const res = await requestVerification(emailInput.trim(), accessToken);
      setStatus({ kind: "ok", message: res.message ?? "Đã gửi email xác nhận." });

      if (typeof window !== "undefined" && res.retryAfterSeconds > 0) {
        const until = Date.now() + res.retryAfterSeconds * 1000;
        localStorage.setItem(COOLDOWN_STORAGE_KEY, String(until));
        setRemainingSeconds(remainingSecondsFrom(until, Date.now()));
      }
      onChange();
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      const message = e.response?.data?.message ?? "Không thể gửi email xác nhận.";
      const retryAfterRaw =
        (err as { response?: { data?: { retryAfterSeconds?: number } } }).response
          ?.data?.retryAfterSeconds ?? 0;
      if (
        (err as { response?: { status?: number } })?.response?.status === 429 &&
        retryAfterRaw > 0
      ) {
        if (typeof window !== "undefined") {
          const until = Date.now() + retryAfterRaw * 1000;
          localStorage.setItem(COOLDOWN_STORAGE_KEY, String(until));
          setRemainingSeconds(remainingSecondsFrom(until, Date.now()));
        }
        setStatus({
          kind: "cooldown",
          message,
          retryAfterSeconds: retryAfterRaw,
        });
      } else {
        setStatus({ kind: "error", message });
      }
    }
  };

  const handleUnlink = async () => {
    if (!confirm("Bạn có chắc muốn huỷ liên kết email cá nhân?")) return;
    const accessToken =
      typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (!accessToken) {
      setStatus({ kind: "error", message: "Phiên đăng nhập đã hết hạn." });
      return;
    }
    setStatus({ kind: "loading" });
    try {
      await unlinkPersonalEmail(accessToken);
      setStatus({ kind: "idle" });
      if (typeof window !== "undefined") {
        localStorage.removeItem(COOLDOWN_STORAGE_KEY);
      }
      setRemainingSeconds(0);
      onChange();
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      setStatus({
        kind: "error",
        message: e.response?.data?.message ?? "Không thể huỷ liên kết.",
      });
    }
  };

  const showVerifiedBanner = isEmailVerified && !!personalEmail;
  const showPendingBanner = !!personalEmail && !isEmailVerified;

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          {isEmailVerified ? (
            <MailCheck className="h-5 w-5 text-emerald-600" />
          ) : (
            <MailPlus className="h-5 w-5 text-blue-600" />
          )}
          <span>Email cá nhân (nhận thông báo)</span>
        </div>
      }
      subtitle="Liên kết email cá nhân (Gmail, Outlook…) để tiếp tục nhận thông báo sau khi tốt nghiệp. Email trường vẫn dùng để đăng nhập."
    >
      <div className="space-y-4">
        {showVerifiedBanner ? (
          <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-emerald-900">
                Email cá nhân đã được xác nhận
              </p>
              <p className="mt-0.5 truncate text-sm text-emerald-800">
                {personalEmail}
              </p>
              <p className="mt-1 text-xs text-emerald-700">
                Thông báo sẽ được gửi tới email cá nhân này thay vì email trường.
              </p>
            </div>
          </div>
        ) : null}

        {showPendingBanner ? (
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <Mail className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-amber-900">
                Email cá nhân đang chờ xác nhận
              </p>
              <p className="mt-0.5 truncate text-sm text-amber-800">
                {personalEmail}
              </p>
              <p className="mt-1 text-xs text-amber-700">
                Bạn đã gửi yêu cầu nhưng chưa bấm vào đường dẫn xác nhận. Vui
                lòng kiểm tra hộp thư (kể cả thư mục Spam).
              </p>
            </div>
          </div>
        ) : null}

        <div>
          <Input
            label="Email cá nhân"
            type="email"
            placeholder="your.personal@gmail.com"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            disabled={status.kind === "loading"}
            helperText="Hệ thống sẽ gửi đường dẫn xác nhận tới email này."
          />
        </div>

        {status.kind === "ok" ? (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            {status.message} Vui lòng kiểm tra hộp thư và bấm vào đường dẫn
            trong vòng 15 phút.
          </div>
        ) : null}
        {status.kind === "error" ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {status.message}
          </div>
        ) : null}
        {status.kind === "cooldown" ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            {status.message} Vui lòng thử lại sau{" "}
            <strong>{remainingSeconds}s</strong>.
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            onClick={handleSend}
            disabled={
              status.kind === "loading" ||
              isOnCooldown ||
              !emailInput.trim() ||
              isEmailVerified
            }
            isLoading={status.kind === "loading"}
          >
            <RefreshCw className="h-4 w-4" />
            {isEmailVerified
              ? "Đã xác nhận"
              : personalEmail
                ? "Gửi lại email xác nhận"
                : "Gửi email xác nhận"}
          </Button>
          {showVerifiedBanner ? (
            <Button
              variant="outline"
              onClick={handleUnlink}
              disabled={status.kind === "loading"}
            >
              <Trash2 className="h-4 w-4" />
              Huỷ liên kết email cá nhân
            </Button>
          ) : null}
          {showPendingBanner ? (
            <Button
              variant="outline"
              onClick={handleUnlink}
              disabled={status.kind === "loading"}
            >
              <Trash2 className="h-4 w-4" />
              Huỷ liên kết
            </Button>
          ) : null}
        </div>

        {isOnCooldown && status.kind !== "cooldown" ? (
          <p className="text-xs text-gray-500">
            Vui lòng đợi {remainingSeconds}s trước khi gửi lại.
          </p>
        ) : null}

        {user?.email ? (
          <p className="text-xs text-gray-500">
            Email đăng nhập hiện tại: <span className="font-medium">{user.email}</span>.
            Email cá nhân chỉ dùng để nhận thông báo.
          </p>
        ) : null}
      </div>
    </Card>
  );
}
