#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

function getConfigDir() {
  if (process.env.CLAUDE_CONFIG_DIR) return process.env.CLAUDE_CONFIG_DIR;
  if (process.platform === 'win32') {
    return path.join(process.env.APPDATA, 'Claude');
  }
  return path.join(os.homedir(), '.claude');
}

function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function install() {
  const configDir = getConfigDir();
  const skillSrc = path.join(__dirname, '..', 'skills', 'advisor-hierarchy');
  const skillDest = path.join(configDir, 'skills', 'advisor-hierarchy');
  const cmdDest = path.join(configDir, 'commands', 'ah.md');

  copyDirSync(skillSrc, skillDest);

  fs.mkdirSync(path.dirname(cmdDest), { recursive: true });
  fs.writeFileSync(
    cmdDest,
    'Invoke the `advisor-hierarchy` skill to run a 3-tier agent hierarchy on the following task:\n\n$ARGUMENTS\n'
  );

  console.log('advisor-hierarchy installed. Run /ah in Claude Code to use it.');
}

function uninstall() {
  const configDir = getConfigDir();
  const skillDest = path.join(configDir, 'skills', 'advisor-hierarchy');
  const cmdDest = path.join(configDir, 'commands', 'ah.md');

  fs.rmSync(skillDest, { recursive: true, force: true });
  if (fs.existsSync(cmdDest)) fs.unlinkSync(cmdDest);

  console.log('advisor-hierarchy uninstalled.');
}

const command = process.argv[2];
if (command === 'uninstall') {
  uninstall();
} else {
  install();
}
