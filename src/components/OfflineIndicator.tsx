import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus.ts';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <aside
      aria-label="Offline network notification"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-amber-500/95 backdrop-blur-md px-3.5 py-2 text-xs font-semibold text-slate-950 shadow-2xl border border-amber-400/40 animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      <WifiOff className="w-4 h-4 shrink-0 text-slate-950" />
      <span>Lecture Hall Offline Mode: App is running from offline cache.</span>
    </aside>
  );
};
