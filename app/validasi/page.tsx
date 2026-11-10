"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useStore, type ValidationResult } from "@/lib/store";
import { can } from "@/lib/rbac";
import { Badge, Btn, Card, inputCls, PageHeader, SectionTitle, Th, Td, Empty } from "@/components/ui";
import { downloadCsv, fmtDate, fmtTime, isoDate, num, pct } from "@/lib/format";

export default function ValidasiPage() {
  const { db, user } = useStore();
  const role = user!.role;
  const locked = user!.destination_id;
  const showGateLog = role === "PENGELOLA" || role === "PETUGAS_VALIDASI";

  return (
    <>
      <PageHeader
        crumb="Validasi Gerbang & Kunjungan"
        title="Validasi E-Tiket di Pintu Masuk & Data Kunjungan Fisik Terkonfirmasi"
        desc="Kunjungan hanya dihitung dari tiket yang tervalidasi VALID di gerbang masuk (BR-07) — terpisah dari jumlah tiket terjual."
      />
      {can.validate(role) && locked && <Gate destId={locked} />}
      {showGateLog && <RecentValidations destId={locked} />}
      <Visits locked={role === "ADMIN_SISTEM" || role === "ADMIN_DINAS" ? null : locked} canExport={can.exportCsv(role)} />
      {db.destinations.length === 0 && <Empty text="Belum ada destinasi" />}
    </>
  );
}

