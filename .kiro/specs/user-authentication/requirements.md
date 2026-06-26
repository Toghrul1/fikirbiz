# Requirements Document

## Introduction

Bu feature, FikirBiz platforması üçün tam istifadəçi autentifikasiya və rol idarəetmə sistemini əhatə edir. Sistem iki əsas istifadəçi növünü dəstəkləyir: platformanı idarə edən **Admin** istifadəçilər və AI chat interfeysi ilə Canva inteqrasiyasından yararlanan **Müştəri** istifadəçilər. Hər iki rol üçün ayrıca giriş axınları, icazə siyahıları və sessiya idarəetmə mexanizmləri nəzərdə tutulur. Autentifikasiya sistemi mövcud Canva AI connector feature-u ilə tam inteqrasiya olunur — yalnız autentifikasiya edilmiş müştərilər connector-u istifadə edə bilər.

---

## Glossary

- **Auth_System**: İstifadəçi autentifikasiyası, avtorizasiyası və sessiya idarəetməsini həyata keçirən əsas sistem komponenti
- **Admin**: FikirBiz platformasını idarə etmək, istifadəçiləri, sistem ayarlarını və analitikanı idarə etmək səlahiyyətinə malik istifadəçi
- **Customer**: FikirBiz platformasına qeydiyyatdan keçmiş son istifadəçi; AI chat interfeysi və Canva connector-u istifadə edə bilər
- **Role**: İstifadəçinin sistem daxilindəki səlahiyyət səviyyəsini müəyyən edən etiket (`admin` və ya `customer`)
- **Auth_Token**: İstifadəçi autentifikasiyasının uğurlu tamamlanmasından sonra verilən JWT əsaslı kimlik doğrulama nişanı; müddəti 1 saatdır
- **Refresh_Token**: Auth_Token müddəti bitdikdə yeni token almaq üçün istifadə edilən uzunömürlü nişan; müddəti 30 gündür
- **Login_Form**: İstifadəçinin e-poçt ünvanı və şifrəsini daxil etdiyi giriş forması
- **Register_Form**: Yeni müştərinin hesab yaratmaq üçün məlumatlarını daxil etdiyi qeydiyyat forması
- **Admin_Dashboard**: Adminin istifadəçiləri, sistem ayarlarını və analitikanı idarə etdiyi idarəetmə paneli
- **Customer_Dashboard**: Müştərinin AI chat sessiyalarını, Canva connector statusunu və hesab məlumatlarını gördüyü panel
- **Session**: İstifadəçinin uğurlu girişdən çıxışa qədər olan aktiv autentifikasiya dövrü
- **Password_Reset_Flow**: İstifadəçinin unutduğu şifrəni e-poçt vasitəsilə yeniləmə axını
- **Protected_Route**: Yalnız müəyyən rol sahiblərinin daxil ola biləcəyi URL marşrutu
- **Audit_Log**: Sistemdə baş verən kritik əməliyyatların (giriş, çıxış, rol dəyişikliyi, silinmə) zaman damğalı qeydi

---

## Requirements

### Requirement 1: Müştəri Qeydiyyatı

**User Story:** Bir yeni istifadəçi kimi, FikirBiz platformasına qeydiyyatdan keçmək istəyirəm ki, AI chat interfeysi və Canva inteqrasiyasından istifadə edə bilim.

#### Acceptance Criteria

