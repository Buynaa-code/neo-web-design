"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  CalendarCheck,
  Heart,
  HelpCircle,
  LayoutDashboard,
  Lock,
  LogOut,
  Mail,
  Megaphone,
  Newspaper,
  Pencil,
  Phone,
  User as UserIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useStore, type User } from "@/infrastructure/store";
import { VIEWINGS } from "@/infrastructure/data/saved";

type MenuKey =
  | "profile"
  | "activity"
  | "saved"
  | "alerts"
  | "list-property"
  | "rental-mgmt"
  | "news"
  | "help";

const MENU: { key: MenuKey; icon: LucideIcon; label: string; href?: string; toast?: string }[] = [
  { key: "profile", icon: UserIcon, label: "Хувийн мэдээлэл" },
  { key: "activity", icon: CalendarCheck, label: "Үзэлтүүд", href: "/activity" },
  { key: "saved", icon: Heart, label: "Хадгалсан зарууд", href: "/saved" },
  { key: "alerts", icon: Bell, label: "Мэдэгдэл", href: "/alerts" },
  { key: "list-property", icon: Megaphone, label: "Миний зар", href: "/list-property" },
  { key: "rental-mgmt", icon: LayoutDashboard, label: "Менежмент", href: "/rental-mgmt" },
  { key: "news", icon: Newspaper, label: "Мэдээ, зөвлөгөө", href: "/news" },
  { key: "help", icon: HelpCircle, label: "Тусламж", toast: "Тусламжийн төв удахгүй" },
];

