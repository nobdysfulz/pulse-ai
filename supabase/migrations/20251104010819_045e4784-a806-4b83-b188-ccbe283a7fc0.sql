-- Add palette_id column to brand_color_palettes
ALTER TABLE brand_color_palettes 
ADD COLUMN IF NOT EXISTS palette_id TEXT;

-- Add comment explaining accent_color limitation
COMMENT ON COLUMN brand_color_palettes.accent_color IS 
'Primary accent color from CSV accentColorHex1. Note: CSV exports include accentColorHex2 but only one accent_color is stored.';

-- No other schema changes needed as tables already have correct structure
-- agent_voices will store previewAudioUrl and isActive in voice_settings jsonb
-- call_logs will store full data in metadata jsonb
-- Other tables match CSV structure or can be handled via column mapping