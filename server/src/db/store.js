import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'workspaces.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DEFAULT_DATA = {
  workspaces: [
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
        {
          id: 't-101',
          title: 'Set up Nginx reverse proxy & TLS on staging VPS',
          description: 'Configure upstream routing, gzip compression, and SSL certificates.',
          status: 'In Progress',
          priority: 'High',
          points: 8,
          assignee: 'Sasidhar',
          comments: [{ id: 'c1', author: 'Vijaysimha', text: 'Staging DNS propagated.', createdAt: '2026-11-20T08:30:00Z' }],
          updatedAt: '2026-11-20T09:15:00Z',
        },
        {
          id: 't-102',
          title: 'Add structured request logging & health endpoint',
          description: 'Expose /api/health with uptime and latency metrics.',
          status: 'Done',
          priority: 'Medium',
          points: 5,
          assignee: 'Vijaysimha',
          comments: [],
          updatedAt: '2026-11-19T17:00:00Z',
        },
        {
          id: 't-103',
          title: 'Design multi-tenant webhook retry queue',
          description: 'Handle transient failures with exponential backoff.',
          status: 'Todo',
          priority: 'High',
          points: 8,
          assignee: 'Sasidhar',
          comments: [],
          updatedAt: '2026-11-20T07:00:00Z',
        },
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
        {
          id: 't-201',
          title: 'Verify mobile responsive layouts across Kanban & analytics',
          description: 'Test tablet and mobile viewports for spacing and overflow.',
          status: 'In Review',
          priority: 'Medium',
          points: 5,
          assignee: 'Vijaysimha',
          comments: [],
          updatedAt: '2026-11-20T10:00:00Z',
        },
      ],
      activities: [
        { id: 'a201', text: 'Vijaysimha submitted "Verify mobile responsive layouts across Kanban & analytics" for review', createdAt: '2026-11-20T10:00:00Z' },
      ],
    },
  ],
};

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

export function resetAndReadWorkspaces() {
  const fresh = JSON.parse(JSON.stringify(DEFAULT_DATA));
  writeDB(fresh);
  return fresh.workspaces;
}

function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    return resetAndReadWorkspaces();
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    return parsed.workspaces || resetAndReadWorkspaces();
  } catch {
    return resetAndReadWorkspaces();
  }
}

function saveWorkspaces(workspaces) {
  writeDB({ workspaces });
}

export function listWorkspaces() {
  return readDB();
}

function addActivity(ws, text) {
  ws.activities = [
    { id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, text, createdAt: new Date().toISOString() },
    ...(ws.activities || []),
  ].slice(0, 50);
}

export function addMemberToWorkspace(wsId, name, role = 'Developer', capacityPoints = 20) {
  const workspaces = readDB();
  const ws = workspaces.find((w) => w.id === wsId);
  if (!ws) throw new Error('Workspace not found');
  const cleanName = (name || '').trim();
  if (!cleanName) throw new Error('Member name required');
  const existing = ws.members.find((m) => m.name.toLowerCase() === cleanName.toLowerCase());
  if (existing) {
    existing.role = role;
    addActivity(ws, `Updated ${existing.name}'s role to ${role}`);
  } else {
    ws.members.push({ id: `m-${Date.now()}`, name: cleanName, role, capacityPoints: Number(capacityPoints) || 20 });
    addActivity(ws, `Added ${cleanName} (${role}) to workspace`);
  }
  saveWorkspaces(workspaces);
  return ws;
}

export function createTaskInWorkspace(wsId, payload) {
  const workspaces = readDB();
  const ws = workspaces.find((w) => w.id === wsId);
  if (!ws) throw new Error('Workspace not found');
  const task = {
    id: `task-${Date.now()}`,
    title: (payload.title || '').trim(),
    description: (payload.description || '').trim(),
    status: payload.status || 'Todo',
    priority: payload.priority || 'Medium',
    points: Number(payload.points) || 3,
    assignee: payload.assignee || ws.members[0]?.name || 'Sasidhar',
    comments: [],
    updatedAt: new Date().toISOString(),
  };
  if (!task.title) throw new Error('Task title is required');
  ws.tasks.unshift(task);
  addActivity(ws, `${task.assignee} created task "${task.title}" in ${task.status}`);
  saveWorkspaces(workspaces);
  return { task, workspace: ws };
}

export function updateTaskInWorkspace(wsId, taskId, updates) {
  const workspaces = readDB();
  const ws = workspaces.find((w) => w.id === wsId);
  if (!ws) throw new Error('Workspace not found');
  const task = ws.tasks.find((t) => t.id === taskId);
  if (!task) throw new Error('Task not found');
  const prevStatus = task.status;
  if (updates.title !== undefined) task.title = updates.title.trim() || task.title;
  if (updates.description !== undefined) task.description = updates.description.trim();
  if (updates.status !== undefined) task.status = updates.status;
  if (updates.priority !== undefined) task.priority = updates.priority;
  if (updates.points !== undefined) task.points = Number(updates.points) || task.points;
  if (updates.assignee !== undefined) task.assignee = updates.assignee;
  task.updatedAt = new Date().toISOString();
  addActivity(ws, updates.status && updates.status !== prevStatus ? `Moved "${task.title}" from ${prevStatus} to ${updates.status}` : `Updated task "${task.title}"`);
  saveWorkspaces(workspaces);
  return { task, workspace: ws };
}

export function deleteTaskFromWorkspace(wsId, taskId) {
  const workspaces = readDB();
  const ws = workspaces.find((w) => w.id === wsId);
  if (!ws) throw new Error('Workspace not found');
  const idx = ws.tasks.findIndex((t) => t.id === taskId);
  if (idx === -1) throw new Error('Task not found');
  const [removed] = ws.tasks.splice(idx, 1);
  addActivity(ws, `Deleted task "${removed.title}"`);
  saveWorkspaces(workspaces);
  return ws;
}

export function addTaskComment(wsId, taskId, author, text) {
  const workspaces = readDB();
  const ws = workspaces.find((w) => w.id === wsId);
  if (!ws) throw new Error('Workspace not found');
  const task = ws.tasks.find((t) => t.id === taskId);
  if (!task) throw new Error('Task not found');
  if (!text || !text.trim()) throw new Error('Comment text required');
  const comment = { id: `c-${Date.now()}`, author: author || 'Sasidhar', text: text.trim(), createdAt: new Date().toISOString() };
  task.comments.push(comment);
  task.updatedAt = new Date().toISOString();
  addActivity(ws, `${comment.author} commented on "${task.title}"`);
  saveWorkspaces(workspaces);
  return { comment, task, workspace: ws };
}

export function updateMemberRole(wsId, memberId, role) {
  const workspaces = readDB();
  const ws = workspaces.find((w) => w.id === wsId);
  if (!ws) throw new Error('Workspace not found');
  const member = ws.members.find((m) => m.id === memberId);
  if (!member) throw new Error('Member not found');
  member.role = role;
  addActivity(ws, `Updated ${member.name}'s role to ${role}`);
  saveWorkspaces(workspaces);
  return ws;
}
