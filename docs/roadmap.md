# Sprint Checklist (100% Tamamlanma Planı)

Bu dosya, projenin sprint sprint tamamlanma planını içerir.

Kural:

- Sprint, kendi `DoD` (Definition of Done) maddeleri tam karşılanmadan tamamlanmış sayılmaz.
- Toplam tamamlanma oranı, tamamlanan sprint ağırlıklarının toplamıdır.

## Tamamlanma Özeti

- [x] Sprint 0 - Proje Sağlamlaştırma (5%)
- [ ] Sprint 1 - Domain Temelleri (10%)
- [ ] Sprint 2 - Ticket Yaşam Döngüsü (10%)
- [ ] Sprint 3 - RBAC ve Kimlik Katmanı (8%)
- [ ] Sprint 4 - SLA ve Escalation (10%)
- [ ] Sprint 5 - Timeline, Audit, Worklog (10%)
- [ ] Sprint 6 - Attachment Yönetimi (8%)
- [ ] Sprint 7 - Service Request Approval + Complaint (8%)
- [ ] Sprint 8 - Reporting ve Dashboard Veri Katmanı (8%)
- [ ] Sprint 9 - API Sertleştirme ve Hata Yönetimi (8%)
- [ ] Sprint 10 - Frontend Uçtan Uca Akışlar (8%)
- [ ] Sprint 11 - Test, Güvenlik, Performans, Release (7%)

Toplam: **100%**

## Sprint 0 - Proje Sağlamlaştırma (5%)

Hedef: Geliştirme temelini stabil hale getirmek.

Checklist:

- [x] Monorepo workspace komutlarının CI ve localde stabil çalışması
- [x] `pnpm-lock.yaml` güncel ve repoda commitlenmiş olması
- [x] `.gitignore`, `.gitattributes`, `.editorconfig` doğrulanması
- [x] README ve docs indeksinin güncel olması

DoD:

- [x] `pnpm build`, `pnpm test`, `pnpm lint` komutları pipeline’da çalışıyor
- [x] Dokümantasyon giriş sayfaları eksiksiz

## Sprint 1 - Domain Temelleri (10%)

Hedef: Ticket aggregate ve temel iş kurallarını tamamlamak.

Checklist:

- [ ] Ticket entity ve value object sınırlarının netleştirilmesi
- [x] Incident/ServiceRequest ayrımının domain seviyesinde doğrulanması
- [x] Priority matrisi (Urgency x Impact) testleri
- [x] Status transition policy testlerinin genişletilmesi

DoD:

- [ ] Domain policy test coverage >= hedeflenen minimum seviye
- [x] Geçersiz transition senaryoları 409 ile yakalanıyor

## Sprint 2 - Ticket Yaşam Döngüsü (10%)

Hedef: Ticket yaşam döngüsünün uçtan uca yönetimi.

Checklist:

- [x] NEW -> IN_PROGRESS -> WAITING_FOR_CUSTOMER -> RESOLVED -> CLOSED akışının tamamlanması
- [ ] Reopen senaryosunun uygulanması (`RESOLVED -> IN_PROGRESS`)
- [x] Manager override reason zorunluluğu
- [ ] Version/optimistic locking davranışının tasarlanması

DoD:

- [ ] Yaşam döngüsü için integration testleri geçiyor
- [ ] Conflict senaryoları için 409 response standardı uygulanmış

## Sprint 3 - RBAC ve Kimlik Katmanı (8%)

Hedef: Rol bazlı erişim kontrolünü production’a uygun hale getirmek.

Checklist:

- [ ] JWT doğrulama middleware
- [ ] Role claim map (Customer/Agent/Manager)
- [ ] Endpoint bazlı authorization guard
- [ ] Unauthorized audit log üretimi

DoD:

- [ ] 403 senaryoları testlerle doğrulanmış
- [ ] Token expiry (15 dk) politikası uygulanmış

## Sprint 4 - SLA ve Escalation (10%)

Hedef: SLA saatini ve risk seviyelerini güvenilir şekilde işletmek.

Checklist:

- [x] SLA clock state machine (START/PAUSED/RUNNING/STOPPED)
- [x] WAITING_FOR_CUSTOMER durumunda pause davranışı
- [ ] `%70/%85/%100` risk seviyelerinin event üretimi
- [ ] Breach durumunda audit + reporting entegrasyonu

DoD:

- [ ] SLA state geçiş testleri tamam
- [x] Risk seviyeleri API response’a yansıyor

