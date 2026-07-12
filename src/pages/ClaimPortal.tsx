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
// 💡 경로 에러 수정 완료 (점 2개 -> 1개)
import { supabase } from "../lib/supabase";

export default function ClaimPortal() {
  const [activeMenu, setActiveMenu] = useState("claim-register");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedMenu, setExpandedMenu] = useState<string | null>("claim-menu");

  // 글로벌 유저 정보
  const [userInfo, setUserInfo] = useState("로딩 중...");

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
      "claim-dashboard": "클레임 관리 센터 / 클레임 대시보드",
      "claim-register": "클레임 관리 센터 / 새 클레임 등록",
      "claim-list": "클레임 관리 센터 / 클레임 진행 현황",
    };
    return map[menu] || "클레임 포털";
  };

  const renderSidebar = () => (
    <aside
      className={`transition-all duration-300 bg-slate-900 text-slate-300 flex flex-col shrink-0 fixed inset-y-0 left-0 z-50 md:relative h-full ${
        sidebarOpen
          ? "translate-x-0 w-64"
          : "-translate-x-full w-64 md:translate-x-0 md:w-20"
      }`}
    >
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
                        onClick={() => setActiveMenu(item.id)}
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
        {sidebarOpen ? (
          <div className="flex items-center justify-between bg-slate-800 p-3 rounded-2xl">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-white shrink-0">
                T
              </div>
              <div className="overflow-hidden">
                <div className="text-sm font-bold text-white truncate">
                  거래지원팀
                </div>
                <div className="text-[10px] text-blue-400 font-medium truncate">
                  클레임 담당자
                </div>
              </div>
            </div>
            <button className="p-2 text-slate-400 hover:text-white">
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button className="w-10 h-10 mx-auto rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-400 hover:text-white hover:bg-red-600">
            <LogOut size={16} />
          </button>
        )}
      </div>
    </aside>
  );

  const renderHeader = () => (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 shrink-0 z-20">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded hidden sm:block">
            Portal
          </span>
          <ChevronRight size={12} className="text-slate-300 hidden sm:block" />
          <h2 className="text-sm font-black text-slate-800 hidden sm:block">
            {getBreadcrumb(activeMenu)}
          </h2>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {/* 💡 히든 속성을 제거하여 유저 뱃지가 항상 또렷하게 보이도록 수정 */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full shadow-sm">
          <Lock size={12} className="text-blue-500" />
          <span className="text-xs font-black text-slate-700">{userInfo}</span>
        </div>
        <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
          <Bell size={18} />
        </button>
        <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
          <Settings size={18} />
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
            <h2 className="text-xl font-bold">페이지를 찾을 수 없습니다.</h2>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      {renderSidebar()}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {renderHeader()}
        <main className="flex-1 overflow-y-auto bg-slate-100 p-4 sm:p-6 custom-scrollbar">
          {renderMainContent()}
        </main>
      </div>
    </div>
  );
}
