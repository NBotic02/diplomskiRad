# Supportly

Sustav za automatizaciju službe za korisnike. Dolazni e-mail je ulaz, n8n orkestrira AI cjevovod (klasifikacija, RAG, generiranje odgovora), a četiri Spring Boot mikroservisa drže životni ciklus slučajeva. Frontend je React + TypeScript s antd komponentama.

---

# Instalacija i pokretanje sustava

U ovom poglavlju opisuje se postupak postavljanja razvojnog okruženja i lokalnog pokretanja sustava *Supportly*. Sustav je oblikovan tako da se pokreće isključivo preko alata Docker Compose, pri čemu se infrastrukturne komponente (PostgreSQL, RabbitMQ, n8n) i sva četiri mikroservisa zajedno s klijentskom aplikacijom dižu jednom naredbom. Vanjske usluge (Auth0, Google Gemini, Pinecone, Cohere, Gmail) zahtijevaju jednokratnu registraciju i preuzimanje pristupnih ključeva.

## Preduvjeti

Prije pokretanja potrebno je na razvojnom računalu instalirati sljedeće alate:

- **Docker Desktop** (Docker Engine inačice 24 ili novije) — pokreće sve kontejnere.
- **Java Development Kit** (JDK) inačice 21 — nužno samo ako se mikroservisi grade lokalno izvan Dockera.
- **Apache Maven** inačice 3.9 ili novije.
- **Node.js** inačice 22 ili novije — za izgradnju klijentske aplikacije, opcionalno ako se klijent gradi unutar Dockera.
- **Git** — za preuzimanje izvornog koda s GitHub repozitorija.

Instalacija se provjerava sljedećim naredbama:

```bash
docker --version       # Docker version 24.x ili novije
java -version          # openjdk 21.x
mvn -v                 # Apache Maven 3.9.x
node -v                # v22.x
git --version
```

## Preuzimanje izvornog koda

Repozitorij projekta klonira se s GitHub-a:

```bash
git clone https://github.com/<korisnicko-ime>/diplomskiRad.git
cd diplomskiRad
```

