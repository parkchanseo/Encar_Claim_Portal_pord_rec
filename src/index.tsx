import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css"; // 💡 방금 만든 디자인 파일을 여기서 불러와야 적용됩니다!

const rootElement = document.getElementById("root");
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
