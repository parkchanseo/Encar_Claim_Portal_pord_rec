import React, { useState, useEffect } from "react";
import {
  Search,
  Edit,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function ClaimViewer() {
  const [claims, setClaims] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 모달 상태
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // 💡 토스트(Toast) 알림 상태
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

  // ==========================================
  // [DB 로직] 데이터 조회 및 업데이트
  // ==========================================
  const fetchClaims = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("claim_reports")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setClaims(data || []);
    } catch (error) {
      console.error("데이터 불러오기 실패:", error);
      showToast("데이터를 불러오는데 실패했습니다.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const handleUpdate = async () => {
    if (!editData) return;
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("claim_reports")
        .update({
          category: editData.category,
          occurrence_date: editData.occurrence_date,
          vehicle_name: editData.vehicle_name,
          vehicle_number: editData.vehicle_number,
          company_name: editData.company_name,
          dealer_name: editData.dealer_name,
          compensation_amount: Number(editData.compensation_amount) || 0,
          is_refunded: editData.is_refunded,
          return_mileage: editData.is_refunded
            ? Number(editData.return_mileage)
            : null,
          details: editData.details,
          claim_status: editData.claim_status,
          region: editData.region,
          center: editData.center,
          manager_name: editData.manager_name,
          claim_part: editData.claim_part,
          preventive_measure: editData.preventive_measure,
          improvement_plan: editData.improvement_plan,
        })
        .eq("id", editData.id);

      if (error) throw error;

      showToast("클레임 정보가 성공적으로 수정되었습니다.");
      setIsEditModalOpen(false);
      fetchClaims();
    } catch (error) {
      console.error("수정 실패:", error);
      showToast("수정 중 오류가 발생했습니다.", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  // ==========================================
  // [모달 및 UI 제어 로직]
  // ==========================================
  const openEditModal = (claim: any) => {
    setEditData({ ...claim });
    setIsEditModalOpen(true);
  };
  const handleEditChange = (field: string, value: any) =>
    setEditData((prev: any) => ({ ...prev, [field]: value }));

  const openPhotoModal = (index: number) => {
    setCurrentIndex(index);
    setCurrentPhotoIndex(0);
    setIsPhotoModalOpen(true);
  };
  const currentClaim = claims[currentIndex];
  const handlePrevPhoto = () =>
    setCurrentPhotoIndex((prev) => Math.max(0, prev - 1));
  const handleNextPhoto = () =>
    setCurrentPhotoIndex((prev) =>
      Math.min((currentClaim?.image_urls?.length || 1) - 1, prev + 1)
    );
  const handlePrevClaim = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setCurrentPhotoIndex(0);
    }
  };
  const handleNextClaim = () => {
    if (currentIndex < claims.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setCurrentPhotoIndex(0);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "광고 수정 대기")
      return (
        <span className="px-2.5 py-1 rounded-md text-[11px] font-black bg-red-100 text-red-600 border border-red-200">
          {status}
        </span>
      );
    if (status === "광고 수정 완료")
      return (
        <span className="px-2.5 py-1 rounded-md text-[11px] font-black bg-emerald-100 text-emerald-700 border border-emerald-200">
          {status}
        </span>
      );
    return (
      <span className="px-2.5 py-1 rounded-md text-[11px] font-black bg-slate-100 text-slate-600 border border-slate-200">
        {status}
      </span>
    );
  };

  // 💡 공통 Input 스타일 (엔터프라이즈 UX)
  const inputClass =
    "w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none";
  const labelClass = "block text-[13px] font-bold text-slate-700 mb-1.5";

  return (
    <div className="relative bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-8 max-w-[1400px] mx-auto min-h-[80vh]">
      {/* 💡 토스트 알림 컴포넌트 */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-4 fade-in duration-300">
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

      <div className="mb-8">
        <h2 className="text-2xl font-black text-slate-800">클레임 진행 현황</h2>
        <p className="text-sm text-slate-500 mt-1">
          등록된 클레임 내역을 조회하고 상태를 업데이트할 수 있습니다.
        </p>
      </div>

      {/* 필터 영역 (엔터프라이즈 UI) */}
      <div className="flex flex-wrap gap-3 mb-8 p-5 bg-slate-50/50 rounded-2xl border border-slate-100 shadow-inner items-center">
        <input
          type="date"
          className="h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
        />
        <span className="text-slate-400 font-bold">~</span>
        <input
          type="date"
          className="h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
        />

        <div className="relative ml-2">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={16}
          />
          <input
            type="text"
            placeholder="담당자 (권역/지점/이름)"
            className="w-56 h-10 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>
      </div>

      {/* 리스트 영역 */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-black">
            <tr>
              <th className="px-5 py-4">상태</th>
              <th className="px-5 py-4">구분 / 발생일</th>
              <th className="px-5 py-4">담당자</th>
              <th className="px-5 py-4">차량정보</th>
              <th className="px-5 py-4">상사정보</th>
              <th className="px-5 py-4 text-right">부위 / 금액</th>
              <th className="px-5 py-4 text-center">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-5 py-12 text-center text-slate-400 font-bold animate-pulse"
                >
                  데이터를 불러오는 중입니다...
                </td>
              </tr>
            ) : claims.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-5 py-12 text-center text-slate-400 font-bold"
                >
                  등록된 클레임 내역이 없습니다.
                </td>
              </tr>
            ) : (
              claims.map((claim, index) => (
                <tr
                  key={claim.id}
                  className="hover:bg-slate-50/80 transition-colors group"
                >
                  <td
                    className="px-5 py-4 cursor-pointer"
                    onClick={() => openPhotoModal(index)}
                  >
                    {getStatusBadge(claim.claim_status)}
                  </td>
                  <td
                    className="px-5 py-4 cursor-pointer"
                    onClick={() => openPhotoModal(index)}
                  >
                    <div className="font-bold text-slate-800">
                      {claim.category}
                    </div>
                    <div className="text-xs text-slate-500 font-medium mt-0.5">
                      {claim.occurrence_date}
                    </div>
                  </td>
                  <td
                    className="px-5 py-4 cursor-pointer"
                    onClick={() => openPhotoModal(index)}
                  >
                    <div className="font-bold text-slate-800">
                      {claim.manager_name || "-"}
                    </div>
                    <div className="text-xs text-slate-500 font-medium mt-0.5">
                      {claim.region || "-"} / {claim.center || "-"}
                    </div>
                  </td>
                  <td
                    className="px-5 py-4 cursor-pointer"
                    onClick={() => openPhotoModal(index)}
                  >
                    <div className="font-bold text-slate-800">
                      {claim.vehicle_number}
                    </div>
                    <div className="text-xs text-slate-500 font-medium mt-0.5">
                      {claim.vehicle_name}
                    </div>
                  </td>
                  <td
                    className="px-5 py-4 cursor-pointer"
                    onClick={() => openPhotoModal(index)}
                  >
                    <div className="font-bold text-slate-800">
                      {claim.company_name}
                    </div>
                    <div className="text-xs text-slate-500 font-medium mt-0.5">
                      {claim.dealer_name}
                    </div>
                  </td>
                  <td
                    className="px-5 py-4 cursor-pointer text-right"
                    onClick={() => openPhotoModal(index)}
                  >
                    <div className="font-bold text-slate-800">
                      {claim.claim_part || "-"}
                    </div>
                    <div className="text-xs font-black text-red-500 mt-0.5">
                      {(claim.compensation_amount || 0).toLocaleString()}원
                    </div>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openPhotoModal(index)}
                        className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
                        title="사진 보기"
                      >
                        <ImageIcon size={16} />
                      </button>
                      <button
                        onClick={() => openEditModal(claim)}
                        className="p-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                        title="정보 수정"
                      >
                        <Edit size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ==========================================
          모달 1: 수정 모달 (새 클레임 등록과 100% 동일한 엔터프라이즈 UX)
          ========================================== */}
      {isEditModalOpen && editData && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white rounded-[2rem] w-full max-w-6xl h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* 모달 헤더 */}
            <div className="p-6 sm:px-8 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                  <Edit size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">
                    클레임 상세 정보 수정
                  </h3>
                  <p className="text-xs font-bold text-slate-500 mt-0.5">
                    {editData.vehicle_number} 차량 건
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* 모달 바디 (양분된 레이아웃) */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-50/50 custom-scrollbar">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full items-start">
                {/* 좌측: 기본 정보 */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                    <div className="w-1.5 h-5 bg-blue-600 rounded-full"></div>
                    <h4 className="text-lg font-black text-slate-800">
                      기본 정보{" "}
                      <span className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded-full ml-2">
                        거래서비스지원팀
                      </span>
                    </h4>
                  </div>

                  <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                    <div className="col-span-2 sm:col-span-1">
                      <label className={labelClass}>구분</label>
                      <select
                        value={editData.category || ""}
                        onChange={(e) =>
                          handleEditChange("category", e.target.value)
                        }
                        className={inputClass}
                      >
                        <option value="검수리포트">검수리포트</option>
                        <option value="진단광고">진단광고</option>
                        <option value="기타">기타</option>
                      </select>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className={labelClass}>발생일</label>
                      <input
                        type="date"
                        value={editData.occurrence_date || ""}
                        onChange={(e) => {
                          handleEditChange("occurrence_date", e.target.value);
                          e.target.blur();
                        }}
                        className={inputClass}
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className={labelClass}>차량명</label>
                      <input
                        type="text"
                        value={editData.vehicle_name || ""}
                        onChange={(e) =>
                          handleEditChange("vehicle_name", e.target.value)
                        }
                        className={inputClass}
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className={labelClass}>차량번호</label>
                      <input
                        type="text"
                        value={editData.vehicle_number || ""}
                        onChange={(e) =>
                          handleEditChange("vehicle_number", e.target.value)
                        }
                        className={inputClass}
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className={labelClass}>상사명</label>
                      <input
                        type="text"
                        value={editData.company_name || ""}
                        onChange={(e) =>
                          handleEditChange("company_name", e.target.value)
                        }
                        className={inputClass}
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className={labelClass}>딜러명</label>
                      <input
                        type="text"
                        value={editData.dealer_name || ""}
                        onChange={(e) =>
                          handleEditChange("dealer_name", e.target.value)
                        }
                        className={inputClass}
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className={labelClass}>보상금액(원)</label>
                      <input
                        type="number"
                        value={editData.compensation_amount || ""}
                        onChange={(e) =>
                          handleEditChange(
                            "compensation_amount",
                            e.target.value
                          )
                        }
                        className={inputClass}
                      />
                    </div>

                    {/* iOS 스타일 토글 */}
                    <div className="col-span-2 sm:col-span-1 flex flex-col justify-center">
                      <label className="block text-[13px] font-bold text-slate-700 mb-2.5">
                        환불 여부
                      </label>
                      <div
                        className="flex items-center space-x-3 cursor-pointer"
                        onClick={() =>
                          handleEditChange("is_refunded", !editData.is_refunded)
                        }
                      >
                        <button
                          type="button"
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${
                            editData.is_refunded
                              ? "bg-blue-600"
                              : "bg-slate-300"
                          }`}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${
                              editData.is_refunded
                                ? "translate-x-5"
                                : "translate-x-0.5"
                            }`}
                          />
                        </button>
                        <span
                          className={`text-sm font-bold ${
                            editData.is_refunded
                              ? "text-blue-600"
                              : "text-slate-500"
                          }`}
                        >
                          {editData.is_refunded
                            ? "환불 진행 (On)"
                            : "해당 없음 (Off)"}
                        </span>
                      </div>
                    </div>

                    {editData.is_refunded && (
                      <div className="col-span-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="block text-[13px] font-bold text-blue-600 mb-1.5">
                          반납 주행거리
                        </label>
                        <input
                          type="number"
                          value={editData.return_mileage || ""}
                          onChange={(e) =>
                            handleEditChange("return_mileage", e.target.value)
                          }
                          placeholder="주행거리 입력 (km)"
                          className="w-full h-11 px-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-900 placeholder:text-blue-300 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                        />
                      </div>
                    )}

                    <div className="col-span-2">
                      <label className={labelClass}>상세내용</label>
                      <textarea
                        rows={3}
                        value={editData.details || ""}
                        onChange={(e) =>
                          handleEditChange("details", e.target.value)
                        }
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none resize-none"
                      ></textarea>
                    </div>
                  </div>
                </div>

                {/* 우측: 추가 정보 */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                    <div className="w-1.5 h-5 bg-purple-500 rounded-full"></div>
                    <h4 className="text-lg font-black text-slate-800">
                      추가 정보{" "}
                      <span className="text-xs text-purple-600 font-bold bg-purple-50 px-2 py-1 rounded-full ml-2">
                        진단광고제작팀
                      </span>
                    </h4>
                  </div>

                  <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                    {/* 클레임 처리 상태 (우측 상단) */}
                    <div className="col-span-2 bg-slate-800 p-5 rounded-2xl shadow-inner mb-2">
                      <label className="block text-[13px] font-bold text-slate-300 mb-2">
                        클레임 최종 처리 상태
                      </label>
                      <select
                        value={editData.claim_status || ""}
                        onChange={(e) =>
                          handleEditChange("claim_status", e.target.value)
                        }
                        className="w-full h-11 px-4 bg-slate-700 border-none rounded-xl text-sm font-black text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      >
                        <option value="광고 수정 대기">
                          🔴 광고 수정 대기
                        </option>
                        <option value="수정 불필요">⚪ 수정 불필요</option>
                        <option value="광고 수정 완료">
                          🟢 광고 수정 완료
                        </option>
                      </select>
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                      <label className={labelClass}>권역</label>
                      <input
                        type="text"
                        value={editData.region || ""}
                        onChange={(e) =>
                          handleEditChange("region", e.target.value)
                        }
                        className={inputClass}
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className={labelClass}>센터(지점)</label>
                      <input
                        type="text"
                        value={editData.center || ""}
                        onChange={(e) =>
                          handleEditChange("center", e.target.value)
                        }
                        className={inputClass}
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className={labelClass}>담당자</label>
                      <input
                        type="text"
                        value={editData.manager_name || ""}
                        onChange={(e) =>
                          handleEditChange("manager_name", e.target.value)
                        }
                        className={inputClass}
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className={labelClass}>클레임 부위</label>
                      <input
                        type="text"
                        value={editData.claim_part || ""}
                        onChange={(e) =>
                          handleEditChange("claim_part", e.target.value)
                        }
                        className={inputClass}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className={labelClass}>재발방지책</label>
                      <textarea
                        rows={2}
                        value={editData.preventive_measure || ""}
                        onChange={(e) =>
                          handleEditChange("preventive_measure", e.target.value)
                        }
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none resize-none"
                      ></textarea>
                    </div>
                    <div className="col-span-2">
                      <label className={labelClass}>시스템 개선안</label>
                      <textarea
                        rows={2}
                        value={editData.improvement_plan || ""}
                        onChange={(e) =>
                          handleEditChange("improvement_plan", e.target.value)
                        }
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none resize-none"
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 모달 푸터 */}
            <div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-3 shrink-0">
              <button
                onClick={() => setIsEditModalOpen(false)}
                disabled={isUpdating}
                className="px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleUpdate}
                disabled={isUpdating}
                className={`px-10 py-3 text-white rounded-xl font-bold shadow-md transition-all flex items-center gap-2 ${
                  isUpdating
                    ? "bg-slate-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 hover:-translate-y-0.5"
                }`}
              >
                {isUpdating ? (
                  "저장 중..."
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    수정 내용 반영
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          모달 2: 사진 중심 열람 모달 (유지)
          ========================================== */}
      {isPhotoModalOpen && currentClaim && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[110] flex flex-col items-center justify-center p-4">
          <button
            onClick={handlePrevClaim}
            disabled={currentIndex === 0}
            className={`mb-4 p-2 rounded-full flex flex-col items-center transition-all ${
              currentIndex === 0
                ? "text-slate-800 cursor-not-allowed"
                : "text-slate-400 hover:text-white hover:-translate-y-1"
            }`}
          >
            <ChevronUp size={32} />
            <span className="text-xs font-bold mt-1 tracking-widest uppercase">
              Prev Claim
            </span>
          </button>

          <div className="bg-white rounded-3xl w-full max-w-6xl h-[70vh] flex overflow-hidden shadow-2xl relative">
            <button
              onClick={() => setIsPhotoModalOpen(false)}
              className="absolute top-6 right-6 z-10 p-2 bg-slate-100/50 hover:bg-slate-200/80 backdrop-blur-md rounded-full transition-colors"
            >
              <X size={20} className="text-slate-700" />
            </button>
            <div className="w-[60%] bg-slate-900 relative flex items-center justify-center group">
              {currentClaim.image_urls && currentClaim.image_urls.length > 0 ? (
                <>
                  <img
                    src={currentClaim.image_urls[currentPhotoIndex]}
                    alt="클레임 증빙"
                    className="max-h-full max-w-full object-contain"
                  />
                  {currentClaim.image_urls.length > 1 && (
                    <>
                      <button
                        onClick={handlePrevPhoto}
                        disabled={currentPhotoIndex === 0}
                        className="absolute left-6 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white disabled:opacity-0 transition-all"
                      >
                        <ChevronLeft size={24} />
                      </button>
                      <button
                        onClick={handleNextPhoto}
                        disabled={
                          currentPhotoIndex ===
                          currentClaim.image_urls.length - 1
                        }
                        className="absolute right-6 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white disabled:opacity-0 transition-all"
                      >
                        <ChevronRight size={24} />
                      </button>
                      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-black/60 backdrop-blur-md text-white text-xs font-black rounded-full tracking-widest">
                        {currentPhotoIndex + 1} /{" "}
                        {currentClaim.image_urls.length}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="text-slate-600 font-bold flex flex-col items-center gap-3">
                  <ImageIcon size={48} className="opacity-50" />
                  첨부된 증빙 사진이 없습니다.
                </div>
              )}
            </div>
            <div className="w-[40%] bg-white p-10 overflow-y-auto custom-scrollbar">
              <div className="mb-6">
                {getStatusBadge(currentClaim.claim_status)}
              </div>
              <h3 className="text-3xl font-black text-slate-800 mb-1">
                {currentClaim.vehicle_number}
              </h3>
              <p className="text-slate-500 font-bold mb-8">
                {currentClaim.vehicle_name}
              </p>
              <div className="space-y-6 border-t border-slate-100 pt-6">
                <div>
                  <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">
                    발생 위치 & 담당자
                  </div>
                  <div className="text-sm text-slate-800 font-bold">
                    {currentClaim.region || "-"} / {currentClaim.center || "-"}{" "}
                    <span className="text-slate-400 font-medium ml-1">
                      ({currentClaim.manager_name || "-"})
                    </span>
                  </div>
                  <div className="text-sm text-slate-800 font-bold mt-1">
                    {currentClaim.company_name}{" "}
                    <span className="text-slate-400 font-medium ml-1">
                      ({currentClaim.dealer_name})
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">
                    클레임 부위 및 보상액
                  </div>
                  <div className="text-lg font-black text-red-600">
                    {currentClaim.claim_part || "미지정"}{" "}
                    <span className="text-sm text-slate-500 font-medium ml-2">
                      (보상:{" "}
                      {(currentClaim.compensation_amount || 0).toLocaleString()}
                      원)
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">
                    상세 경위
                  </div>
                  <div className="text-sm text-slate-700 bg-slate-50 p-4 rounded-2xl leading-relaxed border border-slate-100 min-h-[100px]">
                    {currentClaim.details || "상세 내용이 없습니다."}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleNextClaim}
            disabled={currentIndex === claims.length - 1}
            className={`mt-4 p-2 rounded-full flex flex-col items-center transition-all ${
              currentIndex === claims.length - 1
                ? "text-slate-800 cursor-not-allowed"
                : "text-slate-400 hover:text-white hover:translate-y-1"
            }`}
          >
            <span className="text-xs font-bold mb-1 tracking-widest uppercase">
              Next Claim
            </span>
            <ChevronDown size={32} />
          </button>
        </div>
      )}
    </div>
  );
}
