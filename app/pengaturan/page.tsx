"use client";
import { useState } from "react";
import Image from "next/image";
import { useStore } from "@/lib/store";
import { ACCESS, NAV, ROLE_LABEL } from "@/lib/rbac";
import { Badge, Btn, Card, Field, inputCls, Modal, PageHeader, SectionTitle, Th, Td } from "@/components/ui";
import { uid } from "@/lib/format";
import type { RoleId, User } from "@/lib/types";

export default function PengaturanPage() {
  const { db, saveUser, saveSetting, toast, mode, resetDemo } = useStore();
  const [edit, setEdit] = useState<User | null>(null);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const destName = (id: string | null) => (id ? db.destinations.find((d) => d.id === id)?.name : "Semua destinasi");
  const needsDest = (r: RoleId) => r === "PENGELOLA" || r === "PETUGAS_LOKET" || r === "PETUGAS_VALIDASI";

  const submit = async () => {
    if (!edit) return;
    if (!edit.name.trim()) return toast("Nama wajib diisi", "error");
    if (needsDest(edit.role) && !edit.destination_id) return toast("Peran ini wajib ditugaskan ke satu destinasi", "error");
    await saveUser({ ...edit, destination_id: needsDest(edit.role) ? edit.destination_id : null });
    toast("Data pengguna berhasil disimpan");
    setEdit(null);
  };

  return (
    <>
      <PageHeader
        crumb="Pengaturan Sistem"
        title="Manajemen Pengguna, Peran (RBAC) & Pengaturan Sistem"
        desc="Pengelolaan akun pejabat/petugas, matriks hak akses berbasis peran, dan parameter operasional SIMPAD Pariwisata Bahari."
        actions={
          <Btn onClick={() => setEdit({ id: uid("USR"), name: "", nip: "", role: "PETUGAS_LOKET", destination_id: db.destinations[0]?.id ?? null, active: true })}>
            + Tambah Pengguna
          </Btn>
        }
      />

      <Card className="mb-6 overflow-hidden">
        <div className="p-6">
          <SectionTitle title="Daftar Pengguna" desc="Akun dinonaktifkan, bukan dihapus, agar jejak audit tetap utuh." />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <Th>Nama</Th>
                <Th>NIP / Identitas</Th>
                <Th>Peran</Th>
                <Th>Penugasan Destinasi</Th>
                <Th>Status</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {db.users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <Td><b className="text-navy">{u.name}</b></Td>
                  <Td className="font-mono text-xs">{u.nip}</Td>
                  <Td>{ROLE_LABEL[u.role]}</Td>
                  <Td>{destName(u.destination_id)}</Td>
                  <Td><Badge tone={u.active ? "sukses" : "netral"}>{u.active ? "Aktif" : "Nonaktif"}</Badge></Td>
                  <Td>
                    <button className="text-xs font-semibold text-action hover:underline" onClick={() => setEdit({ ...u })}>
                      Ubah
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="mb-6 overflow-hidden">
        <div className="p-6">
          <SectionTitle title="Matriks Hak Akses Modul (RBAC)" desc="Pembatasan akses modul berdasarkan peran pengguna" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <Th>Modul</Th>
                {(Object.keys(ROLE_LABEL) as RoleId[]).map((r) => (
                  <Th key={r}>{ROLE_LABEL[r]}</Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {NAV.map((n) => (
                <tr key={n.href} className="hover:bg-slate-50">
                  <Td><b className="text-navy">{n.label}</b></Td>
                  {(Object.keys(ROLE_LABEL) as RoleId[]).map((r) => (
                    <Td key={r}>{ACCESS[n.module].includes(r) ? <Badge tone="sukses">Diizinkan</Badge> : <span className="text-muted">—</span>}</Td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <SectionTitle title="Parameter Operasional Sistem" desc="Konfigurasi rekening kas daerah, jadwal cut-off, dan regulasi" />
          <div className="space-y-3">
            {db.settings.map((s) => (
              <div key={s.key} className="flex items-end gap-2">
                <div className="flex-1">
                  <Field label={s.label}>
                    <input
                      className={inputCls}
                      value={settings[s.key] ?? s.value}
                      onChange={(e) => setSettings({ ...settings, [s.key]: e.target.value })}
                    />
                  </Field>
                </div>
                <Btn
                  variant="outline"
                  disabled={settings[s.key] === undefined || settings[s.key] === s.value}
                  onClick={async () => {
                    await saveSetting({ ...s, value: settings[s.key] });
                    toast("Pengaturan disimpan");
                  }}
                >
                  Simpan
                </Btn>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-6">
          <SectionTitle title="Infrastruktur & Identitas Instansi" desc="Status layanan inti dan otentikasi kriptografis" />
          <ul className="space-y-2.5 text-sm">
            <li className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span>Basis Data &amp; Penyimpanan</span>
              <Badge tone="sukses">{mode === "supabase" ? "Supabase PostgreSQL" : "Sinkronisasi Aktif"}</Badge>
            </li>
            <li className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span>Otentikasi E-Tiket QR</span>
              <Badge tone="sukses">HMAC-SHA256 Server</Badge>
            </li>
            <li className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span>Mesin Aturan Bisnis</span>
              <Badge tone="info">Rust Core + Next.js</Badge>
            </li>
            <li className="flex items-center justify-between pb-1">
              <span>Integritas Jejak Audit</span>
              <Badge tone="sukses">Append-Only + SHA-256 Chain</Badge>
            </li>
          </ul>
          <div className="mt-5 flex items-center gap-3 rounded-card border border-line bg-slate-50 p-3.5">
            <Image src="/assets/logo-lamsel.png" alt="Logo Pemda Lampung Selatan" width={36} height={48} className="h-12 w-auto" />
            <Image src="/assets/logo-uti.png" alt="Logo Universitas Teknokrat Indonesia" width={48} height={48} className="h-12 w-12" />
            <p className="text-xs leading-relaxed text-muted">
              Kolaborasi Pemerintah Kabupaten Lampung Selatan &amp; Universitas Teknokrat Indonesia
            </p>
          </div>
          <Btn
            variant="danger"
            className="mt-5"
            onClick={() => confirm("Muat ulang dan kembalikan seluruh data ke kondisi awal?") && resetDemo()}
          >
            Muat Ulang Data Awal Sistem
          </Btn>
        </Card>
      </div>

      {edit && (
        <Modal open onClose={() => setEdit(null)} title={db.users.some((u) => u.id === edit.id) ? "Ubah Pengguna" : "Tambah Pengguna"}>
          <div className="space-y-3">
            <Field label="Nama Lengkap">
              <input className={inputCls} value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
            </Field>
            <Field label="NIP / NIK">
              <input className={inputCls} value={edit.nip} onChange={(e) => setEdit({ ...edit, nip: e.target.value })} />
            </Field>
            <Field label="Peran">
              <select className={inputCls} value={edit.role} onChange={(e) => setEdit({ ...edit, role: e.target.value as RoleId })}>
                {(Object.keys(ROLE_LABEL) as RoleId[]).map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABEL[r]}
                  </option>
                ))}
              </select>
            </Field>
            {needsDest(edit.role) && (
              <Field label="Destinasi Penugasan">
                <select className={inputCls} value={edit.destination_id ?? ""} onChange={(e) => setEdit({ ...edit, destination_id: e.target.value })}>
                  {db.destinations.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={edit.active} onChange={(e) => setEdit({ ...edit, active: e.target.checked })} /> Akun aktif
            </label>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Btn variant="outline" onClick={() => setEdit(null)}>
              Batal
            </Btn>
            <Btn onClick={submit}>Simpan</Btn>
          </div>
        </Modal>
      )}
    </>
  );
}
