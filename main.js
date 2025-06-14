let boardSquaresArray=[];
let WhiteTurn=true;
let whiteKingSquare = "e1";
let blackKingSquare = "e8"; // Initial position of the white king
const boardSquares = document.getElementsByClassName("square");
const pieces = document.getElementsByClassName("piece");
const piecesImages= document.getElementsByTagName("img");
const gameStatus= document.getElementById("gameStatus");


setupBoardSquares();
setupPieces();
fillBoardSquaresArray();


function deepCopyArray(array) {
    let arrayCopy = array.map(element => {
        return { ...element}    
    })  
    return arrayCopy;
}

function fillBoardSquaresArray() {
    const boardSquares = document.getElementsByClassName("square");
    for (let i = 0; i < boardSquares.length; i++) {
        let row = 8 - Math.floor(i / 8);
        let column = String.fromCharCode(97 + (i % 8));
        let square = boardSquares[i];
        square.id = column + row;
        let color = "blank";
        let pieceType = "blank";
        let pieceId = "blank";
        
        if (square.querySelector(".piece")) {
            color = square.querySelector(".piece").getAttribute("color");
            pieceType = square.querySelector(".piece").classList[1];
            pieceId = square.querySelector(".piece").id;
        }
        
        let arrayElement = {
            squareId: square.id,
            pieceColor: color,
            pieceType: pieceType,
            piece: pieceId
        };
        boardSquaresArray.push(arrayElement);
    }
}

function updateBoardSquaresArray(currentSquareId,startingSquareId, destinationSquareId, boardSquaresArray) {
    let currentSquare= boardSquaresArray.find(
        (element) => element.squareId === currentSquareId
    );
    let destinationSquareElement= boardSquaresArray.find(
        (element) => element.squareId === destinationSquareId
    );
    let pieceColor= currentSquare.pieceColor;
    let pieceType= currentSquare.pieceType;
    let pieceId= currentSquare.piece;
    destinationSquareElement.pieceColor = pieceColor; // Update the piece color
    destinationSquareElement.pieceType = pieceType; // Update the piece type
    destinationSquareElement.piece = pieceId; // Update the piece ID
    currentSquare.pieceColor = "blank"; // Clear the piece color
    currentSquare.pieceType = "blank"; // Clear the piece type
    currentSquare.pieceId = "blank"; // Clear the piece ID
}

function setupBoardSquares() {
    for (let i = 0; i < boardSquares.length; i++) {
        boardSquares[i].addEventListener("dragover", allowDrop);
        boardSquares[i].addEventListener("drop", drop);
        let row = 8-Math.floor(i / 8);
        let column= String.fromCharCode(97 + (i % 8));
        let square= boardSquares[i];
        square.id = column+row;
    }
}
function setupPieces(){
    for (let i = 0; i < pieces.length; i++){
        pieces[i].addEventListener("dragstart", drag);
        pieces[i].setAttribute("draggable", "true");
        // Make sure the ID is being set correctly
        let pieceType = pieces[i].className.split(" ")[1];
        let parentId = pieces[i].parentElement.id;
        pieces[i].id = pieceType + parentId;
        console.log("Setting piece ID:", pieces[i].id);  // Add this for debugging
    }
    for (let i = 0; i < piecesImages.length; i++){
        piecesImages[i].setAttribute("draggable", false);
    }
}
function allowDrop(ev){
    ev.preventDefault();
}
function drag(ev){
    const piece = ev.target;
    const pieceColor = piece.getAttribute("color");
    const pieceType = piece.classList[1];
    const pieceId = piece.id;
    
    console.log("Drag started:", {
        pieceId,
        pieceColor,
        pieceType,
        parentId: piece.parentNode.id
    });
    
    if((WhiteTurn && pieceColor == "white") || (!WhiteTurn && pieceColor == "black")){
        const startingSquareId = piece.parentNode.id;
        
        ev.dataTransfer.setData("text", pieceId + "|" + startingSquareId);
        const pieceObject = {pieceColor: pieceColor, pieceType: pieceType, pieceId: pieceId};
        let legalSquares = getPossibleMoves(startingSquareId, pieceObject, boardSquaresArray);
        console.log("Legal squares calculated:", legalSquares);
        let legalSquaresJson = JSON.stringify(legalSquares);
        ev.dataTransfer.setData("application/json", legalSquaresJson);
    }
}
        
