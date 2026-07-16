/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { InternalUser } from '../types';
import { 
  Users, 
  RefreshCw, 
  Search, 
  Shield, 
  User as UserIcon, 
  Activity, 
  Clock, 
  CheckCircle2, 
  KeyRound
} from 'lucide-react';

interface ConnectedOperatorsProps {
  users: InternalUser[];
  onForceRefreshCloud?: () => Promise<void>;
}

export default function ConnectedOperators({ users, onForceRefreshCloud }: ConnectedOperatorsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'TODOS' | 'ADMIN' | 'OPERADOR'>('TODOS');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'ONLINE' | 'OFFLINE'>('ONLINE'); // Default to online
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (onForceRefreshCloud) {
      await onForceRefreshCloud();
    }
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  // Filter users based on search, role, and online status
  const filteredUsers = users.filter(user => {
    const isOnline = !!user.currentSessionId;
    const isAdmin = user.username === 'joao.desp';
    
    const matchesSearch = 
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesRole = 
      roleFilter === 'TODOS' || 
      (roleFilter === 'ADMIN' && isAdmin) || 
      (roleFilter === 'OPERADOR' && !isAdmin);

    const matchesStatus = 
      statusFilter === 'TODOS' || 
      (statusFilter === 'ONLINE' && isOnline) || 
      (statusFilter === 'OFFLINE' && !isOnline);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalUsersCount = users.length;
  const onlineUsers = users.filter(u => u.currentSessionId);
  const onlineCount = onlineUsers.length;
  const offlineCount = totalUsersCount - onlineCount;
  const adminCount = users.filter(u => u.username === 'joao.desp').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-1">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white tracking-wider uppercase flex items-center gap-2">
            <Users className="text-emerald-400 shrink-0" size={20} />
            Controle de Operadores Conectados
          </h1>
          <p className="text-xs text-slate-400">
            Monitore em tempo real quais operadores estão com sessões ativas no sistema de despacho.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/15 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
          {isRefreshing ? 'Atualizando...' : 'Atualizar Operadores'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="bg-[#161B22] border border-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
            <Users size={18} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Cadastrados</span>
            <span className="text-xl font-black text-white">{totalUsersCount}</span>
          </div>
        </div>

        {/* Online Count */}
        <div className="bg-[#161B22] border border-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 animate-pulse">
            <Activity size={18} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Online Agora</span>
            <span className="text-xl font-black text-emerald-400">{onlineCount}</span>
          </div>
        </div>

        {/* Offline Count */}
        <div className="bg-[#161B22] border border-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
            <Clock size={18} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Offline</span>
            <span className="text-xl font-black text-slate-300">{offlineCount}</span>
          </div>
        </div>

        {/* Admin Count */}
        <div className="bg-[#161B22] border border-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Shield size={18} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Administradores</span>
            <span className="text-xl font-black text-purple-400">{adminCount}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#161B22] border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3 shadow-inner">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Pesquisar operadores por nome ou login..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0F1115] border border-slate-800 focus:border-emerald-500/50 rounded-xl py-2.5 pl-11 pr-4 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none transition-colors"
          />
        </div>

        {/* Filter Status */}
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-[#0F1115] border border-slate-800 focus:border-emerald-500/50 rounded-xl px-4 py-2 text-xs font-bold text-slate-300 focus:outline-none transition-colors cursor-pointer"
          >
            <option value="TODOS">Todos os Status</option>
            <option value="ONLINE">Apenas Online</option>
            <option value="OFFLINE">Apenas Offline</option>
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="bg-[#0F1115] border border-slate-800 focus:border-emerald-500/50 rounded-xl px-4 py-2 text-xs font-bold text-slate-300 focus:outline-none transition-colors cursor-pointer"
          >
            <option value="TODOS">Todas as Funções</option>
            <option value="ADMIN">Administradores</option>
            <option value="OPERADOR">Operadores</option>
          </select>
        </div>
      </div>

      {/* Operators Grid/List Layout */}
      <div className="bg-[#161B22] border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {filteredUsers.length === 0 ? (
          <div className="py-12 text-center text-slate-500 space-y-2">
            <UserIcon size={32} className="mx-auto text-slate-600" />
            <p className="text-xs font-bold">Nenhum operador corresponde aos filtros aplicados.</p>
            <p className="text-[10px] text-slate-600">Altere a busca ou redefina o filtro de status para ver outros usuários.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-850">
            {filteredUsers.map(user => {
              const isOnline = !!user.currentSessionId;
              const isAdmin = user.username === 'joao.desp';
              
              return (
                <div key={user.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-900/30 transition-colors">
                  <div className="flex items-start sm:items-center gap-3.5">
                    {/* Status Orb Indicator */}
                    <div className="relative shrink-0 mt-1 sm:mt-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
                        {isAdmin ? <Shield size={18} className="text-purple-400" /> : <UserIcon size={18} className="text-emerald-400" />}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#161B22] flex items-center justify-center ${
                        isOnline ? 'bg-emerald-500' : 'bg-slate-600'
                      }`}>
                        {isOnline && <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping" />}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-xs sm:text-sm">{user.fullName}</span>
                        
                        <span className={`text-[7.5px] px-1.5 py-0.5 font-black rounded uppercase tracking-wider ${
                          isAdmin 
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {isAdmin ? 'Admin' : 'Operador'}
                        </span>

                        <span className={`text-[7.5px] px-1.5 py-0.5 font-bold rounded-md ${
                          isOnline 
                            ? 'bg-emerald-500/15 text-emerald-400' 
                            : 'bg-slate-800 text-slate-500'
                        }`}>
                          {isOnline ? 'CONECTADO' : 'OFFLINE'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-x-4 gap-y-1 flex-wrap mt-1 text-[10px] text-slate-500 font-mono">
                        <span className="flex items-center gap-1">
                          <KeyRound size={11} className="text-slate-600" />
                          Usuário: <strong className="text-slate-400">{user.username}</strong>
                        </span>
                        {isOnline && (
                          <span className="flex items-center gap-1">
                            <CheckCircle2 size={11} className="text-emerald-500/60" />
                            Sessão ativa detectada
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {isOnline ? (
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        <span>SESSÃO ATIVA</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-600 font-medium font-mono">
                        Nenhuma sessão recente
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
