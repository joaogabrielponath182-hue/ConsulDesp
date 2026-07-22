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
  onForceRefreshCloud?: () => Promise<void>;
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
  onDisableAutoBackup,
  onForceRefreshCloud
}: SidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isReportsExpanded, setIsReportsExpanded] = useState(currentTab.startsWith('reports'));
  const [isUserManagementExpanded, setIsUserManagementExpanded] = useState(
    currentTab === 'usermanagement' || 
    currentTab === 'leads' || 
    currentTab === 'operators' || 
    currentTab === 'cloudconsumption'
  );
  const [isConfirmingLogout, setIsConfirmingLogout] = useState(false);

  useEffect(() => {
    if (currentTab.startsWith('reports')) {
      setIsReportsExpanded(true);
    } else {
      setIsReportsExpanded(false);
    }
    if (
      currentTab === 'usermanagement' || 
      currentTab === 'leads' || 
      currentTab === 'operators' || 
      currentTab === 'cloudconsumption'
    ) {
      setIsUserManagementExpanded(true);
    } else {
      setIsUserManagementExpanded(false);
    }
  }, [currentTab]);

  const menuItems = [
    { id: 'dashboard', name: 'Painel Geral', icon: LayoutDashboard },
    { id: 'services', name: 'Serviços (Receitas)', icon: FileCheck },
    { id: 'expenses', name: 'Registro de Gastos', icon: DollarSign },
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
    { id: 'subcategories', name: 'Subcategorias', icon: Layers },
    { id: 'clients', name: 'Cadastro de Clientes', icon: Users },
    ...(currentSession?.isAdmin ? [
      { 
        id: 'usermanagement-parent', 
        name: 'Controle de Usuários', 
        icon: ShieldCheck,
        children: [
          { id: 'usermanagement', name: 'Cadastro de Usuários' },
          { id: 'leads', name: 'Leads do Site' },
          { id: 'operators', name: 'Operadores Conectados' },
          { id: 'cloudconsumption', name: 'Consumo da Nuvem' }
        ]
      }
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
    <div className="w-full lg:w-68 bg-[#161B22] text-slate-300 flex flex-col py-6 px-4 border-r border-slate-800 shadow-xl shrink-0 h-full overflow-y-auto custom-scrollbar">
      <div className="space-y-6 flex-1">
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
            const isParentActive = currentTab === item.id || (hasChildren && (
              item.id === 'reports' ? currentTab.startsWith('reports') :
              item.id === 'usermanagement-parent' ? (
                currentTab === 'usermanagement' || 
                currentTab === 'leads' || 
                currentTab === 'operators' || 
                currentTab === 'cloudconsumption'
              ) : false
            ));
            const isChildOpen = hasChildren && (
              item.id === 'reports' ? isReportsExpanded :
              item.id === 'usermanagement-parent' ? isUserManagementExpanded : false
            );

            return (
              <div key={item.id} className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    if (hasChildren) {
                      if (item.id === 'reports') {
                        setIsReportsExpanded(prev => !prev);
                      } else if (item.id === 'usermanagement-parent') {
                        setIsUserManagementExpanded(prev => !prev);
                      }
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

                {/* Submenu rendering */}
                {hasChildren && isChildOpen && item.children && (
                  <div className="pl-3.5 space-y-1.5 mt-1 border-l border-slate-800 ml-5 animate-fadeIn">
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

      {/* Backup de Segurança Section */}
      <div className="space-y-4 border-t border-slate-800 pt-5 mt-6">
        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block px-2">
          Backup de Segurança
        </span>

        <div className="space-y-4 animate-fadeIn">
          {/* Safety Backups Grid */}
          <div className="grid grid-cols-2 gap-2 px-1">
            {/* Export button */}
            <button
              onClick={handleExportData}
              className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#0F1115] hover:bg-slate-800 hover:text-white border border-slate-800 text-[10px] font-bold cursor-pointer transition-all text-slate-300 text-center"
              title="Salvar cópia do banco local no computador"
            >
              <Download size={11} className="text-emerald-500 shrink-0" />
              Exportar
            </button>

            {/* Import trigger */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#0F1115] hover:bg-slate-800 hover:text-white border border-slate-800 text-[10px] font-bold cursor-pointer transition-all text-slate-300 text-center"
              title="Fazer upload de um arquivo de backup salvo"
            >
              <Upload size={11} className="text-slate-400 shrink-0" />
              Importar
            </button>
          </div>

          {/* Auto-Backup Panel widget */}
          <div className="bg-[#0F1115] border border-slate-850 rounded-xl p-2.5 mt-2 space-y-2 select-none mx-1">
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

          {/* Footer info lockup */}
          <div 
            onClick={onOpenAuthModal}
            className="bg-slate-800/20 hover:bg-slate-800/40 p-2.5 rounded-xl border border-slate-850 hover:border-slate-700 mt-2 space-y-1 cursor-pointer transition-all active:scale-[0.98] mx-1"
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
              <span>{isCloudConnected ? 'Nuvem do Administrador activa' : 'Clique para conectar'}</span>
              <span className="font-mono text-[8px] bg-[#0F1115] px-1 rounded border border-slate-800 text-slate-400">Firebase</span>
            </div>
          </div>
        </div>

        {/* Invisible file upload tag */}
        <input 
          ref={fileInputRef}
          type="file" 
          accept=".json" 
          onChange={handleImportData}
          className="hidden" 
        />
      </div>
    </div>
  );
}
