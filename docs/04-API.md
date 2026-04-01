# API փաստաթղթավորում

**Լրիվ սպեցիֆիկացիա (legacy path).** [Documents/OLD/API-SPECIFICATION.md](../Documents/OLD/API-SPECIFICATION.md)

**Իրականացում.** `app/api/` — REST endpoints (ներքին և արտաքին, Bearer `API_TOKEN` որտեղ կիրառվում է)։

**Անվտանգություն և մուտքի մոդել.** [docs/SECURITY.md](./SECURITY.md) — session, Bearer, landing token, RBAC մատրիցա, rate limit։

Նոր endpoint-ներ ավելացնելիս — թարմացրու՛ սպեցիֆիկացիան կամ ավելացրու՛ բաժին `Documents/`-ում և հղում այստեղ։

---

## Ներքին ադմին (session, ոչ արտաքին API)

| Մեթոդ | Պատյան | Նկարագրություն |
|-------|--------|----------------|
| `GET` | `/api/admin/apartments/export` | Բոլոր կվարտիրների արտահանում `.xlsx` (լիստ `apartments`)։ **Միայն `ADMIN`** (NextAuth session cookie)։ Bearer-only չի բավարարում։ Չի մասնակցում արտաքին ինտեգրացիայի պայմանագրին։ |

Սյունակներ — `lib/apartmentsFullExport.ts` մեջ `APARTMENT_EXPORT_HEADERS` (բազայի `apartments` դաշտեր snake_case + `district_name`, `building_name`)։
