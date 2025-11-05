# Developer Guide: Backend Architecture

This guide explains how to work with the PULSE AI backend architecture, which uses Supabase Edge Functions for all database operations.

---

## Architecture Overview

### Core Principle: Backend-First Approach

**All database operations go through Edge Functions.** Direct Supabase client queries from the frontend are deprecated and should not be used.

```
Frontend Components → entities.js → Edge Functions → Supabase (Service Role)
```

**Benefits:**
- ✅ Bypasses RLS policy conflicts
- ✅ Resolves UUID/TEXT type mismatches
- ✅ Centralized authentication via Clerk JWT
- ✅ Atomic operations with proper error handling
- ✅ Audit trail and logging capabilities

---

## Working with Entities

### Using Existing Entities

All 38 entities are available in `src/api/entities.js`:

```javascript
import { Goal, Task, User, UserCredit } from '@/api/entities';

// List all goals for current user
const goals = await Goal.list();

// Filter goals by criteria
const activeGoals = await Goal.filter({ status: 'active' });

// Get a specific goal
const goal = await Goal.get(goalId);

// Create a new goal
const newGoal = await Goal.create({
  title: 'Annual Sales Goal',
  target_value: 1000000,
  current_value: 0,
  unit: 'USD',
  status: 'active'
});

// Update a goal
await Goal.update(goalId, { current_value: 500000 });

// Delete a goal
await Goal.delete(goalId);
```

### Available Entities

All entities support the same basic methods:
- `list(order, limit, offset)` - List all records
- `filter(filters, order, limit, offset)` - Filter records
- `get(id)` - Get single record by ID
- `create(data)` - Create new record
- `update(id, data)` - Update existing record
- `delete(id)` - Delete record

**Full entity list:**
- **User Management:** User, UserRole, UserOnboarding, UserPreference, UserCredit, UserAgentSubscription
- **Goals & Planning:** Goal, BusinessPlan, Milestone
- **Tasks & Actions:** Task (Action)
- **Market & Intelligence:** UserMarketConfig, MarketIntelligence, GraphContextCache
- **Content:** GeneratedContent, ContentTopic, ContentPack, FeaturedContentPack, ContentPreference
- **AI Agents:** AgentProfile, AgentVoice, AgentConfig, Disclosure
- **Integrations:** CrmConnection, ExternalServiceConnection, OAuthState
- **Communication:** Conversation, ConversationMessage, CallLog, Campaign, CampaignContact
- **Role Play:** RolePlayScenario, RolePlaySession, ObjectionHandlingScript
- **Configuration:** TaskTemplate, BrandColorPalette, AiPromptConfig, ClientPersona
- **Referrals:** ReferralTracking, ReferralReward
- **Transactions:** Transaction, TransactionMilestone, TransactionParty

---

## Specialized Operations

For operations beyond basic CRUD, use specialized operation objects:

### TaskOperations

```javascript
import { TaskOperations } from '@/api/entities';

// Update task status
await TaskOperations.updateStatus(taskId, 'completed');

// Create a new task
await TaskOperations.create({
  title: 'Follow up with lead',
  description: 'Call John about property showing',
  category: 'follow_up',
  priority: 'high',
  dueDate: '2025-01-10'
});
```

### CreditOperations

```javascript
import { CreditOperations } from '@/api/entities';

// Check credit balance
const balance = await CreditOperations.getBalance();

// Deduct credits
await CreditOperations.deduct(5, 'Generated social media content');

// Add credits (admin only)
await CreditOperations.add(100, 'Promotional credit');
```

### GoalOperations

```javascript
import { GoalOperations } from '@/api/entities';

// Update goal progress with calculation
await GoalOperations.updateProgress(goalId, {
  currentValue: 750000,
  targetValue: 1000000
});
```

### ConnectionOperations

