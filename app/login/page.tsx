"use client";
import Image from "next/image";
import { useStore } from "@/lib/store";
import { ROLE_LABEL } from "@/lib/rbac";

export default function LoginPage() {
  const { db, login } = useStore();
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="grid w-full max-w-4xl overflow-hidden rounded-card border border-line bg-white shadow-overlay md:grid-cols-2">
          <div className="flex flex-col justify-between bg-navy p-8 text-white">
            <div>
              <div className="flex items-center gap-3">
                <Image src="/assets/logo-lamsel.png" alt="Logo Pemda Lampung Selatan" width={45} height={60} className="h-14 w-auto rounded bg-white p-1" />
                <Image src="/assets/logo-uti.png" alt="Logo Universitas Teknokrat Indonesia" width={56} height={56} className="h-14 w-14 rounded bg-white p-1" />
              </div>
              <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-[#9cf2e8]">Pemerintah Kabupaten Lampung Selatan</p>
              <h1 className="mt-1 font-head text-3xl font-bold">Lamsel Tourism Revenue</h1>
              <p className="mt-2 text-sm text-slate-300">SIMPAD Pariwisata Bahari - pencatatan tiket digital, validasi kunjungan fisik, dan rekonsiliasi PAD yang transparan.</p>
            </div>
            <ul className="mt-8 space-y-2 text-sm text-slate-200">
              <li>✓ E-tiket QR bertanda tangan HMAC-SHA256</li>
              <li>✓ Kunjungan dihitung dari validasi gerbang</li>
              <li>✓ Rekonsiliasi harian sistem vs setoran RKUD</li>
              <li>✓ Audit log append-only berantai hash</li>
            </ul>
          </div>
          <div className="p-8">
            <h2 className="font-head text-xl font-semibold text-navy">Masuk ke Sistem</h2>
            <p className="mb-5 text-sm text-muted">Mode demo: pilih akun sesuai persona (PRD Bagian 3). Di produksi, login memakai Supabase Auth + RBAC di server.</p>
            <div className="space-y-2">
              {db.users.filter((u) => u.active).map((u) => (
                <button key={u.id} onClick={() => login(u.id)} className="flex w-full items-center gap-3 rounded-ctl border border-line p-3 text-left transition hover:border-action hover:shadow-hover">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-navy font-bold text-white">{u.name[0]}</span>
                  <span>
                    <span className="block text-sm font-semibold text-navy">{u.name}</span>
                    <span className="block text-xs text-muted">{ROLE_LABEL[u.role]}{u.destination_id ? ` · ${db.destinations.find((d) => d.id === u.destination_id)?.name}` : ""}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <footer className="flex flex-wrap justify-between gap-2 border-t border-line px-6 py-4 text-xs text-muted">
        <span>Copyright©2026 by Izzatul Falahiyah Hasan dan Dr. Erliyan Redy Susanto, M.Kom</span>
        <span>Sistem Demo &amp; Simulasi - Data Sintetis</span>
      </footer>
    </div>
  );
}

