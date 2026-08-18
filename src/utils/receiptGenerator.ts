import { jsPDF } from 'jspdf';
import { Service, Client } from '../types';

export interface PendingReportFilterInfo {
  clientName?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  paymentMethod?: string;
  categoryName?: string;
}

/**
 * Helper to format currency in pt-BR
 */
const formatBRL = (val: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(val);
};

/**
 * Helper to format date from YYYY-MM-DD to DD/MM/YYYY
 */
const formatDateBR = (dateStr?: string) => {
  if (!dateStr) return '--/--/----';
  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }
  return dateStr;
};

/**
 * Generates a clean, professional, and personalized PDF receipt for a group of services.
 * Uses jsPDF directly.
 */
export function generateReceiptPDF(services: Service[]) {
  if (!services || services.length === 0) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const firstService = services[0];
  const clientName = firstService.client || 'CLIENTE NÃO INFORMADO';
  const description = firstService.description || 'Nenhuma descrição adicional informada.';
  
  // Format Date from YYYY-MM-DD to DD/MM/YYYY
  const formattedDate = formatDateBR(firstService.date);

  // Calculate overall totals
  const totalValueGeral = services.reduce((sum, srv) => {
    const srvTotal = srv.items ? srv.items.reduce((acc, it) => acc + it.value, 0) : srv.totalValue || 0;
    return sum + srvTotal;
  }, 0);

  // Color Palette - Slate / Deep Blue Theme
  const primaryColor = [15, 23, 42]; // dark slate #0f172a
  const accentColor = [16, 185, 129]; // emerald #10b981
  const textColor = [51, 65, 85]; // slate-700
  const lightBg = [248, 250, 252]; // slate-50
  const borderColor = [226, 232, 240]; // slate-200

  let y = 15;

  // 1. Header Banner
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(10, y, 190, 22, 'F');

  // Header Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('RECIBO DE PRESTAÇÃO DE SERVIÇOS', 15, y + 14);

  // Decorative Accent line below header
  y += 22;
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.rect(10, y, 190, 1.5, 'F');
  y += 6;

  // 2. Info Block (Date & Document number)
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Data de Emissão: ${formattedDate}`, 15, y);
  
  const receiptNo = firstService.groupId 
    ? firstService.groupId.substring(0, 8).toUpperCase() 
    : firstService.id.substring(0, 8).toUpperCase();
  doc.text(`Recibo Nº: #${receiptNo}`, 190, y, { align: 'right' });
  y += 7;

  // 3. Client & General Description Panel
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.rect(10, y, 190, 32, 'FD');

  // Client Details
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('CLIENTE / EMPRESA:', 14, y + 6);
  
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(clientName.toUpperCase(), 14, y + 11);

  // Description / Observation Details
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('DESCRIÇÃO GERAL / OBSERVAÇÃO:', 14, y + 19);

  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  // Wrap description text so it doesn't overflow horizontally
  const splitDesc = doc.splitTextToSize(description, 180);
  doc.text(splitDesc, 14, y + 24);
  
  y += 38;

  // 4. Vehicles & Items Section
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('VEÍCULOS, TAXAS E SERVIÇOS DETALHADOS', 10, y);
  y += 5;

  // Table header background
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(10, y, 190, 8, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('VEÍCULO / PLACA', 14, y + 5.5);
  doc.text('FORMA PAG.', 75, y + 5.5);
  doc.text('STATUS', 110, y + 5.5);
  doc.text('VALOR TOTAL', 190, y + 5.5, { align: 'right' });
  
  y += 8;

  // Draw each service (vehicle / plate) in the group
  services.forEach((srv) => {
    const srvTotalValue = srv.items ? srv.items.reduce((sum, item) => sum + item.value, 0) : srv.totalValue || 0;

    // Table Row background alternating or simple light bg
    doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    doc.rect(10, y, 190, 8, 'F');
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.line(10, y + 8, 200, y + 8);

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text(srv.plate.toUpperCase(), 14, y + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(srv.paymentMethod, 75, y + 5.5);
    doc.text(srv.status, 110, y + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(formatBRL(srvTotalValue), 190, y + 5.5, { align: 'right' });

    y += 8;

    // Print itemized subcategories
    if (srv.items && srv.items.length > 0) {
      srv.items.forEach((item) => {
        // Draw indent indicator
        doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
        doc.line(18, y + 2, 18, y + 5);
        doc.line(18, y + 5, 20, y + 5);

        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.text(item.name.toUpperCase(), 23, y + 4.5);

        doc.setFont('courier', 'bold');
        doc.setFontSize(8.5);
        doc.text(formatBRL(item.value), 188, y + 4.5, { align: 'right' });

        y += 7;
      });
    }
    
    y += 2; // Extra padding between vehicles
  });

  y += 4;

  // 5. Grand Total Panel
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(100, y, 100, 15, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('VALOR TOTAL CONSOLIDADO:', 105, y + 9.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(formatBRL(totalValueGeral), 195, y + 10, { align: 'right' });

  y += 28;

  // 6. Signatures and visual line
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.line(10, y, 90, y);
  doc.line(110, y, 190, y);

  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Assinatura do Responsável', 50, y + 5, { align: 'center' });
  doc.text('Assinatura do Cliente / Recebedor', 150, y + 5, { align: 'center' });

  y += 18;

  // 7. Footer
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184); // light gray text
  doc.text('Este documento é um recibo gerado eletronicamente para fins de controle e prestação de contas.', 100, y, { align: 'center' });
  doc.text('Agradecemos pela preferência e parceria de sempre!', 100, y + 4, { align: 'center' });

  // Save the PDF
  const safeClientName = clientName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const filename = `recibo_${safeClientName}_${firstService.date}.pdf`;
  doc.save(filename);
}

/**
 * Generates a full printable report PDF for all filtered pending services.
 * Allows printing all services belonging to a client across multiple dates or any filtered view.
 */
export function generatePendingReportPDF(
  services: Service[],
  clients: Client[] = [],
  filterInfo?: PendingReportFilterInfo
) {
  if (!services || services.length === 0) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor = [15, 23, 42]; // dark slate #0f172a
  const accentColor = [16, 185, 129]; // emerald #10b981
  const textColor = [51, 65, 85]; // slate-700
  const lightBg = [248, 250, 252]; // slate-50
  const darkRowBg = [241, 245, 249]; // slate-100
  const borderColor = [203, 213, 225]; // slate-300
  const roseColor = [225, 29, 72]; // rose-600

  const today = new Date();
  const nowFormatted = today.toLocaleDateString('pt-BR') + ' às ' + today.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // Unique clients in current services
  const uniqueClients = Array.from(new Set(services.map(s => s.client?.trim()).filter(Boolean)));
  const isSingleClient = uniqueClients.length === 1 || (filterInfo?.clientName && filterInfo.clientName !== 'all');
  const targetClientName = isSingleClient ? (filterInfo?.clientName && filterInfo.clientName !== 'all' ? filterInfo.clientName : uniqueClients[0]) : null;

  // Look up client details if single client
  const clientData = targetClientName 
    ? clients.find(c => c.name.trim().toLowerCase() === targetClientName.trim().toLowerCase()) 
    : null;

  // Total pending value
  const totalValue = services.reduce((sum, s) => {
    const srvTotal = s.items && s.items.length > 0 ? s.items.reduce((acc, it) => acc + it.value, 0) : s.totalValue || 0;
    return sum + srvTotal;
  }, 0);

  const totalPlacas = services.length;

  let y = 14;

  const drawHeader = (isFirstPage: boolean = false) => {
    // 1. Header Banner
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(10, y, 190, isFirstPage ? 20 : 12, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(isFirstPage ? 14 : 10);
    doc.text('RELATÓRIO DE PENDÊNCIAS / CONTAS A RECEBER', 14, isFirstPage ? y + 10 : y + 8);

    if (isFirstPage) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(167, 243, 208); // light emerald
      doc.text('EXTRATO CONSOLIDADO DE SERVIÇOS E DÉBITOS PENDENTES', 14, y + 16);

      doc.setTextColor(203, 213, 225);
      doc.setFontSize(7.5);
      doc.text(`Emissão: ${nowFormatted}`, 196, y + 16, { align: 'right' });
    }

    // Accent line
    y += isFirstPage ? 20 : 12;
    doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.rect(10, y, 190, 1.2, 'F');
    y += 4;
  };

  // Draw Page 1 header
  drawHeader(true);

  // 2. Client & Summary Information Panel
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.rect(10, y, 190, isSingleClient ? 26 : 20, 'FD');

  if (isSingleClient && targetClientName) {
    // Left side: Client Info
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('DADOS DO CLIENTE:', 14, y + 5.5);

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(targetClientName.toUpperCase(), 14, y + 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);

    let detailsRow = [];
    if (clientData?.company) detailsRow.push(`Empresa: ${clientData.company}`);
    if (clientData?.phone) detailsRow.push(`Telefone: ${clientData.phone}`);
    if (clientData?.cpf) detailsRow.push(`CPF: ${clientData.cpf}`);
    if (clientData?.cnpj) detailsRow.push(`CNPJ: ${clientData.cnpj}`);

    const detailsStr = detailsRow.length > 0 ? detailsRow.join('   |   ') : 'Cadastro padrão do sistema';
    doc.text(detailsStr, 14, y + 17);

    // Period / Filter note
    let filterNotes = [];
    if (filterInfo?.startDate || filterInfo?.endDate) {
      filterNotes.push(`Período: ${formatDateBR(filterInfo.startDate)} até ${formatDateBR(filterInfo.endDate)}`);
    }
    if (filterInfo?.search) {
      filterNotes.push(`Busca: "${filterInfo.search}"`);
    }
    if (filterNotes.length > 0) {
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(filterNotes.join('   •   '), 14, y + 22.5);
    }
  } else {
    // Multiple clients
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('FILTRO DE CLIENTES: TODOS OS CLIENTES / SELEÇÃO GERAL', 14, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(`Total de Clientes Distintos: ${uniqueClients.length}`, 14, y + 12);

    let filterNotes = [];
    if (filterInfo?.startDate || filterInfo?.endDate) {
      filterNotes.push(`Período: ${formatDateBR(filterInfo.startDate)} até ${formatDateBR(filterInfo.endDate)}`);
    }
    if (filterInfo?.search) {
      filterNotes.push(`Busca: "${filterInfo.search}"`);
    }
    if (filterNotes.length > 0) {
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(filterNotes.join('   •   '), 14, y + 16.5);
    }
  }

  // Right side: Consolidated Totals Pill
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(130, y + 3, 66, isSingleClient ? 20 : 14, 'F');
  
  doc.setTextColor(203, 213, 225);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(`QTD. VEÍCULOS / SERVIÇOS: ${totalPlacas}`, 134, y + 8);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text('TOTAL PENDENTE:', 134, y + (isSingleClient ? 13 : 11));

  doc.setTextColor(110, 231, 183); // emerald-300
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(formatBRL(totalValue), 193, y + (isSingleClient ? 19 : 12), { align: 'right' });

  y += (isSingleClient ? 26 : 20) + 5;

  // 3. Table Header
  const drawTableHeader = () => {
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(10, y, 190, 7.5, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);

    doc.text('DATA', 13, y + 5);
    if (!isSingleClient) {
      doc.text('CLIENTE', 36, y + 5);
      doc.text('PLACA', 85, y + 5);
      doc.text('DESCRIÇÃO & SUBTAXAS', 110, y + 5);
    } else {
      doc.text('PLACA', 36, y + 5);
      doc.text('DESCRIÇÃO & SUBTAXAS', 65, y + 5);
      doc.text('PAGTO / STATUS', 140, y + 5);
    }
    doc.text('VALOR TOTAL', 196, y + 5, { align: 'right' });
    y += 7.5;
  };

  drawTableHeader();

  // 4. Rows
  services.forEach((srv, idx) => {
    const srvTotal = srv.items && srv.items.length > 0 ? srv.items.reduce((acc, it) => acc + it.value, 0) : srv.totalValue || 0;
    const formattedDate = formatDateBR(srv.date);

    // Calculate dynamic height needed for this row
    const itemsCount = srv.items && srv.items.length > 0 ? srv.items.length : 0;
    const hasItems = itemsCount > 0;
    const rowHeight = hasItems ? 12 + Math.ceil(itemsCount / 2) * 4.5 : 12;

    // Check page overflow
    if (y + rowHeight > 270) {
      doc.addPage();
      y = 12;
      drawHeader(false);
      drawTableHeader();
    }

    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? lightBg[0] : darkRowBg[0], isEven ? lightBg[1] : darkRowBg[1], isEven ? lightBg[2] : darkRowBg[2]);
    doc.rect(10, y, 190, rowHeight, 'F');
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.line(10, y + rowHeight, 200, y + rowHeight);

    // Date
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(formattedDate, 13, y + 4.5);

    if (!isSingleClient) {
      // Client
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      const truncatedClient = srv.client && srv.client.length > 22 ? srv.client.substring(0, 22) + '...' : srv.client || '-';
      doc.text(truncatedClient.toUpperCase(), 36, y + 4.5);

      // Plate badge
      doc.setFont('courier', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(srv.plate.toUpperCase(), 85, y + 4.5);

      // Description
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      const truncatedDesc = srv.description && srv.description.length > 35 ? srv.description.substring(0, 35) + '...' : srv.description || '-';
      doc.text(truncatedDesc, 110, y + 4.5);
    } else {
      // Single client mode: more room for plate and description
      doc.setFont('courier', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(srv.plate.toUpperCase(), 36, y + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      const truncatedDesc = srv.description && srv.description.length > 45 ? srv.description.substring(0, 45) + '...' : srv.description || '-';
      doc.text(truncatedDesc, 65, y + 4.5);

      // Method and status
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(`${srv.paymentMethod} • PENDENTE`, 140, y + 4.5);
    }

    // Total value on the right
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(roseColor[0], roseColor[1], roseColor[2]);
    doc.text(formatBRL(srvTotal), 196, y + 4.5, { align: 'right' });

    // Itemized subcategories (rendered in 2 compact columns)
    if (hasItems) {
      let subY = y + 8.5;
      const startX = isSingleClient ? 36 : 36;
      const colWidth = isSingleClient ? 75 : 75;

      srv.items.forEach((item, itemIdx) => {
        const col = itemIdx % 2;
        const currentX = startX + (col * colWidth);
        const itemY = subY + Math.floor(itemIdx / 2) * 4.5;

        doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
        doc.circle(currentX, itemY - 1, 0.7, 'F');

        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        const subName = item.name.length > 25 ? item.name.substring(0, 25) + '..' : item.name;
        doc.text(`${subName}: `, currentX + 2.5, itemY);

        doc.setFont('courier', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(formatBRL(item.value), currentX + 2.5 + doc.getTextWidth(`${subName}: `) + 1, itemY);
      });
    }

    y += rowHeight;
  });

  y += 6;

  // 5. Grand Total Box (Bottom)
  if (y + 40 > 280) {
    doc.addPage();
    y = 15;
    drawHeader(false);
  }

  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(10, y, 190, 14, 'F');
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.rect(10, y, 2.5, 14, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`TOTAL GERAL DE PENDÊNCIAS (${totalPlacas} SERVIÇO${totalPlacas > 1 ? 'S' : ''}):`, 16, y + 8.5);

  doc.setTextColor(110, 231, 183); // emerald-300
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(formatBRL(totalValue), 195, y + 9, { align: 'right' });

  y += 24;

  // 6. Signature Lines
  if (y + 25 > 280) {
    doc.addPage();
    y = 20;
  }

  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.line(15, y, 95, y);
  doc.line(115, y, 195, y);

  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Assinatura do Despachante / Responsável', 55, y + 4, { align: 'center' });
  doc.text(isSingleClient && targetClientName ? `Assinatura do Cliente (${targetClientName})` : 'Assinatura do Cliente / Devedor', 155, y + 4, { align: 'center' });

  y += 14;

  // 7. Page numbers in footer across all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(`Relatório de Pendências Financeiras • Página ${i} de ${totalPages}`, 105, 290, { align: 'center' });
  }

  // 8. Save PDF
  const safeName = isSingleClient && targetClientName 
    ? targetClientName.toLowerCase().replace(/[^a-z0-9]/g, '_') 
    : 'geral';
  const todayIso = today.toISOString().split('T')[0];
  const filename = `relatorio_pendencias_${safeName}_${todayIso}.pdf`;
  doc.save(filename);
}

