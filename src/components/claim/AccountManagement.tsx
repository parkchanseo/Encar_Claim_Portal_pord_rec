import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import {
  User,
  Shield,
  Key,
  CheckCircle2,
  AlertCircle,
  Save,
  Loader2,
  X,
} from "lucide-react";

export default function AccountManagement() {
  const [userName, setUserName] = useState("");
  const [userTeam, setUserTeam] = useState("");
  const [userId, setUserId] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (
    message: string,
    type: "success" | "error" = "success"
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // 💡 컴포넌트가 열리면 현재 로그인한 직원의 정보를 불러옵니다.
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserName(user.user_metadata?.name || "알 수 없음");
        setUserTeam(user.user_metadata?.team || "소속 미상");
        // 가상 이메일(id@encar.com)에서 앞의 ID만 추출
        setUserId(user.email?.split("@")[0] || "");
      }
    };
    fetchUser();
  }, []);

  // 💡 다이렉트 비밀번호 변경 로직
  const handlePasswordChange = async () => {
    if (!newPassword || !confirmPassword) {
      return showToast("새 비밀번호를 모두 입력해주세요.", "error");
    }
    if (newPassword.length < 6) {
      return showToast("비밀번호는 최소 6자리 이상이어야 합니다.", "error");
    }
    if (newPassword !== confirmPassword) {
      return showToast("새 비밀번호가 서로 일치하지 않습니다.", "error");
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      showToast("비밀번호가 성공적으로 변경되었습니다!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      showToast(
        error.message || "비밀번호 변경 중 오류가 발생했습니다.",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    "w-full h-12 px-5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none";
  const labelClass = "block text-[13px] font-black text-slate-700 mb-2";

  return (
    <div className="relative animate-in fade-in duration-500 pb-20 max-w-4xl mx-auto">
      {/* 토스트 알림창 */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 fade-in duration-300">
          <div
            className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-xl border ${
              toast.type === "success"
                ? "bg-white border-emerald-100"
                : "bg-white border-red-100"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="text-emerald-500" size={20} />
            ) : (
              <AlertCircle className="text-red-500" size={20} />
            )}
            <span
              className={`text-sm font-bold ${
                toast.type === "success" ? "text-emerald-800" : "text-red-800"
              }`}
            >
              {toast.message}
            </span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 text-slate-400 hover:text-slate-600"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* 헤더 영역 */}
      <div className="mb-8">
        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <User size={28} className="text-blue-600" /> 내 정보 관리
        </h2>
        <p className="text-xs font-bold text-slate-500 mt-2 ml-9">
          계정 보안 및 비밀번호 설정
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* 좌측: 현재 내 정보 프로필 카드 */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="w-1.5 h-5 bg-blue-600 rounded-full"></div>
              <h3 className="text-base font-black text-slate-800">
                기본 프로필
              </h3>
            </div>

            <div className="flex flex-col items-center justify-center py-4">
              <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-md">
                <Shield size={32} />
              </div>
              <div className="text-center space-y-1">
                <div className="inline-block px-3 py-1 bg-slate-100 text-slate-600 text-[11px] font-black rounded-full mb-1">
                  {userTeam}
                </div>
                <h4 className="text-xl font-black text-slate-800">
                  {userName} 매니저
                </h4>
                <p className="text-sm font-bold text-slate-400">
                  사번(ID): {userId}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 우측: 비밀번호 변경 폼 */}
        <div className="md:col-span-7 space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="w-1.5 h-5 bg-purple-500 rounded-full"></div>
              <h3 className="text-base font-black text-slate-800">
                비밀번호 변경
              </h3>
            </div>

            <div className="space-y-6">
              <div>
                <label className={labelClass}>새 비밀번호</label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="최소 6자리 이상 입력"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={inputClass}
                  />
                  <Key
                    size={16}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>새 비밀번호 확인</label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="비밀번호 재입력"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={inputClass}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handlePasswordChange()
                    }
                  />
                  <CheckCircle2
                    size={16}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${
                      confirmPassword && newPassword === confirmPassword
                        ? "text-emerald-500"
                        : "text-slate-400"
                    }`}
                  />
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-[11px] font-bold text-red-500 mt-2 ml-1 flex items-center gap-1">
                    <AlertCircle size={12} /> 비밀번호가 일치하지 않습니다.
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={handlePasswordChange}
                  disabled={
                    isLoading ||
                    !newPassword ||
                    !confirmPassword ||
                    newPassword !== confirmPassword
                  }
                  className={`w-full py-4 rounded-xl text-sm font-black shadow-md transition-all flex justify-center items-center gap-2 ${
                    isLoading ||
                    !newPassword ||
                    !confirmPassword ||
                    newPassword !== confirmPassword
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                      : "bg-slate-800 text-white hover:bg-slate-900 hover:-translate-y-0.5"
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> 처리 중...
                    </>
                  ) : (
                    <>
                      <Save size={18} /> 비밀번호 안전하게 변경하기
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
