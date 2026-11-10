"use client";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Badge, Btn, Card, Field, inputCls, PageHeader, Th, Td, Empty } from "@/components/ui";
import { downloadCsv, fmtDate, fmtTime, sha256Hex } from "@/lib/format";

/** US-09 / FR-020: append-only, tidak ada tombol ubah/hapus, rantai hash dapat diverifikasi */
export default function AuditPage() {
  const { db, toast } = useStore();
  const [q, setQ] = useState("");
  const [mod, setMod] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [chain, setChain] = useState<string | null>(null);

  const list = useMemo(() => db.audit_logs.filter((l) =>
    (mod === "ALL" || l.module === mod) && (status === "ALL" || l.status === status) &&
    `${l.user_name} ${l.role} ${l.type} ${l.description}`.toLowerCase().includes(q.toLowerCase())), [db.audit_logs, q, mod, status]);

  const verify = async () => {
    const asc = [...db.audit_logs].reverse();
    for (let i = 0; i < asc.length; i++) {
      const l = asc[i];
      const expectPrev = i === 0 ? "0".repeat(64) : asc[i - 1].hash;
      const h = await sha256Hex(`${l.prev_hash}|${l.created_at}|${l.user_name}|${l.type}|${l.module}|${l.description}`);
      if (l.prev_hash !== expectPrev || h !== l.hash) { setChain(`RUSAK pada entri ${l.id}`); toast(`Rantai hash rusak pada ${l.id}`, "error"); return; }
    }
    setChain(`UTUH - ${asc.length} entri terverifikasi`);
    toast("Rantai hash audit log utuh (tamper-evident)");
  };

  return (
    <>
      <PageHeader crumb="Audit Log" title="Jejak Audit Aktivitas Sistem (Append-Only)"
        desc="Log hanya dapat ditambah. Di basis data, trigger menolak UPDATE/DELETE; setiap entri terhubung hash SHA-256 berantai sehingga perubahan terdeteksi."
        actions={<>
          <Btn variant="teal" onClick={verify}>🛡 Verifikasi Rantai Hash</Btn>
          <Btn variant="outline" onClick={() => downloadCsv("audit-log.csv", ["Waktu", "User", "Peran", "Tipe", "Modul", "Status", "Deskripsi", "Hash"], list.map((l) => [`${fmtDate(l.created_at)} ${fmtTime(l.created_at, true)}`, l.user_name, l.role, l.type, l.module, l.status, l.description, l.hash]))}>⬇ CSV</Btn>
        </>} />
      {chain && <div className={`mb-4 rounded-card border p-4 text-sm font-semibold ${chain.startsWith("UTUH") ? "border-[#BBF7D0] bg-[#DCFCE7] text-[#166534]" : "border-[#FECACA] bg-[#FEE2E2] text-[#991B1B]"}`}>Status rantai: {chain}</div>}
      <Card className="mb-6 p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_220px_180px]">
          <Field label="Pencarian"><input className={inputCls} placeholder="User, tipe, deskripsi…" value={q} onChange={(e) => setQ(e.target.value)} /></Field>
          <Field label="Modul"><select className={inputCls} value={mod} onChange={(e) => setMod(e.target.value)}><option value="ALL">Semua Modul</option>{[...new Set(db.audit_logs.map((l) => l.module))].map((m) => <option key={m}>{m}</option>)}</select></Field>
          <Field label="Status"><select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}><option value="ALL">Semua</option><option value="SUKSES">Sukses</option><option value="GAGAL">Gagal</option></select></Field>
        </div>
      </Card>
      <Card className="overflow-hidden">
        <div className="max-h-[640px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0"><tr><Th>Waktu</Th><Th>User &amp; Peran</Th><Th>Tipe</Th><Th>Modul</Th><Th>Status</Th><Th>Deskripsi</Th><Th>Hash</Th></tr></thead>
            <tbody>
              {list.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50">
                  <Td className="whitespace-nowrap font-mono text-xs">{fmtDate(l.created_at)} {fmtTime(l.created_at, true)}</Td>
                  <Td><b className="text-navy">{l.user_name}</b><span className="block text-xs text-muted">{l.role}</span></Td>
                  <Td><Badge tone="info">{l.type}</Badge></Td>
                  <Td>{l.module}</Td>
                  <Td><Badge tone={l.status === "SUKSES" ? "sukses" : "galat"}>{l.status}</Badge></Td>
                  <Td className="text-xs">{l.description}</Td>
                  <Td className="font-mono text-[10px] text-muted" ><span title={`prev: ${l.prev_hash}\nhash: ${l.hash}`}>{l.hash.slice(0, 12)}…</span></Td>
                </tr>
              ))}
            </tbody>
          </table>
          {list.length === 0 && <Empty text="Tidak ada log yang cocok." />}
        </div>
      </Card>
    </>
  );
}

