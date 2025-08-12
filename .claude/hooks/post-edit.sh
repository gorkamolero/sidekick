#!/bin/bash

# Post-edit hook that asks Claude to clean up any redundant comments added

echo "🧹 Cleaning up redundant comments..."

# Call Claude to review and clean the last edited file
claude_response=$(cat <<'EOF' | claude --no-stream
Look at the last file you just edited and remove any obvious/redundant inline comments like:
- Comments that just restate the function name
- Comments after imports that say what's being imported  
- Comments that explain obvious code
Just use sed or a simple edit to remove them. Don't explain, just do it.
EOF
)

echo "✅ Comments cleaned"