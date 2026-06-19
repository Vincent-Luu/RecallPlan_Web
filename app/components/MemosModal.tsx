"use client";

import { useState, useEffect, useRef } from "react";
import { StickyNote, Plus, Pencil, Trash2, X as CloseIcon, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import ConfirmModal from "./ConfirmModal";

type Memo = {
  id: number;
  userId: number | null;
  title: string;
  content: string;
  createdAt: string | number;
  updatedAt: string | number;
};

interface MemosModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserId?: number;
}

export default function MemosModal({ isOpen, onClose, targetUserId }: MemosModalProps) {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const newTitleRef = useRef<HTMLInputElement>(null);
  const editTitleRef = useRef<HTMLInputElement>(null);

  const queryAppend = targetUserId ? `?userId=${targetUserId}` : "";

  const fetchMemos = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/memos${queryAppend}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setMemos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("加载备忘录失败", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMemos();
      setIsCreating(false);
      setEditingId(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isCreating && newTitleRef.current) {
      newTitleRef.current.focus();
    }
  }, [isCreating]);

  useEffect(() => {
    if (editingId !== null && editTitleRef.current) {
      editTitleRef.current.focus();
    }
  }, [editingId]);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/memos${queryAppend}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim(), content: newContent }),
      });
      if (!res.ok) throw new Error("Failed to create");
      const created = await res.json();
      setMemos((prev) => [created, ...prev]);
      setNewTitle("");
      setNewContent("");
      setIsCreating(false);
    } catch (err) {
      console.error("创建备忘录失败", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (id: number) => {
    if (!editTitle.trim()) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/memos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle.trim(), content: editContent }),
      });
      if (!res.ok) throw new Error("Failed to update");
      const updated = await res.json();
      setMemos((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...updated } : m))
      );
      setEditingId(null);
    } catch (err) {
      console.error("更新备忘录失败", err);
    } finally {
      setIsSaving(false);
    }
  };

  const executeDelete = async (id: number) => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/memos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setMemos((prev) => prev.filter((m) => m.id !== id));
      setDeleteConfirmId(null);
      if (editingId === id) {
        setEditingId(null);
      }
    } catch (err) {
      console.error("删除备忘录失败", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const startEdit = (memo: Memo) => {
    setEditingId(memo.id);
    setEditTitle(memo.title);
    setEditContent(memo.content);
    setIsCreating(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditContent("");
  };

  const cancelCreate = () => {
    setIsCreating(false);
    setNewTitle("");
    setNewContent("");
  };

  const formatTime = (val: string | number) => {
    try {
      const date = typeof val === "number" ? new Date(val * 1000) : new Date(val);
      return formatDistanceToNow(date, { addSuffix: true, locale: zhCN });
    } catch {
      return "";
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="relative w-full max-w-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-[2rem] p-5 md:p-6 shadow-huge border border-white/50 dark:border-slate-700/80 max-h-[85vh] flex flex-col overflow-hidden transition-colors duration-500">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all z-10"
          >
            <CloseIcon className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center justify-between mb-4 mt-1 pr-10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-500/20 border border-amber-100 dark:border-amber-500/30 flex items-center justify-center shadow-sm">
                <StickyNote className="w-4.5 h-4.5 text-amber-500 dark:text-amber-400" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100">
                备忘录
              </h2>
            </div>
            {!isCreating && (
              <button
                onClick={() => {
                  setIsCreating(true);
                  setEditingId(null);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-accent hover:bg-accent/85 text-accent-foreground rounded-full font-semibold shadow-md transition-all hover:scale-105 active:scale-95 text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>新建</span>
              </button>
            )}
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 -mr-1 space-y-3 min-h-0">
            {/* Create panel */}
            {isCreating && (
              <div className="bg-white dark:bg-slate-900/50 rounded-2xl p-4 border border-amber-100 dark:border-amber-500/20 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                <input
                  ref={newTitleRef}
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="备忘录标题…"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-600 focus:border-transparent transition-all font-semibold text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newTitle.trim()) {
                      e.preventDefault();
                      handleCreate();
                    }
                  }}
                />
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="内容（可选）…"
                  rows={4}
                  className="w-full px-4 py-2.5 mt-2 rounded-xl bg-white/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-600 focus:border-transparent transition-all text-sm resize-none"
                />
                <div className="flex justify-end gap-2.5 mt-3">
                  <button
                    onClick={cancelCreate}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold rounded-xl transition-all text-sm"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={!newTitle.trim() || isSaving}
                    className="px-5 py-2 bg-accent hover:bg-accent/85 text-accent-foreground font-bold rounded-xl shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 text-sm"
                  >
                    {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    保存
                  </button>
                </div>
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="w-7 h-7 text-slate-400 dark:text-slate-500 animate-spin" />
                <p className="text-sm text-slate-400 dark:text-slate-500">加载中…</p>
              </div>
            )}

            {/* Empty state */}
            {!loading && memos.length === 0 && !isCreating && (
              <div className="h-40 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl border-slate-200 bg-white/50 dark:border-slate-700 dark:bg-slate-900/30">
                <StickyNote className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-sm text-slate-400 dark:text-slate-500">还没有备忘录</p>
                <p className="text-xs text-slate-400/70 dark:text-slate-500/70 mt-0.5">点击右上角"新建"按钮创建</p>
              </div>
            )}

            {/* Memo list */}
            {!loading &&
              memos.map((memo) => (
                <div key={memo.id}>
                  {editingId === memo.id ? (
                    /* Edit mode */
                    <div className="bg-white dark:bg-slate-900/50 rounded-2xl p-4 border border-amber-100 dark:border-amber-500/20 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                      <input
                        ref={editTitleRef}
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-600 focus:border-transparent transition-all font-semibold text-sm"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && editTitle.trim()) {
                            e.preventDefault();
                            handleUpdate(memo.id);
                          }
                        }}
                      />
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-2.5 mt-2 rounded-xl bg-white/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-600 focus:border-transparent transition-all text-sm resize-none"
                      />
                      <div className="flex justify-end gap-2.5 mt-3">
                        <button
                          onClick={cancelEdit}
                          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold rounded-xl transition-all text-sm"
                        >
                          取消
                        </button>
                        <button
                          onClick={() => handleUpdate(memo.id)}
                          disabled={!editTitle.trim() || isSaving}
                          className="px-5 py-2 bg-accent hover:bg-accent/85 text-accent-foreground font-bold rounded-xl shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 text-sm"
                        >
                          {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          保存
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Display mode */
                    <div className="group relative bg-white dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/80 shadow-sm hover:shadow-md transition-all duration-300">
                      <h3 className="font-bold text-slate-800 dark:text-slate-200 pr-16">
                        {memo.title}
                      </h3>
                      {memo.content && (
                        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 line-clamp-2 whitespace-pre-wrap">
                          {memo.content}
                        </p>
                      )}
                      <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                        {formatTime(memo.updatedAt)}
                      </p>

                      {/* Actions */}
                      <div className="absolute top-3 right-3 flex items-center gap-1 transition-opacity duration-200">
                        <button
                          onClick={() => startEdit(memo)}
                          className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                          title="编辑"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(memo.id)}
                          className="p-1.5 text-red-300 dark:text-red-900/50 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all"
                          title="删除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>

          {/* Footer stats */}
          {!loading && memos.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
                共 {memos.length} 条备忘录
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation */}
      <ConfirmModal
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        title="删除备忘录"
        message="确定要删除这条备忘录吗？删除后无法恢复。"
        mode="confirm"
        variant="danger"
        onConfirm={() => {
          if (deleteConfirmId !== null) executeDelete(deleteConfirmId);
        }}
        loading={isDeleting}
      />
    </>
  );
}
