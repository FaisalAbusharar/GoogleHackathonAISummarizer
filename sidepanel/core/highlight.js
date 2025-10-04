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
      alert(keywords)
      highlightKeywordsInPage(keywords);


      button.disabled = false;
      button.textContent = 'Highlight Keywords';
    });
  });
}

export async function highlight(text, lengthSelectorId = 'length') {
    const length = document.querySelector(`#${lengthSelectorId}`).value;

    const options = {
      sharedContext: `
You are a precise keyword extraction assistant.

Your ONLY job is to extract key phrases or terms from the provided text that are directly stated and important to understanding the subject. Do NOT summarize, interpret, or rewrite any part of the text.

Rules:
- Only extract **phrases exactly as they appear**
- No summaries, no explanations, no rewording
- Output a plain comma-separated list of **5 to 15 keywords or key phrases**
- Do not add numbers, headings, or Markdown
- Extracted phrases should be **copy-pasted** from the input

Example:

Input:
"The Helsinki Bus Station Theory is about sticking with your creative path, even when facing comparisons to others. It's not about just doing more work, but about re-working and revising your ideas. Staying on the same 'bus' allows you to improve and develop a unique vision. Re-work is more important than just accumulating hours of practice. Mastery comes from consistently revisiting and refining your work. The key is to commit to the hard work of revision and choose a path to improve."

Output:
Helsinki Bus Station Theory, sticking with your creative path, facing comparisons to others, re-working and revising your ideas, staying on the same "bus", develop a unique vision, accumulating hours of practice, revisiting and refining your work, commit to the hard work of revision`,
      type: 'tldr',
      format: 'plain-text',
      length: 'shorts'
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


