import { useState, useEffect } from "react";
import { CheckCircle, AlertCircle, ArrowRight } from "lucide-react";

// Configurable constants
const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/test_9B66oG8dt5nGcPhfyFa3u00";

const EVENT_DETAILS = {
  name: "OHANA",
  subtitle: "Cinema Evening • Community • Self-discovery",
  movieTitle: "A Békés Harcos útja",
  tagline: "Hogyan értheted meg, hogy miért nem tudsz igazán kapcsolódni másokhoz?",
  description:
    "Egy különleges filmest, ahol a vetítés után közösen dolgozzuk fel a film üzenetét egy vezetett beszélgetés során. Az este célja, hogy mélyebben megértsd önmagadat, a kapcsolódási mintáidat és azt, mi állhat a nehézségeid mögött.",
  
  // Event card
  dateLabel: "Dátum",
  dateValue: "2026. augusztus 7. (péntek)",
  timeLabel: "Időpont",
  timeValue: "18:00–21:45",
  locationLabel: "Helyszín",
  locationName: "Scruton",
  locationAddress: "1053 Budapest, Veres Pálné utca 12.",
  priceLabel: "Jegyár",
  priceValue: "18 000 Ft / fő",

  // Program
  programTitle: "Az este menete",
  programItems: [
    {
      time: "17:45–18:15",
      title: "Érkezés",
    },
    {
      time: "18:15–18:25",
      title: "Vezetett meditáció",
      warning:
        "Kérjük, hogy a meditáció ideje alatt már ne érkezz. Amennyiben később érkezel, a kávézóba csak a filmvetítés kezdetekor tudsz belépni.",
    },
    {
      time: "18:30–20:30",
      title: "Filmvetítés",
    },
    {
      time: "20:30–21:45",
      title: "Közös beszélgetés és feldolgozás",
    },
  ],

  // Important Note
  noteTitle: "Fontos tudnivaló",
  noteText:
    "A helyszín Budapest belvárosában található, ezért ha autóval érkezel, kérjük, számolj extra idővel a parkolás miatt, hogy nyugodtan és időben megérkezhess.",

  // Ticket Sale
  saleTitle: "Jegyvásárlás",
  salePrice: "18 000 Ft / fő",
  saleText:
    "A “Jegyvásárlás” gombra kattintva a rendszer átirányít a biztonságos online fizetési felületre, ahol néhány kattintással meg tudod vásárolni a jegyed.",
  saleSubtext:
    "Sikeres fizetés után automatikusan visszaigazoló e-mailt kapsz a vásárlásodról, valamint minden fontos információról az eseménnyel kapcsolatban.",
  
  // Sign off
  signOffText: "Szeretettel várlak.",
};

