import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Edit,
  ClipboardCheck,
  Menu,
  ChevronRight,
  Bell,
  Settings,
  LogOut,
  ChevronDown,
  Lock,
} from "lucide-react";
import ClaimRegistration from "../components/claim/ClaimRegistration";
import ClaimViewer from "../components/claim/ClaimViewer";
import ClaimDashboard from "../components/claim/ClaimDashboard";
import { supabase } from "../lib/supabase";

export default function ClaimPortal() {
  const [activeMenu, setActiveMenu] = useState("claim-register");

  // 💡 [핵심] 모바일에서는 기본적으로 사이드바가 닫혀있도록 설정 (화면 크기 감지)
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [expandedMenu, setExpandedMenu] = useState<string | null>("claim-menu");

  const [userInfo, setUserInfo] = useState("로딩 중...");

  // 화면 크기가 바뀔 때 사이드바 자동 조절
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user && user.user_metadata) {
        const team = user.user_metadata.team || "소속 미상";
        const name = user.user_metadata.name || "알 수 없음";
        setUserInfo(`${team} ${name}`);
      }
    };
    fetchUser();
  }, []);

  const claimMenuGroups = [
    {
      id: "claim-menu",
      title: "클레임 관리 센터",
      icon: <ClipboardCheck size={18} />,
      items: [
        {
          id: "claim-dashboard",
          label: "클레임 대시보드",
          icon: <LayoutDashboard size={14} />,
        },
        {
          id: "claim-register",
          label: "새 클레임 등록",
          icon: <Edit size={14} />,
        },
        {
          id: "claim-list",
          label: "클레임 진행 현황",
          icon: <ClipboardCheck size={14} />,
        },
      ],
    },
  ];

  const getBreadcrumb = (menu: string) => {
    const map: Record<string, string> = {
      "claim-dashboard": "클레임 대시보드",
      "claim-register": "새 클레임 등록",
      "claim-list": "진행 현황",
    };
    return map[menu] || "클레임 포털";
  };

  const renderSidebar = () => (
    <>
      {/* 💡 [모바일] 배경 어둡게 처리 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden animate-in fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 💡 [핵심 수정] 모바일에서는 fixed로 띄우고, PC(md)에서는 relative로 자연스럽게 배치 */}
      <aside
        className={`transition-all duration-300 bg-slate-900 text-slate-300 flex flex-col shrink-0 h-full z-50 fixed inset-y-0 left-0 md:relative ${
          sidebarOpen
            ? "translate-x-0 w-64 shadow-2xl md:shadow-none"
            : "-translate-x-full w-64 md:translate-x-0 md:w-20"
        }`}
      >
        {/* ... (이하 사이드바 내부 코드는 기존과 동일) ... */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800 shrink-0 cursor-pointer hover:bg-slate-800/50">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shrink-0 shadow-lg">
            C
          </div>
          {sidebarOpen && (
            <span className="ml-3 font-black text-white tracking-wide truncate">
              CLAIM PORTAL
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2 custom-scrollbar">
          {claimMenuGroups.map((group) => {
            const isOpen = expandedMenu === group.id && sidebarOpen;
            const hasActiveSub = group.items.some(
              (item) => item.id === activeMenu
            );
            return (
              <div key={group.id} className="space-y-1">
                <button
                  onClick={() =>
                    sidebarOpen &&
                    setExpandedMenu(expandedMenu === group.id ? null : group.id)
                  }
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    isOpen || hasActiveSub
                      ? "bg-slate-800 text-white"
                      : "text-slate-400 hover:bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`${
                        isOpen || hasActiveSub ? "text-blue-400" : ""
                      }`}
                    >
                      {group.icon}
                    </span>
                    {sidebarOpen && <span>{group.title}</span>}
                  </div>
                  {sidebarOpen && (
                    <span
                      className={`transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-blue-400" : ""
                      }`}
                    >
                      <ChevronDown size={14} />
                    </span>
                  )}
                </button>
                {isOpen && sidebarOpen && (
                  <div className="pl-4 mt-1 space-y-1 animate-in slide-in-from-top-2 duration-200">
                    <div className="pl-3 border-l border-slate-700/50 space-y-1 py-1">
                      {group.items.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveMenu(item.id);
                            if (window.innerWidth <= 768) setSidebarOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                            activeMenu === item.id
                              ? "text-blue-400 bg-blue-500/10"
                              : "text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          {item.icon}
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="p-4 border-t border-slate-800 shrink-0">
          <button className="w-10 h-10 mx-auto rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-400 hover:text-white hover:bg-red-600">
            <LogOut size={16} />
          </button>
        </div>
      </aside>
    </>
  );

  const renderHeader = () => (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 shrink-0 z-20">
      <div className="flex items-center gap-2 sm:gap-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg -ml-2 sm:ml-0"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded hidden sm:block">
            Portal
          </span>
          <ChevronRight size={12} className="text-slate-300 hidden sm:block" />
          <h2 className="text-sm font-black text-slate-800">
            {getBreadcrumb(activeMenu)}
          </h2>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full shadow-sm">
          <Lock size={12} className="text-blue-500" />
          <span className="text-xs font-black text-slate-700">{userInfo}</span>
        </div>
        <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
          <Bell size={18} />
        </button>
      </div>
    </header>
  );

  const renderMainContent = () => {
    switch (activeMenu) {
      case "claim-register":
        return <ClaimRegistration />;
      case "claim-list":
        return <ClaimViewer />;
      case "claim-dashboard":
        return <ClaimDashboard />;
      default:
        return (
          <div className="p-6">
            <h2 className="text-xl font-bold">404</h2>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      {renderSidebar()}
      {/* 💡 [핵심 수정] 억지로 margin-left를 주던 코드를 삭제했습니다. Flexbox가 알아서 밀어줍니다. */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {renderHeader()}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-slate-100 relative">
          <div className="max-w-[1600px] mx-auto w-full">
            {renderMainContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
