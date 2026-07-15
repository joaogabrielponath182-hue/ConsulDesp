/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import SystemLogo from './SystemLogo';
import { 
  Building2, 
  LayoutDashboard, 
  FileCheck, 
  Layers, 
  DollarSign, 
  BarChart3, 
  Download, 
  Upload,
  Coins,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  Loader2,
  Users,
  LogOut,
  HelpCircle,
  Database,
  RefreshCw,
  MessageSquare
} from 'lucide-react';
import { motion } from 'motion/react';
import { User } from 'firebase/auth';
import { Service, Expense, SubCategory, UserSession, Client, InternalUser, PersonalExpense, Lead } from '../types';
import { getFirestoreUsageMetrics, UsageMetrics } from '../lib/db';


interface SidebarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  // Backup / Restore handlers
  services: Service[];
  expenses: Expense[];
  subCategories: SubCategory[];
  clients: Client[];
  internalUsers: InternalUser[];
  personalExpenses: PersonalExpense[];
  onImportData: (data: { 
    services: Service[]; 
    expenses: Expense[]; 
    subCategories: SubCategory[];
    clients?: Client[];
    internalUsers?: InternalUser[];
    personalExpenses?: PersonalExpense[];
  }) => void;
  currentUser: User | null;
  onOpenAuthModal: () => void;
  isCloudLoading: boolean;
  currentSession: UserSession | null;
  onLogoutInternalSession: () => void;
  isCloudConnected: boolean;
  autoBackupFileName: string | null;
  onConfigureAutoBackup: () => void;
  onDisableAutoBackup: () => void;
}

