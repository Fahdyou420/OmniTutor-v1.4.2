import { useState, useEffect } from "react";
import { Server, XCircle, CheckCircle2, RefreshCw } from "lucide-react";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export default function App() {
  const [isSystemTesterOpen, setIsSystemTesterOpen] = useState(false);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [isPinging, setIsPinging] = useState(false);

  const pingSystem = async () => {
    setIsPinging(true);
    try {
      const res = await fetch("http://localhost:8000");
      if (res.ok) {
        const data = await res.json();
        setSystemStatus(data);
      } else {
        setSystemStatus({ error: "API unreachable" });
      }
    } catch (e) {
      setSystemStatus({ error: "Connection refused. Is Docker running?" });
    }
    setIsPinging(false);
  };

  const toggleAI = async () => {
    if (!systemStatus || systemStatus.error) return;
    try {
      const res = await fetch("http://localhost:8000", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ai_active: !systemStatus.ai_active })
      });
      if (res.ok) {
        const data = await res.json();
        setSystemStatus(data.state);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isSystemTesterOpen) {
      pingSystem();
      const interval = setInterval(pingSystem, 5000);
      return () => clearInterval(interval);
    }
  }, [isSystemTesterOpen]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-app-bg text-app-text font-sans">
      {/* SYSTEM TESTER MODAL */}
      {isSystemTesterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="w-[500px] rounded-xl border border-app-border bg-app-surface p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xl font-bold text-white">
                <Server className="h-5 w-5 text-app-accent-blue" />
                System Diagnostics
              </h2>
              <button 
                onClick={() => setIsSystemTesterOpen(false)}
                className="text-app-text-dim hover:text-white"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-app-border bg-black/20 p-4">
                <div>
                  <div className="font-semibold text-white">Dashboard ↔ Python Brain</div>
                  <div className="text-xs text-app-text-dim">Local HTTP API Connection</div>
                </div>
                {isPinging ? (
                  <RefreshCw className="h-5 w-5 animate-spin text-app-text-dim" />
                ) : systemStatus && !systemStatus.error ? (
                  <CheckCircle2 className="h-5 w-5 text-app-green" />
                ) : (
                  <XCircle className="h-5 w-5 text-app-red" />
                )}
              </div>

              <div className="flex items-center justify-between rounded-lg border border-app-border bg-black/20 p-4">
                <div>
                  <div className="font-semibold text-white">Python Brain ↔ MT5</div>
                  <div className="text-xs text-app-text-dim">File System Watchdog (Common/Files)</div>
                </div>
                {systemStatus?.mt5_connected ? (
                  <CheckCircle2 className="h-5 w-5 text-app-green" />
                ) : (
                  <XCircle className="h-5 w-5 text-app-red" />
                )}
              </div>

              <div className="flex items-center justify-between rounded-lg border border-app-border bg-black/20 p-4">
                <div>
                  <div className="font-semibold text-white">AI Engine (OpenRouter)</div>
                  <div className="text-xs text-app-text-dim">
                    {systemStatus?.active_model || "Awaiting first trade..."}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={toggleAI}
                    className={`rounded px-3 py-1 text-xs font-bold transition-colors ${
                      systemStatus?.ai_active 
                        ? "bg-app-green/20 text-app-green hover:bg-app-green/30" 
                        : "bg-app-red/20 text-app-red hover:bg-app-red/30"
                    }`}
                  >
                    {systemStatus?.ai_active ? "AI ACTIVE" : "STANDALONE"}
                  </button>
                </div>
              </div>

              {systemStatus?.error && (
                <div className="rounded-lg bg-app-red/10 p-3 text-sm text-app-red">
                  {systemStatus.error}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div 
        className="grid h-full w-full gap-[1px] bg-app-border min-w-[1024px]" 
        style={{ gridTemplateColumns: '280px 1fr 280px', gridTemplateRows: '60px 1fr 180px' }}
      >
        {/* Global Header */}
        <header className="col-span-full flex items-center justify-between bg-app-surface px-6 border-b border-app-border">
          <div className="text-sm font-bold uppercase tracking-[2px] text-app-text">
            OmniTutorV2 / v2.0.0-Pro
          </div>
          <div className="flex items-center gap-4 text-xs">
            <button 
              onClick={() => setIsSystemTesterOpen(true)}
              className="flex items-center gap-2 rounded-md border border-app-border bg-white/5 px-4 py-1.5 font-semibold text-white transition-colors hover:bg-white/10"
            >
              <Server className="h-4 w-4" />
              System Tester
            </button>
            <div className="flex items-center gap-3">
              <span className="text-app-text-dim">STATUS:</span>
              <span className="rounded px-3 py-1 font-semibold uppercase border border-app-green bg-app-green/15 text-app-green">
                System Online
              </span>
            </div>
          </div>
        </header>

        {/* Left Column: System Nodes */}
        <aside className="flex flex-col gap-5 bg-app-surface p-5">
          <div className="rounded-md border border-app-border bg-white/2 p-3">
            <div className="mb-2 flex justify-between text-[10px] font-semibold uppercase text-app-text-dim">
              <span>MetaTrader 5 EA</span>
              <span className="h-2 w-2 rounded-full bg-app-red shadow-[0_0_10px_var(--color-app-red)]"></span>
            </div>
            <div className="text-xs font-semibold">OmniTutorV2.mq5</div>
            <div className="mt-1 text-[10px] text-app-red">FILE_NOT_FOUND</div>
          </div>

          <div className="rounded-md border border-app-border bg-white/2 p-3">
            <div className="mb-2 flex justify-between text-[10px] font-semibold uppercase text-app-text-dim">
              <span>Python Brain Engine</span>
              <span className="h-2 w-2 rounded-full bg-app-green shadow-[0_0_10px_var(--color-app-green)]"></span>
            </div>
            <div className="text-xs font-semibold">main.py (Self-Learning)</div>
            <div className="mt-1 text-[10px] text-app-green">MEMORY NODES: ACTIVE</div>
          </div>

          <div className="rounded-md border border-app-border bg-white/2 p-3">
            <div className="mb-2 flex justify-between text-[10px] font-semibold uppercase text-app-text-dim">
              <span>LLM Interface</span>
              <span className="h-2 w-2 rounded-full bg-app-yellow shadow-[0_0_10px_var(--color-app-yellow)]"></span>
            </div>
            <div className="text-xs font-semibold">OpenRouter / Free Tier</div>
            <div className="mt-1 text-[10px] text-app-yellow">FALLBACK ROUTING ENABLED</div>
          </div>

          <button className="mt-auto border border-app-border bg-transparent p-2.5 text-[11px] font-semibold uppercase text-app-text transition-all duration-200 hover:bg-app-text hover:text-app-bg">
            Test System Connectivity
          </button>
        </aside>

        {/* Main View: AI Market Watch */}
        <main className="flex flex-col gap-5 bg-app-bg p-6">
          <div>
            <h1 className="mb-1 text-2xl font-light">AI Market Watch</h1>
            <p className="mb-6 text-xs text-app-text-dim">Automated Technical Analysis standing by for incoming MT5 Journal signals.</p>
          </div>

          <div className="relative flex flex-1 flex-col items-center justify-center border border-dashed border-app-border">
            <div className="font-mono text-sm tracking-[2px] text-app-yellow">WAITING FOR AI CONFIRMATION...</div>
            <div className="mt-2 text-[10px] text-app-text-dim">Error: Python brain awaiting data from OmniTutorV2_Journal.jsonl</div>
            
            <div className="mt-5 flex gap-10">
              <div className="text-center">
                <div className="text-[10px] uppercase tracking-[1px] text-app-text-dim">Live Bid</div>
                <div className="font-mono text-[32px] text-app-text-dim">---.---</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] uppercase tracking-[1px] text-app-text-dim">Live Ask</div>
                <div className="font-mono text-[32px] text-app-text-dim">---.---</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-[15px]">
            <div className="rounded-md border border-app-border bg-white/2 p-3">
              <div className="mb-2 flex justify-between text-[10px] font-semibold uppercase text-app-text-dim">Scanner: FVG Detector</div>
              <div className="ml-1 h-10 border-l-2 border-app-border"></div>
            </div>
            <div className="rounded-md border border-app-border bg-white/2 p-3">
              <div className="mb-2 flex justify-between text-[10px] font-semibold uppercase text-app-text-dim">Scanner: BOS/MSS</div>
              <div className="ml-1 h-10 border-l-2 border-app-border"></div>
            </div>
          </div>
        </main>

        {/* Right Sidebar: HUD */}
        <aside className="flex flex-col gap-6 bg-app-surface p-5">
          <div>
            <div className="mb-3 border-b border-app-border pb-1 text-[10px] font-bold uppercase text-app-text-dim">Current Market Phase</div>
            <div className="text-sm font-bold text-app-red">BEARISH BOS</div>
          </div>

          <div>
            <div className="mb-3 border-b border-app-border pb-1 text-[10px] font-bold uppercase text-app-text-dim">Active Strategy</div>
            <div className="text-xs font-semibold">MARATHON SCALPING</div>
            <div className="text-[10px] text-app-green">ACTIVE / STANDBY</div>
          </div>

          <div>
            <div className="mb-3 border-b border-app-border pb-1 text-[10px] font-bold uppercase text-app-text-dim">Memory Nodes (Self-Learning)</div>
            <div className="flex flex-col gap-2">
              <div className="rounded border border-white/5 bg-black/20 p-2">
                <div className="flex justify-between text-[10px] text-app-text-dim">
                  <span>Node: a8f9b2c1</span>
                  <span>14:22:10</span>
                </div>
                <div className="mt-1 text-[11px] text-app-green">"Recognized FVG pattern success rate improving in discount zones."</div>
              </div>
              <div className="rounded border border-white/5 bg-black/20 p-2">
                <div className="flex justify-between text-[10px] text-app-text-dim">
                  <span>Node: c4d7e9f0</span>
                  <span>11:05:33</span>
                </div>
                <div className="mt-1 text-[11px] text-app-yellow">"Previous BOS entry failed; adjusting sensitivity for liquidity sweeps."</div>
              </div>
            </div>
          </div>

          <div className="mt-auto flex flex-col gap-2">
            <button className="border border-app-border bg-transparent p-2.5 text-[11px] font-semibold uppercase text-app-text transition-all duration-200 hover:bg-app-text hover:text-app-bg">
              Stop Marathon
            </button>
            <button className="border border-app-red bg-transparent p-2.5 text-[11px] font-semibold uppercase text-app-red transition-all duration-200 hover:bg-app-text hover:text-app-bg">
              Close All Trades
            </button>
          </div>
        </aside>

        {/* Bottom: Telemetry */}
        <footer className="col-span-full grid grid-cols-3 gap-10 bg-app-surface px-6 py-4">
          <div>
            <div className="mb-1.5 flex justify-between font-mono text-[11px]">
              <span className="text-app-text-dim">MT5 Ping</span>
              <span className="text-app-red">ERROR</span>
            </div>
            <div className="mb-1.5 flex justify-between font-mono text-[11px]">
              <span className="text-app-text-dim">Dashboard Latency</span>
              <span>14ms</span>
            </div>
          </div>
          <div>
            <div className="mb-1.5 flex justify-between font-mono text-[11px]">
              <span className="text-app-text-dim">Requests MT5 → AI</span>
              <span>0 (0.0/m)</span>
            </div>
            <div className="mb-1.5 flex justify-between font-mono text-[11px]">
              <span className="text-app-text-dim">Requests DASH → AI</span>
              <span className="text-app-yellow">48 PENDING</span>
            </div>
          </div>
          <div>
            <div className="mb-1.5 flex justify-between font-mono text-[11px]">
              <span className="text-app-text-dim">Next High-Impact News</span>
            </div>
            <div className="font-mono text-[11px] text-app-yellow">
              EIA Crude Oil Stocks in 21:04:06
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
