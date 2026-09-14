import fs from 'fs';

let content = fs.readFileSync('src/components/ERP.tsx', 'utf-8');
const marker = 'Chi tiết Mã HĐ:{" "}';
const start_idx = content.indexOf(marker);
if (start_idx === -1) throw new Error("Marker not found: " + marker);

const p6 = content.indexOf('<div className="p-6 overflow-y-auto flex-1 space-y-8 bg-slate-50">', start_idx);
if (p6 === -1) throw new Error("p6 start not found");

const p6_end = content.indexOf('            <div className="p-4 border-t border-slate-200 flex items-center justify-end gap-3 bg-white shrink-0">', p6);
if (p6_end === -1) throw new Error("p6 end not found");

const new_content = \`<div className="p-6 overflow-y-auto flex-1 space-y-8 bg-slate-50">
              {/* Thông tin tờ khai */}
              <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Mã hồ sơ
                    </label>
                    <input
                      type="text"
                      disabled
                      value={formData.contractDetails?.contractCode || ""}
                      className="w-full px-3 py-2 border rounded-lg bg-slate-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      User
                    </label>
                    <select
                      value={formData.contractDetails?.userId || ""}
                      onChange={(e) =>
                        handleContractDetailsChange("userId", e.target.value)
                      }
                      className="w-full px-3 py-2 border rounded-lg bg-white"
                    >
                      <option value="">Chọn tài khoản</option>
                    </select>
                    <p className="text-xs text-slate-500">
                      Chỉ tài khoản được chọn mới có thể xem hợp đồng này
                    </p>
                  </div>
                </div>
              </div>

              {/* Thông tin Khách hàng / Đối tác */}
              <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
                <div className="inline-block px-4 py-1.5 bg-blue-100 text-blue-800 font-bold rounded-lg text-sm mb-2">
                  THÔNG TIN KHÁCH HÀNG / ĐỐI TÁC
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <input
                      type="checkbox"
                      id="same-as-requester-1"
                      checked={
                        formData.contractDetails?.sameAsRequester1 || false
                      }
                      onChange={(e) =>
                        handleContractDetailsChange(
                          "sameAsRequester1",
                          e.target.checked,
                        )
                      }
                      className="w-4 h-4 rounded border-slate-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                    />
                    <label
                      htmlFor="same-as-requester-1"
                      className="text-sm text-slate-700 font-medium cursor-pointer"
                    >
                      Giống khách hàng yêu cầu
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 border-b border-slate-100 pb-4">
                    {/* Left Column */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                        <label className="font-bold text-slate-800 sm:col-span-1">
                          Họ và tên:
                        </label>
                        <input
                          type="text"
                          disabled={formData.contractDetails?.sameAsRequester1}
                          value={formData.contractDetails?.customerName || ""}
                          onChange={(e) =>
                            handleContractDetailsChange(
                              "customerName",
                              e.target.value,
                            )
                          }
                          className={\`w-full px-3 py-2 border rounded-lg sm:col-span-3 \${formData.contractDetails?.sameAsRequester1 ? "bg-slate-100 text-slate-500" : ""}\`}
                          placeholder="Nhập họ và tên"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                        <label className="font-bold text-slate-800 sm:col-span-1">
                          Số điện thoại:
                        </label>
                        <input
                          type="tel"
                          disabled={formData.contractDetails?.sameAsRequester1}
                          value={formData.contractDetails?.customerPhone || ""}
                          onChange={(e) =>
                            handleContractDetailsChange(
                              "customerPhone",
                              e.target.value,
                            )
                          }
                          className={\`w-full px-3 py-2 border rounded-lg sm:col-span-3 \${formData.contractDetails?.sameAsRequester1 ? "bg-slate-100 text-slate-500" : ""}\`}
                          placeholder="Nhập số điện thoại"
                        />
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                        <label className="font-bold text-slate-800 sm:col-span-1">
                          Số CMND/CCCD/Hộ chiếu:
                        </label>
                        <input
                          type="text"
                          disabled={formData.contractDetails?.sameAsRequester1}
                          value={formData.contractDetails?.customerIdCard || ""}
                          onChange={(e) =>
                            handleContractDetailsChange(
                              "customerIdCard",
                              e.target.value,
                            )
                          }
                          className={\`w-full px-3 py-2 border rounded-lg sm:col-span-3 \${formData.contractDetails?.sameAsRequester1 ? "bg-slate-100 text-slate-500" : ""}\`}
                          placeholder="Nhập số CMND/CCCD"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                        <label className="font-bold text-slate-800 sm:col-span-1">
                          Email:
                        </label>
                        <input
                          type="email"
                          disabled={formData.contractDetails?.sameAsRequester1}
                          value={formData.contractDetails?.customerEmail || ""}
                          onChange={(e) =>
                            handleContractDetailsChange(
                              "customerEmail",
                              e.target.value,
                            )
                          }
                          className={\`w-full px-3 py-2 border rounded-lg sm:col-span-3 \${formData.contractDetails?.sameAsRequester1 ? "bg-slate-100 text-slate-500" : ""}\`}
                          placeholder="Nhập email"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                      <label className="font-bold text-slate-800 md:col-span-1">
                        Địa chỉ:
                      </label>
                      <input
                        type="text"
                        disabled={formData.contractDetails?.sameAsRequester1}
                        value={formData.contractDetails?.customerAddress || ""}
                        onChange={(e) =>
                          handleContractDetailsChange(
                            "customerAddress",
                            e.target.value,
                          )
                        }
                        className={\`w-full px-3 py-2 border rounded-lg md:col-span-3 \${formData.contractDetails?.sameAsRequester1 ? "bg-slate-100 text-slate-500" : ""}\`}
                        placeholder="Nhập địa chỉ"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8 mb-4 border-t border-slate-100 pt-6">
                  <div className="inline-block px-4 py-1.5 bg-orange-100 text-orange-800 font-bold rounded-lg text-sm mb-2 uppercase">
                    Bên phải thi hành án (Đối tác)
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <input
                      type="checkbox"
                      id="same-as-requester-2"
                      checked={
                        formData.contractDetails?.sameAsRequester2 || false
                      }
                      onChange={(e) =>
                        handleContractDetailsChange(
                          "sameAsRequester2",
                          e.target.checked,
                        )
                      }
                      className="w-4 h-4 rounded border-slate-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                    />
                    <label
                      htmlFor="same-as-requester-2"
                      className="text-sm text-slate-700 font-medium cursor-pointer"
                    >
                      Giống khách hàng yêu cầu
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 border-b border-slate-100 pb-4">
                    {/* Left Column */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                        <label className="font-bold text-slate-800 sm:col-span-1">
                          Họ và tên:
                        </label>
                        <input
                          type="text"
                          disabled={formData.contractDetails?.sameAsRequester2}
                          value={formData.contractDetails?.obligorName || ""}
                          onChange={(e) =>
                            handleContractDetailsChange(
                              "obligorName",
                              e.target.value,
                            )
                          }
                          className={\`w-full px-3 py-2 border rounded-lg sm:col-span-3 \${formData.contractDetails?.sameAsRequester2 ? "bg-slate-100 text-slate-500" : ""}\`}
                          placeholder="Nhập họ và tên"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                        <label className="font-bold text-slate-800 sm:col-span-1">
                          Số điện thoại:
                        </label>
                        <input
                          type="tel"
                          disabled={formData.contractDetails?.sameAsRequester2}
                          value={formData.contractDetails?.obligorPhone || ""}
                          onChange={(e) =>
                            handleContractDetailsChange(
                              "obligorPhone",
                              e.target.value,
                            )
                          }
                          className={\`w-full px-3 py-2 border rounded-lg sm:col-span-3 \${formData.contractDetails?.sameAsRequester2 ? "bg-slate-100 text-slate-500" : ""}\`}
                          placeholder="Nhập số điện thoại"
                        />
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                        <label className="font-bold text-slate-800 sm:col-span-1">
                          Số CMND/CCCD/Hộ chiếu:
                        </label>
                        <input
                          type="text"
                          disabled={formData.contractDetails?.sameAsRequester2}
                          value={formData.contractDetails?.obligorIdCard || ""}
                          onChange={(e) =>
                            handleContractDetailsChange(
                              "obligorIdCard",
                              e.target.value,
                            )
                          }
                          className={\`w-full px-3 py-2 border rounded-lg sm:col-span-3 \${formData.contractDetails?.sameAsRequester2 ? "bg-slate-100 text-slate-500" : ""}\`}
                          placeholder="Nhập số CMND/CCCD"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                        <label className="font-bold text-slate-800 sm:col-span-1">
                          Email:
                        </label>
                        <input
                          type="email"
                          disabled={formData.contractDetails?.sameAsRequester2}
                          value={formData.contractDetails?.obligorEmail || ""}
                          onChange={(e) =>
                            handleContractDetailsChange(
                              "obligorEmail",
                              e.target.value,
                            )
                          }
                          className={\`w-full px-3 py-2 border rounded-lg sm:col-span-3 \${formData.contractDetails?.sameAsRequester2 ? "bg-slate-100 text-slate-500" : ""}\`}
                          placeholder="Nhập email"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                      <label className="font-bold text-slate-800 md:col-span-1">
                        Địa chỉ:
                      </label>
                      <input
                        type="text"
                        disabled={formData.contractDetails?.sameAsRequester2}
                        value={formData.contractDetails?.obligorAddress || ""}
                        onChange={(e) =>
                          handleContractDetailsChange(
                            "obligorAddress",
                            e.target.value,
                          )
                        }
                        className={\`w-full px-3 py-2 border rounded-lg md:col-span-3 \${formData.contractDetails?.sameAsRequester2 ? "bg-slate-100 text-slate-500" : ""}\`}
                        placeholder="Nhập địa chỉ"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Nội dung vụ việc */}
              <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <label className="font-medium text-slate-700 md:col-span-1">
                    Nội dung vụ việc (nhập đầy đủ nội dung yêu cầu theo bản
                    án/quyết định của Tòa án nhân dân)(
                    <span className="text-red-500">*</span>)
                  </label>
                  <textarea
                    value={formData.contractDetails?.requestContent || ""}
                    onChange={(e) =>
                      handleContractDetailsChange(
                        "requestContent",
                        e.target.value,
                      )
                    }
                    className="w-full px-3 py-2 border rounded-lg md:col-span-3 min-h-[100px]"
                    placeholder="Nhập đầy đủ nội dung vụ việc tại đây"
                  ></textarea>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <label className="font-medium text-slate-700 md:col-span-1">
                    Thông tin tài sản của đối tác (nếu có)
                  </label>
                  <textarea
                    value={formData.contractDetails?.obligorAssets || ""}
                    onChange={(e) =>
                      handleContractDetailsChange(
                        "obligorAssets",
                        e.target.value,
                      )
                    }
                    className="w-full px-3 py-2 border rounded-lg md:col-span-3 min-h-[80px]"
                    placeholder="Nhập tên, số lượng, chủng loại, hiện trạng tài sản,..."
                  ></textarea>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                  <label className="font-medium text-slate-700 md:col-span-1">
                    Số Bản án/Quyết định(<span className="text-red-500">*</span>
                    )
                  </label>
                  <div className="md:col-span-3 flex items-center gap-2">
                    <input
                      type="text"
                      value={formData.contractDetails?.judgmentNumber || ""}
                      onChange={(e) =>
                        handleContractDetailsChange(
                          "judgmentNumber",
                          e.target.value,
                        )
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Nhập đầy đủ các bản án/quyết định có hiệu lực, kể cả bản án/quyết định có hiệu lực một phần"
                    />
                    <button className="text-red-500 hover:text-red-700">
                      <Plus size={20} className="bg-red-100 rounded-lg p-0.5" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                  <label className="font-medium text-slate-700 md:col-span-1">
                    Ngày ban hành BA/QĐ
                  </label>
                  <div className="md:col-span-3">
                    <DatePickerInput
                      value={formData.contractDetails?.judgmentDate || ""}
                      onChange={(val: string) =>
                        handleContractDetailsChange("judgmentDate", val)
                      }
                      className="w-full px-3 py-2 border rounded-lg bg-white"
                      placeholder="dd/mm/yyyy"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                  <label className="font-medium text-slate-700 md:col-span-1">
                    Toà án/Trung tâm trọng tài thương mại
                  </label>
                  <select
                    value={formData.contractDetails?.courtName || ""}
                    onChange={(e) =>
                      handleContractDetailsChange("courtName", e.target.value)
                    }
                    className="w-full px-3 py-2 border rounded-lg bg-white md:col-span-3"
                  >
                    <option value="">
                      Chọn Cơ quan ban hành bản án/quyết định
                    </option>
                  </select>
                </div>
              </div>

              {/* TÀI LIỆU ĐÍNH KÈM */}
              <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-300 pb-2">
                  <h3 className="text-lg font-serif font-bold text-[var(--color-primary)] uppercase">
                    {language === "vi" ? "Tài liệu đính kèm" : "Attachments"}
                  </h3>
                  <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--color-primary)] text-white rounded-lg text-sm font-medium cursor-pointer transition-all duration-300 hover:opacity-90 active:scale-95 shadow-sm">
                    <UploadCloud size={16} /> {language === "vi" ? "Tải tài liệu lên" : "Upload Document"}
                    <input 
                      type="file" 
                      className="hidden" 
                      multiple 
                      onChange={async (e: any) => {
                        if (e.target.files && e.target.files.length > 0) {
                          const files = Array.from(e.target.files);
                          const uploadedAttachments = files.map((file: any) => ({
                            name: file.name,
                            originalName: file.name,
                            url: URL.createObjectURL(file)
                          }));
                          handleContractDetailsChange(
                            "attachments",
                            [...(formData.contractDetails?.attachments || []), ...uploadedAttachments]
                          );
                        }
                      }} 
                    />
                  </label>
                </div>
              
                <div className="flex flex-col gap-2">
                  {(() => {
                    const attachments = formData.contractDetails?.attachments || [];
                    return (
                      <>
                        {attachments.map((file: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-3 border border-gray-100 bg-gray-50 rounded-lg group">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded">
                                  <FileText size={16} />
                                </div>
                                <span className="font-medium text-sm text-gray-700">{file.name}</span>
                              </div>
                              <button 
                                type="button"
                                onClick={() => {
                                  handleContractDetailsChange(
                                    "attachments",
                                    attachments.filter((_: any, i: number) => i !== index)
                                  );
                                }}
                                className="text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                        ))}
                        {attachments.length === 0 && (
                          <div className="p-4 text-center border-2 border-dashed border-gray-200 rounded-lg text-gray-500 text-sm">
                            {language === "vi" ? "Chưa có tài liệu đính kèm" : "No attachments yet"}
                          </div>
                        )}
                      </>
                    )
                  })()}
                </div>
              </div>

              {/* Đóng dấu QR */}
              <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
                <div className="inline-block px-4 py-1.5 bg-blue-100 text-blue-800 font-bold rounded-lg text-sm mb-2">
                  Đóng dấu QR vào file
                </div>
                <p className="text-slate-600 text-sm">
                  Tải lên tệp PDF, hệ thống sẽ tự động tạo mã QR chứa thông tin
                  hợp đồng (Mã HĐ, Tên KH, Mã hồ sơ) và đính kèm vào góc dưới
                  trái của tất cả các trang PDF.
                </p>
                <div className="flex items-center gap-4 border border-dashed border-slate-300 rounded-lg p-6 bg-slate-50 justify-center flex-col">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
                    <QrCode size={24} />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-slate-800">
                      Kéo thả file PDF vào đây hoặc
                    </p>
                    <label className="text-[var(--color-primary)] font-medium cursor-pointer hover:underline">
                      Chọn file
                      <input type="file" accept=".pdf" className="hidden" />
                    </label>
                  </div>
                  <p className="text-xs text-slate-500">
                    Chỉ hỗ trợ file .pdf (Tối đa 10MB)
                  </p>
                </div>
              </div>
            </div>
\`;

content = content.substring(0, p6) + new_content + content.substring(p6_end);
fs.writeFileSync('src/components/ERP.tsx', content, 'utf-8');
console.log("Done");