export default function Sidebar({
  currentTab,
  onNavigate,
  services,
  expenses,
  subCategories,
  clients,
  internalUsers,
  personalExpenses,
  onImportData,
  currentUser,
  onOpenAuthModal,
  isCloudLoading,
  currentSession,
  onLogoutInternalSession,
  isCloudConnected,
  autoBackupFileName,
  onConfigureAutoBackup,
  onDisableAutoBackup
}: SidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isReportsExpanded, setIsReportsExpanded] = useState(currentTab.startsWith('reports'));
  const [isConfirmingLogout, setIsConfirmingLogout] = useState(false);

  useEffect(() => {
    if (currentTab.startsWith('reports')) {
      setIsReportsExpanded(true);
    } else {
      setIsReportsExpanded(false);
    }
  }, [currentTab]);

  const [metrics, setMetrics] = useState<UsageMetrics | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const loggedInUsers = internalUsers.filter(u => u.currentSessionId);
  const [isCloudMetricsExpanded, setIsCloudMetricsExpanded] = useState(() => {
    try {
      const stored = localStorage.getItem('dep_cloud_metrics_expanded');
      return stored !== 'false'; // defaults to true
    } catch {
      return true;
    }
  });

  const toggleCloudMetrics = () => {
    setIsCloudMetricsExpanded(prev => {
      const newVal = !prev;
      try {
        localStorage.setItem('dep_cloud_metrics_expanded', String(newVal));
      } catch (err) {
        console.error(err);
      }
      return newVal;
    });
  };

  const handleRefreshMetrics = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setMetrics(getFirestoreUsageMetrics());
      setIsRefreshing(false);
    }, 400);
  };

  useEffect(() => {
    if (currentSession?.isAdmin) {
      setMetrics(getFirestoreUsageMetrics());
    }
  }, [currentSession, services, expenses, subCategories, clients, internalUsers, personalExpenses]);

  const menuItems = [
    { id: 'dashboard', name: 'Painel Geral', icon: LayoutDashboard },
    { id: 'services', name: 'Serviços (Receitas)', icon: FileCheck },
    { id: 'expenses', name: 'Registro de Gastos', icon: DollarSign },
    { id: 'subcategories', name: 'Subcategorias', icon: Layers },
    { id: 'clients', name: 'Cadastro de Clientes', icon: Users },
    { 
      id: 'reports', 
      name: 'Relatórios', 
      icon: BarChart3,
      children: [
        { id: 'reports-general', name: 'Relatório Geral' },
        { id: 'reports-services', name: 'Relatório de Serviços' },
        { id: 'reports-expenses', name: 'Relatório de Saídas' },
        { id: 'reports-comparative', name: 'Relatório Comparativo' }
      ]
    },
    ...(currentSession?.isAdmin ? [
      { id: 'usermanagement', name: 'Controle de Usuários', icon: ShieldCheck },
      { id: 'leads', name: 'Leads do Site', icon: MessageSquare }
    ] : [])
  ];

  // Export JSON Database
  const handleExportData = () => {
    const dataStr = JSON.stringify({ 
      services, 
      expenses, 
      subCategories,
      clients,
      internalUsers,
      personalExpenses
    }, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `gestao_financeira_despachante_backup_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Import JSON Database
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const files = e.target.files;
    if (!files || files.length === 0) return;

    fileReader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && (parsed.services || parsed.expenses || parsed.subCategories)) {
          onImportData({
            services: parsed.services || [],
            expenses: parsed.expenses || [],
            subCategories: parsed.subCategories || [],
            clients: parsed.clients || [],
            internalUsers: parsed.internalUsers || [],
            personalExpenses: parsed.personalExpenses || []
          });
          alert('Backup importado com sucesso!');
        } else {
          alert('Arquivo de backup inválido.');
        }
      } catch (err) {
        alert('Erro ao processar arquivo de backup JSON.');
      }
    };
    fileReader.readAsText(files[0]);
  };

  return (
    <div className="w-full lg:w-68 bg-[#161B22] text-slate-300 flex flex-col justify-between py-6 px-4 border-r border-slate-800 shadow-xl shrink-0 h-full">
      <div className="space-y-6">
        {/* Workspace Brand Group */}
        <div className="flex items-center gap-3.5 px-2">
          <div className="w-10 h-10 bg-slate-900/30 dark:bg-slate-950/40 rounded-xl border border-slate-800/30 dark:border-slate-800/80 shadow-inner flex items-center justify-center overflow-hidden">
            <SystemLogo size={40} className="border-none rounded-xl" />
          </div>
          <div className="leading-tight min-w-0">
            <h2 className="text-xs font-black text-white tracking-wide uppercase">ConsulDesp Financeiro</h2>
            <span 
              className="text-[10px] text-emerald-400 font-bold block truncate max-w-[140px]"
              title={currentSession?.fullName || 'Operador'}
            >
              👤 {currentSession?.fullName || 'Operador'}
            </span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="space-y-1.5">
          <span className="text-[9px] font-bold text-slate-500 px-2 uppercase tracking-widest block mb-1">
            Menu Operacional
          </span>
          {menuItems.map(item => {
            const Icon = item.icon;
            const hasChildren = !!item.children;
            const isParentActive = currentTab === item.id || (hasChildren && currentTab.startsWith('reports'));
            const isChildOpen = hasChildren && isReportsExpanded;

            return (
              <div key={item.id} className="space-y-1">
                {/* Consumo de Nuvem Widget (Only for Administrator right above Manual & Ajuda) */}
                <button
                  type="button"
                  onClick={() => {
                    if (hasChildren && item.id === 'reports') {
                      setIsReportsExpanded(prev => !prev);
                    } else {
                      onNavigate(item.id);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                    isParentActive 
                      ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-600/20 shadow-inner' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} className={isParentActive ? 'text-emerald-400' : 'text-slate-500'} />
                    <span>{item.name}</span>
                  </div>
                  {isParentActive && !hasChildren && <ChevronRight size={12} className="text-emerald-505" />}
                  {hasChildren && (
                    <ChevronDown 
                      size={12} 
                      className={`text-slate-500 transition-transform duration-200 ${isChildOpen ? 'rotate-180 text-emerald-400' : ''}`} 
                    />
                  )}
                </button>

                {/* Consumo de Nuvem Widget (Only for Administrator right below Controle de Usuários) */}
                {item.id === 'usermanagement' && metrics && (
                  <div className="mx-1 my-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Database size={12} className="text-emerald-400" />
                        <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">CONSUMO DE NUVEM</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={handleRefreshMetrics}
                          disabled={isRefreshing}
                          className="p-1 rounded bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                          title="Atualizar estatísticas de uso localmente"
                        >
                          <RefreshCw size={10} className={isRefreshing ? 'animate-spin text-emerald-400' : ''} />
                        </button>
                        <button
                          type="button"
                          onClick={toggleCloudMetrics}
                          className="p-1 rounded bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                          title={isCloudMetricsExpanded ? "Recolher informações" : "Expandir informações"}
                        >
                          <ChevronDown 
                            size={12} 
                            className={`transform transition-transform duration-200 ${isCloudMetricsExpanded ? 'rotate-180 text-emerald-400' : ''}`} 
                          />
                        </button>
                      </div>
                    </div>

                    {/* Permanent logged-in users counter */}
                    <div className="flex items-center justify-between px-2 py-1.5 bg-slate-950/60 rounded-lg border border-slate-800/40 text-[10px]">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Users size={11} className="text-emerald-400 shrink-0 animate-pulse" />
                        <span className="font-bold uppercase tracking-wide text-slate-400 text-[9px]">Usuários Online</span>
                      </div>
                      <span className="font-mono text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" />
                        {loggedInUsers.length}
                      </span>
                    </div>

                    {isCloudMetricsExpanded && (
                      <>
                        <div className="space-y-2 text-[10px]">
                          {/* Reads */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-slate-400">
                              <span className="font-medium">Leituras (Reads)</span>
                              <span className="font-mono text-[9px] text-slate-300">
                                {metrics.reads.toLocaleString()} / 50k
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-slate-850 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-emerald-500 rounded-full transition-all duration-300" 
                                  style={{ width: `${Math.min((metrics.reads / 50000) * 100, 100)}%` }}
                                />
                              </div>
                              <span className="font-mono text-[9px] w-12 text-right text-emerald-400 font-bold">
                                {((metrics.reads / 50000) * 100).toFixed(2)}%
                              </span>
                            </div>
                          </div>

                          {/* Writes */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-slate-400">
                              <span className="font-medium">Gravações (Writes)</span>
                              <span className="font-mono text-[9px] text-slate-300">
                                {metrics.writes.toLocaleString()} / 20k
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-slate-850 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-blue-500 rounded-full transition-all duration-300" 
                                  style={{ width: `${Math.min((metrics.writes / 20000) * 100, 100)}%` }}
                                />
                              </div>
                              <span className="font-mono text-[9px] w-12 text-right text-blue-400 font-bold">
                                {((metrics.writes / 20000) * 100).toFixed(2)}%
                              </span>
                            </div>
                          </div>

                          {/* Deletes */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-slate-400">
                              <span className="font-medium">Exclusões (Deletes)</span>
                              <span className="font-mono text-[9px] text-slate-300">
                                {metrics.deletes.toLocaleString()} / 20k
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-slate-850 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-amber-500 rounded-full transition-all duration-300" 
                                  style={{ width: `${Math.min((metrics.deletes / 20000) * 100, 100)}%` }}
                                />
                              </div>
                              <span className="font-mono text-[9px] w-12 text-right text-amber-400 font-bold">
                                {((metrics.deletes / 20000) * 100).toFixed(2)}%
                              </span>
                            </div>
                          </div>

                          {/* Storage */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-slate-400">
                              <span className="font-medium">Armazenamento</span>
                              <span className="font-mono text-[9px] text-slate-300">
                                {metrics.storage.formatted} / 1 GB
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-slate-850 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-purple-500 rounded-full transition-all duration-300" 
                                  style={{ width: `${metrics.storage.percentage}%` }}
                                />
                              </div>
                              <span className="font-mono text-[9px] w-12 text-right text-purple-400 font-bold">
                                {metrics.storage.percentage.toFixed(4)}%
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Logged in users list */}
                        <div className="pt-2.5 border-t border-slate-800/40 space-y-1.5">
                          <div className="flex items-center justify-between text-slate-400">
                            <span className="font-bold text-[9px] uppercase tracking-wider text-slate-400">Lista de Operadores</span>
                          </div>
                          {loggedInUsers.length === 0 ? (
                            <div className="text-[9px] text-slate-500 italic py-1 text-center bg-slate-950/20 rounded">
                              Nenhum usuário online
                            </div>
                          ) : (
                            <div className="max-h-[90px] overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
                              {loggedInUsers.map(u => {
                                const isAdmin = u.username === 'joao.desp';
                                return (
                                  <div key={u.id} className="flex items-center justify-between p-1 px-1.5 bg-slate-950/40 rounded border border-slate-900/60 hover:bg-slate-950/70 transition-colors">
                                    <div className="flex items-center gap-1.5 truncate max-w-[125px]">
                                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                                      <span className="truncate text-slate-300 font-semibold text-[9.5px]">{u.fullName}</span>
                                    </div>
                                    <span className={`text-[7px] px-1 font-extrabold rounded uppercase shrink-0 ${
                                      isAdmin 
                                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
                                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    }`}>
                                      {isAdmin ? 'Admin' : 'Operador'}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <div className="text-[8px] text-slate-500 leading-tight text-center pt-1.5 border-t border-slate-800/50">
                          Limite Gratuito Diário (No Cost)
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Submenu rendering */}
                {hasChildren && isChildOpen && item.children && (
                  <div className="pl-3.5 space-y-1 mt-1 border-l border-slate-800 ml-5 animate-fadeIn">
                    {item.children.map(child => {
                      const isChildActive = currentTab === child.id;
                      return (
                        <button
                          key={child.id}
                          onClick={() => onNavigate(child.id)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[11px] font-medium tracking-wide transition-all duration-150 cursor-pointer ${
                            isChildActive
                              ? 'bg-emerald-600/10 text-emerald-300 border border-emerald-600/10'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                          }`}
                        >
                          <span>{child.name}</span>
                          {isChildActive && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Safety Backups Section */}
      <div className="space-y-4 border-t border-slate-800 pt-5 mt-6">
        <span className="text-[9px] font-bold text-slate-500 px-2 uppercase tracking-widest block">
          Backup de Segurança
        </span>

        <div className="grid grid-cols-2 gap-2 px-1">
          {/* Export button */}
          <button
            onClick={handleExportData}
            className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#0F1115] hover:bg-slate-800 hover:text-white border border-slate-800 text-[10px] font-bold cursor-pointer transition-all text-slate-300"
            title="Salvar cópia do banco local no computador"
          >
            <Download size={11} className="text-emerald-500" />
            Exportar
          </button>

          {/* Import trigger */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#0F1115] hover:bg-slate-800 hover:text-white border border-slate-800 text-[10px] font-bold cursor-pointer transition-all text-slate-300"
            title="Fazer upload de um arquivo de backup salvo"
          >
            <Upload size={11} className="text-slate-400" />
            Importar
          </button>
        </div>

        {/* Auto-Backup Panel widget */}
        <div className="bg-[#0F1115] border border-slate-850 rounded-xl p-2.5 mt-2 space-y-2 select-none">
          <div className="flex items-center justify-between text-[9px] font-bold">
            <span className="text-slate-400">🕒 AUTO-BACKUP (16:35)</span>
            <span className={`px-1.5 py-0.5 rounded-[4px] text-[7.5px] font-black uppercase ${
              autoBackupFileName 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                : 'bg-slate-800 text-slate-500'
            }`}>
              {autoBackupFileName ? 'Ativo' : 'Inativo'}
            </span>
          </div>

          {autoBackupFileName ? (
            <div className="space-y-1.5">
              <p className="text-[10px] font-mono text-emerald-400 truncate" title={autoBackupFileName}>
                📁 {autoBackupFileName}
              </p>
              <div className="flex gap-1.5">
                <button
                  onClick={onConfigureAutoBackup}
                  className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 hover:text-white text-[9px] font-bold cursor-pointer transition-all text-slate-300"
                  title="Alterar o arquivo de auto-backup"
                >
                  Alterar
                </button>
                <button
                  onClick={onDisableAutoBackup}
                  className="px-2 py-1.5 rounded-lg bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 text-[9px] font-bold cursor-pointer transition-all"
                  title="Desativar o auto-backup"
                >
                  Desligar
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <p className="text-[8.5px] text-slate-500 leading-normal">
                Grave e substitua o arquivo de backup automaticamente todos os dias às 16:35.
              </p>
              <button
                onClick={onConfigureAutoBackup}
                className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-extrabold uppercase tracking-wide cursor-pointer transition-all active:scale-[0.98]"
              >
                Ativar Auto-Backup
              </button>
            </div>
          )}
        </div>

        {/* Invisible file upload tag */}
        <input 
          ref={fileInputRef}
          type="file" 
          accept=".json" 
          onChange={handleImportData}
          className="hidden" 
        />

        {/* Footer info lockup */}
        <div 
          onClick={onOpenAuthModal}
          className="bg-slate-800/20 hover:bg-slate-800/40 p-2.5 rounded-xl border border-slate-850 hover:border-slate-700 mt-2 space-y-1 cursor-pointer transition-all active:scale-[0.98]"
          title="Clique para gerenciar a Sincronização na Nuvem"
        >
          <div className="flex items-center justify-between text-[10px] font-medium">
            {isCloudConnected ? (
              <div className="flex items-center gap-1.5 text-emerald-400">
                <ShieldCheck size={11} className="shrink-0 animate-pulse" />
                <span className="truncate max-w-[110px]">Nuvem Conectada</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-amber-500">
                <ShieldCheck size={11} className="shrink-0" />
                <span>Nuvem Desconectada</span>
              </div>
            )}
            
            {isCloudLoading ? (
              <Loader2 size={10} className="animate-spin text-emerald-500" />
            ) : (
              <div className={`w-1.5 h-1.5 rounded-full ${isCloudConnected ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' : 'bg-amber-500'}`} />
            )}
          </div>
          
          <div className="text-[9px] text-slate-500 leading-normal flex items-center justify-between">
            <span>{isCloudConnected ? 'Nuvem do Administrador ativa' : 'Clique para conectar'}</span>
            <span className="font-mono text-[8px] bg-[#0F1115] px-1 rounded border border-slate-800 text-slate-400">Firebase</span>
          </div>
        </div>
      </div>
    </div>
  );
}
