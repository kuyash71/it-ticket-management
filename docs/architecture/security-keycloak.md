# Security and Keycloak

## Model

- Keycloak realm: `itsm`
- Frontend client: `itsm-frontend` (public)
- Backend client: `itsm-backend` (bearer-only)

## Roller

- `customer`
- `agent`
- `manager`

## Backend Doğrulama

- Spring Resource Server JWT doğrular.
- Realm role'leri `ROLE_*` authority formatına çevrilir.
- Endpoint erişimleri role-based policy ile korunur.
