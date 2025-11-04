-- Create ai_tool_usage table to track tool execution
CREATE TABLE IF NOT EXISTS public.ai_tool_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  agent_type TEXT,
  tool_name TEXT NOT NULL,
  tool_args JSONB DEFAULT '{}'::jsonb,
  tool_result JSONB,
  execution_time_ms INTEGER,
  success BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_ai_tool_usage_user_id ON public.ai_tool_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_tool_usage_created_at ON public.ai_tool_usage(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_tool_usage_tool_name ON public.ai_tool_usage(tool_name);

-- Enable RLS
ALTER TABLE public.ai_tool_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own tool usage
CREATE POLICY "Users can view their own tool usage"
  ON public.ai_tool_usage
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert tool usage logs
CREATE POLICY "Service role can insert tool usage logs"
  ON public.ai_tool_usage
  FOR INSERT
  WITH CHECK (true);