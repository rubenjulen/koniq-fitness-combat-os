"use client";
import { Modal } from "@/components/Modal";
import { SubmitButton } from "@/components/FormControls";
import { recordPayment } from "./actions";

export function RecordPaymentModal({ invoiceId, amount, memberName }: { invoiceId: string; amount: number; memberName: string }) {
  return (
    <Modal trigger={{ label: "Betaling", icon: "coins", variant: "secondary" }} title={`Betaling registreren — ${memberName}`}>
      <form action={recordPayment} className="space-y-3">
        <input type="hidden" name="invoiceId" value={invoiceId} />
        <div>
          <label className="label">Bedrag</label>
          <input name="amount" type="number" step="0.01" className="input" defaultValue={amount.toFixed(2)} />
        </div>
        <div>
          <label className="label">Methode</label>
          <select name="method" className="select" defaultValue="cash">
            <option value="cash">Cash</option>
            <option value="bank_transfer">Banktransfer</option>
            <option value="wallet">Wallet (Mopé)</option>
            <option value="card">Kaart</option>
            <option value="online">Online</option>
          </select>
        </div>
        <div>
          <label className="label">Referentie (optioneel)</label>
          <input name="reference" className="input" placeholder="REF / bank­referentie / bon" />
        </div>
        <div className="flex justify-end pt-1">
          <SubmitButton icon="check">Betaling vastleggen</SubmitButton>
        </div>
      </form>
    </Modal>
  );
}
