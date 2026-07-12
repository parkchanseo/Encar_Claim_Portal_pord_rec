import React, { useState } from "react";
import { AlertTriangle, Loader2, UserPlus, LogIn } from "lucide-react";
import { supabase } from "../../lib/supabase";

interface LoginProps {
  onLoginSuccess: () => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [name, setName] = useState("");
  const [team, setTeam] = useState("거래서비스지원팀"); // 기본값

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!id || !pw) {
      setError("아이디와 비밀번호를 입력해주세요.");
      return;
    }

    setIsLoading(true);
    setError("");

    // Supabase는 이메일 형식을 요구하므로 사내 아이디에 가상 도메인 자동 합성
    const email = `${id}@encar.com`;

    try {
      if (isSignUp) {
        if (!name) throw new Error("이름을 입력해주세요.");

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password: pw,
          options: {
            data: { name, team }, // 💡 메타데이터에 이름과 소속 영구 저장
          },
        });
        if (signUpError) throw signUpError;
        alert("계정 생성이 완료되었습니다. 로그인해 주세요!");
        setIsSignUp(false);
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password: pw,
        });
        if (signInError)
          throw new Error("아이디 또는 비밀번호가 일치하지 않습니다.");
        onLoginSuccess();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10 space-y-8 border border-slate-200">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg mx-auto mb-2">
            EN
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            엔카 클레임 포털
          </h2>
          <p className="text-slate-500 text-sm font-medium">
            {isSignUp
              ? "사내 계정을 생성해 주십시오"
              : "클레임 처리의 시작, 정확한 접수부터"}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-bold flex items-center gap-2">
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        <div className="space-y-4 animate-in fade-in duration-300">
          <input
            type="text"
            placeholder="사번 또는 아이디"
            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
            value={id}
            onChange={(e) => {
              setId(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
          <input
            type="password"
            placeholder="비밀번호"
            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
            value={pw}
            onChange={(e) => {
              setPw(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />

          {/* 회원가입 시에만 나타나는 메타데이터 입력란 */}
          {isSignUp && (
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <select
                value={team}
                onChange={(e) => setTeam(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
              >
                <option value="거래서비스지원팀">거래서비스지원팀</option>
                <option value="진단광고제작팀">진단광고제작팀</option>
              </select>
              <input
                type="text"
                placeholder="이름 (예: 홍길동)"
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full py-4 mt-2 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/30 flex justify-center items-center gap-2 transition-all"
          >
            {isLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : isSignUp ? (
              "계정 생성하기"
            ) : (
              "포털 접속하기"
            )}
          </button>
        </div>

        <div className="text-center pt-4 border-t border-slate-100">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError("");
            }}
            className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-1 mx-auto"
          >
            {isSignUp ? (
              <>
                <LogIn size={16} /> 기존 계정으로 로그인
              </>
            ) : (
              <>
                <UserPlus size={16} /> 처음 오셨나요? 사내 계정 생성
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
