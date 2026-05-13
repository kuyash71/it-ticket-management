# ITSM Frontend — single-stage nginx image.
#
# The Vite production bundle is built on the host (`npm run build`) and copied in.
# This keeps `docker build` from spinning up a Node container, which avoids the
# containerd v2 shim "Yunix" protocol incompatibility seen on some Linux hosts.
#
# Usage:
#   cd frontend && npm ci && npm run build
#   docker compose build frontend

FROM nginx:1.27-alpine

COPY dist/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
