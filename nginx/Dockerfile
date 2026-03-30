FROM nginx:1.25-alpine

RUN apk add --no-cache openssl

# Copy as template (contains ${VARIABLES})
COPY nginx.conf /etc/nginx/nginx.conf.template

EXPOSE 80 443

# Default values if not provided
ENV PROD_BACKEND_HOST=host.docker.internal
ENV PROD_BACKEND_PORT=5001
ENV SHADOW_BACKEND_HOST=host.docker.internal
ENV SHADOW_BACKEND_PORT=5002
ENV MIRROR_PERCENTAGE=100

# At startup: validate ports, substitute env vars into the template, then start nginx
CMD ["/bin/sh", "-c", "\
  if [ \"$PROD_BACKEND_PORT\" = \"80\" ] || [ \"$PROD_BACKEND_PORT\" = \"443\" ]; then \
    echo 'FATAL: PROD_BACKEND_PORT=$PROD_BACKEND_PORT would create a proxy loop (NGINX listens on 80). Set it to the actual backend port (e.g. 5001).'; \
    exit 1; \
  fi && \
  if [ \"$SHADOW_BACKEND_PORT\" = \"80\" ] || [ \"$SHADOW_BACKEND_PORT\" = \"443\" ]; then \
    echo 'FATAL: SHADOW_BACKEND_PORT=$SHADOW_BACKEND_PORT would create a proxy loop. Set it to the actual backend port (e.g. 5002).'; \
    exit 1; \
  fi && \
  envsubst '${PROD_BACKEND_HOST} ${PROD_BACKEND_PORT} ${SHADOW_BACKEND_HOST} ${SHADOW_BACKEND_PORT} ${MIRROR_PERCENTAGE} ${INTERNAL_SHARED_SECRET}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf && \
  nginx -g 'daemon off;'"]
