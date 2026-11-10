"use client";
import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import Image from "next/image";
import { useStore } from "@/lib/store";
import { can } from "@/lib/rbac";
import { Badge, Btn, Card, Field, inputCls, Modal, PageHeader, Th, Td, Empty } from "@/components/ui";
import { downloadCsv, fmtDate, fmtTime, isoDate, num, pct, rp } from "@/lib/format";
import type { PayMethod, Sale, Ticket } from "@/lib/types";

const METHOD_LABEL: Record<PayMethod, string> = { QRIS: "QRIS Bank Lampung", TUNAI: "Tunai Kasir POS", TRANSFER: "Transfer / VA Bank Lampung" };

export default function TransaksiPage() {
  const { db, user } = useStore();
  const role = user!.role;
  const locked = user!.destination_id;
  const today = isoDate();
  const [receipt, setReceipt] = useState<{ sale: Sale; ticket: Ticket } | null>(null);

  // filter log
  const [q, setQ] = useState("");
  const [fDest, setFDest] = useState(locked ?? "ALL");
  const [fDate, setFDate] = useState(today);
  const [fMethod, setFMethod] = useState("ALL");
  const [fStatus, setFStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const PER = 8;

  const mineOnly = role === "PETUGAS_LOKET";
  const todaySales = db.sales.filter((s) => isoDate(new Date(s.created_at)) === today && (!locked || s.destination_id === locked));
  const sum = (m?: PayMethod) => todaySales.filter((s) => !m || s.method === m).reduce((a, b) => a + b.total, 0);
  const total = sum();
  const ticketsToday = db.tickets.filter((t) => todaySales.some((s) => s.id === t.sale_id));

  const logs = useMemo(() => {
    return db.sales.filter((s) => {
      const t = db.tickets.find((x) => x.sale_id === s.id);
      return (fDest === "ALL" || s.destination_id === fDest) && (!fDate || isoDate(new Date(s.created_at)) === fDate) && (fMethod === "ALL" || s.method === fMethod) &&
        (fStatus === "ALL" || t?.status === fStatus) && (!mineOnly || s.cashier === user!.name) && s.number.toLowerCase().includes(q.toLowerCase());
    }).sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [db.sales, db.tickets, fDest, fDate, fMethod, fStatus, q, mineOnly, user]);
  const pages = Math.max(1, Math.ceil(logs.length / PER));
  useEffect(() => setPage(1), [fDest, fDate, fMethod, fStatus, q]);
  const destName = (id: string) => db.destinations.find((d) => d.id === id)?.name ?? id;

  const exportCsv = () => downloadCsv(`log-transaksi-${fDate || "semua"}.csv`, ["No Tiket", "Waktu", "Destinasi", "Rincian", "Metode", "Subtotal", "Diskon", "Total", "Kasir", "Status Tiket"],
    logs.map((s) => [s.number, `${fmtDate(s.created_at)} ${fmtTime(s.created_at, true)}`, destName(s.destination_id), s.items.map((i) => `${i.qty} ${i.name} @${i.price}`).join("; "), s.method, s.subtotal, s.discount, s.total, s.cashier, db.tickets.find((t) => t.sale_id === s.id)?.status ?? ""]));

  return (
    <>
      <PageHeader crumb="Transaksi & E-Tiket" title="Pemantauan Transaksi Kas Masuk & Penerbitan E-Tiket Wisata Bahari"
        desc="Penjualan loket (POS) dengan tarif resmi terkunci, price snapshot, dan e-tiket QR bertanda tangan HMAC-SHA256."
        actions={can.exportCsv(role) ? <Btn variant="navy" onClick={exportCsv}>â¬‡ Export Log Transaksi (CSV)</Btn> : undefined} />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Mini label="Penerimaan Hari Ini" value={rp(total)} sub={`${num(todaySales.length)} transaksi`} bar={100} />
        <Mini label="Tiket Diterbitkan" value={num(ticketsToday.length)} sub={`${num(ticketsToday.reduce((a, b) => a + b.visitors, 0))} pengunjung`} />
        <Mini label="QRIS Bank Lampung" value={rp(sum("QRIS"))} sub={pct(total ? (sum("QRIS") / total) * 100 : 0)} bar={total ? (sum("QRIS") / total) * 100 : 0} />
        <Mini label="Karcis Tunai Loket" value={rp(sum("TUNAI"))} sub={pct(total ? (sum("TUNAI") / total) * 100 : 0)} bar={total ? (sum("TUNAI") / total) * 100 : 0} />
        <Mini label="Transfer / VA" value={rp(sum("TRANSFER"))} sub={pct(total ? (sum("TRANSFER") / total) * 100 : 0)} bar={total ? (sum("TRANSFER") / total) * 100 : 0} />
      </div>

      {can.sell(role) && locked && <Pos destId={locked} onDone={setReceipt} />}

      <Card className="mb-6 p-5">
        <div className="mb-3 flex items-center justify-between"><p className="font-head font-semibold text-navy">â›› Penyaringan &amp; Audit Transaksi</p>
          <button className="text-xs font-semibold text-action" onClick={() => { setQ(""); setFDest(locked ?? "ALL"); setFDate(today); setFMethod("ALL"); setFStatus("ALL"); }}>â†» Atur Ulang Filter</button></div>
        <div className="grid gap-3 md:grid-cols-5">
          <Field label="Nomor Tiket"><input className={inputCls} placeholder="Contoh: TKT-2026" value={q} onChange={(e) => setQ(e.target.value)} /></Field>
          <Field label="Destinasi"><select className={inputCls} value={fDest} disabled={!!locked} onChange={(e) => setFDest(e.target.value)}><option value="ALL">Semua Destinasi</option>{db.destinations.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></Field>
          <Field label="Tanggal"><input type="date" className={inputCls} value={fDate} onChange={(e) => setFDate(e.target.value)} /></Field>
          <Field label="Kanal Pembayaran"><select className={inputCls} value={fMethod} onChange={(e) => setFMethod(e.target.value)}><option value="ALL">Semua Kanal</option><option value="QRIS">QRIS</option><option value="TUNAI">Tunai</option><option value="TRANSFER">Transfer</option></select></Field>
          <Field label="Status Tiket"><select className={inputCls} value={fStatus} onChange={(e) => setFStatus(e.target.value)}><option value="ALL">Semua Status</option><option value="BELUM_DIGUNAKAN">Belum Digunakan</option><option value="SUDAH_DIGUNAKAN">Sudah Digunakan</option><option value="KEDALUWARSA">Kedaluwarsa</option></select></Field>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4"><p className="flex items-center gap-2 text-sm font-semibold text-navy"><span className="h-2 w-2 rounded-full bg-action" />Log Aliran Kas Masuk {mineOnly ? "(transaksi Anda)" : ""}</p><span className="text-xs text-muted">{num(logs.length)} transaksi</span></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr><Th>Nomor Karcis</Th><Th>Waktu (WIB)</Th><Th>Destinasi</Th><Th>Rincian Retribusi</Th><Th>Kanal Bayar</Th><Th right>Nilai Total</Th><Th>Petugas Loket</Th><Th>Status Tiket</Th><Th /></tr></thead>
            <tbody>
              {logs.slice((page - 1) * PER, page * PER).map((s) => {
                const t = db.tickets.find((x) => x.sale_id === s.id);
                return (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <Td className="font-mono text-xs">{s.number}</Td>
                    <Td className="font-mono text-xs">{fmtDate(s.created_at)} {fmtTime(s.created_at, true)}</Td>
                    <Td>{destName(s.destination_id)}</Td>
                    <Td className="text-xs">{s.items.map((i) => `${i.qty} ${i.name}`).join(" + ")}{s.discount ? <span className="block text-[#D97706]">Diskon {rp(s.discount)}</span> : null}</Td>
                    <Td><Badge>{METHOD_LABEL[s.method]}</Badge></Td>
                    <Td right className="font-semibold">{rp(s.total)}</Td>
                    <Td>â— {s.cashier}</Td>
                    <Td><TicketBadge status={t?.status} /></Td>
                    <Td>{t && <button className="text-xs font-semibold text-action hover:underline" onClick={() => setReceipt({ sale: s, ticket: t })}>E-Tiket</button>}</Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {logs.length === 0 && <Empty text="Tidak ada transaksi sesuai filter." />}
        </div>
        <div className="flex items-center justify-between border-t border-line px-5 py-3 text-xs text-muted">
          <span>Menampilkan {logs.length ? (page - 1) * PER + 1 : 0}-{Math.min(page * PER, logs.length)} dari {num(logs.length)}</span>
          <div className="flex gap-1">
            <Btn variant="outline" className="!min-h-[32px] text-xs" disabled={page === 1} onClick={() => setPage(page - 1)}>Sebelumnya</Btn>
            <span className="flex items-center rounded-ctl bg-action px-3 font-semibold text-white">{page}/{pages}</span>
            <Btn variant="outline" className="!min-h-[32px] text-xs" disabled={page === pages} onClick={() => setPage(page + 1)}>Selanjutnya</Btn>
          </div>
        </div>
      </Card>

      {receipt && <ETicket data={receipt} onClose={() => setReceipt(null)} onNew={() => setReceipt(null)} />}
    </>
  );
}

function TicketBadge({ status }: { status?: string }) {
  if (status === "SUDAH_DIGUNAKAN") return <Badge tone="sukses">Sudah Digunakan</Badge>;
  if (status === "KEDALUWARSA") return <Badge tone="galat">Kedaluwarsa</Badge>;
  return <Badge tone="menunggu">Belum Digunakan</Badge>;
}

function Mini({ label, value, sub, bar }: { label: string; value: string; sub: string; bar?: number }) {
  return (
    <Card className="p-5">
      <p className="text-xs font-semibold text-muted">{label}</p>
      <p className="mt-2 font-head text-xl font-bold text-navy tabular-nums">{value}</p>
      <p className="text-xs text-muted">{sub}</p>
      {bar !== undefined && <div className="mt-2 h-1.5 rounded-full bg-slate-100"><div className="h-full rounded-full bg-action" style={{ width: `${bar}%` }} /></div>}
    </Card>
  );
}

/** US-04 / FR-009, FR-010 */
function Pos({ destId, onDone }: { destId: string; onDone: (r: { sale: Sale; ticket: Ticket }) => void }) {
  const { db, createSale, toast } = useStore();
  const dest = db.destinations.find((d) => d.id === destId)!;
  const tariffs = db.tariffs.filter((t) => t.destination_id === destId && t.active);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [discount, setDiscount] = useState(0);
  const [method, setMethod] = useState<PayMethod>("TUNAI");
  const [cash, setCash] = useState(0);
  const [validDate, setValidDate] = useState(isoDate());
  const [busy, setBusy] = useState(false);

  const items = tariffs.filter((t) => (qty[t.id] ?? 0) > 0).map((t) => ({ tariff_id: t.id, name: t.name, price: t.amount, qty: qty[t.id], subtotal: t.amount * qty[t.id] }));
  const subtotal = items.reduce((a, b) => a + b.subtotal, 0);
  const disc = Math.min(discount, subtotal);
  const total = subtotal - disc;
  const change = cash - total;
  const closed = dest.status === "TUTUP";

  const confirm = async () => {
    setBusy(true);
    try {
      const r = await createSale({ destination_id: destId, items, discount: disc, method, cash_received: cash, valid_date: validDate });
      toast(`Transaksi ${r.sale.number} berhasil - e-tiket diterbitkan`);
      setQty({}); setDiscount(0); setCash(0);
      onDone(r);
    } catch (e) { toast((e as Error).message, "error"); }
    setBusy(false);
  };

  return (
    <Card className="mb-6 p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div><p className="text-[11px] font-semibold uppercase tracking-wider text-action">Penjualan Loket (POS)</p><h2 className="font-head text-xl font-semibold text-navy">Penerbitan Tiket Loket - {dest.name}</h2></div>
        <Badge tone="info">ðŸ”’ Destinasi terkunci sesuai penugasan</Badge>
      </div>
      {closed && <p className="mb-4 rounded-ctl bg-[#FEE2E2] p-3 text-sm text-[#DC2626]">Destinasi berstatus TUTUP - penjualan tidak tersedia.</p>}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="grid gap-3 sm:grid-cols-2">
          {tariffs.map((t) => (
            <div key={t.id} className="flex items-center justify-between rounded-card border border-line p-4">
              <div><p className="font-semibold text-navy">{t.name}</p><p className="text-sm text-muted tabular-nums">{rp(t.amount)} / {t.unit}</p></div>
              <div className="flex items-center gap-2">
                <button className="h-11 w-11 rounded-ctl border border-line text-xl font-bold text-navy hover:bg-slate-50" onClick={() => setQty({ ...qty, [t.id]: Math.max(0, (qty[t.id] ?? 0) - 1) })}>âˆ’</button>
                <span className="w-8 text-center text-lg font-bold tabular-nums">{qty[t.id] ?? 0}</span>
                <button className="h-11 w-11 rounded-ctl bg-action text-xl font-bold text-white hover:bg-action-hover" onClick={() => setQty({ ...qty, [t.id]: (qty[t.id] ?? 0) + 1 })}>+</button>
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-card border border-line bg-slate-50 p-5">
          <div className="space-y-1 text-sm">
            {items.map((i) => <div key={i.tariff_id} className="flex justify-between"><span>{i.qty} Ã— {i.name}</span><span className="tabular-nums">{rp(i.subtotal)}</span></div>)}
            {items.length === 0 && <p className="text-muted">Keranjang kosong - tambahkan tiket.</p>}
          </div>
          <div className="my-3 border-t border-line" />
          <div className="flex justify-between text-sm"><span>Subtotal</span><span className="tabular-nums">{rp(subtotal)}</span></div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Field label="Diskon (Rp)"><input type="number" min={0} className={inputCls} value={discount || ""} onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))} /></Field>
            <Field label="Tanggal Berlaku"><input type="date" className={inputCls} value={validDate} min={isoDate()} onChange={(e) => setValidDate(e.target.value)} /></Field>
          </div>
          <div className="mt-3 flex items-end justify-between"><span className="text-sm font-semibold">TOTAL</span><span className="font-head text-2xl font-bold text-navy tabular-nums">{rp(total)}</span></div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {(["TUNAI", "QRIS", "TRANSFER"] as PayMethod[]).map((m) => (
              <button key={m} onClick={() => setMethod(m)} className={`min-h-[42px] rounded-ctl border text-sm font-semibold ${method === m ? "border-action bg-action text-white" : "border-line bg-white text-navy"}`}>{m === "TUNAI" ? "Tunai" : m === "QRIS" ? "QRIS" : "Transfer"}</button>
            ))}
          </div>
          {method === "TUNAI" ? (
            <div className="mt-3">
              <Field label="Uang Diterima (Rp)"><input type="number" min={0} className={inputCls} value={cash || ""} onChange={(e) => setCash(Number(e.target.value))} /></Field>
              <div className="mt-2 flex flex-wrap gap-1">{[total, 50_000, 100_000, 200_000].filter((v, i, a) => v > 0 && a.indexOf(v) === i).map((v) => <button key={v} onClick={() => setCash(v)} className="rounded-full border border-line bg-white px-2 py-1 text-xs">{rp(v)}</button>)}</div>
              <p className={`mt-2 flex justify-between text-sm font-semibold ${change < 0 ? "text-[#DC2626]" : "text-[#16A34A]"}`}><span>Kembalian</span><span className="tabular-nums">{change < 0 ? "Kurang " + rp(-change) : rp(change)}</span></p>
            </div>
          ) : <p className="mt-3 rounded-ctl bg-white p-3 text-xs text-muted">{method === "QRIS" ? "Tampilkan QRIS Dinamis Bank Lampung (NMID ID10268847291). Konfirmasi setelah pembayaran berhasil." : "Transfer ke VA Kas Daerah Bank Lampung. Konfirmasi setelah dana masuk."} Verifikasi akhir melalui rekonsiliasi setoran.</p>}
          <Btn className="mt-4 w-full !min-h-[48px] text-base" disabled={busy || closed || items.length === 0 || (method === "TUNAI" && change < 0)} onClick={confirm}>{busy ? "Memprosesâ€¦" : "Konfirmasi & Terbitkan E-Tiket"}</Btn>
        </div>
      </div>
    </Card>
  );
}

/** US-05 / FR-011, FR-012 */
function ETicket({ data, onClose, onNew }: { data: { sale: Sale; ticket: Ticket }; onClose: () => void; onNew: () => void }) {
  const { db } = useStore();
  const { sale, ticket } = data;
  const [qr, setQr] = useState("");
  const payload = `LTR|${ticket.code}|${ticket.destination_id}|${ticket.valid_date}|${ticket.signature}`;
  useEffect(() => { QRCode.toDataURL(payload, { margin: 1, width: 240, color: { dark: "#16324F" } }).then(setQr); }, [payload]);
  const dest = db.destinations.find((d) => d.id === ticket.destination_id);
  return (
    <Modal open onClose={onClose} title="E-Tiket Berhasil Diterbitkan">
      <div id="eticket" className="rounded-card border-2 border-dashed border-navy/30 p-5 text-center">
        <div className="mb-3 flex items-center justify-center gap-2">
          <Image src="/assets/logo-lamsel.png" alt="Logo Pemda Lampung Selatan" width={30} height={40} className="h-10 w-auto" />
          <Image src="/assets/logo-uti.png" alt="Logo UTI" width={40} height={40} className="h-10 w-10" />
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">E-Tiket Retribusi Wisata - Kab. Lampung Selatan</p>
        <p className="font-head text-lg font-bold text-navy">{dest?.name}</p>
        {qr && <img src={qr} alt="QR e-tiket" className="mx-auto my-3 h-48 w-48" />}
        <p className="font-mono text-sm font-bold tracking-wider text-navy">{ticket.code}</p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-left text-xs">
          <span className="text-muted">Tanggal berlaku</span><b className="text-right">{fmtDate(ticket.valid_date)}</b>
          <span className="text-muted">Rincian</span><b className="text-right">{ticket.summary}</b>
          {sale.discount > 0 && <><span className="text-muted">Diskon</span><b className="text-right">{rp(sale.discount)}</b></>}
          <span className="text-muted">Total</span><b className="text-right">{rp(sale.total)}</b>
          <span className="text-muted">Metode</span><b className="text-right">{METHOD_LABEL[sale.method]}</b>
          {sale.method === "TUNAI" && <><span className="text-muted">Tunai / Kembali</span><b className="text-right">{rp(sale.cash_received)} / {rp(sale.change)}</b></>}
          <span className="text-muted">Kasir</span><b className="text-right">{sale.cashier}</b>
          <span className="text-muted">Waktu</span><b className="text-right">{fmtDate(sale.created_at)} {fmtTime(sale.created_at)}</b>
        </div>
        <p className="mt-3 break-all font-mono text-[9px] text-muted">HMAC-SHA256: {ticket.signature.slice(0, 32)}â€¦</p>
        <p className="mt-1 text-[10px] text-muted">Sistem Demo &amp; Simulasi - Data Sintetis</p>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 print:hidden">
        <Btn variant="outline" onClick={() => window.print()}>ðŸ–¨ Cetak</Btn>
        <Btn onClick={onNew}>Transaksi Baru</Btn>
      </div>
    </Modal>
  );
}
