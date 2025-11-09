-- Drop the existing business_plans table and recreate with correct schema
DROP TABLE IF EXISTS public.business_plans CASCADE;

CREATE TABLE public.business_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM now()),
  net_income_goal DECIMAL(12,2) DEFAULT 0,
  tax_rate DECIMAL(5,4) DEFAULT 0,
  commission_rate DECIMAL(5,4) DEFAULT 0,
  avg_sale_price DECIMAL(12,2) DEFAULT 0,
  buyer_seller_split DECIMAL(5,4) DEFAULT 0.5,
  income_split DECIMAL(5,4) DEFAULT 0.5,
  brokerage_split_buyers DECIMAL(5,4) DEFAULT 0,
  brokerage_split_sellers DECIMAL(5,4) DEFAULT 0,
  team_split_buyers DECIMAL(5,4) DEFAULT 0,
  team_split_sellers DECIMAL(5,4) DEFAULT 0,
  brokerage_cap DECIMAL(12,2) DEFAULT 0,
  gci_required DECIMAL(12,2) DEFAULT 0,
  total_deals_needed INTEGER DEFAULT 0,
  buyer_deals INTEGER DEFAULT 0,
  listing_deals INTEGER DEFAULT 0,
  total_volume DECIMAL(15,2) DEFAULT 0,
  total_conversations INTEGER DEFAULT 0,
  total_appointments INTEGER DEFAULT 0,
  total_agreements INTEGER DEFAULT 0,
  total_contracts INTEGER DEFAULT 0,
  detailed_plan JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, plan_year)
);

-- Enable RLS
ALTER TABLE public.business_plans ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Users can manage their own business plans"
  ON public.business_plans
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_business_plans_updated_at
  BEFORE UPDATE ON public.business_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index on user_id and plan_year for faster lookups
CREATE INDEX idx_business_plans_user_year ON public.business_plans(user_id, plan_year);