import fs from 'fs';
import path from 'path';

const historyPath = path.join(process.cwd(), 'migrated_prompt_history', 'prompt_2026-01-23T15:04:51.783Z.json');
const historyData = JSON.parse(fs.readFileSync(historyPath, 'utf8'));

const fileContents: Record<string, string> = {};

historyData.forEach((turn: any) => {
  if (turn.payload && turn.payload.type === 'generationTable' && turn.payload.entries) {
    turn.payload.entries.forEach((entry: any) => {
      if (entry.diffs && entry.diffs.length > 0) {
        const fullReplacement = entry.diffs.find((d: any) => d.target === "");
        if (fullReplacement) {
          fileContents[entry.path] = fullReplacement.replacement;
        }
      }
    });
  }
});

for (const [filePath, content] of Object.entries(fileContents)) {
  const fullPath = path.join(process.cwd(), filePath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(fullPath, content.trim() + '\n');
  console.log(`Restored: ${filePath}`);
}
