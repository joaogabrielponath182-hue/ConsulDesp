import React, { useState, useEffect } from 'react';
import { Lead } from '../types';
import { Search, Mail, Phone, Building, Calendar, Trash2, CheckCircle, Clock, XCircle, RefreshCw } from 'lucide-react';
import { collection, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function LeadsManagement() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'PENDENTE' | 'CONTATADO' | 'REJEITADO'>('TODOS');

  const fetchLeads = async () => {
    setLoading(true);
    try {
      if (db) {
        const snapshot = await getDocs(collection(db, 'site_leads'));
        const list: Lead[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            name: data.name || '',
            email: data.email || '',
            phone: data.phone || '',
            agency: data.agency || '',
            createdAt: data.createdAt || new Date().toISOString(),
            status: data.status || 'PENDENTE'
          });
        });
        setLeads(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      }
    } catch (err) {
      console.error('Erro ao buscar leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleUpdateStatus = async (id: string, status: Lead['status']) => {
    try {
      if (db) {
        await updateDoc(doc(db, 'site_leads', id), { status });
      }
      setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    } catch (err) {
      console.error('Erro ao atualizar status do lead:', err);
    }
  };

  const handleDeleteLead = async (id: string) => {
    if (!confirm('Deseja realmente remover este lead?')) return;
    try {
      if (db) {
        await deleteDoc(doc(db, 'site_leads', id));
      }
      setLeads(prev => prev.filter(l => l.id !== id));
    } catch (err) {
      console.error('Erro ao remover lead:', err);
    }
  };

  const filtered = leads.filter(l => {
    const matchesSearch = 
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.phone.includes(search) ||
      (l.agency && l.agency.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'TODOS' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Mail className="w-6 h-6 text-emerald-400" />
            <span>Leads e Demonstrações do Site</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Contatos capturados na landing page e solicitação de test-drive do sistema.
          </p>
        </div>

        <button
          onClick={fetchLeads}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Atualizar Lista</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, telefone ou despachante..."
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Status:</span>
            {(['TODOS', 'PENDENTE', 'CONTATADO', 'REJEITADO'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer text-[11px] ${
                  statusFilter === st
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3">Data</th>
                <th className="p-3">Nome do Lead</th>
                <th className="p-3">WhatsApp / Telefone</th>
                <th className="p-3">Despachante / Cidade</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Carregando solicitações do Firestore...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Nenhum lead encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filtered.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-mono text-slate-400">
                      {new Date(l.createdAt).toLocaleDateString('pt-BR')} {new Date(l.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-3 font-bold text-white">{l.name}</td>
                    <td className="p-3 font-mono text-emerald-400">
                      <a href={`https://wa.me/55${l.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {l.phone}
                      </a>
                    </td>
                    <td className="p-3 text-slate-300">{l.agency || '—'}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        l.status === 'CONTATADO'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : l.status === 'REJEITADO'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleUpdateStatus(l.id, 'CONTATADO')}
                          className="p-1.5 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                          title="Marcar como Contatado"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(l.id, 'REJEITADO')}
                          className="p-1.5 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
                          title="Marcar como Rejeitado"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteLead(l.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Excluir Lead"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
