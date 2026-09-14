import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calculator, RefreshCw, Info } from 'lucide-react';

type CaseType = 'so_tham' | 'phuc_tham';
type CaseField = 'dan_su' | 'hinh_su' | 'kdtm' | 'lao_dong' | 'hanh_chinh';
type ValueType = 'khong_gia_ngach' | 'co_gia_ngach';

const DOC_SO = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
const DOC_DON_VI = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];

const docSo3ChuSo = (baso: number, coKhongTram: boolean) => {
    let tram = Math.floor(baso / 100);
    let chuc = Math.floor((baso % 100) / 10);
    let donvi = baso % 10;
    let ketqua = '';

    if (tram === 0 && coKhongTram) {
        ketqua += 'không trăm ';
    } else if (tram > 0) {
        ketqua += DOC_SO[tram] + ' trăm ';
    }

    if (chuc === 0 && donvi !== 0 && (tram > 0 || coKhongTram)) {
        ketqua += 'linh ';
    } else if (chuc === 1) {
        ketqua += 'mười ';
    } else if (chuc > 1) {
        ketqua += DOC_SO[chuc] + ' mươi ';
    }

    if (donvi === 1 && chuc > 1) {
        ketqua += 'mốt';
    } else if (donvi === 5 && chuc > 0) {
        ketqua += 'lăm';
    } else if (donvi > 0) {
        ketqua += DOC_SO[donvi];
    }

    return ketqua;
}

const docTienBangChu = (so: number) => {
    const rounded = Math.round(so);
    if (rounded === 0) return 'Không đồng';
    let str = rounded.toString();
    let arr: string[] = [];
    while (str.length > 0) {
        let len = str.length;
        let cut = len > 3 ? len - 3 : 0;
        arr.push(str.slice(cut));
        str = str.slice(0, cut);
    }

    let ketqua = '';
    for (let j = arr.length - 1; j >= 0; j--) {
        let baso = parseInt(arr[j]);
        let doc = docSo3ChuSo(baso, j !== arr.length - 1 && ketqua !== '');
        if (doc !== '') {
            ketqua += doc + ' ' + DOC_DON_VI[j] + ' ';
        }
    }
    
    ketqua = ketqua.trim();
    return ketqua.charAt(0).toUpperCase() + ketqua.slice(1) + ' đồng';
}

