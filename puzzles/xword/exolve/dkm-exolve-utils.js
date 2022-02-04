function insertBackgroundForLightCells(puz, innercolor, outercolor) {

  // inner lines:

	  const thisW = puz.cellW + 2*puz.GRIDLINE;
	  const thisH = puz.cellH + 2*puz.GRIDLINE;

	const lineGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  puz.svg.appendChild(lineGroup);
	
  for (let row = 0; row < puz.gridHeight; row++) {
    for (let col = 0; col < puz.gridWidth; col++) {
      if (!puz.grid[row][col].isLight) { continue; }

      const cellL = puz.cellLeftPos(col, 0);
      const cellT = puz.cellTopPos(row, 0);

      const rect = 
        document.createElementNS('http://www.w3.org/2000/svg', 'rect');

      rect.setAttributeNS(null, 'x', cellL);
      rect.setAttributeNS(null, 'y', cellT);
      rect.setAttributeNS(null, 'width', thisW);
      rect.setAttributeNS(null, 'height', thisH);
      rect.setAttributeNS(null, 'fill', innercolor);
			puz.background.after(rect);
    }
  }

  // outer lines:
  
  	const barW = 1.5*puz.GRIDLINE;

  for (let row = 0; row < puz.gridHeight; row++) {
    for (let col = 0; col < puz.gridWidth; col++) {
      if (!puz.grid[row][col].isLight) { continue; }

      const cellL = puz.cellLeftPos(col, 0);
      const cellT = puz.cellTopPos(row, 0);
      const cellR = puz.cellLeftPos(col+1, 0);
      const cellB = puz.cellTopPos(row+1, 0);

      // Top line (only on first row or cell in previous row blank):
      
      if(hasTopLine(puz, row, col)) {
  	    const line = 
        	document.createElementNS('http://www.w3.org/2000/svg', 'line');
	      	line.setAttributeNS(null, 'x1', Math.max(0,cellL-(meetTopLeft(puz, row, col)?barW:0)));
      		line.setAttributeNS(null, 'y1', cellT);
      		line.setAttributeNS(null, 'x2', cellR+(meetTopRight(puz, row, col)?barW:1));
		     	line.setAttributeNS(null, 'y2', cellT);
		     	line.setAttributeNS(null, 'stroke', outercolor);
		     	line.setAttributeNS(null, 'stroke-width', 2*barW);
				lineGroup.appendChild(line);
      }

      // Left line (only on left column or cell in previous column blank):
      
      if(hasLeftLine(puz, row, col)) {
  	    const line = 
        	document.createElementNS('http://www.w3.org/2000/svg', 'line');
	      	line.setAttributeNS(null, 'x1', cellL);
      		line.setAttributeNS(null, 'y1', Math.max(0,cellT-(meetTopLeft(puz, row, col)?barW:0)));
      		line.setAttributeNS(null, 'x2', cellL);
		     	line.setAttributeNS(null, 'y2', cellB+(meetBottomLeft(puz, row, col)?barW:1));
		     	line.setAttributeNS(null, 'stroke', outercolor);
		     	line.setAttributeNS(null, 'stroke-width', 2*barW);
				lineGroup.appendChild(line);
      }

      // Bottom line (last row, bottom bar, or cell in next row blank):
      
      if(hasBottomLine(puz, row, col)) {
  	    const line = 
        	document.createElementNS('http://www.w3.org/2000/svg', 'line');
	      	line.setAttributeNS(null, 'x1', Math.max(0,cellL-(meetBottomLeft(puz, row, col)?barW:0)));
      		line.setAttributeNS(null, 'y1', cellB);
      		line.setAttributeNS(null, 'x2', cellR+(meetBottomRight(puz, row, col)?barW:1));
		     	line.setAttributeNS(null, 'y2', cellB);
		     	line.setAttributeNS(null, 'stroke', outercolor);
		     	line.setAttributeNS(null, 'stroke-width', 2*barW);
				lineGroup.appendChild(line);
      }

      // Right line (last column, after bar, or cell in next column blank):
      
      if(hasRightLine(puz, row, col)) {
  	    const line = 
        	document.createElementNS('http://www.w3.org/2000/svg', 'line');
	      	line.setAttributeNS(null, 'x1', cellR);
      		line.setAttributeNS(null, 'y1', Math.max(0,cellT-(meetTopRight(puz, row, col)?barW:0)));
      		line.setAttributeNS(null, 'x2', cellR);
		     	line.setAttributeNS(null, 'y2', cellB+(meetBottomRight(puz, row, col)?barW:1));
		     	line.setAttributeNS(null, 'stroke', outercolor);
		     	line.setAttributeNS(null, 'stroke-width', 2*barW);
				lineGroup.appendChild(line);
      }
    }
  }
}

function checkIsLight(puz, row, col) {
	return (cellInRange(puz, row, col) && puz.grid[row][col].isLight);
}
function checkHasUnder(puz, row, col) {
	return (cellInRange(puz, row, col) && puz.grid[row][col].hasBarUnder);
}
function checkHasAfter(puz, row, col) {
	return (cellInRange(puz, row, col) && puz.grid[row][col].hasBarAfter);
}
function cellInRange(puz, row, col) {
	return ( row >= 0 && row < puz.gridHeight && col >= 0 && col < puz.gridWidth)
}
function hasTopLine(puz, row, col) {
	return (row == 0 || !checkIsLight(puz, row-1, col));
}
function hasLeftLine(puz, row, col) {
	return (col == 0 || !checkIsLight(puz, row, col-1));
}
function hasBottomLine(puz, row, col) {
	return (row == puz.gridHeight-1 || row < 0 || 
					( checkHasUnder(puz, row, col) || !checkIsLight(puz, row+1, col)));
}
function hasRightLine(puz, row, col) {
	return (checkHasAfter(puz, row, col) || !checkIsLight(puz, row, col+1));
}
function meetTopLeft(puz, row, col) {
	return ( hasTopLine(puz, row, col-1) || hasBottomLine(puz, row-1, col-1)
					|| hasRightLine(puz, row, col-1) || hasRightLine(puz, row-1, col-1) );
}
function meetTopRight(puz, row, col) {
	return ( hasTopLine(puz, row, col+1) || hasBottomLine(puz, row-1, col+1)
					|| hasLeftLine(puz, row, col+1) || hasLeftLine(puz, row-1, col+1) );
}
function meetBottomLeft(puz, row, col) {
	return ( (checkHasUnder(puz, row, col) && checkHasAfter(puz, row, col))
					|| hasBottomLine(puz, row, col-1) || hasTopLine(puz, row+1, col-1)
					|| hasRightLine(puz, row, col-1) || hasRightLine(puz, row+1, col-1) );
}
function meetBottomRight(puz, row, col) {
	return ( hasBottomLine(puz, row, col+1) || hasTopLine(puz, row+1, col+1)
					|| hasLeftLine(puz, row, col+1) || hasLeftLine(puz, row+1, col+1) );
}
