import { jsPDF } from 'jspdf';
import { Service } from '../types';

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
  let formattedDate = firstService.date;
  if (formattedDate && formattedDate.includes('-')) {
    const parts = formattedDate.split('-');
    if (parts.length === 3) {
      formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }

  // Calculate overall totals
  const totalValueGeral = services.reduce((sum, srv) => {
    const srvTotal = srv.items ? srv.items.reduce((acc, it) => acc + it.value, 0) : srv.totalValue || 0;
    return sum + srvTotal;
  }, 0);

  // Helper to format currency in pt-BR
  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

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
