import React, { useState, useEffect } from "react";
import {
  Calendar,
  MapPin,
  Ticket,
  CheckCircle,
  AlertCircle,
  X,
  Film,
  Sparkles,
  Info,
  Lock,
  ArrowRight,
} from "lucide-react";

// Configurable constants - can easily be modified once the final details arrive
const EVENT_DETAILS = {
  categoryBadge: "Filmvetítés & Beszélgetés",
  name: "OHANA Event",
  tagline: "Hogyan értheted meg, hogy miért fáj, amikor kapcsolódni szeretnél másokhoz?",
  movieLabel: "A vetített film",
  movieTitle: "A békés harcos útja",
  movieDuration: "120 perc • Dráma / Inspiráló",
  dateValue: "2026. augusztus 7. (péntek) 18:00 - 22:00",
  locationValue: "Scruton, Veres Pálné utca, Budapest V. kerület",
  priceValue: "18 000",
  aboutTitle: "Az esemény témája",
  aboutText:
    "Hogyan értheted meg, hogy miért fáj, amikor kapcsolódni szeretnél másokhoz? Ezen az estén a filmvetítés mellett közösen boncolgatjuk az emberi kapcsolatok mélységeit, a kapcsolódási sebeket és a köztünk lévő hidak építését egy biztonságos, támogató környezetben.",
  expectationsTitle: "Részletes Program & Fontos Információk",
  expectations: [
    "17:45 - 18:15 | Érkezés és hangolódás a kávézóban.",
    "18:15 - 18:25 | Vezetett meditáció (FONTOS: aki késik a meditáció alatt, nem léphet be a kávézóba, csak a film kezdetére tud majd csatlakozni!).",
    "18:30 - 20:30 | Filmvetítés: A békés harcos útja.",
    "20:30 - 21:45 | Közös beszélgetés az esemény témájáról.",
    "Parkolás: Mivel a helyszín a belvárosban van, javasoljuk, hogy autóval érkezők kalkuláljanak extra időt a parkolásra a pontos érkezéshez.",
  ],
};

