import { getCurrentSummary } from './summary.js';
import { sanitizeMarkdown } from '../utils/utils.js';
import { generateWriting } from './writer.js';

export function setupFollowUp() {
  const input = document.getElementById('follow-up');
  const btn = document.getElementById('ask-follow-up');
  const output = document.getElementById('follow-up-response');

  btn.addEventListener('click', async () => {
    const question = input.value.trim();
    if (!question) return;

    const prompt = `You said ${getCurrentSummary()}. But ${question}?`;

    output.hidden = false;
    output.textContent = 'Thinking...';

    const result = await generateWriting(
      prompt,
      'A student is asking a question based on your summary. Answer clearly. Do not summarize, only answer the question',
      true
    );

    output.innerHTML = sanitizeMarkdown(result);
  });
}
