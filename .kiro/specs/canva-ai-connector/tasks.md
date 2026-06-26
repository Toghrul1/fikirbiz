# Implementation Plan: Canva AI Connector

## Overview

Bu plan React + TypeScript frontend, **Python 3.12 + FastAPI** backend, Canva Connect REST API v1, OpenAI GPT-4o function calling, Web Speech API və Zustand state management əsasında inkremental addımlarla həyata keçirilir. Hər tapşırıq əvvəlki üzərindən qurulur və son addımda bütün komponentlər bir-birinə bağlanır.

## Tasks

- [ ] 1. Layihə strukturu, tip sistemi və test mühiti
  - [ ] 1.1 Frontend qovluq strukturunu, TypeScript konfiqurasiyasını, Tailwind CSS və Zustand asılılıqlarını, fast-check PBT kitabxanasını qur; **Python backend üçün `backend/` qovluğu, `pyproject.toml`, FastAPI + uvicorn + httpx + tenacity + pytest-asyncio asılılıqlarını qur**
    - `src/types/index.ts` faylında `Message`, `Session`, `MessageHistory`, `CanvaDesignLink`, `CanvaContentType`, `ConnectorStatus`, `CanvaConnectorState`, `VoiceInputState`, `AppState` interfeyslərini tərif et
    - `backend/app/schemas.py` faylında `ChatRequest`, `CanvaTokenRequest`, `CanvaRefreshRequest` Pydantic modellərini tərif et
    - Vitest + React Testing Library (frontend) və pytest + pytest-asyncio (backend) test mühitlərini qur
    - _Requirements: 1.1–1.10, 2.1–2.10, 3.1–3.8, 4.1–4.10, 5.1–5.9, 6.1–6.7_


- [ ] 2. Zustand store və əsas state idarəetməsi
  - [ ] 2.1 `src/store/appStore.ts` faylında tam Zustand `AppState` store-u yaz
    - `sessions`, `activeSessionId`, `currentMessages`, `isLoading`, `sidebarOpen`, `connector`, `voice` state sahələrini əlavə et
    - `sendMessage`, `loadSession`, `createNewSession`, `deleteSession`, `toggleSidebar`, `startVoiceInput`, `stopVoiceInput`, `initiateCanvaAuth`, `disconnectCanva` action-larını stub kimi (placeholder) əlavə et
    - _Requirements: 1.2, 1.7, 1.9, 5.4, 5.5_

  - [ ]* 2.2 Boş/whitespace input bloklanması üçün property testi yaz
    - **Property 1: Boş və whitespace input bloklanır**
    - `fc.string()` → whitespace-only filter ilə `sendMessage` heç bir mesaj əlavə etmir
    - **Validates: Requirements 1.3**

  - [ ]* 2.3 Non-empty prompt mesaj siyahısına əlavə olunması üçün property testi yaz
    - **Property 2: Non-empty prompt mesaj siyahısına əlavə olunur**
    - `fc.string({minLength:1})` trimmed ilə `currentMessages` uzunluğunun artdığını yoxla
    - **Validates: Requirements 1.2, 1.7**

  - [ ]* 2.4 Loading state qapalılığı və xəta recovery üçün property testi yaz
    - **Property 4: Loading state qapalılığı və xəta recovery**
    - `fc.constantFrom(errorTypes)` ilə `isLoading` false-a dönməsini, input-un aktiv olmasını yoxla
    - **Validates: Requirements 1.9, 1.10**


- [ ] 3. Session idarəetməsi və localStorage persistensiya
  - [ ] 3.1 `src/services/sessionService.ts` faylında session CRUD əməliyyatlarını yaz
    - `localStorage`-da `sessions`, `session_{id}`, `active_session` açarları ilə saxlama/yükləmə məntiqi
    - Session adlandırma: ilk mesajın ≤40 simvolu, boş halda "Yeni Söhbət"
    - Session silmə: metadata + mesaj tarixini `localStorage`-dan tam sil
    - _Requirements: 5.1, 5.2, 5.4, 5.5, 5.6, 5.7, 5.8_

  - [ ] 3.2 Zustand store-un `loadSession`, `createNewSession`, `deleteSession` action-larını `sessionService`-ə bağla
    - `loadSession` uğursuz olduqda xəta vəziyyətini set et
    - _Requirements: 5.2, 5.3, 5.5_

  - [ ]* 3.3 Session adlandırma qaydası üçün property testi yaz
    - **Property 15: Session adlandırma qaydası**
    - `fc.string({maxLength:100})` ilə ≤40 simvol kəsimi qaydalarını yoxla
    - **Validates: Requirements 5.7**

  - [ ]* 3.4 Sessiya silmə tamlığı üçün property testi yaz
    - **Property 16: Sessiya silmə tamlığı**
    - `fc.array(fc.uuid(),{minLength:1})` ilə silindikdən sonra `localStorage`-da qalıq olmadığını yoxla
    - **Validates: Requirements 5.8**

  - [ ]* 3.5 Sidebar toggle idempotentlik üçün property testi yaz
    - **Property 17: Sidebar toggle idempotentlik**
    - `fc.integer({min:1,max:20})` toggle sayı ilə cüt/tək toggle-dan sonra vəziyyəti yoxla
    - **Validates: Requirements 5.9**


