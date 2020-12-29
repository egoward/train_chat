'use strict';

//Our coordinate space is 20m x 10m
var gameSize = {x:20, y:10};

var objects = {};

//We are playing on a 20 x 10 pitch
var mousePos = {x:0,y:0};
var canvasSize = {x:0,y:0};
var timeLastFrame;

function canvasToGame(p) {
    return {
        x:  gameSize.x * p.x / canvasSize.x, 
        y:  gameSize.y * p.y / canvasSize.y,
    };
}

function getPlayerName() {
    if( !serverConnection.userMe)
        return null;
    if( serverConnection.userMe.uniqueID === objects.player1.playerid) {
        return 'player1';
    } else if( serverConnection.userMe.uniqueID === objects.player2.playerid) {
        return 'player2';
    } else {
        return null;
    }
}

function startNewGame() {
    objects.ball.p = {x:10,y:5}
    objects.ball.v = {x:0,y:0}
    while( Math.abs(objects.ball.v.x) < 3 || Math.abs(objects.ball.v.y) < 1 ){
        var speed = 3+Math.random()*10;
        var direction = 2 * Math.PI * Math.random();
        objects.ball.v = {x:Math.cos(direction) * speed, y:Math.sin(direction)*speed};
    }
    serverConnection.broadcastChanges(['ball','score','player1','player2'],true)
}

function goFaster() {
    objects.ball.v.x *= 1.1;
    objects.ball.v.y *= 1.1;
}

function moveBall(o,t) {
    var pNew = {
        x : o.p.x + o.v.x * t,
        y: o.p.y + o.v.y * t
    }
    if( pNew.y - o.size< 0 ) {
        o.v.y *= -1;
    }
    if( pNew.y + o.size > gameSize.y ) {
        o.v.y *= -1;
    }

    var playerName = getPlayerName();
    var player1 = objects.player1;
    var player2 = objects.player2;

    if( o.p.x - o.size > player1.x + player1.thickness && pNew.x - o.size < player1.x + player1.thickness) {
        if( o.p.y + o.size < player1.top ) {
            console.log("Above player1")
        } else if( o.p.y - o.size > player1.top + player1.height ) {
            console.log("Below player1");
        } else {
            o.v.x *= -1;
            if( playerName == 'player1') {
                goFaster();
                serverConnection.broadcastChanges(['ball']);
            }
        }
    }

    if( o.p.x + o.size < player2.x && pNew.x + o.size > player2.x) {
        if( o.p.y + o.size < player2.top ) {
            console.log("Above player2")
        } else if( o.p.y - o.size > player2.top + player2.height ) {
            console.log("Below player2");
        } else {
            o.v.x *= -1;
            if( playerName == 'player2') {
                goFaster();
                serverConnection.broadcastChanges(['ball']);
            }
        }
    }

    if( playerName == 'player2') {
        if( pNew.x - o.size < 0 ) {
            player2.score++;
            serverConnection.sendMessage( { type:"broadcast", text:"Player 2 scored a point  Score:" + player1.score + '-' + player2.score});
            startNewGame();
        }
    }

    if( playerName == 'player1') {
        if( pNew.x + o.size > gameSize.x ) {
            player1.score++;
            serverConnection.sendMessage( { type:"broadcast", text:"Player 1 scored a point.  Score:"+ player1.score + '-' + player2.score});
            startNewGame();
        }    
    }

    pNew = {
        x : o.p.x + o.v.x * t,
        y: o.p.y + o.v.y * t
    }
    o.p = pNew;
}

function moveAll(secondsPassed) {
    //Don't try to jump forward more than half a second
    if(secondsPassed > 0.5 ) {
        secondsPassed = 0.5;
    }
    if(!objects.ball) {
        return;
    }
    moveBall(objects.ball, secondsPassed);
}

function drawAll(ctx) {

    ctx.clearRect(0,0,canvasSize.x,canvasSize.y);
    ctx.save();

    ctx.fillStyle = 'red'
    ctx.fillRect(mousePos.x-2, mousePos.y-2, 2 , 2);

    //Scale our 2 x 1 screen to fit.
    ctx.scale(canvasSize.x/20,canvasSize.y/10);

    var player1 = objects.player1;
    var player2 = objects.player2;
    var ball = objects.ball;
    if(!player1 || !player2 || !ball)
        return;

    ctx.fillRect(player1.x, player1.top, player1.thickness, player1.height);
    ctx.fillRect(player2.x, player2.top, player2.thickness, player2.height);

    ctx.fillRect(ball.p.x - ball.size, ball.p.y- ball.size,ball.size*2,ball.size*2);

    ctx.lineWidth = 0.01;                
    for(var x=0;x<=20;x++) {
        ctx.beginPath();
        ctx.moveTo(x,0);
        ctx.lineTo(x,gameSize.y);
        ctx.stroke();
    }
    for(var y=0;y<=10;y++) {
        ctx.beginPath();
        ctx.moveTo(0,y);
        ctx.lineTo(gameSize.x,y);
        ctx.stroke();
    }

    ctx.restore();

}

