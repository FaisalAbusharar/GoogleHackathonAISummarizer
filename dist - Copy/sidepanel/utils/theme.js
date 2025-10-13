const toggleButton = document.getElementById('themeToggle');
const themeLink = document.getElementById('theme-style');

toggleButton.addEventListener('click', () => {
  if (themeLink.getAttribute('href') === 'light.css') {
    themeLink.setAttribute('href', 'dark.css');
    chrome.storage.local.set({ darkMode: true });
    setButtonMode(true);
  } else {
    themeLink.setAttribute('href', 'light.css');
    chrome.storage.local.set({ darkMode: false });
    setButtonMode(false);
  }
});

export async function isDarkMode() {
  return new Promise((resolve) => {
    chrome.storage.local.get('darkMode', ({ darkMode }) => {
      resolve(Boolean(darkMode)); // Ensure it's a boolean
    });
  });
}



export function setButtonMode(isDark) {
  const extractBtn = document.getElementById('extractBtn');
  const highlightBtn = document.getElementById('highlightBtn');
  const compareBtn = document.getElementById('compare-btn')

  if (isDark) {
    extractBtn.classList.add('btn-outline-danger');
    extractBtn.classList.remove('btn-danger');

    highlightBtn.classList.add('btn-outline-primary');
    highlightBtn.classList.remove('btn-primary');

    compareBtn.classList.add('btn-outline-warning');
    compareBtn.classList.remove('btn-warning');


    toggleButton.textContent = "Light Mode"
  } else {
    extractBtn.classList.remove('btn-outline-danger');
    extractBtn.classList.add('btn-danger');

    highlightBtn.classList.remove('btn-outline-primary');
    highlightBtn.classList.add('btn-primary');

    compareBtn.classList.add('btn-warning');
    compareBtn.classList.remove('btn-outline-warning');

    toggleButton.textContent = "Dark Mode"

  }
}