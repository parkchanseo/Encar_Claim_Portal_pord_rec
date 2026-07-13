// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

// 1. .env 금고에서 환경변수를 몰래 꺼내옵니다.
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || "";
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY || "";

// 2. 만약 값을 못 가져왔을 때를 대비한 안전장치
if (!supabaseUrl || !supabaseKey) {
  console.error(
    "🚨 Supabase 환경변수가 설정되지 않았습니다. .env 파일을 확인하세요."
  );
}

// 3. 꺼내온 변수로 클라이언트를 생성합니다. (코드상에는 비밀번호가 전혀 안 보임!)
export const supabase = createClient(supabaseUrl, supabaseKey);
