// the main js code called by Jquery on doc ready
$(document).ready (function() {

    // define the Card constructor
    var Card = function(name, suit) {
        this.name = name;
        this.suit = suit;
        if (suit == "Hearts") {
            this.symbol = "\u2665";
        } else if (suit == "Diamonds") {
            this.symbol = "\u2666";
        } else if (suit == "Clubs") {
            this.symbol = "\u2663";
        } else {
            this.symbol = "\u2660";
        }
    };
    
    Card.prototype.description = function() {
        return "the " + this.name + " of " + this.suit + " " + this.symbol;
    };
    
    // return the integer value of the card
    Card.prototype.value = function() {
        switch (this.name[0]) {
            case "J":
                return 11;
            case "Q":
                return 12;
            case "K":
                return 13;
            case "A":
                return 14;
            default:
                return parseInt(this.name, 10);
        }
    };
    
    var Stack = function() {
        this.cards = [];
    };
    
    // remove a card from the top of the stack
    Stack.prototype.playCard = function() {
        return this.cards.shift();
    };
    
    // add a card to the bottom of the stack
    Stack.prototype.take = function(card) {
        this.cards[this.cards.length] = card;
    };
    
    // returns the card most recently added to the stack
    Stack.prototype.recentCard = function() {
        return this.cards[this.cards.length - 1];
    };
    
    Stack.prototype.notEmpty = function() {
        if (this.cards.length == 0) {
            return false;
        } else {
            return true;
        }
    };
    
    Stack.prototype.deckSize = function () {
        return this.cards.length;
    };

    // remove a card from "top" of the deck
    // it's really being removed from the bottom, but that's okay as long as
    // it's not used for a player's stack
    Stack.prototype.draw = function() {
        return this.cards.pop();
    };

    /**
     * Randomize array element order in-place.
     * Using Durstenfeld shuffle algorithm.
     */
    function shuffleArray(array) {
        for (var i = array.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
        return array;
    }
    
    // define the Deck constructor
    function Deck () {
        Stack.call(this);
        this.suits = ["Hearts", "Diamonds", "Clubs", "Spades"];
        this.names = ["Ace", "2", "3", "4", "5", "6", "7", "8", "9", "10", "Jack", "Queen", "King"];
        for (var i = 0; i < this.suits.length; i++) {
            for (var j = 0; j < this.names.length; j++) {
                this.cards[this.cards.length] = new Card(this.names[j], this.suits[i]);
            }
        }
        shuffleArray(this.cards);
    }
    
    // create a Deck.prototype object that inherits from Stack.prototype
    Deck.prototype = Object.create(Stack.prototype);
    // set the "constructor" property to refer to Deck
    Deck.prototype.constructor = Deck;
    
    // define the Player constructor
    var Player = function(name) {
        this.name = name;
        this.stack = new Stack();
    };
    
    Player.prototype.playCard = function() {
        return this.stack.playCard();
    };
    
    Player.prototype.take = function(card) {
        this.stack.take(card);
    };
    
    Player.prototype.recentCard = function() {
        return this.stack.recentCard();
    };
    
    Player.prototype.numCards = function() {
        return this.stack.deckSize();
    };
    
    Player.prototype.loses = function() {
        return !this.stack.notEmpty();
    };
    
    // all that mess above sets up the classes
    // below here is where the game starts
    
    // set up the game
    var deck = new Deck();
    var player1 = new Player("Player 1");
    var player2 = new Player("Player 2");
    var cardsInPlay = {};
    var pot;
    var gameOver = false;
    var state = "battle";
    var battleCry = "battle";
    var warCry = "Go to War";
    var newCry = "Play Again";
    var wins = {};
    wins[player1.name] = 0;
    wins[player2.name] = 0;
    var firstGame = true;


    // this resets variables for starting a new game
    function newGame() {
        deck = new Deck();
        player1 = new Player("Player 1");
        player2 = new Player("Player 2");
        cardsInPlay = {};
        gameOver = false;
        dealCards();
        printNotification("The cards have been dealt!", 1);
        unfadeButton("battle");
        printNumCards();
    }
    
    // determines what needs to happen when the user clicks the button
    function next() {
        if (state == "battle") {
            fadeButton();
            doBattle();
        } else if (state == "war") {
            fadeButton();
            goToWar();
        } else if (state == "start") {
            fadeButton();
            newGame();
        } else {
            // it's in waiting mode. do nothing.
        }
    }
    
    // prevent user from activating button while text is printing
    function fadeButton() {
        state = "waiting";
        document.getElementById("next").style.border = "1px solid #aaa";
        document.getElementById("next").style.color = "#aaa";
    }
    
    function unfadeButton(newState) {
        $('BODY').queue(function() {
            document.getElementById("next").style.border = "1px solid #000";
            document.getElementById("next").style.color = "#000";
            if (newState == "battle") {
                if ($("#next").text() != battleCry) {
                    $("#next").fadeOut(500, function() {
                        $(this).text(battleCry).fadeIn(500);
                    });
                }
             } else if (newState == "war") {
                if ($("#next").text() != warCry) {
                    $("#next").fadeOut(500, function() {
                        $(this).text(warCry).fadeIn(500);
                    });
                }
             } else if (newState == "start") {
                $("#next").fadeOut(500, function() {
                    $(this).text(newCry).fadeIn(500);
                });
            }
            state = newState;
            $('BODY').dequeue();
        });
    }
    
    function dealCards() {
        while(deck.notEmpty()) {
            player1.take(deck.draw());
            player2.take(deck.draw());
        }
    }
    
    // resets variables for new battle
    function newBattle() {
        cardsInPlay = {};
        cardsInPlay[player1.name] = new Stack();
        cardsInPlay[player2.name] = new Stack();
    }
    
    function takeTurnPlayingCards(player, num) {
        while (num > 0 && !gameOver) {
            // check if player is out of cards first
            if (player.loses()) {
                gameOver = true;
                printNumCards();
                printLosingMessage(player);
                num = 0;
            } else {
                cardsInPlay[player.name].take(player.playCard());
                if (num > 1) {
                    // for the first card played while at war
                    printNotification(player.name + " lays one card face down.");
                } else {
                    printNotification(player.name + " plays " + cardsInPlay[player.name].recentCard().description());
                }
                num--;
            }
        }
    }
    
    function doBattle() {
        newBattle();
        takeTurnPlayingCards(player1, 1);
        takeTurnPlayingCards(player2, 1);
        chooseWinner();
    }
    
    function chooseWinner() {
        if (!gameOver) {
            if (cardsInPlay[player1.name].recentCard().value() > cardsInPlay[player2.name].recentCard().value()) {
                theWinnerIs(player1);
                checkToContinue();
            } else if (cardsInPlay[player1.name].recentCard().value() < cardsInPlay[player2.name].recentCard().value()) {
                theWinnerIs(player2);
                checkToContinue();
            } else {
                war();
            }
        }
    }
    
    function war() {
        printNotification("THIS MEANS WAR!");
        unfadeButton("war");
    }
    
    function goToWar() {
        // two cards are played during war:
        // the first face down, the second face up
        takeTurnPlayingCards(player1, 2);
        takeTurnPlayingCards(player2, 2);
        chooseWinner();
    }
     
    // this function slowly prints the game notifications to the screen
    function printNotification(message, attention) {
        // the combination of queue, setTimeout, and animate slow the loading text down
        // this is a combination of answers I found on the web
        // other combinations did not work
        $('BODY').queue(function() { 
            setTimeout(function(){
                var elem = document.createElement("div");
                elem.className = "notification";
                elem.textContent = message;
                elem.style.opacity = 0;
                if (attention != null) {
                    elem.style.fontWeight = "bold";
                    elem.style.color = "red";
                }
                $("#content").prepend(elem);
                $("#content div:first-child").animate( { opacity: 1 }, 750, function() { $('BODY').dequeue(); });
            }, 700);
        });
    }
    
    function theWinnerIs(winner) {
        var loser;
        if (winner == player1) {
            loser = player2;
        } else {
            loser = player1;
        }
        
        printNotification(winner.name + " wins!");
        
        collectPot();
        while (pot.notEmpty()) {
            winner.take(pot.draw());
            // don't print out this mess if one of the players is already out of cards
            if (!loser.loses()) {
                printNotification(winner.name + " gains " + winner.recentCard().description());
            }
        }
        printNumCards();
    }
    
    // updates the scoreboard
    function printNumCards() {
        $('BODY').queue(function() {
            $("#player1cards").fadeOut(500, function() {
                $(this).text(player1.numCards() + ((player1.numCards() == 1) ? " card\u00A0" : " cards")).fadeIn(500);
            });
            $("#player2cards").fadeOut(500, function() {
                $(this).text(player2.numCards() + ((player2.numCards() == 1) ? " card\u00A0" : " cards")).fadeIn(500, function() { $('BODY').dequeue(); });
            });
        });
    }
    
    // updates the scoreboard
    function printNumWins() {
        if (firstGame) {
            $('BODY').queue(function() {
                $("#separator1").fadeIn(500, function() {
                    $(this).text("/").fadeIn(500);
                });
                $("#separator2").fadeIn(500, function() {
                    $(this).text("/").fadeIn(500);
                });
                $("#player1wins").fadeIn(500, function() {
                    $(this).text(wins[player1.name] + ((wins[player1.name] == 1) ? " win" : " wins")).fadeIn(500);
                });
                $("#player2wins").fadeIn(500, function() {
                    $(this).text(wins[player2.name] + ((wins[player2.name] == 1) ? " win" : " wins")).fadeIn(500, function() { $('BODY').dequeue(); });
                });
            });
            firstGame = false;
        } else {
            $('BODY').queue(function() {
                if (player2.loses()) {
                    $("#player1wins").fadeOut(500, function() {
                        $(this).text(wins[player1.name] + ((wins[player1.name] == 1) ? " win" : " wins")).fadeIn(500, function() { $('BODY').dequeue(); });
                    });
                } else {
                    $("#player2wins").fadeOut(500, function() {
                        $(this).text(wins[player2.name] + ((wins[player2.name] == 1) ? " win" : " wins")).fadeIn(500, function() { $('BODY').dequeue(); });
                    });
                }
            });
        }
    }
    
    // add all cards in play to a "pot" and shuffle the pot
    function collectPot() {
        pot = new Stack();
        grabCardsFrom(player1);
        grabCardsFrom(player2);
        shuffleArray(pot);
    }
    
    function grabCardsFrom(player) {
        while (cardsInPlay[player.name].notEmpty()) {
            pot.take(cardsInPlay[player.name].draw());
        }
    }
    
    function printLosingMessage(player) {
        printNotification(player.name + " has run out of cards.");
        printNotification(player.name + " loses!");
        printNotification("GAME OVER");
        unfadeButton("start");
        if (player.name == player1.name) {
            wins[player2.name] += 1;
        } else {
            wins[player1.name] += 1;
        }
        printNumWins();
    }
    
    function checkToContinue() {
        if (!gameOver) {
            if (player1.loses()) {
                printLosingMessage(player1);
            } else if (player2.loses()) {
                printLosingMessage(player2);
            } else {
                unfadeButton("battle");
            }
        }
    }
    
    dealCards();
    printNumCards();
    
    $("#buttons").prepend("<button id='next'>" + battleCry + "</a>");
    
    document.getElementById("next").addEventListener("click", next, false);
    
    // actives the button if user hits "enter"
    window.onkeydown = function (e) {
        var code = e.keyCode ? e.keyCode : e.which;
        if (code === 13) { //enter key
            next();
        }
    };

    
});
