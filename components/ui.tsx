"use client";
import { useEffect, type ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-card border border-line bg-white shadow-card ${className}`}>{children}</div>;
}

const BADGE = {
  sukses: "text-[#16A34A] bg-[#DCFCE7] border-[#BBF7D0]",
  peringatan: "text-[#D97706] bg-[#FEF3C7] border-[#FDE68A]",
  menunggu: "text-[#B45309] bg-[#FEF9C3] border-[#FEF08A]",
  galat: "text-[#DC2626] bg-[#FEE2E2] border-[#FECACA]",
  info: "text-[#0284C7] bg-[#E0F2FE] border-[#BAE6FD]",
  netral: "text-navy bg-slate-100 border-line",
};
export type BadgeTone = keyof typeof BADGE;

export function Badge({ tone = "netral", children }: { tone?: BadgeTone; children: ReactNode }) {
  return <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-3 py-0.5 text-[11px] font-medium tracking-wide ${BADGE[tone]}`}>{children}</span>;
}

export function Tip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex cursor-help align-middle">
      <span className="flex h-4 w-4 items-center justify-center rounded-full border border-slate-300 text-[10px] font-bold text-muted">i</span>
      <span className="pointer-events-none absolute left-1/2 top-6 z-30 hidden w-64 -translate-x-1/2 rounded-ctl border border-slate-300 bg-white p-3 text-xs font-normal normal-case leading-relaxed text-slate-700 shadow-overlay group-hover:block">{text}</span>
    </span>
  );
}

export function Btn({ children, variant = "primary", className = "", ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "outline" | "teal" | "navy" | "danger" }) {
  const v = {
    primary: "bg-action text-white hover:bg-action-hover active:bg-action-active",
    outline: "border border-line bg-white text-navy hover:bg-slate-50 hover:border-slate-300",
    teal: "bg-teal text-white hover:bg-[#0d6560]",
    navy: "bg-navy text-white hover:bg-navy-light",
    danger: "bg-[#DC2626] text-white hover:bg-[#b91c1c]",
  }[variant];
  return <button {...p} className={`inline-flex min-h-[42px] items-center justify-center gap-2 rounded-ctl px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${v} ${className}`}>{children}</button>;
}

export const inputCls = "h-[42px] w-full rounded-ctl border border-slate-300 bg-white px-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-action";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-muted">{label}</span>
      {children}
    </label>
  );
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-navy/40 p-4 print:static print:bg-white print:p-0" onClick={onClose}>
      <div className={`my-8 w-full ${wide ? "max-w-3xl" : "max-w-lg"} rounded-card border border-slate-300 bg-white shadow-overlay print:my-0 print:border-0 print:shadow-none`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-line px-6 py-4 print:hidden">
          <h3 className="font-head text-lg font-semibold text-navy">{title}</h3>
          <button onClick={onClose} className="rounded-ctl px-2 text-xl text-muted hover:bg-slate-100" aria-label="Tutup">×</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function SectionTitle({ eyebrow, title, desc, right }: { eyebrow?: string; title: string; desc?: string; right?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        {eyebrow && <p className="text-[11px] font-semibold uppercase tracking-wider text-action">{eyebrow}</p>}
        <h2 className="font-head text-xl font-semibold text-navy">{title}</h2>
        {desc && <p className="mt-0.5 text-sm text-muted">{desc}</p>}
      </div>
      {right}
    </div>
  );
}

export function Th({ children, right }: { children?: ReactNode; right?: boolean }) {
  return <th className={`whitespace-nowrap bg-navy px-5 py-3 text-xs font-semibold uppercase tracking-[0.05em] text-white ${right ? "text-right" : "text-left"}`}>{children}</th>;
}
export function Td({ children, right, className = "" }: { children?: ReactNode; right?: boolean; className?: string }) {
  return <td className={`border-b border-[#F1F5F9] px-5 py-3.5 align-middle ${right ? "text-right tabular-nums" : ""} ${className}`}>{children}</td>;
}

export function PageHeader({ crumb, title, desc, actions }: { crumb: string; title: string; desc: string; actions?: ReactNode }) {
  return (
    <Card className="mb-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="mb-1 text-xs text-muted">Beranda <span className="mx-1">›</span> <span className="font-semibold text-action">{crumb}</span></p>
          <h1 className="font-head text-2xl font-bold tracking-tight text-navy md:text-[28px]">{title}</h1>
          <p className="mt-1 text-sm text-muted">{desc}</p>
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </Card>
  );
}

export function Empty({ text }: { text: string }) {
  return <p className="py-10 text-center text-sm text-muted">{text}</p>;
}

