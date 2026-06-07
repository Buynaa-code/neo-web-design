"use client";

import Image from "next/image";
import Link from "next/link";
import { Briefcase, Camera, Mail, MapPin, MessageCircle, Phone, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";

export function Footer() {
  const router = useRouter();
  const setMode = useStore((s) => s.setMode);

  const go = (mode: "sale" | "rent") => {
    setMode(mode);
    router.push(`/results?mode=${mode}`);
  };

  return (
    <footer className="bm-footer mt-16 lg:mt-24">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-14">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <Link href="/" className="flex items-center mb-4">
              <Image
                src="/images/logo/horizontal-light.png"
                alt="NEOMAP"
                width={120}
                height={40}
                className="neo-logo neo-logo-light"
              />
              <Image
                src="/images/logo/horizontal-dark.png"
                alt="NEOMAP"
                width={120}
                height={40}
                className="neo-logo neo-logo-dark"
              />
            </Link>
            <p className="text-sm leading-[1.6] max-w-[360px]" style={{ color: "var(--text-2)" }}>
              NEOMAP бол Монголын үл хөдлөхийн хамгийн найдвартай, ухаалаг, хүртээмжтэй зуучлал, зөвлөгөө, үнэлгээний цогц платформ юм.
            </p>
            <div className="flex items-center gap-3 mt-6">
              {[MessageCircle, Camera, Play, Briefcase].map((Icon, i) => (
                <button
                  key={i}
                  type="button"
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--gold-soft)] transition"
                  style={{ background: "var(--surface-2)", color: "var(--text-2)" }}
                  aria-label="social"
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="bm-footer-h">Үндсэн цэс</div>
            <ul className="space-y-2.5">
              <li><Link href="/">Нүүр</Link></li>
              <li><button type="button" onClick={() => go("sale")}>Худалдах</button></li>
              <li><button type="button" onClick={() => go("rent")}>Түрээслэх</button></li>
              <li><Link href="/results">Төслүүд</Link></li>
              <li><Link href="/results">Коммерц</Link></li>
            </ul>
          </div>

          <div>
            <div className="bm-footer-h">Тусламж</div>
            <ul className="space-y-2.5">
              <li><a>Тусламжийн төв</a></li>
              <li><a>Хэрэглэх зааварчилгаа</a></li>
              <li><a>Нууцлалын бодлого</a></li>
              <li><a>Үйлчилгээний нөхцөл</a></li>
            </ul>
          </div>

          <div>
            <div className="bm-footer-h">Бидний тухай</div>
            <ul className="space-y-2.5">
              <li><a>Бидний тухай</a></li>
              <li><Link href="/news">Мэдээ, нийтлэл</Link></li>
              <li><a>Ажлын байр</a></li>
              <li><a>Хамтран ажиллах</a></li>
            </ul>
          </div>

          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <div className="bm-footer-h">Холбоо барих</div>
            <ul className="space-y-2.5 text-sm" style={{ color: "var(--text-2)" }}>
              <li className="flex items-start gap-2">
                <Phone className="w-4 h-4 mt-0.5" style={{ color: "var(--gold-brand)" }} /> 5517-1010
              </li>
              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 mt-0.5" style={{ color: "var(--gold-brand)" }} /> info@neolimit.mn
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5" style={{ color: "var(--gold-brand)" }} />
                Сүхбаатар дүүрэг, 1-р хороо,<br />
                Peace Tower, 11 давхар
              </li>
            </ul>
          </div>
        </div>

        <div
          className="mt-10 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
          style={{ borderTop: "1px solid var(--border)", color: "var(--text-3)" }}
        >
          <div>© {new Date().getFullYear()} NEOMAP LLC. Бүх эрх хуулиар хамгаалагдсан.</div>
          <div>
            Made with <span style={{ color: "var(--gold-brand)" }}>♥</span> in Mongolia
          </div>
        </div>
      </div>
    </footer>
  );
}
