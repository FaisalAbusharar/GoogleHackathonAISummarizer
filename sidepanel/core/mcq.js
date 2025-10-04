import { showMCQ } from '../ui/render.js';
import { getCurrentSummary } from './summary.js';


export function setupMCQButton() {
  const button = document.getElementById('generate-mcq');
  if (!button) return;

  button.addEventListener('click', async () => {
    const summary = getCurrentSummary();
    if (!summary) return;

    button.disabled = true;
    button.textContent = 'Generating...';

    const mcqs = await generateMCQ(summary);
    showMCQ(mcqs);

    button.disabled = false;
    button.textContent = 'Generate MCQs';
  });
}



export async function generateMCQ(text, retries = 2, lengthSelectorId = 'length') {
  async function attempt() {
    const length = document.querySelector(`#${lengthSelectorId}`).value;

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
      length: length
    };

    const availability = await Writer.availability();
    if (availability === 'unavailable') throw new Error('Writer API is not available');

    const writer = await Writer.create(options);
    if (availability !== 'available') {
      writer.addEventListener('downloadprogress', (e) =>
        console.log(`Downloaded ${e.loaded * 100}%`)
      );
      await writer.ready;
    }

    const raw = await writer.write(text);
    writer.destroy();

    const extracted = extractJSON(raw);
    if (!extracted || !isValidMCQList(extracted)) {
      console.error('Invalid MCQ format:', raw);
      throw new Error('Malformed MCQ output.');
    }
    return extracted;
    
  }

  for (let i = 0; i <= retries; i++) {
    try {
      return await attempt();
    } catch (e) {
      console.warn(`Attempt ${i + 1} failed:`, e.message);
      if (i === retries) throw e;
    }
  }
}

function extractJSON(raw) {
  const start = raw.indexOf('[');
  const end = raw.lastIndexOf(']');
  if (start !== -1 && end !== -1) {
    try {
      return JSON.parse(raw.slice(start, end + 1));
    } catch (e) {
      console.warn('Extracted JSON invalid:', raw.slice(start, end + 1));
      return null;
    }
  }
  return null;
}

function isValidMCQList(list) {
  if (!Array.isArray(list)) return false;
  return list.every(mcq =>
    typeof mcq.question === 'string' &&
    Array.isArray(mcq.choices) &&
    mcq.choices.length === 4 &&
    mcq.choices.every(c => typeof c === 'string') &&
    typeof mcq.answer === 'string'
  );
}

