import jsPDF from 'jspdf';

const TYPE_LABELS = {
  scam_message: 'Scam Message',
  counterfeit_currency: 'Counterfeit Currency',
  qr_link: 'QR / Payment Link',
};

function addHeader(doc, title) {
  doc.setFillColor(30, 58, 138);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('SuRakshaAI', 14, 13);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Your Shield Against Digital Fraud', 14, 20);
  doc.setFontSize(11);
  doc.text(title, 196, 16, { align: 'right' });
  doc.setTextColor(15, 23, 42);
}

function verdictColor(verdict) {
  if (verdict === 'high_risk') return [220, 38, 38];
  if (verdict === 'suspicious') return [245, 158, 11];
  return [16, 185, 129];
}

let y = 0;

function line(doc, text, opts = {}) {
  const { size = 10, bold = false, gap = 6, color } = opts;
  doc.setFont('helvetica', bold ? 'bold' : 'normal');
  doc.setFontSize(size);
  if (color) doc.setTextColor(...color); else doc.setTextColor(15, 23, 42);
  const lines = doc.splitTextToSize(text, 182);
  doc.text(lines, 14, y);
  y += gap * lines.length;
}

export function generateCaseReportPdf(caseRow, complaint) {
  const doc = new jsPDF();
  addHeader(doc, 'Case Report');
  y = 40;

  line(doc, `Case #${caseRow.id} - ${TYPE_LABELS[caseRow.type] || caseRow.type}`, { size: 14, bold: true, gap: 8 });
  line(doc, `Generated: ${new Date().toLocaleString()}`, { size: 9, color: [100, 116, 139] });
  y += 4;

  line(doc, 'Verdict', { bold: true, size: 11, gap: 6 });
  line(doc, `${caseRow.verdict.replace('_', ' ').toUpperCase()}  (Risk Score: ${caseRow.risk_score}/100)`, { color: verdictColor(caseRow.verdict), bold: true, size: 12, gap: 8 });

  line(doc, 'Input Summary', { bold: true, size: 11, gap: 6 });
  line(doc, caseRow.input_summary, { gap: 5.5 });
  y += 2;

  line(doc, 'Location', { bold: true, size: 11, gap: 6 });
  line(doc, caseRow.region ? `${caseRow.region} (${caseRow.latitude?.toFixed(4)}, ${caseRow.longitude?.toFixed(4)})` : 'Not specified', { gap: 5.5 });
  y += 2;

  line(doc, 'AI Explainability Findings', { bold: true, size: 11, gap: 6 });
  let explanation = [];
  try { explanation = JSON.parse(caseRow.explanation); } catch { explanation = [String(caseRow.explanation)]; }
  explanation.forEach((e) => line(doc, `- ${e}`, { size: 9.5, gap: 5 }));
  y += 2;
  line(doc, 'Note: findings are produced by a transparent, rules-based heuristic engine, not a black-box model.', { size: 8, color: [100, 116, 139], gap: 5 });

  if (complaint) {
    doc.addPage();
    y = 20;
    line(doc, 'Mock Cybercrime Complaint Draft', { bold: true, size: 13, gap: 8 });
    line(doc, complaint.disclaimer, { size: 8.5, color: [220, 38, 38], gap: 7 });
    line(doc, `Draft ID: ${complaint.draftId}`, { size: 9.5, gap: 5.5 });
    line(doc, `Category: ${complaint.category}`, { size: 9.5, gap: 5.5 });
    line(doc, `Incident Date/Time: ${complaint.incidentDate} ${complaint.incidentTime}`, { size: 9.5, gap: 5.5 });
    line(doc, `Location: ${complaint.location}`, { size: 9.5, gap: 7 });
    line(doc, 'Description', { bold: true, size: 10.5, gap: 6 });
    line(doc, complaint.description, { size: 9.5, gap: 5 });
    y += 2;
    line(doc, 'Suggested Actions', { bold: true, size: 10.5, gap: 6 });
    complaint.suggestedActions.forEach((a) => line(doc, `- ${a}`, { size: 9.5, gap: 5 }));
  }

  doc.save(`suraksha-case-${caseRow.id}.pdf`);
}

export function generateUnifiedReportPdf(sessionResults, fused) {
  const doc = new jsPDF();
  addHeader(doc, 'Unified Risk Report');
  y = 40;

  line(doc, 'Unified Fraud Risk Score', { bold: true, size: 14, gap: 8 });
  line(doc, `${fused.score}/100 - ${fused.verdict.replace('_', ' ').toUpperCase()}`, { color: verdictColor(fused.verdict), bold: true, size: 13, gap: 9 });
  line(doc, `Based on ${sessionResults.length} check(s) run this session.`, { size: 9.5, color: [100, 116, 139], gap: 8 });

  line(doc, 'Contributing Checks', { bold: true, size: 11, gap: 7 });
  sessionResults.forEach((r, idx) => {
    line(doc, `${idx + 1}. ${TYPE_LABELS[r.type] || r.type} - score ${r.score}/100 (${r.verdict.replace('_', ' ')})`, { size: 9.5, gap: 5.5 });
  });

  y += 3;
  line(doc, 'This unified score fuses each module using weighted contribution (scam message 35%, currency 35%, QR/link 30%).', { size: 8.5, color: [100, 116, 139], gap: 5 });

  doc.save('suraksha-unified-report.pdf');
}
