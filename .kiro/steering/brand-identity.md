---
inclusion: always
---

# FikirBiz Brend Hüviyyəti

## Logo

- **Ad:** FikirBiz
- "Fikir" → ağ (`#FFFFFF`), "Biz" → qızılı (`#D4AF37`)
- Tünd lacivert fon (`#0D1B2A`) üzərində yerləşir
- Qızılı ulduz/işıq elementi "Biz" sözünün yuxarısında
- Fayl: `public/logo.png` və ya `public/logo.svg`

## Rəng Palitası

| Token | Hex | İstifadə |
|---|---|---|
| `brand-ivory` | `#EFE7DC` | Səhifə arxa planı, kart fonu |
| `brand-gold` | `#D4AF37` | Əsas accent, CTA düymələri, aktiv vəziyyətlər, istifadəçi mesaj balonu |
| `brand-khaki` | `#5B5A3D` | İkincil mətn, border-lər, ikincil düymələr |
| `brand-gray` | `#CACECF` | Placeholder, ayırıcılar, disabled state, disconnected status |
| `brand-white` | `#FFFFFF` | Panel/kart fonu, AI mesaj balonu, input fonu |
| `brand-green` | `#217027` | Uğur bildirişi, Canva connector "connected" statusu |
| `brand-navy` | `#0D1B2A` | Sidebar, header, logo fonu, dark elementlər |

## Tailwind Konfiqurasiyası

```typescript
// tailwind.config.ts — bu token-ləri mütləq əlavə et
colors: {
  brand: {
    ivory:  '#EFE7DC',
    gold:   '#D4AF37',
    khaki:  '#5B5A3D',
    gray:   '#CACECF',
    white:  '#FFFFFF',
    green:  '#217027',
    navy:   '#0D1B2A',
  }
}
```

## UI Tətbiq Qaydaları

- Heç vaxt xam hex dəyərləri birbaşa istifadə etmə — həmişə `brand-*` Tailwind token-lərini işlət
- Əsas CTA düymə: `bg-brand-gold text-brand-navy hover:bg-[#B8962E]`
- Sidebar: `bg-brand-navy text-brand-white`
- Səhifə arxa planı: `bg-brand-ivory`
- Input sahəsi: `bg-brand-white border-brand-gray placeholder:text-brand-gray`
- İstifadəçi mesaj balonu: `bg-brand-gold text-brand-navy` (sağa hizalanmış)
- AI mesaj balonu: `bg-brand-white text-brand-navy border border-brand-gray` (sola hizalanmış)
- Connector connected: `text-brand-green` və ya `bg-brand-green`
- Connector disconnected: `text-brand-gray`
- Connector error: `text-red-500`

## Kontrast Uyğunluğu (WCAG 2.1 AA)

- `#0D1B2A` üzərində `#FFFFFF` → kontrast nisbəti ~14:1 ✓
- `#0D1B2A` üzərində `#D4AF37` → kontrast nisbəti ~6:1 ✓
- `#FFFFFF` üzərində `#5B5A3D` → kontrast nisbəti ~7:1 ✓
- `#EFE7DC` üzərində `#0D1B2A` → kontrast nisbəti ~12:1 ✓

## Texniki Stack

### Backend
- **Dil:** Python 3.12
- **Framework:** FastAPI (async)
- **ORM:** SQLAlchemy 2.0 (async) + Alembic (migration)
- **Verilənlər bazası:** PostgreSQL
- **Autentifikasiya:** passlib (bcrypt), python-jose (JWT)
- **Rate limiting:** slowapi
- **E-poçt:** FastAPI-Mail + SMTP
- **Retry:** tenacity (exponential backoff)
- **Test:** pytest + pytest-asyncio + hypothesis (PBT)

### Frontend
- **Dil:** TypeScript
- **Framework:** React 18
- **State:** Zustand
- **Styling:** Tailwind CSS (`brand-*` token-ləri)
- **HTTP:** Axios (interceptor ilə token refresh)
- **Test:** Vitest + React Testing Library + fast-check (PBT)

### Qeydlər
- Backend xəta cavabları həmişə `{"detail": {"code": "ERROR_CODE", "message": "..."}}` formatındadır (FastAPI standartı)
- Heç vaxt Node.js/Express istifadə etmə — backend Python/FastAPI-dir
- Heç vaxt `express-rate-limit`, `Nodemailer`, `bcryptjs` (Node paketi) istifadə etmə
