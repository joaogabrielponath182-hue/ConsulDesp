/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  Pencil, 
  Search, 
  Phone, 
  Building2, 
  FileText, 
  X, 
  AlertCircle,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Client } from '../types';

interface ClientsProps {
  clients: Client[];
  onAddClient: (client: Omit<Client, 'id'>) => Promise<Client>;
  onRemoveClient: (id: string) => void;
  onUpdateClient: (client: Client) => void;
}

export default function Clients({
  clients,
  onAddClient,
  onRemoveClient,
  onUpdateClient
}: ClientsProps) {
  // Search & Filter
  const [search, setSearch] = useState('');

  // Editing state
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [cnpj, setCnpj] = useState('');

  // Errors state
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form Toggle
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [confirmDeleteClientId, setConfirmDeleteClientId] = useState<string | null>(null);

  // Form input formatting helpers
  const formatCPF = (value: string) => {
    const clean = value.replace(/\D/g, '').slice(0, 11);
    if (clean.length <= 3) return clean;
    if (clean.length <= 6) return `${clean.slice(0, 3)}.${clean.slice(3)}`;
    if (clean.length <= 9) return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6)}`;
    return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9)}`;
  };

  const formatCNPJ = (value: string) => {
    const clean = value.replace(/\D/g, '').slice(0, 14);
    if (clean.length <= 2) return clean;
    if (clean.length <= 5) return `${clean.slice(0, 2)}.${clean.slice(2)}`;
    if (clean.length <= 8) return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5)}`;
    if (clean.length <= 12) return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8)}`;
    return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8, 12)}-${clean.slice(12)}`;
  };

  const formatPhone = (value: string) => {
    const clean = value.replace(/\D/g, '').slice(0, 11);
    if (clean.length <= 2) return clean;
    if (clean.length <= 7) return `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(formatCPF(e.target.value));
  };

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCnpj(formatCNPJ(e.target.value));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  // Filter clients
  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const q = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.cpf.replace(/\D/g, '').includes(q) ||
        c.phone.replace(/\D/g, '').includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.cnpj.replace(/\D/g, '').includes(q)
      );
    });
  }, [clients, search]);

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name.trim()) {
      setErrorMsg('O nome do cliente é obrigatório.');
      return;
    }

    const isDuplicate = clients.some(c => 
      c.name.trim().toLowerCase() === name.trim().toLowerCase() && 
      (!editingClient || c.id !== editingClient.id)
    );

    if (isDuplicate) {
      setErrorMsg('Cliente já cadastrado.');
      return;
    }

    const clientData = {
      name: name.trim(),
      cpf: cpf.trim(),
      phone: phone.trim(),
      company: company.trim(),
      cnpj: cnpj.trim()
    };

    try {
      if (editingClient) {
        onUpdateClient({
          ...editingClient,
          ...clientData
        });
        setSuccessMsg('Cliente atualizado com sucesso!');
      } else {
        await onAddClient(clientData);
        setSuccessMsg('Cliente cadastrado com sucesso!');
      }

      // Reset Form fields
      setName('');
      setCpf('');
      setPhone('');
      setCompany('');
      setCnpj('');
      setEditingClient(null);
      
      // Close form after a short delay
      setTimeout(() => {
        setIsFormOpen(false);
        setSuccessMsg('');
      }, 1500);

    } catch (err) {
      setErrorMsg('Erro ao salvar os dados do cliente.');
    }
  };

  const startEdit = (client: Client) => {
    setEditingClient(client);
    setName(client.name);
    setCpf(client.cpf);
    setPhone(client.phone);
    setCompany(client.company);
    setCnpj(client.cnpj);
    setIsFormOpen(true);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const cancelEdit = () => {
    setEditingClient(null);
    setName('');
    setCpf('');
    setPhone('');
    setCompany('');
    setCnpj('');
    setIsFormOpen(false);
    setErrorMsg('');
    setSuccessMsg('');
  };

  return (
    <div className="space-y-6 select-none text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white uppercase font-sans flex items-center gap-2">
            <Users className="text-emerald-500" size={24} />
            Cadastro de Clientes
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Gerencie a lista de clientes para vincular rapidamente aos serviços prestados.
          </p>
        </div>

        {!isFormOpen && (
          <button
            onClick={() => {
              setIsFormOpen(true);
              setEditingClient(null);
            }}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/10 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Plus size={16} />
            Novo Cliente
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-[#161B22] border border-slate-800 rounded-2xl p-5 shadow-sm overflow-hidden"
          >
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
              <span className="text-xs font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                {editingClient ? <Pencil size={14} /> : <Plus size={14} />}
                {editingClient ? 'Editar Cadastro de Cliente' : 'Formulário de Cadastro'}
              </span>
              <button
                onClick={cancelEdit}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-950/30 border border-rose-900/30 rounded-xl text-xs text-rose-455 font-semibold flex items-center gap-2">
                  <AlertCircle size={14} />
                  {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="p-3 bg-emerald-950/30 border border-emerald-900/30 rounded-xl text-xs text-emerald-400 font-semibold flex items-center gap-2">
                  <Check size={14} />
                  {successMsg}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nome */}
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wide">
                    Nome Completo <span className="text-emerald-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ex: João Silva de Souza"
                    className="w-full px-3.5 py-2.5 bg-[#0F1115] border border-slate-850 rounded-xl text-sm placeholder-slate-650 focus:outline-none focus:border-emerald-500 text-white transition-all duration-200"
                  />
                </div>

                {/* CPF */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wide">
                    CPF
                  </label>
                  <input
                    type="text"
                    value={cpf}
                    onChange={handleCpfChange}
                    placeholder="000.000.000-00"
                    className="w-full px-3.5 py-2.5 bg-[#0F1115] border border-slate-850 rounded-xl text-sm placeholder-slate-650 focus:outline-none focus:border-emerald-500 text-white font-mono transition-all duration-200"
                  />
                </div>

                {/* Telefone */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wide">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="(00) 00000-0000"
                    className="w-full px-3.5 py-2.5 bg-[#0F1115] border border-slate-850 rounded-xl text-sm placeholder-slate-650 focus:outline-none focus:border-emerald-500 text-white font-mono transition-all duration-200"
                  />
                </div>

                {/* Empresa */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wide">
                    Empresa
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    placeholder="Ex: Auto Locadora Ltda"
                    className="w-full px-3.5 py-2.5 bg-[#0F1115] border border-slate-850 rounded-xl text-sm placeholder-slate-650 focus:outline-none focus:border-emerald-500 text-white transition-all duration-200"
                  />
                </div>

                {/* CNPJ */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wide">
                    CNPJ
                  </label>
                  <input
                    type="text"
                    value={cnpj}
                    onChange={handleCnpjChange}
                    placeholder="00.000.000/0000-00"
                    className="w-full px-3.5 py-2.5 bg-[#0F1115] border border-slate-850 rounded-xl text-sm placeholder-slate-650 focus:outline-none focus:border-emerald-500 text-white font-mono transition-all duration-200"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wide transition-all border border-slate-750 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wide transition-all shadow-md shadow-emerald-600/15 cursor-pointer"
                >
                  {editingClient ? 'Salvar Alterações' : 'Salvar Cadastro'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clients list table and search */}
      <div className="bg-[#161B22] border border-slate-800 rounded-2xl overflow-hidden p-5 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Pesquisar por nome, CPF, telefone, empresa ou CNPJ..."
            className="w-full pl-9 pr-4 py-2 bg-[#0F1115] border border-slate-850 rounded-xl text-xs placeholder-slate-650 focus:outline-none focus:border-emerald-500 text-white transition-all duration-200"
          />
        </div>

        {/* List Grid / Table */}
        {filteredClients.length === 0 ? (
          <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
            <Users size={32} className="text-slate-600" />
            <p className="text-xs font-bold uppercase tracking-wide">Nenhum cliente encontrado</p>
            <p className="text-[10px] text-slate-600 max-w-xs">
              {search ? 'Tente ajustar os filtros de pesquisa.' : 'Cadastre seu primeiro cliente para iniciar.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Nome</th>
                  <th className="py-3 px-4">CPF</th>
                  <th className="py-3 px-4">Telefone</th>
                  <th className="py-3 px-4">Empresa / CNPJ</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-xs">
                {filteredClients.map(client => (
                  <tr key={client.id} className="hover:bg-slate-900/30 transition-all">
                    <td className="py-3.5 px-4 font-bold text-white">
                      {client.name}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-350">
                      {client.cpf || <span className="text-slate-650 italic text-[10px]">Não informado</span>}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-350 flex items-center gap-1.5">
                      {client.phone ? (
                        <>
                          <Phone size={11} className="text-slate-500" />
                          {client.phone}
                        </>
                      ) : (
                        <span className="text-slate-650 italic text-[10px]">Não informado</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-350">
                      {client.company || client.cnpj ? (
                        <div className="space-y-0.5">
                          {client.company && (
                            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-300">
                              <Building2 size={10} className="text-slate-500" />
                              {client.company}
                            </div>
                          )}
                          {client.cnpj && (
                            <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500">
                              <FileText size={9} />
                              {client.cnpj}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-650 italic text-[10px]">Não informado</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => startEdit(client)}
                          className="p-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 border border-slate-755 transition-colors cursor-pointer"
                          title="Editar dados"
                        >
                          <Pencil size={12} />
                        </button>
                        {confirmDeleteClientId === client.id ? (
                          <div className="flex items-center gap-1 animate-fadeIn">
                            <button
                              onClick={() => {
                                onRemoveClient(client.id);
                                setConfirmDeleteClientId(null);
                              }}
                              className="px-1.5 py-1 text-[9px] font-black bg-rose-600 hover:bg-rose-500 text-white uppercase rounded transition-all cursor-pointer shadow-md"
                              title="Confirmar exclusão de cliente"
                            >
                              Confirmar
                            </button>
                            <button
                              onClick={() => setConfirmDeleteClientId(null)}
                              className="px-1 py-1 text-[9px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-400 uppercase rounded transition-all cursor-pointer"
                            >
                              Não
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteClientId(client.id)}
                            className="p-1.5 rounded-lg bg-slate-850 hover:bg-rose-950/30 text-slate-400 hover:text-rose-455 border border-slate-755 transition-colors cursor-pointer"
                            title="Excluir"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
