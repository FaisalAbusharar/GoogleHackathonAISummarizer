export async function generateWriting(
  text,
  context = "You are summarizing a subject's content for a student. Make it clear and concise.",
  forceOptions = false
) {
  if (!text) return "There's nothing to summarize...";

  let options = {
    sharedContext: context,
    instructions: "Summarize the following text clearly for a student.",
    type: 'writer',
    format: 'markdown',
    length: 'short'
  };

  if (!forceOptions) {
    const type = document.querySelector('#type')?.value || 'writer';
    const format = document.querySelector('#format')?.value || 'markdown';
    const length = document.querySelector('#length')?.value || 'short';
    options = { sharedContext: context, instructions: options.instructions, type, format, length };
  }

  try {
    const availability = await Writer.availability?.();
    if (availability === 'unavailable') throw new Error('Writer API unavailable');

    const writer = await Writer.create(options);
    await writer.ready;

    const writing = await writer.write(text);
    writer.destroy();

    return writing || "There's nothing to summarize...";
  } catch (e) {
    console.error('Writing generation failed', e);
    return 'Error: ' + e.message;
  }
}
