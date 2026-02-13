# Roadmap

Bu roadmap, tamamlandığında projenin MVP hedefini bitmiş ve yayınlanabilir hale getirir.
Kapsam: Spring Boot, Keycloak, React, PostgreSQL, jBPM, Kafka, OpenSearch, OpenTelemetry, Docker Compose.

## Proje Tamamlanma Kriteri (Release Gate)

- [ ] Sprint 0-7 maddelerinin tamamı işaretlenmiş olmalı
- [ ] P1/P2 seviyesinde açık kritik bug kalmamalı
- [ ] UAT (iş birimi kabul testi) onayı alınmalı
- [ ] Staging ortamında tam akış smoke + regresyon testleri geçmeli
- [ ] Production deployment ve rollback dry-run başarılı olmalı
- [ ] Operasyon dokümanları (runbook, incident response, backup/restore) tamamlanmalı

## Sprint 0 - Foundation ve Çalışma Altyapısı

- [x] Proje klasör yapısının oluşturulması (`backend`, `frontend`, `infra`, `docs`)
- [x] Docker Compose ile temel servislerin ayağa kaldırılması (postgres, kafka, keycloak, opensearch, otel-collector)
- [x] Spring Boot backend iskeleti
- [x] React frontend iskeleti
- [x] Keycloak realm import ve temel client tanımları
- [ ] Temiz klonda tek komutla lokal kalkış doğrulaması (`docker compose up --build`)
- [ ] CI pipeline temel akışı (build + test + lint) aktif ve stabil

## Sprint 1 - Domain Core ve Ticket Yaşam Döngüsü

- [ ] Ticket aggregate kurallarının netleştirilmesi (incident/service request ayrımı)
- [ ] Status transition policy kurallarının domain seviyesinde uygulanması
- [ ] Priority matrix (impact/urgency -> priority) domain service olarak tamamlanması
- [ ] SLA Clock modelinin aggregate child entity olarak tamamlanması
- [ ] ServiceRequestApproval modelinin aggregate child entity olarak tamamlanması
- [ ] Concurrency için optimistic locking/version alanı eklenmesi
- [ ] Domain policy testlerinin yazılması
- [ ] API hata modelinin (validation, conflict, unauthorized) standardize edilmesi

## Sprint 2 - Workflow ve Süreç Otomasyonu (jBPM)

- [ ] Incident ve Service Request için BPMN akışlarının ayrıştırılması
- [ ] Service Request approval adımlarının BPMN'e taşınması
- [ ] SLA escalation adımlarının süreçle entegre edilmesi
- [ ] Timeout/yanıtsız müşteri edge-case akışlarının tanımlanması
- [ ] Process instance izleme ve correlation stratejisinin netleştirilmesi
- [ ] Workflow integration testlerinin yazılması

## Sprint 3 - Uygulama Özellikleri (Timeline, Attachment, Notification)

- [ ] Timeline olay modelinin (internal/external görünürlük) tamamlanması
- [ ] Attachment policy (dosya tipi, boyut, güvenlik) kurallarının uygulanması
- [ ] Audit trail kayıtlarının zorunlu eventler için tamamlanması
- [ ] Notification kurallarının (MVP) backend tarafında uygulanması
- [ ] Event catalog zorunlu event setinin API akışlarına bağlanması
- [ ] Bu sprint kapsamı için API sözleşmelerinin (`docs/api-overview.md`) güncellenmesi

## Sprint 4 - Security, RBAC ve i18n Tamamlama

- [x] Keycloak JWT doğrulama
- [x] Realm role -> Spring authority dönüşümü
- [ ] Role bazlı yetki matrisi (customer/agent/manager/admin) endpoint bazında tamamlanması
- [ ] Frontend route ve aksiyon bazlı yetki kontrollerinin tamamlanması
- [x] React i18n altyapısı (tr/en)
- [x] Backend message bundle i18n altyapısı
- [ ] Tüm kullanıcıya dönük metinlerin i18n kaynaklarına taşınması
- [ ] Güvenlik testleri (auth bypass, role escalation, invalid token) eklenmesi

## Sprint 5 - Observability, Logging ve Reporting

- [x] Kafka log event producer
- [x] OpenSearch log indexleme
- [x] OpenTelemetry OTLP trace export
- [ ] Log şeması ve korelasyon alanlarının standardize edilmesi (traceId, ticketId, actor)
- [ ] OpenSearch dashboard ve temel alarm kurallarının eklenmesi
- [ ] Reporting metriklerinin (SLA, çözüm süresi, backlog) query katmanında tamamlanması
- [ ] Rapor endpointleri ve UI özet ekranlarının tamamlanması

## Sprint 6 - Frontend Productization ve UX Tamamlama

- [ ] Ticket list/detail/create/update ekranlarının production-ready hale getirilmesi
- [ ] Durum geçişleri, atama, öncelik değişimi gibi aksiyonların UI'da tamamlanması
- [ ] Timeline ve attachment deneyiminin UI'da tamamlanması
- [ ] Hata durumları ve boş durum ekranlarının (empty/error/loading) standardize edilmesi
- [ ] Erişilebilirlik (a11y) ve responsive davranış iyileştirmeleri
- [ ] Frontend entegrasyon testlerinin yazılması

## Sprint 7 - Hardening, Release ve Go-Live

- [ ] E2E test senaryolarının kritik iş akışlarını kapsaması
- [ ] Performans testleri (yük altında API ve DB davranışı) tamamlanması
- [ ] Güvenlik sertleştirme (secrets, headers, CORS, container policy) tamamlanması
- [ ] Backup/restore prosedürü ve testinin tamamlanması
- [ ] CI/CD release pipeline (tag, image build, deploy, rollback) tamamlanması
- [ ] Operasyon runbook ve support handover dokümanlarının tamamlanması
- [ ] Go-live checklist'inin tamamlanması ve canlı geçiş onayı

## Sprintler Arası Zorunlu DoD

- [ ] Kod review tamamlanmış olmalı
- [ ] İlgili testler yeşil olmalı
- [ ] API ve mimari dokümantasyon güncellenmiş olmalı
- [ ] Yeni konfigürasyonlar `infra/docker-compose.yml` ve `.env.example` dosyalarına yansıtılmış olmalı
