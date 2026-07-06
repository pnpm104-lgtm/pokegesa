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
  // ★ ここをシンプルに書き換えました！
  if (mode === "versus") {
    if (typeof Handlers.onStartVersus === "function") {
      Handlers.onStartVersus();
    } else {
      // もし game.js 側で処理が用意されていなくても、
      // 画面をゲームコンテナ（対戦画面）に切り替える処理を動かします
      initGame({ initialScreen: "game-container" });
    }
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
