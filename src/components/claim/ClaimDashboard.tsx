import React, { useState, useEffect, useMemo } from "react";
import {
  TrendingDown,
  TrendingUp,
  AlertCircle,
  MapPin,
  Wrench,
  BarChart3,
  Activity,
  ChevronDown,
  ChevronUp,
  Clock,
  ListTree,
  ChevronRight,
  Filter,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
// 💡 파이프라인 임포트 (본진 환경에 맞게 경로 확인 필수)
import { supabase } from "../../lib/supabase";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface ClaimReport {
  id: string;
  category: string;
  occurrence_date: string;
  compensation_amount: number;
  is_refunded: boolean;
  claim_status: string;
  region: string;
  center: string;
  manager_name: string;
}

// 💡 [버그 픽스] user와 navigateToMenu 뒤에 물음표(?)를 붙여서 '없어도 에러 띄우지 마'라고 설정했습니다.
export default function ClaimDashboard({
  user,
  navigateToMenu,
}: {
  user?: any;
  navigateToMenu?: any;
}) {
  const [selectedMonth, setSelectedMonth] = useState("전체");
  const [top3SortBy, setTop3SortBy] = useState<"count" | "amount">("count");
  const [expandedRegion, setExpandedRegion] = useState<string | null>(null);

  const [rawClaims, setRawClaims] = useState<ClaimReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("claim_reports")
          .select("*");
        if (error) throw error;
        setRawClaims(data || []);
      } catch (error) {
        console.error("대시보드 데이터를 불러오는데 실패했습니다.", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const toggleRegion = (regionId: string) => {
    setExpandedRegion(expandedRegion === regionId ? null : regionId);
  };

  const dashboardData = useMemo(() => {
    if (!rawClaims.length) return null;

    const currentYear = new Date().getFullYear();
    const targetMonthNum =
      selectedMonth === "전체"
        ? null
        : parseInt(selectedMonth.replace("월", ""));

    const monthlyMap = Array.from({ length: 12 }, (_, i) => ({
      month: `${i + 1}월`,
      claims: 0,
      amount: 0,
    }));

    rawClaims.forEach((c) => {
      const claimDate = new Date(c.occurrence_date);
      if (claimDate.getFullYear() === currentYear) {
        monthlyMap[claimDate.getMonth()].claims += 1;
        monthlyMap[claimDate.getMonth()].amount +=
          Number(c.compensation_amount) || 0;
      }
    });

    const filteredClaims = rawClaims.filter((c) => {
      const d = new Date(c.occurrence_date);
      if (d.getFullYear() !== currentYear) return false;
      if (targetMonthNum && d.getMonth() + 1 !== targetMonthNum) return false;
      return true;
    });

    let currentClaimsCount = 0;
    let currentTotalAmount = 0;
    let actionRequired = 0;

    let totalRequiredMods = 0;
    let totalCompletedMods = 0;

    const centerMap: Record<string, any> = {};
    const regionMap: Record<string, any> = {};

    filteredClaims.forEach((c) => {
      const amount = Number(c.compensation_amount) || 0;
      currentClaimsCount++;
      currentTotalAmount += amount;

      const isRefundAd = c.category === "검수리포트" && c.is_refunded;

      if (isRefundAd) {
        totalRequiredMods++;
        if (c.claim_status === "광고 수정 완료") totalCompletedMods++;
        else actionRequired++;
      }

      const region = c.region || "미분류";
      const center = c.center || "미상";
      const centerKey = `${region}|${center}`;

      if (!centerMap[centerKey]) {
        centerMap[centerKey] = { region, center, count: 0, amount: 0 };
      }
      centerMap[centerKey].count += 1;
      centerMap[centerKey].amount += amount;

      if (!regionMap[region]) {
        regionMap[region] = {
          id: region,
          region,
          claims: 0,
          amount: 0,
          required_ad_mods: 0,
          completed_ad_mods: 0,
          branchMap: {},
        };
      }
      regionMap[region].claims += 1;
      regionMap[region].amount += amount;

      if (isRefundAd) {
        regionMap[region].required_ad_mods += 1;
        if (c.claim_status === "광고 수정 완료")
          regionMap[region].completed_ad_mods += 1;
      }

      if (!regionMap[region].branchMap[center]) {
        regionMap[region].branchMap[center] = {
          name: center,
          claims: 0,
          amount: 0,
          required_ad_mods: 0,
          completed_ad_mods: 0,
        };
      }
      regionMap[region].branchMap[center].claims += 1;
      regionMap[region].branchMap[center].amount += amount;

      if (isRefundAd) {
        regionMap[region].branchMap[center].required_ad_mods += 1;
        if (c.claim_status === "광고 수정 완료")
          regionMap[region].branchMap[center].completed_ad_mods += 1;
      }
    });

    const avgCompletionRate = totalRequiredMods
      ? Math.round((totalCompletedMods / totalRequiredMods) * 100)
      : 100;

    const topCenters = Object.values(centerMap)
      .sort((a: any, b: any) => b[top3SortBy] - a[top3SortBy])
      .slice(0, 3)
      .map((item, index) => ({ ...(item as any), rank: index + 1 }));

    const regionalMetrics = Object.values(regionMap)
      .map((rg: any) => {
        const branches = Object.values(rg.branchMap)
          .map((br: any) => ({
            ...br,
            completionRate: br.required_ad_mods
              ? Math.round((br.completed_ad_mods / br.required_ad_mods) * 100)
              : 100,
          }))
          .sort((a, b) => b.claims - a.claims);

        return {
          ...rg,
          completionRate: rg.required_ad_mods
            ? Math.round((rg.completed_ad_mods / rg.required_ad_mods) * 100)
            : 100,
          branches,
        };
      })
      .sort((a, b) => b.claims - a.claims);

    const currentRealMonth = new Date().getMonth() + 1;
    const monthlyData = monthlyMap.slice(0, currentRealMonth);

    return {
      currentClaimsCount,
      currentTotalAmount,
      actionRequired,
      avgCompletionRate,
      monthlyData,
      topCenters,
      regionalMetrics,
    };
  }, [rawClaims, selectedMonth, top3SortBy]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full animate-in fade-in">
        <AlertCircle className="animate-spin text-blue-500 mb-4" size={40} />
        <p className="text-sm font-bold text-slate-500">
          대시보드 데이터를 실시간으로 분석 중입니다...
        </p>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center h-full animate-in fade-in">
        <BarChart3 size={48} className="text-slate-300 mb-4" />
        <h2 className="text-xl font-black text-slate-600 mb-2">
          등록된 클레임 데이터가 없습니다.
        </h2>
        <p className="text-sm font-bold text-slate-400">
          새 클레임을 등록하시면 대시보드가 자동으로 활성화됩니다.
        </p>
      </div>
    );
  }

  const {
    currentClaimsCount,
    currentTotalAmount,
    actionRequired,
    avgCompletionRate,
    monthlyData,
    topCenters,
    regionalMetrics,
  } = dashboardData;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <BarChart3 size={24} className="text-blue-600" /> 클레임 종합 상황판
          </h2>
          <p className="text-[11px] font-bold text-slate-500 mt-1 ml-8">
            데이터 기반 클레임 타겟팅 및 성과 지표
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white px-2 py-1.5 rounded-xl shadow-sm border border-slate-200">
          <Filter size={14} className="text-slate-400 ml-2" />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-2 py-1 bg-transparent text-sm font-black text-slate-700 outline-none cursor-pointer"
          >
            <option value="전체">2026년 전체 누적</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={`${i + 1}월`}>
                {i + 1}월 집중 분석
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 flex flex-col justify-between group hover:border-blue-200 hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
              <BarChart3 size={20} />
            </div>
            <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
              발생 건수
            </span>
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-800 mb-1">
              {currentClaimsCount}
              <span className="text-sm font-bold text-slate-500 ml-1">건</span>
            </h3>
            <p className="text-[11px] font-bold text-slate-400">
              선택 기간 기준
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 flex flex-col justify-between group hover:border-slate-300 hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl group-hover:scale-110 transition-transform">
              <Activity size={20} />
            </div>
            <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
              누적 비용
            </span>
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-800 mb-1">
              {currentTotalAmount.toLocaleString()}
              <span className="text-sm font-bold text-slate-500 ml-1">원</span>
            </h3>
            <p className="text-[11px] font-bold text-slate-400">
              재무적 손실 규모
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 flex flex-col justify-between group hover:border-emerald-200 hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
              <CheckCircle size={20} />
            </div>
            <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
              개선 지표
            </span>
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-800 mb-1">
              {avgCompletionRate}
              <span className="text-sm font-bold text-slate-500 ml-1">%</span>
            </h3>
            <p className="text-[11px] font-bold text-slate-400">
              광고 수정 평균 달성률
            </p>
          </div>
        </div>

        {/* 💡 [버그 픽스] navigateToMenu가 존재할 때만 함수를 실행하도록 방어막을 쳤습니다. */}
        <div
          onClick={() => navigateToMenu && navigateToMenu("claim-list")}
          className="bg-red-50 p-5 rounded-3xl shadow-sm border border-red-100 flex flex-col justify-between cursor-pointer hover:bg-red-500 hover:shadow-lg hover:-translate-y-1 transition-all group relative overflow-hidden"
        >
          <div className="absolute -right-4 -bottom-4 text-red-500/10 group-hover:text-black/10 transition-colors">
            <AlertTriangle size={120} />
          </div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-2.5 bg-red-100 text-red-600 rounded-xl group-hover:bg-white group-hover:text-red-600 transition-colors">
              <Wrench size={20} />
            </div>
            <span className="text-[10px] font-black text-red-600 bg-red-100 px-2 py-1 rounded-lg group-hover:bg-black/20 group-hover:text-white flex items-center gap-1 animate-pulse">
              Action Required <ChevronRight size={10} />
            </span>
          </div>
          <div className="relative z-10">
            <h3 className="text-2xl font-black text-red-600 group-hover:text-white mb-1">
              {actionRequired}
              <span className="text-sm font-bold opacity-70 ml-1">건</span>
            </h3>
            <p className="text-[11px] font-bold text-red-500 group-hover:text-red-100">
              광고 수정 미완료 (클릭하여 처리)
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-black text-slate-800 flex items-center gap-2">
              <TrendingDown size={18} className="text-blue-500" /> 월별 클레임
              발생 현황
            </h3>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
              2026 누적 추이
            </span>
          </div>
          <div className="flex-1 w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={monthlyData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorClaims" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 700 }}
                  dy={10}
                />
                <YAxis
                  yAxisId="left"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 700 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "16px",
                    border: "none",
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                    fontWeight: 700,
                    fontSize: "12px",
                  }}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  name="발생 건수 (건)"
                  dataKey="claims"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fill="url(#colorClaims)"
                  activeDot={{
                    r: 6,
                    fill: "#2563eb",
                    stroke: "#fff",
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 flex flex-col overflow-hidden h-[340px]">
          <div className="flex border-b border-slate-100 bg-slate-50">
            <button
              onClick={() => setTop3SortBy("count")}
              className={`flex-1 py-3 text-[11px] font-black transition-all ${
                top3SortBy === "count"
                  ? "bg-white text-blue-600 border-b-2 border-blue-500 shadow-sm"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              📊 건수 집중 관리
            </button>
            <button
              onClick={() => setTop3SortBy("amount")}
              className={`flex-1 py-3 text-[11px] font-black transition-all ${
                top3SortBy === "amount"
                  ? "bg-white text-red-600 border-b-2 border-red-500 shadow-sm"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              💰 비용 집중 관리
            </button>
          </div>

          <div className="p-5 flex-1 flex flex-col gap-3 overflow-y-auto custom-scrollbar">
            {topCenters.length === 0 ? (
              <p className="text-xs font-bold text-slate-400 text-center py-10">
                데이터가 없습니다.
              </p>
            ) : (
              topCenters.map((item: any, index: number) => {
                const isAmountMode = top3SortBy === "amount";
                return (
                  <div
                    key={index}
                    className="relative bg-slate-50 border border-slate-100 rounded-2xl p-4 overflow-hidden group hover:border-slate-300 transition-colors"
                  >
                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shadow-sm ${
                            item.rank === 1
                              ? isAmountMode
                                ? "bg-red-500 text-white"
                                : "bg-blue-600 text-white"
                              : item.rank === 2
                              ? isAmountMode
                                ? "bg-red-400 text-white"
                                : "bg-blue-500 text-white"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {item.rank}
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-800">
                            {item.region} | {item.center}
                          </h4>
                          <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                            {isAmountMode
                              ? `${item.count}건 발생`
                              : `누적 ${item.amount.toLocaleString()}원`}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`text-right font-black ${
                          isAmountMode ? "text-red-600" : "text-slate-800"
                        }`}
                      >
                        <span className="text-lg">
                          {isAmountMode
                            ? (item.amount / 10000).toLocaleString()
                            : item.count}
                        </span>
                        <span className="text-[10px] ml-0.5 text-slate-400">
                          {isAmountMode ? "만 원" : "건"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col w-full">
        <div className="p-4 border-b bg-slate-50 font-black text-sm text-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ListTree size={16} className="text-blue-600" /> 지점별 타겟팅 및
            이행률
          </div>
          <span className="text-[10px] text-slate-400 font-bold">
            행을 클릭하여 세부 지점 확인
          </span>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left whitespace-nowrap min-w-[600px]">
            <thead className="bg-white text-[11px] font-black text-slate-400 border-b shadow-sm">
              <tr>
                <th className="px-6 py-4">권역</th>
                <th className="px-6 py-4 text-center">클레임 발생</th>
                <th className="px-6 py-4 text-right">보상 총액</th>
                <th className="px-6 py-4 w-1/3">광고 수정 달성률</th>
              </tr>
            </thead>
            <tbody className="text-sm font-medium text-slate-600 divide-y divide-slate-100">
              {regionalMetrics.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="text-center py-10 font-bold text-slate-400 text-xs"
                  >
                    선택한 기간에 데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                regionalMetrics.map((region: any) => (
                  <React.Fragment key={region.id}>
                    <tr
                      onClick={() => toggleRegion(region.id)}
                      className={`hover:bg-slate-50 cursor-pointer transition-colors ${
                        expandedRegion === region.id ? "bg-slate-50" : ""
                      }`}
                    >
                      <td className="px-6 py-4 font-black text-slate-800 flex items-center gap-2">
                        {expandedRegion === region.id ? (
                          <ChevronUp size={14} className="text-blue-500" />
                        ) : (
                          <ChevronDown size={14} className="text-slate-300" />
                        )}
                        {region.region}권역
                      </td>
                      <td className="px-6 py-4 text-center font-bold">
                        {region.claims}건
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-700">
                        {region.amount.toLocaleString()}원
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-full bg-slate-100 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-1000 ${
                                region.completionRate < 50
                                  ? "bg-red-400"
                                  : region.completionRate < 80
                                  ? "bg-amber-400"
                                  : "bg-emerald-500"
                              }`}
                              style={{ width: `${region.completionRate}%` }}
                            ></div>
                          </div>
                          <span className="text-[10px] font-black text-slate-500 w-8">
                            {region.completionRate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                    {expandedRegion === region.id && (
                      <tr>
                        <td colSpan={4} className="p-0 border-none">
                          <div className="px-8 py-4 bg-slate-50/80 border-b border-slate-100 shadow-inner">
                            <table className="w-full text-xs text-slate-600">
                              <thead className="text-[10px] text-slate-400 font-bold border-b border-slate-200">
                                <tr>
                                  <th className="pb-2 pl-4">지점명</th>
                                  <th className="pb-2 text-center">건수</th>
                                  <th className="pb-2 text-right">보상액</th>
                                  <th className="pb-2 w-1/3">달성률</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100/50">
                                {region.branches.map(
                                  (branch: any, idx: number) => (
                                    <tr
                                      key={idx}
                                      className="hover:bg-white transition-colors"
                                    >
                                      <td className="py-2.5 pl-4 font-bold text-slate-700 flex items-center gap-2">
                                        <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                                        {branch.name}
                                      </td>
                                      <td className="py-2.5 text-center">
                                        {branch.claims}
                                      </td>
                                      <td className="py-2.5 text-right">
                                        {branch.amount.toLocaleString()}원
                                      </td>
                                      <td className="py-2.5">
                                        <div className="flex items-center gap-2 pr-4">
                                          <div className="w-full bg-slate-200 rounded-full h-1">
                                            <div
                                              className={`h-1 rounded-full ${
                                                branch.completionRate < 50
                                                  ? "bg-red-400"
                                                  : branch.completionRate < 80
                                                  ? "bg-amber-400"
                                                  : "bg-emerald-500"
                                              }`}
                                              style={{
                                                width: `${branch.completionRate}%`,
                                              }}
                                            ></div>
                                          </div>
                                          <span className="text-[9px] font-bold text-slate-400 w-6">
                                            {branch.completionRate}%
                                          </span>
                                        </div>
                                      </td>
                                    </tr>
                                  )
                                )}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
