# Frontend Architecture

## Yapı

- `auth/`: Keycloak init ve auth context
- `api/`: axios client
- `pages/`: işlevsel ekranlar
- `components/`: paylaşılan UI bileşenleri
- `locales/`: i18n kaynakları (tr/en)

## i18n Yaklaşımı

- kütüphane: `i18next`, `react-i18next`
- varsayılan dil: `tr`
- kullanıcı dil seçimi `localStorage` içinde saklanır

## Auth Akışı

- Keycloak JS SDK ile `check-sso`
- authenticated durumda token API header'a eklenir
- login/logout frontend üzerinden tetiklenir
