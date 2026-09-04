import { CommandOS } from '../types';

/**
 * Helpers for spotting shell commands in prose. Kept out of CommandText.tsx so
 * that file only exports components (fast refresh works per-module).
 */

/** Common enough that a code span starting with one is almost certainly a command. */
const KNOWN_COMMANDS = new Set([
  // POSIX / shell
  'ls', 'cd', 'pwd', 'cp', 'mv', 'rm', 'mkdir', 'rmdir', 'touch', 'cat', 'less', 'more',
  'head', 'tail', 'grep', 'egrep', 'find', 'sed', 'awk', 'sort', 'uniq', 'wc', 'diff',
  'chmod', 'chown', 'chgrp', 'ln', 'du', 'df', 'mount', 'umount', 'tar', 'zip', 'unzip',
  'gzip', 'gunzip', 'curl', 'wget', 'ssh', 'scp', 'rsync', 'ping', 'netstat', 'ss',
  'ps', 'top', 'htop', 'kill', 'killall', 'jobs', 'bg', 'fg', 'nohup', 'systemctl',
  'service', 'journalctl', 'crontab', 'sudo', 'su', 'apt', 'apt-get', 'yum', 'dnf',
  'pacman', 'brew', 'echo', 'export', 'source', 'which', 'whereis', 'man', 'history',
  'xargs', 'tee', 'ifconfig', 'ip', 'dig', 'nslookup', 'traceroute', 'lsof', 'openssl',
  // Dev tooling
  'git', 'npm', 'npx', 'pnpm', 'yarn', 'bun', 'node', 'deno', 'python', 'python3', 'pip',
  'pip3', 'docker', 'docker-compose', 'kubectl', 'helm', 'terraform', 'make', 'cmake',
  'gcc', 'g++', 'javac', 'java', 'mvn', 'gradle', 'cargo', 'rustc', 'go', 'dotnet',
  'ffmpeg', 'psql', 'mysql', 'redis-cli', 'vim', 'nano', 'code',
  // Windows / PowerShell
  'dir', 'copy', 'move', 'del', 'ren', 'cls', 'type', 'tasklist', 'taskkill', 'ipconfig',
  'netsh', 'sfc', 'chkdsk', 'diskpart', 'robocopy', 'xcopy', 'winget', 'choco', 'reg',
  'powershell', 'pwsh', 'cmd', 'wmic', 'set', 'setx',
  'get-childitem', 'set-location', 'remove-item', 'copy-item', 'move-item', 'new-item',
  'get-content', 'set-content', 'get-process', 'stop-process', 'start-process',
  'get-service', 'invoke-webrequest', 'test-path', 'select-object', 'where-object',
]);

/** A flag token: -r, -rf, --recursive, or Windows-style /s. */
const FLAG = /(^|\s)(--?[A-Za-z][\w-]*|\/[A-Za-z]{1,3})(\s|$)/;

/**
 * Deliberately conservative. Linking a keyboard shortcut or a filename to a
 * command explainer would be worse than not linking at all, so a span must
 * either start with a known command or carry a recognisable flag.
 */
export function isLikelyCommand(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 300 || trimmed.includes('\n')) return false;
  // Keyboard shortcuts (Ctrl + C, Cmd+Shift+P) are not commands.
  if (/^[\w]+\s*\+/.test(trimmed)) return false;

  const first = trimmed.split(/\s+/)[0].toLowerCase();
  if (KNOWN_COMMANDS.has(first)) return true;

  // `foo --verbose` is command-shaped even if unrecognised; a bare word is not.
  return trimmed.includes(' ') && FLAG.test(trimmed);
}

/** Maps a tutorial or chat context to the shell its commands belong to. */
export function osForTutorial(name: string): CommandOS {
  const lower = name.toLowerCase();
  if (lower.includes('windows') || lower.includes('powershell')) return 'Windows';
  if (lower.includes('mac') || lower.includes('ios')) return 'macOS';
  return 'Linux';
}
