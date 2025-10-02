import { sanitizeMarkdown } from '../utils/utils.js';

export function showSummary(text) {
  document.getElementById('summary').innerHTML = sanitizeMarkdown(text);
}

export function updateWarning(msg) {
  const warning = document.getElementById('warning');
  warning.textContent = msg;
  warning.hidden = !msg;
}


export function showMCQ(mcqList) {
  alert("render process.")
  const container = document.getElementById('mcq');
  container.innerHTML = ''; // Clear old MCQs

  const inner = document.createElement('div');
  inner.id = 'mcq-list';

  if (!Array.isArray(mcqList) || mcqList.length === 0) {
    inner.innerHTML = '<p>No MCQs to display.</p>';
    container.appendChild(inner);
    return;
  }
  alert("trying to render.")
  mcqList.forEach((mcq, index) => {
    alert("rendering.....")
    const card = document.createElement('div');
    card.className = 'card p-3 mb-3';

    const question = document.createElement('p');
    question.textContent = `Q${index + 1}: ${mcq.question}`;
    question.style.color = 'white';
    card.appendChild(question);

    const feedback = document.createElement('div');
    feedback.className = 'mt-2';

    mcq.choices.forEach(choice => {
      alert("rendering again help.")
      const btn = document.createElement('button');
      btn.textContent = choice;
      btn.className = 'btn btn-outline-primary m-1';
      btn.addEventListener('click', () => {
        const isCorrect = choice.startsWith(mcq.answer);
        feedback.textContent = isCorrect
          ? '✅ Correct!'
          : `❌ Incorrect. Correct answer: ${mcq.answer}`;
        feedback.style.color = isCorrect ? 'green' : 'red';
        card.querySelectorAll('button').forEach(b => b.disabled = true);
      });

      card.appendChild(btn);
      alert("append")
    });

    card.appendChild(feedback);
    inner.appendChild(card);
  });

  container.appendChild(inner);
  container.style.display = 'block';
}