function drop(ev){
    ev.preventDefault();
    let data = ev.dataTransfer.getData("text");
    if (!data) {
        console.error("No data transferred");
        return;
    }
    
    let [pieceId, startingSquareId] = data.split("|");
    let legalSquaresJson = ev.dataTransfer.getData("application/json");
    let legalSquares = [];
    
    try {
        if (legalSquaresJson) {
            legalSquares = JSON.parse(legalSquaresJson);
        }
    } catch (e) {
        console.error("Error parsing legal squares:", e);
        return;
    }

    const piece = document.getElementById(pieceId);
    if (!piece) {
        console.error("Piece not found:", pieceId);
        return;
    }

    const pieceColor = piece.getAttribute("color");
    const pieceType = piece.classList[1];
    const destinationSquare = ev.currentTarget;
    let destinationSquareId = destinationSquare.id;

    console.log("Attempting move:", {
        pieceId,
        startingSquareId,
        destinationSquareId,
        legalSquares
    });

    if(pieceType == "king"){
        let isCheck = KinginCheck(destinationSquareId, pieceColor, boardSquaresArray);
        if (isCheck) {
            alert("You cannot move the king into check!");
            return;
        }
        WhiteTurn ? (whiteKingSquare = destinationSquareId) : (blackKingSquare = destinationSquareId);
    }

    let squareContent = getPieceAtSquare(destinationSquareId, boardSquaresArray);
    if ((squareContent.pieceColor == "blank") && (legalSquares.includes(destinationSquareId))) {
        destinationSquare.appendChild(piece);
        WhiteTurn = !WhiteTurn;
        updateBoardSquaresArray(startingSquareId, startingSquareId, destinationSquareId, boardSquaresArray);
        
        // Check for check after the move
        let nextPlayerColor = WhiteTurn ? "white" : "black";
        let nextPlayerKingSquare = WhiteTurn ? whiteKingSquare : blackKingSquare;
        let isCheck = KinginCheck(nextPlayerKingSquare, nextPlayerColor, boardSquaresArray);
        let whoMoves = document.getElementById("whoMoves");
        whoMoves.innerText = "turn:" + nextPlayerColor;  // Make sure this is defined before using it
        console.log(nextPlayerColor);
        
        if (isCheck) {
            // Check for checkmate
            let hasLegalMoves = false;
            let win = document.getElementById("Win");  // Make sure this is defined before using it
            
            for (let square of boardSquaresArray) {
                if (square.pieceColor === nextPlayerColor) {
                    let pieceObject = {
                        pieceColor: square.pieceColor,
                        pieceType: square.pieceType,
                        pieceId: square.piece
                    };
                    let moves = getPossibleMoves(square.squareId, pieceObject, boardSquaresArray);
                    if (moves.length > 0) {
                        hasLegalMoves = true;
                        break;
                    }
                }
            }
            
            if (!hasLegalMoves) {
                win.innerHTML = (WhiteTurn ? "Black" : "White") + " wins!";
            } else {
                win.innerHTML = "Check!";
                // Set timeout to clear the message after 1 second
                setTimeout(function() {
                    win.innerHTML = "";
                }, 1000);
            }
        }
        return;
    }
    if((squareContent.pieceColor != "blank") && (legalSquares.includes(destinationSquareId))) {
        while (destinationSquare.firstChild) {
            destinationSquare.removeChild(destinationSquare.firstChild);
        }
        destinationSquare.appendChild(piece);
        WhiteTurn = !WhiteTurn;
        updateBoardSquaresArray(startingSquareId, startingSquareId, destinationSquareId, boardSquaresArray);
        
        // Check for check after the move
        let nextPlayerColor = WhiteTurn ? "white" : "black";
        let nextPlayerKingSquare = WhiteTurn ? whiteKingSquare : blackKingSquare;
        let isCheck = KinginCheck(nextPlayerKingSquare, nextPlayerColor, boardSquaresArray);
        
        if (isCheck) {
            // Check for checkmate
            let hasLegalMoves = false;
            let win = document.getElementById("Win");  // Make sure this is defined before using it
            
            for (let square of boardSquaresArray) {
                if (square.pieceColor === nextPlayerColor) {
                    let pieceObject = {
                        pieceColor: square.pieceColor,
                        pieceType: square.pieceType,
                        pieceId: square.piece
                    };
                    let moves = getPossibleMoves(square.squareId, pieceObject, boardSquaresArray);
                    if (moves.length > 0) {
                        hasLegalMoves = true;
                        break;
                    }
                }
            }
            
            if (!hasLegalMoves) {
                win.innerHTML = (WhiteTurn ? "Black" : "Black") + " wins!";
            } else {
                win.innerHTML = "Check!";
                // Set timeout to clear the message after 1 second
                setTimeout(function() {
                    win.innerHTML = "";
                }, 1000);
            }
        }
        return;
    }
}
function getPossibleMoves(startingSquareId, piece, boardSquaresArray) {
    let legalSquares = [];  // Declare as local variable
    
    const pieceColor = piece.pieceColor;
    const pieceType = piece.pieceType;
    console.log("Piece color:", pieceColor);
    console.log("Piece type:", pieceType);
    
    if(pieceType === "pawn") {
        legalSquares = getPawnMoves(startingSquareId, pieceColor, boardSquaresArray);
    }
    else if(pieceType === "knight") {
        console.log("Calculating knight moves");
        legalSquares = knightMoves(startingSquareId, pieceColor, boardSquaresArray);
    }
    else if(pieceType === "rook") {
        console.log("Calculating rook moves");
        legalSquares = RookMoves(startingSquareId, pieceColor, boardSquaresArray);
    }
    else if(pieceType === "bishop") {
        console.log("Calculating bishop moves");
        legalSquares = BishopMoves(startingSquareId, pieceColor, boardSquaresArray);
    }
    else if(pieceType === "queen") {
        console.log("Calculating queen moves");
        legalSquares = QueenMoves(startingSquareId, pieceColor, boardSquaresArray);
    }
    else if(pieceType === "king") {
        console.log("Calculating king moves");
        legalSquares = KingMoves(startingSquareId, pieceColor, boardSquaresArray);
    }

    // Check if the king is in check
    let kingSquare = pieceColor === "white" ? whiteKingSquare : blackKingSquare;
    let isKingInCheck = KinginCheck(kingSquare, pieceColor, boardSquaresArray);

    // If the king is in check, filter out moves that don't get out of check
    if (isKingInCheck) {
        legalSquares = MoveValidAgaintsCheck(legalSquares, startingSquareId, pieceColor, pieceType);
    }
    
    console.log("Legal squares for", pieceType, ":", legalSquares);
    return legalSquares;
}
function squareOccupied(square) {
    if (!square) return "blank";
    // If square is from boardSquaresArray, return its pieceColor directly
    if (square.pieceColor !== undefined) {
        return square.pieceColor;
    }
    // If square is a DOM element, use querySelector
    const piece = square.querySelector(".piece");
    if (!piece) return "blank";
    return piece.getAttribute("color") || "blank";
}
function getPawnMoves(startingSquareId, pieceColor, boardSquaresArray) {
    let diagonalSquares = checkPawndiagonalCaptures(startingSquareId, pieceColor, boardSquaresArray);
    let forwardSquares = checkPawnForwardMoves(startingSquareId, pieceColor, boardSquaresArray);
    let legalSquares = [...diagonalSquares, ...forwardSquares];
    return legalSquares;
}
function checkPawndiagonalCaptures(startingSquareId, pieceColor, boardSquaresArray){
    const file = startingSquareId.charAt(0);
    const rank = startingSquareId.charAt(1);
    const rankNumber = parseInt(rank);
    let currentFile = file;
    let currentRank = rankNumber;
    let currentSquareId = currentFile + currentRank;
    let legalSquares = [];
    const direction = pieceColor == "white" ? 1 : -1; // 1 for white pawns moving up, -1 for black pawns moving down
    currentRank += direction;

    for(let i = -1; i <= 1; i += 2){
        currentFile = String.fromCharCode(file.charCodeAt(0) + i);
        if(currentFile >= "a" && currentFile <= "h"){
            currentSquareId = currentFile + currentRank;
            let currentSquare = boardSquaresArray.find((element) => element.squareId === currentSquareId);
            if(!currentSquare) continue; // Skip if the square doesn't exist
            let squareContent = currentSquare.pieceColor;
            if(squareContent != "blank" && squareContent != pieceColor)
                legalSquares.push(currentSquareId); // adds legal move if the opponents piece is present
        }
    }
    return legalSquares;
}
function checkPawnForwardMoves(startingSquareId, pieceColor, boardSquaresArray){
    const file = startingSquareId.charAt(0);
    const rank = startingSquareId.charAt(1);
    const rankNumber = parseInt(rank);
    let currentFile = file;
    let currentRank = rankNumber;
    let currentSquareId = currentFile + currentRank;
    let legalSquares = [];
    const direction = pieceColor == "white" ? 1 : -1;
    currentRank += direction;

    currentSquareId = currentFile + currentRank;
    let currentSquare = boardSquaresArray.find((element) => element.squareId === currentSquareId);
    if(!currentSquare) return legalSquares;
    let squareContent = currentSquare.pieceColor;
    if(squareContent != "blank"){
        return legalSquares;
    }
    legalSquares.push(currentSquareId);
    
    if(rankNumber != 2 && rankNumber != 7) 
        return legalSquares;
    currentRank += direction;
    currentSquareId = currentFile + currentRank;
    currentSquare = boardSquaresArray.find((element) => element.squareId === currentSquareId);
    if(!currentSquare) return legalSquares;
    squareContent = currentSquare.pieceColor;
    if(squareContent != "blank"){
        return legalSquares;
    }
    legalSquares.push(currentSquareId);
    return legalSquares;
}


