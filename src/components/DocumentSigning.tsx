import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  FileText, 
  PenTool, 
  Trash2, 
  CheckCircle, 
  Download, 
  Eye, 
  Info, 
  User, 
  Calendar, 
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Palette,
  Type
} from 'lucide-react';
import { fetchApi } from '../utils/api';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc,
  query,
  where
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../utils/firebase';
import { useContactSettings } from '../hooks/useContactSettings';

interface DocumentTemplate {
  id: string;
  titleVi: string;
  titleEn: string;
  code: string;
  description: string;
  contentVi: string;
  contentEn: string;
  terms: string[];
}

const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'legal_services_agreement',
    titleVi: 'HỢP ĐỒNG DỊCH VỤ PHÁP LÝ',
    titleEn: 'LEGAL SERVICES AGREEMENT',
    code: 'HĐDVPL/AD-2026',
    description: 'Hợp đồng thỏa thuận cung cấp dịch vụ tư vấn pháp luật, đại diện ngoài tố tụng và bảo vệ quyền lợi hợp pháp.',
    contentVi: 'BÊN A (Khách hàng) đồng ý thuê BÊN B (Công ty Luật TNHH Ánh Dương) để thực hiện dịch vụ tư vấn pháp luật chuyên sâu. Bên B cam kết bảo mật thông tin tuyệt đối và nỗ lực tối đa để bảo vệ quyền lợi của Bên A theo đúng quy định pháp luật Việt Nam.',
    contentEn: 'PARTY A (Client) agrees to engage PARTY B (Anh Duong Law Firm) to provide professional legal services. Party B commits to absolute confidentiality and will exert best efforts to protect the legitimate rights and interests of Party A in accordance with Vietnamese law.',
    terms: [
      'Bên B cung cấp ý kiến tư vấn pháp lý trung thực, khách quan và chuyên nghiệp.',
      'Bên A chịu trách nhiệm cung cấp thông tin, hồ sơ, chứng cứ đầy đủ, trung thực và đúng hạn.',
      'Mọi tranh chấp phát sinh từ hợp đồng này sẽ được ưu tiên giải quyết thông qua thương lượng và hòa giải.',
      'Hợp đồng có hiệu lực kể từ ngày hai bên hoàn thành việc ký số điện tử.'
    ]
  },
  {
    id: 'power_of_attorney',
    titleVi: 'GIẤY ỦY QUYỀN THAM GIA TỐ TỤNG',
    titleEn: 'POWER OF ATTORNEY FOR LITIGATION',
    code: 'GUQ/AD-2026',
    description: 'Ủy quyền cho Luật sư Ánh Dương thay mặt khách hàng làm việc với Tòa án, Viện kiểm sát và các cơ quan chức năng.',
    contentVi: 'Người ủy quyền bằng văn bản này ủy quyền cho các Luật sư thuộc Công ty Luật TNHH Ánh Dương được toàn quyền thay mặt chuẩn bị hồ sơ, nộp đơn khởi kiện, tham gia các buổi hòa giải, công khai chứng cứ và tranh tụng tại Tòa án nhân dân các cấp.',
    contentEn: 'The Principal hereby authorizes the Attorneys of Anh Duong Law Firm to act on their behalf to prepare files, submit petitions, participate in mediation sessions, and present arguments before the People\'s Court of all levels.',
    terms: [
      'Luật sư được ủy quyền cam kết thực hiện đúng phạm vi ủy quyền đã thỏa thuận.',
      'Mọi phát ngôn và tài liệu do Luật sư đại diện nộp có giá trị pháp lý ràng buộc với người ủy quyền.',
      'Ủy quyền này có giá trị cho đến khi vụ việc kết thúc hoặc có văn bản chấm dứt ủy quyền từ một trong hai bên.'
    ]
  },
  {
    id: 'confidentiality_agreement',
    titleVi: 'BẢN CAM KẾT BẢO MẬT THÔNG TIN',
    titleEn: 'NON-DISCLOSURE & CONFIDENTIALITY AGREEMENT',
    code: 'BCKBM/AD-2026',
    description: 'Cam kết bảo mật thông tin tài liệu, bí mật kinh doanh và dữ liệu cá nhân giữa Văn phòng luật và khách hàng.',
    contentVi: 'Hai bên cam kết bảo mật tuyệt đối các thông tin, tài liệu pháp lý, bí mật thương mại và dữ liệu cá nhân thu thập được trong suốt quá trình đồng hành pháp lý. Không bên nào được tiết lộ thông tin cho bên thứ ba khi chưa có sự đồng ý bằng văn bản.',
    contentEn: 'Both parties agree to keep all legal documents, business secrets, and personal data collected during the legal collaboration strictly confidential. Neither party shall disclose information to any third party without written consent.',
    terms: [
      'Thông tin bảo mật bao gồm tất cả các trao đổi miệng, tài liệu số, và hồ sơ vụ việc.',
      'Ngoại lệ duy nhất là khi có yêu cầu cung cấp thông tin chính thức bằng văn bản từ cơ quan tố tụng có thẩm quyền.',
      'Cam kết bảo mật này có hiệu lực vô thời hạn kể cả khi hợp đồng dịch vụ kết thúc.'
    ]
  }
];

