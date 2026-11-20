import React, { useState, useEffect } from 'react';
import { KanbanSquare, BarChart3, Users, History, Plus, Search, Server, MessageSquare, Trash2, X, ArrowRight, CheckCircle2, Layers, RotateCcw, UserPlus, ShieldCheck, Activity } from 'lucide-react';
import {
  fetchWorkspacesHybrid,
  subscribeRealtimeWorkspaces,
  resetWorkspacesHybrid,
  addMemberHybrid,
  createTaskHybrid,
  updateTaskHybrid,
  deleteTaskHybrid,
  addCommentHybrid,
  updateMemberRoleHybrid,
} from './services/pmClient';

const COLUMNS = ['Todo', 'In Progress', 'In Review', 'Done'];
const PRIORITIES = ['High', 'Medium', 'Low'];
const ROLES = ['Admin', 'Maintainer', 'Developer', 'Viewer'];

const COLUMN_ACCENT = {
  Todo: 'border-t-4 border-t-sky-400',
  'In Progress': 'border-t-4 border-t-amber-400',
  'In Review': 'border-t-4 border-t-violet-400',
  Done: 'border-t-4 border-t-teal-400',
};

const PRIORITY_PILL = {
  High: 'bg-amber-500/15 text-amber-300 border-amber-400/40',
  Medium: 'bg-sky-500/15 text-sky-300 border-sky-400/40',
  Low: 'bg-teal-500/15 text-teal-300 border-teal-400/40',
};

const ROLE_DESC = {
  Admin: 'Full workspace governance, member management & release control',
  Maintainer: 'Sprint triage, code/task review & deployment approvals',
  Developer: 'Task execution, story point updates & technical comments',
  Viewer: 'Read-only visibility into sprint progress & audit stream',
};

