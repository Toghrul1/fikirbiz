# Requirements Document

## Introduction

Bu feature, istifadəçilərin ChatGPT-yə oxşar bir AI chat interfeysi vasitəsilə Canva ilə inteqrasiya edə bilməsini təmin edir. İstifadəçi natural dil promptları yazaraq Canva-da dizayn, prezentasiya, sosial media postu və digər content növlərini birbaşa yarada bilir. Sistem həmçinin səs girişini dəstəkləyir. Canva MCP (Model Context Protocol) connector-u vasitəsilə AI modeli Canva API-a bağlanır və istifadəçi sorğularını Canva əməliyyatlarına çevirir.

## Glossary

- **Chat_Interface**: İstifadəçinin AI ilə mətn və ya səs vasitəsilə ünsiyyət qurduğu əsas UI komponenti
- **AI_Engine**: İstifadəçi promptlarını emal edən və Canva əməliyyatlarını koordinasiya edən süni intellekt modeli
- **Canva_Connector**: Canva MCP protokolu üzərindən Canva API-a qoşulan inteqrasiya komponenti
- **Prompt**: İstifadəçinin AI-a ötürdüyü mətn və ya səs əsasında yaranan mətn əmri
- **Voice_Input**: İstifadəçinin mikrofon vasitəsilə danışaraq prompt daxil etməsi funksionallığı
- **Canva_Content**: Canva platformasında yaradılan dizayn, prezentasiya, sosial media postu, poster, banner və s.
- **Session**: İstifadəçinin chat sessiyası — başlanğıcdan bitişə qədər olan söhbət axını
- **Message_History**: Cari sessiya daxilindəki bütün istifadəçi və AI mesajlarının sıralı siyahısı
- **Connector_Status**: Canva Connector-un hazırkı bağlantı vəziyyəti (connected / disconnected / error)
- **Loading_Indicator**: Uzun sürən əməliyyatlar zamanı istifadəçiyə gözləmə bildirən vizual komponent

---

## Requirements

### Requirement 1: Chat İnterfeysi

**User Story:** Bir istifadəçi kimi, ChatGPT-yə oxşar bir chat interfeysi istifadə etmək istəyirəm ki, AI ilə rahat ünsiyyət quraraq Canva content-ləri yarada bilim.

#### Acceptance Criteria

1. THE Chat_Interface SHALL "Ask anything" placeholder mətnli mətn daxiletmə sahəsi göstərməlidir.
2. WHEN istifadəçi mətn daxiletmə sahəsinə ən azı bir simvol yazıb göndərmə düyməsinə bassın, THE Chat_Interface SHALL promptu AI_Engine-ə ötürməlidir.
3. IF mətn daxiletmə sahəsi boş deyilsə WHEN istifadəçi Enter klavişini bassın, THEN THE Chat_Interface SHALL məzmunu AI_Engine-ə göndərməlidir; IF sahə boşdursa isə göndərmə baş verməməlidir.
4. THE Chat_Interface SHALL AI_Engine-dən gələn cavabları mesaj baloncuqları şəklində göstərməlidir.
5. THE Chat_Interface SHALL istifadəçi mesajlarını sağa, AI cavablarını isə sola hizalanmış şəkildə göstərməli və fərqli arxa plan rəngləri ilə ayırd etməlidir.
6. WHEN yeni mesaj daxil olsun, THE Chat_Interface SHALL mesaj siyahısını ən son mesajın görünəcəyi şəkildə avtomatik scroll etməlidir.
7. THE Chat_Interface SHALL Message_History-ni cari Session ərzində saxlamalıdır.
8. WHEN tətbiq ilk dəfə yüklənsə, THE Chat_Interface SHALL boş mesaj sahəsi ilə başlamalıdır.
9. WHILE AI_Engine promptu emal edərkən, THE Chat_Interface SHALL daxiletmə sahəsini deaktiv edərək göndərmə düyməsinin yerində yükləmə göstəricisi (spinner) göstərməlidir.
10. IF AI_Engine cavab qaytarmaqda uğursuz olsun (şəbəkə xətası, zaman aşımı daxil olmaqla), THEN THE Chat_Interface SHALL daxiletmə sahəsini yenidən aktiv etməli və istifadəçiyə xəta mesajı ilə yenidən cəhd etmə seçimi göstərməlidir.

