-- ============ SEED CATALOG ============
insert into public.towers (id,name_en,name_ar,tier_en,tier_ar,sub_en,sub_ar,price_label_en,price_label_ar,image,units_total,units_available,sort) values
-- units_total / units_available are DERIVED from office rows by a trigger (see migration 10);
-- the values below are just initial placeholders and get recomputed on the first office change.
('alhamrah','AlHamrah Tower','برج الحمراء','ELITE','النخبة','Elite suites · 26–35 m²','أجنحة النخبة · ٢٦–٣٥ م²','KD 885+','885 د.ك+','/assets/office-luxury.png',0,0,1),
('khaleejia','Khaleejia Tower','برج الخليجية','SMART','اقتصادي','Smart offices · Kuwait City','مكاتب اقتصادية · مدينة الكويت','KD 325+','325 د.ك+','/assets/office-economic.png',0,0,2),
('salmiya','Salmiya — Salem Al-Mubarak','السالمية — شارع سالم المبارك','STARTER','مبتدئ','Starter offices · 15 m²','مكاتب مبتدئة · ١٥ م²','KD 250+','250 د.ك+','/assets/office-glass.png',0,0,3);

insert into public.offices (id,tower_id,unit_no,size_m2,monthly_rent,tenant_name,status,sort) values
('ah-701','alhamrah','701',35,1250.000,'Alghanim Ventures','rented',1),
('ah-702','alhamrah','702',30,1150.000,'Dar Alnukhba RE','rented',2),
('ah-703','alhamrah','703',28,1050.000,'Qimam Family Office','rented',3),
('ah-704','alhamrah','704',26,885.000,'Bayan Capital','rented',4),
('kh-1204','khaleejia','1204',14,340.000,'Dhuha Café','rented',1),
('kh-1205','khaleejia','1205',12,325.000,'Manar Consultancy','rented',2),
('kh-1206','khaleejia','1206',15,350.000,'Nawir Design Studio','rented',3),
('kh-1207','khaleejia','1207',13,330.000,'Yaqut Trading','rented',4),
('sl-201','salmiya','201',15,270.000,'Lumi Beauty','rented',1),
('sl-202','salmiya','202',15,270.000,null,'available',2),
('sl-203','salmiya','203',15,270.000,'Taqa Fitness Co.','rented',3),
('sl-204','salmiya','204',15,270.000,null,'available',4);

-- Service packages + consults + rent-demo + event tickets. price_kwd is the only trusted amount.
insert into public.services (code,kind,category,name_en,name_ar,price_kwd,sort) values
('pkg-bidaya','package','mktg','Bidaya Package','باقة بداية',350.000,1),
('pkg-masar','package','mktg','Masar Package','باقة مسار',490.000,2),
('pkg-wusool','package','mktg','Wusool Package','باقة وصول',700.000,3),
('pkg-strategy','package','mktg','Strategy & Consulting','الاستراتيجية والاستشارات',280.000,4),
('pkg-branding','package','mktg','Branding','الهوية والعلامة',420.000,5),
('pkg-bookkeeping','package','fin','Bookkeeping — monthly','مسك الدفاتر — شهري',90.000,6),
('pkg-statements','package','fin','Financial statements','القوائم المالية',150.000,7),
('pkg-healthcheck','package','fin','Financial health check','الفحص المالي الشامل',220.000,8),
('pkg-audit','package','fin','Audit & compliance prep','تجهيز التدقيق والامتثال',280.000,9),
('pkg-marketentry','package','bd','Market entry study','دراسة دخول السوق',250.000,10),
('pkg-growth','package','bd','Growth roadmap','خارطة النمو',380.000,11),
('pkg-tenders','package','bd','Tenders & gov contracts','المناقصات والعقود الحكومية',450.000,12),
('consult-fa','consult',null,'Consultation — Fahad Almutawa','استشارة — فهد المطوع',60.000,20),
('consult-aa','consult',null,'Consultation — Dr. Abdullah Alfalah','استشارة — د. عبدالله الفلاح',80.000,21),
('rent-kh1204','rent',null,'Monthly rent — Khaleejia 1204','إيجار شهري — الخليجية 1204',340.000,30),
('evt-pricing','event',null,'Workshop — Pricing for F&B founders','ورشة — التسعير لمشاريع الأغذية',15.000,40),
('evt-tenders','event',null,'Seminar — Government tenders 101','ندوة — المناقصات الحكومية 101',10.000,41);
-- (features_en/ar populated in the app repo seed; see full JSON in git history of migration 04.)