function knightMoves(startingSquareId, pieceColor, boardSquaresArray){
    console.log("Starting square:", startingSquareId);
    
    const file = startingSquareId.charAt(0);
    const rank = startingSquareId.charAt(1);
    const rankNumber = parseInt(rank);
    const fileNumber = file.charCodeAt(0) - 97; // Convert a-h to 0-7
    let legalSquares = [];
    
    console.log("File number:", fileNumber);
    console.log("Rank number:", rankNumber);
    
    const moves = [ //knights move set//
        [2, 1], [2, -1], [-2, 1], [-2, -1],
        [1, 2], [1, -2], [-1, 2], [-1, -2]
    ];
    
    for(let move of moves) {
        let newFile = fileNumber + move[0];
        let newRank = rankNumber + move[1];
        
        // Check if the move is within board boundaries
        if(newFile >= 0 && newFile <= 7 && newRank >= 1 && newRank <= 8) {
            let newSquareId = String.fromCharCode(newFile + 97) + newRank;
            let currentSquare = boardSquaresArray.find((element) => element.squareId === newSquareId);
            if(!currentSquare) continue;
            let squareContent = currentSquare.pieceColor;
            
            console.log("Checking square:", newSquareId, "Content:", squareContent);
            
            // Add move if square is empty or contains opponent's piece
            if(squareContent === "blank" || squareContent !== pieceColor) {
                console.log("Adding legal move:", newSquareId);
                legalSquares.push(newSquareId);
            }
        }
    }
    
    console.log("Final legal squares:", legalSquares);
    return legalSquares;
}