---

### Requirement 2: Canva Connector İnteqrasiyası

**User Story:** Bir istifadəçi kimi, Canva-nı chat interfeysinə qoşmaq istəyirəm ki, AI promptlarım vasitəsilə birbaşa Canva-da content yarada bilim.

#### Acceptance Criteria

1. THE Chat_Interface SHALL Canva connector-u aktivləşdirmək üçün "+" işarəli düymə göstərməlidir.
2. WHEN istifadəçi connector düyməsinə bassın, THE Canva_Connector SHALL OAuth 2.0 axını başladaraq Canva hesabı ilə autentifikasiya prosesinə yönləndirməlidir.
3. WHEN Canva hesabı uğurla autentifikasiya olsun, THE Canva_Connector SHALL Connector_Status-u "connected" olaraq yeniləməlidir.
4. THE Chat_Interface SHALL Connector_Status-u 2 saniyə ərzində "connected" (yaşıl), "disconnected" (boz) və ya "error" (qırmızı) vizual göstərici ilə əks etdirməlidir.
5. WHEN şəbəkə bağlantısı kəsilsə, THE Canva_Connector SHALL Connector_Status-u avtomatik olaraq "disconnected" vəziyyətinə yeniləməlidir.
6. WHEN istifadəçinin access token-i müddəti bitərsə, THE Canva_Connector SHALL Connector_Status-u "disconnected" vəziyyətinə keçirərək istifadəçiyə yenidən autentifikasiya bildirişi göstərməlidir.
7. IF Canva API hər hansı xəta kodu qaytarsa (401, 403, 5xx daxil olmaqla), THEN THE Canva_Connector SHALL xəta kateqoriyasını (icazə xətası, server xətası) göstərən mesaj və "Yenidən qoşul" düyməsi təqdim etməlidir.
8. WHILE Canva_Connector "connected" vəziyyətdə olsun, THE AI_Engine SHALL Canva əməliyyatlarını icra edə bilməlidir.
9. WHEN istifadəçi OAuth pəncərəsini bağlayaraq axını ləğv etsə və ya autentifikasiya 120 saniyə ərzində tamamlanmasa, THE Canva_Connector SHALL OAuth axınını dayandırmalı və Connector_Status-u "disconnected" olaraq saxlamalıdır.
10. THE Canva_Connector SHALL autentifikasiya tokenini brauzer qapatıldıqdan sonra da davam edəcək şəkildə (localStorage və ya şifrəli cookie) saxlamalı; token dəyəri heç bir UI elementində və ya şəbəkə cavabında açıq mətndə göstərilməməlidir.

---

### Requirement 3: AI Prompt Emalı və Canva Content Yaratma

**User Story:** Bir istifadəçi kimi, natural dildə prompt yazaraq Canva-da müxtəlif növ content yaratmaq istəyirəm ki, dizayn prosesim sürətlənsin.

#### Acceptance Criteria

