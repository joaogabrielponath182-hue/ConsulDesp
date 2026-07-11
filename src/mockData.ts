/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SubCategory, Service, Expense } from './types';

export const DEFAULT_SUBCATEGORIES: SubCategory[] = [
  { id: 'sub-fixed-p-r', name: 'PLACA', defaultValue: 280, type: 'RECEITA' },
  { id: 'sub-fixed-h-r', name: 'HONORARIO', defaultValue: 150, type: 'RECEITA' },
  { id: 'sub-fixed-hr-r', name: 'HONORARIO REVENDA', defaultValue: 50, type: 'RECEITA' },
  { id: 'sub-fixed-r-r', name: 'RET. CRLV-E', defaultValue: 35, type: 'RECEITA' },
  { id: 'sub-fixed-a-r', name: 'ATPV-E', defaultValue: 65, type: 'RECEITA' },
  { id: 'sub-fixed-p-g', name: 'PLACA', defaultValue: 222.22, type: 'GASTO' }
];

export const getDefaultsForUser = (username: string): SubCategory[] => {
  return [
    { id: 'sub-fixed-p-r', name: 'PLACA', defaultValue: 280, type: 'RECEITA' },
    { id: 'sub-fixed-h-r', name: 'HONORARIO', defaultValue: 150, type: 'RECEITA' },
    { id: 'sub-fixed-hr-r', name: 'HONORARIO REVENDA', defaultValue: 50, type: 'RECEITA' },
    { id: 'sub-fixed-r-r', name: 'RET. CRLV-E', defaultValue: 35, type: 'RECEITA' },
    { id: 'sub-fixed-a-r', name: 'ATPV-E', defaultValue: 65, type: 'RECEITA' },
    { id: 'sub-fixed-p-g', name: 'PLACA', defaultValue: 222.22, type: 'GASTO' }
  ];
};

export const DEFAULT_SERVICES: Service[] = [];

export const DEFAULT_EXPENSES: Expense[] = [];
