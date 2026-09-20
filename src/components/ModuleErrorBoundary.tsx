import React from "react";

interface ModuleErrorBoundaryProps {
  moduleName: string;
  children: React.ReactNode;
}

interface ModuleErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export default class ModuleErrorBoundary extends React.Component<ModuleErrorBoundaryProps, ModuleErrorBoundaryState> {
  state: ModuleErrorBoundaryState = { hasError: false, message: "" };

  static getDerivedStateFromError(error: unknown): ModuleErrorBoundaryState {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : "Lỗi không xác định",
    };
  }

  componentDidCatch(error: unknown, errorInfo: React.ErrorInfo) {
    console.error(`[ERP module error] ${this.props.moduleName}`, error, errorInfo);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-[320px] rounded-2xl border border-rose-200 bg-rose-50 p-8 flex flex-col items-center justify-center text-center">
        <h3 className="text-lg font-bold text-rose-800">Không thể tải module {this.props.moduleName}</h3>
        <p className="mt-2 max-w-xl text-sm text-rose-700">Module này đã được cô lập để các module ERP khác vẫn tiếp tục hoạt động.</p>
        <button
          type="button"
          onClick={() => this.setState({ hasError: false, message: "" })}
          className="mt-4 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
        >
          Thử tải lại
        </button>
        {this.state.message && <p className="mt-3 max-w-xl text-xs text-rose-600/80">{this.state.message}</p>}
      </div>
    );
  }
}
