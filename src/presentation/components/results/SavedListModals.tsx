"use client";

import { useState } from "react";
import { Bookmark, Check, Heart, Home, MapPin, Plus, Star } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useStore } from "@/infrastructure/store";
import { useSavedListMutations, useSavedLists } from "@/application/queries/saved";
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

/**
 * Add/remove a single listing to/from the user's saved lists. Each list is a
 * toggle row (checked = the listing is already in it); a new list can be created
 * inline and the listing is added to it immediately.
 */
export function AddToListModal({ listingId }: { listingId: number }) {
  const closeModal = useStore((s) => s.closeModal);
  const pushToast = useStore((s) => s.pushToast);
  const { data: lists = [], isLoading } = useSavedLists();
  const { addItem, removeItem, create } = useSavedListMutations();
  const [busyId, setBusyId] = useState<number | null>(null);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const toggle = async (list: SavedList) => {
    const included = (list.listingIds ?? []).includes(listingId);
    setBusyId(list.id);
    try {
      if (included) {
        await removeItem.mutateAsync({ listId: list.id, listingId });
        pushToast(`«${list.name}»-ээс хаслаа`, "info");
      } else {
        await addItem.mutateAsync({ listId: list.id, listingId });
        pushToast(`«${list.name}»-д нэмлээ`, "success");
      }
    } catch {
      pushToast("Алдаа гарлаа — дахин оролдоно уу", "danger");
    } finally {
      setBusyId(null);
    }
  };

  const createAndAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    try {
      const list = await create.mutateAsync({ name, icon: LIST_ICONS[0].key });
      await addItem.mutateAsync({ listId: list.id, listingId });
      setNewName("");
      pushToast(`«${name}» үүсгэж, зар нэмлээ`, "success");
    } catch {
      pushToast("Жагсаалт үүсгэхэд алдаа гарлаа", "danger");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="-m-6">
      <div className="p-5" style={{ borderBottom: "1px solid var(--border)" }}>
        <h3 className="font-semibold text-lg">Жагсаалтад нэмэх</h3>
        <p className="text-xs text-[var(--text-3)] mt-0.5">
          Энэ зарыг цуглуулгадаа хадгална
        </p>
      </div>
      <div className="p-4 space-y-1.5 max-h-[46vh] overflow-y-auto">
        {isLoading && lists.length === 0 ? (
          <div className="p-6 text-center text-sm text-[var(--text-3)]">Ачааллаж байна…</div>
        ) : lists.length === 0 ? (
          <div className="px-2 py-3 text-sm text-[var(--text-3)]">
            Жагсаалт алга. Доор шинээр үүсгэнэ үү.
          </div>
        ) : (
          lists.map((list) => {
            const included = (list.listingIds ?? []).includes(listingId);
            const Icon = iconForKey(list.icon);
            const busy = busyId === list.id;
            return (
              <button
                key={list.id}
                type="button"
                disabled={busy}
                onClick={() => toggle(list)}
                className="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left hover:bg-[var(--surface-2)] transition disabled:opacity-60"
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "var(--surface-2)", color: "var(--gold-brand)" }}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{list.name}</div>
                  <div className="text-[11px] text-[var(--text-3)]">{list.listingsCount} зар</div>
                </div>
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                  style={{
                    background: included ? "var(--gold-brand)" : "transparent",
                    border: included ? "none" : "1.5px solid var(--border)",
                    color: "#fff",
                  }}
                >
                  {busy ? (
                    <span className="text-[10px] text-[var(--text-3)]">…</span>
                  ) : included ? (
                    <Check className="w-4 h-4" />
                  ) : null}
                </div>
              </button>
            );
          })
        )}
      </div>
      <div className="p-4 flex gap-2" style={{ borderTop: "1px solid var(--border)" }}>
        <input
          className="input flex-1"
          placeholder="Шинэ жагсаалтын нэр"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void createAndAdd();
            }
          }}
        />
        <button
          type="button"
          onClick={createAndAdd}
          disabled={!newName.trim() || creating}
          className="btn btn-secondary shrink-0"
        >
          <Plus className="w-4 h-4" />
          {creating ? "…" : "Үүсгэх"}
        </button>
      </div>
      <div className="px-4 pb-4 flex justify-end">
        <button type="button" onClick={closeModal} className="btn btn-primary">
          Болсон
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
