$(function () {
    // create QRCodeScanner instance
    let currentMatch = null;

    const coll = document.getElementsByClassName("collapsible");

    for (i = 0; i < coll.length; i++) {
        coll[i].addEventListener("click", function () {
            this.classList.toggle("active");
            const content = this.nextElementSibling;
            if (content.style.display === "block") {
                content.style.display = "none";
            } else {
                content.style.display = "block";
            }
        });
    }

    updateButtons();

    let canvas = document.getElementById("endState");
    let ctx = canvas.getContext('2d');
    let elements = [];
    ctx.fillStyle = "#f1f1f1";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    let colorGuide = ["#f1f1f1", "red", "blue"];
    window.colors = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    let start = [[50, 50], [50, 150], [50, 250], [50, 50], [150, 50], [250, 50], [50, 50], [250, 50]];
    let end = [[250, 50], [250, 150], [250, 250], [50, 250], [150, 250], [250, 250], [250, 250], [50, 250]];
    let lineColors = [0, 0, 0, 0, 0, 0, 0, 0];
    drawEndState();

    canvas.addEventListener('click', function (e) {
        const x = e.pageX - canvas.offsetLeft;
        const y = e.pageY - canvas.offsetTop;

        elements.forEach(function (element) {
            if (Math.pow(x - element.x, 2) + Math.pow(y - element.y, 2) < Math.pow(element.circleSize, 2)) {
                element.clicked();
                drawEndState();
            }
        });
    });

    canvas.addEventListener('mousemove', function (e) {
        const x = e.pageX - canvas.offsetLeft;
        const y = e.pageY - canvas.offsetTop;
        for (element of elements) {
            if (Math.pow(x - element.x, 2) + Math.pow(y - element.y, 2) < Math.pow(element.circleSize, 2)) {
                canvas.style.cursor = 'pointer';
                break;
            } else {
                canvas.style.cursor = 'default';
            }
        }
    });

    $(".sideToggle").click(function () {
        if ($(this).css('background-color') === 'rgb(172, 43, 55)') {
            $(this).css('background-color', '#4d4dff');
            $(this).css('border-color', '#8080ff');
            $(this).text("Blue");
        } else {
            $(this).css('background-color', '#AC2B37');
            $(this).css('border-color', '#cc3342');
            $(this).text("Red");
        }
    });

    $(".robotToggle").click(function () {
        if ($(this).css('background-color') === "rgb(255, 128, 0)") {
            $(this).css('background-color', '#8B008B');
            $(this).css('border-color', '#b000b0');
            $(this).text("24 inch");
        } else {
            $(this).css('background-color', '#ff8000');
            $(this).css('border-color', '#fea64c');
            $(this).text("15 inch");
        }
    });

    $(".cycleToggle").click(function () {
        console.log($(this).css('background-color'));
        if ($(this).css('background-color') === 'rgb(0, 128, 0)') {
            $(this).css('background-color', '#FF0000');
            $(this).css('border-color', '#ff3333');
            $(this).text("Low cycle speed");
        } else {
            $(this).css('background-color', '#008000');
            $(this).css('border-color', '#00b300');
            $(this).text("High cycle speed");
        }
    });

    $(document).on("click", "#btn-open-qrcode-scanner", function (e) {
        window.qrcodeScanner = new QRCodeScanner({rootSelector: "#qrcode-scanner"});
        // open QRCodeScanner webcam scanner
        qrcodeScanner.open((err, result) => {
            console.log(err);
            let val = JSON.parse(result.data);
            console.log("QR Scanner result:", val);
            set(val["Timestamp ID"], val).then(() =>
                alert("Match " + val["Match #"] + " - " + val["Name"].toUpperCase() + " (" + val["Robot"] + '") stored in cache.'));
            updateButtons();
        });
    });

    function toIndex(n) {
        return (n - 50) / 100;
    }

    function updateLineColors() {
        for (i = 0; i < 8; i++) {
            let xUnit = (toIndex(end[i][0]) - toIndex(start[i][0])) / 2;
            let yUnit = (toIndex(end[i][1]) - toIndex(start[i][1])) / 2;
            let matchColor = null;
            let solidLine = true;
            for (j = 0; j < 3; j++) {
                let currentColor = colors[toIndex(start[i][1]) + yUnit * j][toIndex(start[i][0]) + xUnit * j];
                if (matchColor == null) {
                    matchColor = currentColor;
                } else if (matchColor !== currentColor) {
                    solidLine = false;
                }
            }
            if (solidLine && matchColor !== 0) {
                lineColors[i] = colors[toIndex(start[i][1])][toIndex(start[i][0])];
            } else {
                lineColors[i] = 0;
            }
        }
    }

    function drawEndState() {
        updateLineColors();
        elements = [];
        ctx.lineWidth = 10;
        for (i = 0; i < 8; i++) {
            if (lineColors[i] === 0) {
                ctx.strokeStyle = "black";
            } else {
                ctx.strokeStyle = colorGuide[lineColors[i]];
            }
            ctx.beginPath();
            ctx.moveTo(start[i][0], start[i][1]);
            ctx.lineTo(end[i][0], end[i][1]);
            ctx.stroke();
        }
        ctx.lineWidth = 5;
        ctx.strokeStyle = "black";
        for (i = 0; i < 3; i++) {
            for (j = 0; j < 3; j++) {
                let ic = i;
                let jc = j;
                ctx.fillStyle = colorGuide[colors[j][i]];
                ctx.beginPath();
                let xpos = 50 + (100 * i);
                let ypos = 50 + (100 * j);
                ctx.arc(xpos, ypos, 20, 0, 2 * Math.PI);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(xpos, ypos, 20, 0, 2 * Math.PI);
                ctx.stroke();
                elements.push({
                    circleSize: 20,
                    x: JSON.parse(JSON.stringify(xpos)),
                    y: JSON.parse(JSON.stringify(ypos)),
                    clicked: function () {
                        if (colors[JSON.parse(JSON.stringify(jc))][JSON.parse(JSON.stringify(ic))] === 2) {
                            colors[JSON.parse(JSON.stringify(jc))][JSON.parse(JSON.stringify(ic))] = 0;
                        } else {
                            colors[JSON.parse(JSON.stringify(jc))][JSON.parse(JSON.stringify(ic))]++;
                        }
                    }
                });
            }
        }
    }

// Get mouse position
    function getMousePos(c, evt) {
        const rect = c.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    }

    function changeVal(element) {
        const change = (element.classList.contains("increment")) ? 1 : -1;
        if (element.classList.contains("ba")) {
            document.getElementById("ballsAuto").value = +document.getElementById("ballsAuto").value + change;
        } else if (element.classList.contains("ga")) {
            document.getElementById("goalsAuto").value = +document.getElementById("goalsAuto").value + change;
        } else if (element.classList.contains("ra")) {
            document.getElementById("rowsAuto").value = +document.getElementById("rowsAuto").value + change;
        } else if (element.classList.contains("bt")) {
            document.getElementById("ballsTeleop").value = +document.getElementById("ballsTeleop").value + change;
        } else if (element.classList.contains("dt")) {
            document.getElementById("descoredTeleop").value = +document.getElementById("descoredTeleop").value + change;
        }
    }

    function updateQR(val) {
        currentMatch = val["Timestamp ID"];
        let c = document.getElementById('canvas');
        document.getElementById("matchTitle").innerText = "Match " + val["Match #"] + " - " + val["Name"].toUpperCase() + " (" + val["Robot"] + '")';
        QRCode.toCanvas(c, JSON.stringify(val), function (error) {
            if (error) console.error(error)
        });
        document.getElementById("qrWrapper").style.display = "block";
    }

    function updateButtons() {
        document.getElementById("qrWrapper").style.display = "none";
        keys().then(matchKeys => {
            let cache = document.getElementById("cacheButtons");
            cache.innerHTML = "";
            for (key in matchKeys) {
                get(matchKeys[key]).then(val => {
                    let btn = document.createElement("BUTTON");
                    btn.innerHTML = "Match " + val["Match #"] + " - " + val["Name"].toUpperCase() + " (" + val["Robot"] + '")';
                    btn.onclick = () => {
                        updateQR(val);
                    }
                    btn.className = "styledButton";
                    cache.appendChild(btn);
                });
            }
        });
    }

    function deleteCurrent() {
        window.del(currentMatch);
        updateButtons();
    }

    function closeQR() {
        document.getElementById("qrWrapper").style.display = "none";
    }

    function sendCurrent() {
        var date = new Date();
        var matchData = {
            "Timestamp ID": date.getTime(),
            "Match #": document.getElementById("match").value,
            "Side": document.getElementById("side").style.backgroundColor === 'rgb(172, 43, 55)' ? "RED" : "BLUE",
            "Name": document.getElementById("name").value,
            "Robot": document.getElementById("robot").style.backgroundColor === 'rgb(255, 195, 0)' ? 15 : 24,
            "Balls Scored (Auto)": document.getElementById("ballsAuto").value,
            "Goals Scored (Auto)": document.getElementById("goalsAuto").value,
            "Rows Scored (Auto)": document.getElementById("rowsAuto").value,
            "Balls Scored (Teleop)": document.getElementById("ballsTeleop").value,
            "Balls Descored (Teleop)": document.getElementById("descoredTeleop").value,
            "Comments": document.getElementById("comment").value
        }
        sendInfo(matchData, false);
        clearForm();
    }

    function sendCached() {
        let matches = []
        keys().then(matchKeys => {
            for (key in matchKeys) {
                get(matchKeys[key]).then(val => {
                    sendInfo(val, true);
                    matches.push(JSON.stringify(val));
                    console.log(JSON.stringify(val));
                });
            }
            alert("All matches have been uploaded. Clearing local cache.");
            clear();
            updateButtons();
        });
    }

    function clearForm() {
        document.getElementById('match').value = "";
        document.getElementById('name').value = "";
        document.getElementById('comment').value = "";
        document.getElementById('ballsAuto').value = 0;
        document.getElementById('goalsAuto').value = 0;
        document.getElementById('rowsAuto').value = 0;
        document.getElementById('ballsTeleop').value = 0;
        document.getElementById('descoredTeleop').value = 0;
    }

    function updateQR(val) {
        currentMatch = val["Timestamp ID"];
        let c = document.getElementById('canvas');
        document.getElementById("matchTitle").innerText = "Match " + val["Match #"] + " - " + val["Name"].toUpperCase() + " (" + val["Robot"] + '")';
        QRCode.toCanvas(c, JSON.stringify(val), function (error) {
            if (error) console.error(error)
        });
        document.getElementById("qrWrapper").style.display = "block";
    }

    function updateButtons() {
        document.getElementById("qrWrapper").style.display = "none";
        keys().then(matchKeys => {
            let cache = document.getElementById("cacheButtons");
            cache.innerHTML = "";
            for (key in matchKeys) {
                get(matchKeys[key]).then(val => {
                    let btn = document.createElement("BUTTON");
                    btn.innerHTML = "Match " + val["Match #"] + " - " + val["Name"].toUpperCase() + " (" + val["Robot"] + '")';
                    btn.onclick = () => {
                        updateQR(val);
                    }
                    btn.className = "styledButton";
                    cache.appendChild(btn);
                });
            }
        });
    }

    function sendInfo(data, cached) {
        // variable to hold request
        var request;
        // abort any pending request
        if (request) {
            request.abort();
        }
        // fire off the request to /form.php
        request = $.ajax({
            url: "https://script.google.com/macros/s/AKfycbz3Q1ldmmdkAnNchrhfD450tpyloXky4N5wuf4ELTRk5UhTiDQ/exec",
            type: "post",
            data: data
        });

        // callback handler that will be called on failure
        request.fail(function (jqXHR, textStatus, errorThrown) {
            // log the error to the console
            set(data["Timestamp ID"], data).then(() => {
                alert("Either there's no internet or something went wrong, match stored locally. You can upload stored matches with the Send cached data button.");
                updateButtons();
            });
        });
        request.done(function (response, textStatus, jqXHR) {
            // Log a message to the console
            if (!cached) {
                alert("Success!");
                updateButtons();
            }
        });
        // prevent default posting of form
        event.preventDefault();
    }
});