function redraw() {
    var canvas = document.getElementById('canvas');
    var ctx = canvas.getContext("2d");
    drawAll(ctx, {x:canvas.width, y:canvas.height});
}

function resize() {
    var canvas = document.getElementById('canvas');
    var window = {x:canvas.parentNode.offsetWidth, y:canvas.parentNode.offsetHeight};

    if( window.x / window.y > gameSize.x / gameSize.y) {
        //Parent is wider aspect than game, use full width
        console.log("Wide screen, height will be reduced")
        canvasSize = {x:window.y * (gameSize.x / gameSize.y),  y:window.y };
    } else {
        console.log("Narrow screen, width will be reduced")
        canvasSize = {x:window.x,  y:window.x * (gameSize.y / gameSize.x) };
    }
    console.log("Window", window );
    console.log("Canvas", canvasSize );

    // canvasSize = {x:2000, y:1000};
    //canvasSize = {x:canvas.parentNode.offsetWidth, y:canvas.parentNode.offsetHeight};
    canvas.width = canvasSize.x;
    canvas.height = canvasSize.y;

    redraw();
}

function animationFrame(timeThisFrame) {
    if( timeLastFrame ) {
        moveAll( (timeThisFrame - timeLastFrame)/1000);
    }
    redraw();
    timeLastFrame = timeThisFrame;
    window.requestAnimationFrame(animationFrame);
}

function mouseMove(e) {
    mousePos = {x:e.offsetX, y:e.offsetY};
    var p = canvasToGame(mousePos);
    var playerName = getPlayerName();
    if(playerName) {
        objects[ playerName ].top = p.y;
        serverConnection.broadcastChanges([playerName]);
    }

}

class Pong {
    server_login(msg) {

        objects = serverConnection.sharedObjects;

        var defaultObjects = {
            player1:{
                x:0.5,
                top:0,
                height:1.5,
                thickness:0.5,
                score:0,
                playerid:null
            },
            player2:{
                x:19,
                top:0,
                height:1.5,
                thickness:0.5,
                score:0,
                playerid:null
            },
            ball:{ 
                p:{x:10,y:5},
                v:{x:-5,y:5},
                size:0.2
            },
            score: {}
        }
        
        serverConnection.createAndSendObjects(defaultObjects);
        var userArray = Object.values(msg.users);

        if( userArray.length == 1 ) {
            console.log("First player - taking player 1")
            objects.player1.playerid = userArray[0].uniqueID;
            objects.player2.playerid = null;
            startNewGame();
        } else if(userArray.length >=2 ) {
            console.log("Second player - taking player 2")
            objects.player1.playerid = userArray[0].uniqueID;
            objects.player2.playerid = userArray[1].uniqueID;
            startNewGame();
        } else {
            console.log("Too many users already")
        }
        this.objects = serverConnection.sharedObjects;
        this.updateScoreboard();
        resize();
    }

    updateScoreboard() {
        console.log("Updating scoreboard to " + objects.player1.score + '-' + objects.player2.score );

        const formatUser = function(player) {
            if(!this.serverConnection || !this.serverConnection.users)
                return '?';
            var user = this.serverConnection.users[player.playerid];
            var playerName = user?user.playerName : "Unknown"
            if(player.playerid == serverConnection.userMe.uniqueID) {
                playerName += " (You)";
            }
            return playerName + " : " + player.score;
        }.bind(this);

        var header = document.getElementById('header');
        header.innerText = formatUser(objects.player1) + "    " + formatUser(objects.player2);
    }

    on_update(key,obj) {
        if( key === 'score' ) {
            this.updateScoreboard();
        }
    }
}

var pong = new Pong();
var serverConnection = new ServerConnection(pong);
pong.serverConnection = serverConnection;

function onload() {
    // serverConnection.connect("ws:18.133.204.125:8080?playerName=New");
    serverConnection.connect("ws:localhost:8080?playerName=New");
    resize();

    window.requestAnimationFrame(animationFrame);
    document.getElementById('canvas').addEventListener('mousemove', mouseMove);
}
