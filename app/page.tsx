"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { Badge, Btn, Card, inputCls, Tip, Th, Td, SectionTitle } from "@/components/ui";
import { downloadCsv, fmtDate, fmtTime, isoDate, num, pct, rp, rpShort } from "@/lib/format";

type Period = "today" | "7d" | "month" | "custom";
const PERIODS: [Period, string][] = [
  ["today", "Hari Ini"],
  ["7d", "7 Hari"],
  ["month", "Bulan Ini"],
  ["custom", "Kustom"],
];

export default function Dashboard() {
  const { db, user } = useStore();
  const locked = user?.destination_id ?? null;
  const [period, setPeriod] = useState<Period>("month");
  const [dest, setDest] = useState<string>(locked ?? "ALL");
  const today = isoDate();
  const [from, setFrom] = useState(today.slice(0, 8) + "01");
  const [to, setTo] = useState(today);

  const range = useMemo(() => {
    const d = new Date();
    if (period === "today") return [today, today];
    if (period === "7d") {
      d.setDate(d.getDate() - 6);
      return [isoDate(d), today];
    }
    if (period === "month") return [today.slice(0, 8) + "01", today];
    return [from, to];
  }, [period, from, to, today]);

  const destId = locked ?? dest;
  const inScope = (id: string, date: string) => (destId === "ALL" || id === destId) && date >= range[0] && date <= range[1];

  const data = useMemo(() => {
    const sales = db.sales.filter((s) => inScope(s.destination_id, isoDate(new Date(s.created_at))));
    const tickets = db.tickets.filter((t) => sales.some((s) => s.id === t.sale_id));
    const visits = db.validations.filter((v) => v.result === "VALID" && inScope(v.destination_id, isoDate(new Date(v.created_at))));
    const recs = db.reconciliations.filter((r) => inScope(r.destination_id, r.date));
    const nilai = sales.reduce((a, b) => a + b.total, 0);
    const verified = recs.filter((r) => r.status !== "MENUNGGU_VERIFIKASI").reduce((a, b) => a + Math.min(b.deposit_amount ?? 0, b.system_amount), 0);
    const selisih = recs.reduce((a, b) => a + (b.deposit_amount === null ? 0 : b.deposit_amount - b.system_amount), 0);
    const pending = recs.filter((r) => r.status === "MENUNGGU_VERIFIKASI").length;
    const ticketsSold = tickets.reduce((a, b) => a + b.visitors, 0);
    const confirmed = visits.reduce((a, b) => a + b.visitors, 0);
    const days = Math.max(1, (new Date(range[1]).getTime() - new Date(range[0]).getTime()) / 86400000 + 1);
    const dests = destId === "ALL" ? db.destinations : db.destinations.filter((d) => d.id === destId);
    const target = dests.reduce((a, b) => a + b.target_bulanan, 0) * (days / 30);

    const byDay = new Map<string, { nilai: number; visit: number }>();
    for (let t = new Date(range[0] + "T00:00:00"); isoDate(t) <= range[1]; t.setDate(t.getDate() + 1)) {
      byDay.set(isoDate(t), { nilai: 0, visit: 0 });
    }
    sales.forEach((s) => {
      const k = isoDate(new Date(s.created_at));
      const e = byDay.get(k);
      if (e) e.nilai += s.total;
    });
    visits.forEach((v) => {
      const k = isoDate(new Date(v.created_at));
      const e = byDay.get(k);
      if (e) e.visit += v.visitors;
    });

    const trend =
      range[0] === range[1]
        ? Array.from({ length: 11 }, (_, i) => {
            const h = 7 + i;
            return {
              label: `${String(h).padStart(2, "0")}:00`,
              nilai: sales.filter((s) => new Date(s.created_at).getHours() === h).reduce((a, b) => a + b.total, 0),
              visit: visits.filter((v) => new Date(v.created_at).getHours() === h).reduce((a, b) => a + b.visitors, 0),
            };
          })
        : [...byDay.entries()].map(([k, v]) => ({ label: k.slice(8) + "/" + k.slice(5, 7), ...v }));

    const perDest = db.destinations
      .map((d) => ({
        d,
        nilai: sales.filter((s) => s.destination_id === d.id).reduce((a, b) => a + b.total, 0),
        visit: visits.filter((v) => v.destination_id === d.id).reduce((a, b) => a + b.visitors, 0),
      }))
      .filter((x) => destId === "ALL" || x.d.id === destId)
      .sort((a, b) => b.nilai - a.nilai);

    const typeMap = new Map<string, number>();
    sales.forEach((s) => s.items.forEach((i) => typeMap.set(i.name, (typeMap.get(i.name) ?? 0) + i.qty)));
    const types = [...typeMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);

    const recent = [...sales].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 6);
    return { nilai, verified, selisih, pending, ticketsSold, confirmed, target, trend, perDest, types, recent, count: sales.length, recCount: recs.length };
  }, [db, range, destId]); // eslint-disable-line react-hooks/exhaustive-deps

  const maxTrend = Math.max(1, ...data.trend.map((t) => t.nilai));
  const maxVisit = Math.max(1, ...data.trend.map((t) => t.visit));
  const achievement = data.target ? (data.nilai / data.target) * 100 : 0;
  const totalTypes = data.types.reduce((a, b) => a + b[1], 0) || 1;
  const destName = (id: string) => db.destinations.find((d) => d.id === id)?.name ?? id;
  const COLORS = ["#16324F", "#2563EB", "#0F766E", "#4fa69d", "#F59E0B", "#94A3B8"];

  return (
    <>
      <Card className="mb-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <Badge tone="info">Tahun Anggaran {new Date().getFullYear()}</Badge>
              <span className="text-xs font-medium text-muted">Bapenda &amp; Dinas Pariwisata Kab. Lampung Selatan</span>
            </div>
            <h1 className="font-head text-2xl font-bold text-navy md:text-[28px]">Selamat datang, {user?.name.split(",")[0]}</h1>
            <p className="mt-0.5 text-sm text-muted">Laporan konsolidasi penerimaan retribusi kawasan strategis pariwisata bahari &amp; Krakatau</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-ctl border border-line bg-slate-50 p-1">
              {PERIODS.map(([k, l]) => (
                <button
                  key={k}
                  onClick={() => setPeriod(k)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${period === k ? "bg-white text-action shadow-card" : "text-slate-600 hover:text-navy"}`}
                >
                  {l}
                </button>
              ))}
            </div>
            {period === "custom" && (
              <>
                <input type="date" className={inputCls + " !w-auto"} value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
                <input type="date" className={inputCls + " !w-auto"} value={to} min={from} max={today} onChange={(e) => setTo(e.target.value)} />
              </>
            )}
            <select className={inputCls + " !w-auto"} value={destId} disabled={!!locked} onChange={(e) => setDest(e.target.value)}>
              <option value="ALL">Semua Destinasi</option>
              {db.destinations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <Btn
              onClick={() =>
                downloadCsv(
                  `ringkasan-${range[0]}_${range[1]}.csv`,
                  ["Destinasi", "Nilai Transaksi Tercatat", "Kunjungan Terkonfirmasi"],
                  data.perDest.map((x) => [x.d.name, x.nilai, x.visit])
                )
              }
            >
              Unduh Laporan Ringkas
            </Btn>
          </div>
        </div>
        <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-muted">
          Periode pantauan: <b className="text-navy">{fmtDate(range[0])}</b> s.d. <b className="text-navy">{fmtDate(range[1])}</b> · Cakupan:{" "}
          <b className="text-navy">{destId === "ALL" ? "Semua destinasi wisata bahari" : destName(destId)}</b>
        </p>
      </Card>

      {/* 6 KPI */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Kpi
          label="Nilai Transaksi Tercatat"
          tip="Akumulasi penjualan loket menurut sistem (BR-05). Belum berarti dana sudah masuk ke rekening kas daerah."
          badge={<Badge tone="info">{num(data.count)} transaksi</Badge>}
          value={rp(data.nilai)}
          foot={`Rata-rata ${rp(data.count ? data.nilai / data.count : 0)} per transaksi`}
        />
        <Kpi
          label="Penerimaan Terverifikasi"
          tip="Hanya dana yang cocok dengan setoran/mutasi RKUD dan sudah diverifikasi pada rekonsiliasi (BR-06)."
          badge={<Badge tone="sukses">Terverifikasi RKUD</Badge>}
          value={rp(data.verified)}
          foot={`${data.recCount} rekonsiliasi harian · ${data.pending} menunggu verifikasi`}
          tone="teal"
        />
        <Kpi
          label="Capaian Target PAD"
          tip="Nilai transaksi tercatat dibanding target bulanan destinasi yang diprorata sesuai panjang periode."
          badge={<Badge tone={achievement >= 85 ? "sukses" : "peringatan"}>{achievement >= 85 ? "Sesuai Target" : "Perlu Optimalisasi"}</Badge>}
          value={pct(achievement)}
          foot={`Target prorata periode: ${rpShort(data.target)}`}
          progress={achievement}
        />
        <Kpi
          label="Tiket Terjual (Pengunjung)"
          tip="Jumlah pengunjung pada tiket yang diterbitkan loket POS."
          badge={<Badge>Loket POS</Badge>}
          value={num(data.ticketsSold)}
          foot="Total pengunjung pada e-tiket terbit"
        />
        <Kpi
          label="Kunjungan Terkonfirmasi"
          tip="Dihitung hanya dari pemindaian e-tiket berstatus VALID di gerbang masuk (BR-07)."
          badge={<Badge tone="sukses">Gerbang QR</Badge>}
          value={num(data.confirmed)}
          foot={`${pct(data.ticketsSold ? (data.confirmed / data.ticketsSold) * 100 : 0)} dari tiket terjual telah masuk`}
          tone="teal"
        />
        <Kpi
          label="Selisih Rekonsiliasi"
          tip="Total selisih antara setoran kas daerah dengan nilai sistem pada periode ini."
          badge={<Badge tone={data.selisih === 0 ? "sukses" : "galat"}>{data.selisih === 0 ? "Nihil Selisih" : "Terdapat Selisih"}</Badge>}
          value={rp(data.selisih)}
          foot={data.pending ? `${data.pending} setoran harian menunggu input` : "Seluruh setoran periode tercatat"}
          danger={data.selisih !== 0}
        />
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-3">
        {/* Tren */}
        <Card className="p-6 xl:col-span-2">
          <SectionTitle
            eyebrow="Tren Penerimaan & Kunjungan"
            title={range[0] === range[1] ? "Nilai Transaksi & Kunjungan per Jam" : "Tren Nilai Transaksi & Kunjungan Harian"}
            right={
              <div className="flex items-center gap-4 text-xs text-muted">
                <span className="flex items-center gap-1.5">
                  <i className="h-3 w-3 rounded-sm bg-navy" /> Nilai Transaksi (Rp)
                </span>
                <span className="flex items-center gap-1.5">
                  <i className="h-0.5 w-4 bg-teal" /> Kunjungan Fisik
                </span>
              </div>
            }
          />
          <div className="relative flex h-64 items-end gap-1.5 border-b border-line pt-6">
            <div className="pointer-events-none absolute inset-x-0 top-6 bottom-0 flex flex-col justify-between">
              <div className="border-b border-dashed border-slate-100" />
              <div className="border-b border-dashed border-slate-100" />
              <div className="border-b border-dashed border-slate-100" />
              <div />
            </div>
            <svg className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox={`0 0 ${data.trend.length} 100`}>
              <polyline
                fill="none"
                stroke="#0F766E"
                strokeWidth="2.2"
                vectorEffect="non-scaling-stroke"
                points={data.trend.map((t, i) => `${i + 0.5},${100 - (t.visit / maxVisit) * 88}`).join(" ")}
              />
            </svg>
            {data.trend.map((t, i) => (
              <div key={i} className="group relative z-[1] flex h-full flex-1 items-end">
                <div
                  className={`w-full rounded-t transition-all group-hover:opacity-85 ${i === data.trend.length - 1 ? "bg-action" : "bg-navy"}`}
                  style={{ height: `${Math.max(2, (t.nilai / maxTrend) * 88)}%` }}
                />
                <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded-ctl bg-navy px-2.5 py-1 text-[11px] font-medium text-white shadow-md group-hover:block">
                  {t.label}: {rp(t.nilai)} · {t.visit} pengunjung
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-1.5 text-[10px] text-muted">
            {data.trend.map((t, i) => {
              const showLabel = data.trend.length <= 14 || i % 3 === 0 || i === data.trend.length - 1;
              return (
                <span key={i} className="flex-1 text-center tabular-nums">
                  {showLabel ? t.label : ""}
                </span>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-ctl bg-slate-50 px-4 py-3 text-xs text-slate-600">
            <span>
              Puncak penerimaan periode: <b className="text-navy">{[...data.trend].sort((a, b) => b.nilai - a.nilai)[0]?.label ?? "-"}</b>
            </span>
            <span>
              Total kunjungan fisik tervalidasi: <b className="text-teal">{num(data.confirmed)} orang</b>
            </span>
          </div>
        </Card>

        {/* Distribusi jenis tiket */}
        <Card className="flex flex-col justify-between p-6">
          <div>
            <SectionTitle eyebrow="Komposisi Karcis" title="Distribusi Jenis Tiket" desc="Berdasarkan volume karcis terjual" />
            <div className="mb-5 flex h-4 overflow-hidden rounded-full bg-slate-100">
              {data.types.map(([n, q], i) => (
                <div key={n} style={{ width: `${(q / totalTypes) * 100}%`, background: COLORS[i] }} title={n} />
              ))}
            </div>
            <ul className="space-y-3 text-sm">
              {data.types.map(([n, q], i) => (
                <li key={n} className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 last:border-0">
                  <span className="flex items-center gap-2.5 font-medium text-navy">
                    <i className="h-3 w-3 shrink-0 rounded-sm" style={{ background: COLORS[i] }} />
                    {n}
                  </span>
                  <span className="tabular-nums text-xs font-semibold text-muted">
                    {num(q)} ({pct((q / totalTypes) * 100)})
                  </span>
                </li>
              ))}
              {data.types.length === 0 && <li className="py-6 text-center text-muted">Belum ada transaksi pada periode ini.</li>}
            </ul>
          </div>
          <div className="mt-4 rounded-ctl bg-slate-50 p-3 text-xs text-muted">
            Total <b className="text-navy">{num(totalTypes)}</b> unit tiket/retribusi diterbitkan pada periode terpilih.
          </div>
        </Card>
      </div>

      {/* Perbandingan destinasi */}
      <Card className="mb-6 p-6">
        <SectionTitle
          eyebrow="Sebaran Pendapatan"
          title="Perbandingan Kontribusi Destinasi Wisata Bahari"
          right={
            <Link href="/destinasi">
              <Btn variant="outline">Kelola Destinasi &amp; Tarif →</Btn>
            </Link>
          }
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {data.perDest.map((x) => {
            const share = data.nilai ? (x.nilai / data.nilai) * 100 : 0;
            return (
              <div key={x.d.id} className="flex flex-col justify-between rounded-card border border-line bg-slate-50/70 p-4 transition hover:border-slate-300 hover:bg-white">
                <div>
                  <p className="font-head text-sm font-semibold leading-snug text-navy">{x.d.name}</p>
                  <p className="mt-0.5 text-xs text-muted">Kec. {x.d.kecamatan}</p>
                </div>
                <div className="mt-4">
                  <p className="font-head text-lg font-bold text-navy tabular-nums">{rp(x.nilai)}</p>
                  <p className="text-xs text-muted">{num(x.visit)} kunjungan terkonfirmasi</p>
                  <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-navy" style={{ width: `${share}%` }} />
                  </div>
                  <div className="mt-2.5 flex items-center justify-between">
                    <Badge tone={x.d.status === "BUKA" ? "sukses" : "menunggu"}>
                      {x.d.status === "BUKA" ? "Buka" : x.d.status === "TUTUP" ? "Tutup" : "Pemeliharaan"}
                    </Badge>
                    <span className="text-xs font-semibold tabular-nums text-navy">{pct(share)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="p-6">
          <SectionTitle
            title="Arus Kas Masuk Terkini"
            desc="Transaksi e-tiket terbaru dari loket terintegrasi"
            right={
              <Link href="/laporan">
                <Btn variant="navy">Rekonsiliasi Kas Daerah →</Btn>
              </Link>
            }
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <Th>Waktu</Th>
                <Th>No. Tiket</Th>
                <Th>Destinasi</Th>
                <Th right>Wisatawan</Th>
                <Th>Metode</Th>
                <Th right>Total Retribusi</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {data.recent.map((s) => {
                const t = db.tickets.find((x) => x.sale_id === s.id);
                return (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <Td className="font-mono text-xs">{fmtDate(s.created_at)} {fmtTime(s.created_at)}</Td>
                    <Td className="font-mono text-xs font-semibold text-action">{s.number}</Td>
                    <Td className="font-medium text-navy">{destName(s.destination_id)}</Td>
                    <Td right>{t?.visitors ?? "-"} org</Td>
                    <Td>
                      <Badge>{s.method === "QRIS" ? "QRIS Bank Lampung" : s.method === "TRANSFER" ? "VA Bank Lampung" : "Tunai Kasir"}</Badge>
                    </Td>
                    <Td right className="font-semibold text-navy">{rp(s.total)}</Td>
                    <Td><Badge tone="sukses">Tercatat</Badge></Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {data.recent.length === 0 && <p className="p-8 text-center text-sm text-muted">Belum ada transaksi pada periode ini.</p>}
        </div>
      </Card>
    </>
  );
}

function Kpi({
  label,
  tip,
  badge,
  value,
  foot,
  progress,
  tone,
  danger,
}: {
  label: string;
  tip: string;
  badge: React.ReactNode;
  value: string;
  foot: string;
  progress?: number;
  tone?: "teal";
  danger?: boolean;
}) {
  return (
    <Card className="flex flex-col justify-between p-6">
      <div>
        <div className="flex items-start justify-between gap-2">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-muted">
            {label} <Tip text={tip} />
          </p>
          {badge}
        </div>
        <p className={`metric mt-3 ${tone === "teal" ? "!text-teal" : ""} ${danger ? "!text-[#DC2626]" : ""}`}>{value}</p>
        {progress !== undefined && (
          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-action" style={{ width: `${Math.min(100, progress)}%` }} />
          </div>
        )}
      </div>
      <p className="mt-2.5 text-xs text-muted">{foot}</p>
    </Card>
  );
}
