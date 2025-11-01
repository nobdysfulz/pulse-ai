/**
 * Validation schemas for database operations
 * Uses Zod for runtime type safety and input validation
 */

import { z } from 'zod';

// User Guidelines validation
export const guidelineSchema = z.object({
  guideline_text: z.string()
    .trim()
    .min(1, 'Guideline text is required')
    .max(5000, 'Guideline text must be less than 5000 characters'),
  guideline_category: z.string()
    .min(1, 'Category is required')
    .max(100, 'Category must be less than 100 characters'),
  guideline_type: z.string()
    .min(1, 'Type is required')
    .max(100, 'Type must be less than 100 characters'),
  agent_type: z.string()
    .min(1, 'Agent type is required')
    .max(100, 'Agent type must be less than 100 characters'),
  user_id: z.string().uuid('Invalid user ID'),
});

// Profile validation
export const profileSchema = z.object({
  full_name: z.string()
    .trim()
    .max(200, 'Name must be less than 200 characters')
    .optional(),
  email: z.string()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters')
    .optional(),
  phone: z.string()
    .regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone number')
    .max(20, 'Phone number must be less than 20 characters')
    .optional(),
  license_number: z.string()
    .max(100, 'License number must be less than 100 characters')
    .optional(),
  brokerage_name: z.string()
    .max(200, 'Brokerage name must be less than 200 characters')
    .optional(),
  specialization: z.string()
    .max(200, 'Specialization must be less than 200 characters')
    .optional(),
  years_experience: z.number()
    .int('Years of experience must be a whole number')
    .min(0, 'Years of experience cannot be negative')
    .max(100, 'Years of experience must be less than 100')
    .optional(),
});

// Goals validation
export const goalSchema = z.object({
  title: z.string()
    .trim()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  goal_type: z.string()
    .min(1, 'Goal type is required')
    .max(100, 'Goal type must be less than 100 characters'),
  target_value: z.number()
    .min(0, 'Target value cannot be negative'),
  current_value: z.number()
    .min(0, 'Current value cannot be negative')
    .optional(),
  unit: z.string()
    .max(50, 'Unit must be less than 50 characters')
    .optional(),
  deadline: z.string().optional(), // Date string
  timeframe: z.string()
    .max(100, 'Timeframe must be less than 100 characters')
    .optional(),
  status: z.enum(['active', 'completed', 'archived'])
    .optional(),
  confidence_score: z.number()
    .int('Confidence score must be a whole number')
    .min(0, 'Confidence score cannot be negative')
    .max(100, 'Confidence score cannot exceed 100')
    .optional(),
  user_id: z.string().uuid('Invalid user ID'),
});

// Daily Actions validation
export const dailyActionSchema = z.object({
  title: z.string()
    .trim()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  category: z.string()
    .min(1, 'Category is required')
    .max(100, 'Category must be less than 100 characters'),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  due_date: z.string().min(1, 'Due date is required'), // Date string
  scheduled_time: z.string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Invalid time format')
    .optional(),
  duration_minutes: z.number()
    .int('Duration must be a whole number')
    .min(1, 'Duration must be at least 1 minute')
    .max(1440, 'Duration cannot exceed 24 hours')
    .optional(),
  priority: z.enum(['low', 'medium', 'high'])
    .optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled'])
    .optional(),
  user_id: z.string().uuid('Invalid user ID'),
});

// Business Plan validation
export const businessPlanSchema = z.object({
  annual_gci_goal: z.number()
    .min(0, 'Annual GCI goal cannot be negative')
    .max(100000000, 'Annual GCI goal exceeds maximum')
    .optional(),
  average_commission: z.number()
    .min(0, 'Average commission cannot be negative')
    .max(1000000, 'Average commission exceeds maximum')
    .optional(),
  transactions_needed: z.number()
    .int('Transactions needed must be a whole number')
    .min(0, 'Transactions needed cannot be negative')
    .max(10000, 'Transactions needed exceeds maximum')
    .optional(),
  conversion_rates: z.record(z.number().min(0).max(100))
    .optional(),
  lead_sources: z.record(z.number().min(0))
    .optional(),
  monthly_breakdown: z.record(z.number().min(0))
    .optional(),
  user_id: z.string().uuid('Invalid user ID'),
});