- [ ] 4. Token şifrələmə və OAuth xidməti
  - [ ] 4.1 `src/services/tokenEncryption.ts` faylında AES-GCM şifrələmə/deşifrələmə utilit funksiyalarını yaz
    - `encrypt(payload: AuthPayload): EncryptedAuthState` və `decrypt(state: EncryptedAuthState): AuthPayload` funksiyaları
    - Token dəyərini heç bir UI elementinə və ya şəbəkə cavabına keçirmə
    - _Requirements: 2.10_

  - [ ] 4.2 `src/services/authService.ts` faylında OAuth 2.0 PKCE axınını yaz
    - PKCE code verifier/challenge yaratma, authorization URL inşası, OAuth popup/redirect idarəetməsi
    - 120 saniyə timeout: vaxt keçdikdə popup bağlanır, status `disconnected` olur
    - İstifadəçi ləğv etdikdə status `disconnected` olur
    - `POST /api/auth/canva/token` backend endpoint-inə token exchange sorğusu
    - `POST /api/auth/canva/refresh` ilə token yeniləmə
    - Tokenləri `tokenEncryption.ts` vasitəsilə `localStorage`-a şifrəli saxla
    - _Requirements: 2.2, 2.3, 2.6, 2.9, 2.10_

  - [ ]* 4.3 Token saxlama məxfiliyi üçün property testi yaz
    - **Property 11: Token saxlama məxfiliyi**
    - `fc.string({minLength:20})` token ilə `localStorage`-da açıq mətn olmadığını yoxla
    - **Validates: Requirements 2.10**


- [ ] 5. Canva Service və connector state
  - [ ] 5.1 `src/services/canvaService.ts` faylında Canva Connect REST API v1 wrapper-ını yaz
    - `createDesign(type, topic, accessToken)` → `POST /designs` — 30 saniyə timeout
    - Xəta kateqoriyası mapping: 401 → `CANVA_401`, 403 → `CANVA_403`, 5xx → `CANVA_5XX`, kvota → `CANVA_QUOTA`
    - Exponential backoff retry: `maxRetries:3, baseDelay:1000ms, maxDelay:8000ms, retryOn:[500,502,503,504]`
    - _Requirements: 2.7, 2.8, 3.1, 3.2, 3.6, 3.8_

  - [ ] 5.2 Zustand store-un `connector` state sahəsini və `initiateCanvaAuth`/`disconnectCanva` action-larını `authService` + `canvaService`-ə tam bağla
    - Şəbəkə kəsilməsini izlə (`navigator.onLine` / `offline` event), status `disconnected` et
    - Token expire olduqda status `disconnected`, yenidən autentifikasiya bildirişi göstər
    - _Requirements: 2.3, 2.4, 2.5, 2.6_

  - [ ]* 5.3 Connector status UI yenilənməsi üçün property testi yaz
    - **Property 5: Connector status UI yenilənməsi**
    - `fc.constantFrom('connected','disconnected','error')` ilə 2 saniyə ərzində düzgün rəng class-ının render edildiyini yoxla
    - **Validates: Requirements 2.4**

  - [ ]* 5.4 API xəta kodu → kateqoriya mesajı üçün property testi yaz
    - **Property 6: API xəta kodu → kateqoriya mesajı**
    - `fc.constantFrom(401,403,500,502,503)` ilə raw kod əvəzinə kateqoriya mesajının göstərildiyini yoxla
    - **Validates: Requirements 2.7, 3.8**

  - [ ]* 5.5 Connected state-də Canva əməliyyatları icra olunması üçün property testi yaz
    - **Property 7: Connected state-də Canva əməliyyatları icra olunur**
    - `fc.constantFrom('DESIGN','PRESENTATION','SOCIAL_MEDIA','POSTER','BANNER')` ilə API sorğusunun göndərildiyini yoxla
    - **Validates: Requirements 2.8, 3.1, 3.2**

  - [ ]* 5.6 Disconnected-da content yaratmanın bloklanması üçün property testi yaz
    - **Property 9: Disconnected-da content yaratma bloklanır**
    - `fc.constantFrom('DESIGN','PRESENTATION','SOCIAL_MEDIA','POSTER','BANNER')` ilə API sorğusunun göndərilmədiyini yoxla
    - **Validates: Requirements 3.5**

  - [ ]* 5.7 Xəta sonrası prompt məzmununun qorunması üçün property testi yaz
    - **Property 10: Xəta sonrası prompt məzmunu qorunur**
    - `fc.string({minLength:1})` + error type ilə input mətninin dəyişilmədiyini yoxla
    - **Validates: Requirements 3.7**

  - [ ]* 5.8 Design yaratma URL round-trip üçün property testi yaz
    - **Property 8: Design yaratma — URL round-trip**
    - `fc.uuid()` design ID ilə cavab mesajında `edit_url` linkinin mövcudluğunu yoxla
    - **Validates: Requirements 3.3**


