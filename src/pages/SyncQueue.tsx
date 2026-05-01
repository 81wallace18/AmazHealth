import { useEffect, useState } from 'react';
import { RefreshCw, AlertTriangle, XCircle } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { desktopBridge } from '@/lib/desktopBridge';
import type { OutboxEntry } from '@/services/sync';
import { Button } from '@/components/ui/button';

const REFRESH_MS = 4_000;

export default function SyncQueue() {
  const desktop = desktopBridge.isAvailable();
  const [entries, setEntries] = useState<OutboxEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function load() {
    if (!desktop) return;
    try {
      const list = await apiClient.outboxList();
      setEntries(list);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const id = window.setInterval(load, REFRESH_MS);
    return () => window.clearInterval(id);
  }, [desktop]);

  async function syncNow() {
    setBusy(true);
    try {
      await apiClient.syncNow();
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (!desktop) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Fila de sincronização</h1>
        <p className="mt-2 text-muted-foreground">
          Disponível apenas no aplicativo desktop. Em ambiente web puro todas as ações são aplicadas online imediatamente.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Fila de sincronização</h1>
        <Button onClick={syncNow} disabled={busy} size="sm">
          <RefreshCw className={`mr-2 h-4 w-4 ${busy ? 'animate-spin' : ''}`} />
          Sincronizar agora
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Carregando…</p>
      ) : entries.length === 0 ? (
        <p className="text-muted-foreground">Nenhuma operação pendente.</p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <QueueRow key={entry.client_uuid} entry={entry} onUpdate={load} />
          ))}
        </div>
      )}
    </div>
  );
}

function QueueRow({ entry, onUpdate }: { entry: OutboxEntry; onUpdate: () => void }) {
  const [busy, setBusy] = useState(false);

  async function retry() {
    setBusy(true);
    try {
      await apiClient.syncNow();
      onUpdate();
    } finally {
      setBusy(false);
    }
  }

  const Icon = entry.status === 'CONFLICT' ? AlertTriangle : entry.status === 'REJECTED' ? XCircle : RefreshCw;
  const color =
    entry.status === 'CONFLICT' ? 'text-red-600'
    : entry.status === 'REJECTED' ? 'text-red-700'
    : 'text-amber-600';

  return (
    <div className="flex items-start gap-3 rounded-lg border p-3 hover:bg-muted/30">
      <Icon className={`mt-0.5 h-5 w-5 ${color}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium">{entry.operation_type}</span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{entry.status}</span>
          {entry.attempts > 0 && (
            <span className="text-xs text-muted-foreground">{entry.attempts} tentativas</span>
          )}
        </div>
        <div className="mt-1 truncate text-xs text-muted-foreground">
          {entry.client_uuid} · criado em {new Date(entry.client_created_at).toLocaleString('pt-BR')}
        </div>
        {entry.last_error && (
          <p className="mt-1 text-xs text-red-700 break-words">{entry.last_error}</p>
        )}
      </div>
      {(entry.status === 'PENDING' || entry.status === 'CONFLICT' || entry.status === 'REJECTED') && (
        <Button variant="outline" size="sm" onClick={retry} disabled={busy}>
          Tentar novamente
        </Button>
      )}
    </div>
  );
}
