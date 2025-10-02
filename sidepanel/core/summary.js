import { showSummary, updateWarning } from '../ui/render.js';
import { MAX_MODEL_CHARS } from '../ui/constants.js';
import { setSummaryStateEnabled } from '../utils/utils.js';

/**
 * Internal state
 */
let pageContent = '';
let _currentSummary = null;

/**
 * Get current summary
 */
export function getCurrentSummary() {
  return _currentSummary;
}

/**
 * Set current summary and update UI state
 */
function setCurrentSummary(summary) {
  _currentSummary = summary;

  const isValid =
    summary &&
    !summary.startsWith('Error') &&
    summary !== "There's nothing to summarize...";

  setSummaryStateEnabled(isValid);
}

/**
 * Handle page content change
 */
export async function onContentChange(newContent) {
  if (pageContent === newContent) return;

  pageContent = newContent;

  if (!newContent || newContent.length > MAX_MODEL_CHARS) {
    updateWarning('Text is too long or empty');
    setCurrentSummary(null);
    showSummary('');
    return;
  }

  updateWarning('');
  showSummary('Loading...');

  try {
    const summary = await generateSummary(newContent);
    setCurrentSummary(summary);
    showSummary(summary);
  } catch (e) {
    console.error('Failed to generate summary', e);
    setCurrentSummary(null);
    showSummary('Error generating summary.');
  }
}

/**
 * Handle config change (type/format/length)
 */
export function onConfigChange() {
  const oldContent = pageContent;
  pageContent = '';
  onContentChange(oldContent);
}

/**
 * Generate summary from text
 * @param {string} text - Content to summarize
 * @param {string} context - Optional context prompt
 * @param {boolean} forceOptions - If true, ignore UI select values
 */
export async function generateSummary(
  text,
  context = "You are summarizing a subject's content for a student, make it clear and concise.",
  forceOptions = false
) {
  if (!text) return "There's nothing to summarize...";

  let options = {
    sharedContext: context,
    type: 'tldr',
    format: 'markdown',
    length: 'short'
  };

  if (!forceOptions) {
    const type = document.querySelector('#type')?.value || 'tldr';
    const format = document.querySelector('#format')?.value || 'markdown';
    const length = document.querySelector('#length')?.value || 'short';

    options = { sharedContext: context, type, format, length };
  }

  try {
    const availability = await Summarizer.availability();
    if (availability === 'unavailable') throw new Error('Summarizer API unavailable');

    const summarizer = await Summarizer.create(options);
    await summarizer.ready;

    const summary = await summarizer.summarize(text);
    summarizer.destroy();

    return summary || "There's nothing to summarize...";
  } catch (e) {
    console.error('Summary generation failed', e);
    return 'Error: ' + e.message;
  }
}