function App() {
  // App States
  const [soldCount, setSoldCount] = useState<number | null>(null);
  const [maxTickets, setMaxTickets] = useState<number>(30);
  const [isSoldOut, setIsSoldOut] = useState<boolean>(false);
  const [loadingStatus, setLoadingStatus] = useState<boolean>(true);
  
  // Checkout & Modal States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // URL Notification States
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [showCancel, setShowCancel] = useState<boolean>(false);

  // 1. Check URL parameters for status
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      setShowSuccess(true);
      // Clean query params
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get("cancel") === "true") {
      setShowCancel(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // 2. Fetch sold tickets & status on load
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
      console.error("Error fetching event status:", err);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // 3. Handle Ticket Buy Submit
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail) {
      setFormError("Kérjük, töltse ki az összes mezőt!");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: trimmedName, email: trimmedEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        setFormError(data.error || "Hiba történt a fizetés indítása közben.");
        setIsSubmitting(false);
        return;
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        setFormError("Nem érkezett fizetési hivatkozás a szervertől.");
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error("Checkout redirect error:", err);
      setFormError("Hálózati hiba történt. Kérjük, próbálja meg újra!");
      setIsSubmitting(false);
    }
  };

  const remainingCount = soldCount !== null ? Math.max(0, maxTickets - soldCount) : null;

  return (
    <div className="app-container">
      {/* Dynamic Background Glows */}
      <div className="bg-glow-container">
        <div className="bg-glow-orb-1"></div>
        <div className="bg-glow-orb-2"></div>
      </div>

      {/* URL Status Banners */}
      {showSuccess && (
        <div className="status-banner status-banner-success">
          <div className="status-title">
            <CheckCircle size={24} color="#10b981" />
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
            <AlertCircle size={24} color="#f59e0b" />
            Fizetés megszakítva
          </div>
          <div className="status-desc">
            A tranzakció sikertelen volt vagy megszakadt. Ha továbbra is szeretnél jegyet vásárolni, kérjük próbáld meg újra.
          </div>
        </div>
      )}

      {/* Header */}
      <header>
        <span className="badge">
          <Sparkles size={14} />
          {EVENT_DETAILS.categoryBadge}
        </span>
        <h1>{EVENT_DETAILS.name}</h1>
        <p className="tagline">{EVENT_DETAILS.tagline}</p>
      </header>

      {/* Main Grid Layout */}
      <main>
        {/* Left Column: Details */}
        <section className="event-info card">
          <div className="movie-title-box">
            <div className="movie-label">
              <Film size={14} style={{ marginRight: "4px", verticalAlign: "middle" }} />
              {EVENT_DETAILS.movieLabel}
            </div>
            <div className="movie-title">{EVENT_DETAILS.movieTitle}</div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px" }}>
              {EVENT_DETAILS.movieDuration}
            </div>
          </div>

          <div className="event-details-text">
            <h3 className="section-title">
              <Info size={18} />
              {EVENT_DETAILS.aboutTitle}
            </h3>
            <p>{EVENT_DETAILS.aboutText}</p>
          </div>

          <div className="event-details-text">
            <h3 className="section-title">
              <Sparkles size={18} />
              {EVENT_DETAILS.expectationsTitle}
            </h3>
            <ul>
              {EVENT_DETAILS.expectations.map((item, idx) => (
                <li key={idx}>
                  <CheckCircle size={16} style={{ marginTop: "4px" }} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Right Column: Pricing & Ticket CTA */}
        <section className="ticket-panel card">
          <div className="details-grid">
            <h3 className="section-title" style={{ marginBottom: "0.5rem" }}>
              Részletek
            </h3>

            <div className="detail-item">
              <div className="detail-icon-wrapper">
                <Calendar size={20} />
              </div>
              <div className="detail-info">
                <span className="detail-label">Időpont</span>
                <span className="detail-value">{EVENT_DETAILS.dateValue}</span>
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-icon-wrapper">
                <MapPin size={20} />
              </div>
              <div className="detail-info">
                <span className="detail-label">Helyszín</span>
                <span className="detail-value">{EVENT_DETAILS.locationValue}</span>
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-icon-wrapper">
                <Ticket size={20} />
              </div>
              <div className="detail-info">
                <span className="detail-label">Szabad Helyek</span>
                <span className="detail-value">
                  {loadingStatus ? (
                    "Lekérdezés..."
                  ) : isSoldOut ? (
                    <span style={{ color: "var(--error)", fontWeight: "bold" }}>Megtelt</span>
                  ) : remainingCount !== null ? (
                    `Még ${remainingCount} szabad jegy`
                  ) : (
                    "Elérhető"
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="price-display">
            <span className="price-label">Jegyár / fő</span>
            <div className="price-value">
              {EVENT_DETAILS.priceValue}<span className="price-currency">HUF</span>
            </div>
          </div>

          <div>
            {isSoldOut ? (
              <button className="btn btn-primary" disabled>
                Minden jegy elfogyott
              </button>
            ) : (
              <button
                className="btn btn-primary btn-glow-effect"
                onClick={() => setIsModalOpen(true)}
              >
                Jegyvásárlás
                <ArrowRight size={18} />
              </button>
            )}
            
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "center", marginTop: "1rem" }}>
              Biztonságos online fizetés a Stripe segítségével.
            </p>
          </div>
        </section>
      </main>

      {/* Registration Modal Overlay */}
      <div className={`modal-overlay ${isModalOpen ? "active" : ""}`}>
        <div className="modal-content">
          <button className="modal-close" onClick={() => setIsModalOpen(false)}>
            <X size={20} />
          </button>
          
          <h2 className="modal-title">Jegyvásárlás</h2>
          <p className="modal-subtitle">
            Kérjük, add meg a neved és az e-mail címed a jegy lefoglalásához. A fizetés után azonnal küldjük a visszaigazolást.
          </p>

          <form onSubmit={handleCheckout}>
            <div className="form-group">
              <label htmlFor="name-input" className="form-label">
                Teljes Név
              </label>
              <input
                id="name-input"
                type="text"
                className="form-input"
                placeholder="Minta János"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email-input" className="form-label">
                E-mail Cím
              </label>
              <input
                id="email-input"
                type="email"
                className="form-input"
                placeholder="janos.minta@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            {formError && (
              <div className="error-message">
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-glow-effect"
              style={{ marginTop: "1rem" }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="spinner"></div>
                  Átirányítás...
                </>
              ) : (
                <>
                  Fizetés és Regisztráció
                  <Lock size={16} style={{ marginLeft: "4px" }} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer>
        <p>© 2026 {EVENT_DETAILS.name}. Minden jog fenntartva.</p>
        <p style={{ marginTop: "0.5rem", fontSize: "0.75rem" }}>
          Hoszting: <a href="https://pages.cloudflare.com" target="_blank" rel="noopener noreferrer">Cloudflare Pages</a>
        </p>
      </footer>
    </div>
  );
}

export default App;
