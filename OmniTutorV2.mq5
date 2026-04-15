//+------------------------------------------------------------------+
//|                                                  OmniTutorV2.mq5 |
//|                                      OmniVision Pro Architecture |
//+------------------------------------------------------------------+
#property copyright "OmniTutorV2"
#property link      ""
#property version   "2.00"

#include <Trade\Trade.mqh>
#include <Trade\SymbolInfo.mqh>
#include <Trade\PositionInfo.mqh>
#include <Trade\AccountInfo.mqh>

//--- Input Parameters
input bool   UseAI = true;            // Use AI (False = Standalone EA for Backtesting)
input int    HistoryDepth = 100;      // Number of historical bars to scan
input double Sensitivity = 0.05;      // Proximity threshold for clustering (0.0 to 1.0)
input double RiskPercent = 1.0;       // Risk per trade % (FTMO Compliant: Fixed Risk)
input double MaxDailyLossPct = 4.5;   // Max Daily Loss % (FTMO Limit is 5%)
input int    TrailingStopPts = 50;    // Trailing Stop in points
input int    SL_Points = 150;         // Default Stop Loss in points
input int    TP_Points = 300;         // Default Take Profit in points

//--- Global Variables
CTrade trade;
CPositionInfo position;
string prefix = "OmniViz_";
double dailyOpenPrice = 0.0;
double dailyStartBalance = 0.0;
bool isBacktesting = false;

//+------------------------------------------------------------------+
//| Base Visualizer Class                                            |
//+------------------------------------------------------------------+
class CVisualizer {
public:
    CVisualizer() {}
    ~CVisualizer() {}
    
    void DrawZone(datetime time1, double price1, datetime time2, double price2, color zoneColor, string nameSuffix) {
        if(isBacktesting) return; // Save resources in tester
        string objName = prefix + "Zone_" + nameSuffix;
        ObjectCreate(0, objName, OBJ_RECTANGLE, 0, time1, price1, time2, price2);
        ObjectSetInteger(0, objName, OBJPROP_COLOR, zoneColor);
        ObjectSetInteger(0, objName, OBJPROP_FILL, true);
        ObjectSetInteger(0, objName, OBJPROP_BACK, true);
    }
    
    void DrawLine(datetime time1, double price1, datetime time2, double price2, color lineColor, string nameSuffix, int style=STYLE_SOLID) {
        if(isBacktesting) return;
        string objName = prefix + "Line_" + nameSuffix;
        ObjectCreate(0, objName, OBJ_TREND, 0, time1, price1, time2, price2);
        ObjectSetInteger(0, objName, OBJPROP_COLOR, lineColor);
        ObjectSetInteger(0, objName, OBJPROP_STYLE, style);
        ObjectSetInteger(0, objName, OBJPROP_RAY_RIGHT, false);
    }
    
    void DrawHLine(double price, color lineColor, string nameSuffix, int style=STYLE_SOLID) {
        if(isBacktesting) return;
        string objName = prefix + "HLine_" + nameSuffix;
        ObjectCreate(0, objName, OBJ_HLINE, 0, 0, price);
        ObjectSetInteger(0, objName, OBJPROP_COLOR, lineColor);
        ObjectSetInteger(0, objName, OBJPROP_STYLE, style);
    }
    
    void DrawText(datetime time, double price, string text, color textColor, string nameSuffix) {
        if(isBacktesting) return;
        string objName = prefix + "Text_" + nameSuffix;
        ObjectCreate(0, objName, OBJ_TEXT, 0, time, price);
        ObjectSetString(0, objName, OBJPROP_TEXT, text);
        ObjectSetInteger(0, objName, OBJPROP_COLOR, textColor);
    }
};

//+------------------------------------------------------------------+
//| Derived Classes                                                  |
//+------------------------------------------------------------------+
class DrawStructure : public CVisualizer {
public:
    void DrawBOS(datetime time, double price) {
        DrawHLine(price, clrBlue, "BOS_" + TimeToString(time));
    }
    void DrawOrderBlock(datetime time1, double price1, datetime time2, double price2, bool isBullish) {
        color c = isBullish ? clrLimeGreen : clrCrimson;
        DrawZone(time1, price1, time2, price2, c, "OB_" + TimeToString(time1));
    }
};

