"use client";

import { useState } from "react";
import { Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";

interface NewsItem {
  id: number;
  cat: string;
  title: string;
  summary: string;
  date: string;
  readMin: number;
  hot?: boolean;
  img: string;
}

const NEWS_ITEMS: NewsItem[] = [
  {
    id: 1,
    cat: "Зах зээл",
    title: "УБ-ын орон сууцны үнэ 2026 оны эхний хагаст 4.2%-аар өслөө",
    summary:
      "Хан-Уул, Сүхбаатар дүүргийн premium хороололууд үнийн өсөлтийг тэргүүлж байна. Мэргэжилтнүүд хэрэглэгчдийн эрэлт тогтворжсон гэж дүгнэв.",
    date: "2026-05-22",
    readMin: 5,
    hot: true,
    img: "orloo-3-0",
  },
  {
    id: 2,
    cat: "Ипотек",
    title: "Хаан банк ипотекийн хүүгээ 11.5%-аар бууруулав",
    summary:
      "Шинэ ипотекийн хөтөлбөрийн хүрээнд эхний удаа орон сууц авч буй харилцагчдад тусгай хүү санал болгож байна.",
    date: "2026-05-20",
    readMin: 3,
    img: "orloo-5-0",
  },
  {
    id: 3,
    cat: "Шинэ төсөл",
    title: 'Зайсангийн район дахь "Sky Garden" төсөл худалдаалалт нээгдлээ',
    summary:
      "24 давхар, 280 айлын байр. Дотоод усан сан, fitness, podzemny зогсоолтой premium хороолол.",
    date: "2026-05-18",
    readMin: 4,
    img: "orloo-11-0",
  },
  {
    id: 4,
    cat: "Хууль эрх зүй",
    title: "Үл хөдлөх хөрөнгийн татварын шинэчилсэн журам",
    summary: "2026 оны 6-р сараас хэрэгжих татварын журам. Эзэмшигч нарт ямар нөлөө үзүүлэх вэ.",
    date: "2026-05-15",
    readMin: 7,
    img: "orloo-7-0",
  },
  {
    id: 5,
    cat: "Зөвлөгөө",
    title: "Анх удаа сууц авч байна уу — 7 алхамт зөвлөмж",
    summary:
      "Зээл, гэрээ, шалгах зүйлсээс эхлээд төлбөрийн төлөвлөгөө хүртэл бүх алхамын товч.",
    date: "2026-05-12",
    readMin: 6,
    img: "orloo-1-0",
  },
];

const CATEGORIES = ["Бүгд", "Зах зээл", "Ипотек", "Шинэ төсөл", "Зөвлөгөө"];

export function NewsScreen() {
  const [cat, setCat] = useState<string>("Бүгд");
  const filtered =
    cat === "Бүгд" ? NEWS_ITEMS : NEWS_ITEMS.filter((n) => n.cat === cat);
  const featured = filtered[0];
  const rest = filtered.slice(1);
  const openModal = useStore((s) => s.openModal);
  const openArticle = (n: NewsItem) => openModal(<ArticleModal item={n} />, "lg");

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-6 py-6">
      <div className="flex items-end justify-between mb-5">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Мэдээ, мэдээлэл</h1>
          <p className="text-sm text-[var(--text-3)]">
            Үл хөдлөхийн зах зээл, ипотек, шинэ төслүүд
          </p>
        </div>
        <div className="hidden sm:flex gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCat(c)}
              className={cn("bm-chip", c === cat && "active")}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {featured ? (
        <button
          type="button"
          onClick={() => openArticle(featured)}
          className="card overflow-hidden mb-6 cursor-pointer hover:border-[var(--gold-brand)] transition block w-full text-left"
        >
          <div className="grid md:grid-cols-2 gap-0">
            <div
              className="aspect-[16/10] md:aspect-auto bg-cover bg-center"
              style={{
                backgroundImage: `url('https://picsum.photos/seed/${featured.img}/1200/800')`,
              }}
            />
            <div className="p-6 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2">
                <span className="pill pill-hot">{featured.cat}</span>
                {featured.hot && <span className="pill pill-new">Онцлох</span>}
              </div>
              <h2 className="text-xl lg:text-2xl font-semibold leading-snug mb-2">
                {featured.title}
              </h2>
              <p className="text-sm text-[var(--text-2)] mb-4">{featured.summary}</p>
              <div className="text-xs text-[var(--text-3)]">
                {featured.date} · {featured.readMin} мин уншина
              </div>
            </div>
          </div>
        </button>
      ) : (
        <div className="card p-10 text-center text-sm text-[var(--text-3)] mb-6">
          Сонгосон ангилалд мэдээ алга
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rest.map((n) => (
          <button
            key={n.id}
            type="button"
            onClick={() => openArticle(n)}
            className="card overflow-hidden cursor-pointer hover:border-[var(--gold-brand)] transition block w-full text-left"
          >
            <div
              className="aspect-[16/10] bg-cover bg-center"
              style={{ backgroundImage: `url('https://picsum.photos/seed/${n.img}/800/500')` }}
            />
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="pill pill-info">{n.cat}</span>
              </div>
              <h3 className="font-semibold text-sm leading-snug mb-1.5">{n.title}</h3>
              <p className="text-xs text-[var(--text-3)] line-clamp-2 mb-2">{n.summary}</p>
              <div className="text-[11px] text-[var(--text-3)]">
                {n.date} · {n.readMin} мин
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ArticleModal({ item }: { item: NewsItem }) {
  const closeModal = useStore((s) => s.closeModal);
  return (
    <div className="-m-6">
      <div
        className="relative aspect-[16/9] bg-cover bg-center"
        style={{ backgroundImage: `url('https://picsum.photos/seed/${item.img}/1600/900')` }}
      >
        <button
          type="button"
          onClick={closeModal}
          className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "rgba(0,0,0,.55)", color: "#fff" }}
          aria-label="Хаах"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="pill pill-hot">{item.cat}</span>
          {item.hot && <span className="pill pill-new">Онцлох</span>}
          <span
            className="text-xs text-[var(--text-3)] inline-flex items-center gap-1 ml-auto"
          >
            <Clock className="w-3 h-3" />
            {item.readMin} мин уншина
          </span>
        </div>
        <h2 className="text-2xl font-bold leading-snug mb-2">{item.title}</h2>
        <div className="text-xs text-[var(--text-3)] mb-4">{item.date}</div>
        <p className="text-sm leading-7 text-[var(--text-2)]">{item.summary}</p>
        <p className="text-sm leading-7 text-[var(--text-2)] mt-4">
          Энэхүү нийтлэлийн дэлгэрэнгүй удахгүй нэмэгдэнэ. NEOMAP-ийн редакцийн
          баг үл хөдлөхийн зах зээлийн мэдээ, ипотек, шинэ төслүүдийг
          тогтмол бэлдэж байна.
        </p>
      </div>
    </div>
  );
}
