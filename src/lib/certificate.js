import { CATEGORY_LABEL, positionLabel } from './eventStatus'
import { fmtDate } from './format'

export const COLLEGE = 'Guru Nanak Dev Engineering College, Ludhiana'

// Text content shared by the on-screen view and the PDF.
export function certificateText(cert) {
  const merit = !!cert.position
  return {
    title: merit ? 'Certificate of Merit' : 'Certificate of Participation',
    name: cert.student.name,
    meta: `URN ${cert.student.urn} · ${cert.student.branch} · Batch ${cert.student.batch}`,
    body: `has participated in the ${cert.event.name} (${CATEGORY_LABEL[cert.event.category]}), held at ${cert.event.venue} on ${fmtDate(cert.event.date)}${
      merit ? `, and secured the ${positionLabel(cert.position)} position` : ''
    }.`,
    certNo: cert.certNo,
    issued: fmtDate(cert.issuedAt),
  }
}

// Draws the certificate as a vector PDF (A4 landscape).
export async function buildCertificatePdf(cert) {
  const { jsPDF } = await import('jspdf')
  const t = certificateText(cert)
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const W = 297
  const H = 210
  const green = [4, 120, 87]
  const gold = [180, 140, 40]
  const ink = [15, 23, 42]
  const muted = [100, 116, 139]

  doc.setFillColor(252, 252, 247)
  doc.rect(0, 0, W, H, 'F')
  doc.setDrawColor(...green)
  doc.setLineWidth(2.2)
  doc.rect(10, 10, W - 20, H - 20)
  doc.setDrawColor(...gold)
  doc.setLineWidth(0.6)
  doc.rect(15, 15, W - 30, H - 30)

  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...green)
  doc.setFontSize(16)
  doc.text(COLLEGE.toUpperCase(), W / 2, 34, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(...muted)
  doc.text('Department of Sports · SportSync', W / 2, 41, { align: 'center' })

  doc.setFont('times', 'bolditalic')
  doc.setFontSize(34)
  doc.setTextColor(...ink)
  doc.text(t.title, W / 2, 64, { align: 'center' })
  doc.setDrawColor(...gold)
  doc.setLineWidth(0.8)
  doc.line(W / 2 - 40, 70, W / 2 + 40, 70)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(13)
  doc.setTextColor(...muted)
  doc.text('This is to certify that', W / 2, 86, { align: 'center' })

  doc.setFont('times', 'bold')
  doc.setFontSize(30)
  doc.setTextColor(...green)
  doc.text(t.name, W / 2, 103, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(...muted)
  doc.text(t.meta, W / 2, 111, { align: 'center' })

  doc.setFontSize(14)
  doc.setTextColor(...ink)
  doc.text(doc.splitTextToSize(t.body, 200), W / 2, 127, { align: 'center', lineHeightFactor: 1.5 })

  // Signature + footer
  doc.setDrawColor(...muted)
  doc.setLineWidth(0.3)
  doc.line(W - 95, 170, W - 35, 170)
  doc.setFontSize(11)
  doc.setTextColor(...ink)
  doc.text('Sports In-Charge', W - 65, 176, { align: 'center' })
  doc.line(35, 170, 95, 170)
  doc.text('Principal', 65, 176, { align: 'center' })

  doc.setFontSize(9)
  doc.setTextColor(...muted)
  doc.text(`Certificate No. ${t.certNo}   ·   Issued ${t.issued}`, W / 2, 188, { align: 'center' })

  return doc
}

export async function downloadCertificatePdf(cert) {
  const doc = await buildCertificatePdf(cert)
  doc.save(`${cert.certNo.replace(/\//g, '-')}_${cert.student.urn}.pdf`)
}
