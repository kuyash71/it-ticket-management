# Non-Functional Architecture

## Güvenlik

- JWT + RBAC (MVP hedefi)
- Hassas veriler role bazlı filtrelenir
- Yetki ihlali olayları audit altına alınır

## Performans

- Pagination zorunlu
- Max page size: `50`
- Durum geçişleri ve SLA güncellemeleri atomik ele alınır

## İzlenebilirlik

- Audit + timeline + log
- "kim, ne zaman, neden" soruları cevaplanabilir olmalı

## Kullanılabilirlik

- Rol bazlı sade UI
- allowedActions tabanlı buton görünürlüğü

## Veri Saklama

- Audit retention hedefi: minimum 1 yıl
- Attachment boyut limiti: 10 MB

## Çoklu Dil

- Message catalog tabanlı i18n
