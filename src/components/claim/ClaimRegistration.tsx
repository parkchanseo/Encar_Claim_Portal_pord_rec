import React, { useState, useRef, ClipboardEvent, DragEvent } from "react";
import { supabase } from "../../lib/supabase";
import {
  CheckCircle2,
  AlertCircle,
  X,
  UploadCloud,
  ChevronDown,
} from "lucide-react";

export default function ClaimRegistration() {
  // [1] DB 저장을 위한 상태(State) 관리
  const [submitterName, setSubmitterName] = useState(""); // 💡 신규 추가: 접수자 정보
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

  // 추가 정보 (우리 팀)
  const [region, setRegion] = useState("");
  const [center, setCenter] = useState("");
  const [managerName, setManagerName] = useState("");
  const [claimPart, setClaimPart] = useState("");
  const [preventiveMeasure, setPreventiveMeasure] = useState("");
  const [improvementPlan, setImprovementPlan] = useState("");

  // [2] 화면 및 UX 제어용 상태
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dateInputRef = useRef<HTMLInputElement>(null);

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

  // 이미지 처리 로직
  const handleAddImages = (files: FileList | File[]) => {
    const newFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image/")
    );
    if (imageFiles.length + newFiles.length > 10) {
      showToast("사진은 최대 10장까지만 첨부할 수 있습니다.", "error");
      return;
    }
    const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
    setImageFiles((prev) => [...prev, ...newFiles]);
    setImagePreviews((prev) => [...prev, ...newPreviews]);
  };
  const handlePaste = (e: ClipboardEvent<HTMLDivElement>) => {
    if (e.clipboardData.files.length > 0) {
      e.preventDefault();
      handleAddImages(e.clipboardData.files);
    }
  };
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) handleAddImages(e.dataTransfer.files);
  };
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => e.preventDefault();
  const handleRemoveImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // DB 저장 로직
  const handleSubmit = async () => {
    // 💡 필수값 검증에 접수자 추가
    if (!submitterName || !category || !occurrenceDate || !vehicleNumber) {
      showToast(
        "접수자 정보, 구분, 발생일, 차량번호는 필수 입력 항목입니다.",
        "error"
      );
      return;
    }

    setIsSubmitting(true);

    try {
      let uploadedImageUrls: string[] = [];
      if (imageFiles.length > 0) {
        for (const file of imageFiles) {
          const fileExt = file.name.split(".").pop();
          const fileName = `${Date.now()}_${Math.random()
            .toString(36)
            .substring(7)}.${fileExt}`;
          const filePath = `${fileName}`;
          const { error: uploadError } = await supabase.storage
            .from("claim_images")
            .upload(filePath, file);
          if (uploadError) throw uploadError;
          const { data } = supabase.storage
            .from("claim_images")
            .getPublicUrl(filePath);
          uploadedImageUrls.push(data.publicUrl);
        }
      }

      const { error: dbError } = await supabase.from("claim_reports").insert([
        {
          submitter_name: submitterName, // 💡 DB 컬럼 연동
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

      if (dbError) throw dbError;

      showToast("성공적으로 클레임이 등록되었습니다!");

      // 폼 초기화
      setSubmitterName("");
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
      console.error("업로드 실패:", error);
      showToast("등록 중 오류가 발생했습니다. 관리자에게 문의하세요.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none";

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
        <h2 className="text-2xl font-black text-slate-800">새 클레임 등록</h2>
        <p className="text-sm text-slate-500 mt-1">
          클레임 정보를 정확하게 입력해 주십시오. 이미지는 아무 곳에나 Ctrl+V로
          붙여넣을 수 있습니다.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-7 space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="w-1.5 h-5 bg-blue-600 rounded-full"></div>
              <h3 className="text-lg font-black text-slate-800">
                기본 정보 (필수)
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-5">
              {/* 💡 최상단 배치: 접수자 정보 */}
              <div className="col-span-2 bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-2">
                <label className="block text-[13px] font-black text-blue-800 mb-1.5">
                  접수자 정보 (소속 및 이름){" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={submitterName}
                  onChange={(e) => setSubmitterName(e.target.value)}
                  placeholder="예: 거래지원팀 홍길동"
                  className="w-full h-11 px-4 bg-white border border-blue-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-[13px] font-bold text-slate-700 mb-1.5">
                  구분
                </label>
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

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-[13px] font-bold text-slate-700 mb-1.5">
                  발생일
                </label>
                <input
                  type="date"
                  ref={dateInputRef}
                  value={occurrenceDate}
                  onChange={(e) => {
                    setOccurrenceDate(e.target.value);
                    if (dateInputRef.current) dateInputRef.current.blur();
                  }}
                  className={inputClass}
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-[13px] font-bold text-slate-700 mb-1.5">
                  차량명
                </label>
                <input
                  type="text"
                  value={vehicleName}
                  onChange={(e) => setVehicleName(e.target.value)}
                  placeholder="예: 쏘나타 (DN8)"
                  className={inputClass}
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-[13px] font-bold text-slate-700 mb-1.5">
                  차량번호
                </label>
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  placeholder="예: 12가 3456"
                  className={inputClass}
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-[13px] font-bold text-slate-700 mb-1.5">
                  상사명
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="상사명 입력"
                  className={inputClass}
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-[13px] font-bold text-slate-700 mb-1.5">
                  딜러명
                </label>
                <input
                  type="text"
                  value={dealerName}
                  onChange={(e) => setDealerName(e.target.value)}
                  placeholder="딜러명 입력"
                  className={inputClass}
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-[13px] font-bold text-slate-700 mb-1.5">
                  보상금액(원)
                </label>
                <input
                  type="number"
                  value={compensationAmount}
                  onChange={(e) => setCompensationAmount(e.target.value)}
                  placeholder="0"
                  className={inputClass}
                />
              </div>

              <div className="col-span-2 sm:col-span-1 flex flex-col justify-center">
                <label className="block text-[13px] font-bold text-slate-700 mb-2.5">
                  환불 여부
                </label>
                <div
                  className="flex items-center space-x-3 cursor-pointer"
                  onClick={() => setIsRefunded(!isRefunded)}
                >
                  <button
                    type="button"
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ease-in-out focus:outline-none ${
                      isRefunded ? "bg-blue-600" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-300 ease-in-out ${
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

              {isRefunded && (
                <div className="col-span-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block text-[13px] font-bold text-blue-600 mb-1.5">
                    반납 주행거리 (환불 시 필수)
                  </label>
                  <input
                    type="number"
                    value={returnMileage}
                    onChange={(e) => setReturnMileage(e.target.value)}
                    placeholder="차량 반납 시 주행거리 입력 (km)"
                    className="w-full h-11 px-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-900 placeholder:text-blue-300 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                  />
                </div>
              )}

              <div className="col-span-2">
                <label className="block text-[13px] font-bold text-slate-700 mb-1.5">
                  상세내용
                </label>
                <textarea
                  rows={3}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none resize-none"
                  placeholder="클레임이 발생하게 된 상세 경위를 입력해 주십시오."
                ></textarea>
              </div>
            </div>
          </div>

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
                  <label className="block text-[13px] font-bold text-slate-700 mb-1.5">
                    권역
                  </label>
                  <input
                    type="text"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className={inputClass}
                    placeholder="예: 수도권"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[13px] font-bold text-slate-700 mb-1.5">
                    지점
                  </label>
                  <input
                    type="text"
                    value={center}
                    onChange={(e) => setCenter(e.target.value)}
                    className={inputClass}
                    placeholder="예: 성산직영점"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[13px] font-bold text-slate-700 mb-1.5">
                    담당자
                  </label>
                  <input
                    type="text"
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    className={inputClass}
                    placeholder="담당 매니저명"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[13px] font-bold text-slate-700 mb-1.5">
                    부위
                  </label>
                  <input
                    type="text"
                    value={claimPart}
                    onChange={(e) => setClaimPart(e.target.value)}
                    className={inputClass}
                    placeholder="예: 운전석 휀다"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[13px] font-bold text-slate-700 mb-1.5">
                    재발방지책
                  </label>
                  <textarea
                    rows={2}
                    value={preventiveMeasure}
                    onChange={(e) => setPreventiveMeasure(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none resize-none"
                    placeholder="재발방지책을 입력하세요"
                  ></textarea>
                </div>
                <div className="col-span-2">
                  <label className="block text-[13px] font-bold text-slate-700 mb-1.5">
                    개선안
                  </label>
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
              onDragOver={handleDragOver}
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
              <div className="mt-6 grid grid-cols-3 sm:grid-cols-4 xl:grid-cols-3 gap-3">
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
                        className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 hover:scale-110 transition-all shadow-lg"
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
              : "bg-blue-600 hover:bg-blue-700 hover:shadow-blue-600/30 text-white hover:-translate-y-1"
          }`}
        >
          {isSubmitting ? (
            <>처리 중입니다...</>
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
