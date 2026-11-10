"use client";
import { useMemo, useState } from "react";
import Image from "next/image";
import { useStore } from "@/lib/store";
import { can } from "@/lib/rbac";
import { Badge, Btn, Card, Field, inputCls, Modal, PageHeader, Th, Td, Empty } from "@/components/ui";
import { fmtDate, isoDate, pct, rp, rpShort } from "@/lib/format";
import type { Destination, DestStatus } from "@/lib/types";

const STATUS: Record<DestStatus, { label: string; tone: "sukses" | "galat" | "menunggu" }> = {
  BUKA: { label: "Buka - Aktif Beroperasi", tone: "sukses" },
  TUTUP: { label: "Tutup", tone: "galat" },
  PEMELIHARAAN: { label: "Pemeliharaan / Operasional Terbatas", tone: "menunggu" },
};

const blank = (): Destination => ({ id: "", code: "", name: "", kecamatan: "", category: "", manager: "", contact: "", photo: "/assets/dest-1.png", facilities: "", status: "BUKA", target_bulanan: 100_000_000, target_apbd: 1_200_000_000, baseline: 0 });

export default function DestinasiPage() {
  const { db, user, saveDestination, toast } = useStore();
  const role = user!.role;
  const locked = user!.destination_id;
  const [q, setQ] = useState("");
  const [kec, setKec] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [edit, setEdit] = useState<{ d: Destination; isNew: boolean } | null>(null);
  const [tariffFor, setTariffFor] = useState<string | null>(null);

  const month = isoDate().slice(0, 7);
  const list = useMemo(() => db.destinations.filter((d) =>
    (!locked || role === "ADMIN_SISTEM" || d.id === locked || role === "ADMIN_DINAS") &&
    (kec === "ALL" || d.kecamatan === kec) && (status === "ALL" || d.status === status) &&
    (`${d.name} ${d.code} ${d.manager} ${d.kecamatan}`.toLowerCase().includes(q.toLowerCase()))), [db.destinations, q, kec, status, locked, role]);

  const monthReal = (id: string) => db.sales.filter((s) => s.destination_id === id && s.created_at.slice(0, 7) === month).reduce((a, b) => a + b.total, 0);
  const totalMonth = db.destinations.reduce((a, d) => a + monthReal(d.id), 0);
  const activeTariffs = db.tariffs.filter((t) => t.active);

  const submit = async () => {
    if (!edit) return;
    const d = edit.d;
    if (!d.code.trim() || !d.name.trim() || !d.kecamatan.trim()) return toast("Kode, nama, dan kecamatan wajib diisi", "error");
    try {
      await saveDestination({ ...d, id: d.id || d.code }, edit.isNew);
      toast(edit.isNew ? "Destinasi baru ditambahkan" : "Perubahan destinasi disimpan & tercatat di audit log");
      setEdit(null);
    } catch (e) { toast((e as Error).message, "error"); }
  };

  const canEdit = (d: Destination) => role === "ADMIN_SISTEM" || (role === "PENGELOLA" && d.id === locked);

  return (
    <>
      <PageHeader crumb="Destinasi & Retribusi" title="Manajemen Destinasi Wisata & Penetapan Tarif Retribusi Daerah"
        desc="Penetapan tarif SKRD, monitoring pendapatan pos gerbang tiket terintegrasi, dan validasi kepatuhan Perda No. 04/2024 untuk pengelolaan PAD pariwisata pesisir Lampung Selatan."
        actions={<>
          {can.manageTariff(role) && locked && <Btn variant="teal" onClick={() => setTariffFor(locked)}>â‡„ Perbarui Tarif SKRD</Btn>}
          {can.createDestination(role) && <Btn onClick={() => setEdit({ d: blank(), isNew: true })}>ï¼‹ Tambah Destinasi Baru</Btn>}
        </>} />

      <Card className="mb-6 p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_200px_220px]">
          <input className={inputCls} placeholder="ðŸ” Cari destinasi, kode, atau pengelolaâ€¦" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className={inputCls} value={kec} onChange={(e) => setKec(e.target.value)}>
            <option value="ALL">Semua Kecamatan</option>
            {[...new Set(db.destinations.map((d) => d.kecamatan))].map((k) => <option key={k}>{k}</option>)}
          </select>
          <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="ALL">Semua Status</option>
            <option value="BUKA">Buka</option><option value="TUTUP">Tutup</option><option value="PEMELIHARAAN">Pemeliharaan</option>
          </select>
        </div>
      </Card>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Summary icon="ðŸ’³" label="Total PAD Wisata Bulan Ini" value={rp(totalMonth)} sub="Nilai transaksi tercatat seluruh destinasi" />
        <Summary icon="ðŸ“¹" label="Infrastruktur Pos Pantau" value={`${db.destinations.filter((d) => d.status === "BUKA").length} dari ${db.destinations.length} Destinasi Buka`} sub="Terkoneksi command center Bapenda" />
        <Summary icon="âš–ï¸" label="Kepatuhan Tarif Retribusi" value={`${activeTariffs.length} Tarif Aktif Sesuai Perda`} sub="Setiap tarif memiliki nomor SK/Perda" />
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-head text-base font-semibold text-navy">Katalog Profil {list.length} Destinasi</h2>
        <span className="text-xs text-muted">Data mutakhir per {fmtDate(new Date())}</span>
      </div>
      <div className="space-y-4">
        {list.map((d) => {
          const real = monthReal(d.id);
          const tariffs = activeTariffs.filter((t) => t.destination_id === d.id);
          return (
            <Card key={d.id} className="overflow-hidden transition hover:shadow-hover">
              <div className="grid md:grid-cols-[260px_1fr]">
                <div className="relative min-h-[200px] bg-slate-200">
                  {d.photo.startsWith("data:") ? <img src={d.photo} alt={d.name} className="absolute inset-0 h-full w-full object-cover" /> : <Image src={d.photo} alt={d.name} fill className="object-cover" sizes="260px" />}
                  <span className="absolute left-3 top-3 rounded-full bg-navy px-3 py-1 text-[11px] font-semibold text-white">Kecamatan {d.kecamatan}</span>
                </div>
                <div className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="max-w-xl">
                      <div className="flex flex-wrap items-center gap-2"><Badge tone={STATUS[d.status].tone}>{STATUS[d.status].label}</Badge><span className="text-[11px] text-muted">ID Pos: {d.code}</span></div>
                      <h3 className="mt-1 font-head text-lg font-semibold text-navy">{d.name}</h3>
                      <p className="text-xs text-muted">{d.category} | Pengelola: <b className="text-slate-700">{d.manager}</b> | Kontak: {d.contact}</p>
                      <p className="mt-1 text-xs text-muted">Fasilitas: {d.facilities}</p>
                    </div>
                    <div className="rounded-card bg-slate-50 px-4 py-3 text-right">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Realisasi PAD Bulan Ini</p>
                      <p className="font-head text-2xl font-bold text-navy tabular-nums">{rp(real)}</p>
                      <p className="text-[11px] font-semibold text-teal">{pct((real / d.target_bulanan) * 100, 2)} dari target {rpShort(d.target_bulanan)}</p>
                    </div>
                  </div>
                  <div className="mt-4 rounded-card border border-line p-3">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">Struktur Tarif SKRD Resmi</p>
                    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                      {tariffs.map((t) => (
                        <div key={t.id} className="rounded-ctl bg-slate-50 px-3 py-2 text-center">
                          <p className="text-[11px] text-muted">{t.name}</p>
                          <p className="text-sm font-semibold text-navy tabular-nums">{rp(t.amount)} / {t.unit}</p>
                        </div>
                      ))}
                      {tariffs.length === 0 && <p className="col-span-4 text-xs text-muted">Belum ada tarif aktif.</p>}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Btn variant="outline" className="!min-h-[34px] text-xs" onClick={() => setTariffFor(d.id)}>ðŸ’² {can.manageTariff(role) && d.id === locked ? "Kelola Tarif" : "Lihat Tarif & Riwayat"}</Btn>
                    {canEdit(d) && <Btn className="!min-h-[34px] text-xs" onClick={() => setEdit({ d: { ...d }, isNew: false })}>âœŽ Ubah Data Destinasi</Btn>}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
        {list.length === 0 && <Card><Empty text="Tidak ada destinasi yang cocok dengan filter." /></Card>}
      </div>

      <PerdaTable />

      <DestinationModal edit={edit} setEdit={setEdit} submit={submit} />
      {tariffFor && <TariffModal destId={tariffFor} onClose={() => setTariffFor(null)} />}
    </>
  );
}

function Summary({ icon, label, value, sub }: { icon: string; label: string; value: string; sub: string }) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <span className="flex h-12 w-12 items-center justify-center rounded-card bg-blue-50 text-xl">{icon}</span>
      <div><p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</p><p className="font-head text-lg font-bold text-navy">{value}</p><p className="text-xs text-muted">{sub}</p></div>
    </Card>
  );
}

function DestinationModal({ edit, setEdit, submit }: { edit: { d: Destination; isNew: boolean } | null; setEdit: (v: { d: Destination; isNew: boolean } | null) => void; submit: () => void }) {
  if (!edit) return null;
  const d = edit.d;
  const set = (k: keyof Destination, v: string | number) => setEdit({ ...edit, d: { ...d, [k]: v } });
  const onFile = (f?: File) => {
    if (!f) return;
    if (f.size > 600_000) return alert("Ukuran foto maksimal 600 KB untuk mode demo");
    const r = new FileReader();
    r.onload = () => set("photo", String(r.result));
    r.readAsDataURL(f);
  };
  return (
    <Modal open onClose={() => setEdit(null)} title={edit.isNew ? "Tambah Destinasi Baru" : `Ubah Destinasi ${d.code}`} wide>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Kode Unik *"><input className={inputCls} value={d.code} disabled={!edit.isNew} onChange={(e) => set("code", e.target.value.toUpperCase())} placeholder="DTN-XXX-06" /></Field>
        <Field label="Nama Destinasi *"><input className={inputCls} value={d.name} onChange={(e) => set("name", e.target.value)} /></Field>
        <Field label="Lokasi (Kecamatan) *"><input className={inputCls} value={d.kecamatan} onChange={(e) => set("kecamatan", e.target.value)} /></Field>
        <Field label="Kategori"><input className={inputCls} value={d.category} onChange={(e) => set("category", e.target.value)} /></Field>
        <Field label="Pengelola"><input className={inputCls} value={d.manager} onChange={(e) => set("manager", e.target.value)} /></Field>
        <Field label="Kontak"><input className={inputCls} value={d.contact} onChange={(e) => set("contact", e.target.value)} /></Field>
        <Field label="Status Operasional">
          <select className={inputCls} value={d.status} onChange={(e) => set("status", e.target.value)}>
            <option value="BUKA">Buka</option><option value="TUTUP">Tutup</option><option value="PEMELIHARAAN">Pemeliharaan</option>
          </select>
        </Field>
        <Field label="Foto Destinasi"><input type="file" accept="image/*" className={inputCls + " pt-2"} onChange={(e) => onFile(e.target.files?.[0])} /></Field>
        <Field label="Target Bulanan (Rp)"><input type="number" min={0} className={inputCls} value={d.target_bulanan} onChange={(e) => set("target_bulanan", Number(e.target.value))} /></Field>
        <Field label="Target APBD Tahunan (Rp)"><input type="number" min={0} className={inputCls} value={d.target_apbd} onChange={(e) => set("target_apbd", Number(e.target.value))} /></Field>
        <div className="md:col-span-2"><Field label="Fasilitas"><textarea className={inputCls + " h-20 py-2"} value={d.facilities} onChange={(e) => set("facilities", e.target.value)} /></Field></div>
      </div>
      <div className="mt-6 flex justify-end gap-2"><Btn variant="outline" onClick={() => setEdit(null)}>Batal</Btn><Btn onClick={submit}>Simpan</Btn></div>
    </Modal>
  );
}

function TariffModal({ destId, onClose }: { destId: string; onClose: () => void }) {
  const { db, user, saveTariff, toggleTariff, toast } = useStore();
  const d = db.destinations.find((x) => x.id === destId)!;
  const editable = can.manageTariff(user!.role) && user!.destination_id === destId;
  const [f, setF] = useState({ name: "", category: "WISATAWAN", unit: "org", amount: 0, sk_number: "Perda Kab. Lampung Selatan No. 04/2024", effective_from: isoDate() });
  const tariffs = db.tariffs.filter((t) => t.destination_id === destId).sort((a, b) => Number(b.active) - Number(a.active) || b.effective_from.localeCompare(a.effective_from));

  const submit = async () => {
    if (!f.name.trim() || f.amount <= 0 || !f.sk_number.trim()) return toast("Nama, nominal, dan nomor SK/Perda wajib diisi", "error");
    await saveTariff({ ...f, destination_id: destId });
    toast("Tarif versi baru disimpan. Transaksi lama tetap memakai harga snapshot (BR-01).");
    setF({ ...f, name: "", amount: 0 });
  };

  return (
    <Modal open onClose={onClose} title={`Master Tiket & Tarif - ${d.name}`} wide>
      <div className="overflow-x-auto rounded-card border border-line">
        <table className="w-full text-sm">
          <thead><tr><Th>Jenis Tiket</Th><Th right>Tarif</Th><Th>SK / Perda</Th><Th>Berlaku</Th><Th>Status</Th>{editable && <Th />}</tr></thead>
          <tbody>
            {tariffs.map((t) => (
              <tr key={t.id} className={t.active ? "" : "text-muted"}>
                <Td><b>{t.name}</b><br /><span className="text-xs">{t.category}</span></Td>
                <Td right>{rp(t.amount)}/{t.unit}</Td>
                <Td className="text-xs">{t.sk_number}</Td>
                <Td className="text-xs">{fmtDate(t.effective_from)} â€“ {t.effective_until ? fmtDate(t.effective_until) : "sekarang"}</Td>
                <Td><Badge tone={t.active ? "sukses" : "netral"}>{t.active ? "Aktif" : "Nonaktif / Riwayat"}</Badge></Td>
                {editable && <Td><button className="text-xs font-semibold text-action hover:underline" onClick={() => toggleTariff(t.id)}>{t.active ? "Nonaktifkan" : "Aktifkan"}</button></Td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editable ? (
        <div className="mt-5 rounded-card border border-line bg-slate-50 p-4">
          <p className="mb-3 text-sm font-semibold text-navy">Tetapkan Tarif / Versi Baru</p>
          <p className="mb-3 text-xs text-muted">Jika nama jenis tiket sama dengan tarif aktif, tarif lama otomatis ditutup (bukan ditimpa) sehingga riwayat & transaksi lama tetap utuh.</p>
          <div className="grid gap-3 md:grid-cols-3">
            <Field label="Nama Jenis Tiket"><input className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} list="tt-names" /></Field>
            <datalist id="tt-names">{[...new Set(tariffs.map((t) => t.name))].map((n) => <option key={n} value={n} />)}</datalist>
            <Field label="Kategori"><select className={inputCls} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>{["WISATAWAN", "KENDARAAN", "DERMAGA", "FASILITAS"].map((c) => <option key={c}>{c}</option>)}</select></Field>
            <Field label="Satuan"><input className={inputCls} value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })} /></Field>
            <Field label="Nominal (Rp)"><input type="number" min={0} className={inputCls} value={f.amount || ""} onChange={(e) => setF({ ...f, amount: Number(e.target.value) })} /></Field>
            <Field label="Nomor SK / Perda"><input className={inputCls} value={f.sk_number} onChange={(e) => setF({ ...f, sk_number: e.target.value })} /></Field>
            <Field label="Berlaku Mulai"><input type="date" className={inputCls} value={f.effective_from} onChange={(e) => setF({ ...f, effective_from: e.target.value })} /></Field>
          </div>
          <div className="mt-4 flex justify-end"><Btn variant="teal" onClick={submit}>Simpan Tarif</Btn></div>
        </div>
      ) : <p className="mt-4 text-xs text-muted">Hanya Pengelola Destinasi terkait yang dapat mengubah tarif (RBAC). Nilai tarif adalah contoh dan perlu divalidasi ke Dinas Pariwisata &amp; BPKAD.</p>}
    </Modal>
  );
}

function PerdaTable() {
  const { db } = useStore();
  const rows = db.tariffs.filter((t) => t.active);
  return (
    <Card className="mt-8 overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 p-6">
        <div>
          <Badge tone="info">Regulasi Resmi Bapenda &amp; Pariwisata</Badge>
          <h2 className="mt-2 font-head text-xl font-semibold text-navy">Ringkasan Peraturan Daerah (Perda Retribusi No. 04/2024)</h2>
          <p className="text-sm text-muted">Pajak Daerah dan Retribusi Daerah (PDRD) Kabupaten Lampung Selatan - Sektor Kepariwisataan &amp; Rekreasi Bahari</p>
        </div>
        <Btn variant="outline" onClick={() => window.print()}>â¬‡ Cetak Lembaran Daerah</Btn>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr><Th>Nomor Regulasi</Th><Th>Destinasi</Th><Th>Klasifikasi Objek Retribusi</Th><Th right>Tarif Dasar</Th><Th>Tanggal Efektif</Th><Th>Status Hukum</Th></tr></thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50">
                <Td className="text-xs">{t.sk_number}</Td>
                <Td>{db.destinations.find((d) => d.id === t.destination_id)?.name}</Td>
                <Td>{t.name} ({t.category.toLowerCase()})</Td>
                <Td right className="font-mono">{rp(t.amount)} / {t.unit}</Td>
                <Td>{fmtDate(t.effective_from)}</Td>
                <Td><Badge tone="sukses">Berlaku Penuh</Badge></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="border-t border-line px-6 py-3 text-xs text-muted">â“˜ Sinkronisasi tarif loket otomatis ke seluruh mesin POS. Tarif dalam sistem demo adalah contoh dan bukan tarif resmi (BR-10).</p>
    </Card>
  );
}
