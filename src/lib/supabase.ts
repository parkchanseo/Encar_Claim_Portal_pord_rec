// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://rgptxelbwsawjsejofwc.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJncHR4ZWxid3Nhd2pzZWpvZndjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1MTQ4OTEsImV4cCI6MjA5NjA5MDg5MX0.6cuZGtNVQhoJak_0x-BHrNW8mHw9Eq18l0ypUt3hPcY"; // Supabase 대시보드 [Project Settings > API] 에 있습니다.

export const supabase = createClient(supabaseUrl, supabaseKey);
