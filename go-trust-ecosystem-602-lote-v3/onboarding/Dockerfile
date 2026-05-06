FROM alpine:3.19

ARG PB_VERSION=0.22.20

RUN apk add --no-cache ca-certificates wget unzip

WORKDIR /pb

RUN wget -q https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip \
 && unzip pocketbase_${PB_VERSION}_linux_amd64.zip \
 && rm pocketbase_${PB_VERSION}_linux_amd64.zip \
 && chmod +x pocketbase

EXPOSE 8090

CMD ["./pocketbase", "serve", \
     "--http=0.0.0.0:8090", \
     "--dir=/pb/pb_data", \
     "--migrationsDir=/pb/pb_migrations", \
     "--hooksDir=/pb/pb_hooks", \
     "--publicDir=/pb/pb_public"]