1. WHILE Canva_Connector "connected" vəziyyətdə olsun, WHEN istifadəçi content yaratma promptu göndərsin, THE AI_Engine SHALL promptu emal edərək uyğun Canva API əməliyyatlarına çevirməlidir.
2. THE AI_Engine SHALL aşağıdakı Canva content növlərini yaratmağı dəstəkləməlidir: dizayn, prezentasiya, sosial media postu, poster, banner.
3. WHEN AI_Engine Canva_Connector vasitəsilə content uğurla yaratsın, THE Chat_Interface SHALL yaradılan Canva_Content-ə Canva-da açılan tıklanabilir URL şəklində birbaşa link göstərməlidir.
4. WHEN istifadəçinin promptunda content növü və ya mövzu göstərilməmişsə, THE AI_Engine SHALL istifadəçidən content növü (dizayn, prezentasiya, poster, banner, sosial media postu) və mövzunu daxil etməsini tələb etməlidir.
5. IF Canva_Connector "disconnected" vəziyyətdə olduğu halda istifadəçi content yaratma sorğusu göndərsin, THEN THE AI_Engine SHALL istifadəçiyə Canva hesabını qoşmağa dəvət edən mesaj göstərməlidir.
6. WHEN content yaratma əməliyyatı başlasın, THE Chat_Interface SHALL dərhal Loading_Indicator göstərməli; əməliyyat 30 saniyədən çox çəkərsə sistem uğursuzluq kimi qeyd etməlidir.
7. IF əməliyyat icra zamanı şəbəkə və ya sistem xətası baş versə, THEN THE Chat_Interface SHALL Loading_Indicator-u dərhal gizlədərək əvvəlki prompt məzmununu daxiletmə sahəsində saxlamalı və xəta mesajı göstərməlidir.
8. IF Canva API content yaratma sorğusunu rədd etsə (icazə çatışmazlığı, kvota aşımı, etibarsız parametrlər), THEN THE AI_Engine SHALL xəta kateqoriyasını göstərən anlaşılan mesaj qaytarmalıdır.

---

### Requirement 4: Səs Girişi

**User Story:** Bir istifadəçi kimi, mikrofon vasitəsilə danışaraq prompt daxil etmək istəyirəm ki, əllərimi istifadə etmədən Canva content-ləri yarada bilim.

#### Acceptance Criteria

1. THE Chat_Interface SHALL mikrofon aktivləşdirmə düyməsi göstərməlidir.
2. WHEN istifadəçi mikrofon düyməsinə bassın və mikrofon icazəsi hələ verilməmişsə, THE Voice_Input SHALL brauzer icazə sorğusu göstərməlidir.
3. IF istifadəçi mikrofon icazəsi versə, THEN THE Voice_Input SHALL qeyd vəziyyətini başlatmalıdır.
4. WHILE Voice_Input qeyd vəziyyətindədirsə WHEN istifadəçi danışsın, THE Voice_Input SHALL nitq axınını ≤2 saniyə gecikmə ilə real vaxtda mətnə çevirməlidir.
5. WHEN danışıqda 1.5 saniyə fasilə müşahidə edilsə, THE Voice_Input SHALL çevrilmiş mətni mətn daxiletmə sahəsinə yerləşdirməlidir.
6. WHEN istifadəçi mikrofon düyməsinə yenidən bassın, THE Voice_Input SHALL dinləməni dayandırmalı və o ana qədər toplanmış transkripsiyaları daxiletmə sahəsinə yerləşdirməlidir.
7. IF nitq-mətnə çevirmə texniki problem səbəbindən uğursuz olsun, THEN THE Voice_Input SHALL istifadəçiyə xəta bildirişi göstərməli və maksimum 3 dəfə yenidən cəhd etmə mexanizmi təqdim etməlidir.
8. IF mikrofon istifadə edilə bilmir (brauzer dəstəyi yoxdur, icazə rədd edilib, mikrofon əlçatmaz), THEN THE Chat_Interface SHALL mikrofon düyməsini deaktiv göstərməli və istifadəçiyə izahat mesajı göstərməlidir.
9. WHILE Voice_Input aktiv olsun, THE Chat_Interface SHALL audio dalğa animasiyası göstərməlidir.
10. IF Voice_Input aktiv olduğu müddətdə mikrofon icazəsi sistem tərəfindən ləğv edilsə, THEN THE Voice_Input SHALL qeydi dərhal dayandırmalı, istifadəçiyə bildiriş göstərməli və o ana qədər olan transkripsiyaları saxlamalıdır.