- [ ] 6. Backend: AI Gateway, OAuth handler və Canva service endpoint-ləri
  - [ ] 6.1 `backend/app/routers/chat.py` faylında `POST /api/chat` SSE stream endpoint-ini **FastAPI + StreamingResponse** ilə yaz
    - GPT-4o function calling ilə `create_canva_design` tool definisiyasını inteqrasiya et
    - SSE event növləri: `text`, `design_url`, `error`
    - Canva Connector `disconnected` olduqda Canva API-a sorğu göndərmədən mesaj qaytar
    - AI cavab 30 saniyəni keçərsə `AI_TIMEOUT` xətası qaytar, prompt məzmununu saxla
    - _Requirements: 3.1, 3.4, 3.5, 3.6_

  - [ ] 6.2 `backend/app/routers/auth_canva.py` faylında `POST /api/auth/canva/token` və `POST /api/auth/canva/refresh` endpoint-lərini yaz
    - PKCE code verifier doğrulaması, Canva OAuth server ilə **httpx** vasitəsilə token exchange
    - Access token ömrü 4 saat; refresh token ilə yeniləmə
    - `tenacity` ilə exponential backoff retry (network xətaları üçün)
    - _Requirements: 2.2, 2.3, 2.6_

- [ ] 7. Checkpoint — Backend API-ları yoxla
  - Bütün unit testlər keçir (`pytest backend/tests/ -v`). AI Gateway, auth service və canva service testlərinin yaşıl olduğundan əmin ol. Sualların varsa istifadəçiyə müraciət et.


- [ ] 8. Səs girişi (Voice Input) komponenti
  - [ ] 8.1 `src/services/voiceInputService.ts` faylında Web Speech API `SpeechRecognition` wrapper-ını yaz
    - `interimResults: true`, 1.5 saniyə fasilə sonrası transkripsiya əlavə et
    - Mikrofon icazəsi istə: `navigator.mediaDevices.getUserMedia`
    - Mikrofon əlçatmaz/icazə rədd/brauzer dəstəksizliyi vəziyyətlərini aşkar et
    - STT xətalarında max 3 retry (0.5 saniyə gecikmə ilə)
    - Aktiv qeyd zamanı sistem icazəni ləğv edərsə qeydi dərhal dayandır, o ana qədər olan transkripsiyaları saxla
    - _Requirements: 4.1–4.10_

  - [ ] 8.2 Zustand store-un `voice` state sahəsini və `startVoiceInput`/`stopVoiceInput` action-larını `voiceInputService`-ə bağla
    - _Requirements: 4.2, 4.3, 4.6, 4.8, 4.10_

  - [ ]* 8.3 Transkript → input yerləşdirilməsi üçün property testi yaz
    - **Property 12: Səs transkripsiyanın input-a yerləşdirilməsi**
    - `fc.string({minLength:1})` ilə 1.5 saniyə fasilədən sonra input `value`-nun transkripsiya ilə ekvivalent olduğunu yoxla
    - **Validates: Requirements 4.5, 4.6**

  - [ ]* 8.4 STT xəta retry məhdudiyyəti üçün property testi yaz
    - **Property 13: STT xəta retry məhdudiyyəti**
    - `fc.integer({min:1,max:5})` xəta sayı ilə 3-cü cəhddən sonra retry dayandığını yoxla
    - **Validates: Requirements 4.7**

  - [ ]* 8.5 Mikrofon əlçatmaz → düymə deaktiv üçün property testi yaz
    - **Property 14: Mikrofon əlçatmaz → düymə deaktiv**
    - `fc.constantFrom('unsupported','denied','unavailable')` ilə düymənin `disabled` atributunu yoxla
    - **Validates: Requirements 4.8**


