import { AIChatBar } from "@/components/AIChatBar";
import { HomeMap } from "@/components/HomeMap";
import { ModeToggle } from "@/components/ModeToggle";
import { PropertyTypeCards } from "@/components/PropertyTypeCards";
import { RecentlyAdded } from "@/components/RecentlyAdded";

export default function HomePage() {
  return (
    <div className="home-shell">
      <section className="home-hero">
        <div className="home-hero-inner">
          <p className="home-hero-eyebrow">NEOMAP · Үл хөдлөхийн ухаалаг хайлт</p>
          <h1 className="home-hero-title">
            Танд тохирох сууцыг<br />
            <span className="text-(--primary)">газрын зурагтай нэг товчоор</span>
          </h1>
          <p className="home-hero-sub">
            УБ-ын баталгаатай зарууд, AI зөвлөмж, ипотекийн тооцоо нэг дороос.
          </p>
          <div className="home-hero-controls">
            <ModeToggle />
            <AIChatBar />
          </div>
        </div>
      </section>

      <section className="home-types">
        <header className="home-section-head">
          <h2 className="home-section-title">Төрөл сонгох</h2>
          <p className="home-section-sub">
            Хайхыг хүсэж буй үл хөдлөхийнхөө төрлийг сонго
          </p>
        </header>
        <PropertyTypeCards />
      </section>

      <section className="home-map-section">
        <header className="home-section-head">
          <h2 className="home-section-title">Газрын зураг дээр харах</h2>
          <p className="home-section-sub">
            Pin дээр дарж дэлгэрэнгүй мэдээллийг хар
          </p>
        </header>
        <div className="home-map-wrap">
          <HomeMap />
        </div>
      </section>

      <RecentlyAdded />
    </div>
  );
}
