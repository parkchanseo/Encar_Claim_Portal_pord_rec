import React, { useState } from "react";
// 💡 드디어 3대장 컴포넌트를 호출합니다.
import ClaimRegistration from "./components/claim/ClaimRegistration";
import ClaimViewer from "./components/claim/ClaimViewer";
import ClaimDashboard from "./components/claim/ClaimDashboard";

export default function App() {
  // 상태(State)를 이용한 라우팅 (레거시 CAM 포털 호환 방식)
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "registration" | "viewer"
  >("dashboard");

  // 화면 스위칭 렌더러 함수
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
      {/* GNB (상단 네비게이션) */}
      <header className="bg-white shadow-sm border-b px-8 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-sm shadow-md">
            EN
          </div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">
            엔카 클레임 포털{" "}
            <span className="text-sm text-blue-600 font-bold ml-1">Beta</span>
          </h1>
        </div>

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
      </header>

      {/* 메인 콘텐츠 영역 */}
      <main className="flex-1 p-6 md:p-8 w-full max-w-[1600px] mx-auto animate-in fade-in duration-300">
        {renderContent()}
      </main>
    </div>
  );
}
