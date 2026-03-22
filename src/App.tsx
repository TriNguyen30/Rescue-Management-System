import "./App.css";
import AppRoute from "@/routes/Router";
import { BrowserRouter } from "react-router-dom";
import { ToastProvider } from "@/components/ui/Toast";

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AppRoute />
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;