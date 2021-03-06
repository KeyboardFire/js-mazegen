/*

The MIT License (MIT)

Copyright (c) 2014 Keyboard Fire <http://keyboardfire.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/


InputTools = {
    num: function(id, initVal, minVal, maxVal, lbl) {
        var inputEl = document.createElement('input');
        inputEl.type = 'text';
        inputEl.id = id;
        inputEl.value = initVal;
        inputEl.onkeyup = function() {
            var newVal = inputEl.value.replace(/[^0-9]/g, '');
            if (newVal === '') newVal = '0';
            if (inputEl.value !== newVal) inputEl.value = newVal;
        };

        var inputElUp = document.createElement('input');
        inputElUp.type = 'button';
        inputElUp.value = '+';
        inputElUp.onclick = function() {
            var oldVal = parseInt(inputEl.value, 10);
            inputEl.value = isNaN(oldVal) ? 1 : Math.min(oldVal + 1, maxVal);
        };

        var inputElDown = document.createElement('input');
        inputElDown.type = 'button';
        inputElDown.value = '-';
        inputElDown.onclick = function() {
            var oldVal = parseInt(inputEl.value, 10);
            inputEl.value = isNaN(oldVal) ? 1 : Math.max(oldVal - 1, minVal);
        };

        var inputElLbl = document.createElement('label');
        inputElLbl.htmlFor = id;
        inputElLbl.appendChild(document.createTextNode(lbl));

        return [inputEl, inputElUp, inputElDown, inputElLbl];
    },
    checkbox: function(id, lbl) {
        var animCb = document.createElement('input');
        animCb.type = 'checkbox';
        animCb.id = id;

        var animLbl = document.createElement('label');
        animLbl.htmlFor = id;
        animLbl.appendChild(document.createTextNode(lbl));
        animLbl.style.marginRight = '20px';

        return [animCb, animLbl];
    }
};

function getMazeGenerator(container) {
    var w = h = 40, // width and height of maze
        x = 0, y = 0, // position of cursor
        maze = new Array(w), // maze data
        path = [], // for backtracking
        cnv, ctx, // canvas stuff
        intr, // animation interval
        // draw parameters
        outlineSize = 2,
        squareSize = 10,
        totalSize = outlineSize + squareSize,
        squareBackgroundColor = '#000000',
        squareFillColor = '#FF0000',
        cursorColor = '#0000FF',
        // function that returns amount of times to repeat iteration every tick
        repAmt = function(){ return 1; },
        animationInProgress, stopAnimationCallback,
        requestAnimationFrame =
          window.requestAnimationFrame ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame ||
          window.msRequestAnimationFrame ||
          window.oRequestAnimationFrame ||
          (alert('Your browser does not support requestAnimationFrame. ' +
                 'MazeGenJS will still work, but may be slower and laggy.' +
                 'Please upgrade your browser if you would like to get the ' +
                 'full experience. The latest version of Google Chrome or ' +
                 'Mozilla Firefox is recommended.'),
           function(f) { setTimeout(f, 1); });

    // initialization function (called every time user generates maze)
    function init(animate) {
        // initialize squares
        for (var i = 0; i < w; i++) {
            maze[i] = new Array(h);
            for (var i2 = 0; i2 < h; i2++) {
                maze[i][i2] = new Square();
            }
        }

        // reset variables
        path = [];
        x = y = 0;
        ctx.clearRect(0, 0, cnv.width, cnv.height);

        animationInProgress = true;
        if (animate) {
            tick();
        } else {
            generate();
        }
    }

    // lookup for which direction to move and which walls to remove
    var MoveLookup = [
        ['top', 'bottom', 0, -1],
        ['left', 'right', -1, 0],
        ['bottom', 'top', 0, 1],
        ['right', 'left', 1, 0]
    ];

    // move the cursor one cell
    function iteration() {
        // mark the cell as used
        maze[x][y].traversed = true;
        path.push([x, y]);

        // directions available
        var dirs = [
            y > 0     && !maze[x][y - 1].traversed,
            x > 0     && !maze[x - 1][y].traversed,
            y < h - 1 && !maze[x][y + 1].traversed,
            x < w - 1 && !maze[x + 1][y].traversed
        ];

        // choose a random direction, and go that way
        var indeces = shuffle([0, 1, 2, 3]);
        for (var i = 0; i < 4; i++) {
            if (dirs[indeces[i]]) {
                var lkp = MoveLookup[indeces[i]];
                maze[x][y][lkp[0]] = false;
                maze[x += lkp[2]][y += lkp[3]][lkp[1]] = false;
                return false; // the maze isn't done yet
            }
        }

        // we tried all directions and none were available, so now backtrack
        path.pop(); // first remove the square we're currently on
        if (path.length === 0) { // hooray!
            draw();
            return true; // the maze is done!
        }
        // maze not done, so now get the previous square and go there
        var oldLoc = path.pop();
        x = oldLoc[0];
        y = oldLoc[1];
        return false;
    }

    // draw the maze
    function draw(all) {
        for (var i = (all ? 0 : x - 1); i < (all ? w : x + 2); i++) {
            for (var i2 = (all ? 0 : y - 1); i2 < (all ? h : y + 2); i2++) {
                // is this square outside of the maze boundaries?
                if ((!maze[i]) || (!maze[i][i2])) continue;
                var squareToDraw = maze[i][i2];
                if (squareToDraw.traversed) {
                    var sqX = i * totalSize,
                        sqY = i2 * totalSize;
                    // fill the background
                    ctx.fillStyle = squareBackgroundColor;
                    ctx.fillRect(sqX, sqY, totalSize, totalSize);
                    // fill the borders
                    ctx.fillStyle = squareFillColor;
                    if (squareToDraw.top) {
                        ctx.fillRect(sqX, sqY,              totalSize, outlineSize);
                    }
                    if (squareToDraw.left) {
                        ctx.fillRect(sqX, sqY,              outlineSize, totalSize);
                    }
                    if (squareToDraw.bottom) {
                        ctx.fillRect(sqX, sqY + squareSize, totalSize, outlineSize);
                    }
                    if (squareToDraw.right) {
                        ctx.fillRect(sqX + squareSize, sqY, outlineSize, totalSize);
                    }
                }
            }
        }
        // draw the cursor
        ctx.fillStyle = cursorColor;
        ctx.fillRect(x * totalSize, y * totalSize, totalSize, totalSize);
    }

    // happens every frame
    function tick() {
        for (var i = 0; i < repAmt(); i++) {
            if (iteration()) {
                x = y = -1;
                draw();
                animationInProgress = false;
                return;
            }
            draw();
        }
        if (animationInProgress) requestAnimationFrame(tick);
        else if (stopAnimationCallback) stopAnimationCallback();
    }

    // stop the ticking and do a callback when successfully stopped
    function stopTick(callback) {
        animationInProgress = false;
        stopAnimationCallback = callback;
    }

    // is the maze done animating?
    function mazeFinished() {
        return !animationInProgress;
    }

    // generate the whole maze without animating
    function generate() {
        while (!iteration()) {}
        x = y = -1;
        draw(true);
        animationInProgress = false;
    }

    // DOM stuff
    cnv = document.createElement('canvas');
    cnv.width = totalSize * w;
    cnv.height = totalSize * h;
    cnv.style.border = '1px solid black';
    (container || document.body).appendChild(cnv);
    ctx = cnv.getContext('2d');

    var options = document.createElement('div');
    var optForm = document.createElement('form');
    var addOption = function(arr) {
        for (var i = 0; i < arr.length; i ++) options.appendChild(arr[i]);
        options.appendChild(document.createElement('br'));
    };

    var animCb = InputTools.checkbox('animCb', 'Animate');
    addOption(animCb);

    var animSpd = InputTools.num('animSpd', 1, 0, Infinity,
        'Speed (in squares per frame, can be changed while animating)');
    addOption(animSpd);
    repAmt = function() { return parseInt(animSpd[0].value, 10); };

    var submitBtn = document.createElement('input');
    submitBtn.type = 'submit';
    submitBtn.value = 'Generate';
    optForm.appendChild(submitBtn);

    optForm.onsubmit = function(e) {
        e.preventDefault();
        if (mazeFinished()) {
            init(animCb[0].checked);
        } else {
            stopTick(function(){ init(animCb[0].checked); });
        }
    };
    options.appendChild(optForm);
    document.body.appendChild(options);

    // each cell of the maze
    function Square() {
        this.top = true;
        this.left = true;
        this.bottom = true;
        this.right = true;
        this.traversed = false;
    }

    // Fisher-Yates array shuffling algorithm
    function shuffle(arr) {
        for (var i = arr.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = arr[i];
            arr[i] = arr[j];
            arr[j] = tmp;
        }
        return arr;
    }

    // function to call to generate the maze
    return init;
}

window.onload = function() {
    var mazeGen = getMazeGenerator();
    mazeGen();
};
