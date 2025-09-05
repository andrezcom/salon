import ExcelJS from 'exceljs';
import path from 'path';

export class ExcelGeneratorService {

  /**
   * Generar Excel de reporte de períodos de comisiones
   */
  static async generateCommissionPeriodReportExcel(
    reportData: any,
    businessInfo: any,
    reportType: string
  ): Promise<Buffer> {
    try {
      const workbook = new ExcelJS.Workbook();
      
      // Configurar metadatos del workbook
      workbook.creator = 'Sistema de Gestión de Salón';
      workbook.lastModifiedBy = 'Sistema de Gestión de Salón';
      workbook.created = new Date();
      workbook.modified = new Date();
      
      // Crear hoja principal
      const worksheet = workbook.addWorksheet('Reporte de Comisiones');
      
      // Configurar estilos
      const headerStyle = {
        font: { bold: true, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF007BFF' } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
      };
      
      const titleStyle = {
        font: { bold: true, size: 16, color: { argb: 'FF007BFF' } },
        alignment: { horizontal: 'center' }
      };
      
      const subTitleStyle = {
        font: { bold: true, size: 12 },
        alignment: { horizontal: 'center' }
      };
      
      const dataStyle = {
        border: {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        },
        alignment: { vertical: 'middle' }
      };
      
      const amountStyle = {
        ...dataStyle,
        numFmt: '"$"#,##0.00',
        alignment: { horizontal: 'right', vertical: 'middle' }
      };
      
      // Agregar encabezado
      worksheet.mergeCells('A1:H1');
      worksheet.getCell('A1').value = 'REPORTE DE COMISIONES';
      worksheet.getCell('A1').style = titleStyle;
      
      worksheet.mergeCells('A2:H2');
      worksheet.getCell('A2').value = businessInfo.name;
      worksheet.getCell('A2').style = subTitleStyle;
      
      // Agregar información del reporte
      worksheet.getCell('A4').value = 'Fecha de Generación:';
      worksheet.getCell('B4').value = new Date().toLocaleDateString('es-ES');
      worksheet.getCell('A5').value = 'Tipo de Reporte:';
      worksheet.getCell('B5').value = this.getReportTypeName(reportType);
      
      let startRow = 7;
      
      // Generar contenido según el tipo de reporte
      if (reportType === 'period') {
        startRow = this.generatePeriodReportSheet(worksheet, reportData, startRow, headerStyle, dataStyle, amountStyle);
      } else if (reportType === 'expert') {
        startRow = this.generateExpertReportSheet(worksheet, reportData, startRow, headerStyle, dataStyle, amountStyle);
      } else if (reportType === 'performance') {
        startRow = this.generatePerformanceReportSheet(worksheet, reportData, startRow, headerStyle, dataStyle, amountStyle);
      }
      
      // Ajustar ancho de columnas
      worksheet.columns.forEach(column => {
        column.width = 15;
      });
      
      // Agregar pie de página
      const footerRow = startRow + 2;
      worksheet.mergeCells(`A${footerRow}:H${footerRow}`);
      worksheet.getCell(`A${footerRow}`).value = `Reporte generado automáticamente por el Sistema de Gestión de Salón - ${new Date().getFullYear()}`;
      worksheet.getCell(`A${footerRow}`).style = {
        font: { italic: true, size: 10 },
        alignment: { horizontal: 'center' }
      };
      
      // Generar buffer
      const buffer = await workbook.xlsx.writeBuffer();
      return Buffer.from(buffer);
      
    } catch (error) {
      console.error('Error generando Excel:', error);
      throw new Error('Error generando Excel del reporte');
    }
  }

  /**
   * Generar hoja de reporte por períodos
   */
  private static generatePeriodReportSheet(
    worksheet: ExcelJS.Worksheet,
    reportData: any,
    startRow: number,
    headerStyle: any,
    dataStyle: any,
    amountStyle: any
  ): number {
    const { report, totals } = reportData;
    
    // Agregar resumen
    worksheet.getCell(`A${startRow}`).value = 'RESUMEN GENERAL';
    worksheet.getCell(`A${startRow}`).style = { font: { bold: true, size: 14 } };
    startRow += 2;
    
    // Resumen en formato de tabla
    const summaryData = [
      ['Total Períodos', totals?.totalPeriods || 0],
      ['Total Comisiones', totals?.totalCommissions || 0],
      ['Total Pagado', totals?.totalPaid || 0],
      ['Total Pendiente', totals?.totalPending || 0],
      ['Total Aprobado', totals?.totalApproved || 0],
      ['Total Cancelado', totals?.totalCancelled || 0]
    ];
    
    summaryData.forEach((row, index) => {
      worksheet.getCell(`A${startRow + index}`).value = row[0];
      worksheet.getCell(`A${startRow + index}`).style = dataStyle;
      worksheet.getCell(`B${startRow + index}`).value = row[1];
      worksheet.getCell(`B${startRow + index}`).style = typeof row[1] === 'number' && row[0].includes('Comisiones') ? amountStyle : dataStyle;
    });
    
    startRow += summaryData.length + 3;
    
    // Agregar tabla de períodos
    worksheet.getCell(`A${startRow}`).value = 'DETALLE POR PERÍODOS';
    worksheet.getCell(`A${startRow}`).style = { font: { bold: true, size: 14 } };
    startRow += 2;
    
    // Encabezados de la tabla
    const headers = ['Período', 'Año', 'Fecha Inicio', 'Fecha Fin', 'Estado', 'Total Comisiones', 'Total Pagado', 'Total Pendiente'];
    headers.forEach((header, index) => {
      const cell = worksheet.getCell(startRow, index + 1);
      cell.value = header;
      cell.style = headerStyle;
    });
    startRow++;
    
    // Datos de períodos
    if (Array.isArray(report)) {
      report.forEach((period: any) => {
        const row = [
          period.periodNumber || 'N/A',
          period.year || 'N/A',
          period.startDate ? new Date(period.startDate).toLocaleDateString('es-ES') : 'N/A',
          period.endDate ? new Date(period.endDate).toLocaleDateString('es-ES') : 'N/A',
          period.status || 'N/A',
          period.totalCommissions || 0,
          period.totalPaid || 0,
          period.totalPending || 0
        ];
        
        row.forEach((value, index) => {
          const cell = worksheet.getCell(startRow, index + 1);
          cell.value = value;
          cell.style = (index >= 5) ? amountStyle : dataStyle;
        });
        startRow++;
      });
    }
    
    return startRow;
  }

  /**
   * Generar hoja de reporte por experto
   */
  private static generateExpertReportSheet(
    worksheet: ExcelJS.Worksheet,
    reportData: any,
    startRow: number,
    headerStyle: any,
    dataStyle: any,
    amountStyle: any
  ): number {
    const { expert, periods } = reportData;
    
    // Agregar resumen del experto
    worksheet.getCell(`A${startRow}`).value = 'RESUMEN DEL EXPERTO';
    worksheet.getCell(`A${startRow}`).style = { font: { bold: true, size: 14 } };
    startRow += 2;
    
    const expertSummary = [
      ['Experto', expert?.expertName || 'N/A'],
      ['Alias', expert?.expertAlias || 'N/A'],
      ['Total Períodos', expert?.totalPeriods || 0],
      ['Total Comisiones', expert?.totalCommissions || 0],
      ['Comisiones Servicios', expert?.serviceCommissions || 0],
      ['Comisiones Retail', expert?.retailCommissions || 0],
      ['Comisiones Excepcionales', expert?.exceptionalCommissions || 0],
      ['Total Pagado', expert?.paidAmount || 0],
      ['Total Pendiente', expert?.pendingAmount || 0],
      ['Total Aprobado', expert?.approvedAmount || 0]
    ];
    
    expertSummary.forEach((row, index) => {
      worksheet.getCell(`A${startRow + index}`).value = row[0];
      worksheet.getCell(`A${startRow + index}`).style = dataStyle;
      worksheet.getCell(`B${startRow + index}`).value = row[1];
      worksheet.getCell(`B${startRow + index}`).style = typeof row[1] === 'number' && row[0].includes('Comisiones') ? amountStyle : dataStyle;
    });
    
    startRow += expertSummary.length + 3;
    
    // Agregar tabla de períodos del experto
    worksheet.getCell(`A${startRow}`).value = 'DETALLE POR PERÍODOS';
    worksheet.getCell(`A${startRow}`).style = { font: { bold: true, size: 14 } };
    startRow += 2;
    
    // Encabezados de la tabla
    const headers = ['Período', 'Año', 'Fecha Inicio', 'Fecha Fin', 'Estado', 'Total Comisiones', 'Comisiones Servicios', 'Comisiones Retail'];
    headers.forEach((header, index) => {
      const cell = worksheet.getCell(startRow, index + 1);
      cell.value = header;
      cell.style = headerStyle;
    });
    startRow++;
    
    // Datos de períodos
    if (Array.isArray(periods)) {
      periods.forEach((period: any) => {
        const row = [
          period.periodNumber || 'N/A',
          period.year || 'N/A',
          period.startDate ? new Date(period.startDate).toLocaleDateString('es-ES') : 'N/A',
          period.endDate ? new Date(period.endDate).toLocaleDateString('es-ES') : 'N/A',
          period.expertStatus || 'N/A',
          period.totalCommissions || 0,
          period.serviceCommissions || 0,
          period.retailCommissions || 0
        ];
        
        row.forEach((value, index) => {
          const cell = worksheet.getCell(startRow, index + 1);
          cell.value = value;
          cell.style = (index >= 5) ? amountStyle : dataStyle;
        });
        startRow++;
      });
    }
    
    return startRow;
  }

  /**
   * Generar hoja de reporte de rendimiento
   */
  private static generatePerformanceReportSheet(
    worksheet: ExcelJS.Worksheet,
    reportData: any,
    startRow: number,
    headerStyle: any,
    dataStyle: any,
    amountStyle: any
  ): number {
    const { performance, trends } = reportData;
    
    // Agregar resumen de rendimiento
    worksheet.getCell(`A${startRow}`).value = 'RESUMEN DE RENDIMIENTO';
    worksheet.getCell(`A${startRow}`).style = { font: { bold: true, size: 14 } };
    startRow += 2;
    
    const performanceSummary = [
      ['Total Períodos', trends?.totalPeriods || 0],
      ['Promedio Comisiones', trends?.averageCommissions || 0],
      ['Promedio Expertos', trends?.averageExperts || 0],
      ['Total Comisiones', trends?.totalCommissions || 0],
      ['Total Pagado', trends?.totalPaid || 0],
      ['Total Pendiente', trends?.totalPending || 0],
      ['Crecimiento', `${trends?.growth || 0}%`]
    ];
    
    performanceSummary.forEach((row, index) => {
      worksheet.getCell(`A${startRow + index}`).value = row[0];
      worksheet.getCell(`A${startRow + index}`).style = dataStyle;
      worksheet.getCell(`B${startRow + index}`).value = row[1];
      worksheet.getCell(`B${startRow + index}`).style = typeof row[1] === 'number' && row[0].includes('Comisiones') ? amountStyle : dataStyle;
    });
    
    startRow += performanceSummary.length + 3;
    
    // Agregar tabla de rendimiento
    worksheet.getCell(`A${startRow}`).value = 'DETALLE DE RENDIMIENTO';
    worksheet.getCell(`A${startRow}`).style = { font: { bold: true, size: 14 } };
    startRow += 2;
    
    // Encabezados de la tabla
    const headers = ['Período', 'Año', 'Fecha Inicio', 'Fecha Fin', 'Total Expertos', 'Total Comisiones', 'Promedio por Comisión', 'Estado'];
    headers.forEach((header, index) => {
      const cell = worksheet.getCell(startRow, index + 1);
      cell.value = header;
      cell.style = headerStyle;
    });
    startRow++;
    
    // Datos de rendimiento
    if (Array.isArray(performance)) {
      performance.forEach((period: any) => {
        const row = [
          period.periodNumber || 'N/A',
          period.year || 'N/A',
          period.startDate ? new Date(period.startDate).toLocaleDateString('es-ES') : 'N/A',
          period.endDate ? new Date(period.endDate).toLocaleDateString('es-ES') : 'N/A',
          period.totalExperts || 0,
          period.totalCommissions || 0,
          period.averageCommission || 0,
          period.status || 'N/A'
        ];
        
        row.forEach((value, index) => {
          const cell = worksheet.getCell(startRow, index + 1);
          cell.value = value;
          cell.style = (index >= 4 && index <= 6) ? amountStyle : dataStyle;
        });
        startRow++;
      });
    }
    
    return startRow;
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
