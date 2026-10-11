-- FikirBiz — İlk Admin İstifadəçini Təyin Et
-- Supabase SQL Editor-da işlədin (üstünlük: SQL Editor > New query > Run).
--
-- ⚠️ BU SKRİPT YALNIZ MÖVCUD İSTİFADƏCİNİ admin edir, YENİSİNİ YARATMAIR.
--    Bazada heç bir istifadəci yoxdursa bu skript heç nə etməyəcək.
--    Yeni bazada admin yaratmaq üçün:
--        python -m scripts.create_admin --email admin@fikirbiz.com --password 'Sifre123!'
--    (və ya ADMIN_EMAIL/ADMIN_PASSWORD env dəyərlərini qoy — startup avtomatik yaradır)

-- Seçim 1: Ən köhnə (ilk) qeydiyyatdan keçmiş istifadəçini admin edir
UPDATE users
SET role = 'admin', is_approved = TRUE
WHERE id = (
    SELECT id
    FROM users
    ORDER BY created_at ASC
    LIMIT 1
);

-- Seçim 2 (alternativ): E-poçt ünvanına görə konkret istifadəçini admin edir
-- Yuxarıdakı sorğunu işlətməzdən əvvəl aşağıdakı e-poçtu dəyişin.
-- UPDATE users
-- SET role = 'admin', is_approved = TRUE
-- WHERE email = 'senin@email.com';

-- Yoxlama: admin roluna sahib istifadəçilər
-- SELECT id, first_name, last_name, email, role, is_approved FROM users WHERE role = 'admin';
