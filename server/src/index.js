import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import {
  listWorkspaces,
  resetAndReadWorkspaces,
  addMemberToWorkspace,
  createTaskInWorkspace,
  updateTaskInWorkspace,
  deleteTaskFromWorkspace,
  addTaskComment,
  updateMemberRole,
} from './db/store.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5002;
const clients = new Set();

function broadcastWorkspaces(workspaces) {
  const payload = `data: ${JSON.stringify({ workspaces, ts: Date.now() })}\n\n`;
  for (const res of clients) {
    res.write(payload);
  }
}

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', service: 'Cloud Project Management & Collaboration API', clientsConnected: clients.size, timestamp: new Date().toISOString() });
});

app.get('/api/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();
  clients.add(res);
  res.write(`data: ${JSON.stringify({ workspaces: listWorkspaces(), ts: Date.now() })}\n\n`);
  req.on('close', () => clients.delete(res));
});

app.get('/api/workspaces', (req, res) => res.json({ workspaces: listWorkspaces() }));

app.post('/api/workspaces/reset', (req, res) => {
  const workspaces = resetAndReadWorkspaces();
  broadcastWorkspaces(workspaces);
  res.json({ workspaces });
});

app.post('/api/workspaces/:wsId/members', (req, res) => {
  try {
    const workspace = addMemberToWorkspace(req.params.wsId, req.body.name, req.body.role, req.body.capacityPoints);
    broadcastWorkspaces(listWorkspaces());
    res.status(201).json({ workspace });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.post('/api/workspaces/:wsId/tasks', (req, res) => {
  try {
    const result = createTaskInWorkspace(req.params.wsId, req.body);
    broadcastWorkspaces(listWorkspaces());
    res.status(201).json(result);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.patch('/api/workspaces/:wsId/tasks/:taskId', (req, res) => {
  try {
    const result = updateTaskInWorkspace(req.params.wsId, req.params.taskId, req.body);
    broadcastWorkspaces(listWorkspaces());
    res.json(result);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/workspaces/:wsId/tasks/:taskId', (req, res) => {
  try {
    const workspace = deleteTaskFromWorkspace(req.params.wsId, req.params.taskId);
    broadcastWorkspaces(listWorkspaces());
    res.json({ workspace });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.post('/api/workspaces/:wsId/tasks/:taskId/comments', (req, res) => {
  try {
    const result = addTaskComment(req.params.wsId, req.params.taskId, req.body.author, req.body.text);
    broadcastWorkspaces(listWorkspaces());
    res.status(201).json(result);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.patch('/api/workspaces/:wsId/members/:memberId', (req, res) => {
  try {
    const workspace = updateMemberRole(req.params.wsId, req.params.memberId, req.body.role);
    broadcastWorkspaces(listWorkspaces());
    res.json({ workspace });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.listen(PORT, () => console.log(`Collab PM Backend running on http://localhost:${PORT}`));
