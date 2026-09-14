import { paymentEventBus, PaymentEventType } from "./payment.event";

export interface IncomingBankTransaction {
  transactionId: string;
  bankCode: string;
  accountNumber: string;
  accountHolder?: string;
  amount: number;
  transferContent: string; // paymentRef e.g. HS2026-0001-DP01
  transactionTime: string;
  signature?: string;
}

export interface BankConnectorInterface {
  receiveTransaction(transaction: IncomingBankTransaction): Promise<{ success: boolean; message: string; transactionId: string }>;
  verifyTransaction(transactionId: string): Promise<boolean>;
  matchPayment(transferContent: string, amount: number): { matched: boolean; paymentRef?: string };
  getBalance(): Promise<{ accountNumber: string; balance: number; currency: string }>;
}

export class BankingGateway implements BankConnectorInterface {
  public async receiveTransaction(tx: IncomingBankTransaction): Promise<{ success: boolean; message: string; transactionId: string }> {
    console.log(`[BankingGateway] Received transaction: ID=${tx.transactionId}, Ref=${tx.transferContent}, Amount=${tx.amount}`);

    // Publish event TransactionReceived
    paymentEventBus.publish({
      eventType: PaymentEventType.TransactionReceived,
      caseId: "",
      paymentRef: tx.transferContent,
      data: tx
    });

    return {
      success: true,
      message: "Giao dịch đã được ghi nhận thành công tại Banking Gateway",
      transactionId: tx.transactionId
    };
  }

  public async verifyTransaction(transactionId: string): Promise<boolean> {
    // Verification logic (checksum/signature validation)
    return true;
  }

  public matchPayment(transferContent: string, amount: number): { matched: boolean; paymentRef?: string } {
    if (!transferContent) return { matched: false };
    
    // Extract potential payment reference pattern: [CaseCode]-[Type]-[Round]
    // e.g. HS2026-0001-DP01 or DN003-DP-01
    const refMatch = transferContent.match(/([A-Z0-9]+-[A-Z]{2}-\d+)/i) || transferContent.match(/([A-Z0-9]+-[A-Z]{2}\d+)/i);
    if (refMatch) {
      return { matched: true, paymentRef: refMatch[1].toUpperCase() };
    }

    return { matched: false };
  }

  public async getBalance(): Promise<{ accountNumber: string; balance: number; currency: string }> {
    return {
      accountNumber: "0383111222",
      balance: 1580000000,
      currency: "VND"
    };
  }
}

export const bankingGateway = new BankingGateway();
