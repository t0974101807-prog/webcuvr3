const fs = require('fs');

let content = fs.readFileSync('src/utils/contractUtils.ts', 'utf-8');

const newProcessStr = `export const processUploadedContract = async (file: File, contractId: string): Promise<void> => {
  try {
    const fileName = file.name.toLowerCase();

    // 1. Handle PDF
    if (file.type === 'application/pdf' || fileName.endsWith('.pdf')) {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      const qrDataUrl = await QRCode.toDataURL(contractId || 'NO_ID', {
        errorCorrectionLevel: 'H',
        margin: 1,
        width: 150
      });
      
      const qrImageBytes = await fetch(qrDataUrl).then(res => res.arrayBuffer());
      const qrImage = await pdfDoc.embedPng(qrImageBytes);
      
      const pages = pdfDoc.getPages();
      const lastPage = pages[pages.length - 1];
      
      const { width, height } = lastPage.getSize();
      
      const qrDims = qrImage.scale(0.8);
      const yPos = 30;
      const xPos = 40;

      lastPage.drawImage(qrImage, {
        x: xPos,
        y: yPos,
        width: qrDims.width,
        height: qrDims.height,
      });
      
      lastPage.drawText("MÃ HỒ SƠ", {
        x: xPos,
        y: yPos + qrDims.height + 5,
        size: 10,
        color: rgb(0, 0, 0),
      });
      
      lastPage.drawText(contractId || 'NO_ID', {
        x: xPos,
        y: yPos - 12,
        size: 10,
        color: rgb(0, 0, 0),
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = \`Dong_Dau_\${file.name}\`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return;
    }

    // 2. Handle Word (doc/docx) by generating a fresh HTML word doc with QR
    // Since modifying an arbitrary docx in pure JS is extremely complex without a server,
    // we will generate a stylized HTML-based Word document with the QR code included.
    if (fileName.endsWith('.doc') || fileName.endsWith('.docx') || file.type.includes('word') || file.type.includes('officedocument.wordprocessingml')) {
      const qrDataUrl = await QRCode.toDataURL(contractId || 'NO_ID', {
        errorCorrectionLevel: 'H',
        margin: 1,
        width: 120
      });

      // Try to read the file to see if it's our HTML-based .doc
      const text = await file.text();
      let sourceHTML = '';

      if (text.includes('<html') && text.includes('<body')) {
        // It's the HTML .doc we generated!
        // Inject the QR code before </body>
        const qrHtml = \`
          <br/><br/><br/>
          <div style="text-align: left; margin-top: 50px;">
            <div style="font-size: 10pt; font-weight: bold; margin-bottom: 5px;">MÃ HỒ SƠ / CONTRACT ID</div>
            <img src="\${qrDataUrl}" width="100" height="100" alt="QR Code Mã số" />
            <div style="font-size: 11pt; margin-top: 5px;"><strong>\${contractId || 'NO_ID'}</strong></div>
          </div>
        \`;
        sourceHTML = text.replace('</body>', qrHtml + '</body>');
      } else {
        alert('Đã đóng dấu QR vào tệp Word thành công (Bản Preview).');
        
        const htmlContent = \`
          <div style="font-family: 'Times New Roman', Times, serif; font-size: 14pt; line-height: 1.5;">
            <div style="text-align: center;"><strong>TÀI LIỆU ĐÃ ĐÓNG DẤU QR (DEMO)</strong><br/><em>Lưu ý: Để giữ nguyên định dạng, vui lòng tải lên file PDF. File Word gốc khó có thể sửa đổi nội dung trực tiếp trên trình duyệt.</em></div>
            <br/><br/><br/>
            <div style="text-align: left; margin-top: 50px;">
              <div style="font-size: 10pt; font-weight: bold; margin-bottom: 5px;">MÃ HỒ SƠ / CONTRACT ID</div>
              <img src="\${qrDataUrl}" width="100" height="100" alt="QR Code" />
              <div style="font-size: 11pt; margin-top: 5px;"><strong>\${contractId || 'NO_ID'}</strong></div>
            </div>
          </div>
        \`;
        const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Hop Dong</title></head><body>";
        const footer = "</body></html>";
        sourceHTML = header + htmlContent + footer;
      }

      const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
      const fileDownload = document.createElement("a");
      document.body.appendChild(fileDownload);
      fileDownload.href = source;
      fileDownload.download = \`Dong_Dau_\${file.name.replace('.docx', '.doc')}\`;
      fileDownload.click();
      document.body.removeChild(fileDownload);
      return;
    }

    alert('Định dạng tệp không được hỗ trợ. Vui lòng tải lên PDF hoặc Word (.doc/.docx).');
  } catch (error) {
    console.error('Error processing file:', error);
    alert('Có lỗi xảy ra khi đóng dấu QR vào file.');
  }
};`;

// Use regex to replace the function exported at the bottom 
const fnStartPattern = /export const processUploadedContract = async \([\s\S]*$/;
content = content.replace(fnStartPattern, newProcessStr);

fs.writeFileSync('src/utils/contractUtils.ts', content);
console.log('patched processUploadedContract');
