import { Routes, Route } from "react-router-dom";
import { Header } from "./components/Header";
import { Home } from "./pages/Home";
import { SetupSelect } from "./pages/SetupSelect";
import { SetupAgent } from "./pages/SetupAgent";
import { Grant } from "./pages/Grant";
import { Monitor } from "./pages/Monitor";

function App() {
  return (
    <div className="min-h-screen bg-[var(--bg-dark)]">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/setup" element={<SetupSelect />} />
          <Route path="/setup/:agentType" element={<SetupAgent />} />
          <Route path="/grant" element={<Grant />} />
          <Route path="/monitor" element={<Monitor />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
