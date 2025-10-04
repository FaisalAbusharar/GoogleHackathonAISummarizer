import { sanitizeMarkdown } from '../utils/utils.js';
import {isDarkMode} from '../utils/theme.js'



export function showSummary(text) {
  document.getElementById('summary').innerHTML = sanitizeMarkdown(text);
}

export function updateWarning(msg) {
  const warning = document.getElementById('warning');
  warning.textContent = msg;
  warning.hidden = !msg;
}


export async function showMCQ(mcqList) {
  const container = document.getElementById('mcq');
  container.innerHTML = ''; // Clear old MCQs

  const inner = document.createElement('div');
  inner.id = 'mcq-list';

  const darkMode = await isDarkMode();

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
    question.style.color = darkMode ? 'white' : 'black';
    card.appendChild(question);

    const feedback = document.createElement('div');
    feedback.className = 'mt-2';

    mcq.choices.forEach(choice => {
      const btn = document.createElement('button');
      btn.textContent = choice;
      btn.className = darkMode ? 'btn btn-outline-primary m-1' : 'btn btn-primary m-1';
      btn.addEventListener('click', () => {
        const isCorrect = choice.startsWith(mcq.answer);
        feedback.textContent = isCorrect
          ? '✅ Correct!'
          : `❌ Incorrect. Correct answer: ${mcq.answer}`;
        feedback.style.color = isCorrect ? 'green' : 'red';
        card.querySelectorAll('button').forEach(b => b.disabled = true);
      });

      card.appendChild(btn);
    });

    card.appendChild(feedback);
    inner.appendChild(card);
  });

  container.appendChild(inner);
  container.style.display = 'block';
}


export function highlightKeywordsInPage(keywords) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0].id;
    chrome.scripting.executeScript({
      target: { tabId },
      func: highlightKeywordsScript,
      args: [keywords]
    });
  });
}

function highlightKeywordsScript(keywords) {
  if (!Array.isArray(keywords) || keywords.length === 0) return;

  // Escape special regex characters
  const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Sort keywords by length descending to match longest phrases first
  const sortedKeywords = [...keywords].sort((a, b) => b.length - a.length);
  const regex = new RegExp(`\\b(${sortedKeywords.map(escapeRegex).join('|')})\\b`, 'gi');

  function walk(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (regex.test(node.nodeValue)) {
        const wrapper = document.createElement('span');
        wrapper.innerHTML = node.nodeValue.replace(regex, '<mark>$1</mark>');
        node.parentNode.replaceChild(wrapper, node);
      }
    } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName !== 'MARK') {
      // Avoid re-highlighting inside already highlighted <mark>
      Array.from(node.childNodes).forEach(walk);
    }
  }

  walk(document.body);
}