class DrawGeometry : public CVisualizer {
public:
    void DrawFib(double price, string level) {
        DrawHLine(price, clrGold, "Fib_" + level);
    }
};

class DrawLiquidity : public CVisualizer {
public:
    void DrawSR(double price) {
        DrawHLine(price, clrWhite, "SR_" + DoubleToString(price, 5));
    }
};

//+------------------------------------------------------------------+
//| Risk Management (FTMO Compliant)                                 |
//+------------------------------------------------------------------+
class CRiskManager {
public:
    bool CheckDailyDrawdown() {
        double currentEquity = AccountInfoDouble(ACCOUNT_EQUITY);
        double drawdownPct = ((dailyStartBalance - currentEquity) / dailyStartBalance) * 100.0;
        
        if (drawdownPct >= MaxDailyLossPct) {
            Print("FTMO PROTECTION: Max Daily Loss Reached (", DoubleToString(drawdownPct, 2), "%). Trading halted.");
            return false;
        }
        return true;
    }

    // FTMO Rule 7.5.1: Avoid substantially larger position sizes. 
    // We use a strict fixed fractional risk model. No Martingale.
    double CalculateLotSize(double slDistancePoints) {
        double balance = AccountInfoDouble(ACCOUNT_BALANCE);
        double riskAmount = balance * (RiskPercent / 100.0);
        double tickValue = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_VALUE);
        double tickSize = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_SIZE);
        
        if (slDistancePoints <= 0 || tickValue <= 0) return SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
        
        double lotSize = riskAmount / (slDistancePoints * (tickValue / tickSize) * _Point);
        
        double minLot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
        double maxLot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MAX);
        double stepLot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_STEP);
        
        lotSize = MathRound(lotSize / stepLot) * stepLot;
        if (lotSize < minLot) lotSize = minLot;
        if (lotSize > maxLot) lotSize = maxLot;
        
        return lotSize;
    }
    
    void ManageTrailingStops() {
        for(int i = PositionsTotal() - 1; i >= 0; i--) {
            if(position.SelectByIndex(i)) {
                if(position.Symbol() == _Symbol) {
                    double currentPrice = (position.PositionType() == POSITION_TYPE_BUY) ? SymbolInfoDouble(_Symbol, SYMBOL_BID) : SymbolInfoDouble(_Symbol, SYMBOL_ASK);
                    double openPrice = position.PriceOpen();
                    double currentSL = position.StopLoss();
                    
                    if(position.PositionType() == POSITION_TYPE_BUY) {
                        if(currentPrice - openPrice > TrailingStopPts * _Point) {
                            double newSL = currentPrice - (TrailingStopPts * _Point);
                            if(newSL > currentSL || currentSL == 0) {
                                trade.PositionModify(position.Ticket(), newSL, position.TakeProfit());
                            }
                        }
                    } else if(position.PositionType() == POSITION_TYPE_SELL) {
                        if(openPrice - currentPrice > TrailingStopPts * _Point) {
                            double newSL = currentPrice + (TrailingStopPts * _Point);
                            if(newSL < currentSL || currentSL == 0) {
                                trade.PositionModify(position.Ticket(), newSL, position.TakeProfit());
                            }
                        }
                    }
                }
            }
        }
    }
};

CRiskManager risk;