function RookMoves(startingSquareId, pieceColor,boardSquaresArray) {
    let moveToEightRankSquares=moveToEightRank(startingSquareId, pieceColor,boardSquaresArray);
    let moveToFirstRankSquares=moveToFirstRank(startingSquareId, pieceColor,boardSquaresArray);
    let moveToAFileSquares=moveToAFile(startingSquareId,pieceColor,boardSquaresArray); // Up
    let moveToHFileSquares=moveToHFile(startingSquareId,pieceColor,boardSquaresArray); // Up
    legalSquares = [...moveToEightRankSquares, ...moveToFirstRankSquares,
    ...moveToAFileSquares, ...moveToHFileSquares];
    return legalSquares;
}

function BishopMoves(startingSquareId, pieceColor, boardSquaresArray) {
    let moveToEightRankHFileSquares=moveToEightRankHFile(startingSquareId, pieceColor, boardSquaresArray); // Up Right
    let moveToEightRankAFileSquares=moveToEightRankAFile(startingSquareId, pieceColor,boardSquaresArray); // Up Left
    let moveToFirstRankHFileSquares=moveToFirstRankHFile(startingSquareId, pieceColor,boardSquaresArray); // Down Right
    let moveToFirstRankAFileSquares=moveToFirstRankAFile(startingSquareId, pieceColor,boardSquaresArray); // Down Left
    legalSquares = [...moveToEightRankHFileSquares, ...moveToEightRankAFileSquares,
    ...moveToFirstRankHFileSquares, ...moveToFirstRankAFileSquares];
    return legalSquares;
}

