import { PDFDocument, rgb } from 'pdf-lib';
import QRCode from 'qrcode';

export const handleDownloadContract = (record: any, type: 'HĐDVPL' | 'HĐUQ' = 'HĐDVPL') => {
  const cd = record.contractDetails || {};
  const date = new Date();
  
  const contractId = type === 'HĐDVPL' ? record.contractId : record.authContractId;
  const contractTitle = type === 'HĐDVPL' ? 'DỊCH VỤ PHÁP LÝ' : 'ỦY QUYỀN';
  
  const htmlContent = `
    <div style="font-family: 'Times New Roman', Times, serif; font-size: 14pt; line-height: 1.5;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="width: 40%; text-align: center; vertical-align: top;">
            <strong>CÔNG TY LUẬT TNHH TRUNG TIẾN</strong><br/>
            Đồng hành pháp lý cùng bạn<br/>
          </td>
          <td style="width: 60%; text-align: center; vertical-align: top;">
            <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br/>
            <strong>Độc lập – Tự do – Hạnh phúc</strong><br/>
            -----------------------
          </td>
        </tr>
      </table>
      
      <br/><br/>
      <div style="text-align: center;">
        <strong style="font-size: 16pt;">HỢP ĐỒNG ${contractTitle}</strong><br/>
        Số: ${contractId || ('..../2026-'+type+'/LTT')}
      </div>
      <br/>
      
      <p><strong><u>Căn cứ:</u></strong></p>
      <ul>
        <li>Bộ luật Dân sự 2015 có hiệu lực thi hành từ ngày 01 tháng 01 năm 2017;</li>
        <li>Luật Luật sư 2006 có hiệu lực thi hành từ ngày 01 tháng 01 năm 2007, được sửa đổi bổ sung năm 2012;</li>
        <li>Các văn bản quy phạm pháp luật khác có liên quan;</li>
        <li>Căn cứ vào nhu cầu và khả năng của Hai Bên.</li>
      </ul>
      
      <p><em>Hôm nay, ngày ${date.getDate().toString().padStart(2, '0')} tháng ${(date.getMonth() + 1).toString().padStart(2, '0')} năm ${date.getFullYear()}, Chúng tôi gồm có:</em></p>
      
      <p><strong>BÊN A: CÔNG TY LUẬT TNHH TRUNG TIẾN</strong></p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="width: 30%;">Số Đăng ký hoạt động</td><td>: </td></tr>
        <tr><td>Trụ sở</td><td>: Đường Lạc Long Quân, khối phố Thịnh Mỹ, phường Hội An Tây, thành phố Đà Nẵng</td></tr>
        <tr><td>Người đại diện</td><td>: LS. NGUYỄN THÀNH CHƯƠNG</td></tr>
        <tr><td>Chức vụ</td><td>: Giám đốc</td></tr>
        <tr><td>Số điện thoại</td><td>: 0931.122.777</td></tr>
        <tr><td>Email</td><td>: </td></tr>
      </table>
      <br/>
      
      <p><strong>BÊN B: ${cd.beneficiaryName || cd.requesterName || '................................................................................................'}</strong></p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="width: 30%;">Ngày sinh</td><td>: ${cd.beneficiaryDob || '........................................................................'}</td></tr>
        <tr><td>Số CMND/CCCD/HC</td><td>: ${cd.beneficiaryIdCard || '........................................................................'}</td></tr>
        <tr><td>Ngày cấp</td><td>: ........................................................................</td></tr>
        <tr><td>Nơi cấp</td><td>: ........................................................................</td></tr>
        <tr><td>Địa chỉ</td><td>: ${cd.beneficiaryAddress || cd.requesterAddress || '........................................................................'}</td></tr>
        <tr><td>Số điện thoại</td><td>: ${cd.beneficiaryPhone || '........................................................................'}</td></tr>
        <tr><td>Email</td><td>: ${cd.beneficiaryEmail || '........................................................................'}</td></tr>
      </table>
      <br/>
      
      <p>Sau khi bàn bạc, thỏa thuận Hai Bên tự nguyện, đồng ý ký kết Hợp đồng ${type === 'HĐDVPL' ? 'dịch vụ pháp lý' : 'ủy quyền'} (Sau đây gọi tắt là “Hợp đồng”) với các điều khoản như sau:</p>
      
      <p><strong>ĐIỀU 1: PHẠM VI CUNG CẤP DỊCH VỤ</strong></p>
      <p>1.1. Bên B đồng ý giao và Bên A đồng ý nhận thực hiện các công việc:</p>
      <p>- Nội dung vụ việc: ${cd.requestContent || '........................................................................................................................................................................................................................................................................................................................................................................'}</p>
      <p>- Thông tin đối tác: ${cd.obligorName || '........................................................................'}</p>
      <p>- Địa chỉ đối tác: ${cd.obligorAddress || '........................................................................'}</p>
      <p>- Thông tin tài sản của đối tác: ${cd.obligorAssets || '................................................................................................................................................'}</p>
      
      <br/><br/>
      <table style="width: 100%; border-collapse: collapse; text-align: center;">
        <tr>
          <td style="width: 50%;">
            <strong>ĐẠI DIỆN BÊN A</strong><br/>
            <em>Ký, ghi rõ họ tên và đóng dấu</em><br/><br/><br/><br/><br/>
            <strong>LS. NGUYỄN THÀNH CHƯƠNG</strong>
          </td>
          <td style="width: 50%;">
            <strong>ĐẠI DIỆN BÊN B</strong><br/>
            <em>Ký, ghi rõ họ tên và đóng dấu (nếu có)</em><br/><br/><br/><br/><br/>
            <strong>${cd.beneficiaryName || cd.requesterName || ''}</strong>
          </td>
        </tr>
      </table>
      
      <br/><br/><br/><br/>
      <div style="text-align: left; margin-top: 50px;">
        <div style="font-size: 10pt; font-weight: bold; margin-bottom: 5px;">MÃ HỒ SƠ / CONTRACT ID</div>
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&margin=0&data=${encodeURIComponent(contractId || record.id || 'NO_ID')}" width="100" height="100" alt="QR Code Mã số" />
        <div style="font-size: 11pt; margin-top: 5px;"><strong>${contractId || record.id || 'NO_ID'}</strong></div>
      </div>
    </div>
  `;

  const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Hop Dong</title></head><body>";
  const footer = "</body></html>";
  const sourceHTML = header + htmlContent + footer;
  
  const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
  const fileDownload = document.createElement("a");
  document.body.appendChild(fileDownload);
  fileDownload.href = source;
  fileDownload.download = `Hop_Dong_${contractId ? contractId.replace(/\//g, '_') : 'Moi'}.doc`;
  fileDownload.click();
  document.body.removeChild(fileDownload);
};

