const API_BASE = import.meta.env.VITE_API_URL || '';
const LOCAL_STORAGE_KEY = 'collab_pm_workspaces_v2';

const INITIAL_WORKSPACES = [
  {
    id: 'ws-torstaq-core',
    name: 'TorStaq Cloud Infra',
    description: 'Production deployments, observability, and API gateways.',
    sprintName: 'Sprint 14 · Cloud Hardening',
    members: [
      { id: 'm1', name: 'Sasidhar', role: 'Admin', capacityPoints: 24 },
      { id: 'm2', name: 'Vijaysimha', role: 'Maintainer', capacityPoints: 24 },
    ],
    tasks: [
      { id: 't-101', title: 'Set up Nginx reverse proxy & TLS on staging VPS', description: 'Configure upstream routing, gzip compression, and SSL certificates.', status: 'In Progress', priority: 'High', points: 8, assignee: 'Sasidhar', comments: [{ id: 'c1', author: 'Vijaysimha', text: 'Staging DNS propagated.', createdAt: '2026-11-20T08:30:00Z' }], updatedAt: '2026-11-20T09:15:00Z' },
      { id: 't-102', title: 'Add structured request logging & health endpoint', description: 'Expose /api/health with uptime and latency metrics.', status: 'Done', priority: 'Medium', points: 5, assignee: 'Vijaysimha', comments: [], updatedAt: '2026-11-19T17:00:00Z' },
      { id: 't-103', title: 'Design multi-tenant webhook retry queue', description: 'Handle transient failures with exponential backoff.', status: 'Todo', priority: 'High', points: 8, assignee: 'Sasidhar', comments: [], updatedAt: '2026-11-20T07:00:00Z' },
    ],
    activities: [
      { id: 'a1', text: 'Vijaysimha moved "Add structured request logging & health endpoint" to Done', createdAt: '2026-11-19T17:00:00Z' },
      { id: 'a2', text: 'Sasidhar updated "Set up Nginx reverse proxy & TLS on staging VPS"', createdAt: '2026-11-20T09:15:00Z' },
    ],
  },
  {
    id: 'ws-client-portal',
    name: 'Client Delivery & QA',
    description: 'Release readiness, UAT checklists, and sprint milestones.',
    sprintName: 'Sprint 6 · v2 Release',
    members: [
      { id: 'm1', name: 'Sasidhar', role: 'Admin', capacityPoints: 20 },
      { id: 'm2', name: 'Vijaysimha', role: 'Maintainer', capacityPoints: 20 },
    ],
    tasks: [
      { id: 't-201', title: 'Verify mobile responsive layouts across Kanban & analytics', description: 'Test tablet and mobile viewports for spacing and overflow.', status: 'In Review', priority: 'Medium', points: 5, assignee: 'Vijaysimha', comments: [], updatedAt: '2026-11-20T10:00:00Z' },
    ],
    activities: [
      { id: 'a201', text: 'Vijaysimha submitted "Verify mobile responsive layouts across Kanban & analytics" for review', createdAt: '2026-11-20T10:00:00Z' },
    ],
  },
];

function readLocal() {
  try { const raw = localStorage.getItem(LOCAL_STORAGE_KEY); if (raw) return JSON.parse(raw); } catch {}
  return JSON.parse(JSON.stringify(INITIAL_WORKSPACES));
}
function writeLocal(data) {
  try { localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data)); } catch {}
}

export function subscribeRealtimeWorkspaces(onUpdate) {
  try {
    const es = new EventSource(`${API_BASE}/api/stream`);
    es.onmessage = (event) => {
      const parsed = JSON.parse(event.data);
      if (Array.isArray(parsed.workspaces)) {
        writeLocal(parsed.workspaces);
        onUpdate(parsed.workspaces, true);
      }
    };
    es.onerror = () => {};
    return () => es.close();
  } catch {
    return () => {};
  }
}

export async function fetchWorkspacesHybrid() {
  try {
    const res = await fetch(`${API_BASE}/api/workspaces`);
    if (res.ok) { const d = await res.json(); writeLocal(d.workspaces); return { workspaces: d.workspaces, backendConnected: true }; }
  } catch {}
  return { workspaces: readLocal(), backendConnected: false };
}

