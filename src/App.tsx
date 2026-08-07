import { useState, useEffect } from "react";
import { CheckCircle, AlertCircle, ArrowRight } from "lucide-react";
import magvetoLogo from "./assets/magveto_cafe_logo.png";
import cafeExterior from "./assets/fuel4887.jpg";
import borbasLogo from "./assets/borbas_webdesign_logo.png";

// Configurable constants
const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/00waEW4UngZW4Dv55T8k800";

const EVENT_DETAILS = {
  name: "OHANA event",
  subtitle: "„Az Ohana hawaiiul azt jelenti család, és a családból senkit nem hagyunk magára.”",
  movieTitle: "Truman Show",
  tagline: "Miért idealizálod a párkapcsolataidat és emberi kapcsolataidat, ahelyett hogy elfogadnád őket olyannak, amilyenek",
  description:
    "Egy különleges filmest, ahol a vetítés után közösen dolgozzuk fel a film üzenetét egy vezetett beszélgetés során. Az este célja, hogy mélyebben megértsd önmagadat, a kapcsolódási mintáidat és azt, mi állhat a nehézségeid mögött.",
  
  // Event card
  dateLabel: "Dátum",
  dateValue: "2026. augusztus 7, péntek",
  timeLabel: "Időpont",
  timeValue: "18:00–21:45",
  movieLabel: "Film",
  movieValue: "Truman Show",
  locationLabel: "Helyszín",
  locationName: "Magvető Café",
  locationAddress: "1074 Budapest, Dohány utca 13.",
  priceLabel: "Jegyár",
  priceValue: "18 000 Ft / fő",

  // Program
  programTitle: "AZ EST MENETE",
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
  const [isSoldOut, setIsSoldOut] = useState<boolean>(true);
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
        setIsSoldOut(true); // Forced sold out
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
        <header style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <h1 className="brand-title">
            OHANA <span className="title-event-italic">event</span>
          </h1>
          <p className="brand-subtitle">{EVENT_DETAILS.subtitle}</p>
          
          {/* Cafe Exterior Image */}
          <div className="cafe-image-container" style={{ marginTop: "1rem" }}>
            <img src={cafeExterior} alt="Magvető Café" className="cafe-exterior-image" />
            <img src={magvetoLogo} alt="Magvető Café Logo" className="cafe-logo-overlay" />
          </div>
        </header>

        {/* Description (placed under the cafe image as requested!) */}
        <section className="movie-title-box" style={{ textAlign: "center" }}>
          <p className="description">{EVENT_DETAILS.description}</p>
        </section>

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

          {/* Film row */}
          <div className="detail-row">
            <span className="detail-row-label">{EVENT_DETAILS.movieLabel}</span>
            <span className="detail-row-value">{EVENT_DETAILS.movieValue}</span>
          </div>

          {/* Theme/Topic row */}
          <div className="detail-row">
            <span className="detail-row-label">Téma</span>
            <span className="detail-row-value">{EVENT_DETAILS.tagline}</span>
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
          <h2 className="program-header-title">{EVENT_DETAILS.programTitle}</h2>
          
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
              <button className="btn btn-soldout" disabled>
                MINDEN JEGY ELKELT
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={handleBuyClick}
                disabled={loadingStatus}
              >
                JEGYVÁSÁRLÁS
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
          <div className="credit-section">
            <a href="https://borbaswebdesign.hu/" target="_blank" rel="noopener noreferrer" className="credit-link">
              <span className="credit-text">készítette</span>
              <img src={borbasLogo} alt="Borbás Webdesign" className="credit-logo" />
            </a>
          </div>
          <p className="copyright-text" style={{ marginTop: "1.75rem" }}>
            © 2026 {EVENT_DETAILS.name}. Minden jog fenntartva.
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
