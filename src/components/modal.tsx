"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Modal({
  title,
  description,
  onClose,
  children,
  footer,
  width = "max-w-lg",
}: {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
}) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", k);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="animate-fade absolute inset-0 bg-ink/30 backdrop-blur-[2px]" onClick={onClose} />
      <div role="dialog" aria-modal aria-label={title} className={cn("animate-rise relative flex max-h-[90vh] w-full flex-col rounded-2xl bg-surface shadow-[var(--shadow-pop)]", width)}>
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4">
          <div>
            <h2 className="font-serif text-[21px] font-medium">{title}</h2>
            {description && <p className="mt-0.5 text-[12.5px] text-muted">{description}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid size-8 shrink-0 place-items-center rounded-lg text-muted hover:bg-sunken hover:text-ink">
            <X className="size-4" />
          </button>
        </div>
        <div className="scroll-thin flex-1 overflow-y-auto px-6 pb-5">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 border-t border-line px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}
