import { useState, useEffect } from "react";
import { Server, XCircle, CheckCircle2, RefreshCw, Activity } from "lucide-react";

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
        setSystemStatus((prev: any) => ({ ...prev, error: "API unreachable" }));
      }
    } catch (e) {
      setSystemStatus((prev: any) => ({ ...prev, error: "Connection refused. Is Docker running?" }));
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

  const sendCommand = async (cmd: string) => {
    try {
      await fetch("http://localhost:8000", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd })
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Poll globally every 1 second for live data
  useEffect(() => {
    pingSystem();
    const interval = setInterval(pingSystem, 1000);
    return () => clearInterval(interval);
  }, []);

  const isConnected = systemStatus && !systemStatus.error;
  const mt5Connected = systemStatus?.mt5_connected;
  const telemetry = systemStatus?.telemetry;
  const memoryNodes = systemStatus?.memory_nodes || [];
  const lastTrade = systemStatus?.last_trade;

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
                ) : isConnected ? (
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
                {mt5Connected ? (
                  <CheckCircle2 className="h-5 w-5 text-app-green" />
                ) : (
                  <XCircle className="h-5 w-5 text-app-red" />
                )}
              </div>

              <div className="flex items-center justify-between rounded-lg border border-app-border bg-black/20 p-4">
                <div>
                  <div className="font-semibold text-white">AI Engine (OpenRouter)</div>
                  <div className="text-xs text-app-text-dim">
                    {systemStatus?.active_model || "Awaiting connection..."}
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
              {isConnected ? (
                <span className="rounded px-3 py-1 font-semibold uppercase border border-app-green bg-app-green/15 text-app-green">
                  System Online
                </span>
              ) : (
                <span className="rounded px-3 py-1 font-semibold uppercase border border-app-red bg-app-red/15 text-app-red">
                  Offline / Disconnected
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Left Column: System Nodes */}
        <aside className="flex flex-col gap-5 bg-app-surface p-5">
          <div className="rounded-md border border-app-border bg-white/2 p-3">
            <div className="mb-2 flex justify-between text-[10px] font-semibold uppercase text-app-text-dim">
              <span>MetaTrader 5 EA</span>
              <span className={`h-2 w-2 rounded-full shadow-[0_0_10px_currentColor] ${mt5Connected ? 'bg-app-green text-app-green' : 'bg-app-red text-app-red'}`}></span>
            </div>
            <div className="text-xs font-semibold">OmniTutorV2.mq5</div>
            <div className={`mt-1 text-[10px] ${mt5Connected ? 'text-app-green' : 'text-app-red'}`}>
              {mt5Connected ? 'TELEMETRY SYNCED' : 'FILE_NOT_FOUND'}
            </div>
          </div>

          <div className="rounded-md border border-app-border bg-white/2 p-3">
            <div className="mb-2 flex justify-between text-[10px] font-semibold uppercase text-app-text-dim">
              <span>Python Brain Engine</span>
              <span className={`h-2 w-2 rounded-full shadow-[0_0_10px_currentColor] ${isConnected ? 'bg-app-green text-app-green' : 'bg-app-red text-app-red'}`}></span>
            </div>
            <div className="text-xs font-semibold">main.py (Self-Learning)</div>
            <div className={`mt-1 text-[10px] ${isConnected ? 'text-app-green' : 'text-app-red'}`}>
              {isConnected ? 'MEMORY NODES: ACTIVE' : 'API UNREACHABLE'}
            </div>
          </div>

          <div className="rounded-md border border-app-border bg-white/2 p-3">
            <div className="mb-2 flex justify-between text-[10px] font-semibold uppercase text-app-text-dim">
              <span>LLM Interface</span>
              <span className={`h-2 w-2 rounded-full shadow-[0_0_10px_currentColor] ${systemStatus?.ai_active ? 'bg-app-yellow text-app-yellow' : 'bg-app-text-dim text-app-text-dim'}`}></span>
            </div>
            <div className="text-xs font-semibold">OpenRouter / Free Tier</div>
            <div className={`mt-1 text-[10px] ${systemStatus?.ai_active ? 'text-app-yellow' : 'text-app-text-dim'}`}>
              {systemStatus?.ai_active ? 'FALLBACK ROUTING ENABLED' : 'AI DEACTIVATED (STANDALONE)'}
            </div>
          </div>

          <button 
            onClick={() => setIsSystemTesterOpen(true)}
            className="mt-auto border border-app-border bg-transparent p-2.5 text-[11px] font-semibold uppercase text-app-text transition-all duration-200 hover:bg-app-text hover:text-app-bg"
          >
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
            {!mt5Connected ? (
              <>
                <div className="font-mono text-sm tracking-[2px] text-app-yellow">WAITING FOR MT5 CONNECTION...</div>
                <div className="mt-2 text-[10px] text-app-text-dim">Error: Python brain awaiting data from OmniTutorV2_Telemetry.json</div>
              </>
            ) : (
              <>
                <div className="font-mono text-sm tracking-[2px] text-app-green">LIVE MARKET DATA SYNCED</div>
                <div className="mt-2 text-[10px] text-app-text-dim">Receiving real-time telemetry from MT5</div>
              </>
            )}
            
            <div className="mt-5 flex gap-10">
              <div className="text-center">
                <div className="text-[10px] uppercase tracking-[1px] text-app-text-dim">Live Bid</div>
                <div className="font-mono text-[32px] text-white">
                  {telemetry?.bid ? telemetry.bid.toFixed(5) : "---.---"}
                </div>
              </div>
              <div className="text-center">
                <div className="text-[10px] uppercase tracking-[1px] text-app-text-dim">Live Ask</div>
                <div className="font-mono text-[32px] text-white">
                  {telemetry?.ask ? telemetry.ask.toFixed(5) : "---.---"}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-[15px]">
            <div className="rounded-md border border-app-border bg-white/2 p-3">
              <div className="mb-2 flex justify-between text-[10px] font-semibold uppercase text-app-text-dim">Scanner: FVG Detector</div>
              <div className="ml-1 h-10 border-l-2 border-app-border">
                <div className="mt-2 ml-3 text-xs text-app-green">{mt5Connected ? "SCANNING ACTIVE" : "OFFLINE"}</div>
              </div>
            </div>
            <div className="rounded-md border border-app-border bg-white/2 p-3">
              <div className="mb-2 flex justify-between text-[10px] font-semibold uppercase text-app-text-dim">Scanner: BOS/MSS</div>
              <div className="ml-1 h-10 border-l-2 border-app-border">
                <div className="mt-2 ml-3 text-xs text-app-green">{mt5Connected ? "SCANNING ACTIVE" : "OFFLINE"}</div>
              </div>
            </div>
          </div>
        </main>

        {/* Right Sidebar: HUD */}
        <aside className="flex flex-col gap-6 bg-app-surface p-5">
          <div>
            <div className="mb-3 border-b border-app-border pb-1 text-[10px] font-bold uppercase text-app-text-dim">Current Market Phase</div>
            <div className={`text-sm font-bold ${telemetry?.phase?.includes('BULL') ? 'text-app-green' : telemetry?.phase?.includes('BEAR') ? 'text-app-red' : 'text-app-text-dim'}`}>
              {telemetry?.phase || "AWAITING DATA"}
            </div>
          </div>

          <div>
            <div className="mb-3 border-b border-app-border pb-1 text-[10px] font-bold uppercase text-app-text-dim">Last Trade Setup</div>
            <div className="text-xs font-semibold">{lastTrade?.SetupName || "NO TRADES YET"}</div>
            {lastTrade && (
              <div className="text-[10px] text-app-text-dim mt-1">
                Entry: {lastTrade.EntryPrice} | SL: {lastTrade.SL}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="mb-3 border-b border-app-border pb-1 text-[10px] font-bold uppercase text-app-text-dim">Memory Nodes (Self-Learning)</div>
            <div className="flex flex-col gap-2 overflow-y-auto">
              {memoryNodes.length === 0 ? (
                <div className="text-xs text-app-text-dim italic">No memory nodes generated yet.</div>
              ) : (
                memoryNodes.map((node: any, idx: number) => (
                  <div key={idx} className="rounded border border-white/5 bg-black/20 p-2">
                    <div className="flex justify-between text-[10px] text-app-text-dim">
                      <span>Node: {node.node_id}</span>
                      <span>{new Date(node.timestamp * 1000).toLocaleTimeString()}</span>
                    </div>
                    <div className="mt-1 text-[11px] text-app-green">"{node.self_learning_reflection}"</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-auto flex flex-col gap-2">
            <button 
              onClick={toggleAI}
              className="border border-app-border bg-transparent p-2.5 text-[11px] font-semibold uppercase text-app-text transition-all duration-200 hover:bg-app-text hover:text-app-bg"
            >
              {systemStatus?.ai_active ? "Deactivate AI (Standalone)" : "Activate AI"}
            </button>
            <button 
              onClick={() => sendCommand("CLOSE_ALL")}
              className="border border-app-red bg-transparent p-2.5 text-[11px] font-semibold uppercase text-app-red transition-all duration-200 hover:bg-app-red hover:text-white"
            >
              Close All Trades
            </button>
          </div>
        </aside>

        {/* Bottom: Telemetry */}
        <footer className="col-span-full grid grid-cols-3 gap-10 bg-app-surface px-6 py-4">
          <div>
            <div className="mb-1.5 flex justify-between font-mono text-[11px]">
              <span className="text-app-text-dim">MT5 Connection</span>
              <span className={mt5Connected ? "text-app-green" : "text-app-red"}>
                {mt5Connected ? "CONNECTED" : "ERROR"}
              </span>
            </div>
            <div className="mb-1.5 flex justify-between font-mono text-[11px]">
              <span className="text-app-text-dim">Open Positions</span>
              <span>{telemetry?.positions || 0}</span>
            </div>
          </div>
          <div>
            <div className="mb-1.5 flex justify-between font-mono text-[11px]">
              <span className="text-app-text-dim">Total Trades Analyzed</span>
              <span>{systemStatus?.total_trades_analyzed || 0}</span>
            </div>
            <div className="mb-1.5 flex justify-between font-mono text-[11px]">
              <span className="text-app-text-dim">Active Model</span>
              <span className="text-app-yellow">{systemStatus?.active_model || "NONE"}</span>
            </div>
          </div>
          <div>
            <div className="mb-1.5 flex justify-between font-mono text-[11px]">
              <span className="text-app-text-dim">System Mode</span>
            </div>
            <div className="font-mono text-[11px] text-app-yellow">
              {systemStatus?.ai_active ? "AI ASSISTED TRADING" : "STANDALONE BACKTESTING"}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
