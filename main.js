import { initDOM } from "./dom.js?v=mega-final-fix";
import { Handlers, initGame } from "./game.js?v=custom-answer-5";

function getModeFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const mode = (params.get("mode") || "").toLowerCase();

  if (mode === "randomstart" || mode === "random") return "random";
  if (mode === "stats") return "stats";
  if (mode === "versus") return "versus";
  return null;
}

function startMode(mode) {
  if (!mode) return;

  if (mode === "random") {
    Handlers.onStartRandom();
    return;
  }
  if (mode === "stats") {
    Handlers.onStartStats();
    return;
  }
  if (mode === "versus" && typeof Handlers.onStartVersus === "function") {
    Handlers.onStartVersus();
  }
}

function boot() {
  const mode = getModeFromQuery();
  initDOM(Handlers);

  if (!mode) {
    window.location.replace("index.html");
    return;
  }

  initGame({ initialScreen: "game-container" });
  startMode(mode);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}
