"use client";

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, FileSpreadsheet, AlertCircle, CheckCircle, Download, Loader2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import api from "@/lib/api";

interface ValidUserRow {
  rowNumber: number;
  fullName: string;
  email: string;
  userCode?: string;
  role: string;
  departmentCode?: string;
  majorCode?: string;
  isSelected: boolean;
}

interface InvalidUserRow {
  rowNumber: number;
  fullName: string;
  email: string;
  userCode?: string;
  role: string;
  departmentCode?: string;
  majorCode?: string;
  errorMessage: string;
}

interface ImportSummary {
  totalRows: number;
  validCount: number;
  invalidCount: number;
  duplicateEmailCount: number;
}

interface ImportPreview {
  validUsers: ValidUserRow[];
  invalidRows: InvalidUserRow[];
  duplicateEmails: string[];
  summary: ImportSummary;
}

interface ImportResult {
  successCount: number;
  failedCount: number;
  errors: { email: string; error: string }[];
}

interface ImportUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

const roleLabels: Record<string, string> = {
  Student: "Sinh viên",
  Lecturer: "Giảng viên",
  FacultyStaff: "Nhân viên khoa",
  HeadOfDepartment: "Trưởng bộ môn",
  Admin: "Quản trị viên",
};

export default function ImportUsersModal({ isOpen, onClose, onImportComplete }: ImportUsersModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [step, setStep] = useState<"upload" | "preview" | "result">("upload");
  const { showToast } = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) {
      showToast("error", "Vui lòng chọn file .xlsx hoặc .csv");
      return;
    }

    const selectedFile = acceptedFiles[0];
    const ext = selectedFile.name.split(".").pop()?.toLowerCase();
    if (!["xlsx", "csv"].includes(ext || "")) {
      showToast("error", "Chỉ chấp nhận file .xlsx hoặc .csv");
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      showToast("error", "File quá lớn. Kích thước tối đa là 5MB");
      return;
    }

    setFile(selectedFile);
    await uploadAndPreview(selectedFile);
  }, [showToast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "text/csv": [".csv"],
    },
    maxFiles: 1,
  });

  const uploadAndPreview = async (fileToUpload: File) => {
    setImporting(true);
    const formData = new FormData();
    formData.append("file", fileToUpload);

    try {
      const response = await api.post("/admin/users/import/preview", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPreview(response.data);
      setStep("preview");
      showToast("success", `Đã đọc ${response.data.summary.totalRows} dòng từ file`);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Lỗi khi đọc file";
      showToast("error", message);
      setFile(null);
    } finally {
      setImporting(false);
    }
  };

  const handleToggleUser = (rowNumber: number) => {
    if (!preview) return;
    setPreview({
      ...preview,
      validUsers: preview.validUsers.map((u) =>
        u.rowNumber === rowNumber ? { ...u, isSelected: !u.isSelected } : u
      ),
    });
  };

  const handleImport = async () => {
    if (!preview) return;
    const selectedUsers = preview.validUsers.filter((u) => u.isSelected);
    if (selectedUsers.length === 0) {
      showToast("error", "Vui lòng chọn ít nhất một người dùng để import");
      return;
    }

    setImporting(true);
    try {
      const usersToImport = selectedUsers.map((u) => ({
        fullName: u.fullName,
        email: u.email,
        userCode: u.userCode,
        role: u.role,
        departmentCode: u.departmentCode,
        majorCode: u.majorCode,
      }));

      const response = await api.post("/admin/users/import/execute", { users: usersToImport });
      setResult(response.data);
      setStep("result");
      if (response.data.successCount > 0) {
        showToast("success", `Đã tạo ${response.data.successCount} người dùng thành công`);
      }
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Lỗi khi import";
      showToast("error", message);
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get("/admin/users/template", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "template_import_nguoidung.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      showToast("error", "Lỗi khi tải template");
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setStep("upload");
    onClose();
  };

  const handleDone = () => {
    handleClose();
    onImportComplete();
  };

  const selectedCount = preview?.validUsers.filter((u) => u.isSelected).length || 0;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import người dùng từ Excel" size="xl">
      <div className="space-y-4">
        {step === "upload" && (
          <>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <input {...getInputProps()} />
              {importing ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-3" />
                  <p className="text-gray-600">Đang đọc file...</p>
                </div>
              ) : (
                <>
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-1">
                    {isDragActive ? "Thả file vào đây" : "Kéo thả file .xlsx, .csv hoặc click để chọn"}
                  </p>
                  <p className="text-xs text-gray-400">Kích thước tối đa: 5MB</p>
                </>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                File mẫu Excel chứa các cột: Họ tên, Email, Mã người dùng (MSSV/MGV), Vai trò, Mã Khoa, Mã Ngành
              </div>
              <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                <Download className="h-4 w-4" />
                Tải Template
              </Button>
            </div>
          </>
        )}

        {step === "preview" && preview && (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-800">
                <FileSpreadsheet className="h-5 w-5" />
                <span className="font-medium">{file?.name}</span>
              </div>
              <div className="mt-2 flex gap-4 text-sm text-blue-700">
                <span>Tổng: {preview.summary.totalRows} dòng</span>
                <span className="text-green-600">Hợp lệ: {preview.summary.validCount}</span>
                <span className="text-red-600">Lỗi: {preview.summary.invalidCount}</span>
                {preview.summary.duplicateEmailCount > 0 && (
                  <span className="text-amber-600">Trùng email: {preview.summary.duplicateEmailCount}</span>
                )}
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-600 w-12">Chọn</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600 w-12">STT</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Họ tên</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Email</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Mã</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Vai trò</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {preview.validUsers.map((user) => (
                    <tr key={user.rowNumber} className={user.isSelected ? "bg-white" : "bg-gray-50"}>
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={user.isSelected}
                          onChange={() => handleToggleUser(user.rowNumber)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-3 py-2 text-gray-500">{user.rowNumber - 1}</td>
                      <td className="px-3 py-2 font-medium text-gray-900">{user.fullName}</td>
                      <td className="px-3 py-2 text-gray-600">{user.email}</td>
                      <td className="px-3 py-2 text-gray-500">{user.userCode || "-"}</td>
                      <td className="px-3 py-2 text-gray-600">{roleLabels[user.role] || user.role}</td>
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          Hợp lệ
                        </span>
                      </td>
                    </tr>
                  ))}
                  {preview.invalidRows.map((user) => (
                    <tr key={user.rowNumber} className="bg-red-50">
                      <td className="px-3 py-2"></td>
                      <td className="px-3 py-2 text-gray-500">{user.rowNumber - 1}</td>
                      <td className="px-3 py-2 font-medium text-gray-900">{user.fullName || "(trống)"}</td>
                      <td className="px-3 py-2 text-gray-600">{user.email || "(trống)"}</td>
                      <td className="px-3 py-2 text-gray-500">{user.userCode || "-"}</td>
                      <td className="px-3 py-2 text-gray-600">{user.role || "(trống)"}</td>
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center gap-1 text-red-600">
                          <AlertCircle className="h-4 w-4" />
                          {user.errorMessage}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {preview.duplicateEmails.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-amber-800 font-medium mb-2">
                  <AlertCircle className="h-5 w-5" />
                  Email đã tồn tại trong hệ thống ({preview.duplicateEmails.length})
                </div>
                <div className="text-sm text-amber-700 space-y-1">
                  {preview.duplicateEmails.slice(0, 5).map((email) => (
                    <div key={email}>{email}</div>
                  ))}
                  {preview.duplicateEmails.length > 5 && (
                    <div>...và {preview.duplicateEmails.length - 5} email khác</div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Đã chọn: <span className="font-medium text-blue-600">{selectedCount}</span> người dùng
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleClose}>
                  Hủy
                </Button>
                <Button onClick={handleImport} isLoading={importing} disabled={selectedCount === 0}>
                  Import {selectedCount} người dùng
                </Button>
              </div>
            </div>
          </>
        )}

        {step === "result" && result && (
          <>
            <div className="text-center py-6">
              {result.successCount > 0 ? (
                <div className="flex flex-col items-center">
                  <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Import thành công!
                  </h3>
                  <p className="text-gray-600">
                    Đã tạo <span className="font-medium text-green-600">{result.successCount}</span> người dùng
                    {result.failedCount > 0 && (
                      <span>, <span className="font-medium text-red-600">{result.failedCount}</span> thất bại</span>
                    )}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                    <AlertCircle className="h-8 w-8 text-red-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Import thất bại
                  </h3>
                  <p className="text-gray-600">Không có người dùng nào được tạo</p>
                </div>
              )}

              {result.errors.length > 0 && (
                <div className="mt-6 text-left bg-red-50 border border-red-200 rounded-lg p-4 max-h-40 overflow-y-auto">
                  <div className="text-sm font-medium text-red-800 mb-2">Chi tiết lỗi:</div>
                  {result.errors.map((err, idx) => (
                    <div key={idx} className="text-sm text-red-700">
                      <span className="font-medium">{err.email}:</span> {err.error}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-center">
              <Button onClick={handleDone}>Đóng</Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
