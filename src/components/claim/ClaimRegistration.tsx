import React, {
  useState,
  useRef,
  ClipboardEvent,
  DragEvent,
  useEffect,
} from "react";
import { supabase } from "../../lib/supabase";
import {
  CheckCircle2,
  AlertCircle,
  X,
  UploadCloud,
  ChevronDown,
  Save,
  Edit,
  Calendar,
  FileSpreadsheet, // 💡 엑셀 아이콘 추가
  Download, // 💡 다운로드 아이콘 추가
} from "lucide-react";

export default function ClaimRegistration() {
  const [submitterNameForDB, setSubmitterNameForDB] = useState("");
  // 💡 카테고리 초기값을 설정합니다 (5개 중 택 1)
  const [category, setCategory] = useState("검수리포트");
  const [occurrenceDate, setOccurrenceDate] = useState("");
  const [vehicleName, setVehicleName] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [dealerName, setDealerName] = useState("");

  // 💡 금액 처리를 위한 상태 분리 (엔카, 딜러)
  const [encarCompensation, setEncarCompensation] = useState("");
  const [dealerCompensation, setDealerCompensation] = useState("");

  const [isRefunded, setIsRefunded] = useState(false);
  const [returnMileage, setReturnMileage] = useState("");
  const [details, setDetails] = useState("");

  const [region, setRegion] = useState("");
  const [center, setCenter] = useState("");
  const [managerName, setManagerName] = useState("");
  const [claimPart, setClaimPart] = useState("");
  const [preventiveMeasure, setPreventiveMeasure] = useState("");
  const [improvementPlan, setImprovementPlan] = useState("");

  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  // 💡 엑셀 모달 창을 열고 닫는 스위치
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dateInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user && user.user_metadata) {
        setSubmitterNameForDB(
          `${user.user_metadata.team || ""} ${user.user_metadata.name || ""}`
        );
      }
    };
    fetchUser();
  }, []);

  const showToast = (
    message: string,
    type: "success" | "error" = "success"
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddImages = (files: FileList | File[]) => {
    const newFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image/")
    );
    if (imageFiles.length + newFiles.length > 10)
      return showToast("사진은 최대 10장까지만 첨부할 수 있습니다.", "error");
    setImageFiles((prev) => [...prev, ...newFiles]);
    setImagePreviews((prev) => [
      ...prev,
      ...newFiles.map((f) => URL.createObjectURL(f)),
    ]);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) handleAddImages(e.dataTransfer.files);
  };

  const handlePaste = (e: ClipboardEvent) => {
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
      handleAddImages(files);
    } else if (e.clipboardData.files.length > 0) {
      e.preventDefault();
      handleAddImages(e.clipboardData.files);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // 💡 숫자만 골라내는 마법의 함수
  const handleAmountChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, "");
    setter(rawValue);
  };

  // 💡 실시간 총액 계산 (엔카 + 딜러)
  const totalCompensation =
    (Number(encarCompensation) || 0) + (Number(dealerCompensation) || 0);

  const handleDetailsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDetails(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  // 💡 엑셀 양식 다운로드 함수
  const downloadExcelTemplate = () => {
    // 엑셀 첫 줄에 들어갈 제목들 (작성자, 작성일 제외)
    const headers =
      "구분,발생일,차량명,차량번호,상사명,딜러명,엔카보상액,딜러보상액,환불여부,반납주행거리,상세경위\n";
    // 한글이 깨지지 않게 방어막(\uFEFF)을 쳐줍니다.
    const blob = new Blob(["\uFEFF" + headers], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "클레임_대량등록_양식.csv";
    link.click();
    showToast("엑셀 양식이 다운로드되었습니다.");
  };

  // 💡 엑셀 업로드 가짜(Mock) 함수 (추후 실제 라이브러리 연동 필요)
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // 업로드하는 순간 시스템이 현재 시간과 로그인한 사람 정보를 낚아챕니다.
      console.log("자동 입력될 작성자:", submitterNameForDB);
      console.log("자동 입력될 업로드 시간:", new Date().toISOString());

      showToast("엑셀 데이터가 성공적으로 업로드되었습니다!");
      setIsExcelModalOpen(false); // 업로드 성공 시 모달 창 닫기
    }
  };

  const handleSubmit = async () => {
    if (!category || !occurrenceDate || !vehicleNumber)
      return showToast("구분, 발생일, 차량번호는 필수입니다.", "error");
    setIsSubmitting(true);
    try {
      let uploadedImageUrls: string[] = [];
      if (imageFiles.length > 0) {
        for (const file of imageFiles) {
          const filePath = `${Date.now()}_${Math.random()
            .toString(36)
            .substring(7)}.${file.name.split(".").pop()}`;
          await supabase.storage.from("claim_images").upload(filePath, file);
          uploadedImageUrls.push(
            supabase.storage.from("claim_images").getPublicUrl(filePath).data
              .publicUrl
          );
        }
      }

      // 💡 DB에 저장될 때 3개의 금액 방으로 나뉘어 들어갑니다. (Supabase 테이블 수정 필요!)
      const { error } = await supabase.from("claim_reports").insert([
        {
          submitter_name: submitterNameForDB,
          category,
          occurrence_date: occurrenceDate,
          vehicle_name: vehicleName,
          vehicle_number: vehicleNumber,
          company_name: companyName,
          dealer_name: dealerName,
          encar_compensation: Number(encarCompensation) || 0,
          dealer_compensation: Number(dealerCompensation) || 0,
          total_compensation: totalCompensation,
          is_refunded: isRefunded,
          return_mileage:
            isRefunded && returnMileage ? Number(returnMileage) : null,
          details,
          region,
          center,
          manager_name: managerName,
          claim_part: claimPart,
          preventive_measure: preventiveMeasure,
          improvement_plan: improvementPlan,
          image_urls: uploadedImageUrls,
          claim_status: "광고 수정 대기",
        },
      ]);
      if (error) throw error;
      showToast("성공적으로 클레임이 등록되었습니다!");

      // 등록 완료 후 폼 초기화
      setOccurrenceDate("");
      setVehicleName("");
      setVehicleNumber("");
      setCompanyName("");
      setDealerName("");
      setEncarCompensation("");
      setDealerCompensation("");
      setIsRefunded(false);
      setReturnMileage("");
      setDetails("");
      setRegion("");
      setCenter("");
      setManagerName("");
      setClaimPart("");
      setPreventiveMeasure("");
      setImprovementPlan("");
      setImageFiles([]);
      setImagePreviews([]);
    } catch (error) {
      showToast("등록 중 오류가 발생했습니다.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none";
  const labelClass = "block text-[13px] font-black text-slate-700 mb-1.5";

  return (
    <div
      className="relative animate-in fade-in duration-500 pb-20"
      onPaste={handlePaste}
    >
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
          </div>
        </div>
      )}

      {/* 💡 헤더 타이틀 영역 (엑셀 대량 등록 버튼 추가) */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Edit size={24} className="text-blue-600" /> 새 클레임 등록
          </h2>
          <p className="text-[11px] font-bold text-slate-500 mt-1 ml-8">
            클레임 기본 정보 및 증빙 사진 접수
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* 💡 엑셀 대량 등록 버튼 */}
          <button
            onClick={() => setIsExcelModalOpen(true)}
            className="px-5 py-2 rounded-xl text-sm font-black border-2 border-emerald-500 text-emerald-600 bg-white hover:bg-emerald-50 transition-all flex items-center gap-2"
          >
            <FileSpreadsheet size={16} /> 엑셀 대량 등록
          </button>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`px-6 py-2 rounded-xl text-sm font-black shadow-md transition-all flex items-center gap-2 ${
              isSubmitting
                ? "bg-slate-400 text-white cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700 hover:-translate-y-0.5"
            }`}
          >
            {isSubmitting ? (
              "처리 중..."
            ) : (
              <>
                <Save size={16} /> 시스템에 등록하기
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 relative">
        <div className="xl:col-span-7 space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="w-1.5 h-5 bg-blue-600 rounded-full"></div>
              <h3 className="text-base font-black text-slate-800">
                기본 정보 (필수)
              </h3>
            </div>

            <div className="space-y-6">
              {/* 세트 1: 구분 & 발생일 */}
              <div className="grid grid-cols-2 gap-6">
                <div className="relative">
                  <label className={labelClass}>클레임 구분</label>
                  <div
                    onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                    className={`${inputClass} flex items-center justify-between cursor-pointer select-none`}
                  >
                    <span>{category}</span>
                    <ChevronDown
                      size={16}
                      className={`text-slate-400 transition-transform ${
                        isCategoryOpen ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                  {isCategoryOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-10 overflow-hidden animate-in fade-in slide-in-from-top-2">
                      {/* 💡 카테고리 5개로 확장 */}
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
                            setCategory(cat);
                            setIsCategoryOpen(false);
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
                      ref={dateInputRef}
                      value={occurrenceDate}
                      onChange={(e) => {
                        setOccurrenceDate(e.target.value);
                        dateInputRef.current?.blur();
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

              {/* 세트 2: 차량명 & 차량번호 */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>차량명</label>
                  <input
                    type="text"
                    value={vehicleName}
                    onChange={(e) => setVehicleName(e.target.value)}
                    placeholder="예: 쏘나타 (DN8)"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>차량번호</label>
                  <input
                    type="text"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    placeholder="예: 12가 3456"
                    className={inputClass}
                  />
                </div>
              </div>

              {/* 세트 3: 상사명 & 딜러명 */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>상사명</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="상사명 입력"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>딜러명</label>
                  <input
                    type="text"
                    value={dealerName}
                    onChange={(e) => setDealerName(e.target.value)}
                    placeholder="딜러명 입력"
                    className={inputClass}
                  />
                </div>
              </div>

              {/* 💡 보상 금액 3분할 및 자동 합산 로직 적용 */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-[13px] font-black text-red-600 mb-2">
                  보상금액 (원)
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {/* 1. 엔카 보상액 */}
                  <div className="relative">
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      엔카 보상액
                    </label>
                    <input
                      type="text"
                      value={
                        encarCompensation
                          ? Number(encarCompensation).toLocaleString()
                          : ""
                      }
                      onChange={(e) =>
                        handleAmountChange(e, setEncarCompensation)
                      }
                      placeholder="0"
                      className="w-full h-11 pl-4 pr-8 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 placeholder:text-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/10 outline-none transition-all"
                    />
                  </div>
                  {/* 2. 딜러 보상액 */}
                  <div className="relative">
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      딜러 보상액
                    </label>
                    <input
                      type="text"
                      value={
                        dealerCompensation
                          ? Number(dealerCompensation).toLocaleString()
                          : ""
                      }
                      onChange={(e) =>
                        handleAmountChange(e, setDealerCompensation)
                      }
                      placeholder="0"
                      className="w-full h-11 pl-4 pr-8 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 placeholder:text-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/10 outline-none transition-all"
                    />
                  </div>
                  {/* 3. 총 보상액 (자동계산 & 읽기전용) */}
                  <div className="relative">
                    <label className="block text-[11px] font-black text-red-500 mb-1">
                      총 보상액 (자동계산)
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={
                        totalCompensation > 0
                          ? totalCompensation.toLocaleString()
                          : "0"
                      }
                      className="w-full h-11 pl-4 pr-8 bg-red-50/50 border border-red-200 rounded-xl text-base font-black text-red-700 outline-none cursor-not-allowed"
                    />
                    <span className="absolute right-3 top-[28px] font-black text-red-400 text-xs">
                      원
                    </span>
                  </div>
                </div>
              </div>

              {/* 세트 4: 환불 여부 토글 & 반납 주행거리 */}
              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                <div>
                  <label className={labelClass}>환불 여부</label>
                  <div className="h-11 flex items-center px-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setIsRefunded(!isRefunded)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-300 ${
                        isRefunded ? "bg-blue-600" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${
                          isRefunded ? "translate-x-4" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                    <span
                      className={`ml-3 text-[13px] font-bold ${
                        isRefunded ? "text-blue-600" : "text-slate-500"
                      }`}
                    >
                      {isRefunded ? "환불 진행" : "해당 없음"}
                    </span>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>반납 주행거리</label>
                  {isRefunded ? (
                    <div className="animate-in fade-in duration-300">
                      <input
                        type="number"
                        value={returnMileage}
                        onChange={(e) => setReturnMileage(e.target.value)}
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

              {/* 스마트 폼: 자동 확장 텍스트 박스 */}
              <div className="pt-2">
                <label className={labelClass}>상세내용 및 경위</label>
                <textarea
                  ref={textareaRef}
                  value={details}
                  onChange={handleDetailsChange}
                  style={{ minHeight: "48px", maxHeight: "200px" }}
                  className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none resize-none overflow-y-auto custom-scrollbar leading-relaxed"
                  placeholder="상세 경위를 입력해 주십시오."
                />
              </div>
            </div>
          </div>

          {/* 추가 정보 아코디언 영역 */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => setIsAccordionOpen(!isAccordionOpen)}
              className="w-full p-8 flex justify-between items-center bg-white hover:bg-slate-50 transition-colors focus:outline-none"
            >
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-5 bg-purple-500 rounded-full"></div>
                <h3 className="text-base font-black text-slate-800">
                  추가 정보{" "}
                  <span className="text-[11px] font-bold text-slate-400 ml-2">
                    (진단광고제작팀)
                  </span>
                </h3>
              </div>
              <div
                className={`text-slate-400 transition-transform duration-300 ${
                  isAccordionOpen ? "rotate-180 text-purple-500" : ""
                }`}
              >
                <ChevronDown size={18} />
              </div>
            </button>
            {isAccordionOpen && (
              <div className="p-8 pt-0 grid grid-cols-2 gap-6 animate-in slide-in-from-top-4 fade-in duration-300 border-t border-slate-100 mt-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className={labelClass}>권역</label>
                  <input
                    type="text"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className={inputClass}
                    placeholder="예: 서울"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className={labelClass}>지점</label>
                  <input
                    type="text"
                    value={center}
                    onChange={(e) => setCenter(e.target.value)}
                    className={inputClass}
                    placeholder="예: 오토플렉스"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className={labelClass}>담당자</label>
                  <input
                    type="text"
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    className={inputClass}
                    placeholder="담당 CAM"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className={labelClass}>부위</label>
                  <input
                    type="text"
                    value={claimPart}
                    onChange={(e) => setClaimPart(e.target.value)}
                    className={inputClass}
                    placeholder="예: 운전석 휀다"
                  />
                </div>
                <div className="col-span-2">
                  <label className={labelClass}>재발 방지책</label>
                  <textarea
                    rows={2}
                    value={preventiveMeasure}
                    onChange={(e) => setPreventiveMeasure(e.target.value)}
                    className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none resize-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all"
                  ></textarea>
                </div>
                <div className="col-span-2">
                  <label className={labelClass}>시스템 개선안</label>
                  <textarea
                    rows={2}
                    value={improvementPlan}
                    onChange={(e) => setImprovementPlan(e.target.value)}
                    className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none resize-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all"
                  ></textarea>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 우측: 사진 첨부 영역 */}
        <div className="xl:col-span-5 relative">
          <div className="sticky top-6 flex flex-col bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-5 bg-emerald-500 rounded-full"></div>
                <h3 className="text-base font-black text-slate-800">
                  증빙 사진 첨부
                </h3>
              </div>
              <span
                className={`text-[11px] font-black px-3 py-1 rounded-md ${
                  imageFiles.length > 0
                    ? "bg-blue-50 text-blue-600 border border-blue-100"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {imageFiles.length} / 10장
              </span>
            </div>
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="flex-1 min-h-[220px] border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-6 bg-slate-50 hover:bg-blue-50/50 hover:border-blue-300 transition-all cursor-pointer group mb-6"
              onClick={() => document.getElementById("fileInput")?.click()}
            >
              <div className="w-14 h-14 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <UploadCloud className="text-blue-500" size={28} />
              </div>
              <h4 className="text-sm font-black text-slate-700 mb-1">
                드래그 앤 드롭 또는 복사 가능
              </h4>
              <p className="text-[11px] text-slate-400 font-bold">
                최대 10장 업로드 가능
              </p>
              <input
                id="fileInput"
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  e.target.files && handleAddImages(e.target.files)
                }
              />
            </div>

            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                {imagePreviews.map((url, index) => (
                  <div key={index} className="relative group aspect-square">
                    <img
                      src={url}
                      alt={`preview-${index}`}
                      className="w-full h-full object-cover rounded-xl border border-slate-200"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveImage(index);
                        }}
                        className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 hover:scale-110"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 💡 엑셀 대량 등록 팝업 (모달창) */}
      {isExcelModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <FileSpreadsheet size={20} className="text-emerald-500" />
                엑셀 대량 등록
              </h3>
              <button
                onClick={() => setIsExcelModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <p className="text-sm font-bold text-slate-500 mb-6 leading-relaxed">
              작성자와 날짜는 로그인 정보 기준으로{" "}
              <span className="text-blue-600">자동 등록</span>됩니다. 반드시
              지정된 양식을 다운로드하여 작성해 주세요.
            </p>

            <div className="flex flex-col gap-4">
              <button
                onClick={downloadExcelTemplate}
                className="w-full py-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-black text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <Download size={18} />
                엑셀 양식 다운로드
              </button>

              <div className="relative w-full">
                <input
                  type="file"
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  onChange={handleExcelUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm flex items-center justify-center gap-2 transition-colors">
                  <UploadCloud size={18} />
                  작성된 엑셀 파일 업로드
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
