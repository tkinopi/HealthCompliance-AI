// 日本語完全対応版のPDFジェネレーター
// 注意: 現在はシンプルなテキストベースのPDFを生成します
// 完全な日本語対応には、カスタムフォントファイルが必要です

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

// HTML形式でPDFプレビュー用のコンテンツを生成
export function generateHTMLPreview(options: PDFGenerationOptions): string {
  const { documentTitle, facilityName, dueDate, fields } = options

  const currentDate = new Date().toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })

  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>${documentTitle}</title>
  <style>
    body {
      font-family: "Noto Sans JP", "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
      background: white;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 3px solid #3b82f6;
      padding-bottom: 20px;
    }
    .header h1 {
      font-size: 28px;
      margin: 0 0 10px 0;
      color: #1e40af;
    }
    .info {
      margin-bottom: 30px;
      padding: 15px;
      background: #f3f4f6;
      border-radius: 8px;
    }
    .info p {
      margin: 5px 0;
      font-size: 14px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    th, td {
      border: 1px solid #d1d5db;
      padding: 12px;
      text-align: left;
    }
    th {
      background-color: #3b82f6;
      color: white;
      font-weight: bold;
    }
    tr:nth-child(even) {
      background-color: #f9fafb;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #d1d5db;
      font-size: 12px;
      color: #6b7280;
    }
    @media print {
      body {
        margin: 0;
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${documentTitle}</h1>
  </div>

  <div class="info">
    <p><strong>施設名:</strong> ${facilityName}</p>
    <p><strong>提出期限:</strong> ${dueDate}</p>
    <p><strong>作成日:</strong> ${currentDate}</p>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 35%">項目</th>
        <th>内容</th>
      </tr>
    </thead>
    <tbody>
      ${fields.map((field) => `
        <tr>
          <td><strong>${field.label}</strong></td>
          <td>${field.value || "---"}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>

  <div class="footer">
    <p>Generated with HealthCompliance AI</p>
    <p>${currentDate}</p>
  </div>
</body>
</html>
  `.trim()
}

// ブラウザの印刷機能を使用してPDF化
export function printAsJapanesePDF(options: PDFGenerationOptions) {
  const htmlContent = generateHTMLPreview(options)

  // 新しいウィンドウを開いてHTMLコンテンツを表示
  const printWindow = window.open("", "_blank", "width=800,height=600")

  if (printWindow) {
    printWindow.document.write(htmlContent)
    printWindow.document.close()

    // 印刷ダイアログを開く
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
    }, 250)
  } else {
    alert("ポップアップがブロックされました。ブラウザの設定を確認してください。")
  }
}

// HTMLコンテンツをダウンロード（印刷→PDF保存の代替）
export function downloadAsHTML(options: PDFGenerationOptions) {
  const htmlContent = generateHTMLPreview(options)
  const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `${options.documentTitle}_${new Date().toISOString().split("T")[0]}.html`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
