# Cineworld Notifier

A Node.js script that monitors your local Cineworld cinema for new film listings, and sends Discord notifications when new films appear.

## About
Designed to be run on a schedule (e.g. cron).

When run, it fetches all of the upcoming films for available dates from Cineworld's API for your chosen Cinema. It compares this against the previously saved state in `state.json`, and then sends a discord webhook for any new films. It then updates the saved state.

## Setup

**Requirements:** Node.js

1. Clone the repo and install dependencies:

   ```bash
   git clone https://github.com/ottowong/cineworldNotifier.git
   cd cineworldNotifier
   npm i
   ```

2. Copy the example .env file and fill in your values:

   ```bash
   cp example.env .env
   ```

Find your CINEMA_ID here: https://www.cineworld.co.uk/uk/data-api-service/v1/quickbook/10108/cinemas/with-event/until/3000-01-01?attr=&lang=en_GB

| Variable | Required | Default | Description |
|---|---|---|---|
| `DISCORD_WEBHOOK_URL` | Yes |  | Discord webhook to post notifications to |
| `CINEMA_ID` | Yes | `022` | Cineworld cinema ID |
| `TENANT_ID` | No | `10108` | Cineworld tenant ID | 

## Usage

Run manually:

```bash
node index.js
```

To run on a schedule, add a cron job (e.g. every hour):

```
0 * * * * cd /path/to/cineworldNotifier && node index.js
```

## Stuff I might add in the future
- An easier way to get your cinema ID
- The ability to monitor multiple cinemas
