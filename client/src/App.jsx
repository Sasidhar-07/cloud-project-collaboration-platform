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
const PRIORITY_BADGE = {
  High: 'bg-rose-950/80 text-rose-300 border-rose-700/60',
  Medium: 'bg-amber-950/80 text-amber-300 border-amber-700/60',
  Low: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60',
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
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-600/20 border border-indigo-500/40 text-indigo-400"><Layers className="w-6 h-6" /></div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-white">Cloud Project Management & Collaboration Platform</h1>
              <p className="text-xs text-slate-400">Live SSE Sync · Multi-Workspace Kanban · Sprint Velocity · Team Roles</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {workspaces.length > 0 && (
              <select value={activeWsId} onChange={(e) => setActiveWsId(e.target.value)} className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs font-medium text-white">
                {workspaces.map((ws) => <option key={ws.id} value={ws.id}>{ws.name}</option>)}
              </select>
            )}
            <select value={currentUser} onChange={(e) => setCurrentUser(e.target.value)} className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs font-medium text-indigo-300">
              {(activeWs?.members || [{ name: 'Sasidhar' }, { name: 'Vijaysimha' }]).map((m) => (
                <option key={m.name} value={m.name}>Acting as: {m.name}</option>
              ))}
            </select>
            <button onClick={handleReset} title="Reset sample data to Sasidhar & Vijaysimha" className="px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 inline-flex items-center gap-1">
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
            <span className={`text-xs px-2.5 py-1.5 rounded-lg border inline-flex items-center gap-1.5 ${backendConnected ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300' : 'bg-slate-900 border-slate-700 text-slate-300'}`}>
              <Server className="w-3.5 h-3.5" />{backendConnected ? 'Node API (Live)' : 'Local Store'}
            </span>
            <button onClick={() => setShowNewModal(true)} className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white inline-flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> New Task
            </button>
          </div>
        </div>
      </header>

      {activeWs && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">{activeWs.name}</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700/60">{activeWs.sprintName}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{activeWs.description}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'board', label: 'Kanban Board', icon: KanbanSquare },
                { id: 'analytics', label: 'Sprint Analytics', icon: BarChart3 },
                { id: 'team', label: `Team & Roles (${activeWs.members.length})`, icon: Users },
                { id: 'activity', label: `Activity (${activeWs.activities.length})`, icon: History },
              ].map((t) => {
                const Icon = t.icon;
                return (
                  <button key={t.id} onClick={() => setActiveTab(t.id)} className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium ${activeTab === t.id ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'}`}>
                    <Icon className="w-4 h-4" />{t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {activeTab === 'board' && (
            <>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search tasks by title or assignee..." className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs sm:text-sm" />
                </div>
                <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs sm:text-sm">
                  <option value="All">All Priorities</option>
                  {PRIORITIES.map((p) => <option key={p} value={p}>{p} Priority</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {COLUMNS.map((col) => {
                  const colTasks = filteredTasks.filter((t) => t.status === col);
                  return (
                    <div key={col} className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 space-y-3 min-h-[340px]">
                      <div className="flex items-center justify-between px-1">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">{col}</h3>
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">{colTasks.length}</span>
                      </div>
                      <div className="space-y-3">
                        {colTasks.map((task) => {
                          const nextCol = COLUMNS[(COLUMNS.indexOf(task.status) + 1) % COLUMNS.length];
                          return (
                            <div key={task.id} className="bg-slate-950 border border-slate-800 hover:border-indigo-500/60 rounded-lg p-3.5 space-y-2.5 transition">
                              <div className="flex items-center justify-between gap-2">
                                <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${PRIORITY_BADGE[task.priority] || PRIORITY_BADGE.Medium}`}>{task.priority}</span>
                                <span className="text-[11px] font-mono text-indigo-400">{task.points} pts</span>
                              </div>
                              <button onClick={() => setSelectedTaskId(task.id)} className="text-left text-sm font-semibold text-white hover:text-indigo-400 block w-full">{task.title}</button>
                              {task.description && <p className="text-xs text-slate-400 line-clamp-2">{task.description}</p>}
                              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                                <span className="text-slate-300 font-medium">{task.assignee}</span>
                                <div className="flex items-center gap-2">
                                  <button onClick={() => setSelectedTaskId(task.id)} className="text-slate-400 hover:text-white inline-flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /><span>{task.comments?.length || 0}</span></button>
                                  <button onClick={() => handleStatusChange(task.id, nextCol)} className="px-2 py-1 rounded bg-slate-800 hover:bg-indigo-600 text-[11px] text-slate-200 hover:text-white inline-flex items-center gap-1"><span>{nextCol}</span><ArrowRight className="w-3 h-3" /></button>
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
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4"><div className="text-xs text-slate-400">Completion Rate</div><div className="text-3xl font-bold text-emerald-400 mt-1">{completionPct}%</div><div className="text-xs text-slate-500 mt-1">{doneTasks} of {totalTasks} tasks done</div></div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4"><div className="text-xs text-slate-400">Sprint Points Done</div><div className="text-3xl font-bold text-indigo-400 mt-1">{completedPoints} / {totalPoints}</div><div className="text-xs text-slate-500 mt-1">Story points delivered</div></div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4"><div className="text-xs text-slate-400">Active Team Members</div><div className="text-3xl font-bold text-white mt-1">{activeWs.members.length}</div><div className="text-xs text-slate-500 mt-1">Assigned in workspace</div></div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4"><div className="text-xs text-slate-400">Logged Events</div><div className="text-3xl font-bold text-amber-400 mt-1">{activeWs.activities.length}</div><div className="text-xs text-slate-500 mt-1">Audit trail entries</div></div>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-white">Workspace Members & Access Roles</h3>
                <form onSubmit={handleAddMember} className="flex flex-wrap gap-2">
                  <input type="text" value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} placeholder="Add teammate name..." className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs" />
                  <select value={newMemberRole} onChange={(e) => setNewMemberRole(e.target.value)} className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs">
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <button type="submit" className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white inline-flex items-center gap-1">
                    <UserPlus className="w-3.5 h-3.5" /> Add Member
                  </button>
                </form>
              </div>
              {activeWs.members.map((m) => {
                const memberPts = activeWs.tasks.filter((t) => t.assignee === m.name).reduce((s, t) => s + (t.points || 0), 0);
                return (
                  <div key={m.id} className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-lg bg-slate-950 border border-slate-800">
                    <div>
                      <div className="text-sm font-semibold text-white">{m.name}</div>
                      <div className="text-xs text-slate-400">Allocated: {memberPts} / {m.capacityPoints} sprint pts</div>
                    </div>
                    <select value={m.role} onChange={(e) => handleRoleChange(m.id, e.target.value)} className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs">
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2.5">
              <h3 className="text-sm font-bold text-white mb-2">Workspace Activity Log</h3>
              {activeWs.activities.map((act) => (
                <div key={act.id} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs flex items-center justify-between gap-3">
                  <span className="text-slate-200 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />{act.text}</span>
                  <span className="text-slate-500 shrink-0">{new Date(act.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </main>
      )}

      {showNewModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-30">
          <form onSubmit={handleCreateTask} className="bg-slate-900 border border-slate-700 rounded-xl p-5 w-full max-w-md space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Create New Task</h3>
              <button type="button" onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <input type="text" required value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Task title..." className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm" />
            <textarea rows={3} value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Task details & acceptance criteria..." className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm" />
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div><label className="text-slate-400 block mb-1">Status</label><select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="w-full px-2.5 py-2 rounded-lg bg-slate-950 border border-slate-700">{COLUMNS.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
              <div><label className="text-slate-400 block mb-1">Priority</label><select value={newPriority} onChange={(e) => setNewPriority(e.target.value)} className="w-full px-2.5 py-2 rounded-lg bg-slate-950 border border-slate-700">{PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}</select></div>
              <div><label className="text-slate-400 block mb-1">Assignee</label><select value={newAssignee} onChange={(e) => setNewAssignee(e.target.value)} className="w-full px-2.5 py-2 rounded-lg bg-slate-950 border border-slate-700">{(activeWs?.members || []).map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}</select></div>
              <div><label className="text-slate-400 block mb-1">Story Points</label><input type="number" min={1} max={21} value={newPoints} onChange={(e) => setNewPoints(e.target.value)} className="w-full px-2.5 py-2 rounded-lg bg-slate-950 border border-slate-700" /></div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowNewModal(false)} className="px-4 py-2 rounded-lg bg-slate-800 text-xs">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-lg bg-indigo-600 text-xs font-semibold text-white">Create Task</button>
            </div>
          </form>
        </div>
      )}

      {selectedTask && (
        <div className="fixed inset-0 bg-black/70 flex justify-end z-30">
          <div className="bg-slate-900 border-l border-slate-800 w-full max-w-lg p-5 overflow-y-auto space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs font-mono text-indigo-400">{selectedTask.status} · {selectedTask.points} pts</span>
                <h3 className="text-lg font-bold text-white mt-0.5">{selectedTask.title}</h3>
              </div>
              <button onClick={() => setSelectedTaskId(null)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-slate-300 bg-slate-950 p-3.5 rounded-lg border border-slate-800">{selectedTask.description || 'No description provided.'}</p>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Assignee: <strong className="text-slate-200">{selectedTask.assignee}</strong></span>
              <button onClick={() => handleDeleteTask(selectedTask.id)} className="text-rose-400 hover:text-rose-300 inline-flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" /> Delete Task</button>
            </div>
            <div className="border-t border-slate-800 pt-4 space-y-3">
              <h4 className="text-xs font-bold uppercase text-slate-400">Discussion ({selectedTask.comments?.length || 0})</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {(selectedTask.comments || []).map((c) => (
                  <div key={c.id} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1">
                    <div className="flex justify-between text-slate-400"><strong className="text-indigo-300">{c.author}</strong><span>{new Date(c.createdAt).toLocaleTimeString()}</span></div>
                    <p className="text-slate-200">{c.text}</p>
                  </div>
                ))}
              </div>
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder={`Comment as ${currentUser}...`} className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs" />
                <button type="submit" className="px-3.5 py-2 rounded-lg bg-indigo-600 text-xs font-semibold text-white">Post</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