---

### Requirement 5: Mesaj Tarixi və Sessiya İdarəetməsi

**User Story:** Bir istifadəçi kimi, əvvəlki söhbətlərimi görmək və yeni söhbət başlatmaq istəyirəm ki, iş axınımı düzgün idarə edə bilim.

#### Acceptance Criteria

1. THE Chat_Interface SHALL sol panel vasitəsilə əvvəlki Session-ların siyahısını göstərməlidir.
2. WHEN istifadəçi əvvəlki sessiyaya klikləsə, THE Chat_Interface SHALL həmin Session-ın Message_History-ni yükləməlidir.
3. IF Message_History yüklənməsi uğursuz olsa, THEN THE Chat_Interface SHALL istifadəçiyə xəta mesajı göstərməli və yenidən cəhd etmə seçimi təqdim etməlidir.
4. THE Chat_Interface SHALL yeni Session başlatmaq üçün "New Chat" düyməsi göstərməlidir.
5. WHEN istifadəçi "New Chat" düyməsinə bassın, THE Chat_Interface SHALL cari Session-ı saxladıqdan sonra boş mesaj sahəsi ilə yeni Session başlatmalıdır.
6. IF tətbiq yükləndikdə aktiv Session mövcud olmasa, THEN THE Chat_Interface SHALL boş mesaj sahəsi göstərməlidir.
7. THE Chat_Interface SHALL hər Session-a avtomatik ad verməlidir — ilk mesajın mövcud simvollarına görə (40 simvola qədər); ilk mesaj 40 simvoldan qısadırsa tam mesaj adı kimi istifadə olunur; sessiyada heç bir mesaj yoxdursa "Yeni Söhbət" adı verilir.
8. IF istifadəçi Session silmə əməliyyatını təsdiq etsə, THEN THE Chat_Interface SHALL həmin Session-ın bütün məlumatlarını (metadata və Message_History daxil olmaqla) birdəfəlik silməlidir.
9. THE Chat_Interface SHALL sol panelin görünürlüğünü əl ilə toggle etmək imkanı verməlidir — ekran ölçüsündən asılı olmayaraq.

---

### Requirement 6: Responsiv Dizayn və Əlçatanlıq

**User Story:** Bir istifadəçi kimi, həm masaüstü, həm də mobil cihazlarda rahat istifadə etmək istəyirəm ki, istənilən yerdə Canva content-ləri yarada bilim.

#### Acceptance Criteria

1. THE Chat_Interface SHALL 320px ilə 2560px arasında bütün viewport genişliklərini heç bir üfüqi sürüşmə olmadan dəstəkləməlidir.
2. WHEN ekran genişliyi 768px-dən az olsun, THE Chat_Interface SHALL sol paneli gizlədərək yalnız söhbət görünüşünü göstərməlidir.
3. WHEN ekran genişliyi 768px-ə bərabər və ya çox olsun, THE Chat_Interface SHALL sol paneli görünür şəkildə bərpa etməlidir.
4. THE Chat_Interface SHALL mətn kontrast nisbəti ≥4.5:1 (normal mətn) və ≥3:1 (böyük mətn) olan WCAG 2.1 AA standartına uyğun rəng sxemindən istifadə etməlidir.
5. THE Chat_Interface SHALL bütün interaktiv elementlərə Tab ilə çatmağı, Enter/Space ilə aktivləşdirməyi və uyğun hallarda Escape ilə bağlamağı dəstəkləməlidir.
6. THE Chat_Interface SHALL hər interaktiv element üçün role, aria-label (və ya aria-labelledby), aria-expanded (toggle elementlər üçün) və aria-live (dinamik məzmun üçün) ARIA atributları təmin etməlidir.
7. THE Chat_Interface SHALL mobil cihazlarda bütün toxunma hədəflərini minimum 44×44px ölçüsündə göstərməlidir.
