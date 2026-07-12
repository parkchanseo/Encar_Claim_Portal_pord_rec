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
  Lock,
} from "lucide-react";

export default function ClaimRegistration() {
  const [submitterInfo, setSubmitterInfo] = useState("로딩 중...");
  const [submitterNameForDB, setSubmitterNameForDB] = useState("");

  const [category, setCategory] = useState("검수리포트");
  const [occurrenceDate, setOccurrenceDate] = useState("");
  const [vehicleName, setVehicleName] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [dealerName, setDealerName] = useState("");
  const [compensationAmount, setCompensationAmount] = useState("");
  const [isRefunded, setIsRefunded] = useState(false);
  const [returnMileage, setReturnMileage] = useState("");
  const [details, setDetails] = useState("");

  // 진단광고제작팀 추가 정보 (누락 복구됨)
  const [region, setRegion] = useState("");
  const [center, setCenter] = useState("");
  const [managerName, setManagerName] = useState("");
  const [claimPart, setClaimPart] = useState("");
  const [preventiveMeasure, setPreventiveMeasure] = useState("");
  const [improvementPlan, setImprovementPlan] = useState("");

  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dateInputRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // 접속자 정보 연동
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user && user.user_metadata) {
        const team = user.user_metadata.team || "소속 미상";
        const name = user.user_metadata.name || "알 수 없음";
        setSubmitterInfo(`${team} ${name}`);
        setSubmitterNameForDB(`${team} ${name}`);
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
    if (e.clipboardData.files.length) {
      e.preventDefault();
      handleAddImages(e.clipboardData.files);
    }
  };
  const handleRemoveImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
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
      const { error } = await supabase.from("claim_reports").insert([
        {
          submitter_name: submitterNameForDB,
          category,
          occurrence_date: occurrenceDate,
          vehicle_name: vehicleName,
          vehicle_number: vehicleNumber,
          company_name: companyName,
          dealer_name: dealerName,
          compensation_amount: compensationAmount
            ? Number(compensationAmount)
            : 0,
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

      // 등록 후 초기화
      setOccurrenceDate("");
      setVehicleName("");
      setVehicleNumber("");
      setCompanyName("");
      setDealerName("");
      setCompensationAmount("");
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
    "w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none";
  const labelClass = "block text-[13px] font-bold text-slate-700 mb-2";

  return (
    <div className="relative p-6 max-w-[1400px] mx-auto" onPaste={handlePaste}>
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

      <div className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-slate-800">새 클레임 등록</h2>
          <p className="text-sm text-slate-500 mt-1">
            이미지는 아무 곳에나 Ctrl+V로 붙여넣을 수 있습니다.
          </p>
        </div>

        {/* 인증된 작성자 뱃지 */}
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-full shadow-sm">
          <Lock size={14} className="text-blue-400" />
          <span className="text-xs font-black text-slate-200 tracking-wide">
            인증된 작성자:
          </span>
          <span className="text-sm font-bold text-white">{submitterInfo}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-7 space-y-6">
          {/* 기본 정보 폼 */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100">
              <div className="w-1.5 h-5 bg-blue-600 rounded-full"></div>
              <h3 className="text-lg font-black text-slate-800">
                기본 정보 (필수)
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-6">
              <div>
                <label className={labelClass}>구분</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={inputClass}
                >
                  <option value="검수리포트">검수리포트</option>
                  <option value="진단광고">진단광고</option>
                  <option value="기타">기타</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>발생일</label>
                <input
                  type="date"
                  ref={dateInputRef}
                  value={occurrenceDate}
                  onChange={(e) => {
                    setOccurrenceDate(e.target.value);
                    dateInputRef.current?.blur();
                  }}
                  className={inputClass}
                />
              </div>

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

              <div className="flex flex-col justify-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                <label className="block text-[13px] font-bold text-slate-700 mb-3">
                  환불 여부
                </label>
                <div
                  className="flex items-center space-x-3 cursor-pointer"
                  onClick={() => setIsRefunded(!isRefunded)}
                >
                  <button
                    type="button"
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${
                      isRefunded ? "bg-blue-600" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${
                        isRefunded ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                  <span
                    className={`text-sm font-bold ${
                      isRefunded ? "text-blue-600" : "text-slate-500"
                    }`}
                  >
                    {isRefunded ? "환불 진행 (On)" : "해당 없음 (Off)"}
                  </span>
                </div>
              </div>

              <div className="relative h-full">
                {isRefunded && (
                  <div className="absolute inset-0 animate-in fade-in slide-in-from-right-4 duration-300 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                    <label className="block text-[13px] font-bold text-blue-800 mb-2">
                      반납 주행거리 (환불 시 필수)
                    </label>
                    <input
                      type="number"
                      value={returnMileage}
                      onChange={(e) => setReturnMileage(e.target.value)}
                      placeholder="주행거리 입력 (km)"
                      className="w-full h-11 px-4 bg-white border border-blue-200 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="col-span-2 bg-red-50/50 p-5 rounded-2xl border border-red-100 mt-2">
                <label className="block text-[13px] font-black text-red-800 mb-2">
                  보상금액 (원)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={compensationAmount}
                    onChange={(e) => setCompensationAmount(e.target.value)}
                    placeholder="0"
                    className="w-full h-14 pl-5 pr-12 bg-white border border-red-200 rounded-xl text-lg font-black text-slate-800 placeholder:text-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all outline-none"
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-red-400">
                    원
                  </span>
                </div>
              </div>

              <div className="col-span-2 mt-2">
                <label className={labelClass}>상세내용 및 경위</label>
                <textarea
                  rows={3}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 outline-none resize-none"
                  placeholder="상세 경위를 입력해 주십시오."
                ></textarea>
              </div>
            </div>
          </div>

          {/* 💡 복구된 영역: 진단광고제작팀 추가 정보 아코디언 */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => setIsAccordionOpen(!isAccordionOpen)}
              className="w-full p-6 flex justify-between items-center bg-white hover:bg-slate-50 transition-colors focus:outline-none"
            >
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-5 bg-purple-500 rounded-full"></div>
                <h3 className="text-lg font-black text-slate-800">
                  진단광고제작팀 추가 정보{" "}
                  <span className="text-sm font-medium text-slate-400 ml-2">
                    (선택 입력)
                  </span>
                </h3>
              </div>
              <div
                className={`p-2 rounded-full bg-slate-100 text-slate-500 transition-transform duration-300 ${
                  isAccordionOpen ? "rotate-180" : ""
                }`}
              >
                <ChevronDown size={18} />
              </div>
            </button>
            {isAccordionOpen && (
              <div className="p-8 pt-2 border-t border-slate-100 bg-white grid grid-cols-2 gap-x-6 gap-y-5 animate-in slide-in-from-top-4 fade-in duration-300">
                <div className="col-span-2 sm:col-span-1">
                  <label className={labelClass}>권역</label>
                  <input
                    type="text"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className={inputClass}
                    placeholder="예: 수도권"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className={labelClass}>지점</label>
                  <input
                    type="text"
                    value={center}
                    onChange={(e) => setCenter(e.target.value)}
                    className={inputClass}
                    placeholder="예: 성산직영점"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className={labelClass}>담당자</label>
                  <input
                    type="text"
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    className={inputClass}
                    placeholder="담당 매니저명"
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
                  <label className={labelClass}>재발방지책</label>
                  <textarea
                    rows={2}
                    value={preventiveMeasure}
                    onChange={(e) => setPreventiveMeasure(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none resize-none"
                    placeholder="재발방지책을 입력하세요"
                  ></textarea>
                </div>
                <div className="col-span-2">
                  <label className={labelClass}>개선안</label>
                  <textarea
                    rows={2}
                    value={improvementPlan}
                    onChange={(e) => setImprovementPlan(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none resize-none"
                    placeholder="시스템 개선안을 입력하세요"
                  ></textarea>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 우측 사진 첨부 영역 */}
        <div className="xl:col-span-5 flex flex-col">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-5 bg-emerald-500 rounded-full"></div>
                <h3 className="text-lg font-black text-slate-800">
                  증빙 사진 첨부
                </h3>
              </div>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full ${
                  imageFiles.length > 0
                    ? "bg-blue-50 text-blue-600"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {imageFiles.length} / 10장
              </span>
            </div>
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="flex-1 min-h-[300px] border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-8 bg-slate-50 hover:bg-blue-50/50 hover:border-blue-300 transition-all cursor-pointer group"
              onClick={() => document.getElementById("fileInput")?.click()}
            >
              <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <UploadCloud className="text-blue-500" size={32} />
              </div>
              <h4 className="text-base font-black text-slate-700 mb-2">
                클릭하여 파일 선택
              </h4>
              <p className="text-sm text-slate-500 text-center leading-relaxed">
                또는 이미지를 이곳으로{" "}
                <span className="font-bold text-blue-600">드래그 앤 드롭</span>{" "}
                하세요.
                <br />
                <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded mt-2 inline-block">
                  Ctrl + V 지원
                </span>
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
              <div className="mt-6 grid grid-cols-3 gap-3">
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

      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={`px-10 py-4 rounded-2xl font-black text-lg shadow-lg transition-all flex items-center gap-3 ${
            isSubmitting
              ? "bg-slate-400 text-white cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 hover:-translate-y-1"
          }`}
        >
          {isSubmitting ? (
            "처리 중입니다..."
          ) : (
            <>
              <CheckCircle2 size={24} />
              클레임 시스템에 등록하기
            </>
          )}
        </button>
      </div>
    </div>
  );
}