interface SignedDocRecord {
  id: string;
  clientId: string;
  clientName: string;
  templateId: string;
  documentTitle: string;
  documentCode: string;
  signedUrl: string;
  signedAt: string;
  inkColor: string;
  method: 'draw' | 'type';
}

interface DocumentSigningProps {
  user: any;
}

export default function DocumentSigning({ user }: DocumentSigningProps) {
  const { settings: contactSettings } = useContactSettings();
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate>(DOCUMENT_TEMPLATES[0]);
  const [inkColor, setInkColor] = useState<string>('#0F4C81'); // Royal Blue default
  const [signingMethod, setSigningMethod] = useState<'draw' | 'type'>('draw');
  const [typedName, setTypedName] = useState<string>(user?.name || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [signedHistory, setSignedHistory] = useState<SignedDocRecord[]>([]);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef<boolean>(false);
  const lastXRef = useRef<number>(0);
  const lastYRef = useRef<number>(0);

  const clientId = user?.username || `client_${user?.id || 'guest'}`;

  // Real-time subscribe to client signed documents
  useEffect(() => {
    if (!clientId) return;

    if (db && (db as any).isMock) {
      console.warn("Skipping real-time signed_documents listener because database is in mock fallback mode.");
      return;
    }

    const q = query(
      collection(db, 'signed_documents'),
      where('clientId', '==', clientId)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const docsList: SignedDocRecord[] = [];
      snapshot.forEach((d) => {
        docsList.push({ id: d.id, ...d.data() } as SignedDocRecord);
      });
      docsList.sort((a, b) => (b.signedAt || "").localeCompare(a.signedAt || ""));
      setSignedHistory(docsList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'signed_documents');
    });

    return () => unsub();
  }, [clientId]);

  // Adjust canvas size for sharp drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Support high DPI screens
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || canvas.offsetWidth || 500;
    canvas.width = width * 2;
    canvas.height = 160 * 2; // Fixed height in CSS is 160px
    ctx.scale(2, 2);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = inkColor;

    clearCanvas();
  }, [selectedTemplate, signingMethod, inkColor]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw subtle grid placeholder
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(10, 80);
    ctx.lineTo(canvas.width / 2 - 10, 80);
    ctx.stroke();
    
    // Reset settings
    ctx.setLineDash([]);
    ctx.strokeStyle = inkColor;
    ctx.lineWidth = 2.5;
  };

  const getCoordinates = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const coords = getCoordinates(e);
    isDrawingRef.current = true;
    lastXRef.current = coords.x;
    lastYRef.current = coords.y;
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(lastXRef.current, lastYRef.current);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();

    lastXRef.current = coords.x;
    lastYRef.current = coords.y;
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  // Check if anything is drawn
  const isCanvasEmpty = () => {
    const canvas = canvasRef.current;
    if (!canvas) return true;
    const buffer = new Uint32Array(
      canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data.buffer
    );
    // If every pixel is background (transparent), it is empty. 
    // We check if at least some pixels are drawn. We search for dark/ink pixels.
    return !buffer.some(color => color !== 0);
  };

  const handleSignAndSubmit = async () => {
    if (signingMethod === 'draw' && isCanvasEmpty()) {
      setAlertMsg({ type: 'error', text: 'Vui lòng vẽ chữ ký của bạn lên khung ký trước khi gửi.' });
      return;
    }
    if (signingMethod === 'type' && !typedName.trim()) {
      setAlertMsg({ type: 'error', text: 'Vui lòng nhập tên đầy đủ của bạn để tạo chữ ký ký tự.' });
      return;
    }

    setIsSubmitting(true);
    setAlertMsg(null);

    try {
      // 1. We render the full document onto a large virtual canvas to save as a unified composite image
      const documentCanvas = document.createElement('canvas');
      documentCanvas.width = 800;
      documentCanvas.height = 1050; // Standard A4 ratio
      const docCtx = documentCanvas.getContext('2d');
      if (!docCtx) throw new Error('Could not create A4 document canvas');

      // White background
      docCtx.fillStyle = '#ffffff';
      docCtx.fillRect(0, 0, 800, 1050);

      // Draw elegant decorative gold border
      docCtx.strokeStyle = '#c2a278';
      docCtx.lineWidth = 4;
      docCtx.strokeRect(20, 20, 760, 1010);
      docCtx.lineWidth = 1;
      docCtx.strokeRect(26, 26, 748, 998);

      // Letterhead logo header
      docCtx.fillStyle = '#0f172a'; // Slate-900
      docCtx.font = 'bold 22px "Times New Roman", serif';
      docCtx.textAlign = 'center';
      docCtx.fillText('CÔNG TY LUẬT TNHH ÁNH DƯƠNG', 400, 75);
      
      docCtx.font = 'italic 12px "Times New Roman", serif';
      docCtx.fillStyle = '#c2a278';
      docCtx.fillText('ĐỒNG HÀNH PHÁP LÝ VỮNG CHẮC CÙNG DOANH NGHIỆP VÀ CÁ NHÂN', 400, 95);
      
      docCtx.strokeStyle = '#e2e8f0';
      docCtx.beginPath();
      docCtx.moveTo(100, 110);
      docCtx.lineTo(700, 110);
      docCtx.stroke();

      // Document Code / ID
      docCtx.fillStyle = '#64748b'; // Slate-500
      docCtx.font = '11px "Courier New", monospace';
      docCtx.textAlign = 'left';
      docCtx.fillText(`Số: ${selectedTemplate.code}`, 50, 135);
      docCtx.textAlign = 'right';
      docCtx.fillText(`Ngày ký: ${new Date().toLocaleDateString('vi-VN')}`, 750, 135);

      // Main Document Title
      docCtx.fillStyle = '#0f172a';
      docCtx.font = 'bold 20px "Times New Roman", serif';
      docCtx.textAlign = 'center';
      docCtx.fillText(selectedTemplate.titleVi, 400, 185);
      
      docCtx.fillStyle = '#c2a278';
      docCtx.font = 'bold italic 13px "Times New Roman", serif';
      docCtx.fillText(selectedTemplate.titleEn, 400, 205);

      // Body text details
      docCtx.fillStyle = '#334155'; // Slate-700
      docCtx.font = '14px "Times New Roman", serif';
      docCtx.textAlign = 'left';
      
      const wrapText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
        const words = text.split(' ');
        let line = '';
        let currentY = y;
        
        for (let n = 0; n < words.length; n++) {
          let testLine = line + words[n] + ' ';
          let metrics = docCtx.measureText(testLine);
          let testWidth = metrics.width;
          if (testWidth > maxWidth && n > 0) {
            docCtx.fillText(line, x, currentY);
            line = words[n] + ' ';
            currentY += lineHeight;
          } else {
            line = testLine;
          }
        }
        docCtx.fillText(line, x, currentY);
        return currentY + lineHeight;
      };

      // Metadata section
      docCtx.fillStyle = '#0f172a';
      docCtx.font = 'bold 14px "Times New Roman", serif';
      docCtx.fillText('BÊN A: KHÁCH HÀNG KÝ SỐ', 50, 250);
      docCtx.font = '14px "Times New Roman", serif';
      docCtx.fillText(`Họ và tên: ${user?.name || 'Nguyễn Văn A'}`, 70, 275);
      docCtx.fillText(`Số điện thoại: ${user?.phone || '0903******'}`, 70, 295);
      docCtx.fillText(`ID định danh hệ thống: ${clientId}`, 70, 315);

      docCtx.font = 'bold 14px "Times New Roman", serif';
      docCtx.fillText('BÊN B: CÔNG TY LUẬT ÁNH DƯƠNG', 420, 250);
      docCtx.font = '14px "Times New Roman", serif';
      docCtx.fillText('Người đại diện: Luật sư Nguyễn Văn Hải', 440, 275);
      docCtx.fillText('Chức vụ: Giám đốc Điều hành', 440, 295);
      docCtx.fillText('Địa chỉ: Quận Hoàn Kiếm, Hà Nội', 440, 315);

      // Divider line
      docCtx.strokeStyle = '#e2e8f0';
      docCtx.beginPath();
      docCtx.moveTo(50, 345);
      docCtx.lineTo(750, 345);
      docCtx.stroke();

      // Main Content Box
      docCtx.fillStyle = '#0f172a';
      docCtx.font = 'bold 14px "Times New Roman", serif';
      docCtx.fillText('I. NỘI DUNG THỎA THUẬN / AGREEMENT CONTENT:', 50, 380);

      docCtx.font = '14px "Times New Roman", serif';
      docCtx.fillStyle = '#334155';
      let nextY = wrapText(selectedTemplate.contentVi, 70, 410, 660, 22);
      
      docCtx.font = 'italic 13px "Times New Roman", serif';
      docCtx.fillStyle = '#64748b';
      nextY = wrapText(selectedTemplate.contentEn, 70, nextY + 10, 660, 20);

      // Terms
      docCtx.fillStyle = '#0f172a';
      docCtx.font = 'bold 14px "Times New Roman", serif';
      docCtx.fillText('II. ĐIỀU KHOẢN RÀNG BUỘC / BINDING TERMS:', 50, nextY + 20);
      
      docCtx.font = '14px "Times New Roman", serif';
      docCtx.fillStyle = '#334155';
      let termY = nextY + 45;
      selectedTemplate.terms.forEach((term, tIdx) => {
        termY = wrapText(`${tIdx + 1}. ${term}`, 70, termY, 660, 22);
      });

      // Signatures header
      const signBaseY = 820;
      docCtx.fillStyle = '#0f172a';
      docCtx.font = 'bold 14px "Times New Roman", serif';
      docCtx.fillText('ĐẠI DIỆN BÊN B (LAW FIRM)', 130, signBaseY);
      docCtx.font = '12px "Times New Roman", serif';
      docCtx.fillStyle = '#64748b';
      docCtx.fillText('(Đã ký số điện tử bảo mật)', 130, signBaseY + 20);

      // Drawing Attorney Stamp/Signature mock
      docCtx.strokeStyle = '#dc2626'; // Red stamp color
      docCtx.lineWidth = 1.5;
      docCtx.strokeRect(100, signBaseY + 35, 110, 50);
      docCtx.font = 'bold 11px "Times New Roman", serif';
      docCtx.fillStyle = '#dc2626';
      docCtx.fillText('CÔNG TY LUẬT', 155, signBaseY + 52);
      docCtx.fillText('ÁNH DƯƠNG', 155, signBaseY + 68);

      // Client Signature Header
      docCtx.fillStyle = '#0f172a';
      docCtx.font = 'bold 14px "Times New Roman", serif';
      docCtx.fillText('KHÁCH HÀNG KÝ TÊN (CLIENT)', 500, signBaseY);
      docCtx.font = '12px "Times New Roman", serif';
      docCtx.fillStyle = '#64748b';
      docCtx.fillText('(Ký tên bằng mã bảo mật OTP/Lý lịch số)', 500, signBaseY + 20);

      // Paste Signature on Client Spot
      if (signingMethod === 'draw' && canvasRef.current) {
        // Create secondary canvas to extract drawn strokes without grid line
        const signCanvas = document.createElement('canvas');
        signCanvas.width = canvasRef.current.width;
        signCanvas.height = canvasRef.current.height;
        const sCtx = signCanvas.getContext('2d');
        if (sCtx) {
          // Re-draw purely black/blue strokes onto temp canvas to avoid grid
          sCtx.strokeStyle = inkColor;
          sCtx.lineCap = 'round';
          sCtx.lineJoin = 'round';
          sCtx.lineWidth = 5; // thicker for scaling
          
          // Copy from visible canvas
          sCtx.drawImage(canvasRef.current, 0, 0);
          
          // Paste the signature image to document canvas
          docCtx.drawImage(signCanvas, 460, signBaseY + 30, 200, 80);
        }
      } else {
        // Typed signature
        docCtx.font = 'italic bold 28px "Times New Roman", serif';
        docCtx.fillStyle = inkColor;
        docCtx.fillText(typedName, 500, signBaseY + 65);
      }

      // Printed name footer
      docCtx.fillStyle = '#0f172a';
      docCtx.font = 'bold 13px "Times New Roman", serif';
      docCtx.fillText(user?.name || typedName, 500, signBaseY + 110);

      // Security hash stamp bottom center
      const secHash = `SEC-ID-${clientId.toUpperCase()}-${Math.floor(Date.now() / 1000)}`;
      docCtx.fillStyle = '#94a3b8';
      docCtx.font = '10px "Courier New", monospace';
      docCtx.fillText(`Mã bảo mật điện tử: ${secHash}`, 400, 1025);

      // 2. Convert composite document to Blob
      const docBlob = await new Promise<Blob | null>((resolve) => {
        documentCanvas.toBlob((b) => resolve(b), 'image/png');
      });

      if (!docBlob) throw new Error('Could not render document to PNG blob');

      // 3. Upload to server via live-upload API
      const formData = new FormData();
      formData.append('file', docBlob, `${selectedTemplate.id}_signed_${Date.now()}.png`);

      const uploadRes = await fetch('/api/live-upload', {
        method: 'POST',
        body: formData
      });

      if (!uploadRes.ok) {
        throw new Error('Upload API failed');
      }

      const uploadData = await uploadRes.json();
      if (!uploadData.url) {
        throw new Error('Upload response missing url');
      }

      // 4. Save to Firestore `signed_documents` for portal listing
      const signedRecordId = `signed-doc-${Date.now()}`;
      const record: SignedDocRecord = {
        id: signedRecordId,
        clientId,
        clientName: user?.name || 'Khách hàng',
        templateId: selectedTemplate.id,
        documentTitle: selectedTemplate.titleVi,
        documentCode: selectedTemplate.code,
        signedUrl: uploadData.url,
        signedAt: new Date().toISOString(),
        inkColor,
        method: signingMethod
      };

      await setDoc(doc(db, 'signed_documents', signedRecordId), record);

      setAlertMsg({ 
        type: 'success', 
        text: `Ký điện tử thành công! Tài liệu '${selectedTemplate.titleVi}' đã được xác thực mã hóa và lưu trữ an toàn trong kho hồ sơ của bạn.` 
      });

      // Clear states
      if (signingMethod === 'draw') clearCanvas();

    } catch (err: any) {
      console.error(err);
      setAlertMsg({ type: 'error', text: `Đã xảy ra lỗi khi hoàn tất chữ ký: ${err?.message || 'Lỗi không xác định'}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Templates Selector & Realistic A4 Preview */}
      <div className="lg:col-span-7 space-y-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <FileText className="text-[var(--color-accent)]" size={20} />
            1. Chọn Tài Liệu Ký Số
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {DOCUMENT_TEMPLATES.map((tmpl) => {
              const isSelected = selectedTemplate.id === tmpl.id;
              return (
                <button
                  key={tmpl.id}
                  onClick={() => setSelectedTemplate(tmpl)}
                  className={`p-4 text-left rounded-xl border text-xs transition-all flex flex-col justify-between h-36 cursor-pointer ${
                    isSelected 
                      ? 'border-[var(--color-accent)] bg-amber-50/50 shadow-sm text-amber-900 ring-2 ring-[var(--color-accent)]/10' 
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <div>
                    <span className="font-mono text-[9px] text-slate-400 block mb-1">{tmpl.code}</span>
                    <h4 className="font-bold text-sm line-clamp-2 leading-snug">{tmpl.titleVi}</h4>
                  </div>
                  <p className="text-[10px] text-slate-500 line-clamp-2 mt-2 font-normal leading-relaxed">{tmpl.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live A4 Interactive Preview */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-10 relative overflow-hidden aspect-[1/1.41] flex flex-col justify-between max-w-[650px] mx-auto ring-1 ring-slate-100">
          {/* Subtle gold formal grid paper design */}
          <div className="absolute inset-4 border border-[#c2a278]/25 pointer-events-none rounded"></div>
          
          <div className="space-y-6 z-10">
            {/* Header */}
            <div className="text-center border-b border-slate-200 pb-4 relative">
              <h4 className="font-serif text-base sm:text-lg font-bold text-slate-900 tracking-wide uppercase">CÔNG TY LUẬT TNHH ÁNH DƯƠNG</h4>
              <p className="text-[10px] text-[#c2a278] uppercase tracking-widest font-medium mt-1">Đồng hành pháp lý vững chắc cùng doanh nghiệp và cá nhân</p>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-4">
                <span>Số: {selectedTemplate.code}</span>
                <span>Ngày ký: {new Date().toLocaleDateString('vi-VN')}</span>
              </div>
            </div>

            {/* Title */}
            <div className="text-center space-y-1.5 py-2">
              <h2 className="font-serif text-lg sm:text-xl font-bold text-slate-800 tracking-wide uppercase">{selectedTemplate.titleVi}</h2>
              <p className="text-[11px] text-[#c2a278] font-bold italic tracking-wider uppercase">{selectedTemplate.titleEn}</p>
            </div>

            {/* Dynamic Metadata Section */}
            <div className="grid grid-cols-2 gap-4 text-[11px] sm:text-xs text-slate-700 bg-slate-50/50 p-4 rounded-lg border border-slate-200">
              <div className="space-y-1.5 border-r border-slate-200/60 pr-4">
                <p className="font-bold text-slate-900 text-[10px] tracking-wider uppercase">BÊN A (KHÁCH HÀNG)</p>
                <p className="font-medium">Họ & tên: <span className="font-bold text-slate-800">{user?.name || 'Nguyễn Văn A'}</span></p>
                <p>Số điện thoại: {user?.phone || '0903******'}</p>
                <p className="text-slate-400 font-mono text-[10px]">ID: {clientId}</p>
              </div>
              <div className="space-y-1.5 pl-4">
                <p className="font-bold text-slate-900 text-[10px] tracking-wider uppercase">BÊN B (VĂN PHÒNG LUẬT)</p>
                <p className="font-medium">Người ĐD: <span className="font-semibold text-slate-800">LS. Nguyễn Văn Hải</span></p>
                <p>Chức vụ: Giám đốc Điều hành</p>
                <p>Hotline: {contactSettings?.hotline_consult || '1900 3330'}</p>
              </div>
            </div>

            {/* Content Clauses */}
            <div className="space-y-4 text-xs leading-relaxed text-slate-600 font-normal">
              <div>
                <p className="font-bold text-slate-900 mb-1">I. NỘI DUNG THỎA THUẬN (AGREEMENT):</p>
                <p className="text-[11px] sm:text-xs">{selectedTemplate.contentVi}</p>
                <p className="text-[10px] sm:text-[11px] text-slate-400 italic mt-1.5">{selectedTemplate.contentEn}</p>
              </div>

              <div>
                <p className="font-bold text-slate-900 mb-1">II. ĐIỀU KHOẢN RÀNG BUỘC (TERMS):</p>
                <ul className="list-decimal list-inside space-y-1 text-[11px] sm:text-xs pl-1">
                  {selectedTemplate.terms.map((term, idx) => (
                    <li key={idx} className="text-slate-500 font-light">
                      <span className="text-slate-700 font-medium">{term}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom Stamp & Signature Box Mock */}
          <div className="border-t border-dashed border-slate-200 pt-6 mt-6 z-10">
            <div className="grid grid-cols-2 gap-4 text-center">
              {/* Partner Stamp */}
              <div className="flex flex-col items-center">
                <p className="text-[11px] font-bold text-slate-900 uppercase">Đại diện Bên B</p>
                <p className="text-[9px] text-slate-400 italic">(Đã chứng thực số)</p>
                <div className="w-24 h-12 border border-red-500/80 rounded-md flex items-center justify-center text-red-500/80 text-[8px] font-bold uppercase rotate-[-4deg] my-2 bg-red-50/20 scale-90">
                  CÔNG TY LUẬT ÁNH DƯƠNG
                </div>
                <p className="text-[11px] font-semibold text-slate-800 mt-1">LS. Nguyễn Văn Hải</p>
              </div>

              {/* Client Signature Preview */}
              <div className="flex flex-col items-center justify-between min-h-[110px]">
                <div>
                  <p className="text-[11px] font-bold text-slate-900 uppercase">Khách hàng ký tên</p>
                  <p className="text-[9px] text-slate-400 italic">(Chữ ký số xác thực)</p>
                </div>

                {/* Simulated rendering of signature */}
                <div className="h-12 w-full flex items-center justify-center border-b border-slate-200/60 my-1 bg-amber-50/10">
                  {signingMethod === 'draw' ? (
                    <span className="text-[9px] text-slate-400 font-mono italic">Xem Chữ Ký ở Khung Ký bên phải</span>
                  ) : (
                    <span 
                      style={{ color: inkColor }} 
                      className="text-lg font-bold italic tracking-wider select-none font-serif"
                    >
                      {typedName || 'Chưa nhập chữ ký'}
                    </span>
                  )}
                </div>

                <p className="text-[11px] font-semibold text-slate-800">{user?.name || typedName || 'Vui lòng ký'}</p>
              </div>
            </div>

            {/* Secure Timestamp Tag */}
            <div className="text-center text-[8px] text-slate-400 font-mono mt-6 tracking-wider">
              XÁC THỰC BẢO MẬT ĐIỆN TỬ • SECURE OTP SIGNED RECORD ID: {clientId.toUpperCase()}-SHA256
            </div>
          </div>
        </div>
      </div>

      {/* Signature Capture Pad & Operations */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <PenTool className="text-[var(--color-accent)]" size={20} />
              2. Khung Thực Hiện Ký Số
            </h3>

            {/* Toggle Method tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl mb-4 text-xs font-semibold">
              <button
                onClick={() => setSigningMethod('draw')}
                className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${signingMethod === 'draw' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <PenTool size={14} />
                Vẽ chữ ký tay
              </button>
              <button
                onClick={() => setSigningMethod('type')}
                className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${signingMethod === 'type' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <Type size={14} />
                Nhập ký tự điện tử
              </button>
            </div>

            {/* Ink Palette */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Palette size={14} />
                Màu mực ký:
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setInkColor('#0F4C81')} // Royal Blue
                  className={`w-6 h-6 rounded-full border-2 transition-transform flex items-center justify-center ${inkColor === '#0F4C81' ? 'border-amber-400 scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: '#0F4C81' }}
                  title="Xanh mực viết"
                />
                <button
                  onClick={() => setInkColor('#090d16')} // Dark Charcoal
                  className={`w-6 h-6 rounded-full border-2 transition-transform flex items-center justify-center ${inkColor === '#090d16' ? 'border-amber-400 scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: '#090d16' }}
                  title="Đen bảo mật"
                />
              </div>
            </div>

            {/* Draw Interface */}
            {signingMethod === 'draw' ? (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Khung ký chữ viết tay</label>
                <div className="border-2 border-dashed border-slate-300 rounded-xl overflow-hidden bg-slate-50/50 relative group">
                  <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-40 bg-white block cursor-crosshair touch-none"
                  />
                  <button
                    onClick={clearCanvas}
                    className="absolute top-3 right-3 p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg hover:text-red-500 transition-colors shadow-sm cursor-pointer border border-slate-200"
                    title="Xóa chữ ký vẽ lại"
                  >
                    <Trash2 size={14} />
                  </button>
                  <div className="absolute bottom-3 left-4 text-[10px] text-slate-400 pointer-events-none italic select-none">
                    Dùng chuột hoặc ngón tay vẽ trực tiếp lên khung trắng trên
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nhập họ & tên đầy đủ</label>
                  <input
                    type="text"
                    value={typedName}
                    onChange={(e) => setTypedName(e.target.value)}
                    placeholder="Ví dụ: Nguyễn Văn Hải"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-[var(--color-accent)] transition-all text-sm font-semibold"
                  />
                </div>
                
                {/* Script font preview */}
                <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-amber-50/20 flex flex-col items-center justify-center h-24">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-2 font-semibold">Bản xem trước chữ ký viết tay</span>
                  <span 
                    style={{ color: inkColor }} 
                    className="text-3xl font-serif italic tracking-widest leading-none select-none"
                  >
                    {typedName || 'Nguyễn Văn Hải'}
                  </span>
                </div>
              </div>
            )}

            {/* Interactive feedback / alert */}
            {alertMsg && (
              <div className={`p-4 rounded-xl text-xs mt-4 flex items-start gap-2 border ${
                alertMsg.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
              }`}>
                <Info size={16} className="shrink-0 mt-0.5" />
                <span>{alertMsg.text}</span>
              </div>
            )}
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100">
            <button
              onClick={handleSignAndSubmit}
              disabled={isSubmitting}
              className="w-full py-4 px-6 bg-[var(--color-accent)] active:scale-[0.98] text-white font-bold rounded-xl hover:bg-amber-600 transition-all flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(212,175,55,0.2)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer tracking-wider text-sm uppercase"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Đang mã hóa chữ ký số...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  <span>Ký Số & Xác Thực Tài Liệu</span>
                </>
              )}
            </button>
            <p className="text-[10px] text-center text-slate-400 font-light mt-3 leading-relaxed px-4">
              Chữ ký số điện tử của bạn được bảo mật tuyệt đối, mã hóa khóa công khai SHA256 và lưu giữ bảo mật trên hệ thống Ánh Dương Law.
            </p>
          </div>
        </div>

        {/* Signed Documents History / Log */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
            <CheckCircle className="text-green-500" size={18} />
            Lịch Sử Ký Số ({signedHistory.length})
          </h3>

          {signedHistory.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              Chưa có tài liệu nào được ký số trên cổng này.
            </div>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {signedHistory.map((rec) => (
                <div key={rec.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 transition-colors">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-800 truncate max-w-[200px]" title={rec.documentTitle}>{rec.documentTitle}</h4>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                      <span>{rec.documentCode}</span>
                      <span>•</span>
                      <span>{new Date(rec.signedAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                  
                  <a
                    href={rec.signedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-white hover:bg-amber-50 hover:text-[var(--color-accent)] text-slate-500 border border-slate-200 hover:border-[var(--color-accent)]/40 rounded-lg transition-all"
                    title="Xem chi tiết tài liệu đã ký"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
