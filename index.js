import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const CINEMA_ID = process.env.CINEMA_ID;
const TENANT_ID = process.env.TENANT_ID || 10108;

if (!DISCORD_WEBHOOK_URL || !CINEMA_ID) {
  throw new Error("Missing required environment variables");
}

const RATINGS = new Set(["u", "pg", "12", "12a", "15", "18", "r18", "tbc"]);

function getRating(attributeIds = []) {
  const rating = attributeIds.find(a => RATINGS.has(a.toLowerCase()));
  return rating ? rating.toUpperCase() : "tbc";
}

const STATE_FILE = path.join(__dirname, "state.json");

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function getFutureDate(yearsAhead = 5) {
  const d = new Date();
  d.setFullYear(d.getFullYear() + yearsAhead);
  return d.toISOString().slice(0, 10);
}

async function fetchAvailableDates() {
  const untilDate = getFutureDate(5);
  const url = `https://www.cineworld.co.uk/uk/data-api-service/v1/quickbook/${TENANT_ID}/dates/in-cinema/${CINEMA_ID}/until/${untilDate}?attr=&lang=en_GB`;

  const res = await fetch(url);
  const json = await res.json();

  return json?.body?.dates || [];
}

async function fetchFilms(date) {
  const url = `https://www.cineworld.co.uk/uk/data-api-service/v1/quickbook/${TENANT_ID}/film-events/in-cinema/${CINEMA_ID}/at-date/${date}?attr=&lang=en_GB`;

  const res = await fetch(url);
  if (!res.ok) return [];

  const json = await res.json();
  return json?.body?.films || [];
}

function loadState() {
  if (!fs.existsSync(STATE_FILE)) return {};
  return JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

async function sendEmbed(embed) {
  await fetch(DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ embeds: [embed] })
  });
}

function buildEmbed(film) {
  return {
    title: `${film.name}`,
    url: film.link,
    color: 0x2ecc71,
    image: film.posterLink ? { url: film.posterLink } : undefined,
    fields: [
      {
        name: "Release Date",
        value: film.releaseDate?.slice(0, 10) || "Unknown",
        inline: true
      },
      {
        name: "Runtime",
        value: film.length ? `${film.length} min` : "Unknown",
        inline: true
      },
      {
        name: "Rating",
        value: getRating(film.attributeIds),
        inline: true
      }
    ],
    footer: {
      text: "Cineworld Jersey"
    }
  };
}

async function run() {
  const state = loadState();

  const today = new Date().toISOString().slice(0, 10);

  const current = {};

  const dates = await fetchAvailableDates();

  for (const date of dates) {
    const films = await fetchFilms(date);

    for (const film of films) {
      current[film.id] = film;
    }
  }

  const previousIds = new Set(Object.keys(state));
  const currentIds = new Set(Object.keys(current));

  for (const id of currentIds) {
    if (!previousIds.has(id)) {
      await sendEmbed(buildEmbed(current[id]));
      console.log("NEW:", current[id].name);
    }
  }

  for (const id of previousIds) {
    if (!currentIds.has(id)) {
      console.log("REMOVED:", state[id].name);
    }
  }

  saveState(current);
}

run().catch(console.error);
