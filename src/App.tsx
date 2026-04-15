/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export default function App() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-app-bg text-app-text font-sans">
      <div 
        className="grid h-full w-full gap-[1px] bg-app-border min-w-[1024px]" 
        style={{ gridTemplateColumns: '280px 1fr 280px', gridTemplateRows: '60px 1fr 180px' }}
      >
        {/* Global Header */}
        <header className="col-span-full flex items-center justify-between bg-app-surface px-6 border-b border-app-border">
          <div className="text-sm font-bold uppercase tracking-[2px] text-app-text">
            OmniTutor / v1.4.2-Critical
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-app-text-dim">STATUS:</span>
            <span className="rounded px-3 py-1 font-semibold uppercase border border-app-red bg-app-red/15 text-app-red">
              Critical Infrastructure Failure
            </span>
          </div>
        </header>

        {/* Left Column: System Nodes */}
        <aside className="flex flex-col gap-5 bg-app-surface p-5">
          <div className="rounded-md border border-app-border bg-white/2 p-3">
            <div className="mb-2 flex justify-between text-[10px] font-semibold uppercase text-app-text-dim">
              <span>MetaTrader 5 EA</span>
              <span className="h-2 w-2 rounded-full bg-app-red shadow-[0_0_10px_var(--color-app-red)]"></span>
            </div>
            <div className="text-xs font-semibold">OmniTutor.mq5</div>
            <div className="mt-1 text-[10px] text-app-red">FILE_NOT_FOUND</div>
          </div>

          <div className="rounded-md border border-app-border bg-white/2 p-3">
            <div className="mb-2 flex justify-between text-[10px] font-semibold uppercase text-app-text-dim">
              <span>Python Brain Engine</span>
              <span className="h-2 w-2 rounded-full bg-app-green shadow-[0_0_10px_var(--color-app-green)]"></span>
            </div>
            <div className="text-xs font-semibold">main.py (PID: 2841)</div>
            <div className="mt-1 text-[10px] text-app-text-dim">Polling MT5_COMMON_DIR...</div>
          </div>

          <div className="rounded-md border border-app-border bg-white/2 p-3">
            <div className="mb-2 flex justify-between text-[10px] font-semibold uppercase text-app-text-dim">
              <span>LLM Interface</span>
              <span className="h-2 w-2 rounded-full bg-app-red shadow-[0_0_10px_var(--color-app-red)]"></span>
            </div>
            <div className="text-xs font-semibold">OpenRouter / Claude-3</div>
            <div className="mt-1 text-[10px] text-app-red">AUTH: API_KEY_MISSING</div>
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
            <div className="mt-2 text-[10px] text-app-text-dim">Error: Python brain awaiting data from OmniTutor_Journal.jsonl</div>
            
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
            <div className="mb-3 border-b border-app-border pb-1 text-[10px] font-bold uppercase text-app-text-dim">Signal History</div>
            <div className="flex justify-between border-b border-white/5 py-2 text-[11px]">
              <span>SELL FVG Fill</span>
              <span className="text-app-text-dim">13:38:57</span>
            </div>
            <div className="flex justify-between border-b border-white/5 py-2 text-[11px]">
              <span>SELL FVG Fill</span>
              <span className="text-app-text-dim">13:38:57</span>
            </div>
            <div className="flex justify-between border-b border-white/5 py-2 text-[11px]">
              <span>BUY FVG Fill</span>
              <span className="text-app-text-dim">18:48:47</span>
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
