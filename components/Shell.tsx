"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useStore } from "@/lib/store";
import { ACCESS, NAV, ROLE_LABEL, type Module } from "@/lib/rbac";
import { fmtDate, fmtTime } from "@/lib/format";

function Icon({ d }: { d: string }) {
  return <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>;
}

export function Clock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return <span className="tabular-nums">{now ? `${fmtDate(now)} ${fmtTime(now, true)}` : "--/--/---- --:--"}</span>;
}

export default function Shell({ children }: { children: ReactNode }) {
  const { ready, user, db, logout, login, toasts, mode } = useStore();
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const isLogin = path === "/login";

  const current = NAV.find((n) => (n.href === "/" ? path === "/" : path.startsWith(n.href)));
  const allowed = user && current ? ACCESS[current.module].includes(user.role) : true;

  useEffect(() => {
    if (!ready) return;
    if (!user && !isLogin) router.replace("/login");
    if (user && isLogin) router.replace(firstPage(user.role));
  }, [ready, user, isLogin, router]);

  useEffect(() => setOpen(false), [path]);

  if (!ready) {
    return <div className="flex min-h-screen items-center justify-center bg-canvas text-sm text-muted">Memuat SIMPAD Pariwisata Bahari…</div>;
  }
  if (isLogin) return <>{children}<Toasts /></>;
  if (!user) return null;

  const dest = db.destinations.find((d) => d.id === user.destination_id);
  const navItems = NAV.filter((n) => ACCESS[n.module].includes(user.role));
  const today = new Date().toISOString().slice(0, 7);
  const monthSales = db.sales.filter((s) => s.created_at.slice(0, 7) === today).reduce((a, b) => a + b.total, 0);
  const monthTarget = db.destinations.reduce((a, b) => a + b.target_bulanan, 0);

  return (
    <div className="min-h-screen bg-canvas">
      {/* Header */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center gap-3 bg-navy px-4 text-white shadow-md print:hidden">
        <button className="rounded-ctl p-2 hover:bg-white/10 lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          <Icon d="M4 6h16M4 12h16M4 18h16" />
        </button>
        <div className="flex items-center gap-2">
          <Image src="/assets/logo-lamsel.png" alt="Logo Pemda Lampung Selatan" width={30} height={40} className="h-10 w-auto rounded bg-white p-0.5" />
          <Image src="/assets/logo-uti.png" alt="Logo Universitas Teknokrat Indonesia" width={40} height={40} className="h-10 w-10 rounded bg-white p-0.5" />
        </div>
        <div className="ml-1 hidden border-l border-white/20 pl-3 sm:block">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9cf2e8]">Pemerintah Kabupaten Lampung Selatan</p>
          <p className="font-head text-base font-bold leading-tight">Lamsel Tourism Revenue <span className="text-xs font-normal text-slate-300">- SIMPAD Pariwisata Bahari</span></p>
        </div>
        <div className="ml-auto hidden items-center gap-4 rounded-ctl border border-white/15 bg-white/5 px-4 py-1.5 text-xs md:flex">
          <span className="font-semibold"><Clock /></span>
          <span className="flex items-center gap-1.5 text-[#9cf2e8]"><span className="h-2 w-2 rounded-full bg-emerald-400" />{mode === "supabase" ? "Online - Supabase" : "Mode Demo Lokal"}</span>
        </div>
        <div className="relative ml-auto md:ml-2">
          <button onClick={() => setMenu(!menu)} className="flex items-center gap-3 rounded-ctl px-2 py-1 hover:bg-white/10">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold leading-tight">{user.name}</p>
              <p className="text-[11px] text-slate-300">{ROLE_LABEL[user.role]}</p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-sm font-bold">{user.name[0]}</span>
          </button>
          {menu && (
            <div className="absolute right-0 top-12 w-80 rounded-card border border-slate-300 bg-white p-3 text-navy shadow-overlay" onMouseLeave={() => setMenu(false)}>
              <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted">Role Switcher - Mode Demo (FR-002)</p>
              {db.users.filter((u) => u.active).map((u) => (
                <button key={u.id} onClick={() => { login(u.id); setMenu(false); router.push(firstPage(u.role)); }}
                  className={`flex w-full flex-col rounded-ctl px-2 py-2 text-left hover:bg-slate-50 ${u.id === user.id ? "bg-blue-50" : ""}`}>
                  <span className="text-sm font-semibold">{u.name}</span>
                  <span className="text-xs text-muted">{ROLE_LABEL[u.role]}</span>
                </button>
              ))}
              <button onClick={() => { setMenu(false); logout(); }} className="mt-2 w-full rounded-ctl border border-line py-2 text-sm font-semibold text-[#DC2626] hover:bg-red-50">Keluar</button>
            </div>
          )}
        </div>
      </header>

      {/* Sidebar */}
      {open && <div className="fixed inset-0 z-30 bg-navy/40 lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={`fixed bottom-0 left-0 top-16 z-30 flex w-[260px] flex-col bg-navy px-4 py-6 text-slate-300 transition-transform print:hidden md:w-[72px] md:translate-x-0 lg:w-[260px] ${open ? "translate-x-0 !w-[260px]" : "-translate-x-full"}`}>
        <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 md:hidden lg:block">Menu Operasional SIMPAD</p>
        <nav className="space-y-1">
          {navItems.map((n) => {
            const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href} title={n.label}
                className={`flex items-center gap-3 rounded-ctl px-3 py-2.5 text-sm font-medium transition ${active ? "bg-action font-semibold text-white" : "hover:bg-white/10 hover:text-white"}`}>
                <Icon d={n.icon} />
                <span className={`md:hidden lg:inline ${open ? "!inline" : ""}`}>{n.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className={`mt-auto rounded-card border border-white/10 bg-white/5 p-4 md:hidden lg:block ${open ? "!block" : ""}`}>
          <p className="flex items-center gap-2 text-sm font-semibold text-white"><span className="text-[#9cf2e8]">✓</span> Wilayah Kelola</p>
          <p className="mt-2 text-xs leading-relaxed">{dest ? `${dest.name} - Kec. ${dest.kecamatan}` : "Kabupaten Lampung Selatan - Pintu Gerbang Krakatau"}</p>
          <div className="mt-3 h-1.5 rounded-full bg-white/15"><div className="h-full rounded-full bg-[#80d5cb]" style={{ width: `${Math.min(100, (monthSales / monthTarget) * 100)}%` }} /></div>
          <p className="mt-1.5 flex justify-between text-[11px]"><span>Realisasi Target PAD Bulan Ini</span><b className="text-white">{((monthSales / monthTarget) * 100).toFixed(1)}%</b></p>
        </div>
      </aside>

      {/* Konten */}
      <main className="pt-16 md:pl-[72px] lg:pl-[260px] print:p-0">
        <div className="mx-auto max-w-[1400px] p-4 md:p-8 print:p-0">
          {allowed ? children : <NoAccess module={current?.module} />}
        </div>
        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-5 text-xs text-muted md:px-8 print:hidden">
          <span>Copyright©2026 by Izzatul Falahiyah Hasan dan Dr. Erliyan Redy Susanto, M.Kom</span>
          <span className="rounded-full border border-line bg-white px-3 py-1">● Sistem Demo &amp; Simulasi - Data Sintetis</span>
        </footer>
      </main>
      <Toasts />
    </div>
  );
}

export function firstPage(role: string) {
  if (role === "PETUGAS_LOKET") return "/transaksi";
  if (role === "PETUGAS_VALIDASI") return "/validasi";
  return "/";
}

function NoAccess({ module }: { module?: Module }) {
  return (
    <div className="rounded-card border border-[#FECACA] bg-[#FEE2E2] p-8 text-center text-[#DC2626]">
      <p className="font-head text-lg font-semibold">Akses ditolak</p>
      <p className="mt-1 text-sm">Peran Anda tidak memiliki izin untuk modul {module} (Matriks RBAC PRD Bagian 8).</p>
    </div>
  );
}

function Toasts() {
  const { toasts } = useStore();
  return (
    <div className="fixed bottom-6 right-6 z-[60] space-y-2 print:hidden">
      {toasts.map((t) => (
        <div key={t.id} className={`max-w-sm rounded-ctl px-4 py-3 text-sm font-medium text-white shadow-overlay ${t.type === "success" ? "bg-[#16A34A]" : t.type === "error" ? "bg-[#DC2626]" : "bg-navy"}`}>{t.msg}</div>
      ))}
    </div>
  );
}