Korijenski direktorij sadrži datoteku *docker-compose.yml*, predložak konfiguracije *.env.example*, direktorije pojedinih mikroservisa pod *services/*, klijentsku aplikaciju u *frontend/*, definicije n8n radnih tijekova u *n8n/workflows/* te skripte za inicijalizaciju baze u *infra/postgres/init/*.

## Konfiguracija varijabli okruženja

Sve tajne i konfiguracijske vrijednosti čitaju se iz datoteke *.env* u korijenu repozitorija. Postupak je:

1. Kopirati predložak: `cp .env.example .env`
2. Otvoriti *.env* i ispuniti vrijednosti.

Minimalno potrebne varijable za prvo pokretanje navedene su u sljedećem isječku.

```bash
# PostgreSQL administrativni korisnik
POSTGRES_DB=customer_support
POSTGRES_ADMIN_USER=admin
POSTGRES_ADMIN_PASSWORD=...

# Lozinke za korisnike pojedinih servisa (jedan korisnik po servisu)
CASE_DB_PASSWORD=...
EMPLOYEE_DB_PASSWORD=...
NOTIFICATION_DB_PASSWORD=...
ANALYTICS_DB_PASSWORD=...
N8N_DB_PASSWORD=...

# RabbitMQ administrator
RABBITMQ_USER=rabbit_admin
RABBITMQ_PASSWORD=...

# n8n prijava i kljuc za enkripciju vjerodajnica
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=...
N8N_ENCRYPTION_KEY=...

# Auth0 (popunjava se nakon postavljanja Auth0 tenanta)
AUTH0_DOMAIN=
AUTH0_AUDIENCE=https://customer-support-api
AUTH0_M2M_CLIENT_ID=
AUTH0_M2M_CLIENT_SECRET=

# Google Gemini (jezicni model i ugradnje)
GEMINI_API_KEY=

# Pinecone (vektorska baza)
PINECONE_API_KEY=
PINECONE_INDEX=customer-support-kb

# Cohere (rangiranje rezultata)
COHERE_API_KEY=

# Gmail pristup (App Password)
GMAIL_USER=
GMAIL_APP_PASSWORD=
```

Nasumične vrijednosti za lozinke generiraju se naredbom `openssl rand -base64 24`, a ključ za enkripciju n8n vjerodajnica naredbom `openssl rand -hex 32`.

## Postavljanje vanjskih usluga

Tri vanjske usluge zahtijevaju jednokratnu registraciju i konfiguraciju izvan Docker okruženja.

### Auth0 — pružatelj identiteta

Auth0 se koristi za prijavu internih korisnika preko norme OpenID Connect. Postupak postavljanja:

1. Registrirati besplatni račun na <https://auth0.com/signup>.
2. Stvoriti novi tenant (na primjer *supportly-dev*).
3. U izborniku *Applications* stvoriti aplikaciju vrste *Single Page Application* (za klijentsku aplikaciju). Zabilježiti *Client ID* i *Domain*.
4. U izborniku *APIs* stvoriti novu API definiciju s identifikatorom *https://customer-support-api*. Taj identifikator ide u varijablu `AUTH0_AUDIENCE`.
5. U izborniku *Applications* stvoriti drugu aplikaciju vrste *Machine-to-Machine* koja predstavlja n8n i ovlastiti je za prethodno stvorenu API definiciju. Zabilježiti *Client ID* i *Client Secret* u varijable `AUTH0_M2M_CLIENT_ID` i `AUTH0_M2M_CLIENT_SECRET`.
6. U izborniku *Actions* → *Library* stvoriti *Post-Login Action* koja dodaje prilagođena potraživanja u JWT (*role*, *agent_id*, *department_id*). Implementacija akcije prikazana je u nastavku.
7. U izborniku *User Management* stvoriti barem jednog testnog korisnika za svaku ulogu (*AGENT*, *LEAD*, *ADMIN*). Vrijednosti potraživanja postavljaju se kroz polje *app_metadata* korisnika.

Post-Login Action koja iz *app_metadata* korisnika prepisuje uloge i identifikatore u JWT pod namespace-om *https://supportly*:

```javascript
exports.onExecutePostLogin = async (event, api) => {
  const NS = 'https://supportly';
  const md = event.user.app_metadata || {};

  const role         = md.role         || 'AGENT';
  const agentId      = md.agent_id     || null;
  const departmentId = md.department_id || null;

  api.idToken.setCustomClaim(`${NS}/role`, role);
  api.accessToken.setCustomClaim(`${NS}/role`, role);

  if (agentId) {
    api.idToken.setCustomClaim(`${NS}/agent_id`, agentId);
    api.accessToken.setCustomClaim(`${NS}/agent_id`, agentId);
  }
  if (departmentId) {
    api.idToken.setCustomClaim(`${NS}/department_id`, departmentId);
    api.accessToken.setCustomClaim(`${NS}/department_id`, departmentId);
  }
};
```

Primjer *app_metadata* polja korisnika u Auth0 dashboardu (vrijednosti *agent_id* i *department_id* odgovaraju identifikatorima iz inicijalnih SQL podataka servisa za zaposlenike):

```json
{
  "role": "LEAD",
  "agent_id": "44444444-4444-4444-4444-444444444403",
  "department_id": "33333333-3333-3333-3333-333333333301"
}
```

### Google Gemini — jezični model i ugradnje

Google Gemini koristi se za klasifikaciju ulaznoga upita, izradu vektorskih ugradnji dokumenata pomoću modela *text-embedding-001* i sastavljanje konačnog odgovora generativnim modelom. Postupak je:

1. Otvoriti Google AI Studio na adresi <https://aistudio.google.com>.
2. U izborniku *Get API Key* generirati ključ i pohraniti ga u varijablu `GEMINI_API_KEY`.

### Pinecone — vektorska baza

Pinecone se koristi kao indeks baze znanja u kojem se pohranjuju vektorske ugradnje dokumenata. Postupak je:

1. Registrirati besplatni račun na <https://app.pinecone.io>.
2. Stvoriti novi indeks s dimenzijom koja odgovara izabranom modelu ugradnje (768 za *text-embedding-001*) i metrikom kosinusne sličnosti.
3. U izborniku *API Keys* generirati ključ i pohraniti ga u varijablu `PINECONE_API_KEY`. Ime indeksa pohraniti u varijablu `PINECONE_INDEX`.

### Cohere — rangiranje rezultata

Cohere Rerank koristi se za drugi prolaz rangiranja kandidata dobivenih iz Pinecone pretrage. Postupak je:

1. Registrirati račun na <https://dashboard.cohere.com>.
2. U izborniku *API Keys* generirati ključ i pohraniti ga u varijablu `COHERE_API_KEY`.

### Gmail — ulazna i odlazna pošta

Za primanje dolazne pošte i slanje odgovora koristi se Gmail račun u dva odvojena toka:

1. Otvoriti zasebni Gmail račun namijenjen sustavu.
2. Uključiti dvostruku potvrdu identiteta na računu.
3. Generirati lozinku za aplikaciju (engl. *App Password*) na adresi <https://myaccount.google.com/apppasswords> i pohraniti je u varijablu `GMAIL_APP_PASSWORD`. Ta se lozinka koristi za SMTP slanje iz servisa za slučajeve.
4. Za n8n radni tijek čitanja dolazne pošte koristi se Gmail OAuth tok unutar n8n sučelja.

## Pokretanje infrastrukture

Kada je datoteka *.env* popunjena, cijeli infrastrukturni sloj diže se jednom naredbom iz korijenskog direktorija:

```bash
docker compose up -d
```

Stanje kontejnera provjerava se naredbom `docker compose ps`. Svi servisi trebaju biti u stanju *healthy* ili *running*. Korisnička sučelja dostupna su na sljedećim adresama:

- **Klijentska aplikacija**: <http://localhost>
- **n8n sučelje**: <http://localhost:5678>, prijava vjerodajnicama iz *.env*
- **RabbitMQ Management**: <http://localhost:15672>, prijava vjerodajnicama iz *.env*
- **Spring Boot servisi**: <http://localhost:8081>–<http://localhost:8084> (REST krajnje točke)

Ako neki kontejner ne pokrene se uspješno, dnevnik se ispisuje naredbom `docker compose logs <ime_servisa>`.

## Uvoz radnih tijekova u n8n

Definicije radnih tijekova nalaze se u repozitoriju u direktoriju *n8n/workflows/* kao JSON datoteke. Nakon uvoza potrebno je u n8n sučelju ručno stvoriti i povezati vjerodajnice za svaki vanjski čvor, kao i kod ostalih ranije opisanih usluga. Postupak je sljedeći:

1. Otvoriti <http://localhost:5678> i prijaviti se vjerodajnicama iz *.env*.
2. Otvoriti izbornik *Workflows* → *Import from File*.
3. Učitati redom datoteke *01-email-intake.json*, *02-data-insertion.json* i *03-error-handler.json*.
4. Za svaki uvezeni tijek prilagoditi vjerodajnice:
    - Za Gmail čvorove (*Gmail Trigger*, *Gmail Send*) odabrati opciju *Create New Credential* i provesti OAuth 2.0 tijek prema vlastitom Gmail računu.
    - Za Google Gemini čvorove odabrati vjerodajnicu s pohranjenim `GEMINI_API_KEY`.
    - Za Pinecone i Cohere čvorove odabrati vjerodajnice s pohranjenim `PINECONE_API_KEY` i `COHERE_API_KEY`.
    - Za HTTP Request čvorove koji pozivaju Spring Boot servise odabrati *OAuth2 — Client Credentials* vjerodajnicu s podacima iz `AUTH0_M2M_*` polja.
5. Glavni i tijek za rukovanje pogreškama pohraniti i aktivirati prekidačem *Active* u gornjem desnom kutu uređivača. Tijek za punjenje baze znanja ostaje neaktivan i pokreće se ručno po unošenju nove dokumentacije.

## Provjera ispravnoga rada

Nakon što su svi koraci provedeni, ispravnost postavljanja provjerava se sljedećim radnjama:

1. U pregledniku otvoriti <http://localhost>. Klijentska aplikacija preusmjerava na Auth0 prijavnu stranicu.
2. Prijaviti se vjerodajnicama jednoga od testnih korisnika stvorenih u Auth0.
3. Nakon uspješne prijave provjeriti da se prikazuje početni zaslon s prikazima slučajeva, kalendara i statistike.
4. Poslati testnu poruku s vanjskoga računa elektroničke pošte na javnu adresu sustava i provjeriti u sučelju n8n-a (izbornik *Executions*) da se tijek *01-email-intake* pokrenuo i završio uspješno.
5. U klijentskoj aplikaciji provjeriti pojavljivanje novog slučaja: u stanju *RESOLVED* ako je AI sustav samostalno odgovorio, u stanju *NEW* ako je upit eskaliran ljudskom agentu.

Sustav je time u potpunosti postavljen i spreman za uporabu.

## Zaustavljanje i ponovno pokretanje

Privremeno zaustavljanje sustava bez gubitka podataka:

```bash
docker compose stop
```

Ponovno pokretanje (s očuvanim stanjem baze i radnih tijekova):

```bash
docker compose start
```

Potpuno brisanje stanja (briše bazu i sve uvezene radne tijekove, korisno pri ponovnom razvojnom postavljanju):

```bash
docker compose down -v
```
