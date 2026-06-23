"use strict";

/*
 * Flight Time Calculator — client-side only.
 *
 * Security notes:
 *  - No network requests, no third-party code, no eval/Function.
 *  - All user-derived text is written via textContent (never innerHTML),
 *    so values cannot be interpreted as HTML/script.
 *  - Inputs are strictly parsed and bounded before use.
 */

(function () {
  // ---- Element references -------------------------------------------------
  const form        = document.getElementById("flight-form");
  const depTimeEl   = document.getElementById("dep-time");
  const depZoneEl   = document.getElementById("dep-zone");
  const depIataEl   = document.getElementById("dep-iata");
  const depAirport  = document.getElementById("dep-airport");
  const durationEl  = document.getElementById("duration");
  const destZoneEl  = document.getElementById("dest-zone");
  const destIataEl  = document.getElementById("dest-iata");
  const destAirport = document.getElementById("dest-airport");
  const nowBtn      = document.getElementById("now-btn");

  const errorEl     = document.getElementById("error");
  const resultEl    = document.getElementById("result");
  const arrivalEl   = document.getElementById("result-arrival");
  const dayOffsetEl = document.getElementById("result-dayoffset");
  const arrUtcEl    = document.getElementById("arr-utc");
  const arrLmtEl    = document.getElementById("arr-lmt");
  const etaLabelEl  = document.getElementById("result-eta-label");
  const rDepSrc     = document.getElementById("r-dep-src");
  const rDepUtc     = document.getElementById("r-dep-utc");
  const rDuration   = document.getElementById("r-duration");
  const rDestZone   = document.getElementById("r-dest-zone");

  const countdownEl = document.getElementById("countdown");
  const cdLabelEl   = document.getElementById("countdown-label");
  const cdTimeEl    = document.getElementById("countdown-time");
  const progressBar = document.getElementById("progress-bar");

  // Bound the duration so absurd input can't overflow date math (max ~30 days).
  const MAX_DURATION_MIN = 30 * 24 * 60;

  // Airport dataset (loaded from airports.js). Guard in case it's missing.
  const AIRPORT_DB = (typeof AIRPORTS !== "undefined") ? AIRPORTS : {};

  // Normalize a city string for lookup: strip diacritics, lowercase, collapse
  // whitespace. So "São Paulo" and "sao  paulo" both key to "sao paulo".
  function normCity(s) {
    return s.normalize("NFD").replace(/[̀-ͯ]/g, "")
            .toLowerCase().trim().replace(/\s+/g, " ");
  }

  // Indexes built from the dataset:
  //   BY_ICAO    : ICAO code -> IATA key (4-letter lookups)
  //   CITY_INDEX : normalized city -> IATA key of that city's prime airport
  const BY_ICAO = Object.create(null);
  const CITY_INDEX = Object.create(null);
  for (const iata of Object.keys(AIRPORT_DB)) {
    const a = AIRPORT_DB[iata];
    if (a.icao) BY_ICAO[a.icao] = iata;
    if (a.city) {
      const key = normCity(a.city);
      // A `primary` airport always wins its city; otherwise first one seen.
      if (a.primary || !(key in CITY_INDEX)) CITY_INDEX[key] = iata;
    }
  }
  const CITY_KEYS = Object.keys(CITY_INDEX);

  // Handle for the live countdown timer so we can cancel it on recalculation.
  let countdownTimer = null;

  // Resolved destination airport record (or null for a bare timezone). Used
  // for exact LMT (its longitude) and to name the destination in the ETA label.
  let destAirportRec = null;

  // ---- Timezone list ------------------------------------------------------
  function getTimeZones() {
    try {
      if (typeof Intl.supportedValuesOf === "function") {
        const zones = Intl.supportedValuesOf("timeZone");
        if (Array.isArray(zones) && zones.length) {
          // Ensure UTC is present and listed first.
          const set = new Set(zones);
          set.delete("UTC");
          return ["UTC", ...Array.from(set).sort()];
        }
      }
    } catch (_) { /* fall through to fallback list */ }

    return [
      "UTC", "Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Moscow",
      "Asia/Dubai", "Asia/Kolkata", "Asia/Bangkok", "Asia/Singapore",
      "Asia/Hong_Kong", "Asia/Tokyo", "Australia/Sydney",
      "America/New_York", "America/Chicago", "America/Denver",
      "America/Los_Angeles", "America/Sao_Paulo", "Pacific/Auckland"
    ];
  }

  function browserTimeZone() {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch (_) {
      return "UTC";
    }
  }

  function populateZones() {
    const zones = getTimeZones();
    const local = browserTimeZone();

    for (const zone of zones) {
      // Two independent <option> elements (a node can't live in two selects).
      const a = document.createElement("option");
      a.value = zone; a.textContent = zone;
      depZoneEl.appendChild(a);

      const b = document.createElement("option");
      b.value = zone; b.textContent = zone;
      destZoneEl.appendChild(b);
    }

    // Defaults: entered time in UTC, completion shown in browser's local zone.
    depZoneEl.value = "UTC";
    destZoneEl.value = zones.includes(local) ? local : "UTC";
  }

  // ---- Timezone math ------------------------------------------------------
  // Offset (ms) of `timeZone` from UTC at the given instant.
  function zoneOffsetMs(instant, timeZone) {
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit"
    });
    const parts = dtf.formatToParts(instant);
    const m = {};
    for (const p of parts) m[p.type] = p.value;
    const asUTC = Date.UTC(+m.year, +m.month - 1, +m.day, +m.hour, +m.minute, +m.second);
    return asUTC - instant.getTime();
  }

  // Convert a naive wall-clock time in `timeZone` to a real UTC instant.
  // Two-pass refinement so DST transitions are handled correctly.
  function wallTimeToInstant(y, mo, d, h, mi, timeZone) {
    const wallAsUTC = Date.UTC(y, mo - 1, d, h, mi, 0);
    let offset = zoneOffsetMs(new Date(wallAsUTC), timeZone);
    let utc = wallAsUTC - offset;
    offset = zoneOffsetMs(new Date(utc), timeZone);
    utc = wallAsUTC - offset;
    return new Date(utc);
  }

  // ---- Formatting ---------------------------------------------------------
  function formatInZone(instant, timeZone) {
    return new Intl.DateTimeFormat(undefined, {
      timeZone,
      weekday: "short",
      year: "numeric", month: "short", day: "2-digit",
      hour: "2-digit", minute: "2-digit",
      hour12: false,
      timeZoneName: "short"
    }).format(instant);
  }

  // ---- Parsing / validation ----------------------------------------------
  // Returns minutes (>=0) or throws Error with a user-facing message.
  function parseDuration(raw) {
    const s = raw.trim();
    if (s === "") return 0;

    let minutes;
    if (s.indexOf(":") !== -1) {
      const match = /^(\d{1,3}):([0-5]?\d)$/.exec(s);
      if (!match) {
        throw new Error("Duration must look like hh:mm (e.g. 2:30), with minutes 00–59.");
      }
      minutes = Number(match[1]) * 60 + Number(match[2]);
    } else {
      if (!/^\d{1,5}$/.test(s)) {
        throw new Error("Duration must be whole minutes (e.g. 150) or hh:mm (e.g. 2:30).");
      }
      minutes = Number(s);
    }

    if (!Number.isFinite(minutes) || minutes < 0) {
      throw new Error("Duration must be zero or positive.");
    }
    if (minutes > MAX_DURATION_MIN) {
      throw new Error("Duration is too large (max 30 days).");
    }
    return minutes;
  }

  function parseDepartureField(raw) {
    // datetime-local yields "YYYY-MM-DDTHH:MM" (optionally :SS). Parse strictly.
    const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2})?$/.exec(raw);
    if (!match) {
      throw new Error("Please enter a valid departure date and time.");
    }
    const y  = Number(match[1]);
    const mo = Number(match[2]);
    const d  = Number(match[3]);
    const h  = Number(match[4]);
    const mi = Number(match[5]);
    if (mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59) {
      throw new Error("Please enter a valid departure date and time.");
    }
    return { y, mo, d, h, mi };
  }

  function formatMinutes(min) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    if (h === 0 && m === 0) return "none (time conversion only)";
    const parts = [];
    if (h > 0) parts.push(h + (h === 1 ? " hour" : " hours"));
    if (m > 0) parts.push(m + (m === 1 ? " minute" : " minutes"));
    return parts.join(" ");
  }

  // ---- UI helpers ---------------------------------------------------------
  function showError(message) {
    errorEl.textContent = message; // textContent => no HTML injection
    errorEl.hidden = false;
    resultEl.hidden = true;
  }

  function clearError() {
    errorEl.textContent = "";
    errorEl.hidden = true;
  }

  function nowAsLocalInputValue() {
    const n = new Date();
    const pad = (x) => String(x).padStart(2, "0");
    return `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}` +
           `T${pad(n.getHours())}:${pad(n.getMinutes())}`;
  }

  // ---- Airport lookup -----------------------------------------------------
  function recordFor(iata) {
    const a = AIRPORT_DB[iata];
    return { iata: iata, icao: a.icao, name: a.name, city: a.city, tz: a.tz, lon: a.lon };
  }

  // Resolve typed text to an airport record, or null. Tries, in order:
  //   1. 3-letter IATA code   2. 4-letter ICAO code   3. city name
  // City matching is exact first, then a unique prefix match. All lookups use
  // own-property checks, so crafted input can't reach prototype keys.
  function resolveQuery(raw) {
    const letters = raw.replace(/[^a-zA-Z]/g, "").toUpperCase();
    if (letters.length === 3 &&
        Object.prototype.hasOwnProperty.call(AIRPORT_DB, letters)) {
      return recordFor(letters);
    }
    if (letters.length === 4 && BY_ICAO[letters]) {
      return recordFor(BY_ICAO[letters]);
    }

    const key = normCity(raw);
    if (key.length >= 3) {
      if (key in CITY_INDEX) return recordFor(CITY_INDEX[key]);
      // Unique prefix match (e.g. "lond" -> "london"); ambiguous -> no guess.
      let hit = null, count = 0;
      for (const c of CITY_KEYS) {
        if (c.startsWith(key)) { hit = c; count++; if (count > 1) break; }
      }
      if (count === 1) return recordFor(CITY_INDEX[hit]);
    }
    return null;
  }

  // Handle typed code/city input: sanitize, resolve, update the zone select and
  // a descriptive label. `onResolve` receives the airport record (or null).
  function handleIataInput(inputEl, zoneSelect, labelEl, onResolve) {
    // Allow letters (incl. accented), spaces and a few name punctuation marks.
    const cleaned = inputEl.value.replace(/[^\p{L}\s.'-]/gu, "");
    if (inputEl.value !== cleaned) inputEl.value = cleaned; // reflect sanitized
    const raw = cleaned.trim();

    if (raw.length < 3) {
      labelEl.hidden = true;
      labelEl.classList.remove("unknown");
      if (onResolve) onResolve(null);
      return;
    }

    const airport = resolveQuery(raw);

    if (airport) {
      zoneSelect.value = airport.tz;
      // If the zone isn't in the list for some reason, add it so it's usable.
      if (zoneSelect.value !== airport.tz) {
        const opt = document.createElement("option");
        opt.value = airport.tz; opt.textContent = airport.tz;
        zoneSelect.appendChild(opt);
        zoneSelect.value = airport.tz;
      }
      labelEl.textContent = `${airport.icao} (${airport.iata}) — ${airport.name} · ${airport.tz}`;
      labelEl.classList.remove("unknown");
      labelEl.hidden = false;
    } else {
      labelEl.textContent = `No airport or city found for “${raw}”.`;
      labelEl.classList.add("unknown");
      labelEl.hidden = false;
    }
    if (onResolve) onResolve(airport);
  }

  // ---- Local Mean Time (LMT) ---------------------------------------------
  // LMT is solar mean time at a meridian: UTC shifted by 4 minutes per degree
  // of longitude (East positive). Independent of civil timezone/DST.
  const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  function formatOffset(min) {
    const sign = min < 0 ? "−" : "+";
    const a = Math.abs(min);
    const h = Math.floor(a / 60);
    const m = Math.round(a % 60);
    return `${sign}${pad2(h)}:${pad2(m)}`;
  }

  // Returns a formatted LMT string for a UTC instant at the given longitude.
  function formatLmt(utcMs, lonDeg) {
    const offsetMin = lonDeg * 4;
    // Apply the offset (to whole seconds) and read the shifted wall clock.
    const shifted = new Date(utcMs + Math.round(offsetMin * 60) * 1000);
    const wk = WEEKDAYS[shifted.getUTCDay()];
    const mo = MONTHS[shifted.getUTCMonth()];
    const dd = pad2(shifted.getUTCDate());
    const yy = shifted.getUTCFullYear();
    const t = `${pad2(shifted.getUTCHours())}:${pad2(shifted.getUTCMinutes())}:${pad2(shifted.getUTCSeconds())}`;
    return `${wk}, ${dd} ${mo} ${yy}, ${t} (UTC${formatOffset(offsetMin)})`;
  }

  // Longitude implied by a zone's current UTC offset (its meridian), used as a
  // fallback when no destination airport is selected.
  function zoneMeridianLon(instant, timeZone) {
    return (zoneOffsetMs(instant, timeZone) / 60000) / 4;
  }

  // ---- Live countdown -----------------------------------------------------
  function pad2(x) { return String(x).padStart(2, "0"); }

  // Format a non-negative millisecond span as [Nd ]HH:MM:SS.
  function formatSpan(ms) {
    let total = Math.floor(ms / 1000);
    const days = Math.floor(total / 86400);
    total -= days * 86400;
    const h = Math.floor(total / 3600);
    total -= h * 3600;
    const m = Math.floor(total / 60);
    const s = total - m * 60;
    const hms = `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
    return days > 0 ? `${days}d ${hms}` : hms;
  }

  function stopCountdown() {
    if (countdownTimer !== null) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
  }

  // Tick handler: reflects the relationship between now, departure and arrival.
  function renderCountdown(depMs, arrMs) {
    const now = Date.now();
    if (now < depMs) {
      countdownEl.classList.remove("done");
      cdLabelEl.textContent = "Flight departs in";
      cdTimeEl.textContent = formatSpan(depMs - now);
      progressBar.style.width = "0%";
    } else if (now < arrMs) {
      countdownEl.classList.remove("done");
      cdLabelEl.textContent = "En route — completes in";
      cdTimeEl.textContent = formatSpan(arrMs - now);
      const pct = ((now - depMs) / (arrMs - depMs)) * 100;
      progressBar.style.width = Math.max(0, Math.min(100, pct)).toFixed(1) + "%";
    } else {
      countdownEl.classList.add("done");
      cdLabelEl.textContent = "Flight completed";
      cdTimeEl.textContent = "✓";
      progressBar.style.width = "100%";
      stopCountdown(); // nothing more to update
    }
  }

  function startCountdown(depMs, arrMs) {
    stopCountdown();
    renderCountdown(depMs, arrMs);
    // Keep ticking unless already completed (renderCountdown may have stopped it).
    if (Date.now() < arrMs) {
      countdownTimer = setInterval(function () {
        renderCountdown(depMs, arrMs);
      }, 1000);
    }
  }

  // ---- Main calculation ---------------------------------------------------
  function calculate() {
    clearError();
    try {
      const dep = parseDepartureField(depTimeEl.value);
      const depZone = depZoneEl.value;
      const destZone = destZoneEl.value;
      const durationMin = parseDuration(durationEl.value);

      const depInstant = wallTimeToInstant(dep.y, dep.mo, dep.d, dep.h, dep.mi, depZone);
      if (isNaN(depInstant.getTime())) {
        throw new Error("Could not interpret the departure time.");
      }

      const arrival = new Date(depInstant.getTime() + durationMin * 60000);

      // ETA label naming the destination (airport if known, else the zone).
      const destName = destAirportRec
        ? `${destAirportRec.icao} (${destAirportRec.iata}) — ${destAirportRec.name}`
        : destZone;
      etaLabelEl.textContent = "";
      etaLabelEl.appendChild(document.createTextNode("ETA — Arrival time at "));
      const strong = document.createElement("strong");
      strong.textContent = destName; // textContent => safe
      etaLabelEl.appendChild(strong);
      etaLabelEl.appendChild(document.createTextNode(" is"));

      // Render results (all via textContent).
      arrivalEl.textContent = formatInZone(arrival, destZone);

      // Arrival in UTC and in Local Mean Time (longitude-based).
      arrUtcEl.textContent = formatInZone(arrival, "UTC");
      if (destAirportRec) {
        arrLmtEl.textContent = formatLmt(arrival.getTime(), destAirportRec.lon);
      } else {
        const lon = zoneMeridianLon(arrival, destZone);
        arrLmtEl.textContent = formatLmt(arrival.getTime(), lon) +
          "  — approx. (zone meridian; select a destination airport for exact LMT)";
      }

      const dayDiff = dayNumberDiff(depInstant, arrival, destZone);
      if (dayDiff !== 0) {
        const sign = dayDiff > 0 ? "+" : "−";
        const n = Math.abs(dayDiff);
        dayOffsetEl.textContent = `${sign}${n} ${n === 1 ? "day" : "days"} from departure date`;
        dayOffsetEl.hidden = false;
      } else {
        dayOffsetEl.hidden = true;
      }

      rDepSrc.textContent = formatInZone(depInstant, depZone);
      rDepUtc.textContent = formatInZone(depInstant, "UTC");
      rDuration.textContent = formatMinutes(durationMin);
      rDestZone.textContent = destZone;

      // Live countdown only applies when there's an actual flight duration.
      if (durationMin > 0) {
        countdownEl.hidden = false;
        startCountdown(depInstant.getTime(), arrival.getTime());
      } else {
        stopCountdown();
        countdownEl.hidden = true;
      }

      resultEl.hidden = false;
    } catch (err) {
      stopCountdown();
      showError(err && err.message ? err.message : "Something went wrong.");
    }
  }

  // Whole-day difference between two instants as seen in `timeZone`.
  function dayNumberDiff(a, b, timeZone) {
    // Compare calendar dates directly (handles month/year rollover).
    const da = dateOnly(a, timeZone);
    const db = dateOnly(b, timeZone);
    return Math.round((db - da) / 86400000);
  }

  function dateOnly(instant, timeZone) {
    const dtf = new Intl.DateTimeFormat("en-CA", {
      timeZone, year: "numeric", month: "2-digit", day: "2-digit"
    });
    const m = {};
    for (const p of dtf.formatToParts(instant)) m[p.type] = p.value;
    return Date.UTC(Number(m.year), Number(m.month) - 1, Number(m.day));
  }

  // ---- Wiring -------------------------------------------------------------
  populateZones();
  depTimeEl.value = nowAsLocalInputValue();

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    calculate();
  });

  nowBtn.addEventListener("click", function () {
    depTimeEl.value = nowAsLocalInputValue();
    depZoneEl.value = browserTimeZone();
    if (![...depZoneEl.options].some((o) => o.value === depZoneEl.value)) {
      depZoneEl.value = "UTC";
    }
  });

  // IATA/ICAO quick-lookup for both zone fields.
  depIataEl.addEventListener("input", function () {
    handleIataInput(depIataEl, depZoneEl, depAirport, null);
  });
  destIataEl.addEventListener("input", function () {
    handleIataInput(destIataEl, destZoneEl, destAirport, function (airport) {
      // Track the destination airport for exact LMT and the ETA label.
      destAirportRec = airport;
    });
  });

  // If the user picks a zone manually, the airport label no longer applies.
  depZoneEl.addEventListener("change", function () {
    depAirport.hidden = true;
    depIataEl.value = "";
  });
  destZoneEl.addEventListener("change", function () {
    destAirport.hidden = true;
    destIataEl.value = "";
    destAirportRec = null; // no specific airport any more
  });
})();
