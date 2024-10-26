import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App/App";
import reportWebVitals  from "./reportWebVitals";
import "bootstrap/dist/css/bootstrap.min.css";

// Garantindo que o elemento "root" exista e é do tipo HTMLElement
const rootElement = document.getElementById("root") as HTMLElement;

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement!);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error("Elemento 'root' não encontrado.");
}

// Se você quiser começar a medir o desempenho em seu aplicativo, passe uma função
// para registrar resultados (por exemplo: reportWebVitals(console.log))
// ou envie para um endpoint de análise. Aprenda mais: https://bit.ly/CRA-vitals
reportWebVitals(null);
