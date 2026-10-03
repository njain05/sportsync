import { certificateText, COLLEGE } from '../lib/certificate'

// On-screen certificate, A4 landscape ratio; text scales with container width.
export default function CertificateView({ cert }) {
  const t = certificateText(cert)
  const u = (n) => `${n}cqw`
  return (
    <div className="w-full [container-type:inline-size]">
      <div
        className="relative aspect-[297/210] w-full overflow-hidden rounded-lg text-center text-slate-900 shadow-xl"
        style={{ background: '#fcfcf7', fontFamily: 'Georgia, "Times New Roman", serif' }}
      >
        <div className="absolute" style={{ inset: u(3.4), border: `${u(0.7)} solid #047857` }} />
        <div className="absolute" style={{ inset: u(5), border: `${u(0.2)} solid #b48c28` }} />
        <div className="relative flex h-full flex-col items-center" style={{ padding: `${u(8)} ${u(10)}` }}>
          <div className="font-sans font-bold tracking-wide text-emerald-700" style={{ fontSize: u(2.1) }}>
            {COLLEGE.toUpperCase()}
          </div>
          <div className="font-sans text-slate-500" style={{ fontSize: u(1.4), marginTop: u(0.6) }}>
            Department of Sports · SportSync
          </div>
          <div className="font-bold italic" style={{ fontSize: u(4.6), marginTop: u(3.2) }}>
            {t.title}
          </div>
          <div style={{ width: u(26), height: u(0.25), background: '#b48c28', marginTop: u(0.8) }} />
          <div className="font-sans text-slate-500" style={{ fontSize: u(1.7), marginTop: u(3) }}>
            This is to certify that
          </div>
          <div className="font-bold text-emerald-700" style={{ fontSize: u(4.2), marginTop: u(1) }}>
            {t.name}
          </div>
          <div className="font-sans text-slate-500" style={{ fontSize: u(1.4) }}>
            {t.meta}
          </div>
          <p className="font-sans" style={{ fontSize: u(1.85), marginTop: u(2.2), maxWidth: u(68), lineHeight: 1.5 }}>
            {t.body}
          </p>
          <div className="mt-auto flex w-full items-end justify-between font-sans" style={{ fontSize: u(1.4) }}>
            <Sig label="Principal" u={u} />
            <div className="text-slate-500" style={{ fontSize: u(1.15) }}>
              Certificate No. {t.certNo} · Issued {t.issued}
            </div>
            <Sig label="Sports In-Charge" u={u} />
          </div>
        </div>
      </div>
    </div>
  )
}

function Sig({ label, u }) {
  return (
    <div style={{ width: u(20) }}>
      <div style={{ borderTop: '1px solid #64748b', marginBottom: u(0.6) }} />
      {label}
    </div>
  )
}
