import { useState, useEffect } from "react";
import { CheckCircle, AlertCircle, ArrowRight } from "lucide-react";
import magvetoLogo from "./assets/magveto_cafe_logo.png";
import cafeExterior from "./assets/fuel4887.jpg";
import borbasLogo from "./assets/borbas_webdesign_logo.png";

// Configurable constants
const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/00waEW4UngZW4Dv55T8k800";

const EVENT_DETAILS = {
  name: "OHANA Event",
  subtitle: "„A másik azt tükrözi, amit látsz benne.”",
  topicTitle: "Önreflexió — hogyan értheted meg és sajátíthatod el a gyakorlatban",
  introText: "Ha szeretnéd megérteni miért történik mindig “ugyanaz” a párkapcsolataidban és bizonyos élethelyzeteidben …",
  
  // Event card
  dateLabel: "Dátum",
  dateValue: "2026. november 17., kedd",
  timeLabel: "Időpont",
  timeValue: "19:30–21:30",
  topicLabel: "Téma",
  locationLabel: "Helyszín",
  locationName: "Magvető Café",
  locationAddress: "1074 Budapest, Dohány utca 13.",
  priceLabel: "Jegyár",
  priceValue: "18 000 Ft / fő",

  // Topics section
  topicsTitle: "Ezen az estén szó lesz arról:",
  topics: [
    "Milyen emberi kapcsolatokra vágysz igazán",
    "Hogyan törheted meg a fájdalmas, ismétlődő élethelyzeteidet",
    "Hogyan tanulhatsz és fejlődhetsz bármilyen élet eseményed által",
    "Hogyan érted meg magad jobban a másikon keresztül — mit mutat meg rólad az, akit irigyelsz, akit szeretsz, aki idegesít..stb",
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

        {/* Intro Section */}
        <section className="movie-title-box" style={{ textAlign: "center" }}>
          <h2 className="event-main-topic">
            {EVENT_DETAILS.topicTitle}
          </h2>
          <p className="description" style={{ marginTop: "1rem", fontStyle: "italic" }}>
            {EVENT_DETAILS.introText}
          </p>
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

          {/* Theme/Topic row */}
          <div className="detail-row">
            <span className="detail-row-label">{EVENT_DETAILS.topicLabel}</span>
            <span className="detail-row-value">{EVENT_DETAILS.topicTitle}</span>
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

        {/* Topics Section */}
        <section className="topics-section">
          <h3 className="section-heading-cormorant" style={{ marginBottom: "2rem" }}>
            {EVENT_DETAILS.topicsTitle}
          </h3>
          
          <div className="topics-grid">
            {EVENT_DETAILS.topics.map((topic, idx) => (
              <div key={idx} className="topic-card">
                <span className="topic-dot"></span>
                <p className="topic-text">{topic}</p>
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
