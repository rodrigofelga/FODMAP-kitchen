import { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from './store';
import type { SharedListRef } from './appData';
import type { ListOp } from './listModel';
import { ApiError, effectiveDoc, fetchList, isOffline, sendOps, wsUrl, type MemberInfo, type ServerView } from './sync';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

/**
 * Keeps one shared list in sync:
 *  - every change is applied here at once and queued (saved with the rest of
 *    the app data, so it survives closing the app while offline);
 *  - the queue is sent to the server, which applies changes in arrival order;
 *  - the server pushes the new state to every device over a WebSocket
 *    (with periodic refresh as a fallback).
 */
export function useSharedList(listId: string) {
  const { profile, updateProfile } = useStore();
  const ref = profile.sharedLists.find((r) => r.listId === listId);
  const [status, setStatus] = useState<SyncStatus>('syncing');
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [invite, setInvite] = useState<ServerView['invite']>();
  const [connected, setConnected] = useState(false);
  const latest = useRef<SharedListRef | undefined>(ref);
  const flushing = useRef(false);

  useEffect(() => {
    latest.current = ref;
  });

  const patch = useCallback(
    (fn: (r: SharedListRef) => SharedListRef) => updateProfile((p) => ({ ...p, sharedLists: p.sharedLists.map((r) => (r.listId === listId ? fn(r) : r)) })),
    [listId, updateProfile],
  );

  const applyView = useCallback(
    (v: ServerView, confirmed?: Set<string>) => {
      patch((r) => ({
        ...r,
        doc: v.version >= r.version ? v.doc : r.doc,
        version: Math.max(v.version, r.version),
        pending: confirmed ? r.pending.filter((o) => !confirmed.has(o.opId)) : r.pending,
        status: 'active',
      }));
      setMembers(v.members);
      if (v.invite) setInvite(v.invite);
    },
    [patch],
  );

  const handleError = useCallback(
    (e: unknown) => {
      if (e instanceof ApiError && e.status === 403) patch((r) => ({ ...r, status: 'revoked' }));
      else if (e instanceof ApiError && e.status === 404) patch((r) => ({ ...r, status: 'gone' }));
      else setStatus(isOffline(e) ? 'offline' : 'error');
    },
    [patch],
  );

  const flush = useCallback(async () => {
    const r = latest.current;
    if (flushing.current || !r || r.status !== 'active' || !r.pending.length) return;
    flushing.current = true;
    const ops = r.pending.slice(0, 200);
    setStatus('syncing');
    try {
      const v = await sendOps(r, ops);
      applyView(v, new Set(ops.map((o) => o.opId)));
      setStatus('synced');
    } catch (e) {
      handleError(e);
    } finally {
      flushing.current = false;
    }
  }, [applyView, handleError]);

  const refresh = useCallback(async () => {
    const r = latest.current;
    if (!r || r.status !== 'active') return;
    try {
      applyView(await fetchList(r));
      if (!latest.current?.pending.length) setStatus('synced');
    } catch (e) {
      handleError(e);
    }
  }, [applyView, handleError]);

  const pendingCount = ref?.pending.length ?? 0;
  const active = ref?.status === 'active';

  // Send queued changes whenever there are some (and after reconnecting).
  useEffect(() => {
    if (!active || !pendingCount) return;
    const t = setTimeout(flush, 0);
    return () => clearTimeout(t);
  }, [active, pendingCount, flush, connected]);

  // Live updates.
  useEffect(() => {
    if (!active) return;
    let ws: WebSocket | null = null;
    let stopped = false;
    let retry = 1000;
    let reconnect: ReturnType<typeof setTimeout> | undefined;
    let ping: ReturnType<typeof setInterval> | undefined;
    const connect = () => {
      if (stopped) return;
      try {
        ws = new WebSocket(wsUrl(listId));
      } catch {
        return;
      }
      ws.onopen = () => {
        retry = 1000;
        ws?.send(JSON.stringify({ type: 'auth', token: latest.current?.token }));
        ping = setInterval(() => ws?.readyState === WebSocket.OPEN && ws.send('ping'), 25_000);
      };
      ws.onmessage = (ev) => {
        if (typeof ev.data !== 'string' || ev.data === 'pong') return;
        try {
          const msg = JSON.parse(ev.data) as ServerView & { type: string };
          if (msg.type === 'state') {
            applyView(msg);
            setConnected(true);
            if (!latest.current?.pending.length) setStatus('synced');
          }
        } catch {
          // ignore malformed messages
        }
      };
      ws.onclose = (ev) => {
        clearInterval(ping);
        setConnected(false);
        if (stopped) return;
        if (ev.code === 4003) return patch((r) => ({ ...r, status: 'revoked' }));
        if (ev.code === 4004) return patch((r) => ({ ...r, status: 'gone' }));
        if (!navigator.onLine) setStatus('offline');
        reconnect = setTimeout(connect, retry);
        retry = Math.min(retry * 2, 30_000);
      };
    };
    connect();
    const online = () => {
      retry = 1000;
      void flush();
      void refresh();
      if (!ws || ws.readyState === WebSocket.CLOSED) {
        clearTimeout(reconnect);
        connect();
      }
    };
    const offline = () => setStatus('offline');
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    // Retries unsent changes every few seconds, and refreshes every 15 s if WebSockets are blocked on the network.
    let ticks = 0;
    const poll = setInterval(() => {
      ticks++;
      if (latest.current?.pending.length) void flush();
      else if (ticks % 3 === 0 && document.visibilityState === 'visible' && ws?.readyState !== WebSocket.OPEN) void refresh();
    }, 5_000);
    void refresh();
    return () => {
      stopped = true;
      clearTimeout(reconnect);
      clearInterval(ping);
      clearInterval(poll);
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
      ws?.close(1000, 'bye');
    };
  }, [active, listId, applyView, patch, refresh, flush]);

  const dispatch = useCallback((op: ListOp) => patch((r) => ({ ...r, pending: [...r.pending, op] })), [patch]);

  return {
    ref,
    doc: ref ? effectiveDoc(ref) : undefined,
    status: ref && ref.pending.length && status === 'synced' ? 'syncing' : status,
    members,
    invite,
    setInvite,
    setMembers,
    dispatch,
    refresh,
  };
}
