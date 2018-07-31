var CHAR_HEIGHT   = 8;
var CHAR_WIDTH    = 6;
var CHARS_PER_ROW = 32;
var CHARS_PER_COL = 7;
var CANVAS_WIDTH  = CHAR_WIDTH  * CHARS_PER_ROW; /* = 192 */
var CANVAS_HEIGHT = CHAR_HEIGHT * CHARS_PER_COL; /* = 56 */

var penMode = 1; /* 1 or 0 */
var penDown = false;

var prefix = "";
var suffix = "";

/* Get event's position in the canvas image. If the event.target is
   not the canvas, you may pass the canvas as the second optional
   argument. */
function getImagePos (e, canvas /* default: e.target */) {
    canvas = canvas || e.target;
    var scale = canvas.width / canvas.offsetWidth;
    var rect = canvas.getBoundingClientRect();
    var imgX = Math.floor((e.clientX - rect.left) * scale);
    var imgY = Math.floor((e.clientY - rect.top) * scale);
    return { x: imgX, y: imgY, scale: scale };
}

function pen () {
    penMode = 1;
}

function eraser () {
    penMode = 0;
}

function downPen (e) {
    penDown = true;
}

function movePen (e) {
    if (penDown) {
        var pos = getImagePos(e);
        var ctx = e.target.getContext('2d');
        var imageData = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        imageData.data[(pos.y * CANVAS_WIDTH + pos.x) * 4 + 3] = penMode ? 255 : 0;
        ctx.putImageData(imageData, 0, 0);
    }
}

function upPen (e) {
    movePen(e);
    penDown = false;
}

function readScript () {
    var splitted = document.getElementById("input").value.split(/{\n|\n}/);
    prefix = splitted[0] + "{\n";
    suffix = "\n}" + splitted[2];

    var canvas = document.getElementById("canvas");
    var grid   = document.getElementById("grid");
    canvas.width  = grid.width  = CANVAS_WIDTH;
    canvas.height = grid.height = CANVAS_HEIGHT;

    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    var gridCtx = grid.getContext('2d');
    gridCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    var imageData = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    var data      = imageData.data;
    var gridImageData = gridCtx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    var gridData      = gridImageData.data;
    splitted[1].split(/\n/).forEach(function (rawChar, charIx) {
        var yOffset = Math.floor(charIx / CHARS_PER_ROW) * CHAR_HEIGHT;
        var xOffset = (charIx % CHARS_PER_ROW) * CHAR_WIDTH;
        rawChar.split(/[, ]+/).forEach(function (byte, i) {
            var int = parseInt(byte, 16);
            for (var j = 0; j < 8; j++) {
                var base = (yOffset + j) * CANVAS_WIDTH + (xOffset + i);
                data[base * 4 + 3] = int % 2 ? 255 : 0; /* alpha */
                int = Math.floor(int / 2);
                if (j == 7 || i == CHAR_WIDTH - 1) {
                    gridData[base * 4 + 1] = gridData[base * 4 + 2] = gridData[base * 4 + 3] = 255;
                }
            }
        });
    });

    ctx.putImageData(imageData, 0, 0);
    gridCtx.putImageData(gridImageData, 0, 0);
}

function dumpCanvas () {
    var data = document.getElementById("canvas").getContext('2d').getImageData(0, 0, 192, 56).data;

    var chars = [];
    for (var y = 0; y < CHARS_PER_COL; y++) {
        for (var x = 0; x < CHARS_PER_ROW; x++) {
            var xOffset = x * CHAR_WIDTH;
            var yOffset = y * CHAR_HEIGHT;
            var bytes = [];
            for (var i = 0; i < CHAR_WIDTH; i++) {
                var byte = 0;
                for (var j = 7; j >= 0; j--) {
                    var base = (yOffset + j) * CANVAS_WIDTH + (xOffset + i);
                    byte *= 2;
                    if (data[base * 4 + 3]) byte++;
                }
                var str = byte.toString(16);
                bytes.push("0x" + (str.length == 1 ? "0" + str : str));
            }
            chars.push(bytes.join(", "));
        }
    }

    document.getElementById("output").value = prefix + chars.join(",\n") + suffix;
}

document.getElementById("in").onclick = readScript;
document.getElementById("out").onclick = dumpCanvas;
document.getElementById("pen").onclick = pen;
document.getElementById("eraser").onclick = eraser;
document.getElementById("canvas").addEventListener("mousedown", downPen);
document.getElementById("canvas").addEventListener("mousemove", movePen);
document.getElementById("canvas").addEventListener("mouseup", upPen);
document.getElementById("canvas").addEventListener("mouseout", upPen);
