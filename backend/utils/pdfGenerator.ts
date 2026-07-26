import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

export interface ChallanPDFData {
  challanNumber: string;
  payerName: string;
  payerRefLabel: 'Membership ID' | 'Application Ref';
  payerRefValue: string;
  payerCnic: string;
  payerPhone: string;
  dueDate: string;
  issueDate: string;
  totalAmount: number;
  dues: Array<{
    type: string;
    period: string;
    amount: number;
  }>;
  outstandingBalance: number;
  bankName: string;
  bankAccountTitle: string;
  bankAccountNo: string;
  bankIban: string;
}

export const generateChallanPDF = async (data: ChallanPDFData, destPath: string): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      // Ensure directory exists
      const dir = path.dirname(destPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const writeStream = fs.createWriteStream(destPath);
      doc.pipe(writeStream);

      // Colors
      const primaryColor = '#006A4E';
      const accentColor = '#C8A951';
      const darkColor = '#333333';
      const lightGray = '#F7F9FA';
      const borderGray = '#E2E8F0';

      // 1. Header Section
      // Draw background header accent
      doc.rect(40, 40, 515, 60).fill(primaryColor);
      
      // Draw Header Text
      doc.fillColor('#FFFFFF')
         .font('Helvetica-Bold')
         .fontSize(16)
         .text('PAKISTAN CHAMBER OF EDUCATION', 50, 53);
         
      doc.fillColor(accentColor)
         .fontSize(10)
         .font('Helvetica-Bold')
         .text('BAHAWALPUR DIVISION — MEMBERSHIP COLLECTION CHALLAN', 50, 78);

      // 2. Metadata Columns (Challan Info)
      doc.fillColor(darkColor);
      let y = 120;

      // Invoice info block (Left)
      doc.font('Helvetica-Bold').fontSize(11).text('INVOICE / CHALLAN DETAILS', 40, y);
      doc.font('Helvetica').fontSize(9);
      doc.text(`Challan Number:`, 40, y + 20);
      doc.font('Helvetica-Bold').text(data.challanNumber, 130, y + 20);
      doc.font('Helvetica').text(`Issue Date:`, 40, y + 35);
      doc.text(data.issueDate, 130, y + 35);
      doc.font('Helvetica').text(`Due Date:`, 40, y + 50);
      doc.fillColor('#DC3545').font('Helvetica-Bold').text(data.dueDate, 130, y + 50);

      // Payer info block (Right)
      doc.fillColor(darkColor);
      doc.font('Helvetica-Bold').fontSize(11).text('PAYER INFORMATION', 320, y);
      doc.font('Helvetica').fontSize(9);
      doc.text(`Name:`, 320, y + 20);
      doc.font('Helvetica-Bold').text(data.payerName, 410, y + 20);
      doc.font('Helvetica').text(`${data.payerRefLabel}:`, 320, y + 35);
      doc.font('Helvetica-Bold').text(data.payerRefValue, 410, y + 35);
      doc.font('Helvetica').text(`CNIC:`, 320, y + 50);
      doc.text(data.payerCnic, 410, y + 50);
      doc.font('Helvetica').text(`Mobile:`, 320, y + 65);
      doc.text(data.payerPhone, 410, y + 65);

      // Divider Line
      doc.moveTo(40, 205).lineTo(555, 205).strokeColor(borderGray).stroke();

      // 3. Dues table
      y = 220;
      doc.font('Helvetica-Bold').fontSize(11).text('ITEMIZED DUES BREAKDOWN', 40, y);

      // Table Header
      y += 20;
      doc.rect(40, y, 515, 20).fill(primaryColor);
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(9);
      doc.text('Dues Description', 50, y + 5);
      doc.text('Period', 250, y + 5);
      doc.text('Amount (PKR)', 450, y + 5, { width: 90, align: 'right' });

      // Table Rows
      doc.fillColor(darkColor).font('Helvetica');
      let rowY = y + 20;
      
      // Current period dues
      data.dues.forEach((due, index) => {
        // Draw light background for alternating rows
        if (index % 2 === 1) {
          doc.rect(40, rowY, 515, 20).fill(lightGray);
          doc.fillColor(darkColor);
        }
        doc.text(due.type, 50, rowY + 5);
        doc.text(due.period, 250, rowY + 5);
        doc.text(due.amount.toFixed(2), 450, rowY + 5, { width: 90, align: 'right' });
        rowY += 20;
      });

      // Draw outstanding balance carry forward row if exists
      if (data.outstandingBalance > 0) {
        doc.rect(40, rowY, 515, 20).fill('#FFFDF5');
        doc.fillColor('#856404').font('Helvetica-Bold');
        doc.text('Carry-Forward Outstanding Balance', 50, rowY + 5);
        doc.text('Prior Periods', 250, rowY + 5);
        doc.text(data.outstandingBalance.toFixed(2), 450, rowY + 5, { width: 90, align: 'right' });
        rowY += 20;
      }

      // Draw table borders/lines
      doc.rect(40, y, 515, rowY - y).strokeColor(borderGray).stroke();

      // Total Box
      doc.rect(340, rowY + 10, 215, 25).fill(primaryColor);
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(10);
      doc.text('Total Amount Payable:', 350, rowY + 17);
      doc.fillColor(accentColor).text(`PKR ${data.totalAmount.toLocaleString()}`, 450, rowY + 17, { width: 95, align: 'right' });

      // Divider Line
      rowY += 50;
      doc.moveTo(40, rowY).lineTo(555, rowY).strokeColor(borderGray).stroke();

      // 4. Instructions & Bank info (Left side) and QR Code (Right side)
      rowY += 15;
      
      // Bank details block
      doc.fillColor(darkColor).font('Helvetica-Bold').fontSize(11).text('BANK PAYMENT INSTRUCTIONS', 40, rowY);
      doc.font('Helvetica').fontSize(8.5);
      doc.text('Please deposit the total amount at any Habib Bank branch or make an online IBAN transfer.', 40, rowY + 20, { width: 320 });
      
      // Bank details table
      let bankY = rowY + 45;
      doc.rect(40, bankY, 320, 75).fill(lightGray);
      doc.fillColor(darkColor).rect(40, bankY, 320, 75).strokeColor(borderGray).stroke();

      doc.font('Helvetica-Bold').text('Bank Name:', 50, bankY + 10);
      doc.font('Helvetica').text(data.bankName, 130, bankY + 10);
      
      doc.font('Helvetica-Bold').text('Account Title:', 50, bankY + 25);
      doc.font('Helvetica').text(data.bankAccountTitle, 130, bankY + 25);

      doc.font('Helvetica-Bold').text('Account No:', 50, bankY + 40);
      doc.font('Helvetica').text(data.bankAccountNo, 130, bankY + 40);

      doc.font('Helvetica-Bold').text('IBAN Code:', 50, bankY + 55);
      doc.font('Helvetica-Bold').fillColor(primaryColor).text(data.bankIban, 130, bankY + 55);

      // WhatsApp upload instructions
      doc.fillColor(darkColor).font('Helvetica-Bold').fontSize(9).text('REQUIRED ACTION AFTER DEPOSIT:', 40, bankY + 90);
      doc.font('Helvetica').fontSize(8).fillColor('#666666').text(
        '1. Photograph or screenshot your deposit slip or transfer receipt.\n' +
        '2. Send it via WhatsApp to +92 62 1234567. Include your reference number in text.\n' +
        '3. Unverified challans will result in suspension or rejection of membership.',
        40, bankY + 105, { width: 320 }
      );

      // Generate QR Code
      const qrDataText = `Challan No: ${data.challanNumber}\nPayer: ${data.payerName}\nAmount: PKR ${data.totalAmount}\nDue Date: ${data.dueDate}\nStatus: Unpaid`;
      try {
        const qrCodeDataUrl = await QRCode.toDataURL(qrDataText, { margin: 1, width: 120 });
        const qrBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
        doc.image(qrBuffer, 400, rowY + 15, { width: 120, height: 120 });
        
        doc.fillColor(darkColor).font('Helvetica-Bold').fontSize(8).text('SCAN TO VERIFY DETAILS', 400, rowY + 140, { width: 120, align: 'center' });
      } catch (qrErr) {
        console.error('Failed to generate QR Code for PDF:', qrErr);
      }

      // Footer border area
      doc.rect(40, 730, 515, 30).fill(lightGray);
      doc.fillColor('#888888').font('Helvetica').fontSize(8).text(
        'This is a computer-generated challan and does not require a physical signature.',
        50, 741, { width: 500, align: 'center' }
      );

      doc.end();

      writeStream.on('finish', () => {
        resolve(destPath);
      });
      writeStream.on('error', (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
};
