import { getCurrentSummary } from './summary.js';


export function setupFlashcardButton() {
  const button = document.getElementById('generate-flashcard');
  if (!button) return;

  button.addEventListener('click', async () => {
    const summary = getCurrentSummary();
    if (!summary) return;

    button.disabled = true;
    button.textContent = 'Generating...';

    const cards = await generateFlashcards(summary);
    
    downloadFlashcards(cards)


    button.disabled = false;
    button.textContent = 'Generate Flashcards';
  });
}


function downloadFlashcards(flashcards) {
  if (!Array.isArray(flashcards) || flashcards.length === 0) {
    console.warn('No flashcards to download.');
    return;
  }

  let csvContent = 'data:text/csv;charset=utf-8,';

  flashcards.forEach(card => {
    const front = `"${card.front.replace(/"/g, '""')}"`;
    const back = `"${card.back.replace(/"/g, '""')}"`;
    csvContent += `${front},${back}\n`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', 'flashcards.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}



export async function generateFlashcards(text, retries = 2, lengthSelectorId = 'length') {
  async function attempt() {
    const length = document.querySelector(`#${lengthSelectorId}`).value;

    const options = {
      sharedContext: `You are a study assistant. Based on the provided summary, generate flashcards in the following JSON format:

[
  {
    "front": "What is the capital of France?",
    "back": "Paris"
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
    if (!extracted || !isValidFlashcardList(extracted)) {
      console.error('Invalid flashcard format:', raw);
      throw new Error('Malformed flashcard output.');
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

function isValidFlashcardList(list) {
  if (!Array.isArray(list)) return false;
  return list.every(card =>
    typeof card.front === 'string' &&
    typeof card.back === 'string'
  );
}

