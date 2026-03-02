import { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export interface ModalProps {
    /** Whether the modal is visible */
    open: boolean;
    /** Called when the modal should close (backdrop, close button, Escape) */
    onClose: () => void;
    /** Optional title shown in the header */
    title?: string;
    /** Modal content */
    children: React.ReactNode;
    /** Close when clicking the backdrop (default: true) */
    closeOnBackdrop?: boolean;
    /** Show X button in header (default: true) */
    showCloseButton?: boolean;
    /** Max width: sm 400px, md 500px, lg 600px, xl 700px (default: md) */
    size?: "sm" | "md" | "lg" | "xl";
    /** Optional class for the content panel */
    className?: string;
}

const sizeClasses = {
    sm: "max-w-[400px]",
    md: "max-w-[500px]",
    lg: "max-w-[600px]",
    xl: "max-w-[700px]",
};

export default function Modal({
    open,
    onClose,
    title,
    children,
    closeOnBackdrop = true,
    showCloseButton = true,
    size = "md",
    className = "",
}: ModalProps) {
    const handleEscape = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        },
        [onClose]
    );

    useEffect(() => {
        if (!open) return;
        document.addEventListener("keydown", handleEscape);
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "";
        };
    }, [open, handleEscape]);

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget && closeOnBackdrop) onClose();
    };

    if (!open) return null;

    const content = (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={handleBackdropClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "modal-title" : undefined}
        >
            <div
                className={`w-full ${sizeClasses[size]} bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden ${className}`}
                onClick={(e) => e.stopPropagation()}
            >
                {(title || showCloseButton) && (
                    <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-gray-100">
                        {title ? (
                            <h2
                                id="modal-title"
                                className="text-lg font-bold text-gray-900"
                            >
                                {title}
                            </h2>
                        ) : (
                            <span />
                        )}
                        {showCloseButton && (
                            <button
                                type="button"
                                onClick={onClose}
                                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                                aria-label="Đóng"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                )}
                <div className="px-5 py-4">{children}</div>
            </div>
        </div>
    );

    return createPortal(content, document.body);
}
