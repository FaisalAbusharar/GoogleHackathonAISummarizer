import { highlightKeywordsInPage } from '../ui/render.js';
import { getCurrentSummary } from './summary.js';


export function setupHighlightButton() {
  const button = document.getElementById('highlightBtn');
  if (!button) return;

  button.addEventListener('click', async () => {
    button.disabled = true;
    button.textContent = 'Highlighting...';

    chrome.storage.session.get('pageContent', async ({ pageContent }) => {
      if (!pageContent) {
        alert("No page content available.");
        button.disabled = false;
        button.textContent = 'Highlight Keywords';
        return;
      }

      const keywords = await highlight(pageContent);
      highlightKeywordsInPage(keywords);

      button.disabled = false;
      button.textContent = 'Highlight Keywords';
    });
  });
}

export async function highlight(text, lengthSelectorId = 'length') {
    const length = document.querySelector(`#${lengthSelectorId}`).value;

    const options = {
      sharedContext: "You are a helpful assistant. Extract a list of the most important keywords or key phrases from the following content. Only return them as a plain comma-separated list. THEY MUST BE FROM THE CONTENT PROVIDED, AT LEAST 5 WORDS.",
      type: 'tldr',
      format: 'plain-text',
      length: 'long'
    };

    const availability = await Summarizer.availability();
    if (availability === 'unavailable') throw new Error('Summarizer API is not available');

    const summarizer = await Summarizer.create(options);
    if (availability !== 'available') {
      summarizer.addEventListener('downloadprogress', (e) =>
        console.log(`Downloaded ${e.loaded * 100}%`)
      );
      await summarizer.ready;
    }

    const keywords = await summarizer.summarize(text);
    summarizer.destroy();

    const keywordArray = keywords.split(',').map(k => k.trim());

    return keywordArray || "There's nothing to summarize...";

    
}


