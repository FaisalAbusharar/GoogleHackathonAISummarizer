import { onContentChange, onConfigChange } from './core/summary.js';
import { setupMCQButton } from './core/mcq.js';
import { setupHighlightButton } from './core/highlight.js';
import { setupFollowUp } from './core/followup.js';
import { setupExportButtons } from './core/export.js';
import { setButtonMode } from './utils/theme.js';
import { setupFlashcardButton } from './core/flashcard.js';
import { setupCompareButton } from './core/compare.js';

const themeLink = document.getElementById('theme-style');

document.addEventListener('DOMContentLoaded', async () => {
  setupMCQButton();
  setupFollowUp();
  setupExportButtons();
  setupHighlightButton();
  setupFlashcardButton();
  setupCompareButton();
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.url.startsWith("chrome-extension://")) {
      chrome.tabs.reload(tab.id, {}, () => {
        console.log("Tab reloaded to enable content extraction on extension load");
      });
    }
  } catch (err) {
    console.warn("Failed to refresh tab on load:", err);
  }


  chrome.storage.local.get('darkMode', ({ darkMode }) => {
    themeLink.setAttribute('href', darkMode ? 'dark.css' : 'light.css');
    setButtonMode(darkMode)
  });



  chrome.storage.session.get('pageContent', ({ pageContent }) => {
    onContentChange(pageContent);

  });

  chrome.storage.session.onChanged.addListener((changes) => {
    const pageContent = changes['pageContent'];
    onContentChange(pageContent.newValue);

  });

  ['#type', '#format', '#length'].forEach(id =>
    document.querySelector(id).addEventListener('change', onConfigChange)
    
  );

});
