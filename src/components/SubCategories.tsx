/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SubCategory } from '../types';
import { Trash2, Plus, Info, RefreshCw, ClipboardList, Pencil, Check, X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SubCategoriesProps {
  subCategories: SubCategory[];
  onAddSubCategory: (name: string, defaultValue: number, type: 'RECEITA' | 'GASTO') => void;
  onRemoveSubCategory: (id: string) => void;
  onEditSubCategory: (id: string, name: string, defaultValue: number) => void;
}

export default function SubCategories({
  subCategories,
  onAddSubCategory,
  onRemoveSubCategory,
  onEditSubCategory
}: SubCategoriesProps) {
  const [newSubName, setNewSubName] = useState('');
  const [newSubValue, setNewSubValue] = useState<number | ''>('');
  const [newSubType, setNewSubType] = useState<'RECEITA' | 'GASTO'>('RECEITA');
  const [filterType, setFilterType] = useState<'ALL' | 'RECEITA' | 'GASTO'>('ALL');
  const [errorMsg, setErrorMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // States for subcategory editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingValue, setEditingValue] = useState<number | ''>('');

  const filteredList = subCategories.filter(sub => {
    const matchesTab = filterType === 'ALL' || (sub.type || 'RECEITA') === filterType;
    if (!matchesTab) return false;
    if (!searchTerm.trim()) return true;
    return sub.name.toUpperCase().includes(searchTerm.toUpperCase().trim());
  });

  const isSubCategoryFixed = (sub: SubCategory) => {
    const name = sub.name.trim().toUpperCase();
    const type = sub.type || 'RECEITA';
    if (type === 'RECEITA') {
      return ['PLACA', 'HONORARIO', 'RET. CRLV-E', 'ATPV-E', 'HONORÁRIO', 'HONORARIOS', 'HONORÁRIOS', 'HONORARIO REVENDA', 'HONORÁRIO REVENDA', 'HONORARIOS REVENDA', 'HONORÁRIOS REVENDA'].includes(name);
    }
    if (type === 'GASTO') {
      return ['PLACA'].includes(name);
    }
    return false;
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(val);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!newSubName.trim()) {
      setErrorMsg('Por favor, informe o nome da subcategoria.');
      return;
    }

    const cleanName = newSubName.trim().toUpperCase();

    // Check if duplicate existence within same type
    if (subCategories.some(sub => sub.name.toUpperCase() === cleanName && (sub.type || 'RECEITA') === newSubType)) {
      setErrorMsg(`Essa subcategoria já está cadastrada como ${newSubType === 'RECEITA' ? 'Receita' : 'Gasto'}.`);
      return;
    }

    if (newSubValue === '' || newSubValue < 0) {
      setErrorMsg('Por favor, informe um valor padrão válido (maior ou igual a R$ 0).');
      return;
    }

    onAddSubCategory(cleanName, Number(newSubValue), newSubType);
    setNewSubName('');
    setNewSubValue('');
  };

  const handleStartEdit = (sub: SubCategory) => {
    setEditingId(sub.id);
    setEditingName(sub.name);
    setEditingValue(sub.defaultValue);
    setErrorMsg('');
  };

  const handleSaveEdit = (id: string) => {
    setErrorMsg('');

    if (!editingName.trim()) {
      setErrorMsg('Por favor, informe o nome da subcategoria.');
      return;
    }

    const cleanName = editingName.trim().toUpperCase();
    const currentSub = subCategories.find(s => s.id === id);

    if (currentSub) {
      // Check if duplicate existence within same type, excluding itself
      const type = currentSub.type || 'RECEITA';
      if (subCategories.some(sub => sub.id !== id && sub.name.toUpperCase() === cleanName && (sub.type || 'RECEITA') === type)) {
        setErrorMsg(`Já existe outra subcategoria com este nome para o tipo ${type === 'RECEITA' ? 'Receita' : 'Gasto'}.`);
        return;
      }
    }

    if (editingValue === '' || editingValue < 0) {
      setErrorMsg('Por favor, informe um valor padrão válido.');
      return;
    }

    onEditSubCategory(id, cleanName, Number(editingValue));
    setEditingId(null);
    setEditingName('');
    setEditingValue('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
    setEditingValue('');
    setErrorMsg('');
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header section */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-3xl font-bold tracking-tight text-white">Gerenciador de Subcategorias</h1>
        <p className="text-slate-400 text-sm mt-1">Configure as taxas de Detran, valores de placas e impostos recorrentes do seu escritório.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Creation Form Column */}
        <div className="bg-[#161B22] border border-slate-800 rounded-2xl p-6 shadow-sm h-fit">
          <div className="flex items-center gap-2 mb-4 text-emerald-400">
            <ClipboardList size={18} />
            <h2 className="text-md font-bold text-white">Nova Subcategoria</h2>
          </div>
          <p className="text-xs text-slate-400 mb-5">Estipule o nome (ex: TAXA, VISTORIA, IMPOSTO) e o preço correspondente padrão para autopreenchimento.</p>

          <form onSubmit={handleCreate} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-rose-950/30 border border-rose-900/30 rounded-xl text-xs text-rose-400 font-medium">
                {errorMsg}
              </div>
            )}

            <div>
              <label htmlFor="sub-name" className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">
                Nome da Subcategoria
              </label>
              <input
                id="sub-name"
                type="text"
                value={newSubName}
                onChange={e => setNewSubName(e.target.value)}
                placeholder="Exemplo: TAXA, PLACA, IMPOSTO, ALUGUEL"
                className="w-full px-3.5 py-2.5 bg-[#0F1115] border border-slate-850 rounded-xl text-sm placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-white font-bold uppercase"
              />
            </div>

            <div>
              <label htmlFor="sub-type" className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">
                Tipo (Vincular a)
              </label>
              <select
                id="sub-type"
                value={newSubType}
                onChange={e => setNewSubType(e.target.value as 'RECEITA' | 'GASTO')}
                className="w-full px-3.5 py-2.5 bg-[#0F1115] border border-slate-850 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-slate-200 font-bold cursor-pointer"
              >
                <option value="RECEITA">RECEITA (Serviços)</option>
                <option value="GASTO">GASTO (Despesas / Registro de Gastos)</option>
              </select>
            </div>

            <div>
              <label htmlFor="sub-val" className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">
                Valor Padrão (R$)
              </label>
              <div className="relative rounded-xl shadow-xs">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 text-xs font-bold font-mono">
                  R$
                </span>
                <input
                  id="sub-val"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newSubValue}
                  onChange={e => {
                    const v = e.target.value;
                    setNewSubValue(v === '' ? '' : parseFloat(v));
                  }}
                  placeholder="0,00"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-[#0F1115] border border-slate-850 rounded-xl text-sm font-mono placeholder-slate-650 focus:outline-none focus:border-emerald-500 text-white font-semibold"
                />
              </div>
            </div>

            <button
              id="btn-add-subcat"
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-950/20 transition-all border border-emerald-505/20 mt-2 cursor-pointer"
            >
              <Plus size={16} />
              Criar Subcategoria
            </button>
          </form>

          {/* Business guidance */}
          <div className="mt-6 border-t border-slate-800 pt-5 space-y-3">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Info size={14} className="text-slate-400" />
              Como funciona no sistema?
            </h4>
            <p className="text-[11px] text-slate-400 leading-normal">
              Subcategorias de <strong>RECEITA</strong> são usadas para preencher itens e taxas de novos serviços. No preenchimento, o valor padrão é puxado automaticamente.<br /><br />
              Subcategorias de <strong>GASTO</strong> determinam as opções de categorias disponíveis na aba de <strong>Registro de Gastos</strong>, permitindo estender os centros de custos dinamicamente.
            </p>
          </div>
        </div>

        {/* Existing Subcategories List Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#161B22] border border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">Subcategorias Ativas</h3>
                <p className="text-xs text-slate-400 mt-0.5">Lista detalhada de todas as taxas e categorias</p>
              </div>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Campo de Busca / Filtro */}
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Filtrar subcategoria..."
                    className="w-full sm:w-48 pl-3 pr-8 py-1.5 bg-[#0F1115] border border-slate-850 rounded-xl text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-white font-semibold"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-white"
                      title="Limpar busca"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Filter Buttons */}
                <div className="flex bg-[#0F1115] p-1 rounded-xl border border-slate-850 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setFilterType('ALL')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      filterType === 'ALL'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Todas
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType('RECEITA')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      filterType === 'RECEITA'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Receitas
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType('GASTO')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      filterType === 'GASTO'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Gastos
                  </button>
                </div>
              </div>
            </div>

            {/* Safeguard History Advisory Message */}
            <div className="mb-5 p-3.5 bg-blue-950/20 border border-blue-900/30 rounded-xl flex items-start gap-2.5 text-xs text-blue-400 leading-relaxed font-medium">
              <AlertTriangle size={15} className="mt-0.5 text-blue-300 shrink-0" />
              <div>
                <p className="font-bold text-blue-300">Alterações Seguras de Valor Padrão:</p>
                As taxas e correções que você editar aqui se aplicam somente para autopreenchimento de cadastros futuros. Todos os serviços e despesas que você já lançou historicamente continuam guardados de forma totalmente intacta e segura.
              </div>
            </div>

            {/* List */}
            {filteredList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 border border-dashed border-slate-800 rounded-2xl text-center">
                <ClipboardList className="text-slate-600 w-12 h-12 mb-3" />
                <h4 className="font-bold text-slate-400 text-sm">Nenhuma subcategoria encontrada</h4>
                <p className="text-xs text-slate-500 max-w-xs mt-1 mx-4">
                  {searchTerm ? 'Tente buscar por outro termo ou limpe o filtro.' : 'Crie novas categorias usando o formulário para organizá-las aqui.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[485px] overflow-y-auto pr-1">
                <AnimatePresence initial={false}>
                  {filteredList.map((sub) => {
                    const isGasto = (sub.type || 'RECEITA') === 'GASTO';
                      const isEditing = editingId === sub.id;

                      if (isEditing) {
                        return (
                          <motion.div
                            key={sub.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                            layout
                            className="p-4 bg-[#141820] border-2 border-emerald-500 rounded-xl flex flex-col justify-between transition-all shadow-md relative overflow-hidden"
                          >
                            <span className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${isGasto ? 'from-rose-500 to-orange-500' : 'from-emerald-500 to-teal-500'}`}></span>
                            
                            <div className="space-y-3 pt-1.5">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-1">
                                  <Pencil size={10} /> Editando Taxa
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">{sub.type || 'RECEITA'}</span>
                              </div>

                              <div>
                                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5 tracking-wide">
                                  Nome da Subcategoria {isSubCategoryFixed(sub) && <span className="text-amber-500 font-extrabold text-[8px] tracking-widest ml-1 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">(NOME FIXO BLOQUEADO)</span>}
                                </label>
                                <input
                                  type="text"
                                  value={editingName}
                                  onChange={e => !isSubCategoryFixed(sub) && setEditingName(e.target.value)}
                                  disabled={isSubCategoryFixed(sub)}
                                  className={`w-full px-2.5 py-1.5 bg-[#0F1115] border border-slate-755 rounded-lg text-xs placeholder-slate-650 focus:outline-none text-white font-bold uppercase ${isSubCategoryFixed(sub) ? 'opacity-60 cursor-not-allowed select-none border-amber-500/20 bg-amber-500/[0.02]' : 'focus:border-emerald-500'}`}
                                  placeholder="Nome"
                                />
                              </div>

                              <div>
                                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5 tracking-wide">Novo Valor Padrão (R$)</label>
                                <div className="relative rounded-lg shadow-sm">
                                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-500 text-[10px] font-bold font-mono">
                                    R$
                                  </span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={editingValue}
                                    onChange={e => {
                                      const v = e.target.value;
                                      setEditingValue(v === '' ? '' : parseFloat(v));
                                    }}
                                    className="w-full pl-7 pr-2.5 py-1.5 bg-[#0F1115] border border-slate-755 rounded-lg text-xs font-mono placeholder-slate-650 focus:outline-none focus:border-emerald-500 text-white font-semibold"
                                    placeholder="0,00"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 flex gap-2 justify-end border-t border-slate-850 pt-2.5">
                              <button
                                type="button"
                                onClick={() => handleCancelEdit()}
                                className="p-1 px-2.5 flex items-center gap-1 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-400 text-xs font-bold transition-all border border-slate-755 cursor-pointer"
                                title="Cancelar"
                              >
                                <X size={12} />
                                <span>Cancelar</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveEdit(sub.id)}
                                className="p-1 px-2.5 flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all border border-emerald-505/20 cursor-pointer shadow-sm animate-pulse"
                                title="Salvar Alteração"
                              >
                                <Check size={12} />
                                <span>Salvar</span>
                              </button>
                            </div>
                          </motion.div>
                        );
                      }

                      return (
                        <motion.div
                          key={sub.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                          layout
                          className="p-4 bg-[#0F1115] border border-slate-850 rounded-xl flex flex-col justify-between hover:border-slate-700 transition-all shadow-xs relative overflow-hidden group"
                        >
                          {/* Accent highlight */}
                          <span className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${isGasto ? 'from-rose-500 to-orange-500' : 'from-emerald-500 to-teal-500'}`}></span>

                          <div className="flex justify-between items-start pt-1.5">
                            <div className="space-y-1">
                              {isGasto ? (
                                <span className="text-[10px] font-bold text-rose-450 bg-rose-950/30 border border-rose-900/30 px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                                  Gasto (Despesa)
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-600/10 border border-emerald-900/30 px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                                  Receita (Serviço)
                                </span>
                              )}
                              <h4 className="text-sm font-bold text-white font-mono tracking-wide mt-1">{sub.name}</h4>
                            </div>
                            <div className="flex gap-1.5 shrink-0">
                              {/* Edit Action Button */}
                              <button
                                type="button"
                                onClick={() => handleStartEdit(sub)}
                                className="p-1 px-1.5 rounded-lg bg-slate-850 hover:bg-emerald-600/20 text-slate-400 hover:text-emerald-450 transition-all border border-slate-755 cursor-pointer"
                                title="Editar Valor Padrão"
                              >
                                <Pencil size={13} />
                              </button>
                              {/* Remove Action Button */}
                              {isSubCategoryFixed(sub) ? (
                                <button
                                  type="button"
                                  disabled
                                  className="p-1 px-1.5 rounded-lg bg-[#141820] text-slate-650 border border-slate-850 cursor-not-allowed"
                                  title="Esta subcategoria é fixa e essencial para os cálculos de saldo consolidado e quantitativo do sistema"
                                >
                                  <Trash2 size={13} className="opacity-30" />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => onRemoveSubCategory(sub.id)}
                                  className="p-1 px-1.5 rounded-lg bg-slate-850 hover:bg-rose-955/20 text-slate-400 hover:text-rose-450 transition-all border border-slate-755 cursor-pointer"
                                  title="Remover Subcategoria"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="mt-4 flex justify-between items-baseline border-t border-slate-850 pt-2.5">
                            <span className="text-[10px] text-slate-450 uppercase font-bold">Valor padrão:</span>
                            <span className="text-sm font-bold font-mono text-white">
                              {formatCurrency(sub.defaultValue)}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