## Sprint 5 - Timeline, Audit, Worklog (10%)

Hedef: İzlenebilirlik mekanizmalarını tamamlamak.

Checklist:

- [ ] Internal/External worklog ayrımı
- [ ] Timeline event görünürlük kuralları
- [ ] Kritik aksiyonlarda audit reason zorunluluğu
- [ ] Manager müdahalelerinin timeline/audit etkileri

DoD:

- [ ] Customer yalnız external kayıtları görüyor
- [ ] Agent/Manager internal + external kayıtları görebiliyor

## Sprint 6 - Attachment Yönetimi (8%)

Hedef: Dosya yönetimi kurallarını devreye almak.

Checklist:

- [x] 10 MB dosya limiti
- [x] Internal/External attachment görünürlük kuralı
- [ ] Dosya türü whitelist/blacklist yaklaşımı
- [ ] Upload ve erişim olaylarının audit kaydı

DoD:

- [ ] Limit aşımı ve yetkisiz erişim testleri tamam
- [ ] Attachment event’leri timeline’da izlenebilir

## Sprint 7 - Service Request Approval + Complaint (8%)

Hedef: Service Request approval kapısı ve kalite şikayet akışını tamamlamak.

Checklist:

- [ ] Approval state machine (PENDING/APPROVED/REJECTED)
- [x] Approval tamamlanmadan RESOLVED engeli
- [ ] Rejected request -> CLOSED + reason + audit
- [ ] Service quality complaint oluşturma ve manager review akışı

DoD:

- [x] Approval invariant testleri tam
- [x] Complaint akışı ticket normal statüsünü otomatik değiştirmiyor

## Sprint 8 - Reporting ve Dashboard Veri Katmanı (8%)

Hedef: MVP metriklerinin ölçülebilir raporlanması.

Checklist:

- [ ] SLA compliance metriği
- [ ] Ortalama çözüm süresi metriği
- [ ] Escalation sayısı metriği
- [ ] Agent iş yükü metriği

DoD:

- [ ] `/reporting/summary` endpoint gerçek veriden hesaplama yapıyor
- [ ] Rapor metrikleri test dataset ile doğrulanmış

## Sprint 9 - API Sertleştirme ve Hata Yönetimi (8%)

Hedef: API kontratını güvenilir ve öngörülebilir yapmak.

Checklist:

- [ ] OpenAPI spec ile endpoint davranışlarının birebir hizalanması
- [ ] 400/403/404/409 hata sözleşmelerinin standardizasyonu
- [ ] Pagination (max page size = 50) uygulanması
- [ ] Request validation hatalarının normalize edilmesi

DoD:

- [ ] Contract testleri ve endpoint testleri uyumlu
- [ ] API edge-case senaryoları dokümante edilmiş

## Sprint 10 - Frontend Uçtan Uca Akışlar (8%)

Hedef: Rol bazlı UI davranışlarını tamamlamak.

Checklist:

- [x] allowedActions tabanlı buton görünürlüğü
- [ ] Timeline/worklog/attachment görünümlerinin role göre filtrelenmesi
- [x] SLA risk rozetlerinin ticket detayında gösterimi
- [ ] Complaint formunun backend ile entegrasyonu

DoD:

- [ ] Customer/Agent/Manager için temel akışlar manuel testten geçmiş
- [ ] Kritik ekranlar responsive doğrulamadan geçmiş

## Sprint 11 - Test, Güvenlik, Performans, Release (7%)

Hedef: Ürünü release edilebilir kaliteye getirmek.

Checklist:

- [ ] Unit + integration + e2e test setinin tamamlanması
- [ ] Baseline güvenlik kontrolleri (JWT, RBAC, input validation)
- [ ] Performans smoke testleri (özellikle ticket list/update)
- [ ] Release notları ve sürümleme prosedürü

DoD:

- [ ] CI pipeline tamamen yeşil
- [ ] UAT checklist tamamlanmış
- [ ] v1.0.0 release candidate etiketi hazır

## Kapanış Kontrolü (Release Gate)

Aşağıdaki maddelerin tamamı sağlanmadan proje 100% kabul edilmez:

- [ ] Tüm sprint DoD maddeleri tamamlandı
- [ ] Kritik bug sayısı 0
- [x] OpenAPI, README ve docs güncel
- [ ] Lisans, güvenlik ve veri saklama politikaları dokümante edildi
- [ ] Ürün demo akışı sorunsuz çalışıyor
