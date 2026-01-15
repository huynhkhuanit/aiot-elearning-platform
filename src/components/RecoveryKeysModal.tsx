"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Key, Download, Copy, CheckCircle2, AlertTriangle, X } from "lucide-react";
import Modal from "./Modal";
import { useToast } from "@/contexts/ToastContext";

interface RecoveryKeysModalProps {
  isOpen: boolean;
  onClose: () => void;
  recoveryKeys: string[];
}

export default function RecoveryKeysModal({ isOpen, onClose, recoveryKeys }: RecoveryKeysModalProps) {
  const toast = useToast();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [hasDownloaded, setHasDownloaded] = useState(false);

  const handleDownload = async () => {
    try {
      // Create download link
      const content = `CodeSense AIoT Recovery Keys
=====================

Lưu ý: Hãy lưu trữ file này ở nơi an toàn. Mỗi recovery key chỉ có thể sử dụng một lần để khôi phục mật khẩu.

Nếu bạn mất tất cả các recovery keys này, bạn sẽ không thể khôi phục tài khoản nếu quên mật khẩu.

Danh sách Recovery Keys:
${recoveryKeys.map((key, index) => `${index + 1}. ${key}`).join('\n')}

Ngày tạo: ${new Date().toLocaleString('vi-VN')}

Cách sử dụng:
1. Nếu bạn quên mật khẩu và không thể truy cập email
2. Sử dụng một trong các recovery keys trên trong form "Quên mật khẩu"
3. Mỗi key chỉ có thể sử dụng một lần
4. Sau khi sử dụng hết, bạn cần tạo recovery keys mới sau khi đăng nhập

Bảo mật:
- Không chia sẻ recovery keys với bất kỳ ai
- Lưu trữ file này ở nơi an toàn, không lưu trên cloud công cộng
- Xóa file này sau khi đã sao lưu an toàn
`;

      const blob = new Blob([content], { type: 'text/plain; charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `codesense-aiot-recovery-keys-${Date.now()}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setHasDownloaded(true);
      toast.success('Đã tải xuống recovery keys thành công');
    } catch (error) {
      toast.error('Đã có lỗi xảy ra khi tải xuống');
    }
  };

  const handleCopy = (key: string, index: number) => {
    navigator.clipboard.writeText(key);
    setCopiedIndex(index);
    toast.success('Đã sao chép recovery key');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyAll = () => {
    const allKeys = recoveryKeys.join('\n');
    navigator.clipboard.writeText(allKeys);
    toast.success('Đã sao chép tất cả recovery keys');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      showCloseButton={true}
      closeOnBackdropClick={false}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.4 }}
            className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30"
          >
            <Key className="w-8 h-8 text-white" />
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Recovery Keys của bạn
          </h2>
          <p className="text-gray-600 text-sm">
            Hãy lưu trữ các recovery keys này ở nơi an toàn
          </p>
        </div>

        {/* Warning */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-yellow-800 font-semibold mb-1">
                Lưu ý quan trọng:
              </p>
              <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                <li>Mỗi recovery key chỉ có thể sử dụng một lần</li>
                <li>Nếu bạn mất tất cả các keys này, bạn sẽ không thể khôi phục tài khoản nếu quên mật khẩu</li>
                <li>Hãy tải xuống và lưu trữ ở nơi an toàn</li>
                <li>Không chia sẻ recovery keys với bất kỳ ai</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Recovery Keys List */}
        <div className="bg-gray-50 rounded-xl p-4 max-h-96 overflow-y-auto">
          <div className="space-y-2">
            {recoveryKeys.map((key, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200 hover:border-indigo-300 transition-all"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <span className="text-sm font-semibold text-gray-500 w-6 flex-shrink-0">
                    {index + 1}.
                  </span>
                  <code className="text-sm font-mono text-gray-900 flex-1 break-all">
                    {key}
                  </code>
                </div>
                <button
                  onClick={() => handleCopy(key, index)}
                  className="ml-3 p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all flex-shrink-0"
                  title="Sao chép"
                >
                  {copiedIndex === index ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col space-y-3">
          <button
            onClick={handleDownload}
            className="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center justify-center space-x-2"
          >
            <Download className="w-5 h-5" />
            <span>Tải xuống file .txt</span>
          </button>

          <button
            onClick={handleCopyAll}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-semibold text-gray-700 flex items-center justify-center space-x-2"
          >
            <Copy className="w-4 h-4" />
            <span>Sao chép tất cả</span>
          </button>

          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all"
          >
            {hasDownloaded ? 'Đã lưu, đóng cửa sổ' : 'Tôi đã lưu, đóng cửa sổ'}
          </button>
        </div>

        {/* Info */}
        <p className="text-xs text-gray-500 text-center">
          Bạn có thể tạo recovery keys mới sau khi đăng nhập vào tài khoản
        </p>
      </div>
    </Modal>
  );
}

