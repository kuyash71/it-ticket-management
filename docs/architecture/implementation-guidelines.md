# Uygulama Rehberi (MVP)

Bu doküman, kod yazımı sırasında analiz/tasarım dokümanları ile uyumu korumak için kısa teknik kuralları içerir.

## Katman Sorumlulukları

- Application Layer:
  - Use-case akışını orkestre eder
  - Domain policy/service çağrı sırasını yönetir
- Domain Layer:
  - İş kurallarını uygular
  - Invariant ihlallerini engeller
- Infrastructure Layer:
  - DB, dosya depolama, harici servis adaptörlerini uygular

## Zorunlu İş Kuralları

- Geçersiz status transition reddedilir (`409 Conflict`)
- Service Request approval `PENDING` ise `RESOLVED` geçişi reddedilir
- Manager override işlemlerinde `reason` zorunludur
- Priority değişimi audit kaydı üretir
- Attachment boyutu 10 MB üstü reddedilir

## API Kontrat Kuralları

- Yetkisiz işlem: `403 Forbidden`
- Bulunamayan kayıt: `404 Not Found`
- Geçersiz payload: `400 Bad Request`
- Geçersiz transition/concurrency: `409 Conflict`

## Test Stratejisi

- Domain policy testleri her sprintte genişletilir
- Status transition ve SLA state machine için integration test zorunludur
- Kritik rol aksiyonları (override, reassign, complaint) için authorization testleri zorunludur

## Dokümantasyon Güncelleme Kuralı

Aşağıdaki alanlar değiştiğinde doküman güncellemesi zorunludur:

- Yeni endpoint veya payload alanı
- Yeni domain event
- Yeni role/action kuralı
- SLA/pagination/security parametre değişimi