```javascript
import { ConnectionOperations } from '@/api/entities';

// Fetch all user connections
const connections = await ConnectionOperations.fetchUserConnections();
// Returns: { crmConnections: [...], externalConnections: [...] }
```

---

## Creating New Edge Functions

### 1. Create the Edge Function File

Create a new file in `supabase/functions/yourFunctionName/index.ts`:

```typescript
import 'https://deno.land/x/xhr@0.1.0/mod.ts';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Validate authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract user ID from Clerk JWT
    const token = authHeader.substring(7);
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }
    const payload = JSON.parse(atob(parts[1]));
    const userId = payload.sub;

    console.log(`[yourFunctionName] Processing request for user:`, userId);

    // Parse request body
    const body = await req.json();
    
    // Initialize Supabase client with SERVICE_ROLE_KEY (bypasses RLS)
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Your business logic here
    const { data, error } = await supabase
      .from('your_table')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, data }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('[yourFunctionName] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
```

### 2. Add to entities.js

Add a new specialized operations object or extend an existing entity:

```javascript
// In src/api/entities.js

export const YourOperations = {
  async customOperation(param1, param2) {
    const token = await getClerkToken();
    const { data, error } = await supabase.functions.invoke('yourFunctionName', {
      body: { param1, param2 },
      headers: { Authorization: `Bearer ${token}` }
    });

    if (error) throw error;
    return data;
  }
};
```

### 3. Use in Components

```javascript
import { YourOperations } from '@/api/entities';

const result = await YourOperations.customOperation('value1', 'value2');
```

---

## Performance Best Practices

### 1. Client-Side Caching

Use the caching utility for frequently accessed, rarely changing data:

```javascript
import { getCacheItem, setCacheItem, CACHE_KEYS } from '@/lib/cache';

// Try cache first
const cachedData = getCacheItem(CACHE_KEYS.PROMPT_CONFIGS);

if (cachedData) {
  setData(cachedData);
} else {
  const freshData = await AiPromptConfig.filter({ isActive: true });
  setCacheItem(CACHE_KEYS.PROMPT_CONFIGS, freshData, 5 * 60 * 1000); // 5 min cache
  setData(freshData);
}
```

### 2. Memory Caching

For session-only caching (faster than localStorage):

```javascript
import { getMemoryCacheItem, setMemoryCacheItem } from '@/lib/cache';

const cachedPalette = getMemoryCacheItem(`brand_palette_${userId}`);
if (cachedPalette) {
  return cachedPalette;
} else {
  const palette = await BrandColorPalette.filter({ userId });
  setMemoryCacheItem(`brand_palette_${userId}`, palette, 10 * 60 * 1000);
  return palette;
}
```

### 3. Batched Refresh Operations

Reduce redundant `refreshUserData()` calls:

```javascript
import { RefreshBatcher } from '@/utils/batchOperations';

// Create once in component
const refreshBatcher = useMemo(() => new RefreshBatcher(refreshUserData, 1000), [refreshUserData]);

// Use for non-critical updates (batches multiple calls)
await Goal.update(goalId, data);
refreshBatcher.requestRefresh(); // Waits 1 second before refreshing

// Use for critical operations (immediate)
await BusinessPlan.create(planData);
refreshBatcher.forceRefresh(); // Refreshes immediately
```

### 4. Debouncing User Input

```javascript
import { debounce } from '@/utils/batchOperations';

// Debounce search queries
const debouncedSearch = useMemo(
  () => debounce((query) => performSearch(query), 500),
  []
);

// Debounce auto-save
const debouncedSave = useMemo(
  () => debounce((data) => saveToBackend(data), 2000),
  []
);
```

---

## Error Handling Patterns

### 1. Component-Level Error Handling

```javascript
const handleSaveGoal = async (goalData) => {
  try {
    await Goal.create(goalData);
    toast.success('Goal created successfully!');
    refreshBatcher.requestRefresh();
  } catch (error) {
    console.error('Failed to create goal:', error);
    toast.error('Failed to create goal. Please try again.');
  }
};
```