function QueenMoves(startingSquareId, pieceColor, boardSquaresArray) {
    let bishopSquares = BishopMoves(startingSquareId, pieceColor, boardSquaresArray);
    let rookSquares = RookMoves(startingSquareId, pieceColor, boardSquaresArray);
    legalSquares = [...bishopSquares, ...rookSquares];
    return legalSquares;
}

function KingMoves(startingSquareId, pieceColor, boardSquaresArray) {
    console.log("Starting square:", startingSquareId);
    
    const file = startingSquareId.charAt(0);
    const rank = startingSquareId.charAt(1);
    const rankNumber = parseInt(rank);
    const fileNumber = file.charCodeAt(0) - 97; // Convert a-h to 0-7
    let legalSquares = [];
    
    console.log("File number:", fileNumber);
    console.log("Rank number:", rankNumber);
    
    const moves = [ //king moves//
        [0, 1], [0, -1], [1, 1], [1, -1],
        [-1, 0], [-1, -1], [-1, 1], [1, 0]
    ];
    
    for(let move of moves) {
        let newFile = fileNumber + move[0];
        let newRank = rankNumber + move[1];
        
        // Check if the move is within board boundaries
        if(newFile >= 0 && newFile <= 7 && newRank >= 1 && newRank <= 8) {
            let newSquareId = String.fromCharCode(newFile + 97) + newRank;
            let currentSquare = boardSquaresArray.find((element) => element.squareId === newSquareId);
            if(!currentSquare) continue;
            let squareContent = currentSquare.pieceColor;
            
            console.log("Checking square:", newSquareId, "Content:", squareContent);
            
            // Add move if square is empty or contains opponent's piece
            if(squareContent === "blank" || squareContent !== pieceColor) {
                console.log("Adding legal move:", newSquareId);
                legalSquares.push(newSquareId);
            }
        }
    }
    
    console.log("Legal squares:", legalSquares);
    return legalSquares;
}


function moveToEightRank(startingSquareId, pieceColor, boardSquaresArray) {
    const file = startingSquareId.charAt(0);
    const rank = startingSquareId.charAt(1);
    const rankNumber = parseInt(rank);
    let currentRank = rankNumber;
    let legalSquares = [];
    while(currentRank != 8) {
        currentRank++;
        let currentSquareId = file + currentRank;
        let currentSquare = boardSquaresArray.find((element) => element.
        squareId === currentSquareId);
        if(!currentSquare) continue; // Skip if the square doesn't exist
        let squareContent = currentSquare.pieceColor
        if(squareContent != "blank" && squareContent == pieceColor) {
            return legalSquares;
        }
        legalSquares.push(currentSquareId);
        if(squareContent != "blank" && squareContent != pieceColor) {
            return legalSquares;
        }
    }
    return legalSquares;
}

