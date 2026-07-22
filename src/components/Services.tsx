/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Service, SubCategory, ServiceItem, PaymentMethod, PaymentStatus, Client } from '../types';
import { 
  Plus, 
  Trash2, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  CheckCircle, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Tag, 
  Coins, 
  FileCheck,
  AlertCircle,
  Pencil,
  X,
  ArrowUpDown,
  Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { plateMatchesSearch } from '../utils/plateMatcher';
import { generateReceiptPDF } from '../utils/receiptGenerator';

interface ServicesProps {
  services: Service[];
  subCategories: SubCategory[];
  clients?: Client[];
  onAddSubCategory: (name: string, defaultValue: number, type: 'RECEITA' | 'GASTO') => void;
  onAddService: (service: Omit<Service, 'id' | 'totalValue'>) => void;
  onRemoveService: (id: string | string[]) => void;
  onToggleServiceStatus: (id: string) => void;
  onEditService?: (updated: Service) => void;
  isNewServiceModalOpen?: boolean;
  onCloseNewServiceModal?: () => void;
  viewMode?: 'form' | 'list';
  initialStatusFilter?: string;
  onRedirectToForm?: () => void;
}

export default function Services({
  services,
  subCategories,
  clients = [],
  onAddSubCategory,
  onAddService,
  onRemoveService,
  onToggleServiceStatus,
  onEditService,
  isNewServiceModalOpen,
  onCloseNewServiceModal,
  viewMode = 'form',
  initialStatusFilter = 'all',
  onRedirectToForm
}: ServicesProps) {
  // Filters state
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'oldest' | 'newest'>('newest');
  const [selectedClient, setSelectedClient] = useState<string>('all');

  // Sync selectedStatus with initialStatusFilter prop when it changes
  React.useEffect(() => {
    if (initialStatusFilter) {
      setSelectedStatus(initialStatusFilter);
    }
  }, [initialStatusFilter]);

  // Editing State
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [activeVehicleId, setActiveVehicleId] = useState<string>('');

  // Expanded card rows state
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [confirmDeleteGroupId, setConfirmDeleteGroupId] = useState<string | null>(null);

  // New Service Form State
  const [client, setClient] = useState('');
  const [showClientSearch, setShowClientSearch] = useState(false);

  // Filter clients based on what's typed
  const filteredClientsForForm = React.useMemo(() => {
    if (!clients || clients.length === 0) return [];
    if (!client.trim()) return clients;
    return clients.filter(c => c.name.toLowerCase().includes(client.toLowerCase()));
  }, [clients, client]);

  const [plate, setPlate] = useState('');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('DINHEIRO');
  const [status, setStatus] = useState<PaymentStatus>('PAGO');
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  // Current subcategory item state (for building items array)
  const [currentSubId, setCurrentSubId] = useState<string>('');
  const [currentSubVal, setCurrentSubVal] = useState<number>('');
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);

  // State to hold multiple vehicles under the same customer service setup
  const [addedVehicles, setAddedVehicles] = useState<{
    id: string;
    plate: string;
    paymentMethod: PaymentMethod;
    status: PaymentStatus;
    items: ServiceItem[];
  }[]>([]);

  // State to track services removed during an edit session to delete them on save
  const [removedVehicleIds, setRemovedVehicleIds] = useState<string[]>([]);

  // State to track last launched services group
  const [lastLaunchedGroupId, setLastLaunchedGroupId] = useState<string | null>(() => localStorage.getItem('lastLaunchedGroupId'));

  React.useEffect(() => {
    if (lastLaunchedGroupId) {
      localStorage.setItem('lastLaunchedGroupId', lastLaunchedGroupId);
    } else {
      localStorage.removeItem('lastLaunchedGroupId');
    }
  }, [lastLaunchedGroupId]);

  // Inline Receipt Subcategory Creator State
  const [showInlineSubCatCreator, setShowInlineSubCatCreator] = useState(false);
  const [newSubCatName, setNewSubCatName] = useState('');
  const [newSubCatDefaultVal, setNewSubCatDefaultVal] = useState<number | ''>('');
  const [subCatCreatorError, setSubCatCreatorError] = useState('');
  const [subCatCreatorSuccess, setSubCatCreatorSuccess] = useState('');
  const [lastCreatedSubCatName, setLastCreatedSubCatName] = useState('');

  React.useEffect(() => {
    if (lastCreatedSubCatName) {
      const found = subCategories.find(sub => sub.name.toUpperCase() === lastCreatedSubCatName && (sub.type || 'RECEITA') === 'RECEITA');
      if (found) {
        setCurrentSubId(found.id);
        setCurrentSubVal(found.defaultValue || '');
        setLastCreatedSubCatName('');
      }
    }
  }, [subCategories, lastCreatedSubCatName]);

  const handleCreateSubCategory = (e: React.MouseEvent) => {
    e.preventDefault();
    setSubCatCreatorError('');
    setSubCatCreatorSuccess('');

    if (!newSubCatName.trim()) {
      setSubCatCreatorError('Informe o nome da subcategoria.');
      return;
    }

    const clean = newSubCatName.trim().toUpperCase();

    // Check if it already exists as RECEITA
    const exists = subCategories.some(sub => sub.name.toUpperCase() === clean && (sub.type || 'RECEITA') === 'RECEITA');
    if (exists) {
      setSubCatCreatorError('Essa subcategoria já existe.');
      return;
    }

    onAddSubCategory(clean, Number(newSubCatDefaultVal) || 0, 'RECEITA');
    setSubCatCreatorSuccess(`Subcategoria "${clean}" adicionada!`);
    setLastCreatedSubCatName(clean);
    setNewSubCatName('');
    setNewSubCatDefaultVal('');
    
    // Auto collapse after a short period
    setTimeout(() => {
      setShowInlineSubCatCreator(false);
      setSubCatCreatorSuccess('');
    }, 1500);
  };

  // Errors state
  const [errorMsg, setErrorMsg] = useState('');
  const [itemErrorMsg, setItemErrorMsg] = useState('');

  // Handler to add a vehicle to the list
  const handleAddVehicleToList = (e: React.MouseEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setItemErrorMsg('');

    const finalPlate = plate.trim().toUpperCase() || 'NINFO';

    // Auto-include inputs if they have values but weren't added yet
    let finalItems = [...serviceItems];
    if (currentSubId && currentSubVal !== '' && Number(currentSubVal) >= 0) {
      const sub = subCategories.find(s => s.id === currentSubId);
      if (sub) {
        finalItems.push({
          id: `temp-auto-sub-${Date.now()}-${Math.random()}`,
          subCategoryId: sub.id,
          name: sub.name,
          value: Number(currentSubVal)
        });
      }
    }

    if (finalItems.length === 0) {
      setErrorMsg('Adicione pelo menos uma subcategoria de serviço para este veículo.');
      return;
    }

    const newVehicle = {
      id: activeVehicleId || `vh-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
      plate: finalPlate,
      paymentMethod,
      status,
      items: finalItems
    };

    setAddedVehicles([...addedVehicles, newVehicle]);

    // Reset vehicle fields
    setPlate('');
    setServiceItems([]);
    setPaymentMethod('DINHEIRO');
    setStatus('PAGO');
    setCurrentSubId('');
    setCurrentSubVal('');
    setActiveVehicleId('');
  };

  // Handler to remove a vehicle from the list
  const handleRemoveVehicleFromList = (vId: string) => {
    if (editingService && vId.startsWith('srv-')) {
      setRemovedVehicleIds(prev => [...prev, vId]);
    }
    setAddedVehicles(prev => prev.filter(v => v.id !== vId));
  };

  // Handler to cancel editing the active vehicle and clean fields
  const handleCancelActiveVehicleEdit = () => {
    if (activeVehicleId && plate.trim() !== '' && serviceItems.length > 0) {
      const alreadyInList = addedVehicles.some(v => v.id === activeVehicleId);
      if (!alreadyInList) {
        setAddedVehicles(prev => [...prev, {
          id: activeVehicleId,
          plate: plate.trim().toUpperCase(),
          paymentMethod,
          status,
          items: serviceItems
        }]);
      }
    }

    // Reset fields to ready state for a new plate
    setPlate('');
    setServiceItems([]);
    setPaymentMethod('DINHEIRO');
    setStatus('PAGO');
    setCurrentSubId('');
    setCurrentSubVal('');
    setActiveVehicleId('');
  };

  // Handler to swap/edit an added vehicle from the list
  const handleEditVehicleInList = (vId: string) => {
    const target = addedVehicles.find(v => v.id === vId);
    if (!target) return;

    // Create a list of remaining vehicles
    let nextAddedVehicles = addedVehicles.filter(v => v.id !== vId);

    // If the active fields have data, save them back to the list before loading the new one
    if (plate.trim() && serviceItems.length > 0) {
      const activeVehicleItem = {
        id: activeVehicleId || `vh-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
        plate: plate.trim().toUpperCase(),
        paymentMethod,
        status,
        items: serviceItems
      };
      nextAddedVehicles.push(activeVehicleItem);
    }

    // Load selected vehicle to the active state fields
    setPlate(target.plate);
    setPaymentMethod(target.paymentMethod);
    setStatus(target.status);
    setServiceItems(target.items);
    setActiveVehicleId(target.id);

    // Adjust editingService context to map to the new selected active vehicle
    if (editingService) {
      const fullService = services.find(s => s.id === target.id);
      if (fullService) {
        setEditingService(fullService);
      } else {
        setEditingService({
          ...editingService,
          id: target.id,
          plate: target.plate,
          paymentMethod: target.paymentMethod,
          items: target.items,
          status: target.status,
          totalValue: target.items.reduce((s, k) => s + k.value, 0)
        });
      }
    }

    setAddedVehicles(nextAddedVehicles);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(val);
  };

  // Memoized sorted subcategories for RECEITA ordered by most used (descending)
  const receiptSubCategories = React.useMemo(() => {
    // 1. Filter only 'RECEITA' type
    const filtered = subCategories.filter(sub => (sub.type || 'RECEITA') === 'RECEITA');
    
    // 2. Count usage in all services
    const usageCounts: Record<string, number> = {};
    services.forEach(srv => {
      if (srv.items && Array.isArray(srv.items)) {
        srv.items.forEach(item => {
          if (item.subCategoryId) {
            usageCounts[item.subCategoryId] = (usageCounts[item.subCategoryId] || 0) + 1;
          }
        });
      }
    });

    // 3. Sort by usage count (descending) and then name (alphabetical)
    return [...filtered].sort((a, b) => {
      const countA = usageCounts[a.id] || 0;
      const countB = usageCounts[b.id] || 0;
      if (countB !== countA) {
        return countB - countA;
      }
      return a.name.localeCompare(b.name);
    });
  }, [subCategories, services]);

  // When subcategory changes, autofill default value
  const handleSubCategorySelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setCurrentSubId(id);
    
    const selected = subCategories.find(sub => sub.id === id);
    if (selected) {
      setCurrentSubVal(selected.defaultValue);
    } else {
      setCurrentSubVal('');
    }
    setItemErrorMsg('');
  };

  // Add subcategory to temp items list
  const handleAddSubItem = (e: React.MouseEvent) => {
    e.preventDefault();
    setItemErrorMsg('');

    if (!currentSubId) {
      setItemErrorMsg('Selecione uma subcategoria.');
      return;
    }

    if (currentSubVal === '' || currentSubVal < 0) {
      setItemErrorMsg('Informe um valor acima ou igual a zero.');
      return;
    }

    const sub = subCategories.find(s => s.id === currentSubId);
    if (!sub) return;

    // Create a new unique item ID
    const newItem: ServiceItem = {
      id: `temp-${Date.now()}-${Math.random()}`,
      subCategoryId: sub.id,
      name: sub.name,
      value: Number(currentSubVal)
    };

    setServiceItems([...serviceItems, newItem]);
    // reset selection fields
    setCurrentSubId('');
    setCurrentSubVal('');
  };

  // Remove item from temporarily added items list
  const handleRemoveSubItem = (idToDelete: string) => {
    setServiceItems(serviceItems.filter(item => item.id !== idToDelete));
  };

  const startEditingService = (service: Service) => {
    setEditingService(service);
    setClient(service.client);
    setDescription(service.description);
    setDate(service.date);
    
    // Reset tracked removals
    setRemovedVehicleIds([]);

    // Find ALL services belonging to the exact same group (INCLUDING this one!)
    const linkedGroupServices = services.filter(s => 
      (service.groupId && s.groupId === service.groupId) ||
      (!service.groupId && s.client.trim().toUpperCase() === service.client.trim().toUpperCase() && s.description.trim().toUpperCase() === service.description.trim().toUpperCase() && s.date === service.date)
    );

    // Load ALL of them into addedVehicles
    setAddedVehicles(linkedGroupServices.map(s => ({
      id: s.id,
      plate: s.plate,
      paymentMethod: s.paymentMethod,
      status: s.status,
      items: s.items
    })));

    // Clear active vehicle inputs so the user can easily type a new plate OR click edit on an existing one
    setPlate('');
    setPaymentMethod('DINHEIRO');
    setStatus('PAGO');
    setServiceItems([]);
    setActiveVehicleId('');

    setErrorMsg('');
    setTimeout(() => {
      const inputEl = document.getElementById('srv-client');
      if (inputEl) {
        inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        inputEl.focus();
      }
    }, 60);
  };

  const cancelEditingService = () => {
    setEditingService(null);
    setActiveVehicleId('');
    setClient('');
    setPlate('');
    setDescription('');
    setPaymentMethod('DINHEIRO');
    setStatus('PAGO');
    setServiceItems([]);
    setAddedVehicles([]);
    setRemovedVehicleIds([]);
    setErrorMsg('');
    const today = new Date();
    setDate(today.toISOString().split('T')[0]);
  };

  // Form Submission
  const handleSubmitService = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!client.trim()) {
      setErrorMsg('Por favor, indique o nome do cliente.');
      return;
    }

    if (!description.trim()) {
      setErrorMsg('Por favor, informe a descrição do serviço.');
      return;
    }

    if (!date) {
      setErrorMsg('Selecione a data do serviço.');
      return;
    }

    if (editingService) {
      let activeItems = [...serviceItems];
      if (currentSubId && currentSubVal !== '' && Number(currentSubVal) >= 0) {
        const sub = subCategories.find(s => s.id === currentSubId);
        if (sub) {
          activeItems.push({
            id: `temp-auto-sub-${Date.now()}-${Math.random()}`,
            subCategoryId: sub.id,
            name: sub.name,
            value: Number(currentSubVal)
          });
        }
      }

      const isActiveVehicleFilled = activeItems.length > 0 && plate.trim() !== '';

      if (!isActiveVehicleFilled && addedVehicles.length === 0) {
        setErrorMsg('Adicione pelo menos uma subcategoria de serviço e seu valor.');
        return;
      }

      const finalPlate = plate.trim().toUpperCase() || 'NINFO';
      const commonGroupId = editingService.groupId || `group-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

      // 1. Save changes of the active edited service if it is filled
      if (isActiveVehicleFilled) {
        const targetId = activeVehicleId || `vh-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
        if (targetId.startsWith('srv-')) {
          if (onEditService) {
            const originalSrv = services.find(s => s.id === targetId);
            onEditService({
              ...originalSrv,
              id: targetId,
              client: client.trim(),
              plate: finalPlate,
              description: description.trim(),
              paymentMethod,
              items: activeItems,
              date,
              status,
              totalValue: activeItems.reduce((acc, curr) => acc + curr.value, 0),
              groupId: commonGroupId
            });
          }
        } else {
          onAddService({
            client: client.trim(),
            plate: finalPlate,
            description: description.trim(),
            paymentMethod,
            items: activeItems,
            date,
            status,
            groupId: commonGroupId
          });
        }
      }

      // 2. Save changes to other linked vehicles (or add them if newly created)
      addedVehicles.forEach(v => {
        const vPlate = v.plate.trim().toUpperCase() || 'NINFO';
        if (v.id.startsWith('srv-')) {
          if (onEditService) {
            const originalSrv = services.find(s => s.id === v.id);
            onEditService({
              ...originalSrv,
              id: v.id,
              client: client.trim(),
              plate: vPlate,
              description: description.trim(),
              paymentMethod: v.paymentMethod,
              items: v.items,
              date,
              status: v.status,
              totalValue: v.items.reduce((s, k) => s + k.value, 0),
              groupId: commonGroupId
            });
          }
        } else {
          onAddService({
            client: client.trim(),
            plate: vPlate,
            description: description.trim(),
            paymentMethod: v.paymentMethod,
            items: v.items,
            date,
            status: v.status,
            groupId: commonGroupId
          });
        }
      });

      // 3. Find and delete original services of this group that are no longer present
      const originalGroupServiceIds = services
        .filter(s => s.groupId && s.groupId === editingService.groupId)
        .map(s => s.id);

      const savedServiceIds = new Set<string>();
      if (isActiveVehicleFilled && activeVehicleId.startsWith('srv-')) {
        savedServiceIds.add(activeVehicleId);
      }
      addedVehicles.forEach(v => {
        if (v.id.startsWith('srv-')) {
          savedServiceIds.add(v.id);
        }
      });

      originalGroupServiceIds.forEach(id => {
        if (!savedServiceIds.has(id)) {
          onRemoveService(id);
        }
      });

      // Also delete any specifically tracked removedVehicleIds
      removedVehicleIds.forEach(remId => {
        onRemoveService(remId);
      });

      setEditingService(null);
      setLastLaunchedGroupId(commonGroupId);
    } else {
      // Adding mode - can be single or multi-vehicle
      const finalVehicles = [...addedVehicles];
      
      // Auto-include current screen's plate and items if filled
      let activeItems = [...serviceItems];
      if (currentSubId && currentSubVal !== '' && Number(currentSubVal) >= 0) {
        const sub = subCategories.find(s => s.id === currentSubId);
        if (sub) {
          activeItems.push({
            id: `temp-auto-sub-${Date.now()}-${Math.random()}`,
            subCategoryId: sub.id,
            name: sub.name,
            value: Number(currentSubVal)
          });
        }
      }

      const finalPlate = plate.trim().toUpperCase() || 'NINFO';

      if (activeItems.length > 0) {
        finalVehicles.push({
          id: `temp-auto-${Date.now()}`,
          plate: finalPlate,
          paymentMethod,
          status,
          items: activeItems
        });
      }

      if (finalVehicles.length === 0) {
        if (activeItems.length === 0) {
          setErrorMsg('Adicione pelo menos uma subcategoria de serviço e seu valor.');
          return;
        }
      }

      const commonGroupId = `group-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

      // Record all services
      finalVehicles.forEach(v => {
        onAddService({
          client: client.trim(),
          plate: v.plate || 'NINFO',
          description: description.trim(),
          paymentMethod: v.paymentMethod,
          items: v.items,
          date,
          status: v.status,
          groupId: commonGroupId
        });
      });
      setLastLaunchedGroupId(commonGroupId);
    }

    // Reset Form
    setClient('');
    setPlate('');
    setDescription('');
    setPaymentMethod('DINHEIRO');
    setStatus('PAGO');
    setServiceItems([]);
    setAddedVehicles([]);
    setRemovedVehicleIds([]);
    setErrorMsg('');
    setActiveVehicleId('');
    const today = new Date();
    setDate(today.toISOString().split('T')[0]);

    if (onCloseNewServiceModal) {
      onCloseNewServiceModal();
    }
  };

  // Toggle expanded row card
  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Group services by groupId or (client + description + date) if they have no groupId but were launched together
  const groupedServices = React.useMemo(() => {
    const groups: {
      groupId: string;
      id: string;
      client: string;
      description: string;
      date: string;
      services: Service[];
      totalValue: number;
    }[] = [];

    services.forEach(srv => {
      // Find an existing group this service belongs to
      let foundGroup = groups.find(g => {
        if (srv.groupId && g.groupId === srv.groupId) {
          return true;
        }
        if (!srv.groupId && !g.groupId) {
          // Fallback legacy match: same client, same description, and same date
          return (
            g.client.trim().toUpperCase() === srv.client.trim().toUpperCase() &&
            g.description.trim().toUpperCase() === srv.description.trim().toUpperCase() &&
            g.date === srv.date
          );
        }
        return false;
      });

      if (foundGroup) {
        foundGroup.services.push(srv);
        foundGroup.totalValue += srv.totalValue;
      } else {
        groups.push({
          groupId: srv.groupId || '',
          id: srv.id, // Use first service id as the group id
          client: srv.client,
          description: srv.description,
          date: srv.date,
          services: [srv],
          totalValue: srv.totalValue
        });
      }
    });

    return groups;
  }, [services]);

  // Filters logic on grouped services
  const filteredGroupedServices = React.useMemo(() => {
    const list = groupedServices.filter(group => {
      const matchesSearch = 
        group.client.toLowerCase().includes(search.toLowerCase()) || 
        group.description.toLowerCase().includes(search.toLowerCase()) ||
        group.services.some(srv => 
          plateMatchesSearch(srv.plate, search) ||
          srv.items.some(item => item.name.toLowerCase().includes(search.toLowerCase()))
        );
      
      const matchesStatus = selectedStatus === 'all' || group.services.some(srv => srv.status === selectedStatus);
      const matchesPayment = selectedPaymentMethod === 'all' || group.services.some(srv => srv.paymentMethod === selectedPaymentMethod);

      const matchesStartDate = !startDate || group.date >= startDate;
      const matchesEndDate = !endDate || group.date <= endDate;

      const matchesCategory = selectedCategory === 'all' || group.services.some(srv => 
        srv.items.some(item => item.subCategoryId === selectedCategory)
      );

      const matchesClient = selectedClient === 'all' || group.client.toLowerCase() === selectedClient.toLowerCase();

      return matchesSearch && matchesStatus && matchesPayment && matchesStartDate && matchesEndDate && matchesCategory && matchesClient;
    });

    return list.sort((a, b) => {
      if (sortOrder === 'oldest') {
        return a.date.localeCompare(b.date);
      } else {
        return b.date.localeCompare(a.date);
      }
    });
  }, [groupedServices, search, selectedStatus, selectedPaymentMethod, startDate, endDate, selectedCategory, sortOrder, selectedClient]);

  const totalFilteredRevenues = React.useMemo(() => {
    return filteredGroupedServices.reduce((acc, curr) => {
      const paidSum = curr.services
        .filter(srv => srv.status !== 'PENDENTE')
        .reduce((sum, srv) => sum + srv.totalValue, 0);
      return acc + paidSum;
    }, 0);
  }, [filteredGroupedServices]);

  // Live sum values in new service helper
  const tempTotalValue = serviceItems.reduce((acc, curr) => acc + curr.value, 0);

  // Retrieve services in the last launched/created group for confirmation on the same screen
  const lastLaunchedServices = React.useMemo(() => {
    if (!lastLaunchedGroupId) return [];
    return services.filter(srv => srv.groupId === lastLaunchedGroupId);
  }, [services, lastLaunchedGroupId]);

  const lastLaunchedPanel = (
    <div className="mt-5 bg-[#161B22] border border-emerald-500/25 rounded-2xl p-5 shadow-lg animate-fadeIn text-left space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="text-xs font-black text-white uppercase tracking-widest font-sans">
            Último Lançamento Realizado
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => generateReceiptPDF(lastLaunchedServices)}
            className="text-[9px] text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 hover:border-emerald-500/50 hover:bg-emerald-500/10 uppercase font-bold tracking-wider px-2.5 py-1 rounded bg-[#0F1115] cursor-pointer transition-all flex items-center gap-1 shadow-sm"
          >
            <Printer size={10} />
            Imprimir Recibo
          </button>
          <button
            type="button"
            onClick={() => setLastLaunchedGroupId(null)}
            className="text-[9px] text-slate-400 hover:text-slate-200 uppercase font-bold tracking-wider px-2 py-1 rounded border border-slate-800 bg-[#0F1115] cursor-pointer transition-all"
          >
            Esconder
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {/* General group information */}
        <div className="bg-[#0F1115] border border-slate-850 rounded-xl p-3.5 space-y-1 text-xs">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Cliente</span>
              <span className="block text-xs font-black text-white mt-0.5">{lastLaunchedServices[0]?.client}</span>
            </div>
            <div className="text-right">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Data</span>
              <span className="block text-[10px] font-bold text-slate-300 font-mono flex items-center justify-end gap-1 mt-0.5">
                <Calendar size={10} className="text-slate-400" />
                {lastLaunchedServices[0]?.date}
              </span>
            </div>
          </div>
          
          <div className="pt-2 border-t border-slate-850/60 mt-1.5">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Descrição do Serviço</span>
            <p className="text-[11px] text-slate-350 mt-0.5">{lastLaunchedServices[0]?.description}</p>
          </div>
        </div>

        {/* List of vehicles / plates in this group */}
        <div className="space-y-2">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
            Veículos & Taxas para conferência ({lastLaunchedServices.length}):
          </span>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-0.5 animate-fadeIn">
            {lastLaunchedServices.map(srv => {
              const srvTotalValue = srv.items.reduce((sum, item) => sum + item.value, 0);
              const isGroupRowExpanded = !!expandedRows[`last-${srv.id}`];

              return (
                <div 
                  key={srv.id} 
                  className="bg-[#0F1115] border border-slate-850 rounded-xl overflow-hidden shadow-xs hover:border-slate-700 transition-all duration-150"
                >
                  <div 
                    onClick={() => setExpandedRows(prev => ({ ...prev, [`last-${srv.id}`]: !prev[`last-${srv.id}`] }))}
                    className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-900/30 transition-all"
                  >
                    <div className="space-y-1 flex-1 pr-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[9px] font-black px-1.5 py-0.5 bg-slate-850 text-white border border-slate-700 rounded-md font-mono tracking-wider">
                          {srv.plate}
                        </span>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${
                          srv.paymentMethod === 'PIX'
                            ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/50'
                            : 'bg-amber-950/40 text-amber-400 border border-amber-900/50'
                        }`}>
                          {srv.paymentMethod}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleServiceStatus(srv.id);
                          }}
                          className={`text-[8px] font-bold px-1.5 py-0.5 rounded-lg border flex items-center gap-0.5 hover:scale-105 active:scale-95 transition-all cursor-pointer ${
                            srv.status === 'PAGO'
                              ? 'bg-emerald-900/40 text-emerald-400 border-emerald-800/40'
                              : 'bg-rose-900/40 text-rose-455 border-rose-800/40'
                          }`}
                        >
                          {srv.status === 'PAGO' ? <CheckCircle size={8} /> : <Clock size={8} />}
                          {srv.status}
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate max-w-[200px] mt-0.5">
                        {srv.items.map(item => item.name).join(', ')}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span className="text-xs font-bold text-emerald-400 font-mono">
                          {formatCurrency(srvTotalValue)}
                        </span>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditingService(srv);
                          }}
                          className="p-1 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 border border-slate-755 cursor-pointer"
                        >
                          <Pencil size={10} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveService(srv.id);
                          }}
                          className="p-1 rounded-lg bg-slate-850 hover:bg-rose-955/20 text-slate-400 hover:text-rose-400 border border-slate-755 cursor-pointer"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {isGroupRowExpanded && (
                    <div className="px-3 pb-3 pt-1.5 border-t border-slate-850 bg-slate-900/20 space-y-1.5">
                      <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block">Taxas:</span>
                      <div className="bg-[#161B22] border border-slate-850 rounded-lg p-2 space-y-1 font-mono text-[9px] text-slate-350">
                        {srv.items.map(item => (
                          <div key={item.id} className="flex justify-between items-center pb-1 border-b border-slate-850/60 last:border-0 last:pb-0">
                            <span>{item.name}</span>
                            <span className="font-bold text-white">{formatCurrency(item.value)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between items-center text-[9px] font-bold text-white pt-1 border-t border-slate-850 mt-0.5 font-sans">
                          <span>SOMA:</span>
                          <span className="text-emerald-400 font-mono">{formatCurrency(srvTotalValue)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Consolidated receipt summary */}
        <div className="border-t border-slate-800 pt-3 flex justify-between items-center text-xs font-bold text-slate-300 font-sans">
          <span>SOMA TOTAL LANÇADA:</span>
          <span className="text-emerald-400 font-mono text-sm font-black">
            {formatCurrency(lastLaunchedServices.reduce((sum, s) => sum + s.totalValue, 0))}
          </span>
        </div>
      </div>
    </div>
  );

  const serviceForm = (
    <div className="bg-[#161B22] border border-slate-800 rounded-2xl p-6 shadow-sm h-fit text-left">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-emerald-400">
          {editingService ? <Pencil size={18} /> : <FileCheck size={18} />}
          <h2 className="text-md font-bold text-white">
            {editingService ? 'Editar Serviço' : 'Novo Serviço'}
          </h2>
        </div>
        {editingService && (
          <button 
            type="button" 
            onClick={cancelEditingService}
            className="text-[10px] text-rose-400 hover:text-rose-300 font-bold uppercase tracking-wider bg-rose-500/10 px-2.5 py-1 rounded-md border border-rose-500/20 cursor-pointer"
          >
            Fechar
          </button>
        )}
      </div>

      <form onSubmit={handleSubmitService} className="space-y-4">
        {errorMsg && (
          <div className="p-3 bg-rose-950/30 border border-rose-900/30 rounded-xl text-xs text-rose-400 font-medium leading-normal animate-fadeIn">
            {errorMsg}
          </div>
        )}

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label htmlFor="srv-client" className="block text-xs font-bold text-slate-400 uppercase tracking-wide">
              Nome do Cliente
            </label>
            {clients && clients.length > 0 && (
              <button
                type="button"
                onClick={() => setShowClientSearch(!showClientSearch)}
                className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors uppercase cursor-pointer flex items-center gap-1"
              >
                <Search size={11} />
                {showClientSearch ? "Esconder Busca" : "Buscar na Lista"}
              </button>
            )}
          </div>

          <div className="relative">
            <input
              id="srv-client"
              type="text"
              value={client}
              onChange={e => {
                setClient(e.target.value);
                if (clients && clients.length > 0 && e.target.value.trim().length > 0) {
                  setShowClientSearch(true);
                }
              }}
              placeholder="Exemplo: João G. da Silva"
              className="w-full px-3.5 py-2.5 bg-[#0F1115] border border-slate-850 rounded-xl text-sm placeholder-slate-650 focus:outline-none focus:border-emerald-500 text-white transition-all duration-200"
            />

            {showClientSearch && clients && clients.length > 0 && (
              <div className="absolute left-0 right-0 mt-1.5 bg-[#161B22] border border-slate-800 rounded-xl p-2.5 shadow-2xl z-50 max-h-48 overflow-y-auto space-y-2">
                <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-850 pb-1">
                  <span>{client ? `Filtrando por "${client}"` : "Selecione da lista"}</span>
                  <button 
                    type="button" 
                    onClick={() => setShowClientSearch(false)}
                    className="text-slate-500 hover:text-white"
                  >
                    <X size={10} />
                  </button>
                </div>
                <div className="space-y-0.5">
                  {filteredClientsForForm.length === 0 ? (
                    <p className="text-[10px] text-slate-500 italic p-1.5 text-center">Nenhum correspondente</p>
                  ) : (
                    filteredClientsForForm.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setClient(c.name);
                          setShowClientSearch(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all flex justify-between items-center cursor-pointer"
                      >
                        <span>{c.name}</span>
                        {c.company && (
                          <span className="text-[9px] bg-slate-850 border border-slate-800 px-1.5 py-0.5 rounded text-slate-400 uppercase max-w-[120px] truncate">
                            {c.company}
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="srv-desc" className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">
              Descrição do Serviço
            </label>
            <input
              id="srv-desc"
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ex: Transf + Imposto 2026"
              className="w-full px-3.5 py-2.5 bg-[#0F1115] border border-slate-850 rounded-xl text-sm placeholder-slate-650 focus:outline-none focus:border-emerald-500 text-white transition-all duration-200"
            />
          </div>

          <div>
            <label htmlFor="srv-date" className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">
              Data
            </label>
            <input
              id="srv-date"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#0F1115] border border-slate-850 rounded-xl text-sm text-slate-250 font-mono focus:outline-none focus:border-emerald-500 cursor-pointer"
            />
          </div>
        </div>

        {/* UNIFIED VEHICLE AND DATA BINDING CARD */}
        <div className="border border-slate-850 rounded-2xl p-4 bg-[#0F1115]/50 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-850/60 pb-2.5">
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block">
              Vinculação do Veículo (Receitas)
            </span>
            {editingService && (
              <div className="flex items-center gap-2">
                <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-wider ${
                  activeVehicleId 
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                    : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                }`}>
                  {activeVehicleId ? 'Editando Placa' : 'Nova Placa'}
                </span>
                {activeVehicleId && (
                  <button
                    type="button"
                    onClick={handleCancelActiveVehicleEdit}
                    className="text-[9px] font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-750 px-2 py-0.5 rounded transition-all cursor-pointer uppercase"
                    title="Salva as alterações desta placa na lista e limpa o formulário para adicionar outra"
                  >
                    Lançar Nova Placa
                  </button>
                )}
              </div>
            )}
          </div>

          {itemErrorMsg && (
            <div className="text-[10px] bg-rose-950/40 border border-rose-900/30 text-rose-455 p-1.5 rounded-lg font-medium animate-fadeIn">
              {itemErrorMsg}
            </div>
          )}

          {/* Plate fields */}
          <div className="space-y-3.5">
            <div>
              <label htmlFor="srv-plate" className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wide">
                Placa do Veículo
              </label>
              <input
                id="srv-plate"
                type="text"
                value={plate}
                onChange={e => setPlate(e.target.value)}
                placeholder="Ex: NINFO"
                className="w-full px-3 py-2 bg-[#0F1115] border border-slate-850 rounded-lg text-xs font-mono uppercase tracking-widest focus:outline-none focus:border-emerald-500 text-white font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="srv-payment-method" className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wide">
                  Forma de Recebto.
                </label>
                <select
                  id="srv-payment-method"
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-2.5 py-2 bg-[#0F1115] border border-slate-850 rounded-lg text-xs focus:outline-none focus:border-emerald-500 text-slate-200 font-bold cursor-pointer"
                >
                  <option value="PIX">PIX</option>
                  <option value="DINHEIRO">DINHEIRO</option>
                </select>
              </div>

              <div>
                <label htmlFor="srv-status" className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wide">
                  Status Pagto.
                </label>
                <select
                  id="srv-status"
                  value={status}
                  onChange={e => setStatus(e.target.value as PaymentStatus)}
                  className="w-full px-2.5 py-2 bg-[#0F1115] border border-slate-850 rounded-lg text-xs focus:outline-none focus:border-emerald-500 text-slate-200 font-bold cursor-pointer"
                >
                  <option value="PENDENTE">PENDENTE</option>
                  <option value="PAGO">PAGO</option>
                </select>
              </div>
            </div>
          </div>

          {/* Subcategories picker & inline creator nested container */}
          <div className="border-t border-slate-850/80 pt-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                {showInlineSubCatCreator ? 'Nova Subcategoria' : 'Vincular Subcategoria e Valor'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowInlineSubCatCreator(!showInlineSubCatCreator);
                  setSubCatCreatorError('');
                  setSubCatCreatorSuccess('');
                }}
                className="text-[9px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors uppercase cursor-pointer text-right"
              >
                {showInlineSubCatCreator ? '← Vincular Subcategoria' : '+ Nova Subcategoria'}
              </button>
            </div>

            {showInlineSubCatCreator ? (
              <div className="p-3 bg-[#161B22] border border-slate-850 rounded-xl space-y-2.5 animate-fadeIn">
                {subCatCreatorError && (
                  <span className="text-[10px] text-rose-450 block font-medium">✗ {subCatCreatorError}</span>
                )}
                {subCatCreatorSuccess && (
                  <span className="text-[10px] text-emerald-400 block font-medium">✓ {subCatCreatorSuccess}</span>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-455 uppercase mb-1">Nome</label>
                    <input
                      type="text"
                      value={newSubCatName}
                      onChange={e => setNewSubCatName(e.target.value)}
                      placeholder="Ex: CADASTRO"
                      className="w-full px-2 py-1.5 bg-[#0F1115] border border-slate-850 rounded-lg text-xs text-white uppercase font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-455 uppercase mb-1">Preço Sugerido</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newSubCatDefaultVal}
                      onChange={e => {
                        const v = e.target.value;
                        setNewSubCatDefaultVal(v === '' ? '' : parseFloat(v));
                      }}
                      placeholder="R$"
                      className="w-full px-2 py-1.5 bg-[#0F1115] border border-slate-850 rounded-lg text-xs font-mono text-white"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCreateSubCategory}
                  className="w-full py-1.5 text-center text-[10px] font-black text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-all cursor-pointer uppercase"
                >
                  Salvar Nova Subcategoria
                </button>
              </div>
            ) : (
              <div className="space-y-3 animate-fadeIn">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Subcategoria</label>
                    <select
                      value={currentSubId}
                      onChange={handleSubCategorySelectChange}
                      className="w-full px-2 py-2 bg-[#0F1115] border border-slate-850 rounded-lg text-xs text-slate-250 font-semibold cursor-pointer"
                    >
                      <option value="" className="text-slate-500">Selecione...</option>
                      {receiptSubCategories.map(sub => (
                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Preço do Serviço</label>
                    <div className="relative rounded-lg shadow-inner">
                      <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-500 text-[10px] font-semibold font-mono">
                        R$
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={currentSubVal}
                        onChange={e => {
                          const v = e.target.value;
                          setCurrentSubVal(v === '' ? '' as any : parseFloat(v));
                        }}
                        placeholder="0,00"
                        className="w-full pl-6 pr-2 py-2 bg-[#0F1115] border border-slate-850 rounded-lg text-xs font-mono font-bold text-white shadow-inner"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddSubItem}
                  className="w-full text-center text-[10px] font-black text-emerald-400 bg-emerald-600/10 hover:bg-emerald-600/20 active:bg-emerald-600/30 border border-emerald-600/25 py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  + Vincular Subcategoria à Placa
                </button>
              </div>
            )}
          </div>

          {/* Subcategories queue added to this vehicle */}
          {serviceItems.length > 0 && !showInlineSubCatCreator && (
            <div className="border-t border-slate-850/80 pt-3 space-y-2.5 animate-fadeIn">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Subcategorias desta Placa:</span>
              <div className="space-y-1.5 max-h-28 overflow-y-auto bg-[#161B22] border border-slate-850 p-2 rounded-xl">
                {serviceItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-[11px] p-2 bg-[#0F1115] rounded-lg border border-slate-850">
                    <span className="font-bold text-slate-300 font-mono">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-emerald-400 font-mono">{formatCurrency(item.value)}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubItem(item.id)}
                        className="text-rose-400 hover:text-rose-350 p-0.5 rounded hover:bg-rose-955/20 cursor-pointer"
                        title="Remover subcategoria"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-white pt-1.5 border-t border-slate-850">
                <span>SOMA DO VEÍCULO ATIVO:</span>
                <span className="text-emerald-400 font-mono">{formatCurrency(tempTotalValue)}</span>
              </div>
            </div>
          )}

          {/* Nova Placa trigger inside the same box */}
          <div className="border-t border-slate-850/80 pt-3">
            <button
              type="button"
              onClick={handleAddVehicleToList}
              className="w-full py-2.5 text-center text-xs font-black text-indigo-400 bg-indigo-600/10 hover:bg-indigo-600/20 active:bg-indigo-600/30 rounded-xl border border-indigo-505/20 uppercase transition-all duration-150 cursor-pointer"
            >
              + Nova Placa
            </button>
          </div>
        </div>

        {/* Added vehicles list preview inside the form container */}
        {addedVehicles.length > 0 && (
          <div className="bg-[#0F1115] border border-slate-850 rounded-2xl p-4 mt-1 space-y-3 font-sans">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                {editingService ? "Veículos Vinculados ao Grupo" : "Veículos Prontos"} ({addedVehicles.length})
              </span>
              <span className="text-xs font-bold text-indigo-400 font-mono">
                {formatCurrency(addedVehicles.reduce((sum, v) => sum + v.items.reduce((bSum, item) => bSum + item.value, 0), 0))}
              </span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {addedVehicles.map((v) => {
                const vTotal = v.items.reduce((s, k) => s + k.value, 0);
                return (
                  <div key={v.id} className="p-2.5 bg-[#161B22] rounded-xl border border-slate-850 flex justify-between items-center text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-bold bg-slate-850 px-1.5 py-0.5 rounded text-[10px] text-white tracking-wider border border-slate-700">
                          {v.plate}
                        </span>
                        <span className="text-[9px] bg-indigo-950/40 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-900/30 font-semibold">
                          {v.paymentMethod}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                          v.status === 'PAGO' ? 'bg-emerald-950/50 text-emerald-400' : 'bg-rose-955/50 text-rose-400'
                        }`}>
                          {v.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate max-w-[140px]">
                        {v.items.map(item => item.name).join(', ')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-emerald-400 text-xs">
                        {formatCurrency(vTotal)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleEditVehicleInList(v.id)}
                        className="p-1 hover:bg-slate-800 rounded text-amber-400 hover:text-amber-300 cursor-pointer"
                        title="Editar este veículo"
                      >
                        <Pencil size={11} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveVehicleFromList(v.id)}
                        className="p-1 hover:bg-rose-955/20 rounded text-rose-400 hover:text-rose-350 cursor-pointer"
                        title="Remover veículo"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <button
          id="btn-submit-service"
          type="submit"
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-950/20 transition-all border border-emerald-505/20 cursor-pointer mt-2"
        >
          {editingService 
            ? 'Salvar Alterações' 
            : addedVehicles.length > 0
              ? `Criar e Lançar ${addedVehicles.length + (plate.trim() && serviceItems.length > 0 ? 1 : 0)} Serviços`
              : 'Criar e Lançar Serviço'
          }
        </button>
      </form>
    </div>
  );

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Upper header */}
      {viewMode === 'form' && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Controle de Serviços</h1>
            <p className="text-slate-400 text-sm mt-1">Efetue registros de processos veiculares, acompanhe cobranças de taxas e atualize pagamentos.</p>
          </div>
        </div>
      )}

      <div className={viewMode === 'form' ? "max-w-xl mx-auto w-full space-y-6" : "w-full"}>
        
        {/* ADD SERVICE FORM Column */}
        {viewMode === 'form' && serviceForm}

        {/* LAST LAUNCH CONFIRMATION PANEL */}
        {viewMode === 'form' && lastLaunchedServices.length > 0 && lastLaunchedPanel}

        {/* INLINE EDIT SERVICE MODAL FOR LIST VIEW */}
        {viewMode === 'list' && editingService && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
            <div className="relative max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl rounded-2xl animate-fadeIn">
              {serviceForm}
            </div>
          </div>
        )}

        {/* SERVICES LIST & DETAILS Column */}
        {viewMode === 'list' && (
          <div className="space-y-5 animate-fadeIn">
          <div className="bg-[#161B22] border border-slate-800 rounded-2xl p-6 shadow-sm">
            
            {/* Upper state header */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center pb-5 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white block">Arquivos Detalhados de Serviços</h3>
                <p className="text-xs text-slate-400 mt-0.5">Clique em qualquer serviço para visualizar as subtaxas vinculadas</p>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => setSortOrder(prev => prev === 'oldest' ? 'newest' : 'oldest')}
                  className="flex items-center gap-2 px-3 py-1.5 bg-[#0F1115] hover:bg-slate-900 border border-slate-800 hover:border-slate-750 text-xs font-bold text-slate-300 rounded-xl cursor-pointer transition-all shrink-0 select-none"
                >
                  <ArrowUpDown size={13} className="text-emerald-450" />
                  <span>Ordenação: <strong className="text-emerald-400">{sortOrder === 'oldest' ? 'Mais Velho → Mais Novo' : 'Mais Novo → Mais Velho'}</strong></span>
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">Balanço das buscas:</span>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-650/10 border border-emerald-800/40 px-2.5 py-1.5 rounded-lg font-mono">
                    {formatCurrency(totalFilteredRevenues)}
                  </span>
                </div>
              </div>
            </div>

            {/* Filter selectors */}
            <div className="space-y-4 my-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {/* Text Search */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Buscar por Texto</span>
                  <div className="relative">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cliente, Placa, Descrição..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-[#0F1115] border border-slate-850 rounded-xl text-xs placeholder-slate-650 focus:outline-none focus:border-emerald-500 text-white font-bold"
                    />
                  </div>
                </div>

                {/* Client filter select */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Filtrar por Cliente</span>
                  <div className="relative">
                    <User size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select
                      value={selectedClient}
                      onChange={e => setSelectedClient(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-[#0F1115] border border-slate-850 rounded-xl text-xs focus:outline-none focus:border-emerald-500 text-slate-300 font-medium cursor-pointer"
                    >
                      <option value="all">Todos os Clientes</option>
                      {clients && clients.length > 0 ? (
                        clients.map(c => (
                          <option key={c.id} value={c.name}>
                            {c.name} {c.company ? `(${c.company})` : ''}
                          </option>
                        ))
                      ) : (
                        // Fallback if no clients registered yet, populate unique client names from services
                        Array.from(new Set(services.map(s => s.client)))
                          .filter(Boolean)
                          .map(clientName => (
                            <option key={clientName} value={clientName}>
                              {clientName}
                            </option>
                          ))
                      )}
                    </select>
                  </div>
                </div>

                {/* Status filter */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Status de Pagamento</span>
                  <div className="relative">
                    <Filter size={11} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-405" />
                    <select
                      value={selectedStatus}
                      onChange={e => setSelectedStatus(e.target.value)}
                      className="w-full pl-8 pr-3.5 py-2.5 bg-[#0F1115] border border-slate-850 rounded-xl text-xs focus:outline-none focus:border-emerald-500 text-slate-300 font-medium cursor-pointer"
                    >
                      <option value="all">Todos os Status</option>
                      <option value="PAGO">PAGO</option>
                      <option value="PENDENTE">PENDENTE</option>
                    </select>
                  </div>
                </div>

                {/* Method filter */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Forma de Recebimento</span>
                  <div className="relative">
                    <Coins size={11} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-405" />
                    <select
                      value={selectedPaymentMethod}
                      onChange={e => setSelectedPaymentMethod(e.target.value)}
                      className="w-full pl-8 pr-3.5 py-2.5 bg-[#0F1115] border border-slate-850 rounded-xl text-xs focus:outline-none focus:border-emerald-500 text-slate-300 font-medium cursor-pointer"
                    >
                      <option value="all">Todas as Formas</option>
                      <option value="PIX">PIX</option>
                      <option value="DINHEIRO">DINHEIRO</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Start Date filter */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Data Início</span>
                  <div className="relative">
                    <Calendar size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-[#0F1115] border border-slate-850 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-medium cursor-pointer"
                    />
                  </div>
                </div>

                {/* End Date filter */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Data Fim</span>
                  <div className="relative">
                    <Calendar size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="date"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-[#0F1115] border border-slate-850 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-medium cursor-pointer"
                    />
                  </div>
                </div>

                {/* Category filter */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Categoria de Serviço</span>
                  <div className="relative">
                    <Tag size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-404" />
                    <select
                      value={selectedCategory}
                      onChange={e => setSelectedCategory(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-[#0F1115] border border-slate-850 rounded-xl text-xs focus:outline-none focus:border-emerald-500 text-slate-300 font-medium cursor-pointer"
                    >
                      <option value="all">Todas as Categorias</option>
                      {subCategories
                        .filter(sub => (sub.type || 'RECEITA') === 'RECEITA')
                        .map(sub => (
                          <option key={sub.id} value={sub.id}>
                            {sub.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Reset Filters button if any filter is dirty */}
              {(search || selectedStatus !== 'all' || selectedPaymentMethod !== 'all' || startDate || endDate || selectedCategory !== 'all' || selectedClient !== 'all') && (
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('');
                      setSelectedStatus('all');
                      setSelectedPaymentMethod('all');
                      setStartDate('');
                      setEndDate('');
                      setSelectedCategory('all');
                      setSelectedClient('all');
                    }}
                    className="text-[10px] uppercase tracking-wider font-bold text-slate-400 hover:text-emerald-450 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>Limpar Filtros</span>
                  </button>
                </div>
              )}
            </div>

            {/* List Row items */}
            {filteredGroupedServices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-slate-800 rounded-2xl">
                <FileCheck className="text-slate-600 w-12 h-12 mb-3" />
                <h4 className="font-bold text-slate-400 text-sm">Nenhum registro correspondente</h4>
                <p className="text-xs text-slate-550 max-w-sm mt-1 mx-4">Crie um novo serviço no formulário lateral, ou limpe as correspondências de busca do cabeçalho.</p>
              </div>
            ) : (
              <div className="space-y-3.5 max-h-[640px] overflow-y-auto pr-1">
                <AnimatePresence initial={false}>
                  {filteredGroupedServices.map((group) => {
                    const isExpanded = !!expandedRows[group.id];
                    const isMulti = group.services.length > 1;

                    if (!isMulti) {
                      const service = group.services[0];
                      return (
                        <motion.div
                          key={group.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className="border border-slate-850 rounded-2xl bg-[#0F1115] hover:border-slate-700 overflow-hidden transition-all shadow-xs"
                        >
                          {/* Summary Header of the service row */}
                          <div 
                            onClick={() => toggleRow(group.id)}
                            className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3.5 cursor-pointer hover:bg-slate-900/50 transition-all border-b border-transparent"
                          >
                            <div className="space-y-1 bg-transparent flex-1">
                              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                {/* Placa badge */}
                                <span className="text-xs font-black px-2.5 py-0.5 bg-slate-850 text-white border border-slate-700 rounded-lg font-mono tracking-wider shadow-sm">
                                  {service.plate}
                                </span>

                                {/* Method badge */}
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  service.paymentMethod === 'PIX' 
                                    ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/50' 
                                    : 'bg-amber-950/40 text-amber-400 border border-amber-900/50'
                                }`}>
                                  {service.paymentMethod}
                                </span>

                                {/* Clickable Status toggle badge */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation(); // Avoid expanding card
                                    onToggleServiceStatus(service.id);
                                  }}
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border flex items-center gap-1 hover:scale-105 active:scale-95 transition-all cursor-pointer ${
                                    service.status === 'PAGO' 
                                      ? 'bg-emerald-900/40 text-emerald-400 border-emerald-800/40' 
                                      : 'bg-rose-900/40 text-rose-450 border-rose-800/40'
                                  }`}
                                  title="Clique para alterar status"
                                >
                                  {service.status === 'PAGO' ? <CheckCircle size={10} /> : <Clock size={10} />}
                                  {service.status}
                                </button>
                              </div>

                              <h4 className="text-sm font-bold text-white mt-1">{service.client}</h4>
                              <p className="text-xs text-slate-400 truncate max-w-lg">{service.description}</p>
                            </div>

                            <div className="flex items-center gap-3 self-end sm:self-center">
                              <div className="text-right">
                                <span className="text-md font-bold text-emerald-400 font-mono">
                                  {formatCurrency(service.totalValue)}
                                </span>
                                <p className="text-[10px] text-slate-450 mt-0.5 flex items-center justify-end gap-1">
                                  <Calendar size={10} className="text-slate-500" />
                                  {service.date}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex flex-col gap-1.5">
                                  {/* Print receipt button */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      generateReceiptPDF([service]);
                                    }}
                                    className="p-1 px-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 transition-all border border-slate-755 cursor-pointer"
                                    title="Imprimir Recibo"
                                  >
                                    <Printer size={12} />
                                  </button>

                                  {/* Edit service button */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startEditingService(service);
                                    }}
                                    className="p-1 px-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-emerald-450 transition-all border border-slate-755 cursor-pointer"
                                    title="Editar Registro"
                                  >
                                    <Pencil size={12} />
                                  </button>

                                  {/* Remove service button */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation(); // Avoid expanding row
                                      onRemoveService(service.id);
                                    }}
                                    className="p-1 px-1.5 rounded-lg bg-slate-850 hover:bg-rose-955/20 text-slate-400 hover:text-rose-400 transition-all border border-slate-755 cursor-pointer"
                                    title="Remover Registro"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                                
                                {/* Expand arrow */}
                                <div className="text-slate-500 self-center">
                                  {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Expandable detailed breakdown of cost items */}
                          {isExpanded && (
                            <div className="px-5 pb-5 pt-3.5 bg-slate-900/35 border-t border-slate-850 space-y-3 animate-fadeIn">
                              <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                <Tag size={12} className="text-emerald-400" />
                                Detalhamento de Custos & Subcategorias de Taxas:
                              </h5>
                              
                              <div className="space-y-1.5 bg-[#161B22] border border-slate-850 rounded-xl p-3">
                                {service.items.map((item) => (
                                  <div key={item.id} className="flex justify-between items-center text-xs pb-1.5 border-b border-slate-850 last:border-0 last:pb-0 font-mono text-slate-300">
                                    <span>{item.name}</span>
                                    <span className="font-bold text-white">{formatCurrency(item.value)}</span>
                                  </div>
                                ))}
                                
                                <div className="flex justify-between items-center text-xs font-bold text-white pt-2 border-t border-slate-850 mt-1 font-sans">
                                  <span className="uppercase">Soma Cumulativa:</span>
                                  <span className="text-emerald-450 font-mono">{formatCurrency(service.totalValue)}</span>
                                </div>
                              </div>

                              <p className="text-[10px] text-slate-500 italic">Este processo requer conferência e fechamento no caixa do dia da prestação.</p>
                            </div>
                          )}
                        </motion.div>
                      );
                    } else {
                      // Multi-vehicle group: RENDER IN THE SAME BLOCK/FRAME
                      const allPago = group.services.every(srv => srv.status === 'PAGO');
                      const somePago = group.services.some(srv => srv.status === 'PAGO');
                      const numPago = group.services.filter(srv => srv.status === 'PAGO').length;
                      const numTotal = group.services.length;

                      return (
                        <motion.div
                          key={group.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className="border border-indigo-950 rounded-2xl bg-[#0F1115] hover:border-indigo-800 overflow-hidden transition-all shadow-md shadow-indigo-950/10"
                        >
                          {/* Summary Header of the service row */}
                          <div 
                            onClick={() => toggleRow(group.id)}
                            className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3.5 cursor-pointer hover:bg-slate-900/50 transition-all border-b border-transparent"
                          >
                            <div className="space-y-1.5 bg-transparent flex-1">
                              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                {/* Group size badge */}
                                <span className="text-[9px] font-black px-2 py-0.5 bg-indigo-950/60 text-indigo-300 border border-indigo-900/50 rounded-lg tracking-wider uppercase font-mono">
                                  {numTotal} Veículos
                                </span>

                                {/* Plates list as smaller badges */}
                                <div className="flex flex-wrap gap-1">
                                  {group.services.map(srv => (
                                    <span key={srv.id} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#161B22] text-amber-450 border border-slate-800 uppercase tracking-wider font-mono">
                                      {srv.plate}
                                    </span>
                                  ))}
                                </div>

                                {/* Consolidated status badge */}
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border flex items-center gap-1 ${
                                  allPago 
                                    ? 'bg-emerald-900/40 text-emerald-400 border-emerald-800/40' 
                                    : somePago
                                      ? 'bg-amber-900/40 text-amber-400 border-amber-800/40'
                                      : 'bg-rose-900/40 text-rose-455 border-rose-800/40'
                                }`}>
                                  {allPago ? <CheckCircle size={10} /> : <Clock size={10} />}
                                  {allPago ? 'PAGO' : `PENDENTE (${numPago}/${numTotal} PAGO)`}
                                </span>
                              </div>

                              <h4 className="text-sm font-bold text-white mt-1">{group.client}</h4>
                              <p className="text-xs text-slate-400 truncate max-w-lg">{group.description}</p>
                            </div>

                            <div className="flex items-center gap-3 self-end sm:self-center">
                              <div className="text-right">
                                <span className="text-md font-bold text-indigo-400 font-mono">
                                  {formatCurrency(group.totalValue)}
                                </span>
                                <p className="text-[10px] text-slate-450 mt-0.5 flex items-center justify-end gap-1">
                                  <Calendar size={10} className="text-slate-500" />
                                  {group.date}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex flex-col gap-1.5">
                                  {/* Print receipt button */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      generateReceiptPDF(group.services);
                                    }}
                                    className="p-1 px-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 transition-all border border-slate-755 cursor-pointer"
                                    title="Imprimir Recibo Completo"
                                  >
                                    <Printer size={12} />
                                  </button>

                                  {/* Edit group: load first service which loads the linked group ones */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startEditingService(group.services[0]);
                                    }}
                                    className="p-1 px-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-emerald-450 transition-all border border-slate-755 cursor-pointer"
                                    title="Editar Lançamento Completo"
                                  >
                                    <Pencil size={12} />
                                  </button>

                                  {/* Delete group: delete all of them together cleanly! */}
                                  {confirmDeleteGroupId === group.id ? (
                                    <div 
                                      className="flex flex-col gap-1 items-center animate-fadeIn"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onRemoveService(group.services.map(s => s.id));
                                          setConfirmDeleteGroupId(null);
                                        }}
                                        className="px-1.5 py-0.5 text-[8px] font-black bg-rose-600 hover:bg-rose-500 text-white uppercase rounded transition-all cursor-pointer shadow-md"
                                        title="Confirmar exclusão de lançamento"
                                      >
                                        Sim
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setConfirmDeleteGroupId(null);
                                        }}
                                        className="px-1 py-0.5 text-[8px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-400 uppercase rounded transition-all cursor-pointer"
                                      >
                                        Não
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setConfirmDeleteGroupId(group.id);
                                      }}
                                      className="p-1 px-1.5 rounded-lg bg-slate-850 hover:bg-rose-955/20 text-slate-400 hover:text-rose-400 transition-all border border-slate-755 cursor-pointer"
                                      title="Excluir Lançamento Completo"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  )}
                                </div>
                                
                                {/* Expand arrow */}
                                <div className="text-slate-500 self-center">
                                  {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Expandable detailed breakdown of cost items */}
                          {isExpanded && (
                            <div className="px-5 pb-5 pt-3.5 bg-slate-900/35 border-t border-slate-850 space-y-4 animate-fadeIn">
                              <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                <Tag size={12} className="text-emerald-400" />
                                Detalhamento de Serviços por Veículo:
                              </h5>
                              
                              <div className="space-y-3">
                                {group.services.map((srv) => (
                                  <div key={srv.id} className="bg-[#161B22] border border-slate-850 rounded-xl p-3.5 space-y-2">
                                    <div className="flex justify-between items-center pb-2 border-b border-slate-850">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-black px-2 py-0.5 bg-slate-900 text-white border border-slate-700 rounded-md font-mono tracking-wider">
                                          {srv.plate}
                                        </span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                          srv.paymentMethod === 'PIX' 
                                            ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/50' 
                                            : 'bg-amber-950/40 text-amber-400 border border-amber-900/50'
                                        }`}>
                                          {srv.paymentMethod}
                                        </span>
                                        
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onToggleServiceStatus(srv.id);
                                          }}
                                          className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border flex items-center gap-1 hover:scale-105 active:scale-95 transition-all cursor-pointer ${
                                            srv.status === 'PAGO' 
                                              ? 'bg-emerald-900/40 text-emerald-400 border-emerald-800/40' 
                                              : 'bg-rose-900/40 text-rose-450 border-rose-800/40'
                                          }`}
                                          title="Clique para alterar status"
                                        >
                                          {srv.status === 'PAGO' ? <CheckCircle size={10} /> : <Clock size={10} />}
                                          {srv.status}
                                        </button>
                                      </div>
                                      
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-bold text-slate-300 mr-2">
                                          {formatCurrency(srv.totalValue)}
                                        </span>
                                        
                                        {/* Individual vehicle actions inside group */}
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            startEditingService(srv);
                                          }}
                                          className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-emerald-450 transition-all border border-slate-800 cursor-pointer"
                                          title="Editar este veículo"
                                        >
                                          <Pencil size={11} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onRemoveService(srv.id);
                                          }}
                                          className="p-1 rounded bg-slate-900 hover:bg-rose-955/20 text-slate-400 hover:text-rose-400 transition-all border border-slate-800 cursor-pointer"
                                          title="Excluir este veículo"
                                        >
                                          <Trash2 size={11} />
                                        </button>
                                      </div>
                                    </div>

                                    {/* List of subcategories for this vehicle */}
                                    <div className="space-y-1 pl-2 pt-1 font-mono text-[11px] text-slate-400">
                                      {srv.items.map((item) => (
                                        <div key={item.id} className="flex justify-between items-center py-0.5">
                                          <span>{item.name}</span>
                                          <span className="font-bold text-slate-350">{formatCurrency(item.value)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <div className="flex justify-between items-center text-xs font-bold text-white pt-2.5 border-t border-slate-850 mt-1">
                                <span className="uppercase font-sans">VALOR TOTAL DO LANÇAMENTO:</span>
                                <span className="text-emerald-400 font-mono text-sm">{formatCurrency(group.totalValue)}</span>
                              </div>
                              
                              <p className="text-[10px] text-slate-500 italic">Este processo requer conferência e fechamento no caixa do dia da prestação.</p>
                            </div>
                          )}
                        </motion.div>
                      );
                    }
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
          </div>
        )}

      </div>
    </div>
  );
}
