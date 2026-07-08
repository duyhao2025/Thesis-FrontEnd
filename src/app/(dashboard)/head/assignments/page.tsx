"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HeadAssignmentsRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    // Assignment (Gale-Shapley) flow is now handled by Faculty Staff.
    router.replace("/faculty-staff/assignments");
  }, [router]);

  return (
    <div className="flex items-center justify-center py-12 text-gray-500">
      Đang chuyển sang trang Nhân viên khoa...
    </div>
  );
}