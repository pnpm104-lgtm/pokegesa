// ==========================================
// compare.js
// Pokemon比較エンジン
// ==========================================

"use strict";

// --------------------------------------
// メイン
// --------------------------------------

function comparePokemon(guess, answer) {

    const result = [];

    result.push(compareTypes(
        guess.types,
        answer.types
    ));

    result.push(compareGeneration(
        guess.generation,
        answer.generation
    ));

    result.push(compareNumber(
        guess.height,
        answer.height,
        "m"
    ));

    result.push(compareNumber(
        guess.weight,
        answer.weight,
        "kg"
    ));

    result.push(compareNumber(
        guess.hp,
        answer.hp
    ));

    result.push(compareNumber(
        guess.attack,
        answer.attack
    ));

    result.push(compareNumber(
        guess.defense,
        answer.defense
    ));

    result.push(compareNumber(
        guess.spAttack,
        answer.spAttack
    ));

    result.push(compareNumber(
        guess.spDefense,
        answer.spDefense
    ));

    result.push(compareNumber(
        guess.speed,
        answer.speed
    ));

    result.push(compareNumber(
        totalStats(guess),
        totalStats(answer)
    ));

    result.push(compareAbilities(
        guess.abilities,
        answer.abilities
    ));

    result.push(compareEvolution(
        guess.evolutionStage,
        answer.evolutionStage
    ));

    return result;

}

// --------------------------------------
// 数値比較
// --------------------------------------

function compareNumber(user, answer, unit = "") {

    if (user === answer) {

        return {
            text: "🟩 " + user + unit,
            className: "cell-match"
        };

    }

    if (user < answer) {

        return {
            text: "⬆ " + user + unit,
            className: "cell-up"
        };

    }

    return {
        text: "⬇ " + user + unit,
        className: "cell-down"
    };

}

// --------------------------------------
// タイプ比較
// --------------------------------------

function compareTypes(user, answer) {

    const match =
        user.filter(type =>
            answer.includes(type)
        );

    if (
        match.length === user.length &&
        match.length === answer.length
    ) {

        return {
            text: "🟩",
            className: "cell-match"
        };

    }

    if (match.length > 0) {

        return {
            text: "🟨 " + match.join("/"),
            className: "cell-partial"
        };

    }

    return {
        text: "🟥",
        className: "cell-differ"
    };

}

// --------------------------------------
// 世代比較
// --------------------------------------

function compareGeneration(user, answer) {

    return compareNumber(
        user,
        answer,
        "世"
    );

}

// --------------------------------------
// 特性比較
// --------------------------------------

function compareAbilities(user, answer) {

    const match =
        user.filter(a =>
            answer.includes(a)
        );

    if (match.length === answer.length &&
        match.length === user.length) {

        return {
            text: "🟩",
            className: "cell-match"
        };

    }

    if (match.length > 0) {

        return {
            text: "🟨",
            className: "cell-partial"
        };

    }

    return {
        text: "🟥",
        className: "cell-differ"
    };

}

// --------------------------------------
// 進化段階
// --------------------------------------

function compareEvolution(user, answer) {

    return compareNumber(user, answer);

}

// --------------------------------------
// 合計種族値
// --------------------------------------

function totalStats(pokemon) {

    return

        pokemon.hp +

        pokemon.attack +

        pokemon.defense +

        pokemon.spAttack +

        pokemon.spDefense +

        pokemon.speed;

}

// --------------------------------------
// デバッグ
// --------------------------------------

console.log("compare.js loaded");
