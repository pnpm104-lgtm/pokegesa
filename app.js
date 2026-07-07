// ==========================================
// app.js Part 1
// 初期化・データ読み込み・ゲーム開始
// ==========================================

"use strict";

// ----------------------------
// データ
// ----------------------------

let pokemonDatabase = [];
let filteredPokemon = [];
let answerPokemon = null;
let history = [];
let guessCount = 0;
let gameStarted = false;

// ----------------------------
// DOM
// ----------------------------

const generationFilter = document.getElementById("generation-filter");
const legendaryFilter = document.getElementById("legendary-filter");
const mythicalFilter = document.getElementById("mythical-filter");
const finalFilter = document.getElementById("final-filter");

const startButton = document.getElementById("start-game");

const pokemonInput = document.getElementById("pokemon-input");
const guessButton = document.getElementById("guess-btn");

const historyBody = document.getElementById("history-body");

const remainingCount = document.getElementById("remaining-count");
const guessCounter = document.getElementById("guess-count");

const answerSection = document.getElementById("answer-section");
const answerImage = document.getElementById("answer-image");
const answerName = document.getElementById("answer-name");
const answerText = document.getElementById("answer-text");

const nextGameButton = document.getElementById("next-game");

const autocompleteList = document.getElementById("autocomplete-list");

// ----------------------------
// 初期化
// ----------------------------

document.addEventListener("DOMContentLoaded", init);

async function init() {

    await loadPokemonDatabase();

    attachEvents();

    console.log("Pokemon Loaded :", pokemonDatabase.length);

}

// ----------------------------
// JSON読込
// ----------------------------

async function loadPokemonDatabase() {

    try {

        const response = await fetch("./data/pokemon.json");

        if (!response.ok) {

            throw new Error("pokemon.json が見つかりません");

        }

        pokemonDatabase = await response.json();

        filteredPokemon = [...pokemonDatabase];

    }

    catch (error) {

        console.error(error);

        alert("pokemon.json の読み込みに失敗しました。");

    }

}

// ----------------------------
// イベント
// ----------------------------

function attachEvents() {

    startButton.addEventListener(
        "click",
        startGame
    );

    nextGameButton.addEventListener(
        "click",
        startGame
    );

    generationFilter.addEventListener(
        "change",
        applyFilters
    );

    legendaryFilter.addEventListener(
        "change",
        applyFilters
    );

    mythicalFilter.addEventListener(
        "change",
        applyFilters
    );

    finalFilter.addEventListener(
        "change",
        applyFilters
    );

}

// ----------------------------
// フィルター
// ----------------------------

function applyFilters() {

    filteredPokemon = pokemonDatabase.filter((pokemon) => {

        if (
            generationFilter.value !== "all" &&
            Number(generationFilter.value) !== pokemon.generation
        ) {

            return false;

        }

        if (
            legendaryFilter.checked &&
            pokemon.legendary
        ) {

            return false;

        }

        if (
            mythicalFilter.checked &&
            pokemon.mythical
        ) {

            return false;

        }

        if (
            finalFilter.checked &&
            !pokemon.finalEvolution
        ) {

            return false;

        }

        return true;

    });

    updateRemainingCount();

}

// ----------------------------
// ゲーム開始
// ----------------------------

function startGame() {

    if (filteredPokemon.length === 0) {

        alert("条件に合うポケモンがいません。");

        return;

    }

    history = [];

    guessCount = 0;

    gameStarted = true;

    historyBody.innerHTML = "";

    answerSection.classList.add("hidden");

    answerPokemon =
        filteredPokemon[
            Math.floor(
                Math.random() *
                filteredPokemon.length
            )
        ];

    updateGuessCount();

    updateRemainingCount();

    pokemonInput.value = "";

    pokemonInput.focus();

    console.log(
        "Answer :",
        answerPokemon.name
    );

}

// ----------------------------
// 表示更新
// ----------------------------

function updateRemainingCount() {

    remainingCount.textContent =
        "残り候補：" +
        filteredPokemon.length;

}

function updateGuessCount() {

    guessCounter.textContent =
        "回数：" +
        guessCount;

}
// ==========================================
// app.js Part 2
// 入力・オートコンプリート・推測
// ==========================================

// ----------------------------
// イベント追加
// ----------------------------

pokemonInput.addEventListener("input", onInput);

pokemonInput.addEventListener("keydown", (e) => {

    if (e.key === "Enter") {

        submitGuess();

    }

});

guessButton.addEventListener("click", submitGuess);

// ----------------------------
// オートコンプリート
// ----------------------------

function onInput() {

    const keyword = pokemonInput.value
        .trim()
        .toLowerCase();

    autocompleteList.innerHTML = "";

    if (keyword.length === 0) {

        return;

    }

    const results = filteredPokemon
        .filter(pokemon =>
            pokemon.name
                .toLowerCase()
                .startsWith(keyword)
        )
        .slice(0, 15);

    results.forEach(pokemon => {

        const li = document.createElement("li");

        li.textContent = pokemon.name;

        li.addEventListener("click", () => {

            pokemonInput.value = pokemon.name;

            autocompleteList.innerHTML = "";

            submitGuess();

        });

        autocompleteList.appendChild(li);

    });

}

// ----------------------------
// 推測
// ----------------------------

