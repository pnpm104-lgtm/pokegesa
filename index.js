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
  
  // ✨ ここを完全に書き換えました！
  // 対戦モード（versus）なら、難しいチェックを無視して強制的に対戦画面（ゲームコンテナ）を開きます
  if (mode === "versus") {
    initGame({ initialScreen: "game-container" });
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

(() => {
  const hamburgerMenu = document.getElementById('hamburger-menu');
  const navMenu = document.getElementById('nav-menu');

  if (!hamburgerMenu || !navMenu) return;

  const closeMenu = () => {
    hamburgerMenu.classList.remove('is-active');
    navMenu.classList.remove('is-active');
  };

  hamburgerMenu.addEventListener('click', () => {
    hamburgerMenu.classList.toggle('is-active');
    navMenu.classList.toggle('is-active');
  });
})();