- [ ] 9. UI Komponentləri — MessageBubble, ConnectorStatus, VoiceButton
  - [ ] 9.1 `src/components/MessageBubble.tsx` komponentini yaz
    - `role='user'` → sağa hizalanmış CSS class, fərqli arxa plan rəngi
    - `role='assistant'` → sola hizalanmış CSS class
    - `canvaLinks` mövcuddursa Canva-da açılan tıklanabilir `edit_url` linkini göstər
    - Xəta mesajı (`isError=true`) vəziyyətini göstər
    - _Requirements: 1.4, 1.5, 3.3_

  - [ ] 9.2 `src/components/ConnectorStatus.tsx` və `ConnectorButton.tsx` komponentlərini yaz
    - `connected` → yaşıl, `disconnected` → boz, `error` → qırmızı vizual göstərici
    - "+" işarəli connector düyməsi
    - "Yenidən qoşul" düyməsi (error vəziyyətdə)
    - _Requirements: 2.1, 2.4, 2.7_

  - [ ] 9.3 `src/components/VoiceButton.tsx` komponentini yaz
    - Aktiv qeyd zamanı audio dalğa animasiyası göstər
    - Deaktiv vəziyyəti (mikrofon əlçatmaz) + izahat mesajı
    - _Requirements: 4.1, 4.8, 4.9_

  - [ ]* 9.4 Mesaj alignment invariantı üçün property testi yaz
    - **Property 3: Mesaj alignment invariantı**
    - `fc.array(fc.record({role: fc.constantFrom('user','assistant'), content: fc.string()}))` ilə hər mesajın düzgün CSS class-ı daşıdığını yoxla
    - **Validates: Requirements 1.5**


- [ ] 10. UI Komponentləri — MessageInput, MessageList, Sidebar
  - [ ] 10.1 `src/components/MessageInput.tsx` komponentini yaz
    - "Ask anything" placeholder, Enter klavişi ilə göndərmə (boş isə blok)
    - Göndərmə düyməsi (loading zamanı spinner göstər, input deaktiv et)
    - VoiceButton və ConnectorButton-u inteqrasiya et
    - Xəta halında "Yenidən cəhd et" düyməsi, əvvəlki promptu sahədə saxla
    - _Requirements: 1.1, 1.2, 1.3, 1.9, 1.10, 3.7_

  - [ ] 10.2 `src/components/MessageList.tsx` komponentini yaz
    - Mesaj siyahısını render et, yeni mesaj daxil olduqda avtomatik scroll
    - Boş sessiya halında boş vəziyyəti göstər
    - _Requirements: 1.4, 1.6, 1.8_

  - [ ] 10.3 `src/components/Sidebar.tsx`, `SessionList.tsx` və `NewChatButton.tsx` komponentlərini yaz
    - Sol panel: əvvəlki sessiyaların siyahısı, "New Chat" düyməsi, sessiya sil
    - Panel görünürlüyünü toggle et (ekran ölçüsündən asılı olmayaraq)
    - _Requirements: 5.1, 5.2, 5.4, 5.8, 5.9_


- [ ] 11. Responsiv dizayn və əlçatanlıq
  - [ ] 11.1 Tailwind CSS ilə responsive layout tətbiq et
    - 768px-dən az: sol paneli gizlət, yalnız chat görünüşü
    - 768px+ : sol panel görünür
    - 320px–2560px viewport aralığında heç bir üfüqi scroll bar yaratma
    - Bütün toxunma hədəflərini mobil üçün minimum 44×44px et
    - _Requirements: 6.1, 6.2, 6.3, 6.7_

  - [ ] 11.2 Bütün interaktiv elementlərə ARIA atributları və klaviatura navigasiyası əlavə et
    - `role`, `aria-label`/`aria-labelledby`, `aria-expanded` (toggle), `aria-live` (dinamik məzmun)
    - Tab/Shift+Tab focus sırası, Enter/Space aktivləşdirmə, Escape bağlama
    - Mətn kontrast nisbəti ≥4.5:1 (normal), ≥3:1 (böyük) WCAG 2.1 AA
    - _Requirements: 6.4, 6.5, 6.6_

  - [ ]* 11.3 Responsive layout — horizontal overflow yoxluğu üçün property testi yaz
    - **Property 18: Responsive layout — horizontal overflow yoxdur**
    - `fc.integer({min:320,max:2560})` viewport genişliyi ilə horizontal scroll olmadığını yoxla
    - **Validates: Requirements 6.1**

  - [ ]* 11.4 Keyboard navigation əhatəliliyi üçün property testi yaz
    - **Property 19: Keyboard navigation əhatəliliyi**
    - `fc.array(interactiveElementArb)` ilə Tab sırasında bütün elementlərə çatıldığını yoxla
    - **Validates: Requirements 6.5**

  - [ ]* 11.5 ARIA atributları tamlığı üçün property testi yaz
    - **Property 20: ARIA atributları tamlığı**
    - `fc.constantFrom(interactiveElements)` ilə `role`, `aria-label` atributlarının mövcudluğunu yoxla
    - **Validates: Requirements 6.6**

  - [ ]* 11.6 Mobil touch target ölçüsü üçün property testi yaz
    - **Property 21: Mobil touch target ölçüsü**
    - `fc.integer({min:320,max:767})` viewport ilə bütün toxunma hədəflərinin ≥44×44px olduğunu yoxla
    - **Validates: Requirements 6.7**


