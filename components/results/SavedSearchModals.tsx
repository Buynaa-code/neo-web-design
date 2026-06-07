"use client";

import { useState } from "react";
import {
  BellPlus,
  Mail,
  MessageSquare,
  PlusCircle,
  Smartphone,
  Target,
  TrendingDown,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useStore } from "@/lib/store";
import { fmtCompact } from "@/data/formatters";
import { cn } from "@/lib/utils";
import type { SavedSearch } from "@/lib/types";

interface Draft {
  districts: string[];
  rooms: number[];
  priceRange: [number, number];
  name: string;
  mode: SavedSearch["mode"];
}

function buildDraft(): Draft {
  const s = useStore.getState();
  const districts: string[] = s.filterDistrict ? [s.filterDistrict] : ["Хан-Уул", "Сүхбаатар"];
  const rooms: number[] = s.filterRooms && s.filterRooms.length ? s.filterRooms : [2, 3];
  const rent = s.mode === "rent";
  const priceRange: [number, number] = [
    s.filterPriceMin ?? (rent ? 800_000 : 300_000_000),
    s.filterPriceMax ?? (rent ? 2_000_000 : 600_000_000),
  ];
  return {
    districts,
    rooms,
    priceRange,
    name: `${districts.join(", ")} ${rooms.join("-")} өрөө`,
    mode: s.mode,
  };
}

export function SaveSearchModal() {
  const closeModal = useStore((s) => s.closeModal);
  const addSavedSearch = useStore((s) => s.addSavedSearch);
  const pushToast = useStore((s) => s.pushToast);

  const draft = buildDraft();
  const [name, setName] = useState(draft.name);
  const [freq, setFreq] = useState<SavedSearch["alertFreq"]>("instant");
  const [push, setPush] = useState(true);
  const [email, setEmail] = useState(true);
  const [sms, setSms] = useState(false);
  const [onNew, setOnNew] = useState(true);
  const [onDrop, setOnDrop] = useState(true);
  const [onFit, setOnFit] = useState(false);

  const save = () => {
    if (!push && !email && !sms) {
      pushToast("Мэдэгдэл авах дор хаяж нэг сувгийг сонгоно уу", "danger");
      return;
    }
    addSavedSearch({
      mode: draft.mode,
      name: name.trim() || draft.name,
      districts: draft.districts,
      rooms: draft.rooms,
      priceRange: draft.priceRange,
      newMatches: 0,
      alertFreq: freq,
      sms,
      email,
      push,
      lastAlert: "Дөнгөж хадгалсан",
    });
    closeModal();
    pushToast("Хайлт хадгалагдлаа · Шинэ зар орвол мэдэгдэнэ", "success");
    void onNew;
    void onDrop;
    void onFit;
  };

  return (
    <div className="-m-6">
      <div className="p-5" style={{ borderBottom: "1px solid var(--border)" }}>
        <h3 className="font-semibold text-lg">Хайлтаа хадгалах</h3>
        <p className="text-xs text-[var(--text-3)] mt-0.5">
          Шинэ зар орох тутамд мэдэгдэл авна
        </p>
      </div>
      <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
        <label className="block">
          <div className="text-xs font-medium text-[var(--text-2)] mb-1.5">Нэр</div>
          <input
            className="input"
            placeholder="Жишээ: Эхний орон сууц"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <div className="card p-4" style={{ background: "var(--surface-2)" }}>
          <div className="text-xs font-semibold mb-2">Хайлтын нөхцөл</div>
          <div className="space-y-1 text-sm text-[var(--text-2)]">
            <Row k="Горим" v={draft.mode === "rent" ? "Түрээс" : "Худалдах"} />
            <Row k="Дүүрэг" v={draft.districts.join(", ")} />
            <Row k="Өрөө" v={`${draft.rooms.join("-")} өрөө`} />
            <Row
              k="Үнэ"
              v={`${fmtCompact(draft.priceRange[0])} – ${fmtCompact(draft.priceRange[1])}`}
            />
          </div>
        </div>

        <div>
          <div className="eyebrow mb-2">Мэдэгдлийн давтамж</div>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ["instant", "Тэр даруй"],
                ["daily", "Өдөрт нэг"],
                ["weekly", "7 хоногт нэг"],
              ] as const
            ).map(([k, l]) => (
              <button
                key={k}
                type="button"
                onClick={() => setFreq(k as SavedSearch["alertFreq"])}
                className={cn("src-chip !text-xs", freq === k && "selected")}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="eyebrow mb-2">Хэрхэн авах вэ?</div>
          <div className="grid sm:grid-cols-3 gap-2 text-sm">
            <Channel icon={Smartphone} label="App push" checked={push} onChange={setPush} />
            <Channel icon={Mail} label="И-мэйл" checked={email} onChange={setEmail} />
            <Channel icon={MessageSquare} label="SMS" checked={sms} onChange={setSms} />
          </div>
        </div>

        <div>
          <div className="eyebrow mb-2">Ямар үед мэдэгдэх вэ?</div>
          <div className="space-y-1.5">
            <Trigger
              icon={PlusCircle}
              label="Шинэ зар нэмэгдэхэд"
              checked={onNew}
              onChange={setOnNew}
            />
            <Trigger
              icon={TrendingDown}
              label="Үнэ буурахад"
              checked={onDrop}
              onChange={setOnDrop}
            />
            <Trigger
              icon={Target}
              label="Үнийн хязгаарт ороход"
              checked={onFit}
              onChange={setOnFit}
            />
          </div>
        </div>
      </div>
      <div
        className="p-4 flex gap-2 justify-end"
        style={{ borderTop: "1px solid var(--border)", background: "var(--surface-2)" }}
      >
        <button type="button" onClick={closeModal} className="btn btn-secondary">
          Цуцлах
        </button>
        <button type="button" onClick={save} className="btn btn-primary">
          <BellPlus className="w-4 h-4" /> Хадгалах
        </button>
      </div>
    </div>
  );
}

