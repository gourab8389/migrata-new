import { Response } from 'express';

type ClientSet = Set<Response>;

const clients: Map<string, ClientSet> = new Map();

export const registerClient = (dataScheduleId: string, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  let set = clients.get(dataScheduleId);
  if (!set) {
    set = new Set();
    clients.set(dataScheduleId, set);
  }
  set.add(res);

  // keep connection alive
  const keepAlive = setInterval(() => {
    try {
      res.write(': keep-alive\n\n');
    } catch (e) {
      // ignore
    }
  }, 15000);

  res.on('close', () => {
    clearInterval(keepAlive);
    unregisterClient(dataScheduleId, res);
  });
};

export const unregisterClient = (dataScheduleId: string, res: Response) => {
  const set = clients.get(dataScheduleId);
  if (!set) return;
  set.delete(res);
  if (set.size === 0) clients.delete(dataScheduleId);
};

export const emitProgress = (dataScheduleId: string, type: string, message: string, data: any = {}) => {
  const payload = { type, message, data, timestamp: new Date().toISOString() };
  const set = clients.get(dataScheduleId);
  if (!set) return;
  const str = `data: ${JSON.stringify(payload)}\n\n`;
  for (const res of Array.from(set)) {
    try {
      res.write(str);
    } catch (e) {
      // ignore write errors
    }
  }
};

export default { registerClient, unregisterClient, emitProgress };
