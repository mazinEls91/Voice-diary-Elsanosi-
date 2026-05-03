import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://rarewnbhnlaiuhacjriw.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhcmV3bmJobmxhaXVoYWNqcml3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3NDg3MzgsImV4cCI6MjA5MzMyNDczOH0.g_Cj_fFZCTLldkrUdesJLjzdUU7xf3cQtllQDR6Xp6Q'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
