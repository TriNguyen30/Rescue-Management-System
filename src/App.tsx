import "./App.css";
import AppRoute from "@/routes/Router";
import { BrowserRouter } from "react-router-dom";
import { ToastProvider } from "@/components/ui/Toast";
import { PageProvider } from "@/context/PageContext";

function App() {
  return (
    <BrowserRouter>
    <ToastProvider>
      <PageProvider>
        <AppRoute />
      </PageProvider>
    </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
