// the main js code callbed by Jquery on doc ready
$(document).ready (function() {

    dealCards();
    playBlackjack();

});

// define the Card constructor
var Card = function(name, suit) {
    this.name = name;
    this.suit = suit;
};

Card.prototype.description = function() {
    return "the " + this.name + " of " + this.suit;
};

Card.prototype.value = function() {
    switch(this.name[0]) {
        case "A":
            return 11;
        case "J":
        case "Q":
        case "K":
            return 10;
        default:
            return parseInt(this.name, 10);
    }
};

// define the Hand constructor
var Hand = function () {
    this.cards = [];
};

// return the number of cards in the hand
Hand.prototype.numCards = function () {
    return this.cards.length;
};

// add a card to the hand
Hand.prototype.take = function (card) {
    this.cards[this.cards.length] = card;
};

// returns the card most recently added to the hand
Hand.prototype.recentCard = function () {
    return this.cards[this.cards.length - 1].description();
};

// returns the value of the hand
Hand.prototype.value = function () {
    var value = 0,
    aces = 0,
    i = 0;
    
    for (i = 0; i < this.cards.length; i++) {
        // check for Aces
        if (this.cards[i].value() == 11) {
            aces++;
        }
        value += this.cards[i].value();
    }
    
    // if the value is greater than 21, check for Aces that can = 1 instead of 11
    if (value > 21 && aces > 0) {
        i = 0;
        while (i < aces) {
            // don't change an Ace to a 1 unless the hand's value is over 21
            if (value > 21) {
                value = value - 10;
            }
            i++;
        }
    }
    
    return value;
};

// draw a card
Hand.prototype.draw = function () {
    return this.cards.pop();
};

// define the deck constructor
// this class is for a deck of 52 cards
var Deck = function () {
    Hand.call(this);
    this.suits = ["Hearts", "Diamonds", "Clubs", "Spades"];
    this.names = ["Ace", "2", "3", "4", "5", "6", "7", "8", "9", "10", "Jack", "Queen", "King"];
    // populate the cards array
    for (var i = 0; i < this.suits.length; i++) {
        for (var j = 0; j < this.names.length; j++) {
            this.cards[this.cards.length] = new Card(this.names[j], this.suits[i]);
        }
    }
    shuffleArray(this.cards);
};

// create a Deck.prototype object that inherits from Hand.prototype
Deck.prototype = Object.create(Hand.prototype);
// set the "constructor" property to refer to Hand
Deck.prototype.constructor = Deck;

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

// define the Player constructor
var Player = function (name) {
    this.name = name;
    this.hand = new Hand();
};

// return the cards in the player's hand
Player.prototype.hand = function () {
    return this.hand.cards;
};

// return the value of the player's hand
Player.prototype.value = function () {
    return this.hand.value();
};

// return the number of cards in the player's hand
Player.prototype.numCards = function () {
    return this.hand.numCards();
};

// add a card to the player's hand
Player.prototype.take = function (card) {
    this.hand.take(card);
};

// return the description of the most recent card in the player's hand
Player.prototype.recentCard = function () {
    return this.hand.recentCard();
};

/*
 * all that mess above sets up the classes
 * below here is where the game starts
 *
 */
 
 // set up the game
 var deck = new Deck();
 var players = [];
 players[0] = new Player("Dealer");
 players[1] = new Player("Player");

 // deal two cards to each player
 function dealCards () {
     for (var c = 0; c < 2; c++) {
         // dealer deals one card to each player in turn, then himself
         for (var i = players.length - 1; i >= 0; i--) {
             dealCardTo(players[i]);
         }
     }
 }

// deal one card to the player
function dealCardTo (player) {
    player.take(deck.draw());
    // check if current player is the dealer and if it's his first card
    if (player.name == players[0].name && player.numCards() == 1) {
        printMsg(player.name + " lays one card face down.");
    } else {
        printMsg(player.name + " receives " + player.recentCard() + ".");
    }
}

function playBlackjack (choice) {
    // players don't hit on Blackjack. now it's the dealer's turn.
    if (hasBlackjack(players[1])) {
        dealersTurn(players[0]);
    } else if (choice == "hit") {
        printMsg(players[1].name + " chooses to hit.");
        dealCardTo(players[1]);
        if (hasBlackjack(players[1])) {
            dealersTurn(players[0]);
        } else if (goesBust(players[1])) {
            gameOver();
        } else {
            showHandValue(players[1]);
            chooseNextMove();
        }
    } else if (choice == "stand") {
        printMsg(players[1].name + " stands.");
        dealersTurn(players[0]);
    } else {
        chooseNextMove();
    }
}

function chooseNextMove() {
    printMsg("<a href='#' onclick=\"playBlackjack('hit')\">Hit</a> or <a href='#' onclick=\"playBlackjack('stand')\">Stand</a>?");
}

// the dealer takes his turn
function dealersTurn (dealer) {
    // the first thing he does is flip over the card he laid face down
    if (dealer.numCards() == 2) {
        printMsg(dealer.name + " flips over the card. It's " + dealer.hand.cards[0].description() + ".");
    }
    if (hasBlackjack(dealer)) {         // if the dealer has Blackjack, the game is over
        chooseWinner();
    } else if (goesBust(dealer)) {      // the dealer loses if he goes bust
        printMsg("You win!");
        gameOver();
    } else if (dealer.value() < 17) {     // the dealer hits for any hand with a value < 17
        printMsg(dealer.name + " chooses to hit.");
        dealCardTo(dealer);
        dealersTurn(dealer);
    } else {                            // the dealer stands for any hand with a value > 17. soft Aces are not hit on.
        printMsg(dealer.name + " stands.");
        showHandValue(dealer);
        chooseWinner();
    }
}

// show the value of a player's hand
function showHandValue (player) {
    printMsg(player.name + "'s hand has a value of " + player.value() + ".");
}

// returns true if the player has Blackjack
var hasBlackjack = function (player) {
    if (player.value() == 21) {
        printMsg(player.name + " has Blackjack!");
        return true;
    } else {
        return false;
    }
};
        
// returns true if the player goes bust
var goesBust = function (player) {
    if (player.value() > 21) {
        printMsg(player.name + " goes bust.");
        return true;
    } else {
        return false;
    }
}

function chooseWinner() {
    if (players[0].value() == players[1].value()) {
        printMsg("It's a tie!");
    } else if (players[1].value() > players[0].value()) {
        printMsg("You win!");
    } else {
        printMsg("You lose!");
    }
    gameOver();
}

function gameOver() {
    printMsg("<a href='/blackjack.html'>Play Again?</a>");
}

function printMsg (message) {
    $("#content").append(message + "<br>");
}
