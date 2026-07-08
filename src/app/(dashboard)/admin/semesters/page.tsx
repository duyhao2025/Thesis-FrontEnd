"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminSemestersRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    // Semester management is now done via Registration Periods by Faculty Staff.
    router.replace("/faculty-staff/registration-periods");
  }, [router]);

  return (
    <div className="flex items-center justify-center py-12 text-gray-500">
      Đang chuyển sang trang Đợt đăng ký...
    </div>
  );
}