function Gate({ destId }: { destId: string }) {
  const { db, validateTicket, toast } = useStore();
  const dest = db.destinations.find((d) => d.id === destId)!;
  const [code, setCode] = useState("");
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [cam, setCam] = useState(false);
  const [camMsg, setCamMsg] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastRef = useRef("");

  const run = async (raw: string, method: "KAMERA" | "MANUAL") => {
    if (!raw.trim() || busy) return;
    setBusy(true);
    const t0 = performance.now();
    const r = await validateTicket(raw, destId, method);
    setResult({ ...r, detail: `${r.detail} · ${Math.round(performance.now() - t0)} ms` });
    toast(`${r.title}: ${r.ticket?.code ?? raw.slice(0, 30)}`, r.ok ? "success" : "error");
    setCode("");
    setBusy(false);
  };

  useEffect(() => {
    if (!cam) return;
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setInterval> | null = null;
    (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const BD = (window as any).BarcodeDetector;
      if (!BD) {
        setCamMsg("Peramban ini belum mendukung pemindaian kamera otomatis. Gunakan input kode manual di bawah.");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        const det = new BD({ formats: ["qr_code"] });
        setCamMsg("Arahkan kode QR e-tiket ke kamera…");
        timer = setInterval(async () => {
          if (!videoRef.current) return;
          const codes = await det.detect(videoRef.current).catch(() => []);
          const v = codes[0]?.rawValue;
          if (v && v !== lastRef.current) {
            lastRef.current = v;
            run(v, "KAMERA");
            setTimeout(() => (lastRef.current = ""), 4000);
          }
        }, 400);
      } catch {
        setCamMsg("Izin kamera ditolak atau perangkat kamera tidak tersedia.");
      }
    })();
    return () => {
      if (timer) clearInterval(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [cam]); // eslint-disable-line react-hooks/exhaustive-deps

  const sampleTickets = useMemo(() => {
    const today = isoDate();
    const pick = (f: (t: (typeof db.tickets)[number]) => boolean) => db.tickets.filter(f).slice(-1)[0];
    return [
      ["Belum digunakan", pick((t) => t.destination_id === destId && t.status === "BELUM_DIGUNAKAN" && t.valid_date === today)],
      ["Sudah digunakan", pick((t) => t.destination_id === destId && t.status === "SUDAH_DIGUNAKAN")],
      ["Kedaluwarsa", pick((t) => t.destination_id === destId && t.status === "KEDALUWARSA")],
      ["Salah destinasi", pick((t) => t.destination_id !== destId && t.status === "BELUM_DIGUNAKAN")],
    ].filter(([, t]) => t) as [string, (typeof db.tickets)[number]][];
  }, [db.tickets, destId]);

  return (
    <Card className="mb-6 p-6">
      <SectionTitle
        eyebrow="Petugas Validasi Masuk"
        title={`Gerbang ${dest.name}`}
        desc="Pindai QR atau ketik kode tiket. Target waktu validasi < 3 detik."
        right={<Badge tone="info">Gerbang Sesuai Penugasan</Badge>}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-card bg-navy text-sm text-slate-300">
            {cam ? <video ref={videoRef} className="h-full w-full object-cover" muted playsInline /> : <span>Kamera pemindai nonaktif</span>}
            {cam && <div className="pointer-events-none absolute inset-10 rounded-card border-4 border-[#80d5cb]/80" />}
          </div>
          {camMsg && cam && <p className="mt-2 text-xs text-muted">{camMsg}</p>}
          <Btn
            variant={cam ? "danger" : "teal"}
            className="mt-3 w-full"
            onClick={() => {
              setCam(!cam);
              setCamMsg("");
            }}
          >
            {cam ? "Matikan Kamera" : "Aktifkan Pemindai Kamera QR"}
          </Btn>
          <form
            className="mt-4 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              run(code, "MANUAL");
            }}
          >
            <input
              className={inputCls + " !h-12 font-mono text-base"}
              placeholder="Input kode tiket manual (TKT-...)"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <Btn type="submit" className="!min-h-[48px]" disabled={busy || !code.trim()}>
              Validasi
            </Btn>
          </form>
          {sampleTickets.length > 0 && (
            <div className="mt-3 rounded-ctl border border-line bg-slate-50 p-3 text-xs">
              <p className="mb-2 font-semibold text-muted">Pintasan Kode Tiket Uji Cepat:</p>
              <div className="flex flex-wrap gap-1.5">
                {sampleTickets.map(([l, t]) => (
                  <button
                    key={l}
                    onClick={() => setCode(t.code)}
                    className="rounded-full border border-line bg-white px-2.5 py-1 font-mono text-[11px] hover:border-action"
                  >
                    {l}: {t.code.slice(-9)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div
          className={`flex min-h-[260px] flex-col items-center justify-center rounded-card border-2 p-6 text-center ${
            !result ? "border-dashed border-line text-muted" : result.ok ? "border-[#16A34A] bg-[#DCFCE7]" : "border-[#DC2626] bg-[#FEE2E2]"
          }`}
        >
          {!result ? (
            <p className="text-sm">Hasil validasi e-tiket akan tampil di sini.</p>
          ) : (
            <>
              <span
                className={`flex h-20 w-20 items-center justify-center rounded-full text-4xl font-bold text-white ${
                  result.ok ? "bg-[#16A34A]" : "bg-[#DC2626]"
                }`}
              >
                {result.ok ? "✓" : "✕"}
              </span>
              <p className={`mt-3 font-head text-2xl font-bold md:text-3xl ${result.ok ? "text-[#166534]" : "text-[#991B1B]"}`}>
                {result.ok ? "TIKET VALID — SILAKAN MASUK" : `DITOLAK: ${result.title}`}
              </p>
              <p className="mt-1 text-sm text-slate-700">{result.detail}</p>
              {result.ticket && (
                <p className="mt-2 font-mono text-xs text-slate-600">
                  {result.ticket.code} · berlaku {fmtDate(result.ticket.valid_date)}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

function RecentValidations({ destId }: { destId: string | null }) {
  const { db } = useStore();
  const list = db.validations
    .filter((v) => !destId || v.destination_id === destId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 5);
  return (
    <Card className="mb-6 overflow-hidden">
      <div className="p-5">
        <SectionTitle title="5 Validasi Terakhir" desc="Log pintu masuk real-time" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <Th>Waktu</Th>
              <Th>Kode Tiket</Th>
              <Th>Petugas</Th>
              <Th>Metode</Th>
              <Th>Hasil</Th>
              <Th>Keterangan</Th>
            </tr>
          </thead>
          <tbody>
            {list.map((v) => (
              <tr key={v.id} className="hover:bg-slate-50">
                <Td className="font-mono text-xs">{fmtDate(v.created_at)} {fmtTime(v.created_at, true)}</Td>
                <Td className="font-mono text-xs font-semibold text-navy">{v.ticket_code}</Td>
                <Td>{v.officer}</Td>
                <Td><Badge>{v.method === "KAMERA" ? "Kamera QR" : "Kode Manual"}</Badge></Td>
                <Td><Badge tone={v.result === "VALID" ? "sukses" : "galat"}>{v.result}</Badge></Td>
                <Td className="text-xs">{v.result === "VALID" ? `${v.visitors} pengunjung masuk` : v.reason}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {list.length === 0 && <Empty text="Belum ada validasi." />}
    </Card>
  );
}

function Visits({ locked, canExport }: { locked: string | null; canExport: boolean }) {
  const { db } = useStore();
  const today = isoDate();
  const [date, setDate] = useState(today);
  const [dest, setDest] = useState(locked ?? "ALL");
  const destId = locked ?? dest;
  const match = (id: string, iso: string) => (destId === "ALL" || id === destId) && isoDate(new Date(iso)) === date;
  const visits = db.validations.filter((v) => v.result === "VALID" && match(v.destination_id, v.created_at)).sort((a, b) => b.created_at.localeCompare(a.created_at));
  const sold = db.sales.filter((s) => match(s.destination_id, s.created_at));
  const soldVisitors = db.tickets.filter((t) => sold.some((s) => s.id === t.sale_id)).reduce((a, b) => a + b.visitors, 0);
  const confirmed = visits.reduce((a, b) => a + b.visitors, 0);
  const rejected = db.validations.filter((v) => v.result === "DITOLAK" && match(v.destination_id, v.created_at)).length;
  const destName = (id: string) => db.destinations.find((d) => d.id === id)?.name ?? id;

  return (
    <Card className="overflow-hidden">
      <div className="p-6">
        <SectionTitle
          eyebrow="Data Kunjungan"
          title="Kunjungan Fisik Terkonfirmasi"
          desc="Tabel hanya memuat tiket yang tervalidasi VALID di gerbang."
          right={
            <div className="flex flex-wrap gap-2">
              <input type="date" className={inputCls + " !w-auto"} value={date} max={today} onChange={(e) => setDate(e.target.value)} />
              <select className={inputCls + " !w-auto"} value={destId} disabled={!!locked} onChange={(e) => setDest(e.target.value)}>
                <option value="ALL">Semua Destinasi</option>
                {db.destinations.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              {canExport && (
                <Btn
                  variant="teal"
                  onClick={() =>
                    downloadCsv(
                      `kunjungan-${date}.csv`,
                      ["Waktu", "Kode Tiket", "Destinasi", "Petugas", "Jumlah Pengunjung"],
                      visits.map((v) => [`${fmtDate(v.created_at)} ${fmtTime(v.created_at, true)}`, v.ticket_code, destName(v.destination_id), v.officer, v.visitors])
                    )
                  }
                >
                  Unduh CSV
                </Btn>
              )}
            </div>
          }
        />
        <div className="grid gap-4 md:grid-cols-4">
          <Stat label="Tiket Terjual (Pengunjung)" value={num(soldVisitors)} />
          <Stat label="Kunjungan Terkonfirmasi" value={num(confirmed)} teal />
          <Stat label="Rasio Konfirmasi" value={pct(soldVisitors ? (confirmed / soldVisitors) * 100 : 0)} />
          <Stat label="Pemindaian Ditolak" value={num(rejected)} danger={rejected > 0} />
        </div>
      </div>
      <div className="max-h-[420px] overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-navy">
            <tr>
              <Th>Waktu Masuk</Th>
              <Th>Kode Tiket</Th>
              <Th>Destinasi</Th>
              <Th>Petugas Gerbang</Th>
              <Th right>Pengunjung</Th>
            </tr>
          </thead>
          <tbody>
            {visits.map((v) => (
              <tr key={v.id} className="hover:bg-slate-50">
                <Td className="font-mono text-xs">{fmtTime(v.created_at, true)}</Td>
                <Td className="font-mono text-xs font-semibold text-navy">{v.ticket_code}</Td>
                <Td>{destName(v.destination_id)}</Td>
                <Td>{v.officer}</Td>
                <Td right>{v.visitors} org</Td>
              </tr>
            ))}
          </tbody>
        </table>
        {visits.length === 0 && <Empty text="Belum ada kunjungan terkonfirmasi pada tanggal ini." />}
      </div>
    </Card>
  );
}

function Stat({ label, value, teal, danger }: { label: string; value: string; teal?: boolean; danger?: boolean }) {
  return (
    <div className="rounded-card border border-line bg-slate-50 p-4">
      <p className="text-xs font-semibold text-muted">{label}</p>
      <p className={`metric mt-1 ${teal ? "!text-teal" : ""} ${danger ? "!text-[#DC2626]" : ""}`}>{value}</p>
    </div>
  );
}
