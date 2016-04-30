// the main js code called by Jquery on doc ready
$(document).ready (function() {
    
    // NEXT: see if you can update the button. go to battle, go to war,
    // play again, and have it greyed out while the text is loading
    // maybe create a new function, next(), that determines which action is
    // required of the user. the text is easy to change inside the game.
    // maybe var state = "battle" "war" "start" "waiting"
    
    
    // define the Card constructor
    var Card = function(name, suit) {
        this.name = name;
        this.suit = suit;
    };
    
    Card.prototype.description = function() {
        return "the " + this.name + " of " + this.suit;
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
                return parseInt(this.name);
        }
    };
    
    var Stack = function() {
        this.cards = [];
    };
    
    // remove a card from the top of the stack
    Stack.prototype.playCard = function() {
        return this.cards.shift();
    }
    
    // add a card to the bottom of the stack
    Stack.prototype.take = function(card) {
        this.cards[this.cards.length] = card;
    }
    
    // returns the card most recently added to the stack
    Stack.prototype.recentCard = function() {
        return this.cards[this.cards.length - 1];
    }
    
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
    
    // it looks like it's easier to make Deck a child of Stack
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
        // I added the shuffle here, because why not
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
    var results = "";
    var gameOver = false;


    // this is for starting a new game
    function newGame() {
        deck = new Deck();
        player1 = new Player("Player 1");
        player2 = new Player("Player 2");
        cardsInPlay = {};
        results = "";
        gameOver = false;
    }
    
    function dealCards() {
        while(deck.notEmpty()) {
            player1.take(deck.draw());
            player2.take(deck.draw());
        }
    }
    
    function newBattle() {
        cardsInPlay = {};
        cardsInPlay[player1.name] = new Stack();
        cardsInPlay[player2.name] = new Stack();
        results = "";
    }
    
    function takeTurnPlayingCards(player, num) {
        while (num > 0) {
            if (player.loses()) {
                gameOver = true;
                printLosingMessage(player);
                num = 0;
            } else {
                cardsInPlay[player.name].take(player.playCard());
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
            } else if (cardsInPlay[player1.name].recentCard().value() < cardsInPlay[player2.name].recentCard().value()) {
                theWinnerIs(player2);
            } else {
                war();
            }
        }
    }
    
    function war() {
        printNotification(player1.name + " plays " + cardsInPlay[player1.name].recentCard().description() + " and "
                + player2.name + " plays " + cardsInPlay[player2.name].recentCard().description());
        printNotification("THIS MEANS WAR!");
        // $("#next").text("Go to War");
        // document.getElementById("next").addEventListener("click", function() { alert("you clicked it!"); }, false);
        takeTurnPlayingCards(player1, 2);
        takeTurnPlayingCards(player2, 2);
        chooseWinner();
    }
    
    // this function slowly prints the game notifications to the screen
    function printNotification(message) {
        // the combination of queue, setTimeout, and animate slow the loading text down
        // this is a combination of answers I found on the web
        // other combinations did not work
        $('BODY').queue(function() { 
            setTimeout(function(){
                var elem = document.createElement("div");
                elem.className = "notification";
                elem.textContent = message;
                elem.style.opacity = 0;
                $("#content").prepend(elem);
                $("#content div:first-child").animate( { opacity: 1 }, 750, function() { $('BODY').dequeue(); });
                // the following code is one of the combinations that didn't work.
                //$(".notification").delay(1000).fadeIn("slow", function() { $('BODY').dequeue(); });
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
        
        printNotification(winner.name + " wins with " + cardsInPlay[winner.name].recentCard().description()
                + " versus " + cardsInPlay[loser.name].recentCard().description());
        collectPot();
        while (pot.notEmpty()) {
            winner.take(pot.draw());
            printNotification(winner.name + " gains " + winner.recentCard().description());
        }
        printNumCards();
    }
    
    function printNumCards() {
        //printNotification(player1.name + " has " + player1.numCards() + " cards.");
        //printNotification(player2.name + " has " + player2.numCards() + " cards.");
        $('BODY').queue(function() {
            $("#player1cards").fadeOut(500, function() {
                $(this).text(player1.numCards() + " cards").fadeIn(500);
            });
            $("#player2cards").fadeOut(500, function() {
                $(this).text(player2.numCards() + " cards").fadeIn(500, function() { $('BODY').dequeue(); });
            });
        });
    }
    
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
        printNotification(player.name + " loses!");
        printNotification("GAME OVER");
    }
    
    function askToContinue() {
        if (!gameOver) {
            if (player1.loses()) {
                printLosingMessage(player1);
            } else if (player2.loses()) {
                printLosingMessage(player2);
            } else {
                // results += "<button onclick='doBattle()'>Play Next Turn</a>";
            }
        }
    }
    
    dealCards();
    
    $("#buttons").append("<button id='next'>Battle</a>");
    
    document.getElementById("next").addEventListener("click", doBattle, false);
    
});
