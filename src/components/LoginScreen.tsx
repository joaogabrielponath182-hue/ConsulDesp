/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import SystemLogo from './SystemLogo';
import { Shield, Key, AlertCircle, Loader2, Coins, FileUp, CloudUpload, RefreshCw, ExternalLink } from 'lucide-react';
import { InternalUser, UserSession } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (session: UserSession) => void;
  onBackToLanding?: () => void;
  internalUsers: InternalUser[];
  onUpdateUserSession: (userId: string, sessionId: string) => Promise<void>;
  onImportBackup: (data: any) => Promise<void> | void;
  isCloudConnected: boolean;
  onToggleCloudConnected: (connected: boolean) => void;
  onPullCloudData: () => Promise<void>;
  onPushCloudData: () => Promise<void>;
  isCloudLoading: boolean;
  initialUsername?: string;
  initialPassword?: string;
}

export default function LoginScreen({
  onLoginSuccess,
  onBackToLanding,
  internalUsers,
  onUpdateUserSession,
  onImportBackup,
  isCloudConnected,
  onToggleCloudConnected,
  onPullCloudData,
  onPushCloudData,
  isCloudLoading,
  initialUsername = '',
  initialPassword = ''
}: LoginScreenProps) {
  const [username, setUsername] = useState(initialUsername);
  const [password, setPassword] = useState(initialPassword);

  // Sync state if initial props change
  React.useEffect(() => {
    if (initialUsername) {
      setUsername(initialUsername);
    }
    if (initialPassword) {
      setPassword(initialPassword);
    }
  }, [initialUsername, initialPassword]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importSuccess, setImportSuccess] = useState('');
  const [importError, setImportError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername || !password) {
      setErrorMsg('Por favor, preencha todos os campos.');
      return;
    }

    setIsLoading(true);

    // Simulate small delay for premium visual feedback
    await new Promise((resolve) => setTimeout(resolve, 600));

    try {
      // 1. Check Hardcoded Admin Account
      if (cleanUsername === 'joao.desp') {
        if (password === 'abkg1601') {
          const sessionId = `sess-joao-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
          
          // Try to sync session ID to Firestore/local
          try {
            await onUpdateUserSession('joao.desp', sessionId);
          } catch (sessionErr) {
            console.warn("Could not sync session to cloud, continuing locally:", sessionErr);
          }

          onLoginSuccess({
            username: 'joao.desp',
            fullName: 'João Gabriel (Administrador)',
            isAdmin: true,
            sessionId
          });
          setIsLoading(false);
          return;
        } else {
          setErrorMsg('Senha incorreta para o administrador.');
          setIsLoading(false);
          return;
        }
      }

      // 2. Check Standard Custom Users
      const foundUser = internalUsers.find(
        (u) => u.username.toLowerCase() === cleanUsername
      );

      if (!foundUser) {
        setErrorMsg('Nome de usuário não encontrado no sistema.');
        setIsLoading(false);
        return;
      }

      if (foundUser.password !== password) {
        setErrorMsg('Senha incorreta para este usuário.');
        setIsLoading(false);
        return;
      }

      // 3. Check Account Validity/Expiration
      if (foundUser.expiresAt) {
        const expirationDate = new Date(foundUser.expiresAt);
        const currentDate = new Date();
        if (currentDate > expirationDate) {
          setErrorMsg(
            `Esta conta expirou em ${expirationDate.toLocaleDateString('pt-BR')}. Por favor, entre em contato com o administrador joao.desp para renovar seu acesso.`
          );
          setIsLoading(false);
          return;
        }
      }

      // 4. Successful login
      const sessionId = `sess-${foundUser.username}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      
      // Update the current session ID in the DB to terminate other existing logins
      try {
        await onUpdateUserSession(foundUser.id, sessionId);
      } catch (sessionErr) {
        console.warn("Could not sync session to cloud, continuing locally:", sessionErr);
      }

      onLoginSuccess({
        username: foundUser.username,
        fullName: foundUser.fullName,
        isAdmin: false,
        sessionId
      });
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Erro ao realizar login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError('');
    setImportSuccess('');
    const fileReader = new FileReader();
    const files = e.target.files;
    if (!files || files.length === 0) return;

    fileReader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && (parsed.services || parsed.expenses || parsed.subCategories || parsed.internalUsers)) {
          onImportBackup({
            services: parsed.services || [],
            expenses: parsed.expenses || [],
            subCategories: parsed.subCategories || [],
            clients: parsed.clients || [],
            internalUsers: parsed.internalUsers || [],
            personalExpenses: parsed.personalExpenses || []
          });
          setImportSuccess('Backup importado com sucesso! Usuários e registros carregados.');
          
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        } else {
          setImportError('Arquivo de backup inválido ou incompatível.');
        }
      } catch (err) {
        setImportError('Erro ao ler ou processar o arquivo de backup JSON.');
      }
    };
    fileReader.readAsText(files[0]);
  };

  return (
    <div className="min-h-screen bg-[#0F1115] flex items-center justify-center p-4">
      {/* Outer Glow Decoration */}
      <div className="absolute w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="bg-[#161B22] border border-slate-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative animate-fadeIn text-slate-100 p-8 space-y-6">
        
        {/* Back button to institutional landing page */}
        {onBackToLanding && (
          <button
            type="button"
            onClick={onBackToLanding}
            className="absolute top-5 left-6 inline-flex items-center gap-1 text-[10px] font-extrabold text-slate-400 hover:text-emerald-400 uppercase tracking-widest transition-colors cursor-pointer"
            title="Voltar para o site institucional"
          >
            ← Voltar ao Site
          </button>
        )}

        {/* Logo and Brand */}
        <div className="text-center space-y-3 pt-4">
          <div className="mx-auto w-14 h-14 bg-slate-900/30 dark:bg-slate-950/40 border border-slate-800/40 dark:border-slate-800/80 rounded-2xl flex items-center justify-center shadow-inner overflow-hidden">
            <SystemLogo size={56} className="border-none rounded-2xl" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-white uppercase font-sans">
              ConsulDesp Financeiro
            </h1>
            <p className="text-xs text-slate-400">
              Sistema de Controle de Acesso Interno
            </p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="p-3 bg-[#0F1115] border border-slate-850 rounded-xl text-[11px] text-slate-400 leading-normal text-center">
          <p>🔑 Autenticação obrigatória. Insira suas credenciais para acessar o painel financeiro.</p>
        </div>

        {/* Error Feedback */}
        {errorMsg && (
          <div className="p-3.5 bg-rose-950/20 border border-rose-900/40 rounded-xl text-rose-400 text-xs flex items-start gap-2.5 animate-shake">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span className="leading-normal">{errorMsg}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Username Field */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Nome de Usuário
            </label>
            <div className="relative">
              <Shield size={14} className="absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="text"
                required
                autoCapitalize="none"
                autoComplete="username"
                placeholder="Ex: joao.desp"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#0F1115] border border-slate-850 hover:border-slate-800 focus:border-emerald-500 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium outline-hidden transition-all text-white placeholder:text-slate-650"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Senha de Acesso
            </label>
            <div className="relative">
              <Key size={14} className="absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="password"
                required
                autoComplete="current-password"
                placeholder="Sua senha numérica ou alfanumérica"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0F1115] border border-slate-850 hover:border-slate-800 focus:border-emerald-500 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium outline-hidden transition-all text-white placeholder:text-slate-650"
              />
            </div>
          </div>

          {/* Submit Trigger */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer transition-all mt-6 shadow-lg shadow-emerald-500/10 active:scale-[0.99]"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={14} />
                <span>Validando Acesso...</span>
              </>
            ) : (
              <>
                <Shield size={14} />
                <span>Entrar no Sistema</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center py-2 bg-emerald-500/5 rounded-xl border border-emerald-500/10 hover:bg-emerald-500/10 transition-colors">
          <a
            href="https://drive.google.com/drive/folders/1izvu7ehWsFSSb6R8-V9wfxWSqEhqIXLm"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-bold transition-all py-1"
          >
            <span>Deseja conhecer nosso sistema? Clique aqui.</span>
            <ExternalLink size={12} className="shrink-0" />
          </a>
        </div>

        <div className="text-center pt-4 border-t border-slate-800/60 space-y-3">
          {/* Cloud Connection Control Panel */}
          <div className="bg-[#0F1115] border border-slate-850 p-4 rounded-xl text-center space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50" />
                <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">
                  Nuvem do Administrador
                </span>
              </div>
              <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md font-extrabold uppercase">
                Conectado
              </span>
            </div>
            
            <div className="text-left">
              <p className="text-[10px] text-slate-400 leading-normal">
                ✓ Conexão automática ativa. Usuários cadastrados e dados de lançamentos são lidos e salvos diretamente na nuvem central.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={onPullCloudData}
                disabled={isCloudLoading}
                className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-750 disabled:opacity-50 disabled:cursor-not-allowed text-[10px] font-bold text-slate-200 uppercase tracking-wide cursor-pointer transition-colors border border-slate-700 flex items-center justify-center gap-1.5 active:scale-95"
                title="Atualizar dados de usuários e tabelas a partir da nuvem"
              >
                <RefreshCw size={11} className={isCloudLoading ? "animate-spin text-emerald-400" : ""} />
                <span>Puxar Dados</span>
              </button>
              <button
                type="button"
                onClick={onPushCloudData}
                disabled={isCloudLoading}
                className="py-1.5 px-2 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed border border-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wide cursor-pointer transition-colors flex items-center justify-center gap-1.5 active:scale-95"
                title="Enviar backup atual local para a nuvem"
              >
                <CloudUpload size={11} className={isCloudLoading ? "animate-spin text-emerald-400" : ""} />
                <span>Enviar Dados</span>
              </button>
            </div>
          </div>
        </div>

          <div className="bg-[#0F1115] border border-slate-850 p-4 rounded-xl text-center space-y-3">
            <div className="space-y-1 text-left">
              <p className="text-[10px] text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <FileUp size={12} className="text-emerald-400" />
                <span>Restaurar / Importar Backup</span>
              </p>
              <p className="text-[10px] text-slate-400 leading-normal">
                Carregue operadores, taxas e lançamentos a partir de um arquivo JSON.
              </p>
            </div>

            {importSuccess && (
              <p className="text-[10px] text-emerald-400 bg-emerald-950/20 border border-emerald-900/40 p-2 rounded-lg font-medium text-left">
                ✓ {importSuccess}
              </p>
            )}

            {importError && (
              <p className="text-[10px] text-rose-400 bg-rose-950/20 border border-rose-900/40 p-2 rounded-lg font-medium text-left">
                ✕ {importError}
              </p>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-xs text-slate-200 hover:text-white font-bold uppercase tracking-wide transition-all border border-slate-700 cursor-pointer active:scale-95"
            >
              <FileUp size={13} />
              <span>Importar Arquivo JSON</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportData}
              accept=".json"
              className="hidden"
            />
          </div>

          <span className="text-[9px] text-zinc-500 font-mono block">
            Acesso auditado • Proteção contra login simultâneo ativa
          </span>
        </div>
      </div>
    );
  }
