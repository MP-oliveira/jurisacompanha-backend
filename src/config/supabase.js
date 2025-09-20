// Supabase Configuration for Backend
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://hdjqsxwkmsyhiczmhwca.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || 'KnXVkUqhPImQJcA2AQu9o3wIpfBQHisIgXxRe9qfUJlf09TZk/1aBzmLpIO+ouCX6MsdBBsj6VkHns52NSkFNw==';

export const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