function submitGuess() {

    if (!gameStarted) {

        alert("ゲームを開始してください。");

        return;

    }

    const name = pokemonInput.value.trim();

    if (name === "") {

        return;

    }

    const guessPokemon =
        filteredPokemon.find(p => p.name === name);

    if (!guessPokemon) {

        alert("ポケモンが見つかりません。");

        return;

    }

    guessCount++;

    updateGuessCount();

    addHistory(guessPokemon);

    pokemonInput.value = "";

    autocompleteList.innerHTML = "";

    pokemonInput.focus();

}

// ----------------------------
// 履歴追加
// ----------------------------

function addHistory(guessPokemon) {

    const compareResult =
        comparePokemon(
            guessPokemon,
            answerPokemon
        );

    history.push({

        pokemon: guessPokemon,

        result: compareResult

    });

    drawHistoryRow(
        guessPokemon,
        compareResult
    );

    checkAnswer(
        guessPokemon
    );

}

// ----------------------------
// 正解判定
// ----------------------------

function checkAnswer(guessPokemon) {

    if (
        guessPokemon.id !==
        answerPokemon.id
    ) {

        return;

    }

    gameStarted = false;

    answerImage.src =
        answerPokemon.sprite;

    answerName.textContent =
        answerPokemon.name;

    answerText.textContent =
        guessCount +
        "回で正解しました！";

    answerSection.classList.remove("hidden");

}

// ----------------------------
// テーブル描画
// ----------------------------

function drawHistoryRow(
    pokemon,
    result
) {

    const tr =
        document.createElement("tr");

    tr.classList.add("fade-in");

    // 画像

    const tdImage =
        document.createElement("td");

    tdImage.innerHTML =
        `<img src="${pokemon.sprite}">`;

    tr.appendChild(tdImage);

    // 名前

    const tdName =
        document.createElement("td");

    tdName.textContent =
        pokemon.name;

    tr.appendChild(tdName);

    // compare.js が返すデータを描画

    result.forEach(cell => {

        const td =
            document.createElement("td");

        td.textContent =
            cell.text;

        td.className =
            cell.className;

        tr.appendChild(td);

    });

    historyBody.prepend(tr);

}
// ==========================================
// app.js Part 3
// 候補数・ランキング・次ゲーム
// ==========================================

// --------------------------------------
// 候補を絞り込む
// --------------------------------------

function updateCandidates() {

    filteredPokemon = filteredPokemon.filter(candidate => {

        for (const item of history) {

            const result = comparePokemon(
                candidate,
                item.pokemon
            );

            if (!compareEqual(result, item.result)) {

                return false;

            }

        }

        return true;

    });

    updateRemainingCount();

}

// --------------------------------------
// compare結果一致判定
// --------------------------------------

function compareEqual(a, b) {

    if (a.length !== b.length) {

        return false;

    }

    for (let i = 0; i < a.length; i++) {

        if (a[i].text !== b[i].text) {

            return false;

        }

        if (a[i].className !== b[i].className) {

            return false;

        }

    }

    return true;

}

// --------------------------------------
// submitGuessを書き換え
// --------------------------------------

const originalSubmitGuess = submitGuess;

submitGuess = function () {

    originalSubmitGuess();

    if (!gameStarted) {

        return;

    }

    updateCandidates();

};

// --------------------------------------
// 次のゲーム
// --------------------------------------

nextGameButton.addEventListener("click", () => {

    answerSection.classList.add("hidden");

    autocompleteList.innerHTML = "";

    historyBody.innerHTML = "";

    filteredPokemon = [...pokemonDatabase];

    applyFilters();

    startGame();

});

// --------------------------------------
// ランキング
// --------------------------------------

const rankingKey = "pokemon-guesser-ranking";

function saveRanking(score) {

    let ranking =
        JSON.parse(
            localStorage.getItem(rankingKey)
        ) || [];

    ranking.push(score);

    ranking.sort((a, b) => a - b);

    ranking = ranking.slice(0, 10);

    localStorage.setItem(
        rankingKey,
        JSON.stringify(ranking)
    );

    drawRanking();

}

function drawRanking() {

    const ranking =
        JSON.parse(
            localStorage.getItem(rankingKey)
        ) || [];

    const list =
        document.getElementById(
            "ranking-list"
        );

    list.innerHTML = "";

    ranking.forEach(score => {

        const li =
            document.createElement("li");

        li.textContent =
            score + "回";

        list.appendChild(li);

    });

}

// --------------------------------------
// 正解時ランキング保存
// --------------------------------------

const originalCheckAnswer = checkAnswer;

checkAnswer = function (pokemon) {

    originalCheckAnswer(pokemon);

    if (!gameStarted) {

        saveRanking(guessCount);

    }

};

// --------------------------------------
// Firebase
// --------------------------------------

function createRoom() {

    if (!window.firebaseDB) {

        return;

    }

    // firebase.jsで実装予定

}

function joinRoom(code) {

    if (!window.firebaseDB) {

        return;

    }

}

function syncGuess(data) {

    if (!window.firebaseDB) {

        return;

    }

}

function syncWinner() {

    if (!window.firebaseDB) {

        return;

    }

}

// --------------------------------------
// 起動
// --------------------------------------

drawRanking();

console.log("app.js Complete");