export function ProfileScreen() {
  const router = useRouter();
  const user = useStore((s) => s.currentUser);
  const isLoggedIn = useStore((s) => s.isLoggedIn);
  const signOut = useStore((s) => s.signOut);
  const signIn = useStore((s) => s.signIn);
  const savedCount = useStore((s) => s.savedListingIds.length);
  const openModal = useStore((s) => s.openModal);
  const closeModal = useStore((s) => s.closeModal);
  const pushToast = useStore((s) => s.pushToast);

  const u: User =
    user ?? { name: "Зочин", phone: "", initials: "?" };
  const email = (u as User & { email?: string }).email ?? "";
  const viewingsCount = VIEWINGS.length;

  const openEdit = () => {
    openModal(
      <ProfileEditForm
        user={u}
        email={email}
        onSave={(next) => {
          signIn(next);
          pushToast("Мэдээлэл хадгалагдлаа", "success");
          closeModal();
        }}
      />,
      "md"
    );
  };

  const confirmSignOut = () => {
    openModal(
      <SignOutConfirm
        onConfirm={() => {
          signOut();
          closeModal();
          pushToast("Системээс гарлаа", "info");
          router.push("/");
        }}
      />,
      "sm"
    );
  };

  const cards: { icon: LucideIcon; title: string; sub: string; action: () => void }[] = [
    { icon: UserIcon, title: "Хувийн мэдээлэл", sub: "Мэдээлэл засах", action: openEdit },
    { icon: Lock, title: "Нууц үг", sub: "Шинэчлэх", action: () => pushToast("Нууц үг шинэчлэх удахгүй", "info") },
    { icon: Phone, title: "Гар утас", sub: u.phone || "Баталгаажуулаагүй", action: () => pushToast("Утас баталгаажуулах удахгүй", "info") },
    { icon: Mail, title: "Цахим хаяг", sub: email || "Баталгаажуулаагүй", action: () => pushToast("И-мэйл баталгаажуулах удахгүй", "info") },
    { icon: Heart, title: "Хадгалсан", sub: `${savedCount} зар`, action: () => router.push("/saved") },
    { icon: CalendarCheck, title: "Үзэлтүүд", sub: `${viewingsCount} уулзалт`, action: () => router.push("/activity") },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-6 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <aside className="card p-3 lg:row-span-2 flex flex-col">
          <div className="flex flex-col gap-1">
            {MENU.map((m) => (
              <SidebarBtn
                key={m.key}
                icon={<m.icon className="w-[18px] h-[18px]" />}
                active={m.key === "profile"}
                onClick={() => {
                  if (m.toast) pushToast(m.toast, "info");
                  else if (m.href) router.push(m.href);
                }}
              >
                {m.label}
              </SidebarBtn>
            ))}
          </div>
          {isLoggedIn && (
            <div className="mt-auto pt-3" style={{ borderTop: "1px solid var(--border)" }}>
              <button
                type="button"
                onClick={confirmSignOut}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition hover:bg-[var(--surface-2)]"
                style={{ color: "var(--danger)" }}
              >
                <LogOut className="w-[18px] h-[18px]" />
                <span>Системээс гарах</span>
              </button>
            </div>
          )}
        </aside>

        <div className="card p-6 flex flex-col items-center justify-center text-center">
          <div className="relative mb-4">
            <div
              className="w-24 h-24 rounded-full text-white font-semibold flex items-center justify-center text-2xl"
              style={{
                background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)",
                boxShadow: "0 8px 24px rgba(18,60,105,.18)",
              }}
            >
              {u.initials || "?"}
            </div>
            <button
              type="button"
              onClick={openEdit}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border-strong)",
                color: "var(--text-2)",
              }}
              aria-label="Засах"
            >
              <Pencil className="w-4 h-4" />
            </button>
          </div>
          <div className="font-semibold text-base text-[var(--text)] truncate max-w-full">
            {u.name || "Зочин"}
          </div>
          <div className="text-xs text-[var(--text-3)] mt-1 truncate max-w-full">
            {email || u.phone || "Холбоо барих мэдээлэл алга"}
          </div>

          {!isLoggedIn && (
            <Link href="/auth" className="btn btn-cta mt-4">
              Нэвтрэх
            </Link>
          )}
        </div>

        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {cards.map((c) => (
            <button
              key={c.title}
              type="button"
              onClick={c.action}
              className="card p-5 text-left hover:border-[var(--primary)] hover:shadow-md transition group"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
              >
                <c.icon className="w-5 h-5" />
              </div>
              <div className="font-semibold text-sm text-[var(--text)]">{c.title}</div>
              <div className="text-xs text-[var(--text-3)] mt-0.5 truncate">{c.sub}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SidebarBtn({
  active,
  onClick,
  icon,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold"
          : "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--text-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] transition"
      }
      style={
        active
          ? { background: "var(--primary-soft)", color: "var(--primary)" }
          : undefined
      }
    >
      {icon}
      <span className="truncate">{children}</span>
    </button>
  );
}

function ProfileEditForm({
  user,
  email,
  onSave,
}: {
  user: User;
  email: string;
  onSave: (next: User) => void;
}) {
  const closeModal = useStore((s) => s.closeModal);
  const [name, setName] = useState(user.name);
  const [emailDraft, setEmailDraft] = useState(email);
  const [phone, setPhone] = useState(user.phone);

  const save = () => {
    const trimmedName = name.trim() || user.name || "Зочин";
    const initials =
      trimmedName
        .split(/\s+/)
        .map((s) => s[0])
        .filter(Boolean)
        .join("")
        .slice(0, 2)
        .toUpperCase() || "?";
    const next: User = {
      ...user,
      name: trimmedName,
      phone: phone.trim() || user.phone,
      initials,
    };
    (next as User & { email?: string }).email = emailDraft.trim();
    onSave(next);
  };

  return (
    <div className="-m-6">
      <div className="p-5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
        <h3 className="font-semibold text-lg">Хувийн мэдээлэл засах</h3>
      </div>
      <div className="p-5 space-y-3">
        <label className="block">
          <div className="text-xs font-semibold text-[var(--text-2)] mb-1">Нэр</div>
          <input
            className="input"
            placeholder="Таны нэр"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="block">
          <div className="text-xs font-semibold text-[var(--text-2)] mb-1">Цахим хаяг</div>
          <input
            className="input"
            placeholder="name@example.com"
            value={emailDraft}
            onChange={(e) => setEmailDraft(e.target.value)}
          />
        </label>
        <label className="block">
          <div className="text-xs font-semibold text-[var(--text-2)] mb-1">Гар утас</div>
          <input
            className="input"
            placeholder="+976 ..."
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </label>
      </div>
      <div className="p-4 flex gap-2 justify-end" style={{ borderTop: "1px solid var(--border)" }}>
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

function SignOutConfirm({ onConfirm }: { onConfirm: () => void }) {
  const closeModal = useStore((s) => s.closeModal);
  return (
    <div className="-m-6">
      <div className="p-5">
        <h3 className="font-semibold text-lg mb-1">Системээс гарах уу?</h3>
        <p className="text-sm text-[var(--text-3)]">
          Та системээс гарсны дараа дахин нэвтрэх шаардлагатай.
        </p>
      </div>
      <div className="p-4 flex gap-2 justify-end" style={{ borderTop: "1px solid var(--border)" }}>
        <button type="button" onClick={closeModal} className="btn btn-secondary">
          Болих
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="btn btn-primary"
          style={{ background: "var(--danger)" }}
        >
          Гарах
        </button>
      </div>
    </div>
  );
}