1. WHEN istifadəçi qeydiyyat səhifəsinə daxil olsun, THE Auth_System SHALL ad (maks 50 simvol), soyad (maks 50 simvol), e-poçt ünvanı (maks 254 simvol) və şifrə sahələrindən ibarət Register_Form göstərməlidir.
2. WHEN istifadəçi Register_Form-u dolduraraq göndərsə, THE Auth_System SHALL e-poçt ünvanının unikallığını 2 saniyə ərzində yoxlamalıdır.
3. IF daxil edilmiş e-poçt ünvanı artıq sistemdə mövcuddursa, THEN THE Auth_System SHALL e-poçt sahəsinin yanında "Bu e-poçt ünvanı artıq qeydiyyatdadır" xəta mesajı göstərməlidir.
4. THE Auth_System SHALL şifrənin minimum 8 simvol, ən azı bir böyük hərf, bir rəqəm və bir xüsusi simvol (`!@#$%^&*`) ehtiva etdiyini yoxlamalıdır.
5. IF şifrə tələblərə cavab vermirsə, THEN THE Auth_System SHALL hansı konkret tələbin (uzunluq, böyük hərf, rəqəm, xüsusi simvol) pozulduğunu göstərən xəta mesajı göstərməlidir.
6. THE Auth_System SHALL e-poçt ünvanının RFC 5322 formatına uyğunluğunu yoxlamalıdır.
7. WHEN qeydiyyat uğurla tamamlansın, THE Auth_System SHALL yeni hesabı `customer` rolu ilə yaratmalıdır.
8. WHEN qeydiyyat uğurla tamamlansın, THE Auth_System SHALL istifadəçinin e-poçt ünvanına təsdiq məktubu göndərməyə cəhd etməli; göndərmə uğursuz olsada qeydiyyat prosesi ləğv edilməməlidir.
9. WHEN qeydiyyat uğurla tamamlansın, THE Auth_System SHALL istifadəçini Customer_Dashboard-a yönləndirməlidir.
10. IF eyni e-poçt ünvanından 10 dəqiqə ərzində 5 qeydiyyat cəhdi edilsə, THEN THE Auth_System SHALL növbəti cəhddə formu göndərməni blok etməli və qalan kilid müddətini göstərməlidir.
11. IF şəbəkə və ya server xətası qeydiyyat zamanı baş versə, THEN THE Auth_System SHALL formda daxil edilmiş ad, soyad və e-poçt məlumatlarını qoruyaraq (şifrəni silərək) istifadəçiyə xəta mesajı göstərməlidir.

---

### Requirement 2: İstifadəçi Girişi

**User Story:** Bir qeydiyyatlı istifadəçi kimi, e-poçt ünvanım və şifrəmlə platforma daxil olmaq istəyirəm ki, öz sessiyalarıma daxil ola bilim.

#### Acceptance Criteria

1. WHEN istifadəçi giriş səhifəsinə daxil olsun, THE Auth_System SHALL e-poçt ünvanı və şifrə sahələrindən ibarət Login_Form göstərməlidir.
2. WHEN istifadəçi Login_Form-u dolduraraq göndərsə, THE Auth_System SHALL kimlik doğrulamasını 3 saniyə ərzində tamamlamalıdır.
3. WHEN giriş uğurla tamamlansın, THE Auth_System SHALL istifadəçinin roluna görə müvafiq dashboard-a yönləndirməlidir: `admin` rolu üçün Admin_Dashboard-a, `customer` rolu üçün Customer_Dashboard-a.
4. IF e-poçt ünvanı və ya şifrə yanlışdırsa, THEN THE Auth_System SHALL hansı sahənin yanlış olduğunu açıqlamadan "E-poçt ünvanı və ya şifrə yanlışdır" mesajı göstərməlidir.
5. IF eyni hesabda ardıcıl 5 uğursuz giriş cəhdi edilsə, THEN THE Auth_System SHALL həmin hesabı 15 dəqiqəlik kilidləməlidir.
6. WHEN hesab kilidlənsə, THE Auth_System SHALL istifadəçiyə qalan kilid müddətini dəqiqə ilə bildirməlidir.
7. WHEN giriş uğurla tamamlansın, THE Auth_System SHALL müddəti 1 saat olan Auth_Token verməlidir.
8. WHEN "Məni xatırla" seçimi aktiv olduğu halda giriş uğurla tamamlansın, THE Auth_System SHALL müddəti 30 gün olan Refresh_Token saxlamalıdır.
9. WHEN "Məni xatırla" seçimi aktiv olmadığı halda giriş uğurla tamamlansın, THE Auth_System SHALL Refresh_Token-i brauzer sessiyası bağlandıqda silməlidir.
10. IF şəbəkə xətası giriş zamanı baş versə, THEN THE Auth_System SHALL formda daxil edilmiş e-poçt ünvanını qoruyaraq (şifrəni silərək) xəta mesajı göstərməlidir.
11. THE Auth_System SHALL giriş formunda şifrəni göstər/gizlət funksionallığı təqdim etməlidir.

---

### Requirement 3: Admin Girişi və Admin İdarəetmə Paneli

**User Story:** Bir admin kimi, ayrıca idarəetmə paneli vasitəsilə platforma və istifadəçiləri idarə etmək istəyirəm ki, sistem sağlamlığını qoruyum.