### 2. Optimistic UI Updates

```javascript
const handleToggleTask = async (taskId, newStatus) => {
  // Optimistic update
  setTasks(prev => prev.map(t => 
    t.id === taskId ? { ...t, status: newStatus } : t
  ));

  try {
    await TaskOperations.updateStatus(taskId, newStatus);
    toast.success('Task updated!');
  } catch (error) {
    // Revert on error
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, status: t.status } : t
    ));
    toast.error('Failed to update task');
  }
};
```

### 3. Graceful Degradation

```javascript
const loadOptionalData = async () => {
  try {
    const data = await SomeEntity.filter({});
    setData(data);
  } catch (error) {
    console.warn('Failed to load optional data:', error);
    // Don't show error to user, just log it
    setData([]); // Use empty state
  }
};
```

---

## Testing Backend Functions

### 1. Use Supabase CLI

```bash
# Test locally
supabase functions serve yourFunctionName

# Invoke with test data
curl -X POST http://localhost:54321/functions/v1/yourFunctionName \
  -H "Authorization: Bearer YOUR_TEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

### 2. Check Logs

```javascript
// View function logs in Supabase dashboard or via CLI
console.log('[yourFunctionName] Processing:', { userId, data });
```

---

## Common Pitfalls to Avoid

### ❌ DON'T: Direct Supabase Queries from Frontend

```javascript
// ❌ BAD - Direct query, hits RLS policies
const { data } = await supabase.from('goals').select('*');
```

### ✅ DO: Use Entity Methods

```javascript
// ✅ GOOD - Goes through backend, bypasses RLS
const goals = await Goal.list();
```

### ❌ DON'T: Multiple Redundant Refreshes

```javascript
// ❌ BAD - Causes 3 separate refresh operations
await Goal.update(id1, data1);
await refreshUserData();
await Goal.update(id2, data2);
await refreshUserData();
await Goal.update(id3, data3);
await refreshUserData();
```

### ✅ DO: Batch Refreshes

```javascript
// ✅ GOOD - Batches into single refresh after 1 second
await Goal.update(id1, data1);
refreshBatcher.requestRefresh();
await Goal.update(id2, data2);
refreshBatcher.requestRefresh();
await Goal.update(id3, data3);
refreshBatcher.requestRefresh();
// Only 1 refresh happens 1 second after last call
```

### ❌ DON'T: Fetch Same Data Multiple Times

```javascript
// ❌ BAD - Fetches brand palette on every render
const palette = await BrandColorPalette.filter({ userId });
```

### ✅ DO: Cache Frequently Accessed Data

```javascript
// ✅ GOOD - Caches for 10 minutes
const cached = getMemoryCacheItem(`palette_${userId}`);
const palette = cached || await BrandColorPalette.filter({ userId });
if (!cached) setMemoryCacheItem(`palette_${userId}`, palette, 10 * 60 * 1000);
```

---

## Migration Checklist

When migrating a component to use backend functions:

- [ ] Replace all `supabase.from()` calls with entity methods
- [ ] Replace `refreshUserData()` calls with `refreshBatcher.requestRefresh()`
- [ ] Add caching for frequently accessed, rarely changing data
- [ ] Add proper error handling with user-friendly toast messages
- [ ] Test all CRUD operations work correctly
- [ ] Check browser console for any remaining direct queries
- [ ] Verify no 400/401/406 errors in network tab

---

## Questions?

If you encounter issues with the backend architecture:

1. Check `TECHNICAL-DEBT.md` for known issues
2. Review console logs for detailed error messages
3. Verify JWT token is being passed correctly
4. Check Supabase Edge Function logs
5. Ensure RLS policies are not interfering (use service role in edge functions)

**Last Updated:** 2025-01-05  
**Architecture Version:** Option A (Edge Functions with Service Role)
