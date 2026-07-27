/**
 * Extracts the notes for a given version from a Keep-a-Changelog-style
 * CHANGELOG.md. Returns undefined when the version has no section — the
 * release notice then falls back to the git commit message, so forgetting
 * to write a changelog entry can never break or mislabel a deploy
 * (a recurring failure in the reference bot, where the changelog file was
 * the version source of truth).
 */
export function extractVersionNotes(changelog: string, version: string): string | undefined {
  const lines = changelog.split('\n');
  const headerPattern = new RegExp(`^##\\s*\\[?${version.replaceAll('.', '\\.')}\\]?`);
  const start = lines.findIndex((line) => headerPattern.test(line));
  if (start === -1) return undefined;
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => /^##\s/.test(line));
  const body = (end === -1 ? rest : rest.slice(0, end)).join('\n').trim();
  return body || undefined;
}
