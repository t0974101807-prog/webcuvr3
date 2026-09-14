export enum PaymentWorkflowState {
  Draft = "Draft",
  QrGenerated = "QR Generated",
  WaitingPayment = "Waiting Payment",
  MoneyReceived = "Money Received",
  AiReconciliation = "AI Reconciliation",
  FinanceApproved = "Finance Approved",
  ReceiptCreated = "Receipt Created",
  Completed = "Completed",
  Cancelled = "Cancelled"
}

export class PaymentWorkflowEngine {
  private readonly validTransitions: Record<PaymentWorkflowState, PaymentWorkflowState[]> = {
    [PaymentWorkflowState.Draft]: [PaymentWorkflowState.QrGenerated, PaymentWorkflowState.WaitingPayment, PaymentWorkflowState.Cancelled],
    [PaymentWorkflowState.QrGenerated]: [PaymentWorkflowState.WaitingPayment, PaymentWorkflowState.MoneyReceived, PaymentWorkflowState.Cancelled],
    [PaymentWorkflowState.WaitingPayment]: [PaymentWorkflowState.MoneyReceived, PaymentWorkflowState.AiReconciliation, PaymentWorkflowState.Cancelled],
    [PaymentWorkflowState.MoneyReceived]: [PaymentWorkflowState.AiReconciliation, PaymentWorkflowState.FinanceApproved],
    [PaymentWorkflowState.AiReconciliation]: [PaymentWorkflowState.FinanceApproved, PaymentWorkflowState.ReceiptCreated],
    [PaymentWorkflowState.FinanceApproved]: [PaymentWorkflowState.ReceiptCreated, PaymentWorkflowState.Completed],
    [PaymentWorkflowState.ReceiptCreated]: [PaymentWorkflowState.Completed],
    [PaymentWorkflowState.Completed]: [],
    [PaymentWorkflowState.Cancelled]: [PaymentWorkflowState.Draft]
  };

  public canTransition(currentState: PaymentWorkflowState, nextState: PaymentWorkflowState): boolean {
    const allowed = this.validTransitions[currentState] || [];
    return allowed.includes(nextState);
  }

  public getNextState(currentState: PaymentWorkflowState): PaymentWorkflowState | null {
    const allowed = this.validTransitions[currentState] || [];
    return allowed[0] || null;
  }
}

export const paymentWorkflowEngine = new PaymentWorkflowEngine();
