# Synology / Docker: production Pinky Promise web + API
FROM node:22-bookworm-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/history/package.json packages/history/
COPY packages/cli/package.json packages/cli/
COPY apps/web/package.json apps/web/

RUN npm ci --ignore-scripts

COPY packages/shared packages/shared
COPY packages/history packages/history
COPY apps/web apps/web
COPY tsconfig.json ./

ARG VITE_GITHUB_SIGN_IN=true
ENV VITE_GITHUB_SIGN_IN=$VITE_GITHUB_SIGN_IN
ENV NITRO_PRESET=node-server
RUN npm run build --workspace @pinky-promise/web

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY --from=build /app/apps/web/.output ./.output
COPY --from=build /app/apps/web/package.json ./package.json

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
