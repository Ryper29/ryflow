export const ALLOWED_MEDIA_COMMANDS = new Set(['playpause', 'next', 'prev']);
export const SEEK_PATTERN = /^seek:(?:0|[1-9]\d*)(?:\.\d+)?$/;

export function validateMediaCommand(command) {
  if (typeof command !== 'string') return false;
  const trimmed = command.trim();
  if (ALLOWED_MEDIA_COMMANDS.has(trimmed)) return true;
  return SEEK_PATTERN.test(trimmed);
}

export function sanitizeMediaCommand(command) {
  if (typeof command !== 'string') return '';
  return command.trim();
}

export function validateMouseOptions(options) {
  if (!options || typeof options !== 'object') return undefined;
  if (options.forward === true) return { forward: true };
  return undefined;
}

export function validateApiKeyInput(key) {
  if (typeof key !== 'string') return false;
  if (key.length > 4096) return false;
  if (/[\r\n]/.test(key)) return false;
  return true;
}