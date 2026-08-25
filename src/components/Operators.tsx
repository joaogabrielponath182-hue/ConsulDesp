/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { InternalUser } from '../types';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Pencil, 
  ShieldCheck, 
  Key, 
  Phone, 
  CreditCard, 
  Calendar, 
  Clock, 
  Check, 
  Copy, 
  Eye, 
  EyeOff, 
  Search, 
  AlertCircle, 
  X,
  UserCheck,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OperatorsProps {
  internalUsers: InternalUser[];
  onAddOperator: (operator: Omit<InternalUser, 'id' | 'createdAt'>) => Promise<void> | void;
  onUpdateOperator: (operator: InternalUser) => Promise<void> | void;
  onDeleteOperator: (id: string) => Promise<void> | void;
}

export default function Operators({
  internalUsers,
  onAddOperator,
  onUpdateOperator,
  onDeleteOperator
}: OperatorsProps) {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOperator, setEditingOperator] = useState<InternalUser | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  // Show/Hide password states for table rows
  const [showPasswordIds, setShowPasswordIds] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [duration, setDuration] = useState<'indeterminado' | '30' | '15' | '7'>('indeterminado');
  const [formError, setFormError] = useState('');
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Filtered operators list (exclude 'user' demo if needed or show all)
  const filteredOperators = React.useMemo(() => {
    return internalUsers.filter(u => {
      const q = search.toLowerCase().trim();
      if (!q) return true;
      return (
        u.fullName.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.phone.includes(q) ||
        u.cpf.includes(q)
      );
    });
  }, [internalUsers, search]);

  const handleOpenAddModal = () => {
    setEditingOperator(null);
    setFullName('');
    setUsername('');
    setPassword('');
    setPhone('');
    setCpf('');
    setDuration('indeterminado');
    setFormError('');
    setShowFormPassword(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (op: InternalUser) => {
    setEditingOperator(op);
    setFullName(op.fullName);
    setUsername(op.username);
    setPassword(op.password);
    setPhone(op.phone || '');
    setCpf(op.cpf || '');
    setDuration(op.duration || 'indeterminado');
    setFormError('');
    setShowFormPassword(false);
    setIsModalOpen(true);
  };

  const handleSaveOperator = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const cleanFullName = fullName.trim();
    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanFullName) {
      setFormError('Informe o nome completo do operador.');
      return;
    }
    if (!cleanUsername) {
      setFormError('Informe o login/usuário de acesso.');
      return;
    }
    if (cleanUsername === 'joao.desp' && !editingOperator) {
      setFormError('O usuário "joao.desp" é reservado para o administrador nativo.');
      return;
    }
    if (!cleanPassword || cleanPassword.length < 4) {
      setFormError('A senha deve ter no mínimo 4 caracteres.');
      return;
    }

    // Check duplicate username
    const exists = internalUsers.some(
      u => u.username.toLowerCase() === cleanUsername && (!editingOperator || u.id !== editingOperator.id)
    );
    if (exists) {
      setFormError('Este nome de usuário já está em uso por outro operador.');
      return;
    }

    let expiresAt: string | null = null;
    if (duration !== 'indeterminado') {
      const days = parseInt(duration, 10);
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + days);
      expiresAt = expDate.toISOString();
    }

    setIsSaving(true);
    try {
      if (editingOperator) {
        await onUpdateOperator({
          ...editingOperator,
          fullName: cleanFullName,
          username: cleanUsername,
          password: cleanPassword,
          phone: phone.trim(),
          cpf: cpf.trim(),
          duration,
          expiresAt: duration === 'indeterminado' ? null : (expiresAt || editingOperator.expiresAt)
        });
      } else {
        await onAddOperator({
          fullName: cleanFullName,
          username: cleanUsername,
          password: cleanPassword,
          phone: phone.trim(),
          cpf: cpf.trim(),
          duration,
          expiresAt,
          currentSessionId: null
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setFormError('Erro ao salvar operador. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyCredentials = (op: InternalUser) => {
    const text = `🔐 Acesso ConsulDesp Financeiro:\n👤 Usuário: ${op.username}\n🔑 Senha: ${op.password}`;
    navigator.clipboard.writeText(text);
    setCopiedId(op.id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2500);
  };

  const togglePasswordVisibility = (id: string) => {
    setShowPasswordIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="space-y-8 animate-fadeIn text-slate-100">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <UserCheck size={22} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white uppercase font-sans">
                Cadastro de Operadores
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
                Gerencie os funcionários e operadores com acesso simplificado ao sistema financeiro.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-950/20 transition-all cursor-pointer border border-emerald-500/20 active:scale-[0.98]"
        >
          <UserPlus size={16} />
          <span>Cadastrar Novo Operador</span>
        </button>
      </div>

      {/* Admin Notice Card */}
      <div className="bg-[#161B22] border border-emerald-500/30 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 shrink-0">
            <ShieldCheck size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-white uppercase tracking-wider">
                Administrador Nativo:
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/40 px-2.5 py-0.5 rounded-lg border border-emerald-900/50">
                joao.desp
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Os operadores cadastrados terão <strong className="text-slate-200">acesso simplificado</strong>: apenas os cards essenciais no Painel Geral (Serviços Prestados, Saldo Líquido Geral e Contas a Receber), lançamento de serviços e registro de gastos, e relatórios operacionais. Todo o banco de dados é <strong className="text-emerald-400">100% compartilhado</strong> em tempo real com o escritório.
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-[#161B22] border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative w-full sm:w-80">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por nome, usuário, telefone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 bg-[#0F1115] border border-slate-850 rounded-xl text-xs placeholder-slate-650 focus:outline-none focus:border-emerald-500 text-white transition-all duration-200"
            />
          </div>

          <div className="text-xs text-slate-400 font-mono">
            Total de Operadores: <strong className="text-emerald-400">{filteredOperators.length}</strong>
          </div>
        </div>

        {/* Operators List Table / Cards */}
        {filteredOperators.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-slate-800 rounded-xl">
            <Users className="text-slate-600 w-10 h-10 mb-2" />
            <h4 className="font-bold text-slate-400 text-xs uppercase tracking-wider">Nenhum operador cadastrado</h4>
            <p className="text-[11px] text-slate-500 max-w-sm mt-0.5">
              Clique no botão "Cadastrar Novo Operador" acima para adicionar os funcionários do seu despachante.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="text-[10px] uppercase tracking-wider text-slate-500 bg-[#0F1115] border-y border-slate-850 font-bold">
                <tr>
                  <th className="py-3 px-4">Operador / Nome</th>
                  <th className="py-3 px-4">Usuário (Login)</th>
                  <th className="py-3 px-4">Senha de Acesso</th>
                  <th className="py-3 px-4">Telefone / Contato</th>
                  <th className="py-3 px-4">Nível de Acesso</th>
                  <th className="py-3 px-4">Validade</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/60 font-sans">
                {filteredOperators.map((op) => {
                  const isPasswordVisible = !!showPasswordIds[op.id];
                  const isCopied = copiedId === op.id;
                  const isExpired = op.expiresAt && new Date(op.expiresAt) < new Date();

                  return (
                    <tr key={op.id} className="hover:bg-slate-800/30 transition-colors">
                      {/* Name & CPF */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                            {op.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-white block truncate max-w-[180px]">
                              {op.fullName}
                            </span>
                            {op.cpf ? (
                              <span className="text-[10px] text-slate-500 font-mono block">
                                CPF: {op.cpf}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-600 block">Sem CPF</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Username */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                        <span className="bg-[#0F1115] px-2.5 py-1 rounded-lg border border-slate-800 text-emerald-400">
                          {op.username}
                        </span>
                      </td>

                      {/* Password */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-300 font-semibold bg-[#0F1115] px-2.5 py-1 rounded-lg border border-slate-800 text-xs">
                            {isPasswordVisible ? op.password : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(op.id)}
                            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                            title={isPasswordVisible ? 'Ocultar senha' : 'Ver senha'}
                          >
                            {isPasswordVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyCredentials(op)}
                            className={`p-1 rounded-lg transition-colors cursor-pointer ${
                              isCopied 
                                ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-900/50' 
                                : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-800'
                            }`}
                            title="Copiar dados de acesso para WhatsApp"
                          >
                            {isCopied ? <Check size={13} /> : <Copy size={13} />}
                          </button>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 font-mono text-slate-300 text-xs">
                        {op.phone ? (
                          <span className="flex items-center gap-1.5 text-slate-300">
                            <Phone size={12} className="text-slate-500" />
                            {op.phone}
                          </span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>

                      {/* Access Level Badge */}
                      <td className="py-3.5 px-4">
                        <span className="text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-blue-950/40 text-blue-400 border border-blue-900/50">
                          Operador (Simplificado)
                        </span>
                      </td>

                      {/* Validity */}
                      <td className="py-3.5 px-4">
                        {isExpired ? (
                          <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-rose-950/40 text-rose-400 border border-rose-900/50">
                            Expirado
                          </span>
                        ) : op.duration === 'indeterminado' ? (
                          <span className="text-[10px] text-emerald-400 font-semibold">
                            Indeterminado
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-300 font-mono">
                            {op.duration} dias ({op.expiresAt ? new Date(op.expiresAt).toLocaleDateString('pt-BR') : ''})
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(op)}
                            className="p-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 border border-slate-750 cursor-pointer transition-all"
                            title="Editar operador"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(op.id)}
                            className="p-1.5 rounded-lg bg-slate-850 hover:bg-rose-950/30 text-slate-400 hover:text-rose-400 border border-slate-750 cursor-pointer transition-all"
                            title="Excluir operador"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Operator Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#161B22] border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col relative"
            >
              <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-emerald-400">
                  <UserPlus size={20} />
                  <h3 className="text-base font-bold text-white uppercase tracking-wide">
                    {editingOperator ? 'Editar Operador' : 'Cadastrar Novo Operador'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveOperator} className="p-6 space-y-4">
                {formError && (
                  <div className="p-3 bg-rose-950/30 border border-rose-900/40 rounded-xl text-rose-400 text-xs flex items-start gap-2 animate-shake">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Nome Completo do Funcionário *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Carlos Eduardo da Silva"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#0F1115] border border-slate-850 rounded-xl text-xs text-white placeholder-slate-650 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                {/* Username & Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Nome de Usuário (Login) *
                    </label>
                    <input
                      type="text"
                      required
                      autoCapitalize="none"
                      placeholder="Ex: carlos.desp"
                      value={username}
                      onChange={e => setUsername(e.target.value.replace(/\s+/g, '').toLowerCase())}
                      className="w-full px-3.5 py-2.5 bg-[#0F1115] border border-slate-850 rounded-xl text-xs text-emerald-400 font-mono placeholder-slate-650 focus:outline-none focus:border-emerald-500 font-bold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Senha de Acesso *
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowFormPassword(!showFormPassword)}
                        className="text-[9px] text-slate-400 hover:text-emerald-400 uppercase"
                      >
                        {showFormPassword ? 'Ocultar' : 'Mostrar'}
                      </button>
                    </div>
                    <input
                      type={showFormPassword ? 'text' : 'password'}
                      required
                      placeholder="Mínimo 4 caracteres"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#0F1115] border border-slate-850 rounded-xl text-xs text-white font-mono placeholder-slate-650 focus:outline-none focus:border-emerald-500 font-bold"
                    />
                  </div>
                </div>

                {/* Phone & CPF */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Telefone / WhatsApp
                    </label>
                    <input
                      type="text"
                      placeholder="(00) 00000-0000"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#0F1115] border border-slate-850 rounded-xl text-xs text-white placeholder-slate-650 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      CPF
                    </label>
                    <input
                      type="text"
                      placeholder="000.000.000-00"
                      value={cpf}
                      onChange={e => setCpf(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#0F1115] border border-slate-850 rounded-xl text-xs text-white placeholder-slate-650 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>

                {/* Validity Duration */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Validade do Acesso
                  </label>
                  <select
                    value={duration}
                    onChange={e => setDuration(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-[#0F1115] border border-slate-850 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-bold uppercase cursor-pointer"
                  >
                    <option value="indeterminado">Acesso Indeterminado (Permanente)</option>
                    <option value="30">30 Dias (1 Mês)</option>
                    <option value="15">15 Dias</option>
                    <option value="7">7 Dias</option>
                  </select>
                </div>

                <div className="p-3 bg-[#0F1115] border border-slate-850 rounded-xl text-[10.5px] text-slate-400 space-y-1">
                  <span className="font-bold text-emerald-400 uppercase tracking-wider block">Permissões do Operador:</span>
                  <p>
                    • Acesso exclusivo ao Painel Geral simplificado (Serviços Prestados, Saldo Geral e Contas a Receber).
                  </p>
                  <p>
                    • Lançamento de serviços e despesas compartilhados em tempo real com o administrador.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs uppercase cursor-pointer transition-all active:scale-[0.98]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs uppercase cursor-pointer transition-all shadow-lg shadow-emerald-650/20 active:scale-[0.98]"
                  >
                    {isSaving ? 'Salvando...' : (editingOperator ? 'Salvar Alterações' : 'Confirmar Cadastro')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {confirmDeleteId !== null && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#161B22] border-2 border-rose-500/30 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col p-6 relative text-center space-y-4"
            >
              <div className="mx-auto w-12 h-12 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center text-rose-400">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wide">
                  Excluir Operador?
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Tem certeza de que deseja remover o acesso deste operador? Esta ação não afetará os lançamentos já efetuados por ele no sistema.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs uppercase cursor-pointer transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const id = confirmDeleteId;
                    setConfirmDeleteId(null);
                    if (id) {
                      await onDeleteOperator(id);
                    }
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase cursor-pointer transition-all shadow-lg shadow-rose-650/20"
                >
                  Confirmar Exclusão
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
