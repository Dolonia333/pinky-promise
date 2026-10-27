# Host Pinky Promise on the Synology NAS

This is the intended public host for the hackathon: Docker on the NAS, public URL through your existing **NAS-Web** Cloudflare tunnel.

Target URL: **https://pinkypromise.dolonia.cloud**

## What is already prepared in the repo

- `apps/web/Dockerfile` — Node 22 production image (Nitro `node-server`)
- `docker-compose.yml` — publishes the app on NAS port **3081**
- `.env.docker.example` — env template (`BETTER_AUTH_URL` already set to the public host)
- `.env.docker` — local copy with your secrets (gitignored; copy onto the NAS, do not commit)

## On the Synology (DSM)

1. Install **Container Manager** if it is not already installed.
2. Copy this repo folder to a shared folder, e.g. `/volume1/docker/pinky-promise` (File Station or `git clone`).
3. Put `.env.docker` next to `docker-compose.yml` on the NAS (same secrets as local `.env`, with `BETTER_AUTH_URL=https://pinkypromise.dolonia.cloud`).
4. In Container Manager → Project → Create → use that folder → Build and start.
5. Confirm locally: `http://192.168.1.216:3081/` shows the founder test.

## Cloudflare (NAS-Web tunnel)

Your live tunnel is **NAS-Web** (`6d77a3dd-…`), with connectors on this PC and on the NAS. Public hostnames for it are managed in Zero Trust (not the old local `config.yml` tunnel).

1. Open [Zero Trust → Networks → Tunnels → NAS-Web](https://one.dash.cloudflare.com/).
2. Add a public hostname:
   - Hostname: `pinkypromise.dolonia.cloud`
   - Service: `http://localhost:3081` (if the tunnel runs on the NAS) **or** `http://192.168.1.216:3081` (if the Windows connector should reach the NAS).
3. If DNS still points at an old tunnel, delete the `pinkypromise` CNAME under the `dolonia.cloud` zone and re-add it as a CNAME to `6d77a3dd-cef0-481d-9be0-181b249a8ef6.cfargotunnel.com` (or use “Add public hostname” which does this for you).

## GitHub OAuth (after the URL works)

Callback URL:

`https://pinkypromise.dolonia.cloud/api/auth/callback/github`

Set `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, and `VITE_GITHUB_SIGN_IN=true`, then rebuild the image so the Vite flag is baked in.

## CLI default API

Once live, tell Shawnaya:

`PINKY_PROMISE_API_URL=https://pinkypromise.dolonia.cloud`
