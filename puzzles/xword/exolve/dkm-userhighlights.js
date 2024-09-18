const userHighlights = new Map()		// cells to be highlighted dynamically
var userHighlightColor

function storeKey(puz) {
	return puz.id+":userHighlights"
}
function getCellKey(row,col) {
	return `${row},${col}`
}
function handleToggleHighlight(puz, color, e) {

	let key = e.which || e.keyCode
	if(key != 49) return // 1

  puz.usingGnav = true;
  
  const gridCell = puz.currCell()
  if (!gridCell) return
  if (!gridCell.isLight) return

  const row = puz.currRow
	const col = puz.currCol
	
	if (!removeUserHighlight(puz,row,col)) {
		addUserHighlight(puz,row,col,color)
	}
	saveUserHighlights()
}

function addUserHighlight(puz,row,col,color,scale=1) {
	if(isNaN(row) || isNaN(col)) return
	if(!Number.isInteger(parseFloat(row))) return
	if(!Number.isInteger(parseFloat(col))) return
	if(row < 0 || row >= puz.gridHeight || col < 0 || col >= puz.gridWidth) return
	const cell = getCellKey(row,col)
	if (userHighlights.has(cell)) return
	let gridCell = null
	try {
		gridCell = puz.grid[row][col]
	} catch(e) {return}
	if(!gridCell) return
  if (!gridCell.isLight) return
	
  userHighlights.set(cell, puz.makeCellDiv(row, col, color, scale))
  puz.colourGroup.appendChild(userHighlights.get(cell))
	refreshColorGroup(puz)
}

function removeUserHighlight(puz,row,col) {
	const cell = getCellKey(row,col)
	if(!userHighlights.has(cell)) return false
	puz.colourGroup.removeChild(userHighlights.get(cell))
  userHighlights.delete(cell)
	refreshColorGroup(puz)
	return true
}

function refreshColorGroup(puz) {
	puz.colourGroup.style.display = (userHighlights.size> 0) ||
	 		(puz.colourfuls.length > 0)? '' : 'none';
}

function saveUserHighlights() {

	const histr = JSON.stringify(Array.from(userHighlights.keys()))
	
	try {
		localStorage.setItem(storeKey(puz), histr)
		return
	} catch(e) {}

	try {
		sessionStorage.setItem(storeKey(puz), histr)
		return
	} catch(e) {}
}

function restoreUserHighlights(puz,color) {

	userHighlightColor = color
	let histr = ''
	
	try {
		histr = localStorage.getItem(storeKey(puz))
	} catch(e) {}

	if(!histr) {
		try {
			histr = sessionStorage.getItem(puz.id+":userHighlights")
		} catch(e) {}
	}
	
	if(!histr) return
	try {
		histr = JSON.parse(histr)
	} catch(e) {}
	
	if(!histr) return
	
  for (let cell of histr) {
    let [row,col] = cell.split(',')
		addUserHighlight(puz,row,col,color)
	}
}

function customRecolourCells(scale=1) {
	
	Exolve.prototype.recolourCells.call(puz, scale)
	if(userHighlightColor) {
		const hilist = Array.from(userHighlights.keys())
		userHighlights.clear()
		for (let cell of hilist) {
    	let [row,col] = cell.split(',')
			addUserHighlight(puz,row,col,userHighlightColor,scale)
		}
	}
}