function App() {
  // Capacity & Status states
  const [soldCount, setSoldCount] = useState<number | null>(null);
  const [maxTickets, setMaxTickets] = useState<number>(35);
  const [isSoldOut, setIsSoldOut] = useState<boolean>(false);
  const [loadingStatus, setLoadingStatus] = useState<boolean>(true);

  // URL Status states
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [showCancel, setShowCancel] = useState<boolean>(false);

  // 1. Parse success/cancel from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      setShowSuccess(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get("cancel") === "true") {
      setShowCancel(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // 2. Fetch sold ticket count to handle limit check
  const fetchStatus = async () => {
    try {
      setLoadingStatus(true);
      const res = await fetch("/api/status");
      if (res.ok) {
        const data = await res.json();
        setSoldCount(data.soldCount);
        setMaxTickets(data.maxTickets);
        setIsSoldOut(data.isSoldOut);
      }
    } catch (err) {
      console.error("Error fetching event capacity status:", err);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // 3. Handle Buy Click (direct Stripe redirect)
  const handleBuyClick = () => {
    window.location.href = STRIPE_PAYMENT_LINK;
  };

  const remainingCount = soldCount !== null ? Math.max(0, maxTickets - soldCount) : null;

  return (
    <div className="app-container">
      {/* Background glow effects */}
      <div className="bg-glow-container">
        <div className="bg-glow-orb-1"></div>
        <div className="bg-glow-orb-2"></div>
      </div>

      {/* URL Status Banners */}
      {showSuccess && (
        <div className="status-banner status-banner-success">
          <div className="status-title">
            <CheckCircle size={18} color="#81c784" />
            Sikeres jegyvásárlás!
          </div>
          <div className="status-desc">
            Köszönjük a regisztrációt. A visszaigazoló e-mailt a fontos tudnivalókkal elküldtük az e-mail címedre. Találkozunk az eseményen!
          </div>
        </div>
      )}

      {showCancel && (
        <div className="status-banner status-banner-cancel">
          <div className="status-title">
            <AlertCircle size={18} color="#e57373" />
            Fizetés megszakítva
          </div>
          <div className="status-desc">
            A tranzakció megszakadt. Amennyiben mégis szeretnél jegyet vásárolni, kérjük próbáld meg újra.
          </div>
        </div>
      )}

      <div className="main-content">
        {/* Header */}
        <header>
          <h1 className="brand-title">{EVENT_DETAILS.name}</h1>
          <p className="brand-subtitle">{EVENT_DETAILS.subtitle}</p>
          
          <div className="movie-title-box">
            <h2 className="movie-title">{EVENT_DETAILS.movieTitle}</h2>
            <p className="tagline">{EVENT_DETAILS.tagline}</p>
            <p className="description">{EVENT_DETAILS.description}</p>
          </div>
        </header>

        <div className="section-divider"></div>

        {/* Event Details Card */}
        <section className="event-details-card">
          <div className="detail-row">
            <span className="detail-row-label">{EVENT_DETAILS.dateLabel}</span>
            <span className="detail-row-value">{EVENT_DETAILS.dateValue}</span>
          </div>

          <div className="detail-row">
            <span className="detail-row-label">{EVENT_DETAILS.timeLabel}</span>
            <span className="detail-row-value">{EVENT_DETAILS.timeValue}</span>
          </div>

          <div className="detail-row">
            <span className="detail-row-label">{EVENT_DETAILS.locationLabel}</span>
            <span className="detail-row-value">
              {EVENT_DETAILS.locationName}
              <span style={{ display: "block", fontSize: "15px", color: "var(--text-secondary)", fontWeight: 300, marginTop: "0.2rem" }}>
                {EVENT_DETAILS.locationAddress}
              </span>
            </span>
          </div>

          <div className="detail-row">
            <span className="detail-row-label">{EVENT_DETAILS.priceLabel}</span>
            <span className="detail-row-value price">{EVENT_DETAILS.priceValue}</span>
          </div>
        </section>

        <div className="section-divider"></div>

        {/* Schedule */}
        <section>
          <h3 className="section-heading-cormorant">{EVENT_DETAILS.programTitle}</h3>
          
          <div className="program-timeline">
            {EVENT_DETAILS.programItems.map((item, idx) => (
              <div key={idx} className="program-item">
                <span className="program-time">{item.time}</span>
                <span className="program-title">{item.title}</span>
                {item.warning && (
                  <p className="program-description warning">{item.warning}</p>
                )}
              </div>
            ))}
          </div>
        </section>

        <div className="section-divider"></div>

        {/* Important Note */}
        <section className="important-note-card">
          <h4 className="important-note-title">{EVENT_DETAILS.noteTitle}</h4>
          <p className="important-note-text">{EVENT_DETAILS.noteText}</p>
        </section>

        <div className="section-divider"></div>

        {/* Ticket Sale Card */}
        <section className="ticket-sale-card">
          <h3 className="section-heading-cormorant" style={{ marginBottom: "1rem" }}>
            {EVENT_DETAILS.saleTitle}
          </h3>
          
          {loadingStatus ? (
            <div className="capacity-badge capacity-badge-available">
              Szabad helyek lekérdezése...
            </div>
          ) : isSoldOut ? (
            <div className="capacity-badge capacity-badge-soldout">
              Az esemény megtelt, a jegyek elfogytak.
            </div>
          ) : remainingCount !== null ? (
            <div className="capacity-badge capacity-badge-available">
              Még {remainingCount} szabad hely érhető el
            </div>
          ) : null}

          <div className="ticket-price-display">
            {EVENT_DETAILS.salePrice}
          </div>

          <p className="ticket-sale-desc">
            {EVENT_DETAILS.saleText}
            <span style={{ display: "block", marginTop: "1rem" }}>
              {EVENT_DETAILS.saleSubtext}
            </span>
          </p>

          <div>
            {isSoldOut ? (
              <button className="btn btn-primary" disabled>
                Elfogyott
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={handleBuyClick}
                disabled={loadingStatus}
              >
                Jegyvásárlás
                <ArrowRight size={16} style={{ marginLeft: "8px" }} />
              </button>
            )}
          </div>
        </section>

        {/* Closing sign-off */}
        <div className="sign-off">
          {EVENT_DETAILS.signOffText}
        </div>

        {/* Footer */}
        <footer>
          <p>© 2026 {EVENT_DETAILS.name}. Minden jog fenntartva.</p>
          <p style={{ marginTop: "0.5rem", fontSize: "11px" }}>
            Hoszting: <a href="https://pages.cloudflare.com" target="_blank" rel="noopener noreferrer">Cloudflare Pages</a>
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
