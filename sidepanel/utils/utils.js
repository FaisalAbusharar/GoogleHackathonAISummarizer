import DOMPurify from 'dompurify';
import { marked } from 'marked';

export function sanitizeMarkdown(text) {
  return DOMPurify.sanitize(marked.parse(text));
}

export function setSummaryStateEnabled(enabled) {
  document.getElementById('generate-mcq').disabled = !enabled;
  document.getElementById('export-summary-pdf').disabled = !enabled;
  document.getElementById('input').hidden = !enabled;
}