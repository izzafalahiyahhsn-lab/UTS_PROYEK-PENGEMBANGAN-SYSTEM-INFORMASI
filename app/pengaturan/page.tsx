"use client";
import { useState } from "react";
import Image from "next/image";
import { useStore } from "@/lib/store";
import { ACCESS, NAV, ROLE_LABEL } from "@/lib/rbac";
import { Badge, Btn, Card, Field, inputCls, Modal, PageHeader, SectionTitle, Th, Td } from "@/components/ui";
import { uid } from "@/lib/format";
import type { RoleId, User } from "@/lib/types";

/** FR-021 manajemen user, FR-026 pengaturan */
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
    toast("Data user disimpan");
    setEdit(null);
  };

  return (
    <>
      <PageHeader crumb="Pengaturan Sistem" title="Manajemen User, Peran (RBAC) & Pengaturan Sistem"
        desc="Hanya Administrator Sistem. Otorisasi diterapkan di antarmuka dan di server/basis data (Supabase RLS)."
        actions={<Btn onClick={() => setEdit({ id: uid("USR"), name: "", nip: "", role: "PETUGAS_LOKET", destination_id: db.destinations[0]?.id ?? null, active: true })}>＋ Tambah User</Btn>} />

      <Card className="mb-6 overflow-hidden">
        <div className="p-6"><SectionTitle title="Daftar Pengguna" desc="Akun dinonaktifkan, bukan dihapus, agar jejak audit tetap utuh." /></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr><Th>Nama</Th><Th>NIP</Th><Th>Peran</Th><Th>Penugasan Destinasi</Th><Th>Status</Th><Th /></tr></thead>
            <tbody>
              {db.users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <Td><b className="text-navy">{u.name}</b></Td>
                  <Td className="font-mono text-xs">{u.nip}</Td>
                  <Td>{ROLE_LABEL[u.role]}</Td>
                  <Td>{destName(u.destination_id)}</Td>
                  <Td><Badge tone={u.active ? "sukses" : "netral"}>{u.active ? "Aktif" : "Nonaktif"}</Badge></Td>
                  <Td><button className="text-xs font-semibold text-action hover:underline" onClick={() => setEdit({ ...u })}>Ubah</button></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="mb-6 overflow-hidden">
        <div className="p-6"><SectionTitle title="Matriks Hak Akses Modul (PRD Bagian 8)" /></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr><Th>Modul</Th>{(Object.keys(ROLE_LABEL) as RoleId[]).map((r) => <Th key={r}>{ROLE_LABEL[r]}</Th>)}</tr></thead>
            <tbody>
              {NAV.map((n) => (
                <tr key={n.href}><Td><b>{n.label}</b></Td>{(Object.keys(ROLE_LABEL) as RoleId[]).map((r) => <Td key={r}>{ACCESS[n.module].includes(r) ? <Badge tone="sukses">Akses</Badge> : <span className="text-muted">-</span>}</Td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <SectionTitle title="Pengaturan Sistem" desc="Tersimpan di tabel settings (FR-026)" />
          <div className="space-y-3">
            {db.settings.map((s) => (
              <div key={s.key} className="flex items-end gap-2">
                <div className="flex-1"><Field label={s.label}><input className={inputCls} value={settings[s.key] ?? s.value} onChange={(e) => setSettings({ ...settings, [s.key]: e.target.value })} /></Field></div>
                <Btn variant="outline" disabled={settings[s.key] === undefined || settings[s.key] === s.value} onClick={async () => { await saveSetting({ ...s, value: settings[s.key] }); toast("Pengaturan disimpan"); }}>Simpan</Btn>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-6">
          <SectionTitle title="Infrastruktur & Branding" />
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between"><span>Penyimpanan data</span><Badge tone={mode === "supabase" ? "sukses" : "info"}>{mode === "supabase" ? "Supabase PostgreSQL" : "Demo localStorage"}</Badge></li>
            <li className="flex justify-between"><span>Tanda tangan e-tiket</span><Badge tone="sukses">HMAC-SHA256 (server)</Badge></li>
            <li className="flex justify-between"><span>Inti aturan bisnis</span><Badge>rust-core (cargo test)</Badge></li>
            <li className="flex justify-between"><span>Audit log</span><Badge tone="sukses">Append-only + hash chain</Badge></li>
          </ul>
          <div className="mt-5 flex items-center gap-3">
            <Image src="/assets/logo-lamsel.png" alt="Logo Pemda Lampung Selatan" width={36} height={48} className="h-12 w-auto" />
            <Image src="/assets/logo-uti.png" alt="Logo Universitas Teknokrat Indonesia" width={48} height={48} className="h-12 w-12" />
            <p className="text-xs text-muted">Logo resmi Pemda Lampung Selatan &amp; Universitas Teknokrat Indonesia (FR-024)</p>
          </div>
          {mode === "demo" && <Btn variant="danger" className="mt-5" onClick={() => confirm("Reset seluruh data demo ke kondisi awal?") && resetDemo()}>Reset Data Demo</Btn>}
        </Card>
      </div>

      {edit && (
        <Modal open onClose={() => setEdit(null)} title={db.users.some((u) => u.id === edit.id) ? "Ubah User" : "Tambah User"}>
          <div className="space-y-3">
            <Field label="Nama Lengkap"><input className={inputCls} value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
            <Field label="NIP / NIK"><input className={inputCls} value={edit.nip} onChange={(e) => setEdit({ ...edit, nip: e.target.value })} /></Field>
            <Field label="Peran"><select className={inputCls} value={edit.role} onChange={(e) => setEdit({ ...edit, role: e.target.value as RoleId })}>{(Object.keys(ROLE_LABEL) as RoleId[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</select></Field>
            {needsDest(edit.role) && <Field label="Destinasi Penugasan"><select className={inputCls} value={edit.destination_id ?? ""} onChange={(e) => setEdit({ ...edit, destination_id: e.target.value })}>{db.destinations.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></Field>}
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={edit.active} onChange={(e) => setEdit({ ...edit, active: e.target.checked })} /> Akun aktif</label>
          </div>
          <div className="mt-5 flex justify-end gap-2"><Btn variant="outline" onClick={() => setEdit(null)}>Batal</Btn><Btn onClick={submit}>Simpan</Btn></div>
        </Modal>
      )}
    </>
  );
}

