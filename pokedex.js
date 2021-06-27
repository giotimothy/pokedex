"use strict";

/*
This .js file programs the behavior of my pokedex web app. It is responsible for all of the user interface
and behaviors of my pokedex. This pokedex web app can be used as a pokemon encyclopedia and is also a pokemon
game.
*/
(function() {
  const BASE_URL = "https://courses.cs.washington.edu/courses/cse154/webservices/pokedex/";
  const POKEDEX_API = "pokedex.php";
  const GAME_API = "game.php";
  let myPokemon;
  let myPokemonOriginalHp;
  let guid;
  let pid;
  window.addEventListener("load", initial);

  // initial
  function initial() {
    createPokedex();
    id("start-btn").addEventListener("click", initiateGame);
  }

  // createPokedex
  function createPokedex() {
    let allShortnameURL = BASE_URL + POKEDEX_API + "?pokedex=all";
    fetch(allShortnameURL)
      .then(checkStatus)
      .then(response => response.text())
      .then(setUpPokedex)
      .catch(console.error);
  }

  // setUpPokedex
  function setUpPokedex(resp) {
    let allShortnameArray = resp.split("\n");
    for (let i = 0; i < allShortnameArray.length; i++) {
      let oneShortnameArray = allShortnameArray[i].split(":");
      let oneShortname = oneShortnameArray[1];
      let oneSpriteURL = BASE_URL + "sprites/" + oneShortname + ".png";
      let spriteImage = gen("img");
      spriteImage.src = oneSpriteURL;
      spriteImage.id = oneShortname;
      spriteImage.alt = oneShortname + " image";
      spriteImage.classList.add("sprite");
      if (oneShortnameArray[0] === "Bulbasaur" || oneShortnameArray[0] === "Charmander" ||
          oneShortnameArray[0] === "Squirtle") {
        spriteImage.classList.add("found");
        spriteImage.addEventListener("click", createPokemonCard);
      }
      id("pokedex-view").appendChild(spriteImage);
    }
  }

  // createPokemonCard
  function createPokemonCard() {
    let pokemonShortname = this.id;
    myPokemon = this.id;
    let pokemonCardURL = BASE_URL + POKEDEX_API + "?pokemon=" + pokemonShortname;
    fetch(pokemonCardURL)
      .then(checkStatus)
      .then(response => response.json())
      .then(function(resp) {
        setUpPokemonCard(resp, "#p1");
      })
      .catch(console.error);
  }

  // setUpPokemonCard
  function setUpPokemonCard(pokemonJson, player) {
    qs(player + " .name").textContent = pokemonJson.name;
    qs(player + " .pokepic").src = BASE_URL + pokemonJson.images.photo;
    qs(player + " .type").src = BASE_URL + pokemonJson.images.typeIcon;
    qs(player + " .weakness").src = BASE_URL + pokemonJson.images.weaknessIcon;
    qs(player + " .hp").textContent = pokemonJson.hp + "HP";
    qs(player + " .info").textContent = pokemonJson.info.description;
    let moveObjectsArray = pokemonJson.moves;
    let moveButtonsArray = qsa(player + " > .card-container > .card > .moves > button");
    for (let j = 0; j < moveButtonsArray.length; j++) {
      moveButtonsArray[j].classList.remove("hidden");
    }
    let moveImagesArray = qsa(player + " > .card-container > .card > .moves img");
    let moveNamesArray = qsa(player + " > .card-container > .card > .moves .move");
    let moveDpArray = qsa(player + " > .card-container > .card > .moves .dp");
    let addedMoves = 0;
    while (addedMoves < 4 && addedMoves <= moveObjectsArray.length - 1) {
      let oneMove = moveObjectsArray[addedMoves];
      moveNamesArray[addedMoves].textContent = oneMove.name;
      moveImagesArray[addedMoves].src = BASE_URL + "icons/" + oneMove.type + ".jpg";
      if (Object.keys(oneMove).length === 3) {
        moveDpArray[addedMoves].textContent = oneMove.dp + " DP";
      }
      addedMoves++;
    }
    if (addedMoves !== 4) {
      for (let i = addedMoves; i < 4; i++) {
        moveButtonsArray[i].classList.add("hidden");
      }
    }
    if (player === "#p1") {
      myPokemonOriginalHp = pokemonJson.hp;
      id("start-btn").classList.remove("hidden");
    }
  }

  // initiateGame
  function initiateGame() {
    id("p1-turn-results").textContent = "";
    id("p2-turn-results").textContent = "";
    qs("#p1 .health-bar").style.width = "100%";
    qs("#p2 .health-bar").style.width = "100%";
    qs("#p1 .hp").textContent = myPokemonOriginalHp + "HP";
    qs("#p1 .health-bar").classList.remove("low-health");
    qs("#p2 .health-bar").classList.remove("low-health");
    let p1ButtonsArray = qsa("#p1 > .card-container > .card > .moves > button");
    for (let i = 0; i < p1ButtonsArray.length; i++) {
      p1ButtonsArray[i].disabled = false;
      p1ButtonsArray[i].addEventListener("click", makeAMove);
    }

    id("flee-btn").addEventListener("click", fleeFromBattle);
    id("pokedex-view").classList.add("hidden");
    id("p2").classList.toggle("hidden");
    qs("#p1 > .card-container > .hp-info").classList.toggle("hidden");
    id("results-container").classList.toggle("hidden");
    id("flee-btn").classList.toggle("hidden");
    id("start-btn").classList.toggle("hidden");
    qs("h1").textContent = "Pokemon Battle!";
    let startGameURL = BASE_URL + GAME_API;
    let startGameParams = new FormData();
    startGameParams.append("startgame", "true");
    startGameParams.append("mypokemon", myPokemon);
    fetch(startGameURL, {method: "POST", body: startGameParams})
      .then(checkStatus)
      .then(response => response.json())
      .then(executeGame)
      .catch(console.error);
  }

  // fleeFromBattle
  function fleeFromBattle() {
    let fleeURL = BASE_URL + GAME_API;
    let fleeParams = new FormData();
    fleeParams.append("guid", guid);
    fleeParams.append("pid", pid);
    fleeParams.append("movename", "flee");
    fetch(fleeURL, {method: "POST", body: fleeParams})
      .then(checkStatus)
      .then(response => response.json())
      .then(fleeMove)
      .catch(console.error);
  }

  // fleeMove
  function fleeMove(fleeJson) {
    showResults(fleeJson);
    qs("#p1 .hp").textContent = "0HP";
    qs("#p1 .health-bar").style.width = "0%";
    qs("#p1 .health-bar").classList.add("low-health");
    endGame(false, true);
  }

  // executeGame
  function executeGame(initialGameStateJson) {
    guid = initialGameStateJson.guid;
    pid = initialGameStateJson.pid;
    setUpPokemonCard(initialGameStateJson.p2, "#p2");
  }

  // makeAMove
  function makeAMove() {
    id("loading").classList.remove("hidden");
    let selectedMoveName = this.firstElementChild.textContent;
    let selectedMoveNoSpaces = selectedMoveName.replace(/\s+/g, "");
    let selectedMoveFinal = selectedMoveNoSpaces.toLowerCase();
    let makeMoveURL = BASE_URL + GAME_API;
    let makeMoveParams = new FormData();
    makeMoveParams.append("guid", guid);
    makeMoveParams.append("pid", pid);
    makeMoveParams.append("movename", selectedMoveFinal);
    fetch(makeMoveURL, {method: "POST", body: makeMoveParams})
      .then(checkStatus)
      .then(response => response.json())
      .then(updateGame)
      .catch(console.error);
  }

  // showResults
  function showResults(stateJson) {
    let resultJson = stateJson.results;
    id("p1-turn-results").classList.remove("hidden");
    id("p2-turn-results").classList.remove("hidden");
    id("p1-turn-results").textContent = "Player 1 played " + resultJson["p1-move"] + " and " +
                                        resultJson["p1-result"] + "!";
    id("p2-turn-results").textContent = "Player 2 played " + resultJson["p2-move"] + " and " +
                                        resultJson["p2-result"] + "!";
    if (resultJson["p2-result"] === null && resultJson["p2-move"] === null) {
      id("p2-turn-results").classList.add("hidden");
    }
  }

  // updateGame
  function updateGame(gameStateJson) {
    id("loading").classList.toggle("hidden");
    showResults(gameStateJson);
    let p1State = gameStateJson.p1;
    let p2State = gameStateJson.p2;
    myPokemonOriginalHp = p1State["hp"];
    let p1Percent = (p1State["current-hp"] / p1State["hp"]) * 100;
    let p2Percent = (p2State["current-hp"] / p2State["hp"]) * 100;
    qs("#p1 .hp").textContent = p1State["current-hp"] + "HP";
    qs("#p2 .hp").textContent = p2State["current-hp"] + "HP";
    qs("#p1 .health-bar").style.width = p1Percent + "%";
    qs("#p2 .health-bar").style.width = p2Percent + "%";
    if (p1Percent < 20) {
      qs("#p1 .health-bar").classList.add("low-health");
    }
    if (p2Percent < 20) {
      qs("#p2 .health-bar").classList.add("low-health");
    }
    if (p1State["current-hp"] === 0) {
      endGame(false, false);
    } else if (p2State["current-hp"] === 0) {
      if (!id(p2State["shortname"]).classList.contains("found")) {
        id(p2State["shortname"]).classList.add("found");
        id(p2State["shortname"]).addEventListener("click", createPokemonCard);
      }
      endGame(true, false);
    }
  }

  // endGame
  function endGame(player1Won, isFlee) {
    id("endgame").classList.remove("hidden");
    id("endgame").addEventListener("click", backToPokedex);
    id("flee-btn").classList.add("hidden");
    let p1Buttons = qsa("#p1 > .card-container > .card > .moves > button");
    for (let i = 0; i < p1Buttons.length; i++) {
      p1Buttons[i].disabled = true;
    }
    if (!player1Won || isFlee) {
      qs("h1").textContent = "You lost!";
    } else {
      qs("h1").textContent = "You won!";
    }
  }

  // backToPokedex
  function backToPokedex() {
    id("endgame").classList.add("hidden");
    id("results-container").classList.add("hidden");
    id("pokedex-view").classList.remove("hidden");
    id("p2").classList.add("hidden");
    qs("#p1 > .card-container > .hp-info").classList.toggle("hidden");
    id("start-btn").classList.remove("hidden");
    qs("#p1 .hp").textContent = myPokemonOriginalHp + "HP";
    qs("h1").textContent = "Your Pokedex";
  }

  // checkStatus
  async function checkStatus(res) {
    if (!res.ok) {
      throw new Error(await res.text());
    }
    return res;
  }

  /**
   * Returns the DOM object with the given id attribute.
   * @param {string} idName - element ID
   * @returns {object} DOM object associated with id (null if not found).
   */
  function id(idName) {
    return document.getElementById(idName);
  }

  /**
   * Returns the first DOM object that matches the given selector.
   * @param {string} selector - query selector.
   * @returns {object} The first DOM object matching the query.
   */
  function qs(selector) {
    return document.querySelector(selector);
  }

  /**
   * Returns an array of DOM objects that match the given selector.
   * @param {string} selector - query selector
   * @returns {object[]} array of DOM objects matching the query.
   */
  function qsa(selector) {
    return document.querySelectorAll(selector);
  }

  /**
   * Returns a new element with the given tag name.
   * @param {string} tagName - HTML tag name for new DOM element.
   * @returns {object} New DOM object for given HTML tag.
   */
  function gen(tagName) {
    return document.createElement(tagName);
  }
})();
