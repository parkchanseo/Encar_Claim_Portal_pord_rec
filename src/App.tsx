import React, { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import { LogOut } from "lucide-react";

import ClaimRegistration from "./components/claim/ClaimRegistration";
import ClaimViewer from "./components/claim/ClaimViewer";
import ClaimDashboard from "./components/claim/ClaimDashboard";
import Login from "./components/claim/Login";

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "registration" | "viewer"
  >("registration");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (!session) {
    return <Login onLoginSuccess={() => console.log("로그인 성공!")} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <ClaimDashboard />;
      case "registration":
        return <ClaimRegistration />;
      case "viewer":
        return <ClaimViewer />;
      default:
        return <div>화면을 찾을 수 없습니다.</div>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white shadow-sm border-b px-8 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-sm shadow-md">
            EN
          </div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">
            엔카 클레임 포털
          </h1>
        </div>

        <div className="flex items-center gap-6">
          <nav className="flex gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-5 py-2.5 rounded-lg transition-all font-bold text-sm ${
                activeTab === "dashboard"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
              }`}
            >
              대시보드
            </button>
            <button
              onClick={() => setActiveTab("registration")}
              className={`px-5 py-2.5 rounded-lg transition-all font-bold text-sm ${
                activeTab === "registration"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
              }`}
            >
              클레임 등록
            </button>
            <button
              onClick={() => setActiveTab("viewer")}
              className={`px-5 py-2.5 rounded-lg transition-all font-bold text-sm ${
                activeTab === "viewer"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
              }`}
            >
              진행 현황
            </button>
          </nav>

          {/* 로그아웃 버튼 */}
          <button
            onClick={handleLogout}
            className="text-slate-400 hover:text-red-500 transition-colors"
            title="로그아웃"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 md:p-8 w-full max-w-[1600px] mx-auto animate-in fade-in duration-300">
        {renderContent()}
      </main>
    </div>
  );
}
