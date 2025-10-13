export async function fetchPageContent(url) {
  try {
    if (!/^https?:\/\//.test(url)) {
      throw new Error("Invalid URL protocol.");
    }

    const response = await fetch(url, { method: 'GET' });
    const text = await response.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/html");

    const paragraphs = Array.from(doc.querySelectorAll("p, h1, h2, h3, h4, h5, h6"))
      .map(el => el.textContent.trim())
      .filter(Boolean);

    return paragraphs.join("\n\n");

  } catch (err) {
    console.error("Failed to fetch page content:", err);
    return null;
  }
}
