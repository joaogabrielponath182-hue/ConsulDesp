import React from 'react';
import { InternalUser } from '../types';
import { Users, Wifi, RefreshCw, ShieldAlert, Laptop, Clock, LogOut } from 'lucide-react';

interface ConnectedOperatorsProps {
  users: InternalUser[];
  onForceRefreshCloud: () => Promise<void> | void;
}

export default function ConnectedOperators({ users, onForceRefreshCloud }: ConnectedOperatorsProps) {
  const activeUsers = users.filter((u) => u.currentSessionId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Wifi className="w-6 h-6 text-emerald-400" />
            <span>Operadores Conectados e Monitoramento de Sessões</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Veja em tempo real quais operadores estão online no sistema e gerencie logins concorrentes.
          </p>
        </div>

        <button
          onClick={onForceRefreshCloud}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
          <span>Sincronizar com Nuvem</span>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Operadores Online</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-white">{activeUsers.length}</div>
          <div className="text-[11px] text-emerald-400">Com sessão ativa no momento</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total de Usuários</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-3xl font-black text-white">{users.length}</div>
          <div className="text-[11px] text-slate-400">Usuários cadastrados no banco</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Bloqueio Concorrente</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400">Ativado</div>
          <div className="text-[11px] text-slate-400">Previne login duplo com mesma conta</div>
        </div>
      </div>

      {/* Active Operators Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider text-[11px] text-slate-400">
          Lista de Sessões Conectadas
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3">Operador</th>
                <th className="p-3">Usuário</th>
                <th className="p-3">ID da Sessão</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.map((u) => {
                const isOnline = !!u.currentSessionId;
                return (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-bold text-white">{u.fullName}</td>
                    <td className="p-3 font-mono text-emerald-400">@{u.username}</td>
                    <td className="p-3 font-mono text-slate-400 text-[11px]">
                      {u.currentSessionId || '—'}
                    </td>
                    <td className="p-3">
                      {isOnline ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                          Conectado Agora
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400">
                          Desconectado
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
