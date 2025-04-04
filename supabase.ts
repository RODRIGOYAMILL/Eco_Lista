import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sjhsmwcucfufiwtiflyj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqaHNtd2N1Y2Z1Zml3dGlmbHlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxNDE2NzYsImV4cCI6MjA1ODcxNzY3Nn0.Sxi6pW00BMEXv33BpL7lQIB05H11_OO12WTFQ7CO-SA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);