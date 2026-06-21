# Starten – deployment-anteckningar

## Inloggning

Sidan är spärrad med ett delat lösenord. Lösenordet är hashad (SHA-256) och ligger
inbakad i `js/auth.js`. Inloggning sparas i `localStorage` så lärare loggar in
**en gång per browser** och slipper sedan.

**Nuvarande lösenord:** `lillas26`

För att byta lösenord:

```bash
# 1) Generera ny hash
printf "nytt-lösenord" | sha256sum | cut -d' ' -f1

# 2) Klistra in i js/auth.js → PWD_HASH
```

För att logga ut manuellt (t.ex. om man kört på fel dator):

```js
// I konsolen:
StartenAuth.logout()
```

---

## Firestore-säkerhetsregler

Reglerna ligger i `firestore.rules`. **De måste aktiveras via Firebase Console
eller Firebase CLI** för att börja gälla — testläget tickar annars ut efter 30
dagar och allt faller.

### Aktivera via webben (enklast)

1. Gå till https://console.firebase.google.com/project/starten-ba789/firestore/rules
2. Klistra in innehållet från `firestore.rules`
3. Klicka **Publish**

### Aktivera via Firebase CLI (för framtida iterationer)

```bash
# En gång:
npm install -g firebase-tools
firebase login
firebase use starten-ba789

# När du ändrar reglerna:
firebase deploy --only firestore:rules
```

### Vad reglerna gör

- **`bank/`** (läsförståelse-texter): vem som helst kan läsa och skapa/uppdatera/
  ta bort, men data måste matcha schemat (max 6 fält, text max 500 tecken, 1-5
  frågor osv).
- **`weeks/`** (per-vecka data): samma princip + doc-id måste matcha mönstret
  `YYYY-vWW`.
- Alla andra collections: **nekas helt**.

Det här ger:
- Skydd mot oavsiktliga schemafel
- Skydd mot enkla script-attacker (felaktig struktur avvisas)
- Skydd mot att någon skapar collections vi inte använder

Det ger **inte**:
- Skydd mot någon som vet schemat och vill spamma riktiga collections
- Identifiering av vem som gjort vad

För skarpare säkerhet, byt till Firebase Auth (anonymt eller med Google-konton)
och uppdatera reglerna till `request.auth != null`.

---

## Backup-strategi

Allt ligger redan dubbelt:
- **Moln**: Firestore (`starten-ba789`)
- **Lokalt**: localStorage på varje lärarens browser (auto-cache)

Om Firestore-projektet skulle försvinna har varje lärare fortfarande sin egen
kopia av senast använda vecka.