export function EditSearchModal({ search }: { search: SavedSearch }) {
  const closeModal = useStore((s) => s.closeModal);
  const updateSavedSearch = useStore((s) => s.updateSavedSearch);
  const pushToast = useStore((s) => s.pushToast);

  const [name, setName] = useState(search.name);
  const [minP, setMinP] = useState(String(search.priceRange[0]));
  const [maxP, setMaxP] = useState(String(search.priceRange[1]));

  const save = () => {
    const lo = parseFloat(minP);
    const hi = parseFloat(maxP);
    updateSavedSearch(search.id, {
      name: name.trim() || search.name,
      priceRange: [
        Number.isFinite(lo) && lo >= 0 ? lo : search.priceRange[0],
        Number.isFinite(hi) && hi >= 0 ? hi : search.priceRange[1],
      ],
    });
    closeModal();
    pushToast("Хайлт шинэчлэгдлээ", "success");
  };

  return (
    <div className="-m-6">
      <div className="p-5" style={{ borderBottom: "1px solid var(--border)" }}>
        <h3 className="font-semibold text-lg">Хайлт засах</h3>
        <p className="text-xs text-[var(--text-3)] mt-0.5">{search.name}</p>
      </div>
      <div className="p-5 space-y-3">
        <label className="block">
          <div className="text-xs font-medium text-[var(--text-2)] mb-1.5">Нэр</div>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <div className="text-xs font-medium text-[var(--text-2)] mb-1.5">Доод үнэ</div>
            <input
              type="number"
              className="input num"
              value={minP}
              onChange={(e) => setMinP(e.target.value)}
            />
          </label>
          <label className="block">
            <div className="text-xs font-medium text-[var(--text-2)] mb-1.5">Дээд үнэ</div>
            <input
              type="number"
              className="input num"
              value={maxP}
              onChange={(e) => setMaxP(e.target.value)}
            />
          </label>
        </div>
      </div>
      <div
        className="p-4 flex gap-2 justify-end"
        style={{ borderTop: "1px solid var(--border)", background: "var(--surface-2)" }}
      >
        <button type="button" onClick={closeModal} className="btn btn-secondary">
          Цуцлах
        </button>
        <button type="button" onClick={save} className="btn btn-primary">
          Хадгалах
        </button>
      </div>
    </div>
  );
}

export function DeleteSearchConfirm({ id }: { id: number }) {
  const closeModal = useStore((s) => s.closeModal);
  const removeSavedSearch = useStore((s) => s.removeSavedSearch);
  const pushToast = useStore((s) => s.pushToast);
  return (
    <div className="-m-6">
      <div className="p-5" style={{ borderBottom: "1px solid var(--border)" }}>
        <h3 className="font-semibold text-lg">Хайлтыг устгах уу?</h3>
      </div>
      <div className="p-5 text-sm text-[var(--text-2)]">
        Энэ хайлтыг устгасны дараа мэдэгдэл ирэхгүй болно.
      </div>
      <div
        className="p-4 flex gap-2 justify-end"
        style={{ borderTop: "1px solid var(--border)", background: "var(--surface-2)" }}
      >
        <button type="button" onClick={closeModal} className="btn btn-secondary">
          Болих
        </button>
        <button
          type="button"
          onClick={() => {
            removeSavedSearch(id);
            closeModal();
            pushToast("Хайлт устгагдлаа", "info");
          }}
          className="btn"
          style={{ background: "var(--danger)", color: "#fff" }}
        >
          Устгах
        </button>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span>{k}</span>
      <span className="font-medium text-right">{v}</span>
    </div>
  );
}

function Channel({
  icon: Icon,
  label,
  checked,
  onChange,
}: {
  icon: LucideIcon;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      className="flex items-center gap-2 p-2.5 rounded-lg cursor-pointer"
      style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
    >
      <Icon className="w-4 h-4" style={{ color: "var(--gold-brand)" }} />
      <span className="text-xs font-medium flex-1">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-[var(--gold-brand)]"
      />
    </label>
  );
}

function Trigger({
  icon: Icon,
  label,
  checked,
  onChange,
}: {
  icon: LucideIcon;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[var(--surface-2)] cursor-pointer">
      <Icon className="w-4 h-4 shrink-0" style={{ color: "var(--gold-brand)" }} />
      <span className="text-sm flex-1">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-[var(--gold-brand)]"
      />
    </label>
  );
}