insert into public.experts (id,initials,name_en,name_ar,role_en,role_ar,bio_en,bio_ar,skills_en,skills_ar,price_kwd,duration_min,avatar,sort) values
('fa','FA','Fahad Almutawa','فهد المطوع','FOUNDER & CO-CEO','المؤسس والرئيس التنفيذي المشارك',
 'Entrepreneur with a finance degree and 8+ years operating across F&B, exhibitions, marketing, and real estate management.',
 'رائد أعمال بشهادة مالية وخبرة تشغيلية تفوق 8 سنوات في الأغذية والمعارض والتسويق وإدارة العقارات.',
 '["F&B & retail","Marketing","Real estate","Venture building"]','["أغذية وتجزئة","تسويق","عقارات","بناء المشاريع"]',60.000,60,'/assets/avatar-fa.png',1),
('aa','AA','Dr. Abdullah Alfalah','د. عبدالله الفلاح','PARTNER & FINANCIAL ADVISOR','شريك ومستشار مالي',
 'Professor of Finance & Investment at GUST, Ph.D. in Finance and Real Estate Investment, 20+ years of investment experience.',
 'أستاذ التمويل والاستثمار في جامعة الخليج، دكتوراه في التمويل والاستثمار العقاري، وخبرة تتجاوز 20 عامًا.',
 '["Financial analysis","Investment","Real estate appraisal","Funding readiness"]','["تحليل مالي","استثمار","تقييم عقاري","جاهزية التمويل"]',80.000,60,'/assets/avatar-aa.png',2);

insert into public.events (day,month_en,month_ar,title_en,title_ar,sub_en,sub_ar,price_kwd,price_label_en,price_label_ar,image,sort) values
('02','AUG','أغسطس','Workshop — Pricing for F&B founders','ورشة — التسعير لمشاريع الأغذية','Salmiya hub · 10 AM · 18 seats left','مركز السالمية · 10 صباحًا · 18 مقعدًا متاحًا',15.000,'KD 15','15 د.ك','/assets/lounge.png',1),
('09','AUG','أغسطس','Seminar — Government tenders 101','ندوة — المناقصات الحكومية 101','Sharq HQ · 6:30 PM · with Sarh Group','مقر شرق · 6:30 مساءً · مع مجموعة صرح',10.000,'KD 10','10 د.ك','/assets/office-glass.png',2),
('16','AUG','أغسطس','Masarik Talks — Women-led businesses','أحاديث مسارك — رائدات الأعمال','Sharq HQ · 7:00 PM','مقر شرق · 7:00 مساءً',null,'FREE','مجانًا','/assets/office-team.png',3);

insert into public.offers (name_en,name_ar,cat_en,cat_ar,perk_en,perk_ar,discount,image,sort) values
('Circuit Club','نادي سيركت','Fitness · AlHamra Tower','لياقة · برج الحمراء','15% off all memberships','خصم 15% على جميع العضويات','15%','/assets/office-luxury.png',1),
('Backburner Café','مقهى باك برنر','Café · Kuwait City','مقهى · مدينة الكويت','10% off your order','خصم 10% على طلبك','10%','/assets/lounge.png',2),
('Gia Restaurant','مطعم جيا','Dining · Salmiya','مطاعم · السالمية','10% off the bill','خصم 10% على الفاتورة','10%','/assets/office-economic.png',3);

-- Realtime for the cross-persona loop + live payment status
alter publication supabase_realtime add table public.waitlist;
alter publication supabase_realtime add table public.bookings;
alter publication supabase_realtime add table public.lease_requests;