function moveToFirstRank(startingSquareId, pieceColor, boardSquaresArray) {
    const file = startingSquareId.charAt(0);
    const rank = startingSquareId.charAt(1);
    const rankNumber = parseInt(rank);
    let currentRank = rankNumber;
    let legalSquares = [];
    while(currentRank != 1) {
        currentRank--;
        let currentSquareId = file + currentRank;
        let currentSquare = boardSquaresArray.find((element) => element.
        squareId === currentSquareId);
        if(!currentSquare) continue; // Skip if the square doesn't exist
        let squareContent = currentSquare.pieceColor
        if(squareContent != "blank" && squareContent == pieceColor) {
            return legalSquares;
        }
        legalSquares.push(currentSquareId);
        if(squareContent != "blank" && squareContent != pieceColor) {
            return legalSquares;
        }
    }
    return legalSquares;
}

function moveToAFile(startingSquareId, pieceColor, boardSquaresArray) {
    const file = startingSquareId.charAt(0);
    const rank = startingSquareId.charAt(1);
    let currentFile = file;
    let legalSquares = [];
    while(currentFile != "a") {
        currentFile = String.fromCharCode(currentFile.charCodeAt(0) - 1);
        let currentSquareId = currentFile + rank;
        let currentSquare = boardSquaresArray.find((element) => element.
        squareId === currentSquareId);
        if(!currentSquare) continue; // Skip if the square doesn't exist
        let squareContent = currentSquare.pieceColor
        if(squareContent != "blank" && squareContent == pieceColor) {
            return legalSquares;
        }
        legalSquares.push(currentSquareId);
        if(squareContent != "blank" && squareContent != pieceColor) {
            return legalSquares;
        }
    }
    return legalSquares;
}
function moveToHFile(startingSquareId, pieceColor, boardSquaresArray) {
    const file = startingSquareId.charAt(0);
    const rank = startingSquareId.charAt(1);
    let currentFile = file;
    let legalSquares = [];
    while(currentFile != "h") {
        currentFile = String.fromCharCode(currentFile.charCodeAt(0) + 1);
        let currentSquareId = currentFile + rank;
        let currentSquare = boardSquaresArray.find((element) => element.
        squareId === currentSquareId);
        if(!currentSquare) continue; // Skip if the square doesn't exist
        let squareContent = currentSquare.pieceColor
        if(squareContent != "blank" && squareContent == pieceColor) {
            return legalSquares;
        }
        legalSquares.push(currentSquareId);
        if(squareContent != "blank" && squareContent != pieceColor) {
            return legalSquares;
        }
    }
    return legalSquares;
}

function getPieceAtSquare(squareId, boardSquaresArray) {
    let currentSquare = boardSquaresArray.find((element) => element.squareId === squareId);
    if(!currentSquare) return {pieceColor: "blank", pieceType: "blank", pieceId: "blank"};
    const color = currentSquare.pieceColor;
    const pieceType = currentSquare.pieceType;
    const pieceId = currentSquare.piece;
    return {pieceColor: color, pieceType: pieceType, pieceId: pieceId};
}

//Eight Rank A File//
function moveToEightRankAFile(startingSquareId, pieceColor ,boardSquaresArray) {
    const file = startingSquareId.charAt(0);
    const rank = startingSquareId.charAt(1);
    const rankNumber = parseInt(rank);
    let currentRank = rankNumber;
    let currentFile = file;
    let legalSquares = [];
    while(currentFile > "a" && currentRank < 8) {
        currentFile = String.fromCharCode(currentFile.charCodeAt(0) - 1);
        currentRank++;
        let currentSquareId = currentFile + currentRank;
        let currentSquare = boardSquaresArray.find((element) => element.
        squareId === currentSquareId);
        if(!currentSquare) continue; // Skip if the square doesn't exist
        let squareContent = currentSquare.pieceColor
        if(squareContent != "blank" && squareContent == pieceColor) {
            return legalSquares;
        }
        legalSquares.push(currentSquareId);
        if(squareContent != "blank" && squareContent != pieceColor) {
            return legalSquares;
        }
    }
    return legalSquares;
}


