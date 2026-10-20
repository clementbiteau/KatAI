// Renders a kata brief: blank lines separate blocks, and lines starting with "- " form a list.
// Everything is rendered as text by React, never as HTML.
export function KataBrief({ brief }: { brief: string }) {
  return (
    <div className="kata-brief">
      {brief.split(/\n\s*\n/).map((block, blockIndex) => {
        const lines = block.split("\n");
        const intro = lines.filter((line) => !line.startsWith("- "));
        const items = lines.filter((line) => line.startsWith("- ")).map((line) => line.slice(2));
        return (
          <div key={blockIndex}>
            {intro.map((line, lineIndex) => (
              <p key={lineIndex}>{line}</p>
            ))}
            {items.length > 0 && (
              <ul>
                {items.map((item, itemIndex) => (
                  <li key={itemIndex}>{item}</li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
