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
  Trash2,
  User as UserIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useStore } from "@/infrastructure/store";
import { useAppointments } from "@/application/queries/appointments";
import {
  useCurrentUser,
  useLogout,
  useUpdatePassword,
  useUpdateProfile,
} from "@/application/queries/auth";
import { useDeleteListing, useMyListings } from "@/application/queries/listings";
import { ApiError } from "@/infrastructure/api/http";
import { ListingCard } from "./ListingCard";

type MenuKey =
  | "profile"
  | "my-listings"
  | "activity"
  | "saved"
  | "alerts"
  | "list-property"
  | "rental-mgmt"
  | "news"
  | "help";

const MENU: { key: MenuKey; icon: LucideIcon; label: string; href?: string; toast?: string }[] = [
  { key: "profile", icon: UserIcon, label: "Хувийн мэдээлэл" },
  { key: "my-listings", icon: Megaphone, label: "Миний зар" },
  { key: "activity", icon: CalendarCheck, label: "Үзэлтүүд", href: "/activity" },
  { key: "saved", icon: Heart, label: "Хадгалсан зарууд", href: "/saved" },
  { key: "alerts", icon: Bell, label: "Мэдэгдэл", href: "/alerts" },
  { key: "list-property", icon: Megaphone, label: "Зар нэмэх", href: "/list-property" },
  { key: "rental-mgmt", icon: LayoutDashboard, label: "Менежмент", href: "/rental-mgmt" },
  { key: "news", icon: Newspaper, label: "Мэдээ, зөвлөгөө", href: "/news" },
  { key: "help", icon: HelpCircle, label: "Тусламж", toast: "Тусламжийн төв удахгүй" },
];

