"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { can } from "@/lib/rbac";
import { Badge, Btn, Card, Field, inputCls, Modal, PageHeader, SectionTitle, Th, Td, Empty, type BadgeTone } from "@/components/ui";
import { downloadCsv, fmtDate, fmtTime, isoDate, pct, rp } from "@/lib/format";
import type { Reconciliation, ReconStatus } from "@/lib/types";

const ST: Record<ReconStatus, { label: string; tone: BadgeTone }> = {
  SESUAI: { label: "Sesuai", tone: "sukses" },
  TERDAPAT_SELISIH: { label: "Terdapat Selisih", tone: "galat" },
  MENUNGGU_VERIFIKASI: { label: "Menunggu Verifikasi", tone: "menunggu" },
};

export default function LaporanPage() {
  const { db, user, saveReconciliation, toast } = useStore();
  const role = user!.role;
  const locked = role === "PENGELOLA" ? user!.destination_id : null;
  const yesterday = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return isoDate(d); })();
  const [from, setFrom] = useState(yesterday);
  const [to, setTo] = useState(isoDate());
  const [fDest, setFDest] = useState(locked ?? "ALL");
  const [fStatus, setFStatus] = useState("ALL");
  const [form, setForm] = useState<{ rec: Reconciliation; deposit: string; ref: string; notes: string } | null>(null);
  const destId = locked ?? fDest;
  const destName = (id: string) => db.destinations.find((d) => d.id === id)?.name ?? id;

  const systemAmount = (id: string, date: string) => db.sales.filter((s) => s.destination_id === id && isoDate(new Date(s.created_at)) === date).reduce((a, b) => a + b.total, 0);

  // baris rekonsiliasi: data tersimpan + baris virtual "Menunggu Verifikasi" untuk yang belum diinput
  const rows = useMemo(() => {
    const out: Reconciliation[] = [];
    for (let d = new Date(to + "T00:00:00"); isoDate(d) >= from; d.setDate(d.getDate() - 1)) {
      const date = isoDate(d);
      for (const dest of db.destinations) {
        if (destId !== "ALL" && dest.id !== destId) continue;
        const saved = db.reconciliations.find((r) => r.date === date && r.destination_id === dest.id);
        const sys = systemAmount(dest.id, date);
        const r = saved ? { ...saved, system_amount: sys } : { id: `REC-${date}-${dest.id}`, date, destination_id: dest.id, system_amount: sys, deposit_amount: null, bank_ref: "", status: "MENUNGGU_VERIFIKASI" as ReconStatus, notes: "Setoran belum diinput" };
        if (r.deposit_amount !== null) r.status = r.deposit_amount === sys ? "SESUAI" : "TERDAPAT_SELISIH";
        if (fStatus === "ALL" || r.status === fStatus) out.push(r);
        if (out.length > 400) break;
      }
    }
    return out;
  }, [db.reconciliations, db.sales, db.destinations, from, to, destId, fStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  const totSys = rows.reduce((a, b) => a + b.system_amount, 0);
  const totDep = rows.reduce((a, b) => a + (b.deposit_amount ?? 0), 0);
  const totDiff = rows.reduce((a, b) => a + (b.deposit_amount === null ? 0 : b.deposit_amount - b.system_amount), 0);
  const pendingAmt = rows.filter((r) => r.status === "MENUNGGU_VERIFIKASI").reduce((a, b) => a + b.system_amount, 0);

  const exportCsv = () => downloadCsv(`rekonsiliasi-${from}_${to}.csv`, ["Tanggal", "Destinasi", "Nilai Sistem", "Nilai Setoran", "Selisih", "Status", "Referensi Bank", "Catatan"],
    rows.map((r) => [fmtDate(r.date), destName(r.destination_id), r.system_amount, r.deposit_amount ?? "", r.deposit_amount === null ? "" : r.deposit_amount - r.system_amount, ST[r.status].label, r.bank_ref, r.notes]));

  const submit = async () => {
    if (!form) return;
    try {
      const dep = form.deposit.trim() === "" ? null : Number(form.deposit);
      const r = await saveReconciliation({ date: form.rec.date, destination_id: form.rec.destination_id, deposit_amount: dep, bank_ref: form.ref, notes: form.notes });
      toast(`Rekonsiliasi disimpan: ${ST[r.status].label}`, r.status === "TERDAPAT_SELISIH" ? "info" : "success");
      setForm(null);
    } catch (e) { toast((e as Error).message, "error"); }
  };

  // Rekap PAD per objek (desain laporan)
  const month = isoDate().slice(0, 7);
  const recap = db.destinations.filter((d) => !locked || d.id === locked).map((d) => {
    const all = db.sales.filter((s) => s.destination_id === d.id);
    const thisMonth = all.filter((s) => s.created_at.slice(0, 7) === month).reduce((a, b) => a + b.total, 0);
    const before = d.baseline + all.filter((s) => s.created_at.slice(0, 7) < month).reduce((a, b) => a + b.total, 0);
    const cum = before + thisMonth;
    return { d, before, thisMonth, cum, ach: (cum / d.target_apbd) * 100 };
  });
  const sumR = (k: "before" | "thisMonth" | "cum") => recap.reduce((a, b) => a + b[k], 0);
  const sumT = recap.reduce((a, b) => a + b.d.target_apbd, 0);

  return (
    <>
      <PageHeader crumb="Laporan & Rekonsiliasi" title="Laporan Akuntabilitas PAD Pariwisata & Rekonsiliasi Kas Daerah Bank Lampung"
        desc="Audit integritas aliran dana dan retribusi elektronik: nilai sistem dibandingkan setoran nyata (RKUD) dengan status otomatis BR-08."
        actions={<>
          <Btn variant="teal" onClick={() => window.print()}>Cetak Berita Acara (BAR)</Btn>
          {can.exportCsv(role) && <Btn variant="outline" onClick={exportCsv}>Ekspor CSV</Btn>}
        </>} />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-card bg-navy p-5 text-white shadow-card">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-ctl bg-white/10 font-head text-sm font-bold text-[#9cf2e8]">RKUD</span>
          <div>
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[#9cf2e8]">Buku Kas Harian RKUD <Badge tone="sukses">Siap Ditutup Buku</Badge></p>
            <p className="mt-0.5 font-head text-lg font-semibold">Sesi Rekonsiliasi {fmtDate(from)} – {fmtDate(to)} · Cut-off {db.settings.find((s) => s.key === "CUTOFF")?.value}</p>
          </div>
        </div>
        <p className="text-right text-xs text-slate-300">Kanal terverifikasi<br /><b className="text-[#9cf2e8]">QRIS Dinamis · Tunai Loket · Virtual Account</b></p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <K label="Total Nilai Sistem (SIMPAD)" value={rp(totSys)} sub={`${rows.length} baris destinasi-hari`} />
        <K label="Penerimaan Setoran RKUD" value={rp(totDep)} sub="Rekening Kasda 381.00.01.00291.8" badge={<Badge tone="sukses">{pct(totSys ? (totDep / totSys) * 100 : 0)}</Badge>} />
        <K label="Selisih / Discrepancy" value={rp(totDiff)} sub={totSys ? `${pct((Math.abs(totDiff) / totSys) * 100, 2)} dari nilai sistem (target < 1%)` : "-"} badge={<Badge tone={totDiff === 0 ? "sukses" : "galat"}>{totDiff === 0 ? "Zero Finding" : "Tindak Lanjut"}</Badge>} danger={totDiff !== 0} />
        <K label="Menunggu Verifikasi" value={rp(pendingAmt)} sub={`${rows.filter((r) => r.status === "MENUNGGU_VERIFIKASI").length} setoran belum diinput`} badge={<Badge tone="menunggu">Antrean</Badge>} />
      </div>

      {/* US-08 */}
      <Card className="mb-6 overflow-hidden">
        <div className="p-6">
          <SectionTitle eyebrow="Rekonsiliasi PAD Harian" title="Nilai Sistem vs Setoran" desc="Selisih tidak nol wajib diberi catatan tindak lanjut." />
          <div className="grid gap-3 md:grid-cols-4">
            <Field label="Dari"><input type="date" className={inputCls} value={from} max={to} onChange={(e) => setFrom(e.target.value)} /></Field>
            <Field label="Sampai"><input type="date" className={inputCls} value={to} min={from} max={isoDate()} onChange={(e) => setTo(e.target.value)} /></Field>
            <Field label="Destinasi"><select className={inputCls} value={destId} disabled={!!locked} onChange={(e) => setFDest(e.target.value)}><option value="ALL">Semua Destinasi</option>{db.destinations.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></Field>
            <Field label="Status"><select className={inputCls} value={fStatus} onChange={(e) => setFStatus(e.target.value)}><option value="ALL">Semua Status</option>{Object.entries(ST).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></Field>
          </div>
        </div>
        <div className="max-h-[520px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10"><tr><Th>Tanggal</Th><Th>Destinasi</Th><Th right>Nilai Sistem</Th><Th right>Nilai Setoran</Th><Th right>Selisih</Th><Th>Status</Th><Th>Catatan</Th>{can.reconcile(role) && <Th />}</tr></thead>
            <tbody>
              {rows.map((r) => {
                const diff = r.deposit_amount === null ? null : r.deposit_amount - r.system_amount;
                return (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <Td>{fmtDate(r.date)}</Td>
                    <Td>{destName(r.destination_id)}</Td>
                    <Td right>{rp(r.system_amount)}</Td>
                    <Td right className="text-action">{r.deposit_amount === null ? "-" : rp(r.deposit_amount)}</Td>
                    <Td right className={diff ? "font-semibold text-[#DC2626]" : ""}>{diff === null ? "-" : rp(diff)}</Td>
                    <Td><Badge tone={ST[r.status].tone}>{ST[r.status].label}</Badge></Td>
                    <Td className="max-w-xs text-xs text-muted">{r.notes}{r.bank_ref && <span className="block font-mono">{r.bank_ref}</span>}</Td>
                    {can.reconcile(role) && <Td><button className="whitespace-nowrap text-xs font-semibold text-action hover:underline" onClick={() => setForm({ rec: r, deposit: r.deposit_amount?.toString() ?? "", ref: r.bank_ref, notes: r.status === "MENUNGGU_VERIFIKASI" ? "" : r.notes })}>{r.deposit_amount === null ? "Input Setoran" : "Ubah"}</button></Td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 && <Empty text="Tidak ada data rekonsiliasi." />}
        </div>
      </Card>

      <Card className="mb-6 overflow-hidden">
        <div className="p-6"><SectionTitle title="Rekapitulasi Pendapatan Asli Daerah (PAD) per Objek Wisata" desc={`Penyelarasan target APBD ${new Date().getFullYear()} vs perolehan kas daerah`} /></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr><Th>Nama Destinasi</Th><Th right>Target APBD</Th><Th right>Realisasi s.d. Bulan Lalu</Th><Th right>Realisasi Bulan Ini</Th><Th right>Kumulatif</Th><Th right>Capaian</Th><Th>Status Evaluasi</Th></tr></thead>
            <tbody>
              {recap.map((x) => (
                <tr key={x.d.id} className="hover:bg-slate-50">
                  <Td><b className="text-navy">{x.d.name}</b><span className="block text-xs text-muted">Kec. {x.d.kecamatan}</span></Td>
                  <Td right>{rp(x.d.target_apbd)}</Td>
                  <Td right>{rp(x.before)}</Td>
                  <Td right className="text-action">{rp(x.thisMonth)}</Td>
                  <Td right className="font-semibold">{rp(x.cum)}</Td>
                  <Td right>{pct(x.ach)}</Td>
                  <Td><Badge tone={x.d.status !== "BUKA" ? "menunggu" : x.ach >= 80 ? "sukses" : "info"}>{x.d.status !== "BUKA" ? "Faktor Cuaca / Operasional" : x.ach >= 80 ? "Sesuai Target" : "Perlu Optimalisasi"}</Badge></Td>
                </tr>
              ))}
              <tr className="bg-slate-100 font-semibold">
                <Td>TOTAL AKUMULATIF PAD PARIWISATA</Td><Td right>{rp(sumT)}</Td><Td right>{rp(sumR("before"))}</Td><Td right className="text-action">{rp(sumR("thisMonth"))}</Td><Td right>{rp(sumR("cum"))}</Td><Td right>{pct((sumR("cum") / sumT) * 100)}</Td>
                <Td><Badge tone="sukses">On-Track APBD</Badge></Td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="mb-6 p-6">
        <SectionTitle eyebrow="Legalitas & Validasi Pemerintah" title={`Berita Acara Rekonsiliasi & Pengesahan Elektronik (BAR-PAD/${String(new Date().getMonth() + 1).padStart(2, "0")}/${new Date().getFullYear()})`}
          right={<p className="text-right text-[11px] text-muted">Hash audit terakhir<br /><span className="font-mono text-navy">{db.audit_logs[0]?.hash.slice(0, 24) ?? "-"}…</span></p>} />
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["Pejabat Pengesah", "Kepala Badan Pendapatan Daerah", "Pemerintah Kabupaten Lampung Selatan", "Drs. H. M. Darmawan, M.M.", "NIP. 19720815 199803 1 004"],
            ["Verifikator Teknis", "Administrator SIMPAD Pariwisata", "Pengelola basis data & kliring e-tiket", "Hendra Kusuma, S.STP", "NIP. 19880412 201001 1 002"],
            ["Riset & Inovasi Teknologi", "Tim Peneliti & Pengembang Sistem", "Universitas Teknokrat Indonesia", "Dr. Erliyan Redy Susanto, M.Kom", "Izzatul Falahiyah Hasan"],
          ].map(([a, b, c, d, e]) => (
            <div key={a} className="rounded-card border border-line bg-slate-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{a}</p>
              <p className="font-head font-semibold text-navy">{b}</p>
              <p className="text-xs text-muted">{c}</p>
              <div className="my-3 rounded-ctl border border-line bg-white p-3 text-xs">✓ TTE BSrE disetujui · {fmtDate(new Date())}</div>
              <p className="text-sm font-semibold text-navy">{d}</p>
              <p className="text-xs text-muted">{e}</p>
            </div>
          ))}
        </div>
      </Card>

      {can.exportCsv(role) && role !== "PENGELOLA" && (
        <Card className="p-6">
          <SectionTitle title="Catatan Audit Sistem (Live Audit Trail)" right={<Link href="/audit" className="text-sm font-semibold text-action">Lihat semua →</Link>} />
          <div className="space-y-2">
            {db.audit_logs.slice(0, 4).map((l) => (
              <div key={l.id} className="flex flex-wrap items-center gap-3 rounded-ctl border border-line bg-slate-50 px-4 py-3 text-sm">
                <span className="font-mono text-xs text-muted">{fmtTime(l.created_at, true)}</span>
                <Badge tone={l.status === "SUKSES" ? "sukses" : "galat"}>{l.type}</Badge>
                <span className="flex-1">{l.description}</span>
                <span className="font-mono text-[10px] text-muted">{l.hash.slice(0, 10)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {form && (
        <Modal open onClose={() => setForm(null)} title={`Rekonsiliasi ${destName(form.rec.destination_id)} - ${fmtDate(form.rec.date)}`}>
          <div className="mb-4 rounded-ctl bg-slate-50 p-3 text-sm">Nilai transaksi sistem: <b>{rp(form.rec.system_amount)}</b></div>
          <div className="space-y-3">
            <Field label="Nilai Setoran (Rp) - kosongkan jika belum ada"><input type="number" min={0} className={inputCls} value={form.deposit} onChange={(e) => setForm({ ...form, deposit: e.target.value })} /></Field>
            <Field label="Bukti / Referensi Bank"><input className={inputCls} value={form.ref} placeholder="No. slip / mutasi RKUD" onChange={(e) => setForm({ ...form, ref: e.target.value })} /></Field>
            <Field label="Catatan Tindak Lanjut"><textarea className={inputCls + " h-20 py-2"} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
            {form.deposit !== "" && (
              <p className="text-sm">Selisih: <b className={Number(form.deposit) - form.rec.system_amount ? "text-[#DC2626]" : "text-[#16A34A]"}>{rp(Number(form.deposit) - form.rec.system_amount)}</b> → status <b>{Number(form.deposit) === form.rec.system_amount ? "Sesuai" : "Terdapat Selisih"}</b></p>
            )}
          </div>
          <div className="mt-5 flex justify-end gap-2"><Btn variant="outline" onClick={() => setForm(null)}>Batal</Btn><Btn onClick={submit}>Simpan</Btn></div>
        </Modal>
      )}
    </>
  );
}

function K({ label, value, sub, badge, danger }: { label: string; value: string; sub: string; badge?: React.ReactNode; danger?: boolean }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-2"><p className="text-xs font-semibold text-muted">{label}</p>{badge}</div>
      <p className={`metric mt-2 ${danger ? "!text-[#DC2626]" : ""}`}>{value}</p>
      <p className="mt-1 text-xs text-muted">{sub}</p>
    </Card>
  );
}

