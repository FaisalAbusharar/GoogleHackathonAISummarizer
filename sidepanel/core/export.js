import { jsPDF } from 'jspdf';
import { getCurrentSummary } from './summary.js';

export function setupExportButtons() {
  const btn = document.getElementById('export-summary-pdf');
  btn.addEventListener('click', () => {
    const doc = new jsPDF();
    const text = getCurrentSummary() || "No summary available";
    const lines = doc.splitTextToSize(text, 180);
    doc.text(lines, 10, 10);
    doc.save("summary.pdf");
  });
}