export default function CourtFeeCalculator({ isEmbedded = false }: { isEmbedded?: boolean }) {
  const [caseType, setCaseType] = useState<CaseType>('so_tham');
  const [field, setField] = useState<CaseField>('dan_su');
  const [valueType, setValueType] = useState<ValueType>('khong_gia_ngach');
  const [disputeAmount, setDisputeAmount] = useState<string>('');
  const [fee, setFee] = useState<number | null>(null);
  const [advanceFee, setAdvanceFee] = useState<number | null>(null);

  // Reset dependent states when parent state changes
  useEffect(() => {
    setFee(null);
    setAdvanceFee(null);
  }, [caseType, field, valueType, disputeAmount]);

  useEffect(() => {
    // Reset value type if switching to fields/types that don't support it
    if (caseType === 'phuc_tham' || field === 'hinh_su' || field === 'hanh_chinh') {
      setValueType('khong_gia_ngach');
    }
  }, [caseType, field]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawValue = e.target.value.replace(/,/g, '');
    if (/^\d*$/.test(rawValue)) {
      rawValue = rawValue.replace(/^0+(?=\d)/, '');
      setDisputeAmount(rawValue.replace(/\B(?=(\d{3})+(?!\d))/g, ','));
    }
  };

  const calculateFee = () => {
    let calculatedFee = 0;

    if (caseType === 'phuc_tham') {
      switch (field) {
        case 'hinh_su':
          calculatedFee = 200000;
          break;
        case 'kdtm':
          calculatedFee = 2000000;
          break;
        case 'dan_su':
        case 'lao_dong':
        case 'hanh_chinh':
        default:
          calculatedFee = 300000;
          break;
      }
    } else {
      // Sơ thẩm
      if (field === 'hinh_su') {
        calculatedFee = 200000;
      } else if (field === 'hanh_chinh') {
        calculatedFee = 300000;
      } else if (valueType === 'khong_gia_ngach') {
        // Non-monetary
        if (field === 'kdtm') {
          calculatedFee = 3000000;
        } else {
          // Dân sự, Lao động, HNGĐ
          calculatedFee = 300000;
        }
      } else {
        // Có giá ngạch (Monetary)
        const amount = Number(disputeAmount.replace(/,/g, ''));
        if (isNaN(amount) || amount < 0) return;

        if (field === 'kdtm') {
          // KDTM Monetary
          if (amount <= 60000000) {
            calculatedFee = 3000000;
          } else if (amount <= 400000000) {
            calculatedFee = 3000000 + (amount - 60000000) * 0.05;
          } else if (amount <= 800000000) {
            calculatedFee = 20000000 + (amount - 400000000) * 0.04;
          } else if (amount <= 2000000000) {
            calculatedFee = 36000000 + (amount - 800000000) * 0.03;
          } else if (amount <= 4000000000) {
            calculatedFee = 72000000 + (amount - 2000000000) * 0.02;
          } else {
            calculatedFee = 112000000 + (amount - 4000000000) * 0.001;
          }
        } else {
          // Dân sự, Lao động Monetary
          if (amount <= 6000000) {
            calculatedFee = 300000;
          } else if (amount <= 400000000) {
            calculatedFee = amount * 0.05;
          } else if (amount <= 800000000) {
            calculatedFee = 20000000 + (amount - 400000000) * 0.04;
          } else if (amount <= 2000000000) {
            calculatedFee = 36000000 + (amount - 800000000) * 0.03;
          } else if (amount <= 4000000000) {
            calculatedFee = 72000000 + (amount - 2000000000) * 0.02;
          } else {
            calculatedFee = 112000000 + (amount - 4000000000) * 0.001;
          }
        }
      }
    }

    setFee(calculatedFee);
    setAdvanceFee(calculatedFee * 0.5);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'VND' }).format(value);
  };

  const showValueInput = caseType === 'so_tham' && 
                         valueType === 'co_gia_ngach' && 
                         field !== 'hinh_su' && 
                         field !== 'hanh_chinh';

  const showValueTypeSelector = caseType === 'so_tham' && 
                                field !== 'hinh_su' && 
                                field !== 'hanh_chinh';

  const innerContent = (
    <div className={`bg-white overflow-hidden ${isEmbedded ? 'rounded-2xl border border-slate-100' : 'rounded-lg shadow-xl border border-gray-100'}`}>
      <div className="bg-[var(--color-primary)] p-6 md:p-8 text-white flex flex-col md:flex-row items-start md:items-center gap-6">
        <div className="p-4 bg-white/10 rounded-lg backdrop-blur-sm">
          <Calculator size={40} className="text-[var(--color-accent)]" />
        </div>
        <div>
          <h3 className="text-3xl font-serif font-bold mb-2">Công Cụ Tính Án Phí</h3>
          <p className="text-white/80 text-base max-w-2xl">
            Dự tính án phí, lệ phí Tòa án theo Nghị quyết số 326/2016/UBTVQH14. 
            Hỗ trợ tính toán cho các vụ việc Dân sự, Hình sự, Hành chính, KDTM và Lao động.
          </p>
        </div>
      </div>

      <div className={`${isEmbedded ? 'p-6 md:p-8' : 'p-8 md:p-10'} grid grid-cols-1 lg:grid-cols-12 gap-10`}>
            {/* Input Section */}
            <div className="lg:col-span-7 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Loại vụ việc</label>
                  <select
                    value={caseType}
                    onChange={(e) => setCaseType(e.target.value as CaseType)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[var(--color-primary)] outline-none bg-white"
                  >
                    <option value="so_tham">Sơ thẩm</option>
                    <option value="phuc_tham">Phúc thẩm</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lĩnh vực</label>
                  <select
                    value={field}
                    onChange={(e) => setField(e.target.value as CaseField)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[var(--color-primary)] outline-none bg-white"
                  >
                    <option value="dan_su">Dân sự / HNGĐ</option>
                    <option value="kdtm">Kinh doanh thương mại</option>
                    <option value="lao_dong">Lao động</option>
                    <option value="hanh_chinh">Hành chính</option>
                    <option value="hinh_su">Hình sự</option>
                  </select>
                </div>
              </div>

              {showValueTypeSelector && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tính chất vụ việc</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setValueType('khong_gia_ngach')}
                      className={`py-3 px-4 rounded-lg border text-sm font-medium transition-all ${
                        valueType === 'khong_gia_ngach'
                          ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                          : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Không có giá ngạch
                    </button>
                    <button
                      onClick={() => setValueType('co_gia_ngach')}
                      className={`py-3 px-4 rounded-lg border text-sm font-medium transition-all ${
                        valueType === 'co_gia_ngach'
                          ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                          : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Có giá ngạch
                    </button>
                  </div>
                </div>
              )}

              <AnimatePresence>
                {showValueInput && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Giá trị tranh chấp (VNĐ)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={disputeAmount}
                        onChange={handleAmountChange}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition-all text-lg font-medium"
                        placeholder="Nhập số tiền..."
                      />
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 font-bold">
                        VNĐ
                      </div>
                    </div>
                    {disputeAmount && (
                      <p className="text-sm text-[var(--color-primary)] mt-2 font-medium italic">
                        {docTienBangChu(Number(disputeAmount.replace(/,/g, '')))}
                      </p>
                    )}
                    <p className="text-xs text-gray-600 mt-2 flex items-center gap-1">
                      <Info size={14} /> Nhập tổng giá trị tài sản hoặc số tiền tranh chấp.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="flex gap-4 pt-4">
                <button
                  onClick={calculateFee}
                  className="flex-1 py-4 bg-[var(--color-accent)] text-white font-bold rounded-lg hover:bg-[var(--color-accent-hover)] transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 transform hover:-translate-y-1"
                >
                  <Calculator size={20} />
                  Tính Án Phí
                </button>

                <button
                  onClick={() => {
                    setDisputeAmount('');
                    setFee(null);
                    setAdvanceFee(null);
                    setCaseType('so_tham');
                    setField('dan_su');
                    setValueType('khong_gia_ngach');
                  }}
                  className="px-6 py-4 bg-gray-100 text-gray-600 font-medium rounded-lg hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw size={20} />
                </button>
              </div>
            </div>

            {/* Result Section */}
            <div className="lg:col-span-5">
              <div className="bg-gray-50 rounded-lg p-8 h-full flex flex-col justify-center items-center text-center border-2 border-dashed border-gray-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-primary)]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-[var(--color-accent)]/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
                
                <h4 className="text-gray-600 font-medium uppercase tracking-widest text-sm mb-4 relative z-10">
                  Kết quả dự tính
                </h4>
                
                <motion.div
                  key={fee}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="relative z-10 w-full"
                >
                  <div className="mb-6">
                    <p className="text-sm text-gray-600 mb-1">Án phí</p>
                    <div className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-[var(--color-primary)] break-all">
                      {fee !== null ? formatCurrency(fee) : '---'}
                    </div>
                    {fee !== null && (
                      <p className="text-sm text-[var(--color-primary)] mt-2 font-medium italic">
                        {docTienBangChu(fee)}
                      </p>
                    )}
                  </div>

                  {advanceFee !== null && (
                    <div className="pt-6 border-t border-gray-200">
                      <p className="text-sm text-gray-600 mb-1">Tạm ứng án phí (50%)</p>
                      <div className="text-xl md:text-2xl font-serif font-bold text-[var(--color-accent)] break-all">
                        {formatCurrency(advanceFee)}
                      </div>
                      <p className="text-sm text-[var(--color-accent)] mt-2 font-medium italic">
                        {docTienBangChu(advanceFee)}
                      </p>
                    </div>
                  )}
                </motion.div>

                <div className="mt-8 text-xs text-gray-400 max-w-xs relative z-10 leading-relaxed">
                  <p className="mb-2">
                    * Kết quả tính toán dựa trên quy định tại Nghị quyết 326/2016/UBTVQH14.
                  </p>
                  <p>
                    * Số tiền thực tế có thể thay đổi tùy thuộc vào tình tiết cụ thể của vụ án và quyết định của Tòa án.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );

  if (isEmbedded) {
    return innerContent;
  }

  return (
    <motion.section 
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      id="tools" 
      className="py-16 md:py-24 bg-gray-50"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {innerContent}
      </div>
    </motion.section>
  );
}
