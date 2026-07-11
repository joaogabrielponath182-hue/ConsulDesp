/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import firebaseConfigData from '../../firebase-applet-config.json';
import { 
  X, 
  CloudLightning, 
  CloudCheck, 
  Loader2, 
  RefreshCw,
  CloudUpload,
  Database,
  Info,
  LogIn,
  LogOut,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  onSyncLocalData: () => Promise<void>;
  onForceRefreshCloud?: () => Promise<void>;
  isSyncing: boolean;
  onSignOutComplete: () => void;
}

export default function AuthModal({
  isOpen,
  onClose,
  currentUser,
  onSyncLocalData,
  onForceRefreshCloud,
  isSyncing,
  onSignOutComplete
}: AuthModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      // Use popup for sign-in inside iframe or normal window
      await signInWithPopup(auth, provider);
      setSuccessMsg('Autenticado com sucesso com sua conta Google!');
    } catch (err: any) {
      console.error("Erro ao autenticar com o Google:", err);
      let userFriendlyMsg = 'Falha na autenticação. Certifique-se de autorizar a janela popup do Google.';
      
      if (err && err.code) {
        switch (err.code) {
          case 'auth/popup-blocked':
            userFriendlyMsg = 'O navegador bloqueou a janela de login (Popup). Por favor, ative a permissão de pop-ups para este site nas configurações do seu navegador (geralmente há um aviso na barra de endereço).';
            break;
          case 'auth/unauthorized-domain':
            userFriendlyMsg = 'Este domínio/porta não está autorizado no Console do Firebase. Se estiver usando localhost com uma porta diferente ou IP local, adicione-o em Authentication -> Configurações -> Domínios Autorizados no Console do Firebase.';
            break;
          case 'auth/popup-closed-by-user':
            userFriendlyMsg = 'A janela de autenticação foi fechada antes da conclusão do login.';
            break;
          case 'auth/cancelled-popup-request':
            userFriendlyMsg = 'A tentativa de autenticação por popup foi cancelada ou sobreposta.';
            break;
          case 'auth/network-request-failed':
            userFriendlyMsg = 'Erro de rede. Verifique se o seu computador está conectado à internet.';
            break;
          case 'auth/internal-error':
            userFriendlyMsg = 'Erro interno do Firebase. Verifique a configuração do seu projeto.';
            break;
          default:
            userFriendlyMsg = `Falha na autenticação (Código: ${err.code}). Mensagem: ${err.message || 'Erro desconhecido.'}`;
        }
      }
      setErrorMsg(userFriendlyMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignOut = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);
    try {
      await signOut(auth);
      setSuccessMsg('Desconectado da conta Google com sucesso!');
      onSignOutComplete();
    } catch (err) {
      console.error("Erro ao desconectar:", err);
      setErrorMsg('Erro ao desconectar da conta Google.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePush = async () => {
    if (!onForceRefreshCloud) return;
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);
    try {
      await onForceRefreshCloud();
      setSuccessMsg('Dados baixados com sucesso da nuvem Firestore!');
    } catch (err: any) {
      console.error(err);
      let msg = 'Erro ao carregar dados da nuvem.';
      if (err instanceof Error) {
        try {
          const parsed = JSON.parse(err.message);
          if (parsed && parsed.error) {
            msg += ` (${parsed.error})`;
          } else {
            msg += ` (${err.message})`;
          }
        } catch {
          msg += ` (${err.message})`;
        }
      } else {
        msg += ` (${String(err)})`;
      }
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePull = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);
    try {
      await onSyncLocalData();
      setSuccessMsg('Seus dados locais foram salvos com sucesso na nuvem Firestore!');
    } catch (err: any) {
      console.error(err);
      let msg = 'Erro ao enviar dados para a nuvem.';
      if (err instanceof Error) {
        try {
          const parsed = JSON.parse(err.message);
          if (parsed && parsed.error) {
            msg += ` (${parsed.error})`;
          } else {
            msg += ` (${err.message})`;
          }
        } catch {
          msg += ` (${err.message})`;
        }
      } else {
        msg += ` (${String(err)})`;
      }
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#161B22] border border-slate-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <CloudLightning className={currentUser ? "text-emerald-500 animate-pulse" : "text-amber-500"} size={20} />
            <h3 className="font-bold text-sm tracking-wide uppercase text-white">
              {currentUser ? "Sincronização Cloud Ativa" : "Sincronização Cloud Inativa"}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg bg-slate-900 border border-slate-850 text-slate-400 hover:text-white cursor-pointer transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {currentUser ? (
            <div className="text-center space-y-3 py-2">
              <div className="mx-auto w-14 h-14 bg-emerald-950/40 border border-emerald-800/30 rounded-full flex items-center justify-center text-emerald-400">
                <CloudCheck size={28} />
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-white text-sm uppercase tracking-wider">Banco em Nuvem Conectado</h4>
                <p className="text-slate-400 text-xs leading-relaxed max-w-sm mx-auto">
                  Você está conectado com a conta Google <span className="text-emerald-400 font-semibold">{currentUser.email}</span>. Os dados são sincronizados no banco de dados Firestore.
                </p>
              </div>

              <button
                onClick={handleGoogleSignOut}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/30 text-rose-400 text-[10px] font-bold uppercase tracking-wide cursor-pointer transition-colors"
              >
                {isLoading ? <Loader2 size={11} className="animate-spin" /> : <LogOut size={11} />}
                <span>Desconectar Google</span>
              </button>
            </div>
          ) : (
            <div className="text-center space-y-4 py-3">
              <div className="mx-auto w-14 h-14 bg-amber-950/20 border border-amber-900/30 rounded-full flex items-center justify-center text-amber-500">
                <ShieldAlert size={28} />
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-white text-sm uppercase tracking-wider">Sincronização Opcional Desativada</h4>
                <p className="text-slate-400 text-xs leading-relaxed max-w-xs mx-auto">
                  Conecte uma conta Google autorizada para fazer backup seguro dos seus registros em tempo real e compartilhá-los entre múltiplos navegadores.
                </p>
              </div>

              <button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider cursor-pointer shadow-lg shadow-emerald-950/40 transition-all active:scale-[0.98]"
              >
                {isLoading ? <Loader2 size={13} className="animate-spin" /> : <LogIn size={13} />}
                <span>Fazer Login com Conta Google</span>
              </button>
            </div>
          )}

          {/* Connection Info */}
          <div className="p-4 bg-[#0F1115] border border-slate-850 rounded-xl space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Database size={14} className={currentUser ? "text-emerald-500" : "text-amber-500"} />
              <span>Diagnóstico de Conexão</span>
            </div>
            
            <div className="space-y-1.5 font-mono text-[10px] text-slate-400">
              <div className="flex justify-between border-b border-slate-900 pb-1">
                <span>Serviço:</span>
                <span className="text-emerald-400">Google Firestore Cloud</span>
              </div>
              <div className="flex justify-between border-b border-slate-900 pb-1">
                <span>Projeto ID:</span>
                <span className="text-slate-300 select-all">{firebaseConfigData.projectId || 'causal-journal-nd2jw'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-900 pb-1">
                <span>Status da Conta:</span>
                {currentUser ? (
                  <span className="text-emerald-400 font-bold">Autenticado</span>
                ) : (
                  <span className="text-amber-500">Apenas Local (Offline)</span>
                )}
              </div>
              <div className="flex justify-between">
                <span>Conectividade:</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                  Online e Pronta
                </span>
              </div>
            </div>
          </div>

          {/* Success / Error Messages */}
          {successMsg && (
            <div className="p-3 bg-emerald-950/30 border border-emerald-900/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
              <CloudCheck size={14} className="shrink-0 animate-bounce" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-950/30 border border-rose-900/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
              <span className="text-rose-500 font-bold">✕</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Synchronization Tools */}
          <div className="space-y-2.5 pt-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block pl-1">
              Controles de Sincronização Manual
            </span>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handlePull}
                disabled={isLoading || isSyncing || !currentUser}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-[0.98]"
                title={currentUser ? "Salvar os dados atuais deste navegador na nuvem" : "Faça login com o Google para salvar"}
              >
                {isLoading || isSyncing ? <Loader2 className="animate-spin" size={13} /> : <CloudUpload size={13} />}
                <span>Enviar p/ Nuvem</span>
              </button>

              <button
                onClick={handlePush}
                disabled={isLoading || isSyncing || !onForceRefreshCloud || !currentUser}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 text-slate-200 font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-[0.98]"
                title={currentUser ? "Sincronizar e baixar dados da nuvem para este navegador" : "Faça login com o Google para puxar"}
              >
                {isLoading || isSyncing ? <Loader2 className="animate-spin" size={13} /> : <RefreshCw size={13} />}
                <span>Puxar da Nuvem</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
