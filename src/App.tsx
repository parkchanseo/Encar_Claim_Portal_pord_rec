import React from "react";
import ClaimPortal from "./pages/ClaimPortal";

export default function App() {
  // 테스트 환경이므로 로그인 로직은 생략하고 바로 클레임 포털 메인을 띄웁니다.
  return (
    <div className="App font-sans">
      <ClaimPortal />
    </div>
  );
}
