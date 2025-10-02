import { onContentChange, onConfigChange } from './core/summary.js';
import { setupMCQButton } from './core/mcq.js';
import { setupFollowUp } from './core/followup.js';
import { setupExportButtons } from './core/export.js';

document.addEventListener('DOMContentLoaded', async () => {
  setupMCQButton();
  setupFollowUp();
  setupExportButtons();

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