//+------------------------------------------------------------------+
//| Strategy Manager & Confluence Engine                             |
//+------------------------------------------------------------------+
class CStrategyManager {
private:
    DrawStructure structure;
    DrawGeometry geometry;
    DrawLiquidity liquidity;

public:
    bool CheckConfluence(double targetPrice, bool isLong) {
        // 1. Daily Open Filter (AMD)
        double currentPrice = isLong ? SymbolInfoDouble(_Symbol, SYMBOL_ASK) : SymbolInfoDouble(_Symbol, SYMBOL_BID);
        if (isLong && currentPrice >= dailyOpenPrice) return false; 
        if (!isLong && currentPrice <= dailyOpenPrice) return false; 
        
        // 2. Mocked Confluence for Backtesting Execution
        // In a real scenario, this checks OBs, FVGs, RSI, etc.
        // For backtesting demonstration, we use a simple moving average crossover to force trades
        double maFast[], maSlow[];
        ArraySetAsSeries(maFast, true); ArraySetAsSeries(maSlow, true);
        int hFast = iMA(_Symbol, PERIOD_CURRENT, 9, 0, MODE_EMA, PRICE_CLOSE);
        int hSlow = iMA(_Symbol, PERIOD_CURRENT, 21, 0, MODE_EMA, PRICE_CLOSE);
        CopyBuffer(hFast, 0, 0, 2, maFast);
        CopyBuffer(hSlow, 0, 0, 2, maSlow);
        
        bool setupValid = false;
        if (isLong && maFast[0] > maSlow[0] && maFast[1] <= maSlow[1]) setupValid = true;
        if (!isLong && maFast[0] < maSlow[0] && maFast[1] >= maSlow[1]) setupValid = true;
        
        if (setupValid) {
            return true;
        }
        return false;
    }
    
    void ScanMarketStructure() {
        // Implement 50-candle scan for BOS and OB
        // ...
    }
    
    void ClusterSupplyDemand() {
        // Implement S/R clustering logic using HistoryDepth and Sensitivity
        // ...
    }
    
    void ExportTradeData(string setupName, double entry, double sl, double tp) {
        if(isBacktesting || !UseAI) return; // Do not write JSON in tester or standalone mode
        
        string filename = "OmniTutorV2_Journal.jsonl";
        int handle = FileOpen(filename, FILE_WRITE|FILE_TXT|FILE_COMMON);
        if (handle != INVALID_HANDLE) {
            string json = "{\"TicketID\": \"" + IntegerToString(TimeCurrent()) + "\", \"Timestamp\": \"" + TimeToString(TimeCurrent()) + "\", \"SetupName\": \"" + setupName + "\", \"EntryPrice\": " + DoubleToString(entry, 5) + ", \"SL\": " + DoubleToString(sl, 5) + ", \"TP\": " + DoubleToString(tp, 5) + ", \"DailyOpenRulePassed\": true}";
            FileWrite(handle, json);
            FileClose(handle);
        }
    }
};

CStrategyManager strategy;

//+------------------------------------------------------------------+
//| Historical Auditing                                              |
//+------------------------------------------------------------------+
void AuditHistoricalTrades() {
    if(isBacktesting) return;
    HistorySelect(0, TimeCurrent());
    int total = HistoryDealsTotal();
    CVisualizer viz;
    
    for(int i=0; i<total; i++) {
        ulong ticket = HistoryDealGetTicket(i);
        if (HistoryDealGetInteger(ticket, DEAL_ENTRY) == DEAL_ENTRY_OUT) {
            double profit = HistoryDealGetDouble(ticket, DEAL_PROFIT);
            datetime timeOut = (datetime)HistoryDealGetInteger(ticket, DEAL_TIME);
            double priceOut = HistoryDealGetDouble(ticket, DEAL_PRICE);
            
            // Find corresponding IN deal (simplified)
            datetime timeIn = timeOut - 3600; // Mock duration
            double priceIn = priceOut - (profit > 0 ? 100*_Point : -100*_Point);
            
            color boxColor = profit > 0 ? clrLimeGreen : clrCrimson;
            viz.DrawZone(timeIn, priceIn + 50*_Point, timeOut, priceOut - 50*_Point, boxColor, "Hist_" + IntegerToString(ticket));
            
            // Wingdings
            string icon = profit > 0 ? CharToString(252) : CharToString(251);
            viz.DrawText(timeOut, priceOut, icon, boxColor, "Icon_" + IntegerToString(ticket));
        }
    }
}

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit() {
    isBacktesting = (MQLInfoInteger(MQL_TESTER) == 1);
    dailyStartBalance = AccountInfoDouble(ACCOUNT_BALANCE);
    dailyOpenPrice = iOpen(_Symbol, PERIOD_D1, 0);
    
    if(!isBacktesting) {
        CVisualizer viz;
        viz.DrawHLine(dailyOpenPrice, clrSilver, "DailyOpen", STYLE_DASH);
        viz.DrawText(TimeCurrent(), dailyOpenPrice, "Daily Open Threshold", clrWhite, "DailyOpenText");
        EventSetTimer(1); // 1 second timer for live dashboard telemetry
    }
    
    return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason) {
    if(!isBacktesting) {
        ObjectsDeleteAll(0, prefix);
        EventKillTimer();
    }
}

