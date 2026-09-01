/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import SystemLogo from './SystemLogo';
import { Shield, Key, AlertCircle, Loader2 } from 'lucide-react';
import { InternalUser, UserSession } from '../types';
import { fetchInternalUsers } from '../lib/db';

interface LoginScreenProps {
  onLoginSuccess: (session: UserSession) => void;
  internalUsers: InternalUser[];
  onImportBackup?: (data: any) => Promise<void> | void;
  isCloudConnected?: boolean;
  onToggleCloudConnected?: (connected: boolean) => void;
  onPullCloudData?: () => Promise<void>;
  onPushCloudData?: () => Promise<void>;
  isCloudLoading?: boolean;
  initialUsername?: string;
  initialPassword?: string;
}

export default function LoginScreen({
  onLoginSuccess,
  internalUsers,
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
          const sessionId = `sess-joao-${Date.now()}`;
          
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
      let usersList = internalUsers;
      let foundUser = usersList.find(
        (u) => u.username.toLowerCase() === cleanUsername
      );

      if (!foundUser) {
        try {
          const remoteUsers = await fetchInternalUsers();
          if (remoteUsers && remoteUsers.length > 0) {
            usersList = remoteUsers;
            localStorage.setItem('dep_internal_users', JSON.stringify(remoteUsers));
            foundUser = usersList.find(
              (u) => u.username.toLowerCase() === cleanUsername
            );
          }
        } catch (fetchErr) {
          console.warn("Erro ao buscar usuários na nuvem durante o login:", fetchErr);
        }
      }

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
      const sessionId = `sess-${foundUser.username}-${Date.now()}`;

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

  return (
    <div className="min-h-screen bg-[#0F1115] flex items-center justify-center p-4">
      {/* Outer Glow Decoration */}
      <div className="absolute w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="bg-[#161B22] border border-slate-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative animate-fadeIn text-slate-100 p-8 space-y-6">
        
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
      </div>
    </div>
  );
}