#### Acceptance Criteria

1. WHEN istifadəçi `/admin/login` marşrutuna daxil olsun, THE Auth_System SHALL admin girişi üçün ayrıca Login_Form göstərməlidir.
2. WHEN admin uğurla giriş etsə, THE Auth_System SHALL yalnız `admin` roluna məxsus Admin_Dashboard-a yönləndirməlidir.
3. IF `customer` rolu olan istifadəçi `/admin` marşrutuna daxil olmağa cəhd etsə, THEN THE Auth_System SHALL istifadəçini Customer_Dashboard-a yönləndirməlidir.
4. IF autentifikasiya edilməmiş istifadəçi `/admin` marşrutuna daxil olmağa cəhd etsə, THEN THE Auth_System SHALL istifadəçini `/admin/login` səhifəsinə yönləndirməlidir.
5. THE Admin_Dashboard SHALL bütün qeydiyyatlı müştərilərin siyahısını ad, e-poçt ünvanı, qeydiyyat tarixi və son giriş tarixi sütunları ilə səhifə başına maksimum 50 nəticə göstərməlidir.
6. WHEN admin ən azı 2 simvol daxil edərək axtarış etsə, THE Admin_Dashboard SHALL nəticələri ad və ya e-poçt ünvanına görə 500ms ərzində filtrləməlidir.
7. WHEN admin mövcud müştərinin hesabını deaktiv etsə, THE Auth_System SHALL həmin müştərinin aktiv Auth_Token-lərini ≤1 saniyə ərzində etibarsız etməlidir.
8. WHEN admin deaktiv edilmiş hesabı bərpa etsə, THE Auth_System SHALL hesabı yenidən aktiv etməli, lakin əvvəlki tokenləri bərpa etməməlidir.
9. THE Auth_System SHALL admin tərəfindən edilən bütün idarəetmə əməliyyatlarını (deaktivləşdirmə, bərpa, rol dəyişikliyi) zaman damğası, admin identifikatoru və əməliyyat növü ilə Audit_Log-a qeyd etməlidir.
10. THE Admin_Dashboard SHALL sistem analitikasını — ümumi istifadəçi sayı, bu gün qeydiyyat edilən yeni hesablar, aktiv sessionlar — göstərməlidir.
11. IF admin öz hesabını deaktiv etməyə cəhd etsə, THEN THE Auth_System SHALL əməliyyatı rədd etməli, "Öz hesabınızı deaktiv edə bilməzsiniz" xəta mesajı göstərməli və deaktiv düyməsini deaktiv vəziyyətdə saxlamalıdır.

---

### Requirement 4: Şifrə Sıfırlama

**User Story:** Bir istifadəçi kimi, unutduğum şifrəmi e-poçt vasitəsilə sıfırlamaq istəyirəm ki, hesabıma yenidən daxil ola bilim.

#### Acceptance Criteria

1. THE Auth_System SHALL giriş formasında "Şifrəni unutdum?" linki göstərməlidir.
2. WHEN istifadəçi e-poçt ünvanını daxil edib şifrə sıfırlama sorğusu göndərsə, THE Auth_System SHALL sistemdə mövcud olan e-poçt ünvanlarına sıfırlama linki olan məktub göndərməlidir.
3. THE Auth_System SHALL e-poçt ünvanının sistemdə mövcud olub-olmadığını açıqlamamalı; hər iki halda "Əgər bu e-poçt ünvanı qeydiyyatdadırsa, sıfırlama linki göndəriləcəkdir" mesajı göstərməlidir.
4. THE Auth_System SHALL sıfırlama linkini göndərildikdən 30 dəqiqə sonra etibarsız etməlidir.
5. WHEN istifadəçi etibarlı sıfırlama linkinə klikləsə, THE Auth_System SHALL yeni şifrə daxiletmə forması göstərməlidir.
6. THE Auth_System SHALL yeni şifrənin Requirement 1.4-dəki tələblərə (minimum 8 simvol, bir böyük hərf, bir rəqəm, bir xüsusi simvol) cavab verdiyini yoxlamalıdır.
7. WHEN yeni şifrə uğurla təyin edilsə, THE Auth_System SHALL sıfırlama linkini dərhal etibarsız etməli, istifadəçinin bütün aktiv Session-larını bitirməli və giriş formasına yönləndirməlidir.
8. IF istifadəçi artıq istifadə edilmiş və ya müddəti bitmiş sıfırlama linkinə klikləsə, THEN THE Auth_System SHALL "Bu link artıq etibarsızdır" mesajı və yeni sıfırlama sorğusu göndərmə linki göstərməlidir.
9. IF eyni e-poçt ünvanından 1 saat ərzində 3 sıfırlama sorğusu göndərilibsə, THEN THE Auth_System SHALL dördüncü sorğu cəhdini blok etməli və "Bir saat ərzində yenidən cəhd edin" mesajı göstərməlidir.

