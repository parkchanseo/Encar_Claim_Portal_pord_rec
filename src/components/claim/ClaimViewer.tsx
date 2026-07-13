import React, {
  useState,
  useEffect,
  useRef,
  ClipboardEvent,
  DragEvent,
} from "react";
import {
  Search,
  Filter,
  Edit,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  X,
  CheckCircle2,
  AlertCircle,
  ClipboardCheck,
  Calendar,
  Save,
  Download,
  UploadCloud,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function ClaimViewer() {
  const [claims, setClaims] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // 다중 조건 필터 상태
  const [categoryFilter, setCategoryFilter] = useState("전체");
  const [subjectFilter, setSubjectFilter] = useState("전체");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [managerInfo, setManagerInfo] = useState("");
  const [dealerInfo, setDealerInfo] = useState("");
  const [vehicleInfo, setVehicleInfo] = useState("");
  const [claimPartFilter, setClaimPartFilter] = useState("");

  // 정보 수정 모달 상태
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);

  // 사진 관리 상태
  const [editExistingImages, setEditExistingImages] = useState<string[]>([]);
  const [editNewImageFiles, setEditNewImageFiles] = useState<File[]>([]);
  const [editNewImagePreviews, setEditNewImagePreviews] = useState<string[]>(
    []
  );

  const editDateInputRef = useRef<HTMLInputElement>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  // 상세보기(뷰어) 모달 상태
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
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
      showToast("데이터를 불러오는데 실패했습니다.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const filteredClaims = claims.filter((claim) => {
    const matchCategory =
      categoryFilter === "전체" || claim.category === categoryFilter;
    const matchStart = startDate ? claim.occurrence_date >= startDate : true;
    const matchEnd = endDate ? claim.occurrence_date <= endDate : true;
    const matchManager =
      !managerInfo ||
      claim.region?.includes(managerInfo) ||
      claim.center?.includes(managerInfo) ||
      claim.manager_name?.includes(managerInfo);
    const matchDealer =
      !dealerInfo ||
      claim.company_name?.includes(dealerInfo) ||
      claim.dealer_name?.includes(dealerInfo);
    const matchVehicle =
      !vehicleInfo ||
      claim.vehicle_name?.includes(vehicleInfo) ||
      claim.vehicle_number?.includes(vehicleInfo);
    const matchPart =
      !claimPartFilter || claim.claim_part?.includes(claimPartFilter);

    return (
      matchCategory &&
      matchStart &&
      matchEnd &&
      matchManager &&
      matchDealer &&
      matchVehicle &&
      matchPart
    );
  });

  const handleDownloadExcel = () => {
    if (filteredClaims.length === 0)
      return showToast("다운로드할 데이터가 없습니다.", "error");
    const headers = [
      "상태",
      "구분",
      "발생일",
      "접수일",
      "차량번호",
      "차량명",
      "상사명",
      "딜러명",
      "권역",
      "지점",
      "담당자",
      "클레임부위",
      "엔카보상액",
      "딜러보상액",
      "총보상액",
      "상세내용",
    ];
    const csvData = filteredClaims.map((c) => [
      c.claim_status,
      c.category,
      c.occurrence_date,
      new Date(c.created_at).toLocaleDateString(),
      c.vehicle_number,
      c.vehicle_name,
      c.company_name,
      c.dealer_name,
      c.region || "-",
      c.center || "-",
      c.manager_name || "-",
      c.claim_part || "-",
      c.encar_compensation || 0,
      c.dealer_compensation || 0,
      c.total_compensation || 0,
      (c.details || "").replace(/\n/g, " "),
    ]);
    const csvContent =
      "\uFEFF" +
      [headers.join(","), ...csvData.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `클레임_진행현황_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 💡 사진 데이터를 안전하게 배열로 변환하는 마법의 함수 (엑박 방어 로직)
  const getSafeImageUrls = (imageUrlsData: any) => {
    if (!imageUrlsData) return [];
    if (Array.isArray(imageUrlsData)) return imageUrlsData;
    if (typeof imageUrlsData === "string") {
      try {
        return JSON.parse(imageUrlsData);
      } catch (e) {
        return [imageUrlsData];
      }
    }
    return [];
  };

  const openEditModal = (claim: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditData({ ...claim });
    setEditExistingImages(getSafeImageUrls(claim.image_urls));
    setEditNewImageFiles([]);
    setEditNewImagePreviews([]);
    setIsEditModalOpen(true);
  };

  const handleEditChange = (field: string, value: any) =>
    setEditData((prev: any) => ({ ...prev, [field]: value }));
  const handleEditAmountChange = (
    field: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, "");
    handleEditChange(field, rawValue);
  };
  const totalEditCompensation =
    (Number(editData?.encar_compensation) || 0) +
    (Number(editData?.dealer_compensation) || 0);
  const handleEditDetailsChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    handleEditChange("details", e.target.value);
    if (editTextareaRef.current) {
      editTextareaRef.current.style.height = "auto";
      editTextareaRef.current.style.height = `${editTextareaRef.current.scrollHeight}px`;
    }
  };

  const handleEditAddImages = (files: FileList | File[]) => {
    const newFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image/")
    );
    const totalCurrentImages =
      editExistingImages.length + editNewImageFiles.length;
    if (totalCurrentImages + newFiles.length > 10)
      return showToast("사진은 총 10장까지만 첨부할 수 있습니다.", "error");
    setEditNewImageFiles((prev) => [...prev, ...newFiles]);
    setEditNewImagePreviews((prev) => [
      ...prev,
      ...newFiles.map((f) => URL.createObjectURL(f)),
    ]);
  };

  const handleEditDrop = (e: DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) handleEditAddImages(e.dataTransfer.files);
  };
  const handleEditPaste = (e: ClipboardEvent) => {
    const items = e.clipboardData.items;
    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        const file = items[i].getAsFile();
        if (file) files.push(file);
      }
    }
    if (files.length > 0) {
      e.preventDefault();
      handleEditAddImages(files);
    }
  };

  const handleUpdate = async () => {
    if (!editData) return;
    setIsUpdating(true);
    try {
      let finalImageUrls = [...editExistingImages];
      if (editNewImageFiles.length > 0) {
        for (const file of editNewImageFiles) {
          const filePath = `${Date.now()}_${Math.random()
            .toString(36)
            .substring(7)}.${file.name.split(".").pop()}`;
          await supabase.storage.from("claim_images").upload(filePath, file);
          finalImageUrls.push(
            supabase.storage.from("claim_images").getPublicUrl(filePath).data
              .publicUrl
          );
        }
      }
      const { error } = await supabase
        .from("claim_reports")
        .update({
          category: editData.category,
          occurrence_date: editData.occurrence_date,
          vehicle_name: editData.vehicle_name,
          vehicle_number: editData.vehicle_number,
          company_name: editData.company_name,
          dealer_name: editData.dealer_name,
          encar_compensation: Number(editData.encar_compensation) || 0,
          dealer_compensation: Number(editData.dealer_compensation) || 0,
          total_compensation: totalEditCompensation,
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
          image_urls: finalImageUrls,
        })
        .eq("id", editData.id);
      if (error) throw error;
      showToast("클레임 정보가 성공적으로 수정되었습니다.");
      setIsEditModalOpen(false);
      fetchClaims();
    } catch (error) {
      showToast("수정 중 오류가 발생했습니다.", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const openPhotoModal = (index: number) => {
    setCurrentIndex(index);
    setCurrentPhotoIndex(0);
    setIsPhotoModalOpen(true);
  };

  const currentClaim = filteredClaims[currentIndex];
  // 💡 모달 창 진입 시 사진 배열 안전하게 가져오기
  const safeCurrentImages = getSafeImageUrls(currentClaim?.image_urls);

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentPhotoIndex((prev) => Math.max(0, prev - 1));
  };
  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentPhotoIndex((prev) =>
      Math.min(safeCurrentImages.length - 1, prev + 1)
    );
  };
  const handlePrevClaim = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setCurrentPhotoIndex(0);
    }
  };
  const handleNextClaim = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentIndex < filteredClaims.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setCurrentPhotoIndex(0);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "광고 수정 대기")
      return (
        <span className="px-3 py-1.5 bg-red-100 text-red-600 rounded-lg text-xs font-black border border-red-200 shadow-sm">
          {status}
        </span>
      );
    if (status === "광고 수정 완료")
      return (
        <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-black border border-emerald-200 shadow-sm">
          {status}
        </span>
      );
    return (
      <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-black border border-slate-200 shadow-sm">
        {status}
      </span>
    );
  };

  const inputClass =
    "w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none";
  const filterLabelClass =
    "block text-[12px] font-black text-slate-500 mb-1.5 tracking-wide";
  const labelClass = "block text-[13px] font-black text-slate-700 mb-1.5";

  return (
    <div className="relative animate-in fade-in duration-500 pb-20">
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

      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <ClipboardCheck size={24} className="text-blue-600" /> 클레임 진행
            현황
          </h2>
          <p className="text-[11px] font-bold text-slate-500 mt-1 ml-8">
            접수된 클레임 내역 조회 및 다중 조건 통합 검색
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 mb-8 overflow-hidden transition-all">
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="w-full px-6 py-5 flex justify-between items-center bg-white hover:bg-slate-50 transition-colors focus:outline-none"
        >
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-blue-600" />
            <h3 className="text-sm font-black text-slate-800 tracking-tight">
              다중 조건 필터 검색
            </h3>
            {!isFilterOpen && (
              <span className="ml-2 text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                클릭하여 열기
              </span>
            )}
          </div>
          <div
            className={`text-slate-400 transition-transform duration-300 ${
              isFilterOpen ? "rotate-180 text-blue-600" : ""
            }`}
          >
            <ChevronDown size={18} />
          </div>
        </button>

        {isFilterOpen && (
          <div className="p-6 md:p-8 pt-0 border-t border-slate-100 animate-in slide-in-from-top-4 fade-in duration-300 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-x-6 gap-y-5">
              <div className="xl:col-span-1">
                <label className={filterLabelClass}>클레임 구분</label>
                <div className="relative">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className={`${inputClass} appearance-none cursor-pointer`}
                  >
                    <option value="전체">전체 (All)</option>
                    <option value="검수리포트">검수리포트</option>
                    <option value="진단광고">진단광고</option>
                    <option value="차량결함">차량결함</option>
                    <option value="서비스">서비스</option>
                    <option value="기타">기타</option>
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                </div>
              </div>

              <div className="xl:col-span-1">
                <label className={filterLabelClass}>
                  보상 주체 (금액 보기)
                </label>
                <div className="relative">
                  <select
                    value={subjectFilter}
                    onChange={(e) => setSubjectFilter(e.target.value)}
                    className={`${inputClass} appearance-none cursor-pointer font-black text-blue-600 bg-blue-50/50 border-blue-200`}
                  >
                    <option value="전체">전체 총액 보기</option>
                    <option value="엔카">엔카 보상액 보기</option>
                    <option value="딜러">딜러 보상액 보기</option>
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none"
                  />
                </div>
              </div>

              <div className="xl:col-span-2">
                <label className={filterLabelClass}>발생일 기간</label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={inputClass}
                  />
                  <span className="text-slate-300 font-bold">-</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="xl:col-span-1">
                <label className={filterLabelClass}>담당자 정보</label>
                <input
                  type="text"
                  placeholder="권역 / 지점 / 이름"
                  value={managerInfo}
                  onChange={(e) => setManagerInfo(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="xl:col-span-1">
                <label className={filterLabelClass}>딜러 정보</label>
                <input
                  type="text"
                  placeholder="상사명 / 딜러명"
                  value={dealerInfo}
                  onChange={(e) => setDealerInfo(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="xl:col-span-1">
                <label className={filterLabelClass}>차량 정보</label>
                <input
                  type="text"
                  placeholder="차종 / 차량번호"
                  value={vehicleInfo}
                  onChange={(e) => setVehicleInfo(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="xl:col-span-1">
                <label className={filterLabelClass}>클레임 부위</label>
                <input
                  type="text"
                  placeholder="예: 휀다"
                  value={claimPartFilter}
                  onChange={(e) => setClaimPartFilter(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-8 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-base font-black text-slate-800">접수 목록</h3>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100 shadow-sm">
              총 {filteredClaims.length}건
            </span>
            <button
              onClick={handleDownloadExcel}
              className="flex items-center gap-2 px-4 py-1.5 bg-slate-800 text-white rounded-full text-xs font-bold hover:bg-slate-700 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
            >
              <Download size={14} /> 엑셀 다운로드
            </button>
          </div>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-200">
                <th className="px-8 py-4 text-[13px] font-black text-slate-500 tracking-wider">
                  상태
                </th>
                <th className="px-6 py-4 text-[13px] font-black text-slate-500 tracking-wider">
                  구분
                </th>
                <th className="px-6 py-4 text-[13px] font-black text-slate-500 tracking-wider">
                  발생일/접수일
                </th>
                <th className="px-6 py-4 text-[13px] font-black text-slate-500 tracking-wider">
                  차량정보
                </th>
                <th className="px-6 py-4 text-[13px] font-black text-slate-500 tracking-wider">
                  딜러정보
                </th>
                <th className="px-6 py-4 text-[13px] font-black text-slate-500 tracking-wider">
                  담당자
                </th>
                <th className="px-6 py-4 text-[13px] font-black text-slate-500 tracking-wider text-right">
                  부위 / 금액
                </th>
                <th className="px-6 py-4 text-[13px] font-black text-slate-500 tracking-wider text-center">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-8 py-16 text-center text-slate-400 font-bold"
                  >
                    데이터를 불러오는 중입니다...
                  </td>
                </tr>
              ) : filteredClaims.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-8 py-16 text-center text-slate-400 font-bold"
                  >
                    조건에 맞는 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredClaims.map((claim, index) => {
                  let displayAmt = claim.total_compensation || 0;
                  let amtLabel = "총액";
                  if (subjectFilter === "엔카") {
                    displayAmt = claim.encar_compensation || 0;
                    amtLabel = "엔카";
                  } else if (subjectFilter === "딜러") {
                    displayAmt = claim.dealer_compensation || 0;
                    amtLabel = "딜러";
                  }

                  return (
                    <tr
                      key={claim.id}
                      onClick={() => openPhotoModal(index)}
                      className="hover:bg-blue-50/30 transition-colors cursor-pointer group"
                    >
                      <td className="px-8 py-5">
                        {getStatusBadge(claim.claim_status)}
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-[12px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                          {claim.category}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-[14px] font-black text-slate-800 mb-0.5">
                          발생: {claim.occurrence_date}
                        </div>
                        <div className="text-[12px] text-slate-400 font-medium">
                          접수:{" "}
                          {new Date(claim.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-[14px] font-black text-slate-800 mb-0.5 group-hover:text-blue-600 transition-colors">
                          {claim.vehicle_number}
                        </div>
                        <div className="text-[13px] font-bold text-slate-500">
                          {claim.vehicle_name}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-[13px] text-slate-600 mb-0.5">
                          {claim.company_name}
                        </div>
                        <div className="text-[12px] text-slate-500">
                          {claim.dealer_name} 딜러
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-[14px] font-black text-slate-700 mb-0.5">
                          {claim.manager_name
                            ? `${claim.manager_name} 매니저`
                            : "-"}
                        </div>
                        <div className="text-[12px] font-bold text-slate-400">
                          {claim.region} {claim.center && `/ ${claim.center}`}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="text-[13px] font-bold text-slate-500 mb-0.5">
                          {claim.claim_part || "-"}
                        </div>
                        <div className="text-[15px] font-black text-red-600 flex items-center justify-end gap-1.5">
                          <span className="text-[10px] bg-red-50 text-red-500 px-1.5 py-0.5 rounded leading-none">
                            {amtLabel}
                          </span>
                          {displayAmt.toLocaleString()}원
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <button
                          onClick={(e) => openEditModal(claim, e)}
                          className="p-2.5 text-slate-400 bg-slate-100 group-hover:text-blue-600 hover:!bg-blue-600 hover:!text-white rounded-xl transition-all shadow-sm"
                          title="정보 수정"
                        >
                          <Edit size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isEditModalOpen && editData && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-6"
          onPaste={handleEditPaste}
        >
          <div className="bg-white rounded-[2rem] w-full max-w-[1400px] h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
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

            <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-50/50 custom-scrollbar">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6 h-full">
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                    <div className="w-1.5 h-5 bg-blue-600 rounded-full"></div>
                    <h4 className="text-lg font-black text-slate-800">
                      기본 정보{" "}
                      <span className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded-full ml-2">
                        수정 가능
                      </span>
                    </h4>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="relative">
                      <label className={labelClass}>구분</label>
                      <div
                        onClick={() =>
                          setIsEditCategoryOpen(!isEditCategoryOpen)
                        }
                        className={`${inputClass} flex items-center justify-between cursor-pointer select-none`}
                      >
                        <span>{editData.category}</span>
                        <ChevronDown
                          size={16}
                          className={`text-slate-400 transition-transform ${
                            isEditCategoryOpen ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                      {isEditCategoryOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-10 overflow-hidden animate-in fade-in">
                          {[
                            "검수리포트",
                            "진단광고",
                            "차량결함",
                            "서비스",
                            "기타",
                          ].map((cat) => (
                            <div
                              key={cat}
                              onClick={() => {
                                handleEditChange("category", cat);
                                setIsEditCategoryOpen(false);
                              }}
                              className="px-4 py-3 text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 cursor-pointer transition-colors"
                            >
                              {cat}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className={labelClass}>발생일</label>
                      <div className="relative">
                        <input
                          type="date"
                          ref={editDateInputRef}
                          value={editData.occurrence_date || ""}
                          onChange={(e) => {
                            handleEditChange("occurrence_date", e.target.value);
                            editDateInputRef.current?.blur();
                          }}
                          className={`${inputClass} appearance-none [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer relative z-10 bg-transparent`}
                        />
                        <Calendar
                          size={16}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-0"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
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
                    <div>
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
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
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
                    <div>
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
                  </div>
                  <div className="pt-2 border-t border-slate-100">
                    <label className="block text-[13px] font-black text-red-600 mb-2">
                      보상금액 (원)
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">
                          엔카 보상액
                        </label>
                        <input
                          type="text"
                          value={
                            editData.encar_compensation
                              ? Number(
                                  editData.encar_compensation
                                ).toLocaleString()
                              : ""
                          }
                          onChange={(e) =>
                            handleEditAmountChange("encar_compensation", e)
                          }
                          placeholder="0"
                          className="w-full h-11 pl-4 pr-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">
                          딜러 보상액
                        </label>
                        <input
                          type="text"
                          value={
                            editData.dealer_compensation
                              ? Number(
                                  editData.dealer_compensation
                                ).toLocaleString()
                              : ""
                          }
                          onChange={(e) =>
                            handleEditAmountChange("dealer_compensation", e)
                          }
                          placeholder="0"
                          className="w-full h-11 pl-4 pr-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
                        />
                      </div>
                      <div className="relative">
                        <label className="block text-[11px] font-black text-red-500 mb-1">
                          총 보상액
                        </label>
                        <input
                          type="text"
                          readOnly
                          value={
                            totalEditCompensation > 0
                              ? totalEditCompensation.toLocaleString()
                              : "0"
                          }
                          className="w-full h-11 pl-4 pr-6 bg-red-50/50 border border-red-200 rounded-xl text-base font-black text-red-700 outline-none cursor-not-allowed"
                        />
                        <span className="absolute right-3 top-[28px] font-black text-red-400 text-xs">
                          원
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6 pt-2 border-t border-slate-100">
                    <div>
                      <label className={labelClass}>환불 여부</label>
                      <div className="h-11 flex items-center px-4 bg-slate-50 border border-slate-200 rounded-xl">
                        <button
                          type="button"
                          onClick={() =>
                            handleEditChange(
                              "is_refunded",
                              !editData.is_refunded
                            )
                          }
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-300 ${
                            editData.is_refunded
                              ? "bg-blue-600"
                              : "bg-slate-300"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${
                              editData.is_refunded
                                ? "translate-x-4"
                                : "translate-x-0.5"
                            }`}
                          />
                        </button>
                        <span
                          className={`ml-3 text-[13px] font-bold ${
                            editData.is_refunded
                              ? "text-blue-600"
                              : "text-slate-500"
                          }`}
                        >
                          {editData.is_refunded ? "환불 진행" : "해당 없음"}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>반납 주행거리</label>
                      {editData.is_refunded ? (
                        <div className="animate-in fade-in duration-300">
                          <input
                            type="number"
                            value={editData.return_mileage || ""}
                            onChange={(e) =>
                              handleEditChange("return_mileage", e.target.value)
                            }
                            placeholder="주행거리 (km)"
                            className={inputClass}
                          />
                        </div>
                      ) : (
                        <div className="h-11 bg-slate-50 border border-slate-100 rounded-xl flex items-center px-4 text-slate-400 text-[13px] font-bold select-none">
                          해당 없음
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="pt-2">
                    <label className={labelClass}>상세내용 및 경위</label>
                    <textarea
                      ref={editTextareaRef}
                      value={editData.details || ""}
                      onChange={handleEditDetailsChange}
                      style={{ minHeight: "48px", maxHeight: "200px" }}
                      className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none resize-none overflow-y-auto custom-scrollbar leading-relaxed"
                    />
                  </div>
                </div>

                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6 h-full">
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                    <div className="w-1.5 h-5 bg-purple-500 rounded-full"></div>
                    <h4 className="text-lg font-black text-slate-800">
                      추가 정보{" "}
                      <span className="text-xs text-purple-600 font-bold bg-purple-50 px-2 py-1 rounded-full ml-2">
                        진단광고제작팀
                      </span>
                    </h4>
                  </div>
                  <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100 mb-4">
                    <label className="block text-[13px] font-black text-indigo-800 mb-2">
                      클레임 최종 처리 상태 설정
                    </label>
                    <select
                      value={editData.claim_status || ""}
                      onChange={(e) =>
                        handleEditChange("claim_status", e.target.value)
                      }
                      className="w-full h-12 px-4 bg-white border border-indigo-200 rounded-xl text-sm font-black text-indigo-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-sm transition-all cursor-pointer"
                    >
                      <option value="광고 수정 대기">🔴 광고 수정 대기</option>
                      <option value="수정 불필요">⚪ 수정 불필요</option>
                      <option value="광고 수정 완료">🟢 광고 수정 완료</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className={labelClass}>권역</label>
                      <input
                        type="text"
                        value={editData.region || ""}
                        onChange={(e) =>
                          handleEditChange("region", e.target.value)
                        }
                        className={inputClass}
                        placeholder="예: 서울"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>센터(지점)</label>
                      <input
                        type="text"
                        value={editData.center || ""}
                        onChange={(e) =>
                          handleEditChange("center", e.target.value)
                        }
                        className={inputClass}
                        placeholder="예: 오토플렉스"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className={labelClass}>담당자</label>
                      <input
                        type="text"
                        value={editData.manager_name || ""}
                        onChange={(e) =>
                          handleEditChange("manager_name", e.target.value)
                        }
                        className={inputClass}
                        placeholder="담당 CAM"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>부위</label>
                      <input
                        type="text"
                        value={editData.claim_part || ""}
                        onChange={(e) =>
                          handleEditChange("claim_part", e.target.value)
                        }
                        className={inputClass}
                        placeholder="예: 운전석 휀다"
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>재발 방지책</label>
                    <textarea
                      rows={2}
                      value={editData.preventive_measure || ""}
                      onChange={(e) =>
                        handleEditChange("preventive_measure", e.target.value)
                      }
                      className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none resize-none"
                    ></textarea>
                  </div>
                  <div>
                    <label className={labelClass}>시스템 개선안</label>
                    <textarea
                      rows={2}
                      value={editData.improvement_plan || ""}
                      onChange={(e) =>
                        handleEditChange("improvement_plan", e.target.value)
                      }
                      className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none resize-none"
                    ></textarea>
                  </div>
                </div>

                <div className="col-span-1 lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                  <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-5 bg-emerald-500 rounded-full"></div>
                      <h4 className="text-lg font-black text-slate-800">
                        사진 관리 및 추가 첨부
                      </h4>
                    </div>
                    <span className="text-[11px] font-black px-3 py-1 rounded-md bg-blue-50 text-blue-600 border border-blue-100">
                      총 {editExistingImages.length + editNewImageFiles.length}{" "}
                      / 10장
                    </span>
                  </div>
                  <div className="flex flex-col lg:flex-row gap-8">
                    <div
                      onDrop={handleEditDrop}
                      onDragOver={(e) => e.preventDefault()}
                      className="lg:w-1/3 min-h-[200px] border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-6 bg-slate-50 hover:bg-blue-50/50 hover:border-blue-300 transition-all cursor-pointer group"
                      onClick={() =>
                        document.getElementById("editFileInput")?.click()
                      }
                    >
                      <div className="w-14 h-14 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <UploadCloud className="text-blue-500" size={28} />
                      </div>
                      <h4 className="text-sm font-black text-slate-700 mb-1">
                        드래그 앤 드롭 또는 복사(Ctrl+V)
                      </h4>
                      <p className="text-[11px] text-slate-400 font-bold">
                        최대 10장 업로드 가능
                      </p>
                      <input
                        id="editFileInput"
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          e.target.files && handleEditAddImages(e.target.files)
                        }
                      />
                    </div>
                    <div className="lg:w-2/3 flex-1 flex gap-3 overflow-x-auto custom-scrollbar pb-2">
                      {editExistingImages.map((url, idx) => (
                        <div
                          key={`exist-${idx}`}
                          className="relative group shrink-0 w-[150px] h-[150px]"
                        >
                          <img
                            src={url}
                            alt={`exist-${idx}`}
                            className="w-full h-full object-cover rounded-xl border border-slate-200"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditExistingImages((prev) =>
                                  prev.filter((_, i) => i !== idx)
                                );
                              }}
                              className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 hover:scale-110"
                            >
                              <X size={16} />
                            </button>
                          </div>
                          <span className="absolute bottom-2 left-2 text-[9px] bg-black/60 text-white px-2 py-0.5 rounded-sm">
                            기존 사진
                          </span>
                        </div>
                      ))}
                      {editNewImagePreviews.map((url, idx) => (
                        <div
                          key={`new-${idx}`}
                          className="relative group shrink-0 w-[150px] h-[150px]"
                        >
                          <img
                            src={url}
                            alt={`new-${idx}`}
                            className="w-full h-full object-cover rounded-xl border-2 border-emerald-400"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditNewImageFiles((prev) =>
                                  prev.filter((_, i) => i !== idx)
                                );
                                setEditNewImagePreviews((prev) =>
                                  prev.filter((_, i) => i !== idx)
                                );
                              }}
                              className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 hover:scale-110"
                            >
                              <X size={16} />
                            </button>
                          </div>
                          <span className="absolute bottom-2 left-2 text-[9px] bg-emerald-500 text-white px-2 py-0.5 rounded-sm">
                            추가됨
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

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
                    <Save size={18} /> 수정 내용 반영
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 💡 상세보기(뷰어) 모달 */}
      {isPhotoModalOpen && currentClaim && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 md:p-8 animate-in fade-in duration-200">
          {/* 💡 이전 클레임 화살표 (위쪽) - Z-index 상향 조치 */}
          <button
            onClick={handlePrevClaim}
            disabled={currentIndex === 0}
            className={`absolute top-4 sm:top-6 left-1/2 -translate-x-1/2 p-3 bg-white/20 backdrop-blur-md rounded-full flex flex-col items-center transition-all z-[150] ${
              currentIndex === 0
                ? "opacity-0 pointer-events-none"
                : "text-white hover:bg-white/40 hover:-translate-y-2"
            }`}
            title="이전 글로 이동"
          >
            <ChevronUp size={28} />
          </button>

          <div className="bg-white w-full max-w-[1400px] h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col relative mt-6 mb-6">
            <button
              onClick={() => setIsPhotoModalOpen(false)}
              className="absolute top-6 right-6 z-[120] p-2 bg-slate-100/50 hover:bg-red-50 hover:text-red-600 backdrop-blur-md rounded-full transition-colors"
            >
              <X size={24} />
            </button>

            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
              <div className="lg:w-[60%] h-[50vh] lg:h-full bg-slate-900 relative flex items-center justify-center group">
                {safeCurrentImages && safeCurrentImages.length > 0 ? (
                  <>
                    <img
                      src={safeCurrentImages[currentPhotoIndex]}
                      alt="증빙"
                      className="max-w-full max-h-full object-contain"
                    />

                    {safeCurrentImages.length > 1 && (
                      <>
                        <button
                          onClick={handlePrevPhoto}
                          disabled={currentPhotoIndex === 0}
                          className="absolute left-6 p-4 bg-black/40 hover:bg-black/70 text-white rounded-full backdrop-blur-md disabled:opacity-0 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <ChevronLeft size={32} />
                        </button>
                        <button
                          onClick={handleNextPhoto}
                          disabled={
                            currentPhotoIndex === safeCurrentImages.length - 1
                          }
                          className="absolute right-6 p-4 bg-black/40 hover:bg-black/70 text-white rounded-full backdrop-blur-md disabled:opacity-0 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <ChevronRight size={32} />
                        </button>
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-5 py-2 bg-black/60 text-white text-sm font-bold rounded-full backdrop-blur-md">
                          {currentPhotoIndex + 1} / {safeCurrentImages.length}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="text-slate-500 font-bold text-lg flex flex-col items-center gap-4">
                    <ImageIcon size={48} className="opacity-30" /> 사진 없음
                  </div>
                )}
              </div>

              <div className="lg:w-[40%] bg-white flex flex-col h-[40vh] lg:h-full border-t lg:border-t-0 lg:border-l border-slate-100">
                <div className="p-8 lg:p-10 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                  <div className="pb-4 border-b border-slate-100">
                    <div className="mb-4">
                      {getStatusBadge(currentClaim.claim_status)}
                    </div>
                    <h3 className="text-3xl font-black text-slate-800 mb-1">
                      {currentClaim.vehicle_number}
                    </h3>
                    <p className="text-slate-500 font-bold mb-4">
                      {currentClaim.vehicle_name}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-[13px] font-bold text-slate-600">
                      <span className="px-2.5 py-1.5 bg-slate-100 rounded-lg">
                        {currentClaim.company_name}
                      </span>
                      <span className="px-2.5 py-1.5 bg-slate-100 rounded-lg">
                        {currentClaim.dealer_name} 딜러
                      </span>
                      {currentClaim.submitter_name && (
                        <span className="px-2.5 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
                          접수: {currentClaim.submitter_name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 shadow-sm">
                    <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-4">
                      핵심 지표 요약
                    </div>
                    <div className="grid grid-cols-2 gap-y-5 gap-x-4">
                      <div className="col-span-2 flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100">
                        <span className="text-[13px] font-bold text-slate-500">
                          클레임 부위
                        </span>
                        <span className="font-black text-slate-800 text-[14px]">
                          {currentClaim.claim_part || "미지정"}
                        </span>
                      </div>

                      <div className="col-span-2 grid grid-cols-3 gap-2 mt-1">
                        <div className="bg-white border border-slate-100 p-2.5 rounded-xl text-center shadow-sm">
                          <div className="text-[10px] font-bold text-slate-400 mb-1">
                            엔카 보상액
                          </div>
                          <div className="text-[13px] font-black text-slate-700">
                            {currentClaim.encar_compensation?.toLocaleString() ||
                              0}
                            원
                          </div>
                        </div>
                        <div className="bg-white border border-slate-100 p-2.5 rounded-xl text-center shadow-sm">
                          <div className="text-[10px] font-bold text-slate-400 mb-1">
                            딜러 보상액
                          </div>
                          <div className="text-[13px] font-black text-slate-700">
                            {currentClaim.dealer_compensation?.toLocaleString() ||
                              0}
                            원
                          </div>
                        </div>
                        <div className="bg-red-50 border border-red-100 p-2.5 rounded-xl text-center shadow-sm">
                          <div className="text-[10px] font-black text-red-500 mb-1">
                            총 보상액
                          </div>
                          <div className="text-[14px] font-black text-red-600">
                            {currentClaim.total_compensation?.toLocaleString() ||
                              0}
                            원
                          </div>
                        </div>
                      </div>

                      <div className="col-span-2 pt-4 border-t border-slate-200">
                        <p className="text-[12px] font-bold text-slate-500 mb-1.5">
                          진단광고제작팀 담당자
                        </p>
                        <p className="font-bold text-slate-800 text-sm flex items-center gap-2">
                          {currentClaim.region || "미지정"} /{" "}
                          {currentClaim.center || "미지정"}
                          <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md text-xs">
                            {currentClaim.manager_name
                              ? `${currentClaim.manager_name} 매니저`
                              : "미지정"}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-orange-50/50 rounded-2xl p-5 border border-orange-100 shadow-sm">
                    <div className="flex items-center gap-2 text-[11px] font-black text-orange-600 uppercase tracking-wider mb-3">
                      <AlertCircle size={14} /> 상세 경위
                    </div>
                    <div className="text-sm text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">
                      {currentClaim.details || "내용 없음"}
                    </div>
                  </div>

                  <div className="bg-indigo-50/40 rounded-2xl p-5 border border-indigo-100 shadow-sm">
                    <div className="flex items-center gap-2 text-[11px] font-black text-indigo-600 uppercase tracking-wider mb-4">
                      <CheckCircle2 size={14} /> 재발 방지 및 개선안
                    </div>
                    <div className="space-y-5">
                      <div>
                        <p className="text-[12px] font-bold text-indigo-400 mb-1.5">
                          재발 방지책
                        </p>
                        <p className="text-sm text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">
                          {currentClaim.preventive_measure || (
                            <span className="text-slate-400 italic">
                              미등록
                            </span>
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-[12px] font-bold text-indigo-400 mb-1.5">
                          시스템 개선안
                        </p>
                        <p className="text-sm text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">
                          {currentClaim.improvement_plan || (
                            <span className="text-slate-400 italic">
                              미등록
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleNextClaim}
            disabled={currentIndex === filteredClaims.length - 1}
            className={`absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 p-3 bg-white/20 backdrop-blur-md rounded-full flex flex-col items-center transition-all z-[150] ${
              currentIndex === filteredClaims.length - 1
                ? "opacity-0 pointer-events-none"
                : "text-white hover:bg-white/40 hover:translate-y-2"
            }`}
            title="다음 글로 이동"
          >
            <ChevronDown size={28} />
          </button>
        </div>
      )}
    </div>
  );
}