- [ ] 12. Checkpoint — Frontend komponentlərini yoxla
  - Bütün unit testlər keçir (`npm test -- --run` frontend, `pytest -v` backend). MessageBubble, MessageInput, Sidebar, ConnectorStatus, VoiceButton komponentlərinin testlərinin yaşıl olduğundan əmin ol. Sualların varsa istifadəçiyə müraciət et.

- [ ] 13. Tam inteqrasiya — komponentləri bir-birinə bağla
  - [ ] 13.1 `src/components/ChatArea.tsx` faylını yaz: `MessageList`, `MessageInput`, `ConnectorStatus` komponentlərini Zustand store-a bağla
    - `sendMessage` action-ını çağır, SSE stream-dən `text`/`design_url`/`error` event-lərini idarə et
    - Loading indicator, xəta recovery, boş sessiya vəziyyətlərini idarə et
    - _Requirements: 1.2, 1.4, 1.6, 1.9, 1.10, 3.3, 3.6, 3.7_

  - [ ] 13.2 `src/components/Layout.tsx` və `src/App.tsx` fayllarını yaz: `Sidebar` + `ChatArea`-nı birləşdir, responsive breakpoint-ləri tətbiq et
    - `initialSessionId` prop-u ilə `ChatInterface`-i idarə et
    - Aktiv session yoxdursa boş chat başlat
    - _Requirements: 1.8, 5.6, 6.2, 6.3_

  - [ ] 13.3 OAuth callback URL-ni idarə et: token exchange tamamlandıqdan sonra connector status `connected`-ə keçir, xəta halında `error` state-i göstər
    - _Requirements: 2.2, 2.3, 2.7_

- [ ] 14. Son checkpoint — bütün testlər keçir
  - Bütün property-based testlər, unit testlər və integration testlər keçir (`npm test -- --run` + `pytest -v`). Bütün test suitlərinin yaşıl olduğundan əmin ol. Sualların varsa istifadəçiyə müraciət et.


## Notes

- `*` ilə işarələnmiş sub-tapşırıqlar isteğe bağlıdır — sürətli MVP üçün keçilə bilər
- Hər tapşırıq izlənə bilmə üçün konkret requirement-lərə istinad edir
- Checkpoint-lər inkremental doğrulamağı təmin edir
- Property testləri universal düzgünlük xassələrini yoxlayır (fast-check frontend, hypothesis backend, min 100 iterasiya)
- Unit testlər konkret nümunələri və edge case-ləri yoxlayır
- PBT annotasiya formatı frontend: `// Feature: canva-ai-connector, Property {N}: {property_text}`
- PBT annotasiya formatı backend: `# Feature: canva-ai-connector, Property {N}: {property_text}`

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "3.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "3.2", "4.1"] },
    { "id": 3, "tasks": ["3.3", "3.4", "3.5", "4.2"] },
    { "id": 4, "tasks": ["4.3", "5.1"] },
    { "id": 5, "tasks": ["5.2", "8.1"] },
    { "id": 6, "tasks": ["5.3", "5.4", "5.5", "5.6", "5.7", "5.8", "8.2", "6.1"] },
    { "id": 7, "tasks": ["8.3", "8.4", "8.5", "6.2", "9.1", "9.2", "9.3"] },
    { "id": 8, "tasks": ["9.4", "10.1", "10.2", "10.3"] },
    { "id": 9, "tasks": ["11.1", "11.2"] },
    { "id": 10, "tasks": ["11.3", "11.4", "11.5", "11.6", "13.1"] },
    { "id": 11, "tasks": ["13.2", "13.3"] }
  ]
}
```
