"use client";

import { useEffect, useRef } from "react";
import { X, AlertTriangle } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title?: string;
  message: string;
  mode?: "alert" | "confirm";
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  variant?: "default" | "danger";
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  mode = "confirm",
  confirmText = "确认",
  cancelText = "取消",
  loading = false,
  variant = "default",
}: ConfirmModalProps) {
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  // 按 Escape 关闭
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // 打开时聚焦确认按钮
  useEffect(() => {
    if (isOpen && mode === "confirm") {
      setTimeout(() => confirmBtnRef.current?.focus(), 100);
    }
  }, [isOpen, mode]);

  // 阻止背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const confirmBtnClass =
    variant === "danger"
      ? "px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-md transition-all disabled:opacity-60"
      : "px-5 py-2.5 bg-slate-700 dark:bg-slate-200 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 font-bold rounded-xl shadow-md transition-all disabled:opacity-60";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 半透明遮罩 */}
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm transition-all duration-300"
        onClick={onClose}
      />

      {/* 弹窗主体 */}
      <div
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-white/50 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 fade-in duration-200"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <div className="flex items-center gap-3">
            {variant === "danger" && (
              <div className="p-2 bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 rounded-xl">
                <AlertTriangle className="w-5 h-5" />
              </div>
            )}
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">
              {title || (mode === "confirm" ? "确认操作" : "提示")}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容 */}
        <div className="px-6 py-4">
          <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
            {message}
          </p>
        </div>

        {/* 底部按钮 */}
        <div className="px-6 pb-6 pt-2 flex justify-end gap-3">
          {mode === "confirm" && (
            <button
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl transition-all border border-transparent dark:border-slate-700 disabled:opacity-60"
            >
              {cancelText}
            </button>
          )}
          {mode === "confirm" ? (
            <button
              ref={confirmBtnRef}
              onClick={onConfirm}
              disabled={loading}
              className={confirmBtnClass}
            >
              {loading ? "处理中..." : confirmText}
            </button>
          ) : (
            <button
              onClick={onClose}
              className={confirmBtnClass}
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