function initialsOf(name: string): string {
  return (
    name
      .split(/\s+/)
      .map((s) => s[0])
      .filter(Boolean)
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}

export function ProfileScreen() {
  const router = useRouter();
  const storeUser = useStore((s) => s.currentUser);
  const isLoggedIn = useStore((s) => s.isLoggedIn);
  const signOut = useStore((s) => s.signOut);
  const savedCount = useStore((s) => s.savedListingIds.length);
  const openModal = useStore((s) => s.openModal);
  const closeModal = useStore((s) => s.closeModal);
  const pushToast = useStore((s) => s.pushToast);

  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const logout = useLogout();

  const [tab, setTab] = useState<"profile" | "my-listings">("profile");

  // Prefer the live customer; fall back to the locally stored user while it loads.
  const name = currentUser?.name ?? storeUser?.name ?? "Зочин";
  const email = currentUser?.email ?? (storeUser as { email?: string } | null)?.email ?? "";
  const phone = currentUser?.phone ?? storeUser?.phone ?? "";
  const initials = initialsOf(name);
  // Real appointments (not the mock VIEWINGS) so the count matches /activity.
  const { data: appointments } = useAppointments();
  const viewingsCount = appointments?.length ?? 0;

  const openEdit = () => {
    if (!isLoggedIn) {
      router.push("/auth");
      return;
    }
    openModal(
      <ProfileEditForm
        initialName={name}
        initialEmail={email}
        initialPhone={phone}
      />,
      "md"
    );
  };

  const openPassword = () => {
    if (!isLoggedIn) {
      router.push("/auth");
      return;
    }
    openModal(<PasswordChangeForm />, "md");
  };

  const confirmSignOut = () => {
    openModal(
      <SignOutConfirm
        loading={logout.isPending}
        onConfirm={async () => {
          try {
            await logout.mutateAsync(undefined);
          } catch {
            // Ignore network errors — we still clear local auth below.
          }
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
    { icon: Lock, title: "Нууц үг", sub: "Шинэчлэх", action: openPassword },
    { icon: Megaphone, title: "Миний зар", sub: "Зарын жагсаалт", action: () => setTab("my-listings") },
    { icon: Phone, title: "Гар утас", sub: phone || "Баталгаажуулаагүй", action: openEdit },
    { icon: Mail, title: "Цахим хаяг", sub: email || "Баталгаажуулаагүй", action: openEdit },
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
                active={
                  (m.key === "profile" && tab === "profile") ||
                  (m.key === "my-listings" && tab === "my-listings")
                }
                onClick={() => {
                  if (m.key === "profile") setTab("profile");
                  else if (m.key === "my-listings") setTab("my-listings");
                  else if (m.toast) pushToast(m.toast, "info");
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
              {initials}
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
            {userLoading && !storeUser ? "Уншиж байна…" : name}
          </div>
          <div className="text-xs text-[var(--text-3)] mt-1 truncate max-w-full">
            {email || phone || "Холбоо барих мэдээлэл алга"}
          </div>

          {!isLoggedIn && (
            <Link href="/auth" className="btn btn-cta mt-4">
              Нэвтрэх
            </Link>
          )}
        </div>

        <div className="lg:col-span-2">
          {tab === "profile" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          ) : (
            <MyListings isLoggedIn={isLoggedIn} />
          )}
        </div>
      </div>
    </div>
  );
}

function MyListings({ isLoggedIn }: { isLoggedIn: boolean }) {
  const { data, isLoading } = useMyListings();
  const deleteListing = useDeleteListing();
  const openModal = useStore((s) => s.openModal);
  const closeModal = useStore((s) => s.closeModal);
  const pushToast = useStore((s) => s.pushToast);

  const listings = data?.listings ?? [];

  const onDelete = (id: number, title: string) => {
    openModal(
      <ConfirmDelete
        title={title}
        loading={deleteListing.isPending}
        onConfirm={async () => {
          try {
            await deleteListing.mutateAsync(id);
            pushToast("Зар устгагдлаа", "success");
            closeModal();
          } catch (err) {
            const msg =
              err instanceof ApiError ? err.message : "Устгахад алдаа гарлаа";
            pushToast(msg, "danger");
          }
        }}
      />,
      "sm"
    );
  };

  if (!isLoggedIn) {
    return (
      <div className="card p-8 text-center">
        <p className="text-sm text-[var(--text-3)] mb-4">
          Зараа харахын тулд нэвтэрнэ үү.
        </p>
        <Link href="/auth" className="btn btn-cta">
          Нэвтрэх
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="card p-8 text-center text-sm text-[var(--text-3)]">
        Уншиж байна…
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="text-sm text-[var(--text-3)] mb-4">Та одоогоор зар оруулаагүй байна.</p>
        <Link href="/list-property" className="btn btn-cta">
          Зар нэмэх
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {listings.map((listing) => (
        <div key={listing.id} className="relative">
          <ListingCard listing={listing} />
          <button
            type="button"
            onClick={() =>
              onDelete(listing.id, listing.khotkhon || listing.district || "Зар")
            }
            className="absolute top-2 left-2 z-10 w-8 h-8 rounded-full flex items-center justify-center"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border-strong)",
              color: "var(--danger)",
            }}
            aria-label="Устгах"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
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

function fieldErrors(err: unknown): Record<string, string[]> | null {
  return err instanceof ApiError ? err.validationErrors : null;
}

function ProfileEditForm({
  initialName,
  initialEmail,
  initialPhone,
}: {
  initialName: string;
  initialEmail: string;
  initialPhone: string;
}) {
  const closeModal = useStore((s) => s.closeModal);
  const pushToast = useStore((s) => s.pushToast);
  const updateProfile = useUpdateProfile();

  const [name, setName] = useState(initialName === "Зочин" ? "" : initialName);
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState(initialPhone);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const save = async () => {
    setErrors({});
    try {
      await updateProfile.mutateAsync({
        name: name.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() ? phone.trim() : null,
      });
      pushToast("Мэдээлэл хадгалагдлаа", "success");
      closeModal();
    } catch (err) {
      const v = fieldErrors(err);
      if (v) setErrors(v);
      else
        pushToast(
          err instanceof ApiError ? err.message : "Хадгалахад алдаа гарлаа",
          "danger"
        );
    }
  };

  return (
    <div className="-m-6">
      <div className="p-5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
        <h3 className="font-semibold text-lg">Хувийн мэдээлэл засах</h3>
      </div>
      <div className="p-5 space-y-3">
        <Field label="Нэр" error={errors.name?.[0]}>
          <input
            className="input"
            placeholder="Таны нэр"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field label="Цахим хаяг" error={errors.email?.[0]}>
          <input
            className="input"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Гар утас" error={errors.phone?.[0]}>
          <input
            className="input"
            placeholder="+976 ..."
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </Field>
      </div>
      <div className="p-4 flex gap-2 justify-end" style={{ borderTop: "1px solid var(--border)" }}>
        <button type="button" onClick={closeModal} className="btn btn-secondary">
          Болих
        </button>
        <button
          type="button"
          onClick={save}
          disabled={updateProfile.isPending}
          className="btn btn-primary"
        >
          {updateProfile.isPending ? "Хадгалж байна…" : "Хадгалах"}
        </button>
      </div>
    </div>
  );
}

function PasswordChangeForm() {
  const closeModal = useStore((s) => s.closeModal);
  const pushToast = useStore((s) => s.pushToast);
  const updatePassword = useUpdatePassword();

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [mismatch, setMismatch] = useState(false);

  const save = async () => {
    setErrors({});
    setMismatch(false);
    if (next !== confirm) {
      setMismatch(true);
      return;
    }
    try {
      await updatePassword.mutateAsync({
        current_password: current,
        password: next,
        password_confirmation: confirm,
      });
      pushToast("Нууц үг шинэчлэгдлээ", "success");
      closeModal();
    } catch (err) {
      const v = fieldErrors(err);
      if (v) setErrors(v);
      else
        pushToast(
          err instanceof ApiError ? err.message : "Шинэчлэхэд алдаа гарлаа",
          "danger"
        );
    }
  };

  return (
    <div className="-m-6">
      <div className="p-5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
        <h3 className="font-semibold text-lg">Нууц үг солих</h3>
      </div>
      <div className="p-5 space-y-3">
        <Field label="Одоогийн нууц үг" error={errors.current_password?.[0]}>
          <input
            type="password"
            className="input"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </Field>
        <Field label="Шинэ нууц үг" error={errors.password?.[0]}>
          <input
            type="password"
            className="input"
            placeholder="Дор хаяж 8 тэмдэгт"
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
        </Field>
        <Field
          label="Шинэ нууц үг давтах"
          error={mismatch ? "Нууц үг таарахгүй байна" : errors.password_confirmation?.[0]}
        >
          <input
            type="password"
            className="input"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </Field>
      </div>
      <div className="p-4 flex gap-2 justify-end" style={{ borderTop: "1px solid var(--border)" }}>
        <button type="button" onClick={closeModal} className="btn btn-secondary">
          Болих
        </button>
        <button
          type="button"
          onClick={save}
          disabled={updatePassword.isPending}
          className="btn btn-primary"
        >
          {updatePassword.isPending ? "Шинэчилж байна…" : "Шинэчлэх"}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="text-xs font-semibold text-[var(--text-2)] mb-1">{label}</div>
      {children}
      {error && (
        <div className="text-xs mt-1" style={{ color: "var(--danger)" }}>
          {error}
        </div>
      )}
    </label>
  );
}

function ConfirmDelete({
  title,
  loading,
  onConfirm,
}: {
  title: string;
  loading: boolean;
  onConfirm: () => void;
}) {
  const closeModal = useStore((s) => s.closeModal);
  return (
    <div className="-m-6">
      <div className="p-5">
        <h3 className="font-semibold text-lg mb-1">Зар устгах уу?</h3>
        <p className="text-sm text-[var(--text-3)]">
          &ldquo;{title}&rdquo; зарыг устгахдаа итгэлтэй байна уу? Энэ үйлдлийг буцаах боломжгүй.
        </p>
      </div>
      <div className="p-4 flex gap-2 justify-end" style={{ borderTop: "1px solid var(--border)" }}>
        <button type="button" onClick={closeModal} className="btn btn-secondary">
          Болих
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="btn btn-primary"
          style={{ background: "var(--danger)" }}
        >
          {loading ? "Устгаж байна…" : "Устгах"}
        </button>
      </div>
    </div>
  );
}

function SignOutConfirm({
  loading,
  onConfirm,
}: {
  loading: boolean;
  onConfirm: () => void;
}) {
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
          disabled={loading}
          className="btn btn-primary"
          style={{ background: "var(--danger)" }}
        >
          {loading ? "Гарч байна…" : "Гарах"}
        </button>
      </div>
    </div>
  );
}
