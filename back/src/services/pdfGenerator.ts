import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

export class PDFGeneratorService {

  /**
   * Generar PDF de reporte de períodos de comisiones
   */
  static async generateCommissionPeriodReportPDF(
    reportData: any,
    businessInfo: any,
    reportType: string
  ): Promise<Buffer> {
    try {
      // Crear HTML del reporte
      const html = this.generateReportHTML(reportData, businessInfo, reportType);
      
      // Configurar Puppeteer
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      
      // Establecer contenido HTML
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      // Generar PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        }
      });
      
      await browser.close();
      
      return pdfBuffer;
      
    } catch (error) {
      console.error('Error generando PDF:', error);
      throw new Error('Error generando PDF del reporte');
    }
  }

  /**
   * Generar HTML del reporte
   */
  private static generateReportHTML(reportData: any, businessInfo: any, reportType: string): string {
    const currentDate = new Date().toLocaleDateString('es-ES');
    const currentTime = new Date().toLocaleTimeString('es-ES');
    
    let content = '';
    
    if (reportType === 'period') {
      content = this.generatePeriodReportContent(reportData);
    } else if (reportType === 'expert') {
      content = this.generateExpertReportContent(reportData);
    } else if (reportType === 'performance') {
      content = this.generatePerformanceReportContent(reportData);
    }
    
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reporte de Comisiones - ${businessInfo.name}</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
            line-height: 1.6;
          }
          
          .header {
            text-align: center;
            border-bottom: 3px solid #007bff;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          
          .header h1 {
            color: #007bff;
            margin: 0;
            font-size: 28px;
          }
          
          .header h2 {
            color: #666;
            margin: 10px 0 0 0;
            font-size: 18px;
            font-weight: normal;
          }
          
          .business-info {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
          }
          
          .report-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            font-size: 14px;
            color: #666;
          }
          
          .summary {
            background-color: #e3f2fd;
            padding: 20px;
            border-radius: 5px;
            margin-bottom: 30px;
          }
          
          .summary h3 {
            margin-top: 0;
            color: #1976d2;
          }
          
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 15px;
          }
          
          .summary-item {
            background-color: white;
            padding: 15px;
            border-radius: 5px;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          
          .summary-item .label {
            font-size: 12px;
            color: #666;
            margin-bottom: 5px;
          }
          
          .summary-item .value {
            font-size: 20px;
            font-weight: bold;
            color: #1976d2;
          }
          
          .table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            background-color: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          
          .table th {
            background-color: #007bff;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: bold;
          }
          
          .table td {
            padding: 10px 12px;
            border-bottom: 1px solid #eee;
          }
          
          .table tr:nth-child(even) {
            background-color: #f8f9fa;
          }
          
          .table tr:hover {
            background-color: #e3f2fd;
          }
          
          .amount {
            text-align: right;
            font-weight: bold;
          }
          
          .status {
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
          }
          
          .status.pending {
            background-color: #fff3cd;
            color: #856404;
          }
          
          .status.approved {
            background-color: #d4edda;
            color: #155724;
          }
          
          .status.paid {
            background-color: #d1ecf1;
            color: #0c5460;
          }
          
          .status.cancelled {
            background-color: #f8d7da;
            color: #721c24;
          }
          
          .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #eee;
            padding-top: 20px;
          }
          
          .page-break {
            page-break-before: always;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Reporte de Comisiones</h1>
          <h2>${businessInfo.name}</h2>
        </div>
        
        <div class="business-info">
          <strong>Información del Negocio:</strong><br>
          ${businessInfo.name}<br>
          ${businessInfo.contact?.email || 'N/A'} | ${businessInfo.contact?.phone || 'N/A'}<br>
          ${businessInfo.contact?.address || 'N/A'}
        </div>
        
        <div class="report-info">
          <div>
            <strong>Fecha de Generación:</strong> ${currentDate} ${currentTime}
          </div>
          <div>
            <strong>Tipo de Reporte:</strong> ${this.getReportTypeName(reportType)}
          </div>
        </div>
        
        ${content}
        
        <div class="footer">
          <p>Reporte generado automáticamente por el Sistema de Gestión de Salón</p>
          <p>© ${new Date().getFullYear()} - Todos los derechos reservados</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generar contenido del reporte por períodos
   */
  private static generatePeriodReportContent(reportData: any): string {
    const { report, totals } = reportData;
    
    let tableRows = '';
    if (Array.isArray(report)) {
      report.forEach((period: any) => {
        tableRows += `
          <tr>
            <td>${period.periodNumber || 'N/A'}</td>
            <td>${period.year || 'N/A'}</td>
            <td>${period.startDate ? new Date(period.startDate).toLocaleDateString('es-ES') : 'N/A'}</td>
            <td>${period.endDate ? new Date(period.endDate).toLocaleDateString('es-ES') : 'N/A'}</td>
            <td><span class="status ${period.status}">${period.status}</span></td>
            <td class="amount">$${period.totalCommissions?.toLocaleString() || '0'}</td>
            <td class="amount">$${period.totalPaid?.toLocaleString() || '0'}</td>
            <td class="amount">$${period.totalPending?.toLocaleString() || '0'}</td>
          </tr>
        `;
      });
    }
    
    return `
      <div class="summary">
        <h3>Resumen General</h3>
        <div class="summary-grid">
          <div class="summary-item">
            <div class="label">Total Períodos</div>
            <div class="value">${totals?.totalPeriods || 0}</div>
          </div>
          <div class="summary-item">
            <div class="label">Total Comisiones</div>
            <div class="value">$${totals?.totalCommissions?.toLocaleString() || '0'}</div>
          </div>
          <div class="summary-item">
            <div class="label">Total Pagado</div>
            <div class="value">$${totals?.totalPaid?.toLocaleString() || '0'}</div>
          </div>
          <div class="summary-item">
            <div class="label">Total Pendiente</div>
            <div class="value">$${totals?.totalPending?.toLocaleString() || '0'}</div>
          </div>
        </div>
      </div>
      
      <table class="table">
        <thead>
          <tr>
            <th>Período</th>
            <th>Año</th>
            <th>Fecha Inicio</th>
            <th>Fecha Fin</th>
            <th>Estado</th>
            <th>Total Comisiones</th>
            <th>Total Pagado</th>
            <th>Total Pendiente</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    `;
  }

  /**
   * Generar contenido del reporte por experto
   */
  private static generateExpertReportContent(reportData: any): string {
    const { expert, periods } = reportData;
    
    let tableRows = '';
    if (Array.isArray(periods)) {
      periods.forEach((period: any) => {
        tableRows += `
          <tr>
            <td>${period.periodNumber || 'N/A'}</td>
            <td>${period.year || 'N/A'}</td>
            <td>${period.startDate ? new Date(period.startDate).toLocaleDateString('es-ES') : 'N/A'}</td>
            <td>${period.endDate ? new Date(period.endDate).toLocaleDateString('es-ES') : 'N/A'}</td>
            <td><span class="status ${period.expertStatus}">${period.expertStatus}</span></td>
            <td class="amount">$${period.totalCommissions?.toLocaleString() || '0'}</td>
            <td class="amount">$${period.serviceCommissions?.toLocaleString() || '0'}</td>
            <td class="amount">$${period.retailCommissions?.toLocaleString() || '0'}</td>
          </tr>
        `;
      });
    }
    
    return `
      <div class="summary">
        <h3>Resumen del Experto</h3>
        <div class="summary-grid">
          <div class="summary-item">
            <div class="label">Experto</div>
            <div class="value">${expert?.expertName || 'N/A'}</div>
          </div>
          <div class="summary-item">
            <div class="label">Total Períodos</div>
            <div class="value">${expert?.totalPeriods || 0}</div>
          </div>
          <div class="summary-item">
            <div class="label">Total Comisiones</div>
            <div class="value">$${expert?.totalCommissions?.toLocaleString() || '0'}</div>
          </div>
          <div class="summary-item">
            <div class="label">Total Pagado</div>
            <div class="value">$${expert?.paidAmount?.toLocaleString() || '0'}</div>
          </div>
        </div>
      </div>
      
      <table class="table">
        <thead>
          <tr>
            <th>Período</th>
            <th>Año</th>
            <th>Fecha Inicio</th>
            <th>Fecha Fin</th>
            <th>Estado</th>
            <th>Total Comisiones</th>
            <th>Comisiones Servicios</th>
            <th>Comisiones Retail</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    `;
  }

  /**
   * Generar contenido del reporte de rendimiento
   */
  private static generatePerformanceReportContent(reportData: any): string {
    const { performance, trends } = reportData;
    
    let tableRows = '';
    if (Array.isArray(performance)) {
      performance.forEach((period: any) => {
        tableRows += `
          <tr>
            <td>${period.periodNumber || 'N/A'}</td>
            <td>${period.year || 'N/A'}</td>
            <td>${period.startDate ? new Date(period.startDate).toLocaleDateString('es-ES') : 'N/A'}</td>
            <td>${period.endDate ? new Date(period.endDate).toLocaleDateString('es-ES') : 'N/A'}</td>
            <td>${period.totalExperts || 0}</td>
            <td class="amount">$${period.totalCommissions?.toLocaleString() || '0'}</td>
            <td class="amount">$${period.averageCommission?.toLocaleString() || '0'}</td>
            <td><span class="status ${period.status}">${period.status}</span></td>
          </tr>
        `;
      });
    }
    
    return `
      <div class="summary">
        <h3>Resumen de Rendimiento</h3>
        <div class="summary-grid">
          <div class="summary-item">
            <div class="label">Total Períodos</div>
            <div class="value">${trends?.totalPeriods || 0}</div>
          </div>
          <div class="summary-item">
            <div class="label">Promedio Comisiones</div>
            <div class="value">$${trends?.averageCommissions?.toLocaleString() || '0'}</div>
          </div>
          <div class="summary-item">
            <div class="label">Promedio Expertos</div>
            <div class="value">${trends?.averageExperts?.toFixed(1) || '0'}</div>
          </div>
          <div class="summary-item">
            <div class="label">Crecimiento</div>
            <div class="value">${trends?.growth || 0}%</div>
          </div>
        </div>
      </div>
      
      <table class="table">
        <thead>
          <tr>
            <th>Período</th>
            <th>Año</th>
            <th>Fecha Inicio</th>
            <th>Fecha Fin</th>
            <th>Total Expertos</th>
            <th>Total Comisiones</th>
            <th>Promedio por Comisión</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    `;
  }

  /**
   * Obtener nombre del tipo de reporte
   */
  private static getReportTypeName(reportType: string): string {
    const types: { [key: string]: string } = {
      'period': 'Reporte por Períodos',
      'expert': 'Reporte por Experto',
      'performance': 'Reporte de Rendimiento'
    };
    return types[reportType] || 'Reporte General';
  }
}
