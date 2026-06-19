"use client";

import { useState, useEffect, use, useMemo } from "react";
import { format } from "date-fns";
import { Trash2, Edit2, Check, X } from "lucide-react";
import ConfirmModal from "@/app/components/ConfirmModal";
import PageHeader from "@/app/components/PageHeader";
import { SUBJECT_TAGS, getTagStyle } from "@/app/lib/subjectTags";
import TaskFilterBar from "./TaskFilterBar";

type Task = {
  id: number;
  title: string;
  tag: string | null;
  createdAt: string;
  totalLogs: number;
  completedLogs: number;
};

export default function TaskListPage({ searchParams }: { searchParams: Promise<{ userId?: string }> }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editTag, setEditTag] = useState<string>("其他");
  const [filterStatus, setFilterStatus] = useState<"all" | "completed" | "uncompleted">("all");
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"newest" | "oldest">("newest");
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  // Unwrap promise safely
  const resolvedParams = use(searchParams);
  const targetUserId = resolvedParams.userId;

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const url = targetUserId ? `/api/tasks/all?userId=${targetUserId}` : "/api/tasks/all";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (error) {
      console.error("加载任务列表失败", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [targetUserId]);

  const handleEditClick = (task: Task) => {
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditTag(task.tag || "其他");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditTag("其他");
  };

  const handleSaveEdit = async (id: number) => {
    if (!editTitle.trim()) return;
    try {
      const res = await fetch(`/api/tasks/manage/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle, tag: editTag }),
      });
      if (res.ok) {
        setTasks(tasks.map(t => t.id === id ? { ...t, title: editTitle, tag: editTag } : t));
        setEditingId(null);
      }
    } catch (error) {
      console.error("更新任务失败", error);
    }
  };

  const executeDelete = async (id: number) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/tasks/manage/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setTasks(tasks.filter(t => t.id !== id));
      }
    } catch (error) {
      console.error("删除任务失败", error);
    } finally {
      setDeleting(false);
      setDeleteConfirmId(null);
    }
  };

  const handleDelete = (id: number) => {
    setDeleteConfirmId(id);
  };

  const filteredAndSortedTasks = useMemo(() => {
    let result = tasks;

    // 1. Status filter
    if (filterStatus === "completed") {
      result = result.filter(t => t.completedLogs === t.totalLogs);
    } else if (filterStatus === "uncompleted") {
      result = result.filter(t => t.completedLogs < t.totalLogs);
    }

    // 2. Subject filter
    if (selectedSubject !== null) {
      result = result.filter(t => t.tag === selectedSubject);
    }

    // 3. Sort by createdAt
    result = [...result].sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return sortDirection === "newest" ? bTime - aTime : aTime - bTime;
    });

    return result;
  }, [tasks, filterStatus, selectedSubject, sortDirection]);

  const filterCounts = useMemo(() => {
    const completed = tasks.filter(t => t.completedLogs === t.totalLogs).length;
    const uncompleted = tasks.filter(t => t.completedLogs < t.totalLogs).length;
    return { all: tasks.length, completed, uncompleted };
  }, [tasks]);

  return (
    <div className="min-h-screen page-canvas text-slate-800 dark:text-slate-200 font-sans selection:bg-slate-300/50 dark:selection:bg-slate-700/50 transition-colors duration-500">
      
      <PageHeader
        backHref={targetUserId ? `/settings/user/${targetUserId}/tasks` : "/"}
        title="所有任务列表"
        badge={targetUserId ? <span className="ml-4 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full align-middle font-semibold border border-blue-200/50 dark:border-blue-800/50">正在管理用户任务</span> : undefined}
      />

      {/* Main Layout */}
      <main className="pt-24 md:pt-32 pb-12 px-4 md:px-12 max-w-4xl mx-auto">
        
        <div className="bg-white/80 dark:bg-slate-800/80 rounded-[2rem] p-8 shadow-sm border border-white/80 dark:border-slate-700 min-h-[500px] transition-colors duration-500">

          {/* Filter Bar */}
          {!loading && tasks.length > 0 && (
            <TaskFilterBar
              filterStatus={filterStatus}
              onFilterStatusChange={setFilterStatus}
              selectedSubject={selectedSubject}
              onSubjectChange={setSelectedSubject}
              sortDirection={sortDirection}
              onSortDirectionChange={setSortDirection}
              filterCounts={filterCounts}
            />
          )}

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col p-5 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/80 shadow-sm gap-4 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-12 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                    <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                  </div>
                  <div className="h-3 w-32 bg-slate-100 dark:bg-slate-800 rounded" />
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full w-1/3 bg-slate-300 dark:bg-slate-600 rounded-full" />
                    </div>
                    <div className="h-3 w-16 bg-slate-100 dark:bg-slate-800 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredAndSortedTasks.length === 0 ? (
            <div className="flex justify-center items-center h-40 flex-col gap-2">
              <span className="text-slate-400 dark:text-slate-500">
                {tasks.length === 0
                  ? "目前没有任何任务"
                  : selectedSubject
                    ? `没有找到 "${selectedSubject}" 学科的任务`
                    : filterStatus === "completed"
                      ? "没有已完成的任务"
                      : "所有任务均已完成 🎉"}
              </span>
              {selectedSubject && (
                <button
                  onClick={() => setSelectedSubject(null)}
                  className="text-xs text-blue-500 dark:text-blue-400 hover:underline font-medium"
                >
                  清除学科筛选
                </button>
              )}
            </div>
          ) : (
            <ul className="space-y-4">
              {filteredAndSortedTasks.map(task => {
                const percentage = task.totalLogs > 0 ? Math.round((task.completedLogs / task.totalLogs) * 100) : 0;
                
                return (
                  <li 
                    key={task.id} 
                    className="group flex flex-col p-5 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/80 shadow-sm hover:shadow-md transition-all gap-4"
                  >
                    
                    {editingId === task.id ? (
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                          <input 
                            type="text" 
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-600 transition-colors font-bold text-lg"
                            autoFocus
                          />
                          <button 
                            onClick={() => handleSaveEdit(task.id)}
                            className="p-2 text-green-600 dark:text-green-500 hover:bg-green-50 dark:hover:bg-green-500/10 rounded-lg transition-colors"
                          >
                            <Check className="w-6 h-6" />
                          </button>
                          <button 
                            onClick={handleCancelEdit}
                            className="p-2 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <X className="w-6 h-6" />
                          </button>
                        </div>

                        <div>
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">更改标签</p>
                          <div className="flex flex-wrap gap-2">
                            {SUBJECT_TAGS.map((tag) => (
                              <button
                                key={tag.name}
                                type="button"
                                onClick={() => setEditTag(tag.name)}
                                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all border ${
                                  editTag === tag.name
                                    ? `${tag.bg} ${tag.text} ${tag.border} dark:opacity-90 ring-2 ring-slate-200 dark:ring-slate-700`
                                    : "bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600"
                                }`}
                              >
                                {tag.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1 flex items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              {task.tag && (
                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border uppercase tracking-wider ${getTagStyle(task.tag).bg} ${getTagStyle(task.tag).text} ${getTagStyle(task.tag).border} dark:opacity-90 shadow-sm`}>
                                  {task.tag}
                                </span>
                              )}
                              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">{task.title}</h3>
                            </div>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
                              创建于: {format(new Date(task.createdAt), "yyyy/MM/dd HH:mm")}
                            </p>
                            
                            {/* Progress Info */}
                            <div className="flex items-center gap-4 max-w-xs">
                              <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-700 ease-out ${percentage === 100 ? 'bg-green-400 dark:bg-green-500' : 'bg-slate-400 dark:bg-slate-500'}`}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                {task.completedLogs}/{task.totalLogs} ({percentage}%)
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 transition-opacity">
                          <button 
                            onClick={() => handleEditClick(task)}
                            className="p-2.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                            title="编辑任务"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleDelete(task.id)}
                            className="p-2.5 text-red-300 dark:text-red-900/50 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all"
                            title="删除任务"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    )}

                  </li>
                );
              })}
            </ul>
          )}
        </div>

      </main>

      <ConfirmModal
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        title="确认删除任务"
        message="确定要删除这个任务及其所有的复习安排吗？这是不可逆的操作！"
        mode="confirm"
        variant="danger"
        confirmText="删除"
        loading={deleting}
        onConfirm={() => deleteConfirmId !== null && executeDelete(deleteConfirmId)}
      />
    </div>
  );
}

