"use client";
import { useState, useTransition } from "react";
import { EDITIONS, FEATURES, PACK_META, featuresForEdition, type PackKey } from "@/lib/editions";
import { Card, PackBadge } from "@/components/ui";
import { Icon } from "@/components/icons";
import { applyEdition, toggleFeature } from "./actions";
import { money } from "@/lib/format";

export function EditionManager({ current, enabled }: { current: string; enabled: string[] }) {
  const [pending, start] = useTransition();
  const [on, setOn] = useState<Set<string>>(new Set(enabled));
  const [plan, setPlan] = useState(current);

  function choose(key: string) {
    setPlan(key);
    setOn(new Set(featuresForEdition(key)));
    start(() => applyEdition(key));
  }
  function flip(key: string, val: boolean) {
    const next = new Set(on);
    if (val) next.add(key); else next.delete(key);
    setOn(next);
    start(() => toggleFeature(key, val));
  }

  const packs: PackKey[] = ["starter", "pro", "combat", "performance", "enterprise"];

  return (
    <div className="space-y-6">
      {/* edition presets */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-3">
        {EDITIONS.map((e) => {
          const active = plan === e.key;
          return (
            <button key={e.key} onClick={() => choose(e.key)} disabled={pending}
              className="card p-4 text-left transition-all"
              style={active ? { borderColor: "var(--brand)", boxShadow: "0 0 0 2px var(--ring)" } : {}}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold">{e.name}</span>
                {active && <Icon name="check" size={16} style={{ color: "var(--brand)" }} />}
              </div>
              <p className="text-xs muted mb-2 min-h-[32px]">{e.tagline}</p>
              <p className="text-lg font-extrabold">{money(e.priceMonth, "USD")}<span className="text-xs faint font-normal">/mnd</span></p>
            </button>
          );
        })}
      </div>

      <div className="text-sm muted flex items-center gap-2">
        <Icon name="bolt" size={15} className="tprimary" />
        Kies een editie als preset, of stel per module fijn af. Uitgeschakelde modules verdwijnen uit het menu én worden backend-side geweigerd.
      </div>

      {/* feature toggles grouped by pack */}
      {packs.map((pack) => {
        const items = FEATURES.filter((f) => f.pack === pack);
        const meta = PACK_META[pack];
        return (
          <Card key={pack} padding={false}>
            <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: meta.color }} />
              <h3 className="font-semibold">{meta.label}</h3>
              <PackBadge pack={pack} />
              <span className="ml-auto text-xs faint">{items.filter((i) => on.has(i.key)).length}/{items.length} actief</span>
            </div>
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {items.map((f) => {
                const isOn = on.has(f.key);
                return (
                  <div key={f.key} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{f.label}</p>
                      <p className="text-xs muted truncate">{f.description}</p>
                    </div>
                    <button onClick={() => flip(f.key, !isOn)} disabled={pending}
                      className="relative w-11 h-6 rounded-full transition-colors shrink-0"
                      style={{ background: isOn ? "var(--brand)" : "var(--border-strong)" }}
                      aria-pressed={isOn} aria-label={f.label}>
                      <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform"
                        style={{ transform: isOn ? "translateX(20px)" : "translateX(0)" }} />
                    </button>
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
