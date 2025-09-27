/* global Summarizer */
import DOMPurify from 'dompurify';
import { marked } from 'marked';

const MAX_MODEL_CHARS = 4000;

let pageContent = '';
let currentSummary = null;

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
    showMCQ([]); // Pass empty array
    generateMcqButton.disabled = true;
    return;
  }

  generateMcqButton.textContent = 'Generating...';

  const mcq = await generateMCQ(currentSummary);
  if (typeof mcq === 'string') {
    showMCQ([]); // Show error fallback
    mcqElement.innerHTML = `<div class="text-danger">${mcq}</div>`;
  } else {
    showMCQ(mcq);
    mcqElement.style.display = 'block';
  }

  generateMcqButton.disabled = false;
  generateMcqButton.textContent = 'Generate MCQs';
});

//! ------------------- Generate MCQ Function -------------------
async function generateMCQ(text) {
  try {
    const options = {
      sharedContext: `You are a study assistant. Based on the provided summary, generate multiple choice questions in the following JSON format:

[
  {
    "question": "What is the capital of France?",
    "choices": ["A. Paris", "B. Rome", "C. Madrid", "D. Berlin"],
    "answer": "A"
  }
]

Only output raw JSON. Do not add any explanation, Markdown, or headings.`,
      type: 'tldr',
      format: 'plain-text',
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

    const raw = await summarizer.summarize(text);
    summarizer.destroy();

    let mcqList;
    try {
      mcqList = JSON.parse(raw);
    } catch (parseError) {
      console.error('Failed to parse MCQ JSON:', raw);
      return 'Error: Could not parse generated MCQs. Please try again.';
    }

    return mcqList;
  } catch (e) {
    console.error('MCQ generation failed', e);
    return 'Error: ' + e.message;
  }
}

//& ------------------- Render Functions -------------------
function showSummary(text) {
  summaryElement.innerHTML = DOMPurify.sanitize(marked.parse(text));
}

function showMCQ(mcqList) {
  const container = document.getElementById('mcq');
  container.innerHTML = ''; // Clear old MCQs

  const inner = document.createElement('div');
  inner.id = 'mcq-list';

  if (!Array.isArray(mcqList) || mcqList.length === 0) {
    inner.innerHTML = '<p>No MCQs to display.</p>';
    container.appendChild(inner);
    return;
  }

  mcqList.forEach((mcq, index) => {
    const card = document.createElement('div');
    card.className = 'card p-3 mb-3';

    const question = document.createElement('p');
    question.textContent = `Q${index + 1}: ${mcq.question}`;
    card.appendChild(question);

    const feedback = document.createElement('div');
    feedback.className = 'mt-2';

    mcq.choices.forEach(choice => {
      const btn = document.createElement('button');
      btn.textContent = choice;
      btn.className = 'btn btn-outline-primary m-1';
      btn.addEventListener('click', () => {
        const isCorrect = choice.startsWith(mcq.answer);
        feedback.textContent = isCorrect ? '✅ Correct!' : `❌ Incorrect. Correct answer: ${mcq.answer}`;
        feedback.style.color = isCorrect ? 'green' : 'red';
        card.querySelectorAll('button').forEach(b => b.disabled = true);
      });

      card.appendChild(btn);
    });

    card.appendChild(feedback);
    inner.appendChild(card);
  });

  container.appendChild(inner);
}

function updateWarning(warning) {
  warningElement.textContent = warning;
  if (warning) warningElement.removeAttribute('hidden');
  else warningElement.setAttribute('hidden', '');
}
