/* global Summarizer */
import DOMPurify from 'dompurify';
import { marked } from 'marked';

const MAX_MODEL_CHARS = 4000;

let pageContent = '';
let currentSummary = null; // 

const summaryElement = document.querySelector('#summary');
const warningElement = document.querySelector('#warning');
const summaryTypeSelect = document.querySelector('#type');
const summaryFormatSelect = document.querySelector('#format');
const summaryLengthSelect = document.querySelector('#length');
const mcqElement = document.querySelector('#mcq');
const generateMcqButton = document.getElementById('generate-mcq');

// ------------------- Event Listeners -------------------
[summaryTypeSelect, summaryFormatSelect, summaryLengthSelect].forEach((e) =>
  e.addEventListener('change', onConfigChange)
);

chrome.storage.session.get('pageContent', ({ pageContent }) => {
  onContentChange(pageContent);
});

chrome.storage.session.onChanged.addListener((changes) => {
  const pageContent = changes['pageContent'];
  onContentChange(pageContent.newValue);
});

function onConfigChange() {
  const oldContent = pageContent;
  pageContent = '';
  onContentChange(oldContent);
}

//* ------------------- Main Content Change -------------------
async function onContentChange(newContent) {
  if (pageContent === newContent) return;

  pageContent = newContent;
  let summary;

  if (newContent) {
    if (newContent.length > MAX_MODEL_CHARS) {
      updateWarning(`Text is too long with ${newContent.length} characters (limit: ~4000).`);
    } else {
      updateWarning('');
    }

    showSummary('Loading...');
    summary = await generateSummary(newContent);
  } else {
    summary = "There's nothing to summarize...";
  }

  currentSummary = summary;
  showSummary(summary);
  mcqElement.style.display = 'none'; 
  generateMcqButton.disabled = !summary || summary.startsWith("Error") || summary === "There's nothing to summarize...";
}

//$ ------------------- Generate Summary -------------------
async function generateSummary(text) {
  try {
    const options = {
      sharedContext: 'You are summarizing a subject\'s content for a student, make it as clear as possible.',
      type: summaryTypeSelect.value,
      format: summaryFormatSelect.value,
      length: summaryLengthSelect.value
    };

    const availability = await Summarizer.availability();
    if (availability === 'unavailable') return 'Summarizer API is not available';

    const summarizer = await Summarizer.create(options);
    if (availability !== 'available') {
      summarizer.addEventListener('downloadprogress', (e) =>
        console.log(`Downloaded ${e.loaded * 100}%`)
      );
      await summarizer.ready;
    }

    const summary = await summarizer.summarize(text);
    summarizer.destroy();
    return summary;
  } catch (e) {
    console.error('Summary generation failed', e);
    return 'Error: ' + e.message;
  }
}

//& ------------------- Generate MCQ on Button Click -------------------
generateMcqButton.addEventListener('click', async () => {
  if (!currentSummary) {
    showMCQ('Please summarize content first.');
    generateMcqButton.disabled = true;
    return;
  }

  generateMcqButton.textContent = 'Generating...';


  const mcq = await generateMCQ(currentSummary);
  showMCQ(mcq);

  mcqElement.style.display = 'block';
  generateMcqButton.disabled = false;
  generateMcqButton.textContent = 'Generate MCQs';
});

//! ------------------- Generate MCQ Function -------------------
async function generateMCQ(text) {
  try {
    const options = {
      sharedContext: `You are summarizing a subject's content for a student. Generate MCQs too. Keep the answers in a bold answer key at the end. Separate lines.`,
      type: 'tldr',
      format: summaryFormatSelect.value,
      length: summaryLengthSelect.value
    };

    const availability = await Summarizer.availability();
    if (availability === 'unavailable') return 'Summarizer API is not available';

    const summarizer = await Summarizer.create(options);
    if (availability !== 'available') {
      summarizer.addEventListener('downloadprogress', (e) =>
        console.log(`Downloaded ${e.loaded * 100}%`)
      );
      await summarizer.ready;
    }

    let mcq = await summarizer.summarize(text);
    summarizer.destroy();


    const match = mcq.match(/(MCQ|Multiple Choice Questions|Questions)[:\s]*/i);
    if (match) {
      mcq = mcq.slice(match.index + match[0].length);
    }

    mcq = mcq.trim().replace(/^s:\*\*/, '');
    mcq = `### 🧠 Multiple Choice Questions\n\n${mcq}`;

    return mcq;
  } catch (e) {
    console.error('MCQ generation failed', e);
    return 'Error: ' + e.message;
  }
}

//& ------------------- Render Functions -------------------
function showSummary(text) {
  summaryElement.innerHTML = DOMPurify.sanitize(marked.parse(text));
}

function showMCQ(text) {
  mcqElement.innerHTML = DOMPurify.sanitize(marked.parse(text));
}

function updateWarning(warning) {
  warningElement.textContent = warning;
  if (warning) warningElement.removeAttribute('hidden');
  else warningElement.setAttribute('hidden', '');
}
