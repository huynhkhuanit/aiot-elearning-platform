"use client";

import React, { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type ModalSize = "sm" | "md" | "lg" | "xl";
export type ButtonSize = "sm" | "md" | "lg";
export type CloseButtonPlacement = "header" | "floating";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  ariaLabel?: string;
  children: ReactNode;
  size?: ModalSize;
  showCloseButton?: boolean;
  closeButtonPlacement?: CloseButtonPlacement;
  closeOnBackdropClick?: boolean;
  className?: string;
  contentClassName?: string;
  headerIcon?: ReactNode;
  buttonSize?: ButtonSize;
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
};

const buttonSizeClasses = {
  sm: "px-3 py-2 modal-button-text",
  md: "px-4 py-3 modal-button-text",
  lg: "px-6 py-4 modal-button-text",
};

export default function Modal({
  isOpen,
  onClose,
  title,
  ariaLabel,
  children,
  size = "md",
  showCloseButton = true,
  closeButtonPlacement = "header",
  closeOnBackdropClick = true,
  className = "",
  contentClassName = "",
  headerIcon,
  buttonSize = "md",
}: ModalProps) {
  // Helper function to get button classes
  const getButtonClasses = () => buttonSizeClasses[buttonSize];
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // Track mouse down position to detect drag vs click
  const [mouseDownTarget, setMouseDownTarget] = useState<EventTarget | null>(null);

  const handleBackdropMouseDown = (e: React.MouseEvent) => {
    // Only track if clicking directly on backdrop (not on modal content)
    if (e.target === e.currentTarget && closeOnBackdropClick) {
      setMouseDownTarget(e.target);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only close if:
    // 1. Click target is the backdrop (not modal content)
    // 2. Mouse down started on backdrop (not dragged from inside)
    // 3. Close on backdrop click is enabled
    if (
      e.target === e.currentTarget &&
      mouseDownTarget === e.target &&
      closeOnBackdropClick
    ) {
      onClose();
    }
    // Reset mouse down target
    setMouseDownTarget(null);
  };

  const handleBackdropMouseUp = (e: React.MouseEvent) => {
    // Reset if mouse up happens outside (user dragged and released outside)
    if (e.target !== e.currentTarget) {
      setMouseDownTarget(null);
    }
  };

  if (!isOpen || !isMounted) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 pointer-events-auto"
        style={{ position: 'fixed', zIndex: 9999, isolation: 'isolate' }}
        onMouseDown={handleBackdropMouseDown}
        onMouseUp={handleBackdropMouseUp}
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        aria-label={!title ? ariaLabel : undefined}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
          className={`relative bg-white rounded-2xl shadow-2xl w-full ${sizeClasses[size]} ${className} max-h-[90vh] overflow-hidden flex flex-col`}
          onClick={(e) => e.stopPropagation()}
        >
          {showCloseButton && closeButtonPlacement === "floating" && (
            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-500 shadow-sm ring-1 ring-gray-200 transition-colors duration-200 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              aria-label="Đóng modal"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Header */}
          {(title || headerIcon || (showCloseButton && closeButtonPlacement === "header")) && (
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center space-x-4">
                {headerIcon && (
                  <div className="flex-shrink-0">
                    {headerIcon}
                  </div>
                )}
                {title && (
                  <div id="modal-title" className="modal-title text-gray-900 leading-tight">
                    {title}
                  </div>
                )}
              </div>
              {showCloseButton && closeButtonPlacement === "header" && (
                <button
                  onClick={onClose}
                  className="flex-shrink-0 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  aria-label="Đóng modal"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div className={`flex-1 overflow-y-auto p-6 ${contentClassName}`}>
            {children}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}

// ModalButton component for consistent button styling within modals
export function ModalButton({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  onClick,
  className = "",
  ...props
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger";
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const baseClasses = "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variantClasses = {
    primary: "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white focus:ring-indigo-500",
    secondary: "bg-gray-100 hover:bg-gray-200 text-gray-700 focus:ring-gray-500",
    danger: "bg-red-500 hover:bg-red-600 text-white focus:ring-red-500",
  };

  const sizeClasses = {
    sm: "px-3 py-2 modal-button-text",
    md: "px-4 py-3 modal-button-text",
    lg: "px-6 py-4 modal-button-text",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {loading && <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />}
      {children}
    </button>
  );
}
