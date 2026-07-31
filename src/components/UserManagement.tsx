import React, { useState } from 'react';
import { InternalUser } from '../types';
import { 
  Users, 
  UserPlus, 
  Search, 
  Trash2, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  KeyRound,
  Edit2
} from 'lucide-react';

interface UserManagementProps {
  users: InternalUser[];
  onAddUser: (user: Omit<InternalUser, 'id' | 'createdAt' | 'expiresAt' | 'currentSessionId'>) => Promise<void> | void;
  onRemoveUser: (id: string) => Promise<void> | void;
  onUpdateUser: (user: InternalUser) => Promise<void> | void;
}

export default function UserManagement({
  users,
  onAddUser,
  onRemoveUser,
  onUpdateUser
}: UserManagementProps) {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<InternalUser | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [duration, setDuration] = useState<'7' | '15' | '30' | 'indeterminado'>('30');
  const [errorMsg, setErrorMsg] = useState('');

  const filteredUsers = users.filter((u) => 
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.cpf.includes(search)
  );

  const resetForm = () => {
    setFullName('');
    setCpf('');
    setPhone('');
    setUsername('');
    setPassword('');
    setDuration('30');
    setErrorMsg('');
    setEditingUser(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (u: InternalUser) => {
    setEditingUser(u);
    setFullName(u.fullName);
    setCpf(u.cpf);
    setPhone(u.phone);
    setUsername(u.username);
    setPassword(u.password);
    setDuration(u.duration);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !username.trim() || !password.trim()) {
      setErrorMsg('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      if (editingUser) {
        let expiresAt: string | null = editingUser.expiresAt;
        if (duration !== editingUser.duration) {
          if (duration === 'indeterminado') {
            expiresAt = null;
          } else {
            const days = parseInt(duration);
            const exp = new Date();
            exp.setDate(exp.getDate() + days);
            expiresAt = exp.toISOString();
          }
        }

        await onUpdateUser({
          ...editingUser,
          fullName,
          cpf,
          phone,
          username,
          password,
          duration,
          expiresAt
        });
      } else {
        await onAddUser({
          fullName,
          cpf,
          phone,
          username,
          password,
          duration
        });
      }
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      console.error(err);
      setErrorMsg('Erro ao salvar usuário.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <span>Cadastro e Controle de Usuários</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Gerencie os acessos de operadores, defina prazos de validade e controle quem acessa o sistema.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all cursor-pointer shadow-md shadow-emerald-500/20"
        >
          <UserPlus className="w-4 h-4" />
          <span>Cadastrar Novo Usuário</span>
        </button>
      </div>

      {/* Search & Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, usuário ou CPF..."
            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3">Usuário / Nome</th>
                <th className="p-3">CPF</th>
                <th className="p-3">Telefone</th>
                <th className="p-3">Duração</th>
                <th className="p-3">Validade</th>
                <th className="p-3">Sessão Ativa</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Nenhum usuário cadastrado encontrado.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isExpired = u.expiresAt && new Date(u.expiresAt) < new Date();
                  return (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-white">{u.fullName}</div>
                        <div className="text-[11px] text-emerald-400 font-mono">@{u.username}</div>
                      </td>
                      <td className="p-3 font-mono text-slate-400">{u.cpf || '—'}</td>
                      <td className="p-3 font-mono text-slate-400">{u.phone || '—'}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300">
                          {u.duration === 'indeterminado' ? 'Indeterminado' : `${u.duration} dias`}
                        </span>
                      </td>
                      <td className="p-3 font-mono">
                        {u.expiresAt ? (
                          <span className={isExpired ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                            {new Date(u.expiresAt).toLocaleDateString('pt-BR')}
                            {isExpired && ' (Expirado)'}
                          </span>
                        ) : (
                          <span className="text-emerald-400">Vitalício</span>
                        )}
                      </td>
                      <td className="p-3">
                        {u.currentSessionId ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                            Online
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[10px]">Offline</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditModal(u)}
                            className="p-1.5 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                            title="Editar usuário"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Tem certeza que deseja excluir o usuário @${u.username}?`)) {
                                onRemoveUser(u.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Excluir usuário"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg space-y-4 shadow-2xl">
            <h2 className="text-lg font-bold text-white">
              {editingUser ? 'Editar Usuário' : 'Cadastrar Novo Operador'}
            </h2>

            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">CPF</label>
                  <input
                    type="text"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Telefone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Nome de Usuário (Login) *</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().trim())}
                    placeholder="ex: joao.desp"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Senha de Acesso *</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Duração / Validade do Acesso</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
                >
                  <option value="7">7 dias (Teste)</option>
                  <option value="15">15 dias</option>
                  <option value="30">30 dias (Mensal)</option>
                  <option value="indeterminado">Indeterminado / Sem expiração</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl cursor-pointer"
                >
                  {editingUser ? 'Atualizar Usuário' : 'Salvar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
