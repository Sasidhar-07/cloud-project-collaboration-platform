import React, { useState, useEffect } from 'react';
import { KanbanSquare, BarChart3, Users, History, Plus, Search, Server, MessageSquare, Trash2, X, ArrowRight, CheckCircle2, Layers, RotateCcw, UserPlus } from 'lucide-react';
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
  Todo: 'border-t-sky-400',
  'In Progress': 'border-t-amber-400',
  'In Review': 'border-t-violet-400',
  Done: 'border-t-teal-400',
};

const PRIORITY_PILL = {
  High: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
  Medium: 'bg-sky-500/15 text-sky-300 border-sky-500/40',
  Low: 'bg-teal-500/15 text-teal-300 border-teal-500/40',
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
    <div className="min-h-screen bg-[#070B14] text-cyan-50 text-sm">
      <header className="border-b border-cyan-950/80 bg-[#0B1220] sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-400/30 text-cyan-300">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">SprintGrid Cloud PM</h1>
              <p className="text-xs text-cyan-300/75 mt-0.5">Workspace delivery · Story point telemetry · Live sync</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {workspaces.length > 0 && (
              <select value={activeWsId} onChange={(e) => setActiveWsId(e.target.value)} className="px-3.5 py-2 rounded-lg bg-[#070B14] border border-cyan-900 text-xs sm:text-sm font-medium text-cyan-100">
                {workspaces.map((ws) => <option key={ws.id} value={ws.id}>{ws.name}</option>)}
              </select>
            )}
            <select value={currentUser} onChange={(e) => setCurrentUser(e.target.value)} className="px-3.5 py-2 rounded-lg bg-[#070B14] border border-cyan-900 text-xs sm:text-sm font-medium text-amber-300">
              {(activeWs?.members || [{ name: 'Sasidhar' }, { name: 'Vijaysimha' }]).map((m) => (
                <option key={m.name} value={m.name}>User: {m.name}</option>
              ))}
            </select>
            <button onClick={handleReset} className="px-3 py-2 rounded-lg bg-[#070B14] hover:bg-cyan-950 border border-cyan-900 text-xs sm:text-sm text-cyan-200 inline-flex items-center gap-1.5">
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
            <span className={`text-xs sm:text-sm px-3 py-2 rounded-lg border inline-flex items-center gap-1.5 font-medium ${backendConnected ? 'bg-teal-950/70 border-teal-600/50 text-teal-300' : 'bg-[#070B14] border-cyan-950 text-cyan-400/70'}`}>
              <Server className="w-4 h-4" />{backendConnected ? 'API Live' : 'Local'}
            </span>
            <button onClick={() => setShowNewModal(true)} className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-xs sm:text-sm font-bold text-slate-950 inline-flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Add Task
            </button>
          </div>
        </div>
      </header>

      {activeWs && (
        <main className="max-w-7xl mx-auto px-5 sm:px-8 py-7 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-[#0B1220] border border-cyan-950/90 rounded-xl p-5">
            <div className="px-2">
              <div className="text-xs uppercase tracking-wider text-cyan-400/75 font-semibold">Workspace</div>
              <div className="text-base font-bold text-white truncate mt-1">{activeWs.name}</div>
              <div className="text-xs text-amber-300/90 truncate mt-0.5">{activeWs.sprintName}</div>
            </div>
            <div className="px-3 sm:border-l border-cyan-950">
              <div className="text-xs uppercase tracking-wider text-cyan-400/75 font-semibold">Progress</div>
              <div className="text-2xl font-bold text-teal-300 mt-1">{completionPct}%</div>
              <div className="text-xs text-cyan-200/65 mt-0.5">{doneTasks}/{totalTasks} done</div>
            </div>
            <div className="px-3 lg:border-l border-cyan-950">
              <div className="text-xs uppercase tracking-wider text-cyan-400/75 font-semibold">Points Burned</div>
              <div className="text-2xl font-bold text-cyan-300 mt-1">{completedPoints}<span className="text-sm font-normal text-cyan-400/75"> / {totalPoints} pts</span></div>
              <div className="text-xs text-cyan-200/65 mt-0.5">{activeWs.members.length} active members</div>
            </div>
            <div className="px-3 lg:border-l border-cyan-950 flex flex-col justify-center">
              <div className="text-xs uppercase tracking-wider text-cyan-400/75 font-semibold mb-2">Views</div>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'board', label: 'Board', icon: KanbanSquare },
                  { id: 'analytics', label: 'Metrics', icon: BarChart3 },
                  { id: 'team', label: `Team (${activeWs.members.length})`, icon: Users },
                  { id: 'activity', label: `Log (${activeWs.activities.length})`, icon: History },
                ].map((t) => {
                  const Icon = t.icon;
                  return (
                    <button key={t.id} onClick={() => setActiveTab(t.id)} className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium ${activeTab === t.id ? 'bg-cyan-500 text-slate-950 font-semibold' : 'bg-[#070B14] text-cyan-200/85 hover:text-white border border-cyan-950'}`}>
                      <Icon className="w-3.5 h-3.5" />{t.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {activeTab === 'board' && (
            <>
              <div className="flex flex-col sm:flex-row gap-3.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-cyan-400/75 absolute left-3.5 top-3" />
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Filter by task title or member..." className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#0B1220] border border-cyan-950 text-sm text-white" />
                </div>
                <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="px-3.5 py-2.5 rounded-lg bg-[#0B1220] border border-cyan-950 text-sm text-cyan-100">
                  <option value="All">All Priorities</option>
                  {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {COLUMNS.map((col) => {
                  const colTasks = filteredTasks.filter((t) => t.status === col);
                  return (
                    <div key={col} className={`bg-[#0B1220] border border-cyan-950/90 border-t-2 ${COLUMN_ACCENT[col]} rounded-xl p-4 space-y-3.5 min-h-[360px]`}>
                      <div className="flex items-center justify-between px-1">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-200">{col}</h3>
                        <span className="text-xs px-2.5 py-0.5 rounded bg-[#070B14] border border-cyan-950 text-cyan-300 font-mono">{colTasks.length}</span>
                      </div>
                      <div className="space-y-3">
                        {colTasks.map((task) => {
                          const nextCol = COLUMNS[(COLUMNS.indexOf(task.status) + 1) % COLUMNS.length];
                          return (
                            <div key={task.id} className="bg-[#070B14] border border-cyan-950 hover:border-cyan-500/50 rounded-lg p-3.5 space-y-2.5 transition">
                              <div className="flex items-center justify-between gap-2">
                                <span className={`text-xs px-2.5 py-0.5 rounded border font-semibold ${PRIORITY_PILL[task.priority] || PRIORITY_PILL.Medium}`}>{task.priority}</span>
                                <span className="text-xs font-mono text-amber-300">{task.points} pts</span>
                              </div>
                              <button onClick={() => setSelectedTaskId(task.id)} className="text-left text-sm font-semibold text-white hover:text-cyan-300 block w-full leading-snug">{task.title}</button>
                              {task.description && <p className="text-xs text-cyan-100/65 line-clamp-2 leading-relaxed">{task.description}</p>}
                              <div className="pt-2.5 border-t border-cyan-950/80 flex items-center justify-between text-xs">
                                <span className="text-cyan-200 font-medium">{task.assignee}</span>
                                <div className="flex items-center gap-2">
                                  <button onClick={() => setSelectedTaskId(task.id)} className="text-cyan-300/75 hover:text-white inline-flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /><span>{task.comments?.length || 0}</span></button>
                                  <button onClick={() => handleStatusChange(task.id, nextCol)} className="px-2.5 py-1 rounded bg-cyan-950/90 hover:bg-cyan-500 text-xs text-cyan-200 hover:text-slate-950 font-medium inline-flex items-center gap-1"><span>{nextCol}</span><ArrowRight className="w-3 h-3" /></button>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-[#0B1220] border border-cyan-950 rounded-xl p-5"><div className="text-xs text-cyan-300/75 font-medium">Completion Rate</div><div className="text-3xl font-bold text-teal-300 mt-1.5">{completionPct}%</div><div className="text-xs text-cyan-100/55 mt-1">{doneTasks} of {totalTasks} tasks done</div></div>
              <div className="bg-[#0B1220] border border-cyan-950 rounded-xl p-5"><div className="text-xs text-cyan-300/75 font-medium">Sprint Points Done</div><div className="text-3xl font-bold text-cyan-300 mt-1.5">{completedPoints} / {totalPoints}</div><div className="text-xs text-cyan-100/55 mt-1">Story points delivered</div></div>
              <div className="bg-[#0B1220] border border-cyan-950 rounded-xl p-5"><div className="text-xs text-cyan-300/75 font-medium">Team Size</div><div className="text-3xl font-bold text-white mt-1.5">{activeWs.members.length}</div><div className="text-xs text-cyan-100/55 mt-1">Active workspace members</div></div>
              <div className="bg-[#0B1220] border border-cyan-950 rounded-xl p-5"><div className="text-xs text-cyan-300/75 font-medium">Activity Events</div><div className="text-3xl font-bold text-amber-300 mt-1.5">{activeWs.activities.length}</div><div className="text-xs text-cyan-100/55 mt-1">Recorded updates</div></div>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="bg-[#0B1220] border border-cyan-950 rounded-xl p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-base font-bold text-white">Team Members & Roles</h3>
                <form onSubmit={handleAddMember} className="flex flex-wrap gap-2.5">
                  <input type="text" value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} placeholder="Member name..." className="px-3.5 py-2 rounded-lg bg-[#070B14] border border-cyan-900 text-xs sm:text-sm text-white" />
                  <select value={newMemberRole} onChange={(e) => setNewMemberRole(e.target.value)} className="px-3 py-2 rounded-lg bg-[#070B14] border border-cyan-900 text-xs sm:text-sm text-cyan-100">
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <button type="submit" className="px-3.5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-xs sm:text-sm font-bold text-slate-950 inline-flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4" /> Add
                  </button>
                </form>
              </div>
              {activeWs.members.map((m) => {
                const memberPts = activeWs.tasks.filter((t) => t.assignee === m.name).reduce((s, t) => s + (t.points || 0), 0);
                return (
                  <div key={m.id} className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-lg bg-[#070B14] border border-cyan-950">
                    <div>
                      <div className="text-base font-semibold text-white">{m.name}</div>
                      <div className="text-xs sm:text-sm text-cyan-300/75 mt-0.5">Allocated: {memberPts} / {m.capacityPoints} sprint pts</div>
                    </div>
                    <select value={m.role} onChange={(e) => handleRoleChange(m.id, e.target.value)} className="px-3.5 py-2 rounded-lg bg-[#0B1220] border border-cyan-900 text-xs sm:text-sm text-cyan-100">
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="bg-[#0B1220] border border-cyan-950 rounded-xl p-6 space-y-3">
              <h3 className="text-base font-bold text-white mb-2">Activity Feed</h3>
              {activeWs.activities.map((act) => (
                <div key={act.id} className="p-3.5 rounded-lg bg-[#070B14] border border-cyan-950 text-xs sm:text-sm flex items-center justify-between gap-3">
                  <span className="text-cyan-50 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />{act.text}</span>
                  <span className="text-xs text-cyan-300/65 shrink-0">{new Date(act.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </main>
      )}

      {showNewModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-30">
          <form onSubmit={handleCreateTask} className="bg-[#0B1220] border border-cyan-900 rounded-xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">New Task</h3>
              <button type="button" onClick={() => setShowNewModal(false)} className="text-cyan-300/75 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <input type="text" required value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Task title..." className="w-full px-3.5 py-2.5 rounded-lg bg-[#070B14] border border-cyan-900 text-sm text-white" />
            <textarea rows={3} value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Details..." className="w-full px-3.5 py-2.5 rounded-lg bg-[#070B14] border border-cyan-900 text-sm text-white" />
            <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
              <div><label className="text-cyan-300/75 block mb-1">Status</label><select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[#070B14] border border-cyan-900 text-white">{COLUMNS.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
              <div><label className="text-cyan-300/75 block mb-1">Priority</label><select value={newPriority} onChange={(e) => setNewPriority(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[#070B14] border border-cyan-900 text-white">{PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}</select></div>
              <div><label className="text-cyan-300/75 block mb-1">Assignee</label><select value={newAssignee} onChange={(e) => setNewAssignee(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[#070B14] border border-cyan-900 text-white">{(activeWs?.members || []).map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}</select></div>
              <div><label className="text-cyan-300/75 block mb-1">Points</label><input type="number" min={1} max={21} value={newPoints} onChange={(e) => setNewPoints(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[#070B14] border border-cyan-900 text-white" /></div>
            </div>
            <div className="flex justify-end gap-2.5 pt-2">
              <button type="button" onClick={() => setShowNewModal(false)} className="px-4 py-2 rounded-lg bg-[#070B14] border border-cyan-950 text-xs sm:text-sm text-cyan-200">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-lg bg-cyan-500 text-xs sm:text-sm font-bold text-slate-950">Create</button>
            </div>
          </form>
        </div>
      )}

      {selectedTask && (
        <div className="fixed inset-0 bg-black/75 flex justify-end z-30">
          <div className="bg-[#0B1220] border-l border-cyan-950 w-full max-w-lg p-6 overflow-y-auto space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs font-mono text-amber-300">{selectedTask.status} · {selectedTask.points} pts</span>
                <h3 className="text-lg font-bold text-white mt-0.5">{selectedTask.title}</h3>
              </div>
              <button onClick={() => setSelectedTaskId(null)} className="text-cyan-300/75 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-cyan-50/90 bg-[#070B14] p-4 rounded-lg border border-cyan-950 leading-relaxed">{selectedTask.description || 'No description provided.'}</p>
            <div className="flex items-center justify-between text-xs sm:text-sm text-cyan-300/75">
              <span>Assignee: <strong className="text-white">{selectedTask.assignee}</strong></span>
              <button onClick={() => handleDeleteTask(selectedTask.id)} className="text-rose-400 hover:text-rose-300 inline-flex items-center gap-1"><Trash2 className="w-4 h-4" /> Delete</button>
            </div>
            <div className="border-t border-cyan-950 pt-4 space-y-3">
              <h4 className="text-xs font-bold uppercase text-cyan-300/75">Comments ({selectedTask.comments?.length || 0})</h4>
              <div className="space-y-2.5 max-h-60 overflow-y-auto">
                {(selectedTask.comments || []).map((c) => (
                  <div key={c.id} className="p-3.5 rounded-lg bg-[#070B14] border border-cyan-950 text-xs sm:text-sm space-y-1">
                    <div className="flex justify-between text-xs text-cyan-300/75"><strong className="text-cyan-300">{c.author}</strong><span>{new Date(c.createdAt).toLocaleTimeString()}</span></div>
                    <p className="text-cyan-50">{c.text}</p>
                  </div>
                ))}
              </div>
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder={`Comment as ${currentUser}...`} className="flex-1 px-3.5 py-2 rounded-lg bg-[#070B14] border border-cyan-900 text-xs sm:text-sm text-white" />
                <button type="submit" className="px-4 py-2 rounded-lg bg-cyan-500 text-xs sm:text-sm font-bold text-slate-950">Post</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
