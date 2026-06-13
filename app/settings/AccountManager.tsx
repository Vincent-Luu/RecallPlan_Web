"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { UserPlus, Users, ArrowLeft, Trash2, KeyRound, Loader2, Clock } from "lucide-react";
import ConfirmModal from "@/app/components/ConfirmModal";

type UserType = {
  id: number;
  username: string;
  role: string;
  status: string;
  createdAt: Date;
};

type ModalState = {
  isOpen: boolean;
  mode: "alert" | "confirm";
  message: string;
  title?: string;
  variant?: "default" | "danger";
  confirmText?: string;
  onConfirm?: () => void;
};

export default function AccountManager({
  initialUsers,
  onBack,
}: {
  initialUsers: UserType[];
  onBack: () => void;
}) {
  const [users, setUsers] = useState<UserType[]>(initialUsers);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    mode: "alert",
    message: "",
  });

  // 每次进入帐号管理时从 API 重新拉取最新用户列表
  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setUsers(data);
      })
      .catch(() => {});
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (/[^\x20-\x7E]/.test(newPassword)) {
      setError("密码只能包含英文字母、数字和特殊符号，不可使用中文");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: newUsername, password: newPassword }),
      });

      if (res.ok) {
        setSuccess("用户创建成功！");
        setNewUsername("");
        setNewPassword("");
        const updatedUsers = await fetch("/api/users").then((r) => r.json());
        setUsers(updatedUsers);
      } else {
        const data = await res.json();
        setError(data.error || "创建失败");
      }
    } catch (err) {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const executeDelete = async (id: number) => {
    setModal({ isOpen: false, mode: "alert", message: "" });
    setDeletingId(id);
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (res.ok) {
        setUsers(users.filter((u) => u.id !== id));
      } else {
        setModal({
          isOpen: true,
          mode: "alert",
          message: "删除失败，请稍后重试",
          variant: "danger",
        });
      }
    } catch (err) {
      setModal({
        isOpen: true,
        mode: "alert",
        message: "网络错误，请稍后重试",
        variant: "danger",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteUser = async (id: number, username: string) => {
    setModal({
      isOpen: true,
      mode: "confirm",
      title: "确认删除用户",
      message: `确定要彻底删除用户 "${username}" 及其所有的任务和记录吗？此操作不可逆！`,
      variant: "danger",
      confirmText: "删除",
      onConfirm: () => executeDelete(id),
    });
  };

  const approveUser = async (id: number) => {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });
      if (res.ok) {
        setUsers(users.map((u) => (u.id === id ? { ...u, status: "approved" } : u)));
      } else {
        const data = await res.json();
        setModal({
          isOpen: true,
          mode: "alert",
          message: data.error || "操作失败，请稍后重试",
          variant: "danger",
        });
      }
    } catch (err) {
      setModal({
        isOpen: true,
        mode: "alert",
        message: "网络错误，请稍后重试",
        variant: "danger",
      });
    }
  };

  const rejectUser = async (id: number) => {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      });
      if (res.ok) {
        setUsers(users.map((u) => (u.id === id ? { ...u, status: "rejected" } : u)));
      } else {
        const data = await res.json();
        setModal({
          isOpen: true,
          mode: "alert",
          message: data.error || "操作失败，请稍后重试",
          variant: "danger",
        });
      }
    } catch (err) {
      setModal({
        isOpen: true,
        mode: "alert",
        message: "网络错误，请稍后重试",
        variant: "danger",
      });
    }
  };

  // Derive user lists by status
  const approvedUsers = users.filter((u) => u.status === "approved" || !u.status);
  const pendingUsers = users.filter((u) => u.status === "pending");
  const rejectedUsers = users.filter((u) => u.status === "rejected");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-800 dark:text-slate-200 font-sans p-6 md:p-12 relative overflow-hidden transition-colors duration-500">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/40 dark:bg-blue-900/20 rounded-full blur-3xl pointer-events-none transition-colors duration-700" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-slate-200/60 dark:bg-slate-800/40 rounded-full blur-3xl pointer-events-none transition-colors duration-700" />

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-3 bg-white/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full shadow-sm hover:shadow transition-all group border border-transparent dark:border-slate-700"
            >
              <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
            </button>
            <h1 className="text-3xl font-extrabold text-slate-700 dark:text-slate-100 tracking-tight transition-colors">
              帐号管理
            </h1>
          </div>
        </div>

        <div className="flex flex-col gap-8">
          {/* Add User Card */}
          <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl rounded-[2rem] p-6 md:p-8 shadow-md border border-white dark:border-slate-800 transition-colors duration-500">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl">
                <UserPlus className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200">
                添加新用户
              </h2>
            </div>

            {error && (
              <div className="w-full p-3 mb-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium rounded-xl border border-red-100 dark:border-red-900/50">
                {error}
              </div>
            )}
            {success && (
              <div className="w-full p-3 mb-4 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm font-medium rounded-xl border border-green-100 dark:border-green-900/50">
                {success}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="flex flex-col sm:flex-row items-end gap-4">
              <div className="flex-1 w-full">
                <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">
                  用户名
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="输入用户名"
                  className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-600 font-medium transition-colors"
                  required
                />
              </div>
              <div className="flex-1 w-full">
                <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">
                  初始密码
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="输入密码"
                  className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-600 font-medium transition-colors"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading || !newUsername || !newPassword}
                className="w-full sm:w-auto shrink-0 py-3.5 px-6 bg-slate-700 dark:bg-slate-200 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 font-bold rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "正在创建..." : "确认添加"}
              </button>
            </form>
          </div>

          {/* Pending Approvals Card */}
          {pendingUsers.length > 0 && (
          <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl rounded-[2rem] p-6 md:p-8 shadow-md border border-white dark:border-slate-800 transition-colors duration-500">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-2xl">
                <Clock className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200">
                注册审核
              </h2>
              <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 rounded-lg text-xs font-bold">
                {pendingUsers.length}
              </span>
            </div>

            <div className="space-y-3">
              {pendingUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 rounded-2xl"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold text-lg uppercase">
                      {user.username.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-700 dark:text-slate-200">
                        {user.username}
                      </h4>
                      <p className="text-sm text-slate-400 dark:text-slate-500">
                        注册于{" "}
                        {format(new Date(user.createdAt), "yyyy-MM-dd HH:mm")}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => approveUser(user.id)}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold shadow-md transition-all text-sm hover:scale-105 active:scale-95"
                    >
                      批准
                    </button>
                    <button
                      onClick={() => rejectUser(user.id)}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold shadow-md transition-all text-sm hover:scale-105 active:scale-95"
                    >
                      拒绝
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {rejectedUsers.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-3">
                  已被拒绝的申请
                </h3>
                <div className="space-y-2">
                  {rejectedUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between px-4 py-3 bg-white/50 dark:bg-slate-800/50 rounded-xl border border-red-100 dark:border-red-900/30"
                    >
                      <div>
                        <span className="text-slate-600 dark:text-slate-300 font-medium">
                          {user.username}
                        </span>
                        <span className="text-xs text-slate-400 ml-3">
                          {format(new Date(user.createdAt), "yyyy-MM-dd")}
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          handleDeleteUser(user.id, user.username)
                        }
                        className="text-red-400 hover:text-red-500 text-xs font-semibold px-2 py-1 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all"
                      >
                        删除
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          )}

          {/* User List Card */}
          <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl rounded-[2rem] p-6 md:p-8 shadow-md border border-white dark:border-slate-800 transition-colors duration-500">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                  <Users className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200">
                  用户列表
                </h2>
              </div>
              <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 rounded-lg text-sm font-bold border border-transparent dark:border-slate-700">
                共 {approvedUsers.length} 名用户
              </span>
            </div>

            <div className="space-y-4">
              {approvedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col sm:flex-row items-center justify-between p-5 bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4 mb-4 sm:mb-0">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 font-bold text-xl uppercase">
                      {user.username.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-700 dark:text-slate-200">
                        {user.username}
                      </h4>
                      <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">
                        加入于{" "}
                        {format(new Date(user.createdAt), "yyyy-MM-dd HH:mm")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Link
                      href={`/settings/user/${user.id}/tasks`}
                      className="flex-1 sm:flex-none text-center px-4 py-2 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-950 font-semibold rounded-xl transition-colors border border-slate-200 dark:border-slate-800"
                    >
                      查看其任务
                    </Link>
                    <button
                      onClick={() => handleDeleteUser(user.id, user.username)}
                      disabled={deletingId === user.id}
                      className="p-2 text-red-400 dark:text-red-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all border border-transparent hover:border-red-100 dark:hover:border-red-900/50 disabled:opacity-50"
                      title="删除用户"
                    >
                      {deletingId === user.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Trash2 className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              ))}

              {approvedUsers.length === 0 && (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  <KeyRound className="w-10 h-10 mb-3 text-slate-300 dark:text-slate-700" />
                  <p>暂无其他用户</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={modal.isOpen}
        onClose={() => setModal({ isOpen: false, mode: "alert", message: "" })}
        title={modal.title}
        message={modal.message}
        mode={modal.mode}
        variant={modal.variant || "default"}
        confirmText={modal.mode === "confirm" ? "删除" : undefined}
        onConfirm={modal.onConfirm}
        loading={deletingId !== null}
      />
    </div>
  );
}