export async function resetWorkspacesHybrid() {
  try {
    const res = await fetch(`${API_BASE}/api/workspaces/reset`, { method: 'POST' });
    if (res.ok) { const d = await res.json(); writeLocal(d.workspaces); return { workspaces: d.workspaces, backendConnected: true }; }
  } catch {}
  const fresh = JSON.parse(JSON.stringify(INITIAL_WORKSPACES));
  writeLocal(fresh);
  return { workspaces: fresh, backendConnected: false };
}

export async function addMemberHybrid(wsId, name, role = 'Developer', capacityPoints = 20) {
  try {
    const res = await fetch(`${API_BASE}/api/workspaces/${wsId}/members`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, role, capacityPoints }) });
    if (res.ok) { const d = await res.json(); return { workspace: d.workspace, backendConnected: true }; }
  } catch {}
  const list = readLocal(); const ws = list.find((w) => w.id === wsId);
  ws.members.push({ id: `m-${Date.now()}`, name: name.trim(), role, capacityPoints: Number(capacityPoints) || 20 });
  writeLocal(list); return { workspace: ws, backendConnected: false };
}

export async function createTaskHybrid(wsId, payload) {
  try {
    const res = await fetch(`${API_BASE}/api/workspaces/${wsId}/tasks`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (res.ok) { const d = await res.json(); return { workspace: d.workspace, backendConnected: true }; }
  } catch {}
  const list = readLocal(); const ws = list.find((w) => w.id === wsId);
  const task = { id: `task-${Date.now()}`, title: payload.title.trim(), description: (payload.description || '').trim(), status: payload.status || 'Todo', priority: payload.priority || 'Medium', points: Number(payload.points) || 3, assignee: payload.assignee || 'Sasidhar', comments: [], updatedAt: new Date().toISOString() };
  ws.tasks.unshift(task);
  writeLocal(list); return { workspace: ws, backendConnected: false };
}

export async function updateTaskHybrid(wsId, taskId, updates) {
  try {
    const res = await fetch(`${API_BASE}/api/workspaces/${wsId}/tasks/${taskId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
    if (res.ok) { const d = await res.json(); return { workspace: d.workspace, backendConnected: true }; }
  } catch {}
  const list = readLocal(); const ws = list.find((w) => w.id === wsId); const task = ws.tasks.find((t) => t.id === taskId);
  Object.assign(task, updates, { updatedAt: new Date().toISOString() });
  writeLocal(list); return { workspace: ws, backendConnected: false };
}

export async function deleteTaskHybrid(wsId, taskId) {
  try {
    const res = await fetch(`${API_BASE}/api/workspaces/${wsId}/tasks/${taskId}`, { method: 'DELETE' });
    if (res.ok) { const d = await res.json(); return { workspace: d.workspace, backendConnected: true }; }
  } catch {}
  const list = readLocal(); const ws = list.find((w) => w.id === wsId); ws.tasks = ws.tasks.filter((t) => t.id !== taskId);
  writeLocal(list); return { workspace: ws, backendConnected: false };
}

export async function addCommentHybrid(wsId, taskId, author, text) {
  try {
    const res = await fetch(`${API_BASE}/api/workspaces/${wsId}/tasks/${taskId}/comments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ author, text }) });
    if (res.ok) { const d = await res.json(); return { workspace: d.workspace, backendConnected: true }; }
  } catch {}
  const list = readLocal(); const ws = list.find((w) => w.id === wsId); const task = ws.tasks.find((t) => t.id === taskId);
  task.comments.push({ id: `c-${Date.now()}`, author, text, createdAt: new Date().toISOString() });
  writeLocal(list); return { workspace: ws, backendConnected: false };
}

export async function updateMemberRoleHybrid(wsId, memberId, role) {
  try {
    const res = await fetch(`${API_BASE}/api/workspaces/${wsId}/members/${memberId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role }) });
    if (res.ok) { const d = await res.json(); return { workspace: d.workspace, backendConnected: true }; }
  } catch {}
  const list = readLocal(); const ws = list.find((w) => w.id === wsId); const m = ws.members.find((x) => x.id === memberId); if (m) m.role = role;
  writeLocal(list); return { workspace: ws, backendConnected: false };
}