---

### Requirement 5: Sessiya İdarəetməsi və Çıxış

**User Story:** Bir istifadəçi kimi, aktivliyi bitdikdə hesabımdan çıxmaq istəyirəm ki, hesabımın təhlükəsizliyi qorunsun.

#### Acceptance Criteria

1. THE Auth_System SHALL bütün autentifikasiya edilmiş səhifələrdə "Çıxış" düyməsi göstərməlidir.
2. WHEN istifadəçi "Çıxış" düyməsinə bassın, THE Auth_System SHALL aktiv Auth_Token-i və Refresh_Token-i server tərəfindən etibarsız etməlidir.
3. WHEN server tərəfindən etibarsızlaşdırma tamamlansın, THE Auth_System SHALL token cookie-lərini silməli və istifadəçini giriş formasına yönləndirməlidir.
4. WHEN Auth_Token-in müddəti bitsə və etibarlı Refresh_Token mövcud olsun, THE Auth_System SHALL 10 saniyə ərzində avtomatik yeni Auth_Token almalıdır.
5. IF Refresh_Token-in müddəti də bitibsə, THEN THE Auth_System SHALL istifadəçinin cari URL-ini saxlamalı və istifadəçini giriş formasına yönləndirməlidir.
6. WHEN istifadəçi uğurla yenidən giriş etsə, THE Auth_System SHALL istifadəçini Requirement 5.5-də saxlanmış URL-ə qaytarmalıdır.
7. WHEN istifadəçinin son əməliyyatından 60 dəqiqə keçsə, THE Auth_System SHALL aktiv Session-ı bitirməli, "Boşdakı müddət aşıldı" bildirişi göstərməli və istifadəçini giriş formasına yönləndirməlidir.
8. THE Auth_System SHALL Protected_Route-lara yalnız etibarlı Auth_Token ilə daxil olmağa icazə verməlidir.
9. IF autentifikasiya edilməmiş istifadəçi Protected_Route-a daxil olmağa cəhd etsə, THEN THE Auth_System SHALL istifadəçini giriş formasına yönləndirməlidir.
10. THE Auth_System SHALL Auth_Token-i yalnız `HttpOnly`, `Secure` və `SameSite=Strict` atributları ilə cookie-də saxlamalı; token dəyəri heç bir UI elementində və ya cavab mətnində açıq mətndə göstərilməməlidir.

---

### Requirement 6: Müştəri Hesab İdarəetməsi

**User Story:** Bir müştəri kimi, öz hesab məlumatlarımı idarə etmək istəyirəm ki, profilimi güncel saxlaya bilim.

#### Acceptance Criteria

1. THE Customer_Dashboard SHALL istifadəçinin adını, soyadını, e-poçt ünvanını və qeydiyyat tarixini göstərməlidir.
2. WHEN müştəri ad və ya soyadını yeniləyib saxlasın, THE Auth_System SHALL dəyişiklikləri 2 saniyə ərzində saxlamalıdır.
3. THE Auth_System SHALL mövcud şifrə doğrulaması olmadan yeni şifrə dəyişikliyinə icazə verməməlidir.
4. WHEN müştəri şifrəsini uğurla dəyişdirsə, THE Auth_System SHALL bütün digər aktiv Session-ları bitirməlidir (cari sessiya istisna olmaqla).
5. THE Customer_Dashboard SHALL müştərinin Canva connector bağlantı statusunu (connected/disconnected/error) göstərməlidir.
6. THE Customer_Dashboard SHALL müştərinin aktiv AI chat sessiyalarının sayını göstərməlidir.
7. IF müştəri hesabını silmək istəsə, THEN THE Auth_System SHALL silmə əməliyyatından əvvəl cari şifrə ilə identifikasiya tələb etməli və "Bu əməliyyat geri qaytarıla bilməz" xəbərdarlığı göstərməlidir.
8. WHEN müştəri hesabı silinsə, THE Auth_System SHALL bütün aktiv Session-ları bitirməli, bütün şəxsi məlumatları 30 gün ərzində tam silməli və bütün chat sessiyalarını istifadəçi identifikatorundan ayırmalıdır.

