/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Clock, 
  ShieldAlert, 
  UserCheck, 
  UserX, 
  Key, 
  Phone, 
  FileText, 
  Tag, 
  Check, 
  AlertCircle,
  Pencil,
  Eye,
  EyeOff,
  X,
  Save
} from 'lucide-react';
import { InternalUser } from '../types';

interface UserManagementProps {
  users: InternalUser[];
  onAddUser: (user: Omit<InternalUser, 'id' | 'createdAt' | 'expiresAt'>) => Promise<void>;
  onRemoveUser: (id: string) => Promise<void>;
  onUpdateUser: (user: InternalUser) => Promise<void>;
}

export default function UserManagement({
  users,
  onAddUser,
  onRemoveUser,
  onUpdateUser
}: UserManagementProps) {
  // Form state
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [duration, setDuration] = useState<'7' | '15' | '30' | 'indeterminado'>('30');
  
  // UI States
  const [editingUser, setEditingUser] = useState<InternalUser | null>(null);
  const [showPasswordInForm, setShowPasswordInForm] = useState(true);
  const [showPasswordsInTable, setShowPasswordsInTable] = useState<Record<string, boolean>>({});
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDeleteUserId, setConfirmDeleteUserId] = useState<string | null>(null);

  // Form helpers for masks
  const formatCPF = (value: string) => {
    const raw = value.replace(/\D/g, '');
    if (raw.length <= 11) {
      return raw
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return value;
  };

  const formatPhone = (value: string) => {
    const raw = value.replace(/\D/g, '');
    if (raw.length <= 11) {
      return raw
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{4})\d+?$/, '$1');
    }
    return value;
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(formatCPF(e.target.value));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  const handleEditClick = (user: InternalUser) => {
    setEditingUser(user);
    setFullName(user.fullName);
    setCpf(user.cpf);
    setPhone(user.phone);
    setUsername(user.username);
    setPassword(user.password);
    setDuration(user.duration);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setFullName('');
    setCpf('');
    setPhone('');
    setUsername('');
    setPassword('');
    setDuration('30');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const toggleTablePassword = (userId: string) => {
    setShowPasswordsInTable(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanUsername = username.trim().toLowerCase();
    
    // Validations
    if (!fullName.trim() || !cpf || !phone || !cleanUsername || !password) {
      setErrorMsg('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (cleanUsername === 'joao.desp') {
      setErrorMsg('O nome de usuário "joao.desp" é reservado para o administrador principal.');
      return;
    }

    // Check duplicate username if it was changed
    const isUsernameChanged = !editingUser || editingUser.username.toLowerCase() !== cleanUsername;
    if (isUsernameChanged) {
      const exists = users.some(u => u.username.toLowerCase() === cleanUsername);
      if (exists) {
        setErrorMsg(`O nome de usuário "${cleanUsername}" já está em uso.`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (editingUser) {
        // Calculate expiresAt if duration choice changed
        let expiresAt = editingUser.expiresAt;
        if (duration !== editingUser.duration) {
          if (duration === 'indeterminado') {
            expiresAt = null;
          } else {
            const days = parseInt(duration, 10);
            const exp = new Date();
            exp.setDate(exp.getDate() + days);
            expiresAt = exp.toISOString();
          }
        }

        await onUpdateUser({
          ...editingUser,
          fullName: fullName.trim(),
          cpf: cpf.trim(),
          phone: phone.trim(),
          username: cleanUsername,
          password,
          duration,
          expiresAt
        });

        setSuccessMsg('Operador atualizado com sucesso!');
        setEditingUser(null);
      } else {
        await onAddUser({
          fullName: fullName.trim(),
          cpf: cpf.trim(),
          phone: phone.trim(),
          username: cleanUsername,
          password,
          duration
        });

        setSuccessMsg('Usuário criado e habilitado com sucesso!');
      }
      
      // Clear fields
      setFullName('');
      setCpf('');
      setPhone('');
      setUsername('');
      setPassword('');
      setDuration('30');

      setTimeout(() => {
        setSuccessMsg('');
      }, 4000);
    } catch (err: any) {
      setErrorMsg('Erro ao registrar/atualizar usuário. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter users based on search
  const filteredUsers = users.filter(user => {
    // Exclude the main hardcoded administrator from the management table to avoid clutter and accidental deletion
    if (user.username.toLowerCase() === 'joao.desp') {
      return false;
    }

    const search = searchTerm.toLowerCase();
    return (
      user.fullName.toLowerCase().includes(search) ||
      user.username.toLowerCase().includes(search) ||
      user.cpf.includes(search)
    );
  });

  const getUserStatus = (user: InternalUser) => {
    if (!user.expiresAt) return { label: 'Indeterminado', style: 'bg-emerald-950 text-emerald-400 border-emerald-800/30' };
    
    const expDate = new Date(user.expiresAt);
    const now = new Date();
    
    if (now > expDate) {
      return { label: 'Expirado', style: 'bg-rose-950 text-rose-400 border-rose-900/30' };
    }
    
    const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return { 
      label: `Ativo (${diffDays} dias restantes)`, 
      style: 'bg-emerald-950 text-emerald-300 border-emerald-900/30' 
    };
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title block */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white uppercase font-sans flex items-center gap-2">
          <Users className="text-emerald-500" size={24} />
          Controle de Usuários do Sistema
        </h1>
        <p className="text-slate-400 text-xs mt-1">
          Cadastre novos operadores e defina o tempo que eles terão permissão para operar o sistema.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Registration / Editing Form Card */}
        <div className="lg:col-span-1 bg-[#161B22] border border-slate-800 p-6 rounded-2xl shadow-xl h-fit space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              {editingUser ? (
                <Pencil className="text-amber-400" size={18} />
              ) : (
                <UserPlus className="text-emerald-400" size={18} />
              )}
              <h3 className="font-bold text-xs uppercase tracking-wider text-white">
                {editingUser ? 'Editar Operador' : 'Novo Operador'}
              </h3>
            </div>
            {editingUser && (
              <button
                onClick={handleCancelEdit}
                className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                title="Cancelar Edição"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-950/20 border border-rose-900/40 rounded-xl text-rose-400 text-xs flex items-start gap-2 animate-shake">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span className="leading-normal">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-950/20 border border-emerald-900/40 rounded-xl text-emerald-400 text-xs flex items-start gap-2 animate-fadeIn">
              <Check size={14} className="shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Nome Completo
              </label>
              <div className="relative">
                <Users size={13} className="absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="Nome do despachante"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-[#0F1115] border border-slate-850 hover:border-slate-800 focus:border-emerald-500 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium outline-hidden transition-all text-white placeholder:text-slate-650"
                />
              </div>
            </div>

            {/* Row with CPF and Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  CPF
                </label>
                <div className="relative">
                  <FileText size={13} className="absolute left-3.5 top-3.5 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={handleCpfChange}
                    className="w-full bg-[#0F1115] border border-slate-850 hover:border-slate-800 focus:border-emerald-500 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium outline-hidden transition-all text-white placeholder:text-slate-650"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Telefone
                </label>
                <div className="relative">
                  <Phone size={13} className="absolute left-3.5 top-3.5 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="(00) 00000-0000"
                    value={phone}
                    onChange={handlePhoneChange}
                    className="w-full bg-[#0F1115] border border-slate-850 hover:border-slate-800 focus:border-emerald-500 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium outline-hidden transition-all text-white placeholder:text-slate-650"
                  />
                </div>
              </div>
            </div>

            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Nome de Usuário (Login)
              </label>
              <div className="relative">
                <Tag size={13} className="absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="Ex: joao.operador"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#0F1115] border border-slate-850 hover:border-slate-800 focus:border-emerald-500 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium outline-hidden transition-all text-white placeholder:text-slate-650"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Senha Provisória
                </label>
                <button
                  type="button"
                  onClick={() => setShowPasswordInForm(!showPasswordInForm)}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  {showPasswordInForm ? (
                    <>
                      <EyeOff size={11} />
                      <span>Ocultar Senha</span>
                    </>
                  ) : (
                    <>
                      <Eye size={11} />
                      <span>Mostrar Senha</span>
                    </>
                  )}
                </button>
              </div>
              <div className="relative">
                <Key size={13} className="absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type={showPasswordInForm ? 'text' : 'password'}
                  required
                  placeholder="Senha do usuário"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0F1115] border border-slate-850 hover:border-slate-800 focus:border-emerald-500 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium outline-hidden transition-all text-white placeholder:text-slate-650 font-mono"
                />
              </div>
            </div>

            {/* Activation Duration */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Período de Ativação / Validade
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: '7', label: '7 Dias' },
                  { value: '15', label: '15 Dias' },
                  { value: '30', label: '30 Dias' },
                  { value: 'indeterminado', label: 'Sem Limite' }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDuration(opt.value as any)}
                    className={`py-2 px-3 text-[11px] font-semibold rounded-xl border transition-all cursor-pointer ${
                      duration === opt.value
                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                        : 'bg-[#0F1115] border-slate-850 text-slate-400 hover:text-white hover:border-slate-800'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit / Save Trigger */}
            <div className="flex gap-3 pt-2">
              {editingUser && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`py-2.5 rounded-xl text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-[0.98] ${
                  editingUser 
                    ? 'flex-1 bg-amber-600 hover:bg-amber-500 shadow-amber-500/10' 
                    : 'w-full bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/10'
                }`}
              >
                {editingUser ? <Save size={14} /> : <UserPlus size={14} />}
                <span>{editingUser ? 'Salvar Operador' : 'Habilitar Usuário'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Existing Users Table Card */}
        <div className="lg:col-span-2 bg-[#161B22] border border-slate-800 p-6 rounded-2xl shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Users className="text-emerald-400" size={18} />
              <h3 className="font-bold text-xs uppercase tracking-wider text-white">Usuários Cadastrados</h3>
            </div>
            {/* Search Input */}
            <input
              type="text"
              placeholder="Buscar por nome, usuário ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-60 bg-[#0F1115] border border-slate-850 hover:border-slate-800 focus:border-emerald-500 rounded-xl py-1.5 px-3.5 text-xs outline-hidden transition-all text-white placeholder:text-slate-650"
            />
          </div>

          {/* Users List viewport */}
          <div className="overflow-x-auto">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12 space-y-2.5">
                <ShieldAlert className="mx-auto text-slate-600 animate-pulse" size={32} />
                <p className="text-xs text-slate-400">Nenhum operador cadastrado ou localizado.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs text-slate-300 border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                    <th className="py-3 px-2">Operador</th>
                    <th className="py-3 px-2">CPF / Tel</th>
                    <th className="py-3 px-2">Acesso (Login/Senha)</th>
                    <th className="py-3 px-2">Expiração / Status</th>
                    <th className="py-3 px-2 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {filteredUsers.map((user) => {
                    const status = getUserStatus(user);
                    const isShowingPassword = showPasswordsInTable[user.id] !== false; // defaults to shown/true
                    return (
                      <tr key={user.id} className="hover:bg-slate-800/10 transition-colors">
                        {/* Name and creation date */}
                        <td className="py-4 px-2 space-y-1">
                          <span className="font-semibold text-white block">{user.fullName}</span>
                          <span className="text-[10px] text-slate-500 block">
                            Criado em: {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                        </td>
                        {/* CPF and Phone */}
                        <td className="py-4 px-2 space-y-1">
                          <span className="font-mono text-[11px] block">{user.cpf}</span>
                          <span className="text-slate-400 block">{user.phone}</span>
                        </td>
                        {/* Login Creds */}
                        <td className="py-4 px-2 space-y-1">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-500">Usuário:</span>
                            <code className="text-xs font-mono font-bold bg-[#0F1115] text-emerald-400 px-1.5 py-0.5 rounded border border-slate-850">
                              {user.username}
                            </code>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-500">Senha:</span>
                            <code className="text-[11px] font-mono text-amber-500 px-1.5 bg-[#0F1115] rounded py-0.5 border border-slate-850">
                              {isShowingPassword ? user.password : '••••••••'}
                            </code>
                            <button
                              type="button"
                              onClick={() => toggleTablePassword(user.id)}
                              className="text-slate-500 hover:text-white transition-colors cursor-pointer"
                              title={isShowingPassword ? 'Ocultar senha' : 'Exibir senha'}
                            >
                              {isShowingPassword ? <EyeOff size={11} /> : <Eye size={11} />}
                            </button>
                          </div>
                        </td>
                        {/* Duration and expiry badge */}
                        <td className="py-4 px-2 space-y-1.5">
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${status.style}`}>
                            {status.label}
                          </span>
                          {user.expiresAt && (
                            <span className="text-[10px] text-slate-500 block">
                              Vence: {new Date(user.expiresAt).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </td>
                        {/* Action buttons */}
                        <td className="py-4 px-2 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEditClick(user)}
                              className="p-2 rounded-lg bg-amber-600/10 border border-amber-600/20 text-amber-400 hover:bg-amber-600 hover:text-white cursor-pointer transition-all"
                              title="Editar Dados e Senha"
                            >
                              <Pencil size={13} />
                            </button>
                            {confirmDeleteUserId === user.id ? (
                              <div className="flex items-center gap-1.5 animate-fadeIn">
                                <button
                                  onClick={async () => {
                                    await onRemoveUser(user.id);
                                    setConfirmDeleteUserId(null);
                                  }}
                                  className="px-2 py-1 text-[9px] font-black bg-rose-600 hover:bg-rose-500 text-white uppercase rounded transition-all cursor-pointer shadow-md"
                                  title="Confirmar exclusão de operador"
                                >
                                  Confirmar
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteUserId(null)}
                                  className="px-1.5 py-1 text-[9px] font-bold bg-slate-850 hover:bg-slate-800 text-slate-400 uppercase rounded transition-all cursor-pointer"
                                >
                                  Não
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmDeleteUserId(user.id)}
                                className="p-2 rounded-lg bg-rose-600/10 border border-rose-600/20 text-rose-400 hover:bg-rose-600 hover:text-white cursor-pointer transition-all"
                                title="Revogar Acesso"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
