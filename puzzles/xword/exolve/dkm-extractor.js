function getMarkedCells() {

	var puz = exolvePuzzles[puzid];
	if(!puz) {return;}
	if(!markedCells) {return;}
	
	let result = '';
	for(let i=0; i<markedCells.length; i++) {
		if (result) { result += ' '; }
		let coords = puz.parseCellLocation(markedCells[i]);   // [row,col]
		let gridCell = puz.grid[coords[0]][coords[1]];
		if (gridCell.currLetter == '0' || gridCell.currLetter == '?') {
			result += "_";
		} else {
			result += gridCell.currLetter;
		}
	}
	
	if(result.length > 0) {
		showModal('Extraction', result);
	}
}
