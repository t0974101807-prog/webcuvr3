export const parseMoneyValue = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const sanitized = value.replace(/[^0-9.-]/g, "");
    const parsed = Number(sanitized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const getRemainingPaymentValue = (
  feeAmount: unknown,
  installment1: unknown,
  installment2: unknown,
): number => {
  const fee = parseMoneyValue(feeAmount);
  const first = parseMoneyValue(installment1);
  const second = parseMoneyValue(installment2);
  return Math.max(0, fee - first - second);
};

export const formatMoneyNumber = (value: number): string => {
  return Number.isFinite(value) ? value.toLocaleString("vi-VN") : "0";
};

export const syncContractDetailsFromClientData = (formData: any) => {
  if (!formData || !formData.contractDetails) return formData;

  let syncNeeded = false;
  const nextDetails = { ...formData.contractDetails };

  if (formData.clientName !== undefined && formData.clientName !== nextDetails.requesterName) {
    nextDetails.requesterName = formData.clientName;
    syncNeeded = true;
  }
  if (formData.clientDob !== undefined && formData.clientDob !== nextDetails.requesterDob) {
    nextDetails.requesterDob = formData.clientDob;
    syncNeeded = true;
  }
  if (formData.clientIdCard !== undefined && formData.clientIdCard !== nextDetails.requesterIdCard) {
    nextDetails.requesterIdCard = formData.clientIdCard;
    syncNeeded = true;
  }
  if (formData.clientPhone !== undefined && formData.clientPhone !== nextDetails.requesterPhone) {
    nextDetails.requesterPhone = formData.clientPhone;
    syncNeeded = true;
  }
  if (formData.clientAddress !== undefined && formData.clientAddress !== nextDetails.requesterAddress) {
    nextDetails.requesterAddress = formData.clientAddress;
    syncNeeded = true;
  }
  if (formData.caseDescription !== undefined && formData.caseDescription !== nextDetails.requestContent) {
    nextDetails.requestContent = formData.caseDescription;
    syncNeeded = true;
  }
  if (formData.courtRegion !== undefined && formData.courtRegion !== nextDetails.courtName) {
    nextDetails.courtName = formData.courtRegion;
    syncNeeded = true;
  }

  if (!syncNeeded) return formData;

  if (nextDetails.sameAsRequester) {
    nextDetails.beneficiaryName = nextDetails.requesterName;
    nextDetails.beneficiaryDob = nextDetails.requesterDob;
    nextDetails.beneficiaryIdCard = nextDetails.requesterIdCard;
    nextDetails.beneficiaryPhone = nextDetails.requesterPhone;
    nextDetails.beneficiaryAddress = nextDetails.requesterAddress;
  }

  if (nextDetails.sameAsRequester2) {
    nextDetails.obligorName = nextDetails.requesterName;
    nextDetails.obligorBusinessId = nextDetails.requesterIdCard;
    nextDetails.obligorPhone = nextDetails.requesterPhone;
    nextDetails.obligorAddress = nextDetails.requesterAddress;
  }

  return {
    ...formData,
    contractDetails: nextDetails,
  };
};

export const buildLegalCaseAnalysisPrompt = (record: any, language: "vi" | "en") => {
  const t_lang = language === "vi"
    ? {
        reqObj: "Đóng vai là một Luật sư cấp cao, hãy phân tích hồ sơ vụ việc pháp lý sau đây một cách chuyên sâu. Hãy trả về kết quả bằng định dạng Markdown với các tiêu đề chính như sau:\n\n### 📄 Cơ sở phân tích & Tóm tắt vụ việc\n[Phân tích chi tiết]\n\n### ⚖️ Căn cứ pháp lý & Tham chiếu\n[Tra cứu luật và liệt kê chính xác các điều khoản]\n\n### ⚠️ Đánh giá rủi ro\n[Liệt kê điểm trừ, rủi ro pháp lý]\n\n### ✅ Đề xuất hướng xử lý\n[Đề xuất các bước thực hiện tiếp theo]\n",
        title: "Tiêu đề",
        client: "Khách hàng",
        category: "Lĩnh vực",
        priority: "Cấp độ ưu tiên",
        status: "Trạng thái",
        desc: "Mô tả",
      }
    : {
        reqObj: "Acting as a Senior Lawyer, please deeply analyze the following legal case. Return the result in Markdown format with the following main sections:\n\n### 📄 Basis of analysis & Case summary\n[Detailed analysis]\n\n### ⚖️ Legal grounds & References\n[Look up laws and list exact clauses]\n\n### ⚠️ Risk assessment\n[List legal risks]\n\n### ✅ Proposed actions\n[Suggest next steps]\n",
        title: "Title",
        client: "Client",
        category: "Category",
        priority: "Priority",
        status: "Status",
        desc: "Description",
      };

  return `${t_lang.reqObj}\n\n${t_lang.title}: ${record?.title || ""}\n${t_lang.client}: ${record?.client || ""}\n${t_lang.category}: ${record?.category || ""}\n${t_lang.priority}: ${record?.priority || ""}\n${t_lang.status}: ${record?.status || ""}\n${t_lang.desc}: ${record?.description || ""}`;
};