// Agent Config validation
export const agentConfigSchema = z.object({
  agent_type: z.string()
    .min(1, 'Agent type is required')
    .max(100, 'Agent type must be less than 100 characters'),
  enabled: z.boolean().optional(),
  response_style: z.string()
    .max(50, 'Response style must be less than 50 characters')
    .optional(),
  personality_traits: z.array(z.string().max(100))
    .max(20, 'Too many personality traits')
    .optional(),
  voice_name: z.string()
    .max(100, 'Voice name must be less than 100 characters')
    .optional(),
  voice_id: z.string()
    .max(100, 'Voice ID must be less than 100 characters')
    .optional(),
  user_id: z.string().uuid('Invalid user ID'),
});

// Market Config validation
export const marketConfigSchema = z.object({
  market_name: z.string()
    .trim()
    .min(1, 'Market name is required')
    .max(200, 'Market name must be less than 200 characters'),
  city: z.string()
    .max(100, 'City must be less than 100 characters')
    .optional(),
  state: z.string()
    .max(50, 'State must be less than 50 characters')
    .optional(),
  average_price: z.number()
    .min(0, 'Average price cannot be negative')
    .max(100000000, 'Average price exceeds maximum')
    .optional(),
  median_dom: z.number()
    .int('Median DOM must be a whole number')
    .min(0, 'Median DOM cannot be negative')
    .max(1000, 'Median DOM exceeds maximum')
    .optional(),
  inventory_level: z.string()
    .max(50, 'Inventory level must be less than 50 characters')
    .optional(),
  market_trend: z.string()
    .max(50, 'Market trend must be less than 50 characters')
    .optional(),
  user_id: z.string().uuid('Invalid user ID'),
});

// Pulse Scores validation
export const pulseScoreSchema = z.object({
  overall_score: z.number()
    .int('Overall score must be a whole number')
    .min(0, 'Overall score cannot be negative')
    .max(100, 'Overall score cannot exceed 100'),
  mindset_score: z.number()
    .int('Mindset score must be a whole number')
    .min(0, 'Mindset score cannot be negative')
    .max(100, 'Mindset score cannot exceed 100')
    .optional(),
  systems_score: z.number()
    .int('Systems score must be a whole number')
    .min(0, 'Systems score cannot be negative')
    .max(100, 'Systems score cannot exceed 100')
    .optional(),
  activities_score: z.number()
    .int('Activities score must be a whole number')
    .min(0, 'Activities score cannot be negative')
    .max(100, 'Activities score cannot exceed 100')
    .optional(),
  pipeline_score: z.number()
    .int('Pipeline score must be a whole number')
    .min(0, 'Pipeline score cannot be negative')
    .max(100, 'Pipeline score cannot exceed 100')
    .optional(),
  production_score: z.number()
    .int('Production score must be a whole number')
    .min(0, 'Production score cannot be negative')
    .max(100, 'Production score cannot exceed 100')
    .optional(),
  date: z.string().min(1, 'Date is required'), // Date string
  metrics: z.record(z.any()).optional(),
  user_id: z.string().uuid('Invalid user ID'),
});

// User Preferences validation
export const userPreferencesSchema = z.object({
  brand_primary_color: z.string()
    .regex(/^#[0-9A-F]{6}$/i, 'Invalid color format')
    .optional(),
  brand_secondary_color: z.string()
    .regex(/^#[0-9A-F]{6}$/i, 'Invalid color format')
    .optional(),
  brand_accent_color: z.string()
    .regex(/^#[0-9A-F]{6}$/i, 'Invalid color format')
    .optional(),
  communication_style: z.string()
    .max(50, 'Communication style must be less than 50 characters')
    .optional(),
  content_themes: z.array(z.string().max(100))
    .max(50, 'Too many content themes')
    .optional(),
  email_categories: z.array(z.string().max(100))
    .max(50, 'Too many email categories')
    .optional(),
  auto_response_enabled: z.boolean().optional(),
  user_id: z.string().uuid('Invalid user ID'),
});

/**
 * Helper function to validate data against a schema
 * @param {z.ZodSchema} schema - The Zod schema to validate against
 * @param {any} data - The data to validate
 * @returns {{ success: boolean, data?: any, errors?: any }} Validation result
 */
export function validateData(schema, data) {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      };
    }
    return { success: false, errors: [{ message: 'Validation failed' }] };
  }
}

/**
 * Helper function to safely validate and insert/update data
 * @param {z.ZodSchema} schema - The Zod schema to validate against  
 * @param {any} data - The data to validate
 * @throws {Error} If validation fails
 * @returns {any} Validated data
 */
export function validateOrThrow(schema, data) {
  const result = validateData(schema, data);
  if (!result.success) {
    const errorMessage = result.errors.map(e => e.message).join(', ');
    throw new Error(`Validation failed: ${errorMessage}`);
  }
  return result.data;
}
