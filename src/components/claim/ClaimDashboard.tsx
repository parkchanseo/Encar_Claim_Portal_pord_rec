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
} from "lucide-react";
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
// 💡 파이프라인 임포트 (경로 확인 필수)
import { supabase } from "../../lib/supabase";

// 💡 TypeScript 타입 정의 (DB 구조와 완벽 동기화)
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

export default function ClaimDashboard() {
  const [timeRange, setTimeRange] = useState("2026년");
  const [expandedRegion, setExpandedRegion] = useState<string | null>(null);
  const [rawClaims, setRawClaims] = useState<ClaimReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 💡 DB에서 클레임 데이터 실시간 호출
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

  const getProgressColor = (rate: number) => {
    if (rate < 50) return "bg-red-500";
    if (rate < 80) return "bg-orange-400";
    return "bg-emerald-500";
  };

  // 💡 프론트엔드 데이터 동적 가공(Aggregation) 로직
  const dashboardData = useMemo(() => {
    if (!rawClaims.length) return null;

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    let currentMonthClaims = 0;
    let currentMonthAmount = 0;
    let actionRequired = 0;

    const monthlyMap = Array.from({ length: 12 }, (_, i) => ({
      month: `${i + 1}월`,
      claims: 0,
      amount: 0,
    }));

    const centerMap: Record<string, any> = {};
    const regionMap: Record<string, any> = {};

    rawClaims.forEach((c) => {
      const claimDate = new Date(c.occurrence_date);
      const claimYear = claimDate.getFullYear();
      const claimMonth = claimDate.getMonth() + 1;
      const amount = Number(c.compensation_amount) || 0;

      // 1. 당월 지표 계산
      if (claimYear === currentYear && claimMonth === currentMonth) {
        currentMonthClaims++;
        currentMonthAmount += amount;
      }

      // Action Required (환불이 발생한 검수리포트인데, 광고 수정이 완료되지 않은 건)
      if (
        c.category === "검수리포트" &&
        c.is_refunded &&
        c.claim_status !== "광고 수정 완료"
      ) {
        actionRequired++;
      }

      // 2. 월별 차트 데이터
      if (claimYear === currentYear) {
        monthlyMap[claimMonth - 1].claims += 1;
        monthlyMap[claimMonth - 1].amount += amount;
      }

      // 3. Top 3 센터 가공
      const region = c.region || "미분류";
      const center = c.center || "미상";
      const centerKey = `${region}|${center}`;

      if (!centerMap[centerKey]) {
        centerMap[centerKey] = { region, center, count: 0, total_amount: 0 };
      }
      centerMap[centerKey].count += 1;
      centerMap[centerKey].total_amount += amount;

      // 4. 권역별 드릴다운 데이터 가공
      if (!regionMap[region]) {
        regionMap[region] = {
          id: region,
          region,
          manager: c.manager_name || "-",
          claims: 0,
          amount: 0,
          required_ad_mods: 0,
          completed_ad_mods: 0,
          branchMap: {},
        };
      }

      regionMap[region].claims += 1;
      regionMap[region].amount += amount;

      const isTarget = c.category === "검수리포트" && c.is_refunded;
      if (isTarget) {
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

      if (isTarget) {
        regionMap[region].branchMap[center].required_ad_mods += 1;
        if (c.claim_status === "광고 수정 완료")
          regionMap[region].branchMap[center].completed_ad_mods += 1;
      }
    });

    const monthlyData = monthlyMap.slice(0, currentMonth);

    const topCenters = Object.values(centerMap)
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 3)
      .map((item, index) => ({ ...(item as any), rank: index + 1 }));

    const regionalMetrics = Object.values(regionMap).map((rg: any) => {
      const branches = Object.values(rg.branchMap).map((br: any) => ({
        ...br,
        completionRate: br.required_ad_mods
          ? Math.round((br.completed_ad_mods / br.required_ad_mods) * 100)
          : 100,
      }));
      return {
        ...rg,
        completionRate: rg.required_ad_mods
          ? Math.round((rg.completed_ad_mods / rg.required_ad_mods) * 100)
          : 100,
        leadTime: 2.0, // 데모용
        branches,
      };
    });

    return {
      currentMonthClaims,
      currentMonthAmount,
      actionRequired,
      monthlyData,
      topCenters,
      regionalMetrics,
    };
  }, [rawClaims]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-400 font-bold animate-pulse text-lg">
          대시보드 데이터를 실시간으로 분석 중입니다...
        </p>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <AlertCircle size={48} className="text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-600 mb-2">
          등록된 클레임 데이터가 없습니다.
        </h2>
        <p className="text-slate-400">
          새 클레임을 등록하시면 대시보드가 자동으로 활성화됩니다.
        </p>
      </div>
    );
  }

  const {
    currentMonthClaims,
    currentMonthAmount,
    actionRequired,
    monthlyData,
    topCenters,
    regionalMetrics,
  } = dashboardData;

  return (
    <div className="space-y-6">
      {/* 상단 헤더 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-800">
            클레임 통계 대시보드
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            데이터 기반 클레임 원인 분석 및 현장 타겟팅 (실시간 연동)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 shadow-sm outline-none focus:border-blue-400"
          >
            <option value="2026년">2026년 전체 누적</option>
          </select>
        </div>
      </div>

      {/* 1단계: 거시적 지표 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <BarChart3 size={24} />
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 mb-1">
              당월 누적 발생 건수
            </p>
            <div className="flex items-end gap-2">
              <h3 className="text-3xl font-black text-slate-800">
                {currentMonthClaims}
                <span className="text-lg font-medium text-slate-500 ml-1">
                  건
                </span>
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-xl">
              <Activity size={24} />
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 mb-1">
              당월 누적 보상 금액
            </p>
            <div className="flex items-end gap-2">
              <h3 className="text-3xl font-black text-red-600">
                {currentMonthAmount.toLocaleString()}
                <span className="text-lg font-medium text-slate-500 ml-1">
                  원
                </span>
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-2xl shadow-sm flex flex-col justify-between text-white relative overflow-hidden">
          <div className="absolute -right-6 -top-6 text-slate-700 opacity-50">
            <AlertCircle size={100} />
          </div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-3 bg-slate-700 text-slate-300 rounded-xl">
              <Wrench size={24} />
            </div>
            <span className="text-sm font-bold text-red-400 bg-red-400/20 px-2.5 py-1 rounded-full animate-pulse">
              Action Required
            </span>
          </div>
          <div className="relative z-10">
            <p className="text-sm font-bold text-slate-400 mb-1">
              광고 수정 미완료 대기 건
            </p>
            <div className="flex items-end gap-2">
              <h3 className="text-3xl font-black text-white">
                {actionRequired}
                <span className="text-lg font-medium text-slate-400 ml-1">
                  건
                </span>
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              뷰어에서 즉시 처리 요망
            </p>
          </div>
        </div>
      </div>

      {/* 2단계: 차트 & Top3 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
              <TrendingDown className="text-emerald-500" size={20} />
              월별 클레임 발생 건수 추이
            </h2>
            <span className="text-xs font-bold text-slate-400">
              2026년 기준
            </span>
          </div>
          <div className="flex-1 w-full h-72">
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
                  stroke="#e2e8f0"
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  dy={10}
                />
                <YAxis
                  yAxisId="left"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Area
                  yAxisId="left"
                  type="monotone"
                  name="발생 건수 (건)"
                  dataKey="claims"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorClaims)"
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
              <AlertCircle className="text-red-500" size={20} />
              요주의 권역 / 지점 Top 3
            </h2>
          </div>
          <div className="flex-1 flex flex-col justify-start gap-4">
            {topCenters.length === 0 ? (
              <div className="text-center text-slate-400 py-10 text-sm">
                데이터가 충분하지 않습니다.
              </div>
            ) : (
              topCenters.map((item: any, index: number) => (
                <div
                  key={index}
                  className="relative bg-slate-50 border border-slate-100 rounded-xl p-4 overflow-hidden group hover:border-red-200 hover:bg-red-50/30 transition-all"
                >
                  <div
                    className="absolute left-0 top-0 bottom-0 bg-red-100/50 z-0 transition-all"
                    style={{
                      width: `${(item.count / topCenters[0].count) * 100}%`,
                    }}
                  ></div>
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                          item.rank === 1
                            ? "bg-red-500 text-white shadow-md"
                            : item.rank === 2
                            ? "bg-orange-400 text-white"
                            : "bg-slate-300 text-slate-700"
                        }`}
                      >
                        {item.rank}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-800">
                          {item.region} / {item.center}
                        </h4>
                        <p className="text-xs font-bold text-slate-500 mt-0.5">
                          보상: {item.total_amount.toLocaleString()}원
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-slate-800">
                        {item.count}
                        <span className="text-xs text-slate-500 ml-0.5">
                          건
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 3단계: 권역/지점별 세부 지표 */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
            <ListTree className="text-blue-600" size={20} />
            권역별 실시간 성과 지표
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">권역</th>
                <th className="px-6 py-4 whitespace-nowrap text-center">
                  클레임 발생 (건)
                </th>
                <th className="px-6 py-4 whitespace-nowrap text-right">
                  누적 보상금액
                </th>
                <th className="px-6 py-4 whitespace-nowrap w-1/4">
                  광고 수정 달성률
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {regionalMetrics.map((region: any) => (
                <React.Fragment key={region.id}>
                  <tr
                    onClick={() => toggleRegion(region.id)}
                    className={`hover:bg-blue-50/50 cursor-pointer transition-colors ${
                      expandedRegion === region.id ? "bg-blue-50/30" : ""
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {expandedRegion === region.id ? (
                          <ChevronUp size={16} className="text-blue-600" />
                        ) : (
                          <ChevronDown size={16} className="text-slate-400" />
                        )}
                        <span className="font-black text-slate-800 text-[15px]">
                          {region.region}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-slate-700">
                      {region.claims}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-700">
                      {region.amount.toLocaleString()}원
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-full bg-slate-100 rounded-full h-2.5">
                          <div
                            className={`h-2.5 rounded-full ${getProgressColor(
                              region.completionRate
                            )}`}
                            style={{ width: `${region.completionRate}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-black text-slate-700 w-8">
                          {region.completionRate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                  {expandedRegion === region.id && (
                    <tr>
                      <td colSpan={4} className="bg-slate-50 p-0">
                        <div className="px-8 py-4 bg-slate-50/80 border-b border-slate-200 shadow-inner">
                          <table className="w-full text-xs text-slate-600">
                            <thead className="text-slate-500 border-b border-slate-200">
                              <tr>
                                <th className="pb-2 font-bold pl-4">지점명</th>
                                <th className="pb-2 font-bold text-center">
                                  건수
                                </th>
                                <th className="pb-2 font-bold text-right">
                                  보상금액
                                </th>
                                <th className="pb-2 font-bold w-1/3">달성률</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {region.branches.map(
                                (branch: any, idx: number) => (
                                  <tr
                                    key={idx}
                                    className="hover:bg-white transition-colors"
                                  >
                                    <td className="py-3 pl-4 font-bold text-slate-700 flex items-center gap-2">
                                      <div className="w-1 h-1 rounded-full bg-slate-400"></div>
                                      {branch.name}
                                    </td>
                                    <td className="py-3 text-center">
                                      {branch.claims}
                                    </td>
                                    <td className="py-3 text-right">
                                      {branch.amount.toLocaleString()}원
                                    </td>
                                    <td className="py-3">
                                      <div className="flex items-center gap-2 pr-4">
                                        <div className="w-full bg-slate-200 rounded-full h-1.5">
                                          <div
                                            className={`h-1.5 rounded-full ${getProgressColor(
                                              branch.completionRate
                                            )}`}
                                            style={{
                                              width: `${branch.completionRate}%`,
                                            }}
                                          ></div>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-500 w-6">
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
