"use client";
import Image from "next/image";
import { useStore } from "@/lib/store";
import { ROLE_LABEL } from "@/lib/rbac";

export default function LoginPage() {
  const { db, login } = useStore();
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <div className="flex flex-1 items-center justify-center p-4 md:p-8">
        <div className="grid w-full max-w-4xl overflow-hidden rounded-card border border-line bg-white shadow-overlay md:grid-cols-2">
          <div className="flex flex-col justify-between bg-navy p-8 text-white">
            <div>
              <div className="flex items-center gap-3">
                <Image src="/assets/logo-lamsel.png" alt="Logo Pemda Lampung Selatan" width={45} height={60} className="h-14 w-auto rounded bg-white p-1" />
                <Image src="/assets/logo-uti.png" alt="Logo Universitas Teknokrat Indonesia" width={56} height={56} className="h-14 w-14 rounded bg-white p-1" />
              </div>
              <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-[#9cf2e8]">Pemerintah Kabupaten Lampung Selatan</p>
              <h1 className="mt-1 font-head text-3xl font-bold tracking-tight">Lamsel Tourism Revenue</h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                SIMPAD Pariwisata Bahari — Sistem pengelolaan e-tiket retribusi wisata, validasi kunjungan gerbang QR, dan rekonsiliasi PAD terintegrasi.
              </p>
            </div>
            <ul className="mt-8 space-y-2.5 text-sm text-slate-200">
              <li className="flex items-center gap-2"><span className="text-[#9cf2e8]">✓</span> E-tiket QR bertanda tangan kriptografis HMAC-SHA256</li>
              <li className="flex items-center gap-2"><span className="text-[#9cf2e8]">✓</span> Kunjungan fisik terhitung akurat dari validasi gerbang</li>
              <li className="flex items-center gap-2"><span className="text-[#9cf2e8]">✓</span> Rekonsiliasi harian sistem terhadap mutasi setoran RKUD</li>
              <li className="flex items-center gap-2"><span className="text-[#9cf2e8]">✓</span> Jejak audit append-only berantai hash SHA-256</li>
            </ul>
          </div>
          <div className="flex flex-col justify-center p-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-action">Portal Operasional Terpadu</p>
            <h2 className="mt-1 font-head text-2xl font-bold text-navy">Masuk ke Sistem</h2>
            <p className="mb-6 mt-1 text-sm text-muted">
              Pilih akun petugas atau pejabat berwenang sesuai penugasan untuk mengakses modul SIMPAD Pariwisata Bahari.
            </p>
            <div className="space-y-2.5">
              {db.users.filter((u) => u.active).map((u) => (
                <button
                  key={u.id}
                  onClick={() => login(u.id)}
                  className="group flex w-full items-center gap-3.5 rounded-ctl border border-line bg-white p-3.5 text-left transition hover:border-action hover:bg-blue-50/40 hover:shadow-sm"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy font-bold text-white transition group-hover:bg-action">
                    {u.name[0]}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-navy">{u.name}</span>
                    <span className="block truncate text-xs text-muted">
                      {ROLE_LABEL[u.role]}
                      {u.destination_id ? ` · ${db.destinations.find((d) => d.id === u.destination_id)?.name}` : " · Seluruh Destinasi"}
                    </span>
                  </span>
                  <span className="text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-action">→</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-white px-6 py-4 text-xs text-muted">
        <span>Copyright©2026 by Izzatul Falahiyah Hasan dan Dr. Erliyan Redy Susanto, M.Kom</span>
        <span>Bapenda &amp; Dinas Pariwisata Kabupaten Lampung Selatan</span>
      </footer>
    </div>
  );
}
