'use client';

import { useState } from 'react';
import {
  Settings,
  Bell,
  Shield,
  Database,
  Zap,
  AlertCircle,
  CheckCircle,
  Save,
} from 'lucide-react';

export default function AdminSettings() {
  const [settingsSaved, setSettingsSaved] = useState(false);

  const handleSave = () => {
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Cài Đặt Admin</h1>
        <p className="text-slate-500">Quản lý cấu hình và tùy chọn hệ thống</p>
      </div>

      {/* Success Message */}
      {settingsSaved && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <p className="text-emerald-700 font-medium">Cài đặt đã được lưu thành công!</p>
        </div>
      )}

      {/* Notification Settings */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 hover:shadow-md hover:border-slate-300 transition-all duration-300">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Bell className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Thông Báo</h2>
            <p className="text-sm text-slate-500 mt-1">Quản lý thông báo và cảnh báo hệ thống</p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input type="checkbox" defaultChecked className="w-5 h-5 rounded accent-blue-600" />
            <span className="text-slate-700 group-hover:text-slate-900 transition">Nhận thông báo khi có bài học mới</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer group">
            <input type="checkbox" defaultChecked className="w-5 h-5 rounded accent-blue-600" />
            <span className="text-slate-700 group-hover:text-slate-900 transition">Nhận cảnh báo lỗi hệ thống</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer group">
            <input type="checkbox" className="w-5 h-5 rounded accent-blue-600" />
            <span className="text-slate-700 group-hover:text-slate-900 transition">Nhận báo cáo hàng ngày</span>
          </label>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 hover:shadow-md hover:border-slate-300 transition-all duration-300">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-sky-100 rounded-lg">
            <Shield className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Bảo Mật</h2>
            <p className="text-sm text-slate-500 mt-1">Quản lý các cài đặt bảo mật và quyền truy cập</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Yêu Cầu Xác Nhận 2FA</label>
            <select className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition">
              <option>Không bắt buộc</option>
              <option selected>Bắt buộc cho admin</option>
              <option>Bắt buộc cho tất cả</option>
            </select>
          </div>

          <label className="flex items-center gap-3 cursor-pointer group">
            <input type="checkbox" defaultChecked className="w-5 h-5 rounded accent-blue-600" />
            <span className="text-slate-700 group-hover:text-slate-900 transition">Bật đăng nhập an toàn</span>
          </label>
        </div>
      </div>

      {/* Content Settings */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 hover:shadow-md hover:border-slate-300 transition-all duration-300">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-pink-100 rounded-lg">
            <Database className="w-5 h-5 text-pink-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Nội Dung</h2>
            <p className="text-sm text-slate-500 mt-1">Cấu hình các tùy chọn liên quan đến nội dung</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Markdown Renderer</label>
            <select className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition">
              <option selected>Mặc định (GitHub Flavored Markdown)</option>
              <option>CommonMark</option>
              <option>Tùy chỉnh</option>
            </select>
          </div>

          <label className="flex items-center gap-3 cursor-pointer group">
            <input type="checkbox" defaultChecked className="w-5 h-5 rounded accent-blue-600" />
            <span className="text-slate-700 group-hover:text-slate-900 transition">Cho phép mã HTML trong markdown</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer group">
            <input type="checkbox" defaultChecked className="w-5 h-5 rounded accent-blue-600" />
            <span className="text-slate-700 group-hover:text-slate-900 transition">Tô sáng cú pháp mã nguồn</span>
          </label>
        </div>
      </div>

      {/* Performance Settings */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 hover:shadow-md hover:border-slate-300 transition-all duration-300">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-emerald-100 rounded-lg">
            <Zap className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Hiệu Suất</h2>
            <p className="text-sm text-slate-500 mt-1">Tối ưu hóa hiệu suất hệ thống</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Lưu Trữ Cache (Giây)</label>
            <input
              type="number"
              defaultValue="3600"
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Kích Thước Tối Đa File Upload (MB)</label>
            <input
              type="number"
              defaultValue="50"
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer group">
            <input type="checkbox" defaultChecked className="w-5 h-5 rounded accent-blue-600" />
            <span className="text-slate-700 group-hover:text-slate-900 transition">Nén hình ảnh tự động</span>
          </label>
        </div>
      </div>

      {/* Info Box */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-amber-800 font-medium">Lưu Ý</p>
          <p className="text-sm text-amber-700 mt-1">
            Các thay đổi cài đặt sẽ ảnh hưởng đến toàn bộ hệ thống. Hãy cẩn thận khi thay đổi.
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
        >
          <Save className="w-4 h-4" />
          <span>Lưu Cài Đặt</span>
        </button>
        <button className="px-6 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg transition font-medium">
          Hủy
        </button>
      </div>
    </div>
  );
}
