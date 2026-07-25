"use client";
import { Modal } from "@/components/Modal";
import { SubmitButton } from "@/components/FormControls";
import { recordSale } from "./actions";

type ProductOpt = { id: string; name: string; price: number; stock: number };
type MemberOpt = { id: string; first_name: string; last_name: string };

export function QuickSaleModal({ products, members }: { products: ProductOpt[]; members: MemberOpt[] }) {
  return (
    <Modal trigger={{ label: "Nieuwe verkoop", icon: "cart", variant: "primary" }} title="Snelle verkoop">
      <form action={recordSale} className="space-y-3">
        <div>
          <label className="label">Product *</label>
          <select name="product_id" className="select" required defaultValue="">
            <option value="" disabled>Kies een product…</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name} — voorraad {p.stock}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Aantal</label>
            <input name="qty" type="number" min="1" step="1" className="input" defaultValue={1} />
          </div>
          <div>
            <label className="label">Betaalwijze</label>
            <select name="method" className="select" defaultValue="cash">
              <option value="cash">Cash</option>
              <option value="card">Kaart</option>
              <option value="wallet">Wallet (Mopé)</option>
            </select>
          </div>
        </div>
        <div>
          <label className="label">Klant (optioneel)</label>
          <select name="member_id" className="select" defaultValue="">
            <option value="">Losse verkoop</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
            ))}
          </select>
        </div>
        <div className="flex justify-end pt-1">
          <SubmitButton icon="check">Verkoop vastleggen</SubmitButton>
        </div>
      </form>
    </Modal>
  );
}
