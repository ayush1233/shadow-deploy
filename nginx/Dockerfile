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

# At startup: substitute env vars into the template, then start nginx
CMD ["/bin/sh", "-c", "envsubst '${PROD_BACKEND_HOST} ${PROD_BACKEND_PORT} ${SHADOW_BACKEND_HOST} ${SHADOW_BACKEND_PORT}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf && nginx -g 'daemon off;'"]
