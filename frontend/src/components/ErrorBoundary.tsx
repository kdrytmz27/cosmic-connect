import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // Sonraki render'da fallback UI gösterecek şekilde state'i güncelle
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Kozmik Error Boundary Hatayı Yakaladı:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050510] text-white flex flex-col items-center justify-center p-6 text-center z-50 fixed inset-0">
          <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-6xl text-red-400">warning</span>
          </div>
          <h1 className="text-3xl font-extrabold mb-4 text-white">Kozmik Bir Türbülans!</h1>
          <p className="text-gray-400 mb-8 max-w-md">
            Yıldızlararası yolculukta ufak bir sapma meydana geldi. Endişelenmeyin, koordinatları sıfırlayarak yola devam edebilirsiniz.
          </p>
          <button 
            onClick={() => window.location.href = '/'}
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-500 rounded-xl font-bold shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:scale-105 transition-transform"
          >
            Yörüngeyi Sıfırla (Ana Sayfa)
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
