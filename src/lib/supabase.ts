import { createClient } from "@supabase/supabase-js";

// 환경변수 호출을 주석 처리하고 직접 값을 할당합니다.
const supabaseUrl = "https://rgptxelbwsawjsejofwc.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJncHR4ZWxid3Nhd2pzZWpvZndjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1MTQ4OTEsImV4cCI6MjA5NjA5MDg5MX0.6cuZGtNVQhoJak_0x-BHrNW8mHw9Eq18l0ypUt3hPcY";

export const supabase = createClient(supabaseUrl, supabaseKey);