//+------------------------------------------------------------------+
//| Expert timer function (Live Telemetry & Commands)                |
//+------------------------------------------------------------------+
void OnTimer() {
    if(isBacktesting) return;
    
    // 1. Check for commands from the Dashboard
    int cmdHandle = FileOpen("OmniTutorV2_Command.json", FILE_READ|FILE_TXT|FILE_COMMON);
    if (cmdHandle != INVALID_HANDLE) {
        string cmd = FileReadString(cmdHandle);
        FileClose(cmdHandle);
        if (StringFind(cmd, "CLOSE_ALL") >= 0) {
            Print("Dashboard Command Received: CLOSE_ALL");
            for(int i=PositionsTotal()-1; i>=0; i--) {
                if(position.SelectByIndex(i)) trade.PositionClose(position.Ticket());
            }
            FileDelete("OmniTutorV2_Command.json", FILE_COMMON);
        }
    }
    
    // 2. Write Live Telemetry for Dashboard
    double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
    double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
    
    // Determine Phase (Simple MA for demonstration)
    double maFast[], maSlow[];
    ArraySetAsSeries(maFast, true); ArraySetAsSeries(maSlow, true);
    int hFast = iMA(_Symbol, PERIOD_CURRENT, 9, 0, MODE_EMA, PRICE_CLOSE);
    int hSlow = iMA(_Symbol, PERIOD_CURRENT, 21, 0, MODE_EMA, PRICE_CLOSE);
    CopyBuffer(hFast, 0, 0, 1, maFast);
    CopyBuffer(hSlow, 0, 0, 1, maSlow);
    string phase = (maFast[0] > maSlow[0]) ? "BULLISH TREND" : "BEARISH TREND";
    
    int handle = FileOpen("OmniTutorV2_Telemetry.json", FILE_WRITE|FILE_TXT|FILE_COMMON);
    if (handle != INVALID_HANDLE) {
        string json = "{\"bid\": " + DoubleToString(bid, 5) + ", \"ask\": " + DoubleToString(ask, 5) + ", \"phase\": \"" + phase + "\", \"positions\": " + IntegerToString(PositionsTotal()) + "}";
        FileWrite(handle, json);
        FileClose(handle);
    }
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick() {
    // Update Daily Open if new day
    if (iOpen(_Symbol, PERIOD_D1, 0) != dailyOpenPrice) {
        dailyOpenPrice = iOpen(_Symbol, PERIOD_D1, 0);
        dailyStartBalance = AccountInfoDouble(ACCOUNT_BALANCE); // Reset daily balance
    }
    
    // FTMO Risk Check
    if (!risk.CheckDailyDrawdown()) return;
    
    // Manage Trailing Stops
    risk.ManageTrailingStops();
    
    strategy.ScanMarketStructure();
    strategy.ClusterSupplyDemand();
    
    // Only allow 1 open position at a time to comply with FTMO 7.5.3 (No over-exposure)
    if (PositionsTotal() > 0) return;
    
    double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
    double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
    
    // Check Long
    if (strategy.CheckConfluence(ask, true)) {
        double sl = ask - (SL_Points * _Point);
        double tp = ask + (TP_Points * _Point);
        double lot = risk.CalculateLotSize(SL_Points);
        
        if(trade.Buy(lot, _Symbol, ask, sl, tp, "OmniTutorV2 Long")) {
            strategy.ExportTradeData("Confluence Buy", ask, sl, tp);
        }
    }
    // Check Short
    else if (strategy.CheckConfluence(bid, false)) {
        double sl = bid + (SL_Points * _Point);
        double tp = bid - (TP_Points * _Point);
        double lot = risk.CalculateLotSize(SL_Points);
        
        if(trade.Sell(lot, _Symbol, bid, sl, tp, "OmniTutorV2 Short")) {
            strategy.ExportTradeData("Confluence Sell", bid, sl, tp);
        }
    }
}
//+------------------------------------------------------------------+