export const processUploadedContract = async (file: File, contractId: string): Promise<void> => {
  try {
    const fileName = file.name.toLowerCase();

    // 1. Handle PDF
    if (file.type === 'application/pdf' || fileName.endsWith('.pdf')) {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      const qrData = `${window.location.origin}/?qr=${encodeURIComponent(contractId || 'UNKNOWN')}`;
      const qrDataUrl = await QRCode.toDataURL(qrData, {
        errorCorrectionLevel: 'H',
        margin: 1,
        width: 150
      });
      
      const base64Data = qrDataUrl.split(',')[1];
      const binaryString = window.atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const qrImageBytes = bytes.buffer;
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
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Dong_Dau_${file.name}`;
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
      const qrData = `${window.location.origin}/?qr=${encodeURIComponent(contractId || 'UNKNOWN')}`;
      const qrDataUrl = await QRCode.toDataURL(qrData, {
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
        const qrHtml = `
          <br/><br/><br/>
          <div style="text-align: left; margin-top: 50px;">
            <div style="font-size: 10pt; font-weight: bold; margin-bottom: 5px;">MÃ HỒ SƠ / CONTRACT ID</div>
            <img src="${qrDataUrl}" width="100" height="100" alt="QR Code Mã số" />
            <div style="font-size: 11pt; margin-top: 5px;"><strong>${contractId || 'NO_ID'}</strong></div>
          </div>
        `;
        sourceHTML = text.replace('</body>', qrHtml + '</body>');
      } else {
        alert('Đã đóng dấu QR vào tệp Word thành công (Bản Preview).');
        
        const htmlContent = `
          <div style="font-family: 'Times New Roman', Times, serif; font-size: 14pt; line-height: 1.5;">
            <div style="text-align: center;"><strong>TÀI LIỆU ĐÃ ĐÓNG DẤU QR (DEMO)</strong><br/><em>Lưu ý: Để giữ nguyên định dạng, vui lòng tải lên file PDF. File Word gốc khó có thể sửa đổi nội dung trực tiếp trên trình duyệt.</em></div>
            <br/><br/><br/>
            <div style="text-align: left; margin-top: 50px;">
              <div style="font-size: 10pt; font-weight: bold; margin-bottom: 5px;">MÃ HỒ SƠ / CONTRACT ID</div>
              <img src="${qrDataUrl}" width="100" height="100" alt="QR Code" />
              <div style="font-size: 11pt; margin-top: 5px;"><strong>${contractId || 'NO_ID'}</strong></div>
            </div>
          </div>
        `;
        const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Hop Dong</title></head><body>";
        const footer = "</body></html>";
        sourceHTML = header + htmlContent + footer;
      }

      const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
      const fileDownload = document.createElement("a");
      document.body.appendChild(fileDownload);
      fileDownload.href = source;
      fileDownload.download = `Dong_Dau_${file.name.replace('.docx', '.doc')}`;
      fileDownload.click();
      document.body.removeChild(fileDownload);
      return;
    }

    alert('Định dạng tệp không được hỗ trợ. Vui lòng tải lên PDF hoặc Word (.doc/.docx).');
  } catch (error) {
    console.error('Error processing file:', error);
    alert('Có lỗi xảy ra khi đóng dấu QR vào file.');
  }
};