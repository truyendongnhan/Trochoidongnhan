import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100 font-sans selection:bg-red-500/30">
          <div className="w-full max-w-lg bg-slate-900 border border-red-500/30 rounded-2xl p-8 hover:border-red-500/40 transition-colors shadow-2xl space-y-6">
            <div className="text-center space-y-3">
              <div className="inline-flex p-3 rounded-full bg-red-950/30 text-red-400 border border-red-500/20">
                <ShieldAlert size={36} className="animate-pulse" />
              </div>
              <h1 className="text-2xl font-semibold text-red-400">Ứng dụng gặp sự cố (Runtime Error)</h1>
              <p className="text-sm text-slate-400">
                Hệ thống gặp lỗi trong quá trình xử lý giao diện. Hãy kiểm tra thông tin chi tiết lỗi dưới đây:
              </p>
            </div>
            
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 font-mono text-xs overflow-auto max-h-62 text-red-200">
              <p className="font-bold text-red-400">Message: {this.state.error?.message || 'Không rõ nguyên nhân'}</p>
              {this.state.error?.stack && (
                <details className="mt-2 text-slate-500 cursor-pointer">
                  <summary className="text-[10px] uppercase tracking-wider text-slate-400 hover:text-slate-300">Xem chi tiết Stack Trace</summary>
                  <pre className="mt-2 text-[10px] leading-relaxed select-all max-h-40 overflow-y-auto whitespace-pre-wrap">{this.state.error.stack}</pre>
                </details>
              )}
            </div>

            <div className="space-y-3">
              <button
                id="reload-btn"
                onClick={() => window.location.reload()}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 px-4 rounded-xl transition duration-200 cursor-pointer"
              >
                <RefreshCw size={16} />
                Tải lại trang web
              </button>
              <button
                id="clear-cache-btn"
                onClick={() => {
                  try {
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.reload();
                  } catch (e) {
                    console.error(e);
                  }
                }}
                className="w-full border border-slate-800 hover:border-slate-700 hover:bg-slate-800/20 text-slate-300 font-medium py-2.5 px-4 rounded-xl text-xs transition duration-200 cursor-pointer"
              >
                Xóa bộ nhớ đệm (Cache) & Tải lại
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
