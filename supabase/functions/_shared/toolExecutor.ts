// Tool execution dispatcher for AI agents
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface ToolExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  suggestion?: string;
}

export async function executeTool(
  toolName: string,
  args: any,
  userId: string,
  supabaseUrl: string,
  supabaseKey: string
): Promise<ToolExecutionResult> {
  console.log(`[Tool Executor] Executing ${toolName} for user ${userId}`);
  console.log(`[Tool Executor] Args:`, JSON.stringify(args));

  const supabaseClient = createClient(supabaseUrl, supabaseKey);

  // Tool mapping to edge functions
  const toolMap: Record<string, string> = {
    // NOVA tools
    'sendGoogleEmail': 'sendGoogleEmailTool',
    'scheduleGoogleCalendarEvent': 'scheduleGoogleCalendarEventTool',
    'createGoogleDriveFolder': 'createGoogleDriveFolderTool',
    'researchAndSummarize': 'researchAndSummarizeTool',
    
    // SIRIUS tools
    'publishFacebookPost': 'publishFacebookPostTool',
    'publishInstagramPost': 'publishInstagramPostTool',
    'getFacebookPageInsights': 'getFacebookPageInsightsTool',
    'generateImage': 'generateImageTool',
    
    // VEGA tools
    'createTransaction': 'createTransactionTool',
    'getTransactions': 'getTransactionsTool',
    'updateTransaction': 'updateTransactionTool',
  };

  const functionName = toolMap[toolName];
  
  if (!functionName) {
    console.error(`[Tool Executor] Unknown tool: ${toolName}`);
    return {
      success: false,
      error: `Unknown tool: ${toolName}`,
      suggestion: 'Please check the tool name and try again.'
    };
  }

  try {
    const startTime = Date.now();
    
    const { data, error } = await supabaseClient.functions.invoke(functionName, {
      body: { ...args, userId }
    });

    const executionTime = Date.now() - startTime;

    if (error) {
      console.error(`[Tool Executor] Error calling ${functionName}:`, error);
      return {
        success: false,
        error: error.message || 'Tool execution failed',
        suggestion: getErrorSuggestion(toolName, error)
      };
    }

    // Log tool usage
    try {
      await supabaseClient.from('ai_tool_usage').insert({
        user_id: userId,
        tool_name: toolName,
        tool_args: args,
        tool_result: data,
        execution_time_ms: executionTime,
        success: true
      });
    } catch (logError) {
      console.error('[Tool Executor] Failed to log tool usage:', logError);
    }

    console.log(`[Tool Executor] ${toolName} completed in ${executionTime}ms`);
    
    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.error(`[Tool Executor] Exception executing ${toolName}:`, error);
    
    // Log failed execution
    try {
      await supabaseClient.from('ai_tool_usage').insert({
        user_id: userId,
        tool_name: toolName,
        tool_args: args,
        tool_result: null,
        execution_time_ms: 0,
        success: false,
        error_message: error instanceof Error ? error.message : 'Unknown error'
      });
    } catch (logError) {
      console.error('[Tool Executor] Failed to log tool error:', logError);
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      suggestion: getErrorSuggestion(toolName, error)
    };
  }
}

function getErrorSuggestion(toolName: string, error: any): string {
  const errorMessage = error?.message || '';
  
  // Integration not connected
  if (errorMessage.includes('not connected') || errorMessage.includes('No connection found')) {
    if (toolName.includes('Google')) {
      return 'Please connect your Google Workspace account in Settings > Integrations';
    }
    if (toolName.includes('Facebook') || toolName.includes('Instagram')) {
      return 'Please connect your Facebook/Instagram account in Settings > Integrations';
    }
    if (toolName.includes('Lofty')) {
      return 'Please connect your Lofty CRM in Settings > Integrations';
    }
    return 'Please connect the required integration in Settings > Integrations';
  }

  // OAuth token expired
  if (errorMessage.includes('token') && errorMessage.includes('expired')) {
    return 'Your authentication token has expired. Please reconnect the integration in Settings';
  }

  // Rate limit
  if (errorMessage.includes('rate limit')) {
    return 'Rate limit reached. Please wait a moment and try again.';
  }

  // Permission issues
  if (errorMessage.includes('permission') || errorMessage.includes('forbidden')) {
    return 'Permission denied. Please check your integration settings and permissions.';
  }

  return 'An error occurred. Please try again or contact support if the issue persists.';
}
