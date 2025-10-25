import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export interface DocumentField {
  label: string
  value: string
}

export interface PDFGenerationOptions {
  documentTitle: string
  facilityName: string
  dueDate: string
  fields: DocumentField[]
}

// 日本語ラベルを英語に変換するマッピング
const labelMapping: Record<string, string> = {
  "施設名": "Facility Name",
  "施設所在地": "Facility Address",
  "管理者氏名": "Director Name",
  "医療機関コード": "Medical Institution Code",
  "病床数": "Number of Beds",
  "職員数": "Number of Staff",
  "医師数": "Number of Doctors",
  "看護師数": "Number of Nurses",
  "年間診療日数": "Annual Operating Days",
  "年間患者数": "Annual Patient Count",
  "診療科目": "Medical Departments",
  "備考": "Notes",
}

function translateLabel(label: string): string {
  return labelMapping[label] || label
}

export function generateDocumentPDF(options: PDFGenerationOptions) {
  const { documentTitle, facilityName, dueDate, fields } = options

  // PDFドキュメントの作成
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  // ページ設定
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20

  // タイトル（英語）
  doc.setFontSize(20)
  doc.text("Medical Regulatory Document", pageWidth / 2, 30, { align: "center" })

  // 基本情報
  doc.setFontSize(12)
  let yPosition = 50

  doc.text(`Facility: ${facilityName}`, margin, yPosition)
  yPosition += 8
  doc.text(`Due Date: ${dueDate}`, margin, yPosition)
  yPosition += 15

  // 罫線
  doc.setLineWidth(0.5)
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 10

  // フィールド情報をテーブルとして追加（英語ラベル）
  const tableData = fields.map((field) => [
    translateLabel(field.label),
    field.value || "---",
  ])

  autoTable(doc, {
    startY: yPosition,
    head: [["Item", "Value"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [59, 130, 246], // Blue
      textColor: 255,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 10,
      cellPadding: 5,
    },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: "auto" },
    },
    margin: { left: margin, right: margin },
  })

  // フッター
  const currentDate = new Date().toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })

  const footerY = pageHeight - 20
  doc.setFontSize(8)
  doc.text(`Generated: ${currentDate}`, pageWidth / 2, footerY, {
    align: "center",
  })
  doc.text("Generated with HealthCompliance AI", pageWidth / 2, footerY + 5, {
    align: "center",
  })

  return doc
}

export function downloadPDF(doc: jsPDF, filename: string) {
  doc.save(filename)
}

export function generateAndDownloadDocumentPDF(
  options: PDFGenerationOptions,
  filename?: string
) {
  const doc = generateDocumentPDF(options)

  const defaultFilename =
    filename || `${options.documentTitle}_${new Date().toISOString().split("T")[0]}.pdf`

  downloadPDF(doc, defaultFilename)
}
