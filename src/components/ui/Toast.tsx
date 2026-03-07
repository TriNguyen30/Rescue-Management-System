import React, {
    createContext,
    useContext,
    useCallback,
    useReducer,
    useEffect,
    useRef,
} from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface Toast {
    id: string;
    variant: ToastVariant;
    title: string;
    description?: string;
    duration?: number; // ms, default 4000; pass 0 for persistent
}

type ToastInput = Omit<Toast, "id">;

interface ToastState {
    toasts: Toast[];
}

type ToastAction =
    | { type: "ADD"; toast: Toast }
    | { type: "REMOVE"; id: string }
    | { type: "PAUSE"; id: string }
    | { type: "RESUME"; id: string };

// ── Reducer ───────────────────────────────────────────────────────────────────

function reducer(state: ToastState, action: ToastAction): ToastState {
    switch (action.type) {
        case "ADD":
            return { toasts: [action.toast, ...state.toasts].slice(0, 5) };
        case "REMOVE":
            return { toasts: state.toasts.filter((t) => t.id !== action.id) };
        default:
            return state;
    }
}

// ── Context ───────────────────────────────────────────────────────────────────

interface ToastContextValue {
    toast: (input: ToastInput) => void;
    dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// ── Variant config ────────────────────────────────────────────────────────────

const VARIANTS: Record<
    ToastVariant,
    {
        icon: React.ReactNode;
        bar: string;
        iconColor: string;
        bg: string;
        border: string;
    }
> = {
    success: {
        icon: <CheckCircle2 className="w-4 h-4" />,
        bar: "bg-emerald-500",
        iconColor: "text-emerald-500",
        bg: "bg-white",
        border: "border-emerald-100",
    },
    error: {
        icon: <XCircle className="w-4 h-4" />,
        bar: "bg-red-500",
        iconColor: "text-red-500",
        bg: "bg-white",
        border: "border-red-100",
    },
    warning: {
        icon: <AlertTriangle className="w-4 h-4" />,
        bar: "bg-amber-400",
        iconColor: "text-amber-500",
        bg: "bg-white",
        border: "border-amber-100",
    },
    info: {
        icon: <Info className="w-4 h-4" />,
        bar: "bg-blue-500",
        iconColor: "text-blue-500",
        bg: "bg-white",
        border: "border-blue-100",
    },
};

// ── Single Toast Item ─────────────────────────────────────────────────────────

function ToastItem({
    toast,
    onDismiss,
}: {
    toast: Toast;
    onDismiss: (id: string) => void;
}) {
    const cfg = VARIANTS[toast.variant];
    const duration = toast.duration ?? 4000;

    // Progress bar
    const [progress, setProgress] = React.useState(100);
    const [paused, setPaused] = React.useState(false);
    const [visible, setVisible] = React.useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startTimeRef = useRef<number>(Date.now());
    const remainingRef = useRef<number>(duration);

    // Entrance animation
    useEffect(() => {
        requestAnimationFrame(() => setVisible(true));
    }, []);

    // Auto-dismiss with progress
    useEffect(() => {
        if (duration === 0) return;

        const tick = 50;
        startTimeRef.current = Date.now();

        intervalRef.current = setInterval(() => {
            if (!paused) {
                remainingRef.current -= tick;
                const pct = Math.max(0, (remainingRef.current / duration) * 100);
                setProgress(pct);
                if (remainingRef.current <= 0) {
                    clearInterval(intervalRef.current!);
                    handleDismiss();
                }
            }
        }, tick);

        return () => clearInterval(intervalRef.current!);
    }, [paused, duration]);

    const handleDismiss = () => {
        setVisible(false);
        setTimeout(() => onDismiss(toast.id), 300);
    };

    return (
        <div
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            style={{
                transform: visible ? "translateX(0) scale(1)" : "translateX(110%) scale(0.95)",
                opacity: visible ? 1 : 0,
                transition: "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease",
            }}
            className={`relative w-80 rounded-2xl border shadow-lg shadow-black/5 overflow-hidden ${cfg.bg} ${cfg.border}`}
        >
            {/* Side accent bar */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${cfg.bar} rounded-l-2xl`} />

            {/* Content */}
            <div className="flex items-start gap-3 px-4 py-3 pl-5">
                <span className={`mt-0.5 shrink-0 ${cfg.iconColor}`}>{cfg.icon}</span>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 leading-snug">{toast.title}</p>
                    {toast.description && (
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{toast.description}</p>
                    )}
                </div>
                <button
                    onClick={handleDismiss}
                    className="shrink-0 mt-0.5 p-1 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Progress bar */}
            {duration > 0 && (
                <div className="h-0.5 bg-gray-100">
                    <div
                        className={`h-full ${cfg.bar} transition-all duration-50 ease-linear`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}
        </div>
    );
}

// ── Toast Container ───────────────────────────────────────────────────────────

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
    return (
        <div
            aria-live="polite"
            className="fixed bottom-200 right-2 z-[9999] flex flex-col gap-2.5 items-end pointer-events-none"
        >
            {toasts.map((t) => (
                <div key={t.id} className="pointer-events-auto">
                    <ToastItem toast={t} onDismiss={onDismiss} />
                </div>
            ))}
        </div>
    );
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(reducer, { toasts: [] });

    const toast = useCallback((input: ToastInput) => {
        const id = Math.random().toString(36).slice(2);
        dispatch({ type: "ADD", toast: { ...input, id } });
    }, []);

    const dismiss = useCallback((id: string) => {
        dispatch({ type: "REMOVE", id });
    }, []);

    return (
        <ToastContext.Provider value={{ toast, dismiss }}>
            {children}
            <ToastContainer toasts={state.toasts} onDismiss={dismiss} />
        </ToastContext.Provider>
    );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");

    return {
        toast: ctx.toast,
        dismiss: ctx.dismiss,
        // Convenience shorthands
        success: (title: string, description?: string, duration?: number) =>
            ctx.toast({ variant: "success", title, description, duration }),
        error: (title: string, description?: string, duration?: number) =>
            ctx.toast({ variant: "error", title, description, duration }),
        warning: (title: string, description?: string, duration?: number) =>
            ctx.toast({ variant: "warning", title, description, duration }),
        info: (title: string, description?: string, duration?: number) =>
            ctx.toast({ variant: "info", title, description, duration }),
    };
}