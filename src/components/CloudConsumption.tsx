/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { getFirestoreUsageMetrics, UsageMetrics } from '../lib/db';
import { 
  Database, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle,
  Flame,
  Info,
  Server,
  CloudLightning,
  ShieldCheck,
  TrendingUp,
  FileCheck2
} from 'lucide-react';

interface CloudConsumptionProps {
  onForceRefreshCloud?: () => Promise<void>;
}

export default function CloudConsumption({ onForceRefreshCloud }: CloudConsumptionProps) {
  const [metrics, setMetrics] = useState<UsageMetrics | null>(() => {
    try {
      return getFirestoreUsageMetrics();
    } catch {
      return null;
    }
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (onForceRefreshCloud) {
        await onForceRefreshCloud();
      }
      setMetrics(getFirestoreUsageMetrics());
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    }
  };

  // Safe metrics references with defaults
  const reads = metrics?.reads ?? 0;
  const writes = metrics?.writes ?? 0;
  const deletes = metrics?.deletes ?? 0;
  const storagePercentage = metrics?.storage?.percentage ?? 0;
  const storageFormatted = metrics?.storage?.formatted ?? '0 B';

  const readLimit = 50000;
  const writeLimit = 20000;
  const deleteLimit = 20000;

  const readPercentage = Math.min((reads / readLimit) * 100, 100);
  const writePercentage = Math.min((writes / writeLimit) * 100, 100);
  const deletePercentage = Math.min((deletes / deleteLimit) * 100, 100);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-1">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white tracking-wider uppercase flex items-center gap-2">
            <Database className="text-emerald-400 shrink-0" size={20} />
            Métricas de Consumo da Nuvem (Firebase)
          </h1>
          <p className="text-xs text-slate-400">
            Acompanhe o tráfego do banco de dados na nuvem e o consumo dentro do limite diário sem custos.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/15 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
          {isRefreshing ? 'Atualizando...' : 'Atualizar Consumo'}
        </button>
      </div>

      {/* Main Status Callout */}
      <div className="bg-[#161B22] border border-emerald-500/10 rounded-2xl p-4 md:p-6 flex flex-col md:flex-row items-center gap-4 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full filter blur-xl translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
        
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
          <ShieldCheck size={24} />
        </div>
        
        <div className="text-center md:text-left space-y-1">
          <h3 className="text-sm font-bold text-white uppercase tracking-wide">Plano Gratuito Diário do Google Firebase</h3>
          <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
            Sua aplicação opera em regime híbrido. Os dados locais são salvos no navegador para maior rapidez, e sincronizados com a nuvem do Administrador de forma integrada. O Google oferece um limite robusto sem custos todos os dias (No Cost).
          </p>
        </div>
      </div>

      {/* Bento Grid containing detailed stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Readings Card */}
        <div className="bg-[#161B22] border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Leituras (Reads)</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold font-mono">
              {readPercentage.toFixed(1)}%
            </span>
          </div>
          <div>
            <span className="text-2xl font-black text-white font-mono">{reads.toLocaleString()}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Limite Diário: {readLimit.toLocaleString()}</span>
          </div>
          <div className="space-y-1.5">
            <div className="w-full h-2 bg-slate-900 border border-slate-850 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${readPercentage}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              Contabiliza quando dados de serviços e caixas são pesquisados na nuvem.
            </p>
          </div>
        </div>

        {/* Writings Card */}
        <div className="bg-[#161B22] border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Gravações (Writes)</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold font-mono">
              {writePercentage.toFixed(1)}%
            </span>
          </div>
          <div>
            <span className="text-2xl font-black text-white font-mono">{writes.toLocaleString()}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Limite Diário: {writeLimit.toLocaleString()}</span>
          </div>
          <div className="space-y-1.5">
            <div className="w-full h-2 bg-slate-900 border border-slate-850 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${writePercentage}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              Contabiliza quando novos registros são salvos ou atualizados na sincronização.
            </p>
          </div>
        </div>

        {/* Deletes Card */}
        <div className="bg-[#161B22] border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Exclusões (Deletes)</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold font-mono">
              {deletePercentage.toFixed(1)}%
            </span>
          </div>
          <div>
            <span className="text-2xl font-black text-white font-mono">{deletes.toLocaleString()}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Limite Diário: {deleteLimit.toLocaleString()}</span>
          </div>
          <div className="space-y-1.5">
            <div className="w-full h-2 bg-slate-900 border border-slate-850 rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${deletePercentage}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              Ocorre ao revogar usuários, rejeitar leads do site ou remover lançamentos.
            </p>
          </div>
        </div>

        {/* Storage Card */}
        <div className="bg-[#161B22] border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Armazenamento</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold font-mono">
              {storagePercentage.toFixed(4)}%
            </span>
          </div>
          <div>
            <span className="text-2xl font-black text-white font-mono">{storageFormatted}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Limite Total: 1.00 GB</span>
          </div>
          <div className="space-y-1.5">
            <div className="w-full h-2 bg-slate-900 border border-slate-850 rounded-full overflow-hidden">
              <div 
                className="h-full bg-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${storagePercentage}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              Peso físico dos dados do ConsulDesp guardados de forma durável na nuvem.
            </p>
          </div>
        </div>
      </div>

      {/* Technical information and helpful guidelines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info Column 1 */}
        <div className="bg-[#161B22] border border-slate-800 rounded-2xl p-5 space-y-3.5 shadow-sm">
          <div className="flex items-center gap-2.5 text-emerald-400">
            <Info size={16} />
            <h4 className="text-xs font-black uppercase tracking-wider text-white">Como Funciona a Cota?</h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            As cotas do Google Firebase são renovadas diariamente à meia-noite (fuso horário do servidor da nuvem). Se algum limite de cota gratuito diário for atingido, o sistema local continuará operando normalmente em modo offline no computador. A nuvem se restabelecerá de forma automática no dia seguinte sem custos adicionais.
          </p>
        </div>

        {/* Info Column 2 */}
        <div className="bg-[#161B22] border border-slate-800 rounded-2xl p-5 space-y-3.5 shadow-sm">
          <div className="flex items-center gap-2.5 text-blue-400">
            <Server size={16} />
            <h4 className="text-xs font-black uppercase tracking-wider text-white">Otimização Inteligente</h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            O ConsulDesp Financeiro foi arquitetado para poupar recursos na nuvem. Em vez de salvar cada alteração diretamente na nuvem de forma imediata (gerando picos de tráfego), o sistema usa inteligência híbrida. Os dados são agrupados e transmitidos de forma segura, o que reduz o número de operações em até 95%.
          </p>
        </div>

        {/* Info Column 3 */}
        <div className="bg-[#161B22] border border-slate-800 rounded-2xl p-5 space-y-3.5 shadow-sm">
          <div className="flex items-center gap-2.5 text-amber-400">
            <CloudLightning size={16} />
            <h4 className="text-xs font-black uppercase tracking-wider text-white">Segurança Confiável</h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Todas as métricas listadas representam o uso coletivo de todos os operadores conectados sob as regras de segurança do banco. Apenas administradores autenticados têm autorização expressa para inspecionar os logs de consumo e as estatísticas gerais do banco Firestore.
          </p>
        </div>
      </div>
    </div>
  );
}
