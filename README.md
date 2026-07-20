# Esemény Jegyértékesítő Landing Page (Cloudflare Pages)

Ez a projekt egy egyoldalas, prémium dizájnú, mobilbarát landing page és jegyértékesítő rendszer, amelyet **Cloudflare Pages** környezetre terveztünk. 

A projekt magában foglalja a React frontendet (Vite-tel építve) és a Cloudflare Pages Functions backend API-kat a fizetés, a Google Táblázat nyilvántartás és a visszaigazoló e-mailek automatikus kezeléséhez.

---

## Főbb Funkciók
1. **Biztonságos Fizetés**: Stripe Checkout integráció (nem tárolunk kártyaadatokat, közvetlenül a Stripe biztonságos oldalára irányítjuk a vásárlót).
2. **Jegylimit Kezelés**: Valós idejű lekérdezés a Google Táblázatból; ha a jegyek elfogynak, a rendszer automatikusan letiltja a vásárlást, és megjeleníti a megtelt üzenetet.
3. **Automatikus Nyilvántartás**: Sikeres fizetés után a vásárló adatai (Név, E-mail, Vásárlás időpontja, státusz) automatikusan bekerülnek a megadott Google Táblázatba.
4. **Visszaigazoló E-mail**: A sikeres vásárlásról a rendszer automatikus visszaigazolást küld a Resend API segítségével.

---

## Helyi Fejlesztés és Futtatás

Mivel a projekt Cloudflare Pages Functions (backend) funkciókat használ, a hagyományos `npm run dev` csak a frontendet indítja el. A teljes alkalmazás (frontend + backend API-k) teszteléséhez a **Wrangler** CLI eszközt használjuk.

### 1. Telepítés
Telepítsd a csomagokat:
```bash
npm install
```

### 2. Környezeti Változók Beállítása
Másold le a `.env.example` fájlt `.dev.vars` néven a projekt gyökerében:
```bash
cp .env.example .dev.vars
```
Nyisd meg a `.dev.vars` fájlt, és töltsd ki a szükséges hitelesítő adatokkal (Stripe, Google Sheets, Resend).

### 3. Futtatás Helyben
1. **Építsd fel a frontendet:**
   ```bash
   npm run build
   ```
2. **Indítsd el a Wrangler helyi szervert:**
   ```bash
   npx wrangler pages dev dist
   ```
Ez elindítja a teljes alkalmazást a [http://localhost:8787](http://localhost:8787) címen. Ha módosítod a frontendet, futtasd újra az `npm run build` parancsot a frissítéshez. (Ha csak a backend `/functions` fájlokat módosítod, a Wrangler azonnal frissíti azokat újraépítés nélkül).

---

## Integrációk Beállítása

### 1. Google Sheets Integráció
Hogy a rendszer írni tudjon a Google Táblázatodba:
1. Hozz létre egy új Google Táblázatot. A táblázat első sorába írd be a fejlécet:
   * `A1: Név` | `B1: E-mail` | `C1: Vásárlás időpontja` | `D1: Státusz` | `E1: Tranzakció ID`
2. Menj a [Google Cloud Console](https://console.cloud.google.com/) oldalra, hozz létre egy projektet, és engedélyezd a **Google Sheets API**-t.
3. Hozz létre egy **Service Accountot** (Szolgáltatásfiók), és tölts le hozzá egy **JSON kulcsot**.
4. Nyisd meg a letöltött JSON fájlt:
   * A `client_email` értéket másold a `.dev.vars` fájl `GOOGLE_SERVICE_ACCOUNT_EMAIL` mezőjébe.
   * A `private_key` teljes tartalmát másold a `GOOGLE_PRIVATE_KEY` mezőbe (a `\n` karakterekkel együtt, idézőjelek között).
5. Nyisd meg a Google Táblázatodat a böngészőben, és a **Megosztás** gombbal oszd meg a Service Account e-mail címével (adj neki **Szerkesztő / Editor** jogot).
6. A táblázat URL-jéből másold ki a táblázat ID-ját (a `/d/` és `/edit` közötti rész) a `GOOGLE_SPREADSHEET_ID` változóba.

### 2. Stripe Fizetési Integráció
1. Regisztrálj egy [Stripe](https://stripe.com) fiókot és válts **Test Mode** (Teszt üzemmód) állapotba.
2. A Dashboard-ról másold ki a **Secret key**-t (sk_test_...) a `.dev.vars` fájl `STRIPE_SECRET_KEY` mezőjébe.
3. **Webhooks tesztelése helyben:**
   * Töltsd le a Stripe CLI-t.
   * Futtasd a terminálban: `stripe login`
   * Futtasd a webhook továbbítást a helyi szerverre:
     ```bash
     stripe listen --forward-to localhost:8787/api/webhook
     ```
   * A kapott `whsec_...` aláírástitkot másold a `.dev.vars` fájl `STRIPE_WEBHOOK_SECRET` mezőjébe.

### 3. Resend E-mail Integráció
1. Regisztrálj a [Resend](https://resend.com) oldalon.
2. Hozz létre egy API kulcsot, és másold a `RESEND_API_KEY` változóba.
3. Alapértelmezésben teszt módban csak a saját regisztrált e-mail címedre tudsz levelet küldeni. Élesítéshez hitelesítsd a saját domainedet a Resend-ben, és állítsd be az `EMAIL_FROM` változót.
