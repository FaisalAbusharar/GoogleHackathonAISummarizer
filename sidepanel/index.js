/* global Summarizer */
import DOMPurify from 'dompurify';
import { marked } from 'marked';

// The underlying model has a context of 1,024 tokens, out of which 26 are used by the internal prompt,
// leaving about 998 tokens for the input text. Each token corresponds, roughly, to about 4 characters, so 4,000
// is used as a limit to warn the user the content might be too long to summarize.
const MAX_MODEL_CHARS = 4000;

let pageContent = '';

const summaryElement = document.body.querySelector('#summary');
const warningElement = document.body.querySelector('#warning');
const summaryTypeSelect = document.querySelector('#type');
const summaryFormatSelect = document.querySelector('#format');
const summaryLengthSelect = document.querySelector('#length');
const mcqElement = document.body.querySelector('#mcq');


function onConfigChange() {
  const oldContent = pageContent;
  pageContent = '';
  onContentChange(oldContent);
}

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

async function onContentChange(newContent) {
  if (pageContent == newContent) {
    // no new content, do nothing
    return;
  }
  pageContent = newContent;
  let summary;
  let mcq;
  if (newContent) {
    if (newContent.length > MAX_MODEL_CHARS) {
      updateWarning(
        `Text is too long for summarization with ${newContent.length} characters (maximum supported content length is ~4000 characters).`
      );
    } else {
      updateWarning('');
    }
    showSummary('Loading...');
    showMCQ('Loading MCQ...')
    summary = await generateSummary(newContent);
    mcq = await generateMCQ(newContent);
  } else {
    summary = "There's nothing to summarize...";
    mcq = "No MCQs generated"
  }
  showSummary(summary);
  showMCQ(mcq);
}

async function generateSummary(text) {
  try {
    const options = {
      sharedContext: 'You are summarizing a subject\'s content for a student, make it as clear as possible.'  ,
      type: summaryTypeSelect.value,
      format: summaryFormatSelect.value,
      length: length.value
    };

    const availability = await Summarizer.availability();
    let summarizer;
    if (availability === 'unavailable') {
      return 'Summarizer API is not available';
    }
    if (availability === 'available') {
      // The Summarizer API can be used immediately .
      summarizer = await Summarizer.create(options);
    } else {
      // The Summarizer API can be used after the model is downloaded.
      summarizer = await Summarizer.create(options);
      summarizer.addEventListener('downloadprogress', (e) => {
        console.log(`Downloaded ${e.loaded * 100}%`);
      });
      await summarizer.ready;
    }
    const summary = await summarizer.summarize(text);
    summarizer.destroy();
    return summary;
  } catch (e) {
    console.log('Summary generation failed');
    console.error(e);
    return 'Error: ' + e.message;
  }
}

async function showSummary(text) {
  summaryElement.innerHTML = DOMPurify.sanitize(marked.parse(text));
}




async function generateMCQ(text) {
  try {
    const options = {
      sharedContext: 'You are summarizing a subject\'s content for a student, make it as clear as possible. Generate MCQs too, keep the answers at the end together in an answer key. Have the answers on separate lines, and be in bold.',
      type: 'tldr',
      format: summaryFormatSelect.value,
      length: summaryLengthSelect.value
    };

    const availability = await Summarizer.availability();
    let summarizer;

    if (availability === 'unavailable') return 'Summarizer API is not available';

    summarizer = await Summarizer.create(options);
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
    console.log('MCQ generation failed');
    console.error(e);
    return 'Error: ' + e.message;
  }
}

async function showMCQ(text) {
  mcqElement.innerHTML = DOMPurify.sanitize(marked.parse(text));
}


async function updateWarning(warning) {
  warningElement.textContent = warning;
  if (warning) {
    warningElement.removeAttribute('hidden');
  } else {
    warningElement.setAttribute('hidden', '');
  }
}
