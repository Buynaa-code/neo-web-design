"use client";

import { useState } from "react";
import { Bookmark, Heart, Home, MapPin, Star } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useStore } from "@/infrastructure/store";
import { useSavedListMutations } from "@/application/queries/saved";
import type { SavedList } from "@/domain/schemas/api";
import { cn } from "@/lib/utils";

/** Icon keys offered when creating / editing a saved list. */
export const LIST_ICONS: { key: string; Icon: LucideIcon }[] = [
  { key: "heart", Icon: Heart },
  { key: "home", Icon: Home },
  { key: "map-pin", Icon: MapPin },
  { key: "star", Icon: Star },
  { key: "bookmark", Icon: Bookmark },
];

/** Resolve a stored icon key back to a lucide component (defaults to Bookmark). */
export function iconForKey(key: string | null | undefined): LucideIcon {
  return LIST_ICONS.find((i) => i.key === key)?.Icon ?? Bookmark;
}

function IconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (key: string) => void;
}) {
  return (
    <div>
      <div className="text-xs font-medium text-[var(--text-2)] mb-1.5">Дүрс</div>
      <div className="flex gap-2 flex-wrap">
        {LIST_ICONS.map(({ key, Icon }) => {
          const active = value === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              aria-label={key}
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center transition",
                active && "shadow-sm"
              )}
              style={{
                background: active ? "var(--gold-brand)" : "var(--surface-2)",
                color: active ? "#fff" : "var(--text-2)",
                border: "1px solid var(--border)",
              }}
            >
              <Icon className="w-4 h-4" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function CreateListModal() {
  const closeModal = useStore((s) => s.closeModal);
  const pushToast = useStore((s) => s.pushToast);
  const { create } = useSavedListMutations();

  const [name, setName] = useState("");
  const [icon, setIcon] = useState<string>(LIST_ICONS[0].key);

  const save = () => {
    const finalName = name.trim();
    if (!finalName) {
      pushToast("Жагсаалтын нэрээ оруулна уу", "danger");
      return;
    }
    create.mutate({ name: finalName, icon });
    closeModal();
    pushToast("Жагсаалт үүслээ", "success");
  };

  return (
    <div className="-m-6">
      <div className="p-5" style={{ borderBottom: "1px solid var(--border)" }}>
        <h3 className="font-semibold text-lg">Шинэ жагсаалт</h3>
        <p className="text-xs text-[var(--text-3)] mt-0.5">
          Зараа сэдвээр нь цуглуулаарай
        </p>
      </div>
      <div className="p-5 space-y-4">
        <label className="block">
          <div className="text-xs font-medium text-[var(--text-2)] mb-1.5">Нэр</div>
          <input
            className="input"
            placeholder="Жишээ: Дуртай орон сууцууд"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </label>
        <IconPicker value={icon} onChange={setIcon} />
      </div>
      <div
        className="p-5 flex gap-2 justify-end"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <button type="button" onClick={closeModal} className="btn btn-secondary">
          Болих
        </button>
        <button type="button" onClick={save} className="btn btn-primary">
          Хадгалах
        </button>
      </div>
    </div>
  );
}

export function EditListModal({ list }: { list: SavedList }) {
  const closeModal = useStore((s) => s.closeModal);
  const pushToast = useStore((s) => s.pushToast);
  const { update } = useSavedListMutations();

  const [name, setName] = useState(list.name);
  const [icon, setIcon] = useState<string>(list.icon ?? LIST_ICONS[0].key);

  const save = () => {
    const finalName = name.trim() || list.name;
    update.mutate({ id: list.id, input: { name: finalName, icon } });
    closeModal();
    pushToast("Жагсаалт шинэчлэгдлээ", "success");
  };

  return (
    <div className="-m-6">
      <div className="p-5" style={{ borderBottom: "1px solid var(--border)" }}>
        <h3 className="font-semibold text-lg">Жагсаалт засах</h3>
        <p className="text-xs text-[var(--text-3)] mt-0.5">{list.name}</p>
      </div>
      <div className="p-5 space-y-4">
        <label className="block">
          <div className="text-xs font-medium text-[var(--text-2)] mb-1.5">Нэр</div>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </label>
        <IconPicker value={icon} onChange={setIcon} />
      </div>
      <div
        className="p-5 flex gap-2 justify-end"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <button type="button" onClick={closeModal} className="btn btn-secondary">
          Болих
        </button>
        <button type="button" onClick={save} className="btn btn-primary">
          Хадгалах
        </button>
      </div>
    </div>
  );
}

export function DeleteListConfirm({ id, name }: { id: number; name: string }) {
  const closeModal = useStore((s) => s.closeModal);
  const pushToast = useStore((s) => s.pushToast);
  const { remove } = useSavedListMutations();
  return (
    <div className="-m-6">
      <div className="p-5" style={{ borderBottom: "1px solid var(--border)" }}>
        <h3 className="font-semibold text-lg">Жагсаалтыг устгах уу?</h3>
      </div>
      <div className="p-5 text-sm text-[var(--text-2)]">
        «{name}» жагсаалтыг устгана. Доторх зарууд хадгалсан зараас устахгүй.
      </div>
      <div
        className="p-5 flex gap-2 justify-end"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <button type="button" onClick={closeModal} className="btn btn-secondary">
          Болих
        </button>
        <button
          type="button"
          onClick={() => {
            remove.mutate(id);
            closeModal();
            pushToast("Жагсаалт устгагдлаа", "info");
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
