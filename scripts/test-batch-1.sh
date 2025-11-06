#!/bin/bash

# Batch 1 Testing Script for Supabase Edge Functions
# Usage: ./test-batch-1.sh https://YOUR_PROJECT_REF.supabase.co YOUR_CLERK_JWT

set -e

SUPABASE_URL=$1
CLERK_JWT=$2

if [ -z "$SUPABASE_URL" ] || [ -z "$CLERK_JWT" ]; then
  echo "❌ Error: SUPABASE_URL and CLERK_JWT are required"
  echo "Usage: ./test-batch-1.sh https://YOUR_PROJECT_REF.supabase.co YOUR_CLERK_JWT"
  exit 1
fi

echo "🧪 Starting Batch 1 Function Tests"
echo "Base URL: $SUPABASE_URL"
echo ""

PASSED=0
FAILED=0

test_function() {
  local FUNC_NAME=$1
  local PAYLOAD=$2
  
  echo "Testing $FUNC_NAME..."
  
  RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST \
    "$SUPABASE_URL/functions/v1/$FUNC_NAME" \
    -H "Authorization: Bearer $CLERK_JWT" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD")
  
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | sed '$d')
  
  if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ $FUNC_NAME passed (200 OK)"
    PASSED=$((PASSED + 1))
  else
    echo "❌ $FUNC_NAME failed (HTTP $HTTP_CODE)"
    echo "Response: $BODY"
    FAILED=$((FAILED + 1))
  fi
  echo ""
}

# Test each function
test_function "getUserContext" '{}'
test_function "clerkSyncProfile" '{}'
test_function "manageGoal" '{"operation":"create","goalData":{"title":"Test Goal","goal_type":"sales","target_value":100000,"timeframe":"annual"}}'
test_function "buildGraphContext" '{"fresh":false}'
test_function "copilotChat" '{"prompt":"Hello, what can you help me with?"}'
test_function "executive_assistantChat" '{"message":"What tasks do I have today?"}'
test_function "content_agentChat" '{"message":"Create a social media post about market trends"}'
test_function "transaction_coordinatorChat" '{"message":"What are my active transactions?"}'
test_function "manageCredits" '{"operation":"add","amount":10,"description":"Test credit addition"}'
test_function "getSystemErrors" '{"severity":"all"}'
test_function "getUserAutopilotActivity" '{"timeRange":"7d"}'
test_function "getAdminUsers" '{}'

echo "================================"
echo "📊 Batch 1 Test Summary"
echo "================================"
echo "Total tests: $((PASSED + FAILED))"
echo "Passed: $PASSED"
echo "Failed: $FAILED"
echo ""

if [ $FAILED -gt 0 ]; then
  echo "⚠️  Some tests failed. Check the output above for details."
  echo "Note: getSystemErrors and getAdminUsers will fail if you're not an admin."
  exit 1
else
  echo "✅ All tests passed!"
fi
