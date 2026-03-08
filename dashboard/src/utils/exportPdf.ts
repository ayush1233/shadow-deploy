import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportPdf = (data: any[], title: string, filename: string) => {
    if (!data || data.length === 0) return;

    const doc = new jsPDF();

    // Add title
    doc.setFontSize(16);
    doc.text(title, 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);

    const headers = Object.keys(data[0]);
    const rows = data.map(row => headers.map(header => {
        let val = row[header];
        if (val === null || val === undefined) return '';
        if (typeof val === 'object') return JSON.stringify(val);
        return String(val);
    }));

    autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 30,
        styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
        headStyles: { fillColor: [30, 41, 59] } // Dark blue header
    });

    doc.save(filename);
};
