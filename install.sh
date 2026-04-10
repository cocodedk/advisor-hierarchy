#!/usr/bin/env bash
set -e

SKILL_SRC="$(cd "$(dirname "$0")/skills/advisor-hierarchy" && pwd)"
SKILL_DST="$HOME/.claude/skills/advisor-hierarchy"
CMD_SRC="$HOME/.claude/commands/ah.md"

if [ -e "$SKILL_DST" ]; then
  echo "Already installed at $SKILL_DST"
  echo "To reinstall: rm -rf $SKILL_DST && bash install.sh"
  exit 0
fi

# Copy files directly (Claude Code skill scanner does not follow symlinks)
cp -r "$SKILL_SRC" "$SKILL_DST"
echo "Skill installed: $SKILL_DST"

# Install /ah command
mkdir -p "$(dirname "$CMD_SRC")"
cat > "$CMD_SRC" << 'EOF'
Invoke the `advisor-hierarchy` skill to run a 3-tier agent hierarchy on the following task:

$ARGUMENTS
EOF
echo "Command installed: $CMD_SRC"
echo ""
echo "Usage: /ah \"your task here\""