//Eight Rank H File//
function moveToEightRankHFile(startingSquareId, pieceColor, boardSquaresArray) {
    const file = startingSquareId.charAt(0);
    const rank = startingSquareId.charAt(1);
    const rankNumber = parseInt(rank);
    let currentRank = rankNumber;
    let currentFile = file;
    let legalSquares = [];
    while(currentFile < "h" && currentRank < 8) {
        currentFile = String.fromCharCode(currentFile.charCodeAt(0) + 1);
        currentRank++;
        let currentSquareId = currentFile + currentRank;
        let currentSquare = boardSquaresArray.find((element) => element.
        squareId === currentSquareId);
        if(!currentSquare) continue; // Skip if the square doesn't exist
        let squareContent = currentSquare.pieceColor
        if(squareContent != "blank" && squareContent == pieceColor) {
            return legalSquares;
        }
        legalSquares.push(currentSquareId);
        if(squareContent != "blank" && squareContent != pieceColor) {
            return legalSquares;
        }
    }
    return legalSquares;
}


//First Rank A//
function moveToFirstRankAFile(startingSquareId, pieceColor, boardSquaresArray) {
    const file = startingSquareId.charAt(0);
    const rank = startingSquareId.charAt(1);
    const rankNumber = parseInt(rank);
    let currentRank = rankNumber;
    let currentFile = file;
    let legalSquares = [];
    while(currentFile > "a" && currentRank > 1) {
        currentFile = String.fromCharCode(currentFile.charCodeAt(0) - 1);
        currentRank--;
        let currentSquareId = currentFile + currentRank;
        let currentSquare = boardSquaresArray.find((element) => element.
        squareId === currentSquareId);
        if(!currentSquare) continue; // Skip if the square doesn't exist
        let squareContent = currentSquare.pieceColor
        if(squareContent != "blank" && squareContent == pieceColor) {
            return legalSquares;
        }
        legalSquares.push(currentSquareId);
        if(squareContent != "blank" && squareContent != pieceColor) {
            return legalSquares;
        }
    }
    return legalSquares;
}

//FirstRank H//
function moveToFirstRankHFile(startingSquareId, pieceColor, boardSquaresArray) {
    const file = startingSquareId.charAt(0);
    const rank = startingSquareId.charAt(1);
    const rankNumber = parseInt(rank);
    let currentRank = rankNumber;
    let currentFile = file;
    let legalSquares = [];
    while(currentFile < "h" && currentRank > 1) {
        currentFile = String.fromCharCode(currentFile.charCodeAt(0) + 1);
        currentRank--;
        let currentSquareId = currentFile + currentRank;
        let currentSquare = boardSquaresArray.find((element) => element.
        squareId === currentSquareId);
        if(!currentSquare) continue; // Skip if the square doesn't exist
        let squareContent = currentSquare.pieceColor
        if(squareContent != "blank" && squareContent == pieceColor) {
            return legalSquares;
        }
        legalSquares.push(currentSquareId);
        if(squareContent != "blank" && squareContent != pieceColor) {
            return legalSquares;
        }
    }
    return legalSquares;
}


function KinginCheck(squareId, pieceColor, boardSquaresArray) {
    let legalSquares = RookMoves(squareId, pieceColor, boardSquaresArray);
    for (let squareId of legalSquares) {
        let pieceProperties = getPieceAtSquare(squareId, boardSquaresArray);
        if ((pieceProperties.pieceType === "rook" ||
         pieceProperties.pieceType === "queen") &&
            pieceColor !== pieceProperties.pieceColor) {
            return true;
        }
    }
    legalSquares = BishopMoves(squareId, pieceColor, boardSquaresArray);
    for (let squareId of legalSquares) {
        let pieceProperties = getPieceAtSquare(squareId, boardSquaresArray);
        if ((pieceProperties.pieceType === "bishop" ||
         pieceProperties.pieceType === "queen") &&
            pieceColor !== pieceProperties.pieceColor) {
            return true;
        }
    }
    legalSquares = knightMoves(squareId, pieceColor, boardSquaresArray);
    for (let squareId of legalSquares) {
        let pieceProperties = getPieceAtSquare(squareId, boardSquaresArray);
        if ((pieceProperties.pieceType === "knight") &&
            pieceColor !== pieceProperties.pieceColor) {
            return true;
        }
    }
    legalSquares = checkPawndiagonalCaptures(squareId, pieceColor, boardSquaresArray);
    for (let squareId of legalSquares) {
        let pieceProperties = getPieceAtSquare(squareId, boardSquaresArray);
        if ((pieceProperties.pieceType === "pawn") &&
            pieceColor !== pieceProperties.pieceColor) {
            return true;
        }
    }
    legalSquares = KingMoves(squareId, pieceColor, boardSquaresArray);
    for (let squareId of legalSquares) {
        let pieceProperties = getPieceAtSquare(squareId, boardSquaresArray);
        if ((pieceProperties.pieceType === "king") &&
            pieceColor !== pieceProperties.pieceColor) {
            return true;
        }
    }
    return false;
} 

