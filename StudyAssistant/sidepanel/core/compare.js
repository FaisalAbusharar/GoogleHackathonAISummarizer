import { generateSummary, getCurrentSummary } from "./summary";
import { fetchPageContent } from "../ui/fetchPage";
import { sanitizeMarkdown } from "../utils/utils";

export function setupCompareButton() {
document.getElementById("compare-btn").addEventListener("click", async () => {

  const userUrl = document.getElementById("compare-url").value.trim();
  if (!userUrl) {
    alert("Please enter a URL to compare with.");
    return;
  }

  document.getElementById("compare-btn").textContent = "Comparing..";
  const compareContent = await fetchPageContent(userUrl);
  if (!compareContent) return;

  const summary1 = getCurrentSummary();
  const summary2 = await generateSummary(compareContent);

  const comparisonPrompt = `
Compare the following two summaries and highlight:
- Key differences
- Agreements
- Important points from each

Summary 1:
${summary1}

Summary 2:
${summary2}
`;


  const comparisonResult = await generateAIComparison(comparisonPrompt); 

  const resultContainer = document.getElementById("compare-result");
  resultContainer.innerHTML = sanitizeMarkdown(comparisonResult);
  document.getElementById("compare-btn").textContent = "Compare";
});
}

async function generateAIComparison(text) {
     let options = {
    sharedContext: 'comparing the two texts provided.',
    type: 'tldr',
    format: 'markdown',
    length: 'medium',
    output_language: "en"
  };

  try {
    const availability = await Writer.availability();
    if (availability === 'unavailable') throw new Error('Writer API unavailable');

    const writer = await Writer.create(options);
    await writer.ready;

    const comparsion = await writer.write(text);
    writer.destroy();

    return comparsion || "There's nothing to summarize...";
  } catch (e) {
    console.error('Summary generation failed', e);
    return 'Error: ' + e.message;
  }
}