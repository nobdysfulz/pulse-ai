#!/bin/bash

# Batch 1 Deployment Script for Supabase Edge Functions
# Usage: ./deploy-batch-1.sh YOUR_PROJECT_REF

set -e

PROJECT_REF=$1

if [ -z "$PROJECT_REF" ]; then
  echo "❌ Error: PROJECT_REF is required"
  echo "Usage: ./deploy-batch-1.sh YOUR_PROJECT_REF"
  exit 1
fi

echo "🚀 Starting Batch 1 Deployment to project: $PROJECT_REF"
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

TOTAL=${#FUNCTIONS[@]}
CURRENT=0
FAILED=()

for FUNC in "${FUNCTIONS[@]}"; do
  CURRENT=$((CURRENT + 1))
  echo "[$CURRENT/$TOTAL] Deploying $FUNC..."
  
  if supabase functions deploy "$FUNC" --project-ref "$PROJECT_REF"; then
    echo "✅ $FUNC deployed successfully"
  else
    echo "❌ $FUNC deployment failed"
    FAILED+=("$FUNC")
  fi
  echo ""
done

echo "================================"
echo "📊 Batch 1 Deployment Summary"
echo "================================"
echo "Total functions: $TOTAL"
echo "Successful: $((TOTAL - ${#FAILED[@]}))"
echo "Failed: ${#FAILED[@]}"

if [ ${#FAILED[@]} -gt 0 ]; then
  echo ""
  echo "❌ Failed functions:"
  for FUNC in "${FAILED[@]}"; do
    echo "  - $FUNC"
  done
  exit 1
else
  echo ""
  echo "✅ All Batch 1 functions deployed successfully!"
  echo ""
  echo "Next steps:"
  echo "1. Run test-batch-1.sh to verify deployment"
  echo "2. Update environment variables in your app"
  echo "3. Monitor logs for any issues"
fi
