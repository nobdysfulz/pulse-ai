#!/bin/bash

# Batch 1 Rollback Script
# Usage: ./rollback-batch-1.sh YOUR_OLD_PROJECT_REF

set -e

OLD_PROJECT_REF=$1

if [ -z "$OLD_PROJECT_REF" ]; then
  echo "❌ Error: OLD_PROJECT_REF is required"
  echo "Usage: ./rollback-batch-1.sh YOUR_OLD_PROJECT_REF"
  exit 1
fi

echo "⚠️  WARNING: This will rollback Batch 1 functions to your old Supabase project"
echo "Old project: $OLD_PROJECT_REF"
echo ""
read -p "Are you sure you want to proceed? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "Rollback cancelled"
  exit 0
fi

echo ""
echo "🔄 Starting Batch 1 Rollback..."
echo ""

# Function list
FUNCTIONS=(
  "getUserContext"
  "clerkSyncProfile"
  "manageGoal"
  "buildGraphContext"
  "copilotChat"
  "executive_assistantChat"
  "content_agentChat"
  "transaction_coordinatorChat"
  "manageCredits"
  "getSystemErrors"
  "getUserAutopilotActivity"
  "getAdminUsers"
)

# Check if backup exists
BACKUP_DIR=~/pulse-ai-backups/supabase-functions-$(date +%Y%m%d)
if [ ! -d "$BACKUP_DIR" ]; then
  echo "❌ Error: Backup directory not found at $BACKUP_DIR"
  echo "Cannot rollback without backup"
  exit 1
fi

TOTAL=${#FUNCTIONS[@]}
CURRENT=0
FAILED=()

for FUNC in "${FUNCTIONS[@]}"; do
  CURRENT=$((CURRENT + 1))
  echo "[$CURRENT/$TOTAL] Restoring $FUNC from backup..."
  
  # Copy old function back
  if [ -d "$BACKUP_DIR/$FUNC" ]; then
    cp -r "$BACKUP_DIR/$FUNC" supabase/functions/
    
    # Deploy to old project
    if supabase functions deploy "$FUNC" --project-ref "$OLD_PROJECT_REF"; then
      echo "✅ $FUNC rolled back successfully"
    else
      echo "❌ $FUNC rollback failed"
      FAILED+=("$FUNC")
    fi
  else
    echo "⚠️  $FUNC backup not found, skipping..."
  fi
  echo ""
done

echo "================================"
echo "📊 Batch 1 Rollback Summary"
echo "================================"
echo "Total functions: $TOTAL"
echo "Successful: $((TOTAL - ${#FAILED[@]}))"
echo "Failed: ${#FAILED[@]}"

if [ ${#FAILED[@]} -gt 0 ]; then
  echo ""
  echo "❌ Failed rollbacks:"
  for FUNC in "${FAILED[@]}"; do
    echo "  - $FUNC"
  done
  exit 1
else
  echo ""
  echo "✅ All Batch 1 functions rolled back successfully!"
  echo ""
  echo "Next steps:"
  echo "1. Update environment variables back to old project"
  echo "2. Verify functionality in your app"
  echo "3. Investigate what went wrong with the migration"
fi
