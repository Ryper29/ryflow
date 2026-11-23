'use strict';

const ALLOWED_MEDIA_COMMANDS = new Set(['playpause', 'next', 'prev']);
const SEEK_PATTERN = /^seek:(?:0|[1-9]\d*)(?:\.\d+)?$/;

function validateMediaCommand(command) {
  if (typeof command !== 'string') return false;
  const trimmed = command.trim();
  if (ALLOWED_MEDIA_COMMANDS.has(trimmed)) return true;
  return SEEK_PATTERN.test(trimmed);
}

function sanitizeMediaCommand(command) {
  if (typeof command !== 'string') return '';
  return command.trim();
}

function validateMouseOptions(options) {
  if (!options || typeof options !== 'object') return undefined;
  if (options.forward === true) return { forward: true };
  return undefined;
}

function validateApiKeyInput(key) {
  if (typeof key !== 'string') return false;
  if (key.length > 4096) return false;
  if (/[\r\n]/.test(key)) return false;
  return true;
}

module.exports = {
  ALLOWED_MEDIA_COMMANDS,
  SEEK_PATTERN,
  validateMediaCommand,
  sanitizeMediaCommand,
  validateMouseOptions,
  validateApiKeyInput,
};