---

### Requirement 7: Rol Əsaslı Giriş Nəzarəti

**User Story:** Bir sistem arxitektoru kimi, hər istifadəçi növünün yalnız öz səlahiyyətinə uyğun resurslara daxil ola bilməsini istəyirəm ki, məlumat təhlükəsizliyi təmin edilsin.

#### Acceptance Criteria

1. THE Auth_System SHALL hər Protected_Route üçün istifadəçinin rolunu Auth_Token daxilindən yoxlamalıdır.
2. IF Auth_Token mövcud deyilsə və ya etibarsızdırsa, THEN THE Auth_System SHALL sorğunu rədd etməli və istifadəçini giriş formasına yönləndirməlidir.
3. THE Auth_System SHALL `admin` rolu olan istifadəçilərə yalnız Admin_Dashboard, istifadəçi idarəetməsi, sistem ayarları və Audit_Log resurslarına daxil olmaq icazəsi verməlidir.
4. THE Auth_System SHALL `customer` rolu olan istifadəçilərə yalnız Customer_Dashboard, öz AI chat sessiyaları, öz Canva connector-u və öz hesab məlumatlarına daxil olmaq icazəsi verməlidir.
5. IF `customer` rolu olan istifadəçi admin resursuna daxil olmağa cəhd etsə, THEN THE Auth_System SHALL sorğunu rədd etməli və istifadəçini Customer_Dashboard-a yönləndirməlidir.
6. IF `admin` rolu olan istifadəçi başqa bir müştərinin şəxsi AI chat sessiyalarına daxil olmağa cəhd etsə, THEN THE Auth_System SHALL sorğunu rədd etməlidir.
7. THE Auth_System SHALL rol yoxlamasını hər HTTP sorğusunda server tərəfindən həyata keçirməlidir — yalnız client-side yoxlama ilə kifayətlənməməlidir.
8. WHEN istifadəçinin rolu dəyişdirilsə, THE Auth_System SHALL dəyişikliyi 60 saniyə ərzində bütün aktiv Session-lara tətbiq etmək üçün həmin Session-ları etibarsız etməli və yenidən autentifikasiya tələb etməlidir.

---

### Requirement 8: Responsiv Dizayn və Əlçatanlıq

**User Story:** Bir istifadəçi kimi, həm masaüstü, həm mobil cihazlarda rahat giriş edə bilmək istəyirəm ki, hər yerdən hesabıma daxil olum.

#### Acceptance Criteria

1. THE Login_Form SHALL 320px ilə 2560px arasında bütün viewport genişliklərini heç bir üfüqi sürüşmə olmadan dəstəkləməlidir.
2. THE Auth_System SHALL FikirBiz brend rəng palitasına uyğun giriş və qeydiyyat formları göstərməlidir: arxa plan `#EFE7DC` (brand-ivory), CTA düymə `#D4AF37` (brand-gold), form sahəsi `#FFFFFF` (brand-white) ilə `#CACECF` (brand-gray) border.
3. THE Login_Form SHALL mətn kontrast nisbəti ≥4.5:1 (normal mətn) və ≥3:1 (böyük mətn) olan WCAG 2.1 AA standartına uyğun rəng sxemindən istifadə etməlidir.
4. THE Auth_System SHALL bütün form sahələri üçün uyğun `label`, `aria-label` və `aria-describedby` (xəta mesajları üçün) atributları təmin etməlidir.
5. THE Auth_System SHALL bütün interaktiv elementlərə Tab ilə çatmağı, Enter/Space ilə aktivləşdirməyi və Escape ilə modal-ları bağlamağı dəstəkləməlidir.
6. THE Auth_System SHALL mobil cihazlarda bütün toxunma hədəflərini minimum 44×44px ölçüsündə göstərməlidir.
7. WHEN form göndərilib cavab gözlənilsə, THE Auth_System SHALL göndərmə düyməsini deaktiv edərək yükləmə indikatoru göstərməlidir.
