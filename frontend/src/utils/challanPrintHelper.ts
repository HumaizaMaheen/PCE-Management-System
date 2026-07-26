export interface ChallanPrintData {
  challanNumber: string;
  payerName: string;
  payerRefLabel: string;
  payerRefValue: string;
  cnic?: string;
  mobile?: string;
  dueDate: string;
  issueDate: string;
  totalAmount: number;
  dues: Array<{ type: string; period: string; amount: number }>;
  bankName?: string;
  bankAccountTitle?: string;
  bankAccountNo?: string;
  bankIban?: string;
}

export const printChallanHTML = (data: ChallanPrintData) => {
  const printWindow = window.open('', '_blank', 'width=850,height=950');
  if (!printWindow) {
    alert('Please allow popups in your browser to view or print your Challan PDF.');
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Challan Invoice - ${data.challanNumber}</title>
      <style>
        @page { size: A4; margin: 15mm; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; margin: 0; padding: 25px; background: #fff; }
        .header { background: #006A4E; color: white; padding: 24px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; }
        .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px; }
        .header p { margin: 6px 0 0 0; color: #C8A951; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
        .grid { display: flex; justify-content: space-between; margin-top: 25px; gap: 20px; }
        .col { flex: 1; background: #F7F9FA; padding: 16px; border-radius: 8px; border: 1px solid #E2E8F0; }
        .col h3 { margin-top: 0; font-size: 12px; color: #006A4E; text-transform: uppercase; border-bottom: 2px solid #006A4E; padding-bottom: 6px; letter-spacing: 0.5px; }
        .col p { margin: 7px 0; font-size: 12px; color: #4A5568; }
        .col strong { color: #1A202C; }
        table { width: 100%; border-collapse: collapse; margin-top: 25px; }
        th { background: #006A4E; color: white; text-align: left; padding: 12px; font-size: 12px; font-weight: 600; }
        td { padding: 12px; border-bottom: 1px solid #E2E8F0; font-size: 12px; color: #2D3748; }
        tr:nth-child(even) { background: #F7F9FA; }
        .total-box { margin-top: 20px; text-align: right; background: #006A4E; color: white; padding: 14px 20px; border-radius: 8px; }
        .total-box span { font-size: 18px; font-weight: bold; color: #C8A951; margin-left: 12px; }
        .bank-info { margin-top: 25px; background: #F7F9FA; border: 1px dashed #006A4E; padding: 18px; border-radius: 8px; }
        .bank-info h3 { margin-top: 0; font-size: 13px; color: #006A4E; margin-bottom: 8px; text-transform: uppercase; }
        .btn-container { display: flex; gap: 10px; margin-bottom: 20px; }
        .btn-print { background: #006A4E; color: white; border: none; padding: 10px 22px; font-weight: bold; border-radius: 6px; cursor: pointer; font-size: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .btn-print:hover { background: #00523C; }
        @media print { .btn-container { display: none; } }
      </style>
    </head>
    <body>
      <div class="btn-container">
        <button class="btn-print" onclick="window.print()">🖨️ Save as PDF / Print Challan</button>
      </div>
      
      <div class="header">
        <div>
          <h1>PAKISTAN CHAMBER OF EDUCATION</h1>
          <p>Bahawalpur Division — Official Dues Challan</p>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 14px; font-weight: bold; color: #C8A951;"># ${data.challanNumber}</div>
        </div>
      </div>

      <div class="grid">
        <div class="col">
          <h3>Challan Details</h3>
          <p>Challan Number: <strong>${data.challanNumber}</strong></p>
          <p>Issue Date: <strong>${data.issueDate}</strong></p>
          <p>Due Date: <strong style="color: #E53E3E;">${data.dueDate}</strong></p>
        </div>
        <div class="col">
          <h3>Payer Information</h3>
          <p>Name: <strong>${data.payerName}</strong></p>
          <p>${data.payerRefLabel}: <strong>${data.payerRefValue}</strong></p>
          <p>CNIC: <strong>${data.cnic || 'N/A'}</strong></p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Dues Description</th>
            <th>Period</th>
            <th style="text-align: right;">Amount (PKR)</th>
          </tr>
        </thead>
        <tbody>
          ${data.dues.map(due => `
            <tr>
              <td>${due.type}</td>
              <td>${due.period}</td>
              <td style="text-align: right;">PKR ${due.amount.toLocaleString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="total-box">
        Total Amount Payable: <span>PKR ${data.totalAmount.toLocaleString()}</span>
      </div>

      <div class="bank-info">
        <h3>Bank Payment Details</h3>
        <p style="font-size: 12px; margin-bottom: 12px; color: #4A5568;">Please deposit the payable amount at any HBL Branch or via IBAN online transfer:</p>
        <p style="margin: 4px 0; font-size: 12px;">Bank Name: <strong>${data.bankName || 'Habib Bank Limited (HBL)'}</strong></p>
        <p style="margin: 4px 0; font-size: 12px;">Account Title: <strong>${data.bankAccountTitle || 'Pakistan Chamber of Education'}</strong></p>
        <p style="margin: 4px 0; font-size: 12px;">Account No: <strong>${data.bankAccountNo || '0012 3456 7890 1203'}</strong></p>
        <p style="margin: 4px 0; font-size: 12px;">IBAN Code: <strong style="color: #006A4E;">${data.bankIban || 'PK12 HABB 0012 3456 7890 1203'}</strong></p>
        <p style="font-size: 11px; color: #718096; margin-top: 12px;"><em>* Note: After deposit, photograph your slip and send to official WhatsApp: <strong>+92 62 1234567</strong>.</em></p>
      </div>

      <script>
        setTimeout(function() { window.print(); }, 600);
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};
