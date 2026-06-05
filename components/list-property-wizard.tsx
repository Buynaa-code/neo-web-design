"use client";

import Image from "next/image";
import { type ReactNode, useMemo, useState } from "react";
import {
  BadgeCheck,
  Banknote,
  Building2,
  Camera,
  Car,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Factory,
  Home,
  ImageUp,
  KeyRound,
  Layers3,
  Map,
  MapPin,
  Megaphone,
  PackageCheck,
  ParkingCircle,
  Plus,
  Rocket,
  Save,
  SearchCheck,
  Send,
  ShieldCheck,
  Sparkles,
  Store,
  Target,
  Trash2,
  Trees,
  Upload,
  Warehouse,
  X,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type GoalKey = "sell" | "rent";
type PropertyKey =
  | "apartment"
  | "house"
  | "office"
  | "retail"
  | "industrial"
  | "parking"
  | "warehouse"
  | "fence_house"
  | "summer_land"
  | "land";

type Draft = {
  goal: GoalKey;
  propertyType: PropertyKey;
  subtype: string;
  district: string;
  khoroo: string;
  khotkhon: string;
  street: string;
  buildingNumber: string;
  floorAbove: string;
  selectedFloor: string;
  unit: string;
  area: string;
  rooms: string;
  bedrooms: string;
  bathrooms: string;
  condition: string;
  commissionYear: string;
  monthlyPrice: string;
  totalPrice: string;
  deposit: string;
  rentFrequency: string;
  desc: string;
  amenities: string[];
  included: string[];
  services: string[];
  photos: { id: number; category: string }[];
  relation: string;
  truth: boolean;
  authority: boolean;
  terms: boolean;
};

const districts = [
  "Сүхбаатар",
  "Хан-Уул",
  "Баянзүрх",
  "Баянгол",
  "Чингэлтэй",
  "Сонгинохайрхан",
  "Налайх",
];

const groups: Array<{
  step: number;
  icon: LucideIcon;
  title: string;
  sub: string;
  covers: string[];
}> = [
  {
    step: 1,
    icon: Target,
    title: "Зорилго ба зориулалт",
    sub: "АЛХАМ 01-03",
    covers: ["Зорилго", "ҮХЭХ зориулалт", "Дэд зориулалт"],
  },
  {
    step: 2,
    icon: MapPin,
    title: "Хаяг, байршил ба үзүүлэлт",
    sub: "АЛХАМ 04-05",
    covers: ["Гараар оруулах", "Газрын зураг", "Үзүүлэлт"],
  },
  {
    step: 3,
    icon: Sparkles,
    title: "Дэд бүтэц ба дагалдах зүйлс",
    sub: "АЛХАМ 06-08",
    covers: ["Дэд бүтэц", "Дундын хэрэглээ", "Үнэд багтсан"],
  },
  {
    step: 4,
    icon: Banknote,
    title: "Төлөв, үнэ ба медиа",
    sub: "АЛХАМ 09-11",
    covers: ["ҮХЭХ төлөв", "Үнэ", "Зураг, бичлэг"],
  },
  {
    step: 5,
    icon: ShieldCheck,
    title: "Шалгах, баталгаажуулах",
    sub: "АЛХАМ 12-13",
    covers: ["Баталгаажуулах", "Verified", "Brokerage"],
  },
];

const goals = [
  {
    key: "sell" as const,
    label: "ХУДАЛДУУЛЪЯ",
    hint: "Бүх төрлийн үл хөдлөх эд хөрөнгөө худалдах",
    icon: Banknote,
  },
  {
    key: "rent" as const,
    label: "ТҮРЭЭСЛҮҮЛЬЕ / ХӨЛСЛҮҮЛЬЕ",
    hint: "Орон сууцны болон арилжааны зориулалттай хөрөнгө түрээслүүлэх",
    icon: KeyRound,
  },
];

const propertyTypes: Array<{
  key: PropertyKey;
  label: string;
  hint: string;
  icon: LucideIcon;
  residential?: boolean;
}> = [
  {
    key: "apartment",
    label: "Орон сууц",
    hint: "Олон давхар барилгын тусдаа бүртгэлтэй нэгж",
    icon: Building2,
    residential: true,
  },
  {
    key: "house",
    label: "Амины орон сууц",
    hint: "Тусдаа орцтой сууц",
    icon: Home,
    residential: true,
  },
  {
    key: "office",
    label: "Оффис",
    hint: "Байгууллага, бизнесийн ажлын байр",
    icon: Store,
  },
  {
    key: "retail",
    label: "Худалдаа, үйлчилгээ",
    hint: "Дэлгүүр, салон, ресторан, кафе",
    icon: Megaphone,
  },
  {
    key: "industrial",
    label: "Аж үйлдвэрийн обьект",
    hint: "Үйлдвэрлэл, боловсруулах зориулалттай",
    icon: Factory,
  },
  {
    key: "parking",
    label: "Авто дулаан зогсоол",
    hint: "Барилгын доторх дулаан зогсоол",
    icon: ParkingCircle,
  },
  {
    key: "warehouse",
    label: "Агуулах",
    hint: "Агуулахын өрөө, талбай",
    icon: Warehouse,
  },
  {
    key: "fence_house",
    label: "Хашаа байшин",
    hint: "Газартай нэг айлын байшин",
    icon: Home,
  },
  {
    key: "summer_land",
    label: "Зуслангийн байшин",
    hint: "Зуслангийн бүсэд байрлах байшин",
    icon: Trees,
    residential: true,
  },
  {
    key: "land",
    label: "Газар",
    hint: "Барилгатай эсвэл хоосон газар",
    icon: Map,
  },
];

const subtypes: Record<PropertyKey, string[]> = {
  apartment: ["Энгийн", "Дуплекс", "Пентхаус", "Бусад: тайлбар оруулах"],
  house: ["Single house", "Twin house", "Town house", "Multihouse"],
  office: ["Давхар дахь хэсэг", "Давхар бүхлээрээ", "Обьект бүхлээрээ"],
  retail: ["Давхар дахь хэсэг", "Давхар бүхлээрээ", "Обьект бүхлээрээ"],
  industrial: ["Үйлдвэрлэл", "Засвар үйлчилгээ", "Бусад"],
  parking: ["Орон сууцны доорх", "Оффисын доорх", "Тусдаа блок"],
  warehouse: ["Барилгын доторх", "Тусдаа агуулах", "Бусад"],
  fence_house: ["Хашаа байшин (газартай)"],
  summer_land: ["Зуслангийн байшин (газартай)"],
  land: ["Орон сууц", "Үйлчилгээ", "Үйлдвэрлэл", "Зуслан"],
};

const amenities = [
  "Харуул, хамгаалалт 24/7",
  "Домофон, дохиолол",
  "Лифт - зорчигчийн 24/7",
  "Төлбөргүй ил зогсоол",
  "Хүүхдийн тоглоомын талбай",
  "Ногоон байгууламж",
  "Фитнес, иога",
  "Цахилгаан машины цэнэглэл",
];

const included = [
  "Гал тогооны тавилга",
  "Үүдний тавилга",
  "АЦӨ тоноглол",
  "Хөргөгч, хөлдөөгч",
  "Угаалгын машин",
  "Агааржуулалт",
  "Домофон",
  "Хөшиг, тюль",
];

const serviceOptions = [
  "Verified болгох",
  "Мэргэжлийн зуучлагчаар зуучлуулах",
  "Sponsored болгох",
];

const relations = [
  "Өмчлөгч",
  "Эрх эзэмшигч",
  "Хуулийн этгээдийн ажилтан",
  "Итгэмжлэгдсэн төлөөлөгч",
  "Зуучлагч",
  "Бусад",
];

const defaultDraft: Draft = {
  goal: "rent",
  propertyType: "apartment",
  subtype: "Энгийн",
  district: "Сүхбаатар",
  khoroo: "",
  khotkhon: "",
  street: "",
  buildingNumber: "",
  floorAbove: "16",
  selectedFloor: "F08",
  unit: "",
  area: "",
  rooms: "2",
  bedrooms: "1",
  bathrooms: "1",
  condition: "Сул, чөлөөтэй байгаа",
  commissionYear: "",
  monthlyPrice: "",
  totalPrice: "",
  deposit: "",
  rentFrequency: "1 сар тутам",
  desc: "",
  amenities: [],
  included: [],
  services: ["Verified болгох"],
  photos: [],
  relation: "Өмчлөгч",
  truth: false,
  authority: false,
  terms: false,
};

function Field({
  label,
  required,
  children,
  hint,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <Label className="text-xs text-muted-foreground">
        {label}
        {required ? (
          <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-[10px]">
            заавал
          </Badge>
        ) : null}
      </Label>
      {children}
      {hint ? <p className="text-[11px] leading-4 text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function NativeSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/20"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function ToggleChip({
  active,
  children,
  onClick,
  icon: Icon,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
  icon?: LucideIcon;
}) {
  return (
    <Button
      type="button"
      variant={active ? "default" : "outline"}
      size="sm"
      onClick={onClick}
      className={cn("h-auto min-h-8 justify-start whitespace-normal rounded-md px-2.5 py-1.5 text-left", active && "shadow-none")}
    >
      {Icon ? <Icon className="size-3.5 shrink-0" /> : null}
      {children}
    </Button>
  );
}

function StepHeader({ step }: { step: number }) {
  const group = groups.find((item) => item.step === step) ?? groups[0];
  const Icon = group.icon;
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div>
        <div className="mb-1 text-[11px] font-semibold uppercase text-[color:var(--gold-text)]">
          {group.sub}
        </div>
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <Icon className="size-5 text-accent" />
          {group.title}
        </h2>
      </div>
      <div className="flex flex-wrap gap-1.5 md:justify-end">
        {group.covers.map((cover) => (
          <Badge key={cover} variant="outline" className="rounded-full">
            {cover}
          </Badge>
        ))}
      </div>
    </div>
  );
}

export function ListPropertyWizard() {
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<Draft>(defaultDraft);
  const [submitted, setSubmitted] = useState(false);

  const selectedType = propertyTypes.find((item) => item.key === draft.propertyType) ?? propertyTypes[0];
  const SelectedTypeIcon = selectedType.icon;
  const isRent = draft.goal === "rent";
  const price = Number(isRent ? draft.monthlyPrice : draft.totalPrice) || 0;
  const area = Number(draft.area) || 0;
  const unitPrice = price && area ? Math.round(price / area) : 0;

  const required = useMemo(
    () => [
      { label: "Зорилго", ok: Boolean(draft.goal), step: 1 },
      { label: "Зориулалт", ok: Boolean(draft.propertyType), step: 1 },
      { label: "Дэд зориулалт", ok: Boolean(draft.subtype), step: 1 },
      { label: "Дүүрэг/Сум", ok: Boolean(draft.district), step: 2 },
      { label: "Хороо/Баг", ok: Boolean(draft.khoroo.trim()), step: 2 },
      { label: "Хотхон эсвэл гудамж", ok: Boolean(draft.khotkhon.trim() || draft.street.trim()), step: 2 },
      { label: "Талбай", ok: area > 0, step: 2 },
      { label: "Өрөөний тоо", ok: !selectedType.residential || Boolean(draft.rooms), step: 2 },
      { label: isRent ? "Нийт үнэ/сар" : "Нийт үнэ", ok: price > 0, step: 4 },
      { label: "Зураг", ok: draft.photos.length > 0, step: 4 },
      { label: "Холбоо хамаарал", ok: Boolean(draft.relation), step: 5 },
      { label: "Үнэн зөв", ok: draft.truth, step: 5 },
      { label: "Эрх бүхий этгээд", ok: draft.authority, step: 5 },
      { label: "Нөхцөл зөвшөөрөх", ok: draft.terms, step: 5 },
    ],
    [area, draft, isRent, price, selectedType.residential]
  );

  const completion = Math.round((required.filter((item) => item.ok).length / required.length) * 100);
  const missing = required.filter((item) => !item.ok);

  const update = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((current) => {
      const next = { ...current, [key]: value };
      if (key === "propertyType") {
        const nextType = value as PropertyKey;
        next.subtype = subtypes[nextType][0];
      }
      return next;
    });
    setSubmitted(false);
  };

  const toggleList = (key: "amenities" | "included" | "services", value: string) => {
    setDraft((current) => {
      const set = new Set(current[key]);
      if (set.has(value)) set.delete(value);
      else set.add(value);
      return { ...current, [key]: Array.from(set) };
    });
  };

  const goNext = () => setStep((current) => Math.min(5, current + 1));
  const goBack = () => setStep((current) => Math.max(1, current - 1));

  return (
    <div className="min-h-screen px-4 py-5 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <Image
                src="/images/logo/horizontal-light.png"
                alt="NEOMAP"
                width={120}
                height={40}
                style={{ width: "auto", height: "40px" }}
              />
              <Badge className="rounded-full bg-accent text-accent-foreground hover:bg-accent">
                <Sparkles className="size-3.5" />
                shadcn wizard
              </Badge>
            </div>
            <h1 className="text-3xl font-semibold">Зар оруулах</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              13 алхмын мэдээллийг 5 хэсэгт бөглөж, нийтлэх хүсэлт илгээх
              owner-side workflow.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="h-8 rounded-full px-3">
              {isRent ? <KeyRound className="size-3.5" /> : <Banknote className="size-3.5" />}
              {isRent ? "Түрээс" : "Худалдаа"}
            </Badge>
            <Badge variant="outline" className="h-8 rounded-full px-3">
              <SelectedTypeIcon className="size-3.5" />
              {selectedType.label}
            </Badge>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="space-y-3 lg:sticky lg:top-5 lg:self-start">
            <Card className="rounded-md">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>Бүрэн байдал</CardTitle>
                  <div className="text-xl font-semibold tabular-nums text-[color:var(--gold-text)]">
                    {completion}%
                  </div>
                </div>
                <Progress value={completion} />
                <CardDescription>
                  {missing.length
                    ? `${missing.length} заавал бөглөх зүйл үлдсэн`
                    : "Нийтлэх хүсэлт илгээхэд бэлэн"}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="rounded-md py-2">
              <CardContent className="grid gap-1 px-2">
                {groups.map((group) => {
                  const Icon = group.icon;
                  const done = required
                    .filter((item) => item.step === group.step)
                    .every((item) => item.ok);
                  const active = step === group.step;
                  return (
                    <Button
                      key={group.step}
                      type="button"
                      variant={active ? "secondary" : "ghost"}
                      onClick={() => setStep(group.step)}
                      className="h-auto justify-start rounded-md px-2 py-2 text-left"
                    >
                      <span
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-md border bg-background",
                          active && "border-primary bg-primary text-primary-foreground",
                          done && !active && "border-emerald-600 bg-emerald-50 text-emerald-700"
                        )}
                      >
                        {done && !active ? <Check className="size-4" /> : <Icon className="size-4" />}
                      </span>
                      <span className="min-w-0">
                        <span className="block whitespace-normal text-sm font-semibold">{group.title}</span>
                        <span className="block text-[11px] text-muted-foreground">{group.sub}</span>
                      </span>
                    </Button>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="rounded-md">
              <CardHeader>
                <CardTitle className="text-sm">13 алхмын хамрах хүрээ</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-[repeat(13,minmax(0,1fr))] gap-1">
                {Array.from({ length: 13 }, (_, index) => {
                  const item = index + 1;
                  const groupStep = item <= 3 ? 1 : item <= 5 ? 2 : item <= 8 ? 3 : item <= 11 ? 4 : 5;
                  return (
                    <span
                      key={item}
                      className={cn(
                        "flex h-7 items-center justify-center rounded-md border bg-muted text-[10px] font-semibold tabular-nums text-muted-foreground",
                        groupStep <= step && "border-primary/30 bg-primary/10 text-primary",
                        groupStep === step && "border-primary"
                      )}
                    >
                      {String(item).padStart(2, "0")}
                    </span>
                  );
                })}
              </CardContent>
            </Card>
          </aside>

          <section className="min-w-0 space-y-4">
            <StepHeader step={step} />
            {step === 1 ? (
              <StepOne draft={draft} update={update} />
            ) : step === 2 ? (
              <StepTwo draft={draft} update={update} selectedType={selectedType} />
            ) : step === 3 ? (
              <StepThree draft={draft} toggleList={toggleList} />
            ) : step === 4 ? (
              <StepFour
                draft={draft}
                update={update}
                isRent={isRent}
                price={price}
                area={area}
                unitPrice={unitPrice}
                toggleList={toggleList}
              />
            ) : (
              <StepFive
                draft={draft}
                update={update}
                toggleList={toggleList}
                missing={missing}
                price={price}
                selectedType={selectedType}
              />
            )}

            <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button variant="outline" onClick={step === 1 ? () => setDraft(defaultDraft) : goBack}>
                  {step === 1 ? <X className="size-4" /> : <ChevronLeft className="size-4" />}
                  {step === 1 ? "Цэвэрлэх" : "Буцах"}
                </Button>
                <Button variant="outline">
                  <Save className="size-4" />
                  Түр хадгалах
                </Button>
              </div>
              {step < 5 ? (
                <Button onClick={goNext}>
                  Дараагийнх
                  <ChevronRight className="size-4" />
                </Button>
              ) : (
                <Button
                  onClick={() => setSubmitted(true)}
                  disabled={missing.length > 0}
                  className="bg-primary text-primary-foreground"
                >
                  <Send className="size-4" />
                  Зар нийтлэх хүсэлт илгээх
                </Button>
              )}
            </div>
            {submitted ? (
              <Card className="rounded-md border-emerald-600 bg-emerald-50 text-emerald-950">
                <CardContent className="flex items-center gap-3 py-4">
                  <BadgeCheck className="size-5" />
                  <span className="text-sm font-medium">
                    Зар нийтлэх хүсэлт бэлэн боллоо. NEOMAP баг баталгаажуулалтын дараагийн шат руу шилжүүлнэ.
                  </span>
                </CardContent>
              </Card>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}

function StepOne({
  draft,
  update,
}: {
  draft: Draft;
  update: <K extends keyof Draft>(key: K, value: Draft[K]) => void;
}) {
  return (
    <div className="space-y-4">
      <Card className="rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="size-4 text-accent" />
            01. Зар оруулах
          </CardTitle>
          <CardDescription>Худалдах эсвэл түрээслүүлэх зорилгоо сонгоно.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {goals.map((goal) => {
            const Icon = goal.icon;
            const active = draft.goal === goal.key;
            return (
              <button
                key={goal.key}
                type="button"
                onClick={() => update("goal", goal.key)}
                className={cn(
                  "rounded-md border bg-card p-4 text-left transition-colors hover:border-primary",
                  active && "border-primary bg-primary/10"
                )}
              >
                <span
                  className={cn(
                    "mb-3 flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary",
                    active && "bg-primary text-primary-foreground"
                  )}
                >
                  <Icon className="size-5" />
                </span>
                <span className="block text-sm font-semibold">{goal.label}</span>
                <span className="mt-1 block text-xs leading-5 text-muted-foreground">{goal.hint}</span>
              </button>
            );
          })}
        </CardContent>
      </Card>

      <Card className="rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="size-4 text-accent" />
            02. Үл хөдлөх эд хөрөнгийн зориулалт
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {propertyTypes.map((type) => {
            const Icon = type.icon;
            const active = draft.propertyType === type.key;
            return (
              <button
                key={type.key}
                type="button"
                onClick={() => update("propertyType", type.key)}
                className={cn(
                  "flex min-h-24 gap-3 rounded-md border bg-card p-3 text-left transition-colors hover:border-primary hover:bg-muted",
                  active && "border-primary bg-primary/10"
                )}
              >
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary",
                    active && "bg-primary text-primary-foreground"
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{type.label}</span>
                  <span className="mt-1 block text-[11px] leading-4 text-muted-foreground">{type.hint}</span>
                </span>
              </button>
            );
          })}
        </CardContent>
      </Card>

      <Card className="rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers3 className="size-4 text-accent" />
            03. Дэд зориулалт
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {subtypes[draft.propertyType].map((item) => (
            <ToggleChip
              key={item}
              active={draft.subtype === item}
              onClick={() => update("subtype", item)}
            >
              {item}
            </ToggleChip>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function StepTwo({
  draft,
  update,
  selectedType,
}: {
  draft: Draft;
  selectedType: (typeof propertyTypes)[number];
  update: <K extends keyof Draft>(key: K, value: Draft[K]) => void;
}) {
  return (
    <div className="space-y-4">
      <Card className="rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="size-4 text-accent" />
            04. Хаяг, байршил
          </CardTitle>
          <CardDescription>
            Дүүрэг, хороо, хотхон/гудамж, барилгын мэдээллээ оруулна.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Дүүрэг / Сум" required>
                <NativeSelect value={draft.district} onChange={(value) => update("district", value)} options={districts} />
              </Field>
              <Field label="Хороо / Баг" required>
                <Input value={draft.khoroo} onChange={(event) => update("khoroo", event.target.value)} placeholder="15" />
              </Field>
              <Field label="Хотхон, хороолол" required hint="Гудамжтай бол хоосон үлдээж болно.">
                <Input value={draft.khotkhon} onChange={(event) => update("khotkhon", event.target.value)} placeholder="Time Tower" />
              </Field>
              <Field label="Гудамж">
                <Input value={draft.street} onChange={(event) => update("street", event.target.value)} placeholder="Нарны зам" />
              </Field>
              <Field label="Барилгын дугаар">
                <Input value={draft.buildingNumber} onChange={(event) => update("buildingNumber", event.target.value)} placeholder="204" />
              </Field>
              <Field label="Тоот / хаалга">
                <Input value={draft.unit} onChange={(event) => update("unit", event.target.value)} placeholder="301" />
              </Field>
            </div>
            <Separator />
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Үндсэн давхар">
                <Input value={draft.floorAbove} onChange={(event) => update("floorAbove", event.target.value)} placeholder="16" />
              </Field>
              <Field label="Байрлах давхар">
                <Input value={draft.selectedFloor} onChange={(event) => update("selectedFloor", event.target.value)} placeholder="F08" />
              </Field>
              <Field label="Төлөв">
                <NativeSelect
                  value={draft.condition}
                  onChange={(value) => update("condition", value)}
                  options={["Сул, чөлөөтэй байгаа", "Амьдарч байгаа", "Түрээсийн гэрээтэй", "Бусад"]}
                />
              </Field>
            </div>
          </div>
          <div className="overflow-hidden rounded-md border bg-muted">
            <div className="relative h-72 bg-[linear-gradient(135deg,#e2e8f0,#f8fafc)]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_30%,rgba(18,60,105,.16),transparent_22%),radial-gradient(circle_at_70%_60%,rgba(201,162,39,.18),transparent_24%)]" />
              <div className="absolute inset-4 rounded-md border border-white/70" />
              <div className="absolute left-[48%] top-[42%] flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full border-2 border-white bg-accent px-3 py-2 text-xs font-semibold text-accent-foreground shadow-lg">
                <MapPin className="size-4" />
                {draft.khotkhon || draft.district}
              </div>
              <div className="absolute bottom-3 left-3 right-3 rounded-md bg-slate-950/85 px-3 py-2 text-xs text-white">
                Газрын зураг дээрээс барилга / газар сонгох
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="size-4 text-accent" />
            05. Үзүүлэлт
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <Field label={selectedType.key === "land" ? "Газрын талбай (м²)" : "Нийт талбай (м²)"} required>
              <Input type="number" value={draft.area} onChange={(event) => update("area", event.target.value)} placeholder="68" />
            </Field>
            <Field label="Нийт өрөө" required={selectedType.residential}>
              <Input type="number" value={draft.rooms} onChange={(event) => update("rooms", event.target.value)} placeholder="2" />
            </Field>
            <Field label="Унтлагын өрөө">
              <Input type="number" value={draft.bedrooms} onChange={(event) => update("bedrooms", event.target.value)} placeholder="1" />
            </Field>
            <Field label="Ариун цэврийн өрөө">
              <Input type="number" value={draft.bathrooms} onChange={(event) => update("bathrooms", event.target.value)} placeholder="1" />
            </Field>
          </div>
          <Field label="Өрөө, обьектын нэмэлт тайлбар">
            <Textarea value={draft.desc} onChange={(event) => update("desc", event.target.value)} placeholder="Нар сайн тусдаг, үйлчилгээ ойр..." />
          </Field>
        </CardContent>
      </Card>
    </div>
  );
}

function StepThree({
  draft,
  toggleList,
}: {
  draft: Draft;
  toggleList: (key: "amenities" | "included" | "services", value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <Card className="rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-accent" />
            06-07. Дэд бүтэц, үйлчилгээ, тав тух
          </CardTitle>
          <CardDescription>Хэрэглэгч хайлт хийх үед match болон filter-д ашиглагдана.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {amenities.map((item) => (
            <ToggleChip
              key={item}
              active={draft.amenities.includes(item)}
              onClick={() => toggleList("amenities", item)}
              icon={draft.amenities.includes(item) ? Check : undefined}
            >
              {item}
            </ToggleChip>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PackageCheck className="size-4 text-accent" />
            08. Үнэд багтсан дагалдах зүйлс
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {included.map((item) => (
            <ToggleChip
              key={item}
              active={draft.included.includes(item)}
              onClick={() => toggleList("included", item)}
              icon={draft.included.includes(item) ? Check : undefined}
            >
              {item}
            </ToggleChip>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function StepFour({
  draft,
  update,
  isRent,
  price,
  area,
  unitPrice,
  toggleList,
}: {
  draft: Draft;
  isRent: boolean;
  price: number;
  area: number;
  unitPrice: number;
  update: <K extends keyof Draft>(key: K, value: Draft[K]) => void;
  toggleList: (key: "amenities" | "included" | "services", value: string) => void;
}) {
  const addPhoto = (category: string) => {
    update("photos", [...draft.photos, { id: Date.now(), category }]);
  };
  const removePhoto = (id: number) => {
    update("photos", draft.photos.filter((photo) => photo.id !== id));
  };
  const deposit = Number(draft.deposit) || 0;

  return (
    <div className="space-y-4">
      <Card className="rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="size-4 text-accent" />
            09. Үл хөдлөх эд хөрөнгийн төлөв
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <Field label="Одоогийн байдал">
            <NativeSelect
              value={draft.condition}
              onChange={(value) => update("condition", value)}
              options={["Сул, чөлөөтэй байгаа", "Амьдарч байгаа", "Түрээсийн гэрээтэй", "Бусад"]}
            />
          </Field>
          <Field label="Ашиглалтад орсон он">
            <Input value={draft.commissionYear} onChange={(event) => update("commissionYear", event.target.value)} placeholder="2020" />
          </Field>
        </CardContent>
      </Card>

      <Card className="rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="size-4 text-accent" />
            10. Үнэ, төлбөрийн нөхцөл
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label={isRent ? "Нийт үнэ/сар (₮)" : "Нийт үнэ (₮)"} required>
              <Input
                type="number"
                value={isRent ? draft.monthlyPrice : draft.totalPrice}
                onChange={(event) => update(isRent ? "monthlyPrice" : "totalPrice", event.target.value)}
                placeholder={isRent ? "4000000" : "450000000"}
              />
            </Field>
            <Field label={isRent ? "Нэгжийн үнэ/сар (₮/м²)" : "Нэгжийн үнэ (₮/м²)"}>
              <Input value={unitPrice ? unitPrice.toLocaleString("en-US") : ""} disabled placeholder="Автоматаар бодогдоно" />
            </Field>
            {isRent ? (
              <>
                <Field label="Давтамж">
                  <NativeSelect
                    value={draft.rentFrequency}
                    onChange={(value) => update("rentFrequency", value)}
                    options={["1 сар тутам", "3 сар тутам", "6 сар тутам", "12 сар тутам"]}
                  />
                </Field>
                <Field label="Барьцаа (₮)">
                  <Input type="number" value={draft.deposit} onChange={(event) => update("deposit", event.target.value)} placeholder="4000000" />
                </Field>
              </>
            ) : null}
          </div>
          {isRent ? (
            <div className="overflow-hidden rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Давтамж</TableHead>
                    <TableHead>Хөнгөлөлт</TableHead>
                    <TableHead>Сар</TableHead>
                    <TableHead>Нийт</TableHead>
                    <TableHead>Анхны төлбөр</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[1, 3, 6, 12].map((month) => {
                    const discount = month >= 6 ? 5 : 0;
                    const monthly = price ? Math.round(price * (1 - discount / 100)) : 0;
                    const total = monthly * month;
                    return (
                      <TableRow key={month}>
                        <TableCell>{month} сар тутам</TableCell>
                        <TableCell>{discount}%</TableCell>
                        <TableCell className="tabular-nums">{monthly ? monthly.toLocaleString("en-US") + "₮" : "-"}</TableCell>
                        <TableCell className="tabular-nums">{total ? total.toLocaleString("en-US") + "₮" : "-"}</TableCell>
                        <TableCell className="tabular-nums">{total ? (total + deposit).toLocaleString("en-US") + "₮" : "-"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : null}
          <div className="grid gap-2 sm:grid-cols-3">
            {serviceOptions.map((item) => (
              <ToggleChip
                key={item}
                active={draft.services.includes(item)}
                onClick={() => toggleList("services", item)}
                icon={draft.services.includes(item) ? Check : undefined}
              >
                {item}
              </ToggleChip>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {area && price ? `Нийт ${area} м² · ${unitPrice.toLocaleString("en-US")}₮/м²` : "Үнэ ба талбайгаа оруулахад нэгжийн үнэ автоматаар гарна."}
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="size-4 text-accent" />
            11. Зураг, бичлэг
          </CardTitle>
          <CardDescription>Хамгийн багадаа нэг зураг нэмнэ.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {["Нүүрний зураг", "План зураг", "Дотор зураг", "Гадна орчны зураг"].map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => addPhoto(category)}
                className="min-h-24 rounded-md border border-dashed bg-card p-3 text-left transition-colors hover:border-primary hover:bg-muted"
              >
                <Upload className="mb-2 size-4 text-accent" />
                <div className="text-xs font-semibold">{category}</div>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  {draft.photos.filter((photo) => photo.category === category).length} файл
                </div>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
            {draft.photos.map((photo, index) => (
              <div
                key={photo.id}
                className="relative aspect-square overflow-hidden rounded-md border bg-[linear-gradient(135deg,#123c69,#c9a227)]"
              >
                <div className="absolute inset-0 bg-black/10" />
                <Badge className="absolute left-1 top-1 rounded-md bg-accent text-accent-foreground hover:bg-accent">
                  {index === 0 ? "Нүүр" : "Зураг"}
                </Badge>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="secondary"
                  onClick={() => removePhoto(photo.id)}
                  className="absolute right-1 top-1"
                >
                  <Trash2 className="size-3.5" />
                </Button>
                <div className="absolute inset-x-0 bottom-0 truncate bg-slate-950/75 px-2 py-1 text-[10px] font-semibold text-white">
                  {photo.category}
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addPhoto("Дотор зураг")}
              className="flex aspect-square items-center justify-center rounded-md border border-dashed text-muted-foreground hover:border-primary hover:text-primary"
            >
              <Plus className="size-5" />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StepFive({
  draft,
  update,
  toggleList,
  missing,
  price,
  selectedType,
}: {
  draft: Draft;
  selectedType: (typeof propertyTypes)[number];
  price: number;
  missing: Array<{ label: string; ok: boolean; step: number }>;
  update: <K extends keyof Draft>(key: K, value: Draft[K]) => void;
  toggleList: (key: "amenities" | "included" | "services", value: string) => void;
}) {
  const review = [
    { label: "Зорилго", value: draft.goal === "rent" ? "Түрээс" : "Худалдаа", icon: Target },
    { label: "Төрөл", value: `${selectedType.label} · ${draft.subtype}`, icon: Building2 },
    { label: "Байршил", value: `${draft.district}, ${draft.khoroo || "-"}-р хороо`, icon: MapPin },
    { label: "Үнэ", value: price ? `${price.toLocaleString("en-US")}₮${draft.goal === "rent" ? "/сар" : ""}` : "-", icon: Banknote },
  ];

  return (
    <div className="space-y-4">
      <Card className="rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SearchCheck className="size-4 text-accent" />
            12. Шалгах, баталгаажуулах
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {review.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-md border bg-card p-3">
                  <div className="mb-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Icon className="size-3.5 text-accent" />
                    {item.label}
                  </div>
                  <div className="truncate text-sm font-semibold">{item.value}</div>
                </div>
              );
            })}
          </div>
          {missing.length ? (
            <div className="rounded-md border border-destructive/25 bg-destructive/5 p-3">
              <div className="mb-2 text-sm font-semibold text-destructive">
                Заавал бөглөх {missing.length} зүйл байна
              </div>
              <div className="flex flex-wrap gap-2">
                {missing.map((item) => (
                  <Badge key={item.label} variant="destructive" className="rounded-full">
                    {item.label}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
          <div className="space-y-2">
            {[
              ["truth", "Дээрх мэдээлэл үнэн зөв", "Мэдээлэл нь үнэн зөв, бүрэн, бодитой гэдгийг баталж байна."],
              ["authority", "Эрх бүхий этгээд мөн", "Энэхүү зарыг оруулах эрхтэй этгээд мөн гэдгийг баталж байна."],
              ["terms", "Үйлчилгээний нөхцөл зөвшөөрөх", "NEOMAP үйлчилгээний нөхцөлийг хүлээн зөвшөөрч байна."],
            ].map(([key, title, sub]) => {
              const checked = Boolean(draft[key as "truth" | "authority" | "terms"]);
              return (
                <label
                  key={key}
                  className={cn(
                    "flex cursor-pointer gap-3 rounded-md border bg-card p-3 transition-colors hover:bg-muted",
                    checked && "border-primary bg-primary/10"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) => update(key as "truth" | "authority" | "terms", event.target.checked)}
                    className="mt-0.5 size-4 accent-primary"
                  />
                  <span>
                    <span className="block text-sm font-semibold">{title}</span>
                    <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{sub}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="size-4 text-accent" />
            13. Verified and Brokerage service
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {serviceOptions.map((item) => (
              <ToggleChip
                key={item}
                active={draft.services.includes(item)}
                onClick={() => toggleList("services", item)}
                icon={draft.services.includes(item) ? Check : undefined}
              >
                {item}
              </ToggleChip>
            ))}
          </div>
          <Field label="Та энэ үл хөдлөх эд хөрөнгөтэй ямар холбоотой вэ?" required>
            <div className="flex flex-wrap gap-2">
              {relations.map((relation) => (
                <ToggleChip
                  key={relation}
                  active={draft.relation === relation}
                  onClick={() => update("relation", relation)}
                >
                  {relation}
                </ToggleChip>
              ))}
            </div>
          </Field>
        </CardContent>
      </Card>
    </div>
  );
}