function MoveValidAgaintsCheck(legalSquares, startingSquareId, pieceColor, pieceType) {
    let kingSquare = WhiteTurn ? whiteKingSquare : blackKingSquare;
    let boardSquaresArrayCopy = deepCopyArray(boardSquaresArray);
    let legalSquaresCopy = legalSquares.slice();

    for (let destinationId of legalSquares) {
        let tempBoard = deepCopyArray(boardSquaresArray);
        let currentSquare = tempBoard.find(element => element.squareId === startingSquareId);
        let destinationSquare = tempBoard.find(element => element.squareId === destinationId);
        
        if (currentSquare && destinationSquare) {
            // Make the move on the temporary board
            destinationSquare.pieceColor = currentSquare.pieceColor;
            destinationSquare.pieceType = currentSquare.pieceType;
            destinationSquare.piece = currentSquare.piece;
            currentSquare.pieceColor = "blank";
            currentSquare.pieceType = "blank";
            currentSquare.piece = "blank";

            // Update king's position if it's the king being moved
            let newKingSquare = kingSquare;
            if (pieceType === "king") {
                newKingSquare = destinationId;
            }

            // Check if the move leaves the king in check
            if (KinginCheck(newKingSquare, pieceColor, tempBoard)) {
                legalSquaresCopy = legalSquaresCopy.filter(square => square !== destinationId);
                
            }
        }
    }

    return legalSquaresCopy;
}

function checkForCheckmate(){
    let kingSquare = WhiteTurn ? whiteKingSquare : blackKingSquare;
    let pieceColor = WhiteTurn ? "white" : "black";
    let boardSquaresArrayCopy = deepCopyArray(boardSquaresArray);
    let KinginCheck = KinginCheck(kingSquare, pieceColor, boardSquaresArrayCopy);
    if (!KinginCheck) {
        
        return false; // Not in checkmate
    }
    let posssibleMoves = getAllPossibleMoves(pieceColor, boardSquaresArrayCopy);
    if(posssibleMoves.length>0) return;
    let message ="";
    WhiteTurn ? (message = "Black wins!") : (message = "White wins!");
    showAlert(message)
}
function getAllPossibleMoves(squaresArray, color){
    return squaresArray
    .filter((square)=> square.pieceColor === color).
    flatMap((square) => {
        const {pieceColor,pieceType,peiceId} = getPieceAtSquare(square.squareId, squaresArray);
        if(peiceId=== "blank") return [];
        let squaresArrayCopy= deepCopyArray(squaresArray);
        const pieceObject= {pieceColor: pieceColor, pieceType: pieceType, pieceId: peiceId};  
        let legalSquares = getPossibleMoves(square.squareId, pieceObject, squaresArrayCopy);  
        legalSquares- MoveValidAgaintsCheck(legalSquares, square.squareId, pieceColor, pieceType);
        return legalSquares;
    })
    
    }
    function showAlert(message) {
        const alert = document.getElementById("alert");
        alert.innerHTML = message;
        alert.style.display="block";
        
        setTimeout(() => {
            alert.style.display="none";
        }, 3000);
}
