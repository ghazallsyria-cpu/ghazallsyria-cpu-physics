
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class GlobalErrorBoundary extends Component<Props, State> {
  // Use property initializer for state
  public state: State = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0A2540] flex flex-col items-center justify-center p-6 text-center font-['Tajawal'] text-white" dir="rtl">
          <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-[40px] max-w-lg backdrop-blur-xl animate-fadeIn">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-3xl font-black mb-4">عذراً، حدث خطأ غير متوقع</h1>
            <p className="text-gray-400 mb-8 text-sm leading-relaxed">
              واجه النظام مشكلة تقنية بسيطة. غالباً ما يكون السبب ضعف في الاتصال أو تحديث في البيانات.
            </p>
            <div className="bg-black/30 p-4 rounded-xl mb-8 text-left ltr font-mono text-[10px] text-red-300 overflow-hidden">
                {this.state.error?.message}
            </div>
            <button
              onClick={this.handleReset}
              className="bg-white text-black px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-all flex items-center justify-center gap-3 w-full"
            >
              <RefreshCw size={18} /> إعادة تشغيل المنصة
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;