export default function App() {
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWsId, setActiveWsId] = useState('ws-torstaq-core');
  const [currentUser, setCurrentUser] = useState('Sasidhar');
  const [backendConnected, setBackendConnected] = useState(false);
  const [activeTab, setActiveTab] = useState('board');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newStatus, setNewStatus] = useState('Todo');
  const [newPriority, setNewPriority] = useState('High');
  const [newPoints, setNewPoints] = useState(5);
  const [newAssignee, setNewAssignee] = useState('Vijaysimha');
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('Developer');

  const syncWorkspace = (u) => setWorkspaces((prev) => prev.map((w) => (w.id === u.id ? u : w)));

  useEffect(() => {
    (async () => {
      const r = await fetchWorkspacesHybrid();
      setWorkspaces(r.workspaces);
      setBackendConnected(r.backendConnected);
      if (r.workspaces[0]) setActiveWsId(r.workspaces[0].id);
    })();
    const unsub = subscribeRealtimeWorkspaces((liveWorkspaces, connected) => {
      setWorkspaces(liveWorkspaces);
      setBackendConnected(connected);
    });
    return () => unsub();
  }, []);

  const activeWs = workspaces.find((w) => w.id === activeWsId) || workspaces[0];
  const selectedTask = activeWs?.tasks.find((t) => t.id === selectedTaskId) || null;

  const handleReset = async () => {
    const r = await resetWorkspacesHybrid();
    setWorkspaces(r.workspaces);
    setBackendConnected(r.backendConnected);
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMemberName.trim() || !activeWs) return;
    const r = await addMemberHybrid(activeWs.id, newMemberName, newMemberRole, 20);
    syncWorkspace(r.workspace);
    setBackendConnected(r.backendConnected);
    setNewMemberName('');
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !activeWs) return;
    const r = await createTaskHybrid(activeWs.id, { title: newTitle, description: newDesc, status: newStatus, priority: newPriority, points: newPoints, assignee: newAssignee });
    syncWorkspace(r.workspace); setBackendConnected(r.backendConnected); setNewTitle(''); setNewDesc(''); setShowNewModal(false);
  };

  const handleStatusChange = async (taskId, nextStatus) => {
    if (!activeWs) return;
    const r = await updateTaskHybrid(activeWs.id, taskId, { status: nextStatus });
    syncWorkspace(r.workspace); setBackendConnected(r.backendConnected);
  };

  const handleDeleteTask = async (taskId) => {
    if (!activeWs) return;
    const r = await deleteTaskHybrid(activeWs.id, taskId);
    syncWorkspace(r.workspace); setBackendConnected(r.backendConnected); if (selectedTaskId === taskId) setSelectedTaskId(null);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !activeWs || !selectedTask) return;
    const r = await addCommentHybrid(activeWs.id, selectedTask.id, currentUser, commentText);
    syncWorkspace(r.workspace); setBackendConnected(r.backendConnected); setCommentText('');
  };

  const handleRoleChange = async (memberId, role) => {
    if (!activeWs) return;
    const r = await updateMemberRoleHybrid(activeWs.id, memberId, role);
    syncWorkspace(r.workspace); setBackendConnected(r.backendConnected);
  };

  const filteredTasks = (activeWs?.tasks || []).filter((t) => {
    const q = !searchQuery.trim() || t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.assignee.toLowerCase().includes(searchQuery.toLowerCase());
    const p = priorityFilter === 'All' || t.priority === priorityFilter;
    return q && p;
  });

  const totalTasks = activeWs?.tasks.length || 0;
  const doneTasks = (activeWs?.tasks || []).filter((t) => t.status === 'Done').length;
  const totalPoints = (activeWs?.tasks || []).reduce((a, t) => a + (t.points || 0), 0);
  const completedPoints = (activeWs?.tasks || []).filter((t) => t.status === 'Done').reduce((a, t) => a + (t.points || 0), 0);
  const completionPct = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#060A13] text-cyan-50 text-[15px]">
      <header className="border-b border-cyan-900/60 bg-gradient-to-r from-[#0A1120] via-[#0D1629] to-[#0A1120] sticky top-0 z-20 shadow-lg shadow-black/30">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-10 py-4.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-400/20 to-teal-500/10 border border-cyan-400/35 text-cyan-300 shadow-inner">
              <Layers className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">SprintGrid Cloud PM</h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-400/30">
                  <Activity className="w-3.5 h-3.5" /> SSE Real-Time
                </span>
              </div>
              <p className="text-sm text-cyan-200/75 mt-0.5">Multi-workspace sprint execution, story point velocity & role access control</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {workspaces.length > 0 && (
              <select value={activeWsId} onChange={(e) => setActiveWsId(e.target.value)} className="px-4 py-2.5 rounded-xl bg-[#070C17] border border-cyan-800/80 text-sm font-semibold text-cyan-100 focus:outline-none focus:border-cyan-400">
                {workspaces.map((ws) => <option key={ws.id} value={ws.id}>{ws.name}</option>)}
              </select>
            )}
            <select value={currentUser} onChange={(e) => setCurrentUser(e.target.value)} className="px-4 py-2.5 rounded-xl bg-[#070C17] border border-cyan-800/80 text-sm font-semibold text-amber-300 focus:outline-none focus:border-amber-400">
              {(activeWs?.members || [{ name: 'Sasidhar' }, { name: 'Vijaysimha' }]).map((m) => (
                <option key={m.name} value={m.name}>Acting as: {m.name}</option>
              ))}
            </select>
            <button onClick={handleReset} className="px-3.5 py-2.5 rounded-xl bg-[#070C17] hover:bg-cyan-950/80 border border-cyan-800/80 text-sm font-medium text-cyan-200 inline-flex items-center gap-2 transition">
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
            <span className={`text-sm px-3.5 py-2.5 rounded-xl border inline-flex items-center gap-2 font-semibold ${backendConnected ? 'bg-teal-950/70 border-teal-500/50 text-teal-300' : 'bg-[#070C17] border-cyan-900 text-cyan-400/75'}`}>
              <Server className="w-4 h-4" />{backendConnected ? 'API Live' : 'Local'}
            </span>
            <button onClick={() => setShowNewModal(true)} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-300 hover:from-cyan-300 hover:to-teal-200 text-sm font-bold text-slate-950 inline-flex items-center gap-2 shadow-md shadow-cyan-500/20 transition">
              <Plus className="w-4 h-4 stroke-[2.5]" /> Add Task
            </button>
          </div>
        </div>
      </header>

      {activeWs && (
        <main className="max-w-[1440px] mx-auto px-6 sm:px-10 py-8 space-y-7">
          {/* Telemetry Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            <div className="bg-gradient-to-b from-[#0D1629] to-[#09101E] border border-cyan-900/70 rounded-2xl p-5 space-y-1.5">
              <div className="text-xs uppercase tracking-widest text-cyan-400 font-bold">Active Workspace</div>
              <div className="text-lg font-bold text-white truncate">{activeWs.name}</div>
              <div className="text-sm font-medium text-amber-300 truncate">{activeWs.sprintName}</div>
            </div>

            <div className="bg-gradient-to-b from-[#0D1629] to-[#09101E] border border-cyan-900/70 rounded-2xl p-5 space-y-1.5">
              <div className="text-xs uppercase tracking-widest text-cyan-400 font-bold">Sprint Completion</div>
              <div className="text-3xl font-extrabold text-teal-300">{completionPct}%</div>
              <div className="text-sm text-cyan-200/75">{doneTasks} of {totalTasks} tasks completed</div>
            </div>

            <div className="bg-gradient-to-b from-[#0D1629] to-[#09101E] border border-cyan-900/70 rounded-2xl p-5 space-y-1.5">
              <div className="text-xs uppercase tracking-widest text-cyan-400 font-bold">Story Points Burned</div>
              <div className="text-3xl font-extrabold text-cyan-300">
                {completedPoints} <span className="text-base font-semibold text-cyan-400/75">/ {totalPoints} pts</span>
              </div>
              <div className="text-sm text-cyan-200/75">{activeWs.members.length} collaborators in workspace</div>
            </div>

            <div className="bg-gradient-to-b from-[#0D1629] to-[#09101E] border border-cyan-900/70 rounded-2xl p-5 flex flex-col justify-between gap-3">
              <div className="text-xs uppercase tracking-widest text-cyan-400 font-bold">Workspace Views</div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'board', label: 'Board', icon: KanbanSquare },
                  { id: 'analytics', label: 'Metrics', icon: BarChart3 },
                  { id: 'team', label: `Team (${activeWs.members.length})`, icon: Users },
                  { id: 'activity', label: `Log (${activeWs.activities.length})`, icon: History },
                ].map((t) => {
                  const Icon = t.icon;
                  const active = activeTab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id)}
                      className={`inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition ${active ? 'bg-cyan-400 text-slate-950 shadow-sm' : 'bg-[#070C17] text-cyan-100/85 hover:text-white border border-cyan-900/80'}`}
                    >
                      <Icon className="w-4 h-4" />{t.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {activeTab === 'board' && (
            <>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="w-5 h-5 text-cyan-400/75 absolute left-4 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tasks by title or teammate..."
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#0B1220] border border-cyan-900/80 text-sm sm:text-base text-white placeholder:text-cyan-200/40 focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-4 py-3 rounded-xl bg-[#0B1220] border border-cyan-900/80 text-sm sm:text-base font-medium text-cyan-100 focus:outline-none focus:border-cyan-400"
                >
                  <option value="All">All Priorities</option>
                  {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                {COLUMNS.map((col) => {
                  const colTasks = filteredTasks.filter((t) => t.status === col);
                  return (
                    <div key={col} className={`bg-[#0B1220] border border-cyan-900/70 ${COLUMN_ACCENT[col]} rounded-2xl p-4 sm:p-5 space-y-4 min-h-[420px]`}>
                      <div className="flex items-center justify-between px-1">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-200">{col}</h3>
                        <span className="text-sm px-3 py-0.5 rounded-full bg-[#070C17] border border-cyan-900 text-cyan-300 font-mono font-semibold">{colTasks.length}</span>
                      </div>
                      <div className="space-y-3.5">
                        {colTasks.map((task) => {
                          const nextCol = COLUMNS[(COLUMNS.indexOf(task.status) + 1) % COLUMNS.length];
                          return (
                            <div key={task.id} className="bg-[#070C17] border border-cyan-900/80 hover:border-cyan-400/60 rounded-xl p-4 space-y-3 transition shadow-sm">
                              <div className="flex items-center justify-between gap-2">
                                <span className={`text-xs px-2.5 py-1 rounded-md border font-semibold ${PRIORITY_PILL[task.priority] || PRIORITY_PILL.Medium}`}>{task.priority}</span>
                                <span className="text-xs sm:text-sm font-mono font-bold text-amber-300">{task.points} pts</span>
                              </div>
                              <button onClick={() => setSelectedTaskId(task.id)} className="text-left text-base font-bold text-white hover:text-cyan-300 block w-full leading-snug">{task.title}</button>
                              {task.description && <p className="text-sm text-cyan-100/70 line-clamp-2 leading-relaxed">{task.description}</p>}
                              <div className="pt-3 border-t border-cyan-950 flex items-center justify-between gap-2 text-sm">
                                <span className="text-cyan-100 font-semibold">{task.assignee}</span>
                                <div className="flex items-center gap-2.5">
                                  <button onClick={() => setSelectedTaskId(task.id)} className="text-cyan-300/80 hover:text-white inline-flex items-center gap-1"><MessageSquare className="w-4 h-4" /><span>{task.comments?.length || 0}</span></button>
                                  <button onClick={() => handleStatusChange(task.id, nextCol)} className="px-3 py-1 rounded-lg bg-cyan-950 hover:bg-cyan-400 text-xs font-semibold text-cyan-200 hover:text-slate-950 inline-flex items-center gap-1 transition"><span>{nextCol}</span><ArrowRight className="w-3.5 h-3.5" /></button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {activeTab === 'analytics' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
              <div className="bg-[#0B1220] border border-cyan-900/70 rounded-2xl p-6"><div className="text-sm font-semibold text-cyan-300/80">Completion Rate</div><div className="text-4xl font-extrabold text-teal-300 mt-2">{completionPct}%</div><div className="text-sm text-cyan-100/65 mt-1.5">{doneTasks} of {totalTasks} tasks completed</div></div>
              <div className="bg-[#0B1220] border border-cyan-900/70 rounded-2xl p-6"><div className="text-sm font-semibold text-cyan-300/80">Sprint Points Burned</div><div className="text-4xl font-extrabold text-cyan-300 mt-2">{completedPoints} / {totalPoints}</div><div className="text-sm text-cyan-100/65 mt-1.5">Story points delivered</div></div>
              <div className="bg-[#0B1220] border border-cyan-900/70 rounded-2xl p-6"><div className="text-sm font-semibold text-cyan-300/80">Team Collaborators</div><div className="text-4xl font-extrabold text-white mt-2">{activeWs.members.length}</div><div className="text-sm text-cyan-100/65 mt-1.5">Active members in workspace</div></div>
              <div className="bg-[#0B1220] border border-cyan-900/70 rounded-2xl p-6"><div className="text-sm font-semibold text-cyan-300/80">Audit Trail Events</div><div className="text-4xl font-extrabold text-amber-300 mt-2">{activeWs.activities.length}</div><div className="text-sm text-cyan-100/65 mt-1.5">Recorded workflow updates</div></div>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="bg-[#0B1220] border border-cyan-900/70 rounded-2xl p-6 sm:p-8 space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-cyan-950 pb-5">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-cyan-400" /> Team Members & Access Roles</h3>
                  <p className="text-sm text-cyan-200/70 mt-1">Manage sprint point capacity and role permissions for {activeWs.name}</p>
                </div>
                <form onSubmit={handleAddMember} className="flex flex-wrap items-center gap-3">
                  <input
                    type="text"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    placeholder="Add teammate name..."
                    className="px-4 py-2.5 rounded-xl bg-[#070C17] border border-cyan-800/80 text-sm text-white placeholder:text-cyan-200/40 focus:outline-none focus:border-cyan-400"
                  />
                  <select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value)}
                    className="px-4 py-2.5 rounded-xl bg-[#070C17] border border-cyan-800/80 text-sm font-medium text-cyan-100 focus:outline-none focus:border-cyan-400"
                  >
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <button type="submit" className="px-4 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-sm font-bold text-slate-950 inline-flex items-center gap-2 transition">
                    <UserPlus className="w-4 h-4" /> Add Member
                  </button>
                </form>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {activeWs.members.map((m) => {
                  const memberPts = activeWs.tasks.filter((t) => t.assignee === m.name).reduce((s, t) => s + (t.points || 0), 0);
                  const pct = Math.min(100, Math.round((memberPts / (m.capacityPoints || 24)) * 100));
                  const initials = m.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
                  return (
                    <div key={m.id} className="flex flex-col md:flex-row md:items-center justify-between gap-5 p-5 rounded-xl bg-[#070C17] border border-cyan-900/80">
                      <div className="flex items-start sm:items-center gap-4 flex-1">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/25 to-amber-500/20 border border-cyan-400/35 text-cyan-200 font-bold text-base flex items-center justify-center shrink-0">
                          {initials}
                        </div>
                        <div className="space-y-1.5 flex-1 max-w-xl">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <span className="text-lg font-bold text-white">{m.name}</span>
                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-800">{m.role}</span>
                          </div>
                          <p className="text-sm text-cyan-200/70">{ROLE_DESC[m.role] || 'Workspace collaborator'}</p>
                          <div className="pt-1 space-y-1">
                            <div className="flex justify-between text-xs sm:text-sm text-cyan-200/85">
                              <span>Allocated: <strong className="text-amber-300">{memberPts}</strong> / {m.capacityPoints} sprint pts</span>
                              <span className="font-mono text-cyan-300">{pct}%</span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-cyan-950 overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-cyan-400 to-teal-300 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 md:justify-end">
                        <label className="text-xs uppercase tracking-wider text-cyan-400/80 font-semibold">Role</label>
                        <select
                          value={m.role}
                          onChange={(e) => handleRoleChange(m.id, e.target.value)}
                          className="min-w-[155px] px-4 py-2.5 rounded-xl bg-[#0B1220] border border-cyan-800 text-sm font-semibold text-cyan-100 focus:outline-none focus:border-cyan-400"
                        >
                          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="bg-[#0B1220] border border-cyan-900/70 rounded-2xl p-6 sm:p-8 space-y-3.5">
              <h3 className="text-xl font-bold text-white mb-2">Workspace Activity Stream</h3>
              {activeWs.activities.map((act) => (
                <div key={act.id} className="p-4 rounded-xl bg-[#070C17] border border-cyan-900/80 text-sm sm:text-base flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-cyan-50 flex items-center gap-2.5 font-medium"><CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />{act.text}</span>
                  <span className="text-xs sm:text-sm text-cyan-300/70 shrink-0">{new Date(act.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </main>
      )}

      {showNewModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-30">
          <form onSubmit={handleCreateTask} className="bg-[#0B1220] border border-cyan-800 rounded-2xl p-6 sm:p-7 w-full max-w-lg space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Create New Task</h3>
              <button type="button" onClick={() => setShowNewModal(false)} className="text-cyan-300/75 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <input type="text" required value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Task title..." className="w-full px-4 py-3 rounded-xl bg-[#070C17] border border-cyan-800 text-sm sm:text-base text-white" />
            <textarea rows={3} value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Acceptance criteria & notes..." className="w-full px-4 py-3 rounded-xl bg-[#070C17] border border-cyan-800 text-sm sm:text-base text-white" />
            <div className="grid grid-cols-2 gap-3.5 text-sm">
              <div><label className="text-cyan-300/80 block mb-1.5 font-medium">Status</label><select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-[#070C17] border border-cyan-800 text-white">{COLUMNS.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
              <div><label className="text-cyan-300/80 block mb-1.5 font-medium">Priority</label><select value={newPriority} onChange={(e) => setNewPriority(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-[#070C17] border border-cyan-800 text-white">{PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}</select></div>
              <div><label className="text-cyan-300/80 block mb-1.5 font-medium">Assignee</label><select value={newAssignee} onChange={(e) => setNewAssignee(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-[#070C17] border border-cyan-800 text-white">{(activeWs?.members || []).map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}</select></div>
              <div><label className="text-cyan-300/80 block mb-1.5 font-medium">Story Points</label><input type="number" min={1} max={21} value={newPoints} onChange={(e) => setNewPoints(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-[#070C17] border border-cyan-800 text-white" /></div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowNewModal(false)} className="px-4 py-2.5 rounded-xl bg-[#070C17] border border-cyan-900 text-sm text-cyan-200">Cancel</button>
              <button type="submit" className="px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-sm font-bold text-slate-950">Create Task</button>
            </div>
          </form>
        </div>
      )}

      {selectedTask && (
        <div className="fixed inset-0 bg-black/80 flex justify-end z-30">
          <div className="bg-[#0B1220] border-l border-cyan-900 w-full max-w-xl p-6 sm:p-7 overflow-y-auto space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs font-mono font-bold text-amber-300 uppercase">{selectedTask.status} · {selectedTask.points} pts</span>
                <h3 className="text-xl font-bold text-white mt-1">{selectedTask.title}</h3>
              </div>
              <button onClick={() => setSelectedTaskId(null)} className="text-cyan-300/75 hover:text-white"><X className="w-6 h-6" /></button>
            </div>
            <p className="text-sm sm:text-base text-cyan-50/90 bg-[#070C17] p-4 rounded-xl border border-cyan-900 leading-relaxed">{selectedTask.description || 'No description provided.'}</p>
            <div className="flex items-center justify-between text-sm text-cyan-300/80">
              <span>Assignee: <strong className="text-white">{selectedTask.assignee}</strong></span>
              <button onClick={() => handleDeleteTask(selectedTask.id)} className="text-rose-400 hover:text-rose-300 font-medium inline-flex items-center gap-1.5"><Trash2 className="w-4 h-4" /> Delete Task</button>
            </div>
            <div className="border-t border-cyan-900 pt-5 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300/80">Comments ({selectedTask.comments?.length || 0})</h4>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {(selectedTask.comments || []).map((c) => (
                  <div key={c.id} className="p-4 rounded-xl bg-[#070C17] border border-cyan-900 text-sm space-y-1">
                    <div className="flex justify-between text-xs text-cyan-300/75"><strong className="text-cyan-300 font-semibold">{c.author}</strong><span>{new Date(c.createdAt).toLocaleTimeString()}</span></div>
                    <p className="text-cyan-50">{c.text}</p>
                  </div>
                ))}
              </div>
              <form onSubmit={handleAddComment} className="flex gap-2.5">
                <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder={`Comment as ${currentUser}...`} className="flex-1 px-4 py-2.5 rounded-xl bg-[#070C17] border border-cyan-800 text-sm text-white" />
                <button type="submit" className="px-4 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-sm font-bold text-slate-950">Post</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
