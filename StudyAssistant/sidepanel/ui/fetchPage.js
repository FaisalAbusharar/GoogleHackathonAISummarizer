export async function fetchPageContent(url) {
  try {
    const response = await fetch(url);
    const text = await response.text();

 
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/html");

  
    const paragraphs = Array.from(doc.querySelectorAll("p")).map(p => p.innerText);
    return paragraphs.join("\n\n");
  } catch (err) {
    console.error("Failed to fetch page content:", err);
    return null;
  }
}
