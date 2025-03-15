/* Orientations:
 v=vertical (flat up, there's a down clue)
 h=horizontal (point up, there's an across clue)
*/

// Allowed borders/directions based on orientation
const borderdirs = {
	'v': ['NO','NE','SE','SO','SW','NW'],
	'h': ['NW','NE','EE','SE','SW','WW']
}
// How grid is marked up to indicate bars:
const bordersymbol = {
	'v': {
		'/': 'NW',
		'-': 'NO',
		'=': 'NE',
		'<': 'NW,NO',
		'>': 'NE,NO',
		'^': 'NW,NE',
		'+': 'NW,NE,NO'
	},
	'h': {
		'|': 'WW',
		'/': 'NW',
		'=': 'NE',
		'<': 'WW,NW',
		'^': 'NW,NE',
		'>': 'WW,NE',
		'+': 'WW,NW,NE'
	}
}
// QXW: How grid is marked up to indicate bars:
const bordernums = {
	'v': {
		'0': '',
		'1': 'NE',
		'2': 'SE',
		'3': 'NE,SE',
		'4': 'SO',
		'5': 'NE,SO',
		'6': 'SE,SO',
		'7': 'NE,SE,SO'
	},
	'h': {
		'0': '',
		'1': 'EE',
		'2': 'SE',
		'3': 'EE,SE',
		'4': 'SW',
		'5': 'EE,SW',
		'6': 'SE,SW',
		'7': 'EE,SE,SW'
	}
}

const clues = {}
const clueshdr = {}
const cellseq = {}
const cells = {}
const grid = []
const param = {
		'separator-color': 'gray',
		'border-color': 'black'
}

function getHex2Exolve(template, hexdata) {
	const datarows = hexdata.split(/\r?\n/);
	let section = ''
	let dir = ''
	let output = template
	let height = 0
	let width = 0
	let gridtext = ''
		
	const reclue = /^clues-([^\-\s]+)-(.+?)$/i;
	const reparm = /^([a-z:\-]+?)\s*:\s*(.+?)$/i;
		
	for(let i=0; i<datarows.length; i++) {
		
		datarows[i] = datarows[i].trim()
		
		if (!datarows[i]) continue					// skip blanks
			
		if(section == 'clues') {
			if (datarows[i].match(/^\d/)) {	
				clues[dir].push(datarows[i])
				continue
			} else {													// not a clue any more
				section = ''
			}
		}
		
		let cmatch = datarows[i].match(reclue)
		if(cmatch) {											// start of clue section
			dir = cmatch[1].toUpperCase()
			if(!param.hasOwnProperty('directions')) {
				console.log("clues need to follow 'directions' parameter")
				return
			}
			if(!param['directions'].toUpperCase().includes(dir)) {
				console.log(`unsupported direction '${dir}' in clue header: ${datarows[i]}`)
				return
			}
			if(clues.hasOwnProperty(dir)) {
				console.log(`multiple sections for clues for direction '${dir}'`)
				return
			}
			
			clues[dir] = Array()
			clueshdr[dir] = cmatch[2]
			section = 'clues'
			continue
		}

		let pmatch = datarows[i].match(reparm)
		
		if(pmatch) {
			param[pmatch[1].toLowerCase()] = pmatch[2]
			section = ''
			continue
		}
	
		if(datarows[i] == 'grid:') {			// start of grid section
			section = 'grid';
			continue	
		}

		if(section == 'grid') {
			grid.push(datarows[i])
			continue
		}
	}
	
	// Check for required parameters:
	let parmerr = false
	Array('separator-color', 'separator-width', 
	'border-color', 'border-width', 
	'orient', 'directions', 'hexside').forEach((item) => {
		if (param.hasOwnProperty(item)) {
			if(parseFloat(param[item]) == param[item]) param[item] = parseFloat(param[item])
			return
		}
		parmerr = true
		console.log(`missing parm ${item}`)
	})

	const cluedirs = param['directions'].toUpperCase().split(',')
	const edgedirs = borderdirs[param['orient']]	

	// validate directions are legit:
	cluedirs.forEach((item) => {
		if(edgedirs.includes(item)) {
			cellseq[item] = {}
			return
		}
		parmerr = true
		console.log(`unsupported direction ${item}`)
	})

	if(parmerr) return
	
	height = grid.length

	const geo = gethexgeo(param['orient'], param['hexside'])

	if(!geo) return

	output = output.replaceAll('%SHAPE%', `${geo.idx_x} ${geo.idx_y} <polygon points="${geo.points.join(' ')}" stroke="${param['separator-color']}" stroke-width="1">`)

// Phase 1: process the grid:
	
	let coord = ''
	for(let r=0; r<grid.length; r++) {
		let c=-1
		for(let i=0; i<grid[r].length; i++) {
			if (/\s/.test(grid[r].charAt(i))) continue
			if (/[a-z0\.]/i.test(grid[r].charAt(i))) {
				c++
				coord = `${r},${c}`
				cells[coord] = {
					'isLight': grid[r].charAt(i) != '.',
					'value': grid[r].charAt(i),
					'edges': []
				}
				if (c+1 > width) width = c+1
				
				if(!i+1<grid.length) continue
				if(/[a-z0\.]/i.test(grid[r].charAt(i+1))) continue
			}
			
			// Check for border numbers
			if (/^[1-7]/.test(grid[r].charAt(i)) ) {
				if(cells[coord]['edges'].length) {
					console.log(`${coord} has multiple edge indicators`)
					return
				}
				cells[coord]['edges'] = bordernums[param['orient']][grid[r].charAt(i)].split(',')
				continue
			}
			
			// Check for border symbols
			if (Object.keys(bordersymbol[param['orient']]).includes(grid[r].charAt(i))) {
				if(cells[coord]['edges'].length) {
					console.log(`${coord} has multiple edge indicators`)
					return
				}
				cells[coord]['edges'] = bordersymbol[param['orient']][grid[r].charAt(i)].split(',')
			}
		}		
	}

// Phase 1b: migrate edges EE or anything South (to prevent later cells covering them up):

	Object.keys(cells).forEach((coord) => {
		const oldedges = cells[coord]['edges']
		cells[coord]['edges'] = []
		oldedges.forEach((dir) => {
			if(!/^[ES]/.test(dir)) {
				cells[coord]['edges'].push(dir)
				return
			}
			let nextc = checkDir(cells, coord, dir)
			if(!nextc) return
			let oppdir = getReverseDir(dir)
			cells[nextc]['edges'].push(oppdir)
		})
	})

	output = output.replace('%HEIGHT%', height)
								 .replace('%WIDTH%', width)
								 .replace('%COLWIDTH%', geo.colwidth)
								 .replace('%ROWHEIGHT%', geo.rowheight)
								 .replace('%CELLWIDTH%', geo.cellwidth)
								 .replace('%CELLHEIGHT%', geo.cellheight)

	let decotext = ''
	for(let i=0; i<edgedirs.length; i++) {
		let ept = geo.edges[edgedirs[i]].split(/[:,]/)
		if (decotext) decotext += "\n"
		decotext += `\texolve-cell-decorator: <line x1="${ept[0]}" y1="${ept[1]}" x2="${ept[2]}" y2="${ept[3]}" stroke="${param['border-color']}" stroke-width="4"> # ${i+1}: ${edgedirs[i]}`
	}
	
	output = output.replace('%DECORATORS%', decotext)

// Phase 2: re-process the grid: get layout, edges, generate grid:

	for(let r=0; r<height; r++) {
		gridtext += "\n\t\t"
		for(let c=0; c<width; c++) {
		
		coord = `${r},${c}`
		if(!cells.hasOwnProperty(coord)) {
			cells[coord] = {
					'isLight': false,
					'value': '.',
					'edges': []
			}
		}
		
		if(!cells[coord]['isLight']) {
			gridtext += ' . '
			continue
		}
		
		gridtext += ` ${cells[coord].value}`
		
		if(!cells[coord]['isLight']) {
			gridtext += ' '
			continue
		}
		
		gridtext += '[1]'
		
		edgetxt = ''
		for(j=0; j<edgedirs.length;j++) {
			if(!checkDir(cells, coord, edgedirs[j])) {
				edgetxt += ',' + (j+1)
		}}
		if(edgetxt) gridtext += `{${edgetxt.substring(1)}}`
		
		gridtext += ' '
		
	}}

	output = output.replace('%GRID%', gridtext)


// Phase 3: link grid to clues

	let cluenum = 0
	
	for(let r=0; r<height; r++) {
	for(let c=0; c<width; c++) {
		coord = `${r},${c}`
		if(!cells[coord]['isLight']) continue
		let isnewclue = true
	for(let d=0; d<cluedirs.length; d++) {	// loop through clue directions:
		let iscluestart = false
		let after = canGoDir(cells, coord, cluedirs[d])
		let oppdir = getReverseDir(cluedirs[d])
		let before = canGoDir(cells, coord, oppdir)
		
		iscluestart = (!before && after)
		if(!iscluestart) continue
		
		if(isnewclue) {
			isnewclue = false
			cluenum++
		}
		
		let sequence = [coord2RC(coord, height), coord2RC(after, height)]
		while(after = canGoDir(cells,after,cluedirs[d])) {
			sequence.push(coord2RC(after, height))
		}

		cellseq[cluedirs[d]][cluenum] = sequence

	}}}

	// Process clues, link to cell sequences:

	let cluetext = "\t\t\t"

	for(let d=0; d<cluedirs.length; d++) {
		if(d>0) cluetext += "\n\t\t\t---"
		if(!clues.hasOwnProperty(cluedirs[d])) {
			console.log(`no clues for ${cluedirs[d]}`)
			continue;
		}

		cluetext += clueshdr[cluedirs[d]]
		clues[cluedirs[d]].forEach((clue) => {
			const parts = clue.split(' ')
			if(!cellseq[cluedirs[d]].hasOwnProperty(parts[0])) {
				console.log(`missing sequence for ${parts[0]}-${cluedirs[d]}`)
				return
			}
			cluetext += `\n\t\t\t${cellseq[cluedirs[d]][parts[0]].join(' ')} ${clue.replace(/^(\d+) /, "[$1] ")}`
		})
	}
	return output.replace('%CLUES%', cluetext)
}
function coord2RC(coord, height) {
	const  [row,col] = coord.split(',').map(Number)
	return `#r${height-row}c${col+1}`
}
function getReverseDir(dir) {
	return dir.replaceAll('S','Z')
						.replaceAll('N','S')
						.replaceAll('Z','N')
						.replaceAll('E','3')
						.replaceAll('W','E')
						.replaceAll('3','W')
}
function gethexgeo(orient, hexside) {
	let ctr_x = 0
	let ctr_y = 0
	let colw = 0
	let rowh = 0
	
	const hexpoint = roundplaces(hexside * Math.sin(Math.PI/6),4)
	
	if (orient == 'v') {
		rowh = roundplaces(hexside * Math.cos(Math.PI/6),4)
		colw = hexside + hexpoint
		ctr_x = .5*hexside + hexpoint
		ctr_y = rowh

		// flat up,  CenterLeft, clockwise:
		const points = [
			(ctr_x-(hexside/2+hexpoint)) + "," + ctr_y,		
			(ctr_x-(hexside/2)) + "," + (ctr_y-rowh),
			(ctr_x+(hexside/2)) + "," + (ctr_y-rowh),
			(ctr_x+(hexside/2+hexpoint)) + "," + ctr_y,		
			(ctr_x+(hexside/2)) + "," + (ctr_y+rowh),
			(ctr_x-(hexside/2)) + "," + (ctr_y+rowh) 
		]

		return {
			'ctr_x': ctr_x,
			'ctr_y': ctr_y, 
			'idx_x': ctr_x-(hexside/2)+2,
			'idx_y': ctr_y-rowh+parseInt(2*rowh/3),
			'rowheight': rowh,
			'colwidth': colw,
			'cellheight': 2*rowh,
			'cellwidth': hexside + 2*hexpoint,
			'points': points,
			'edges': {
				'NO': `${points[1]}:${points[2]}`,
				'NE': `${points[2]}:${points[3]}`,
				'SE': `${points[3]}:${points[4]}`,
				'SO': `${points[4]}:${points[5]}`,
				'SW': `${points[5]}:${points[0]}`,
				'NW': `${points[0]}:${points[1]}`
				}
			}		
	} else if (orient == 'h') {
		rowh = hexside + hexpoint
		colw =  roundplaces(hexside * Math.cos(Math.PI/6)	,4)
		ctr_x = colw
		ctr_y = 0.75*rowh
	
		// point up,  CenterTop, clockwise
		const points = [
			ctr_x + "," + (ctr_y - (hexside/2 + hexpoint)),		
			ctr_x+(colw) + "," + (ctr_y-(hexside/2)),
			ctr_x+(colw) + "," + (ctr_y+(hexside/2)),
			ctr_x + "," + (ctr_y + (hexside/2 + hexpoint)),	
			ctr_x-(colw) + "," + (ctr_y+(hexside/2)),
			ctr_x-(colw) + "," + (ctr_y-(hexside/2))
		]
		
		return {
			'ctr_x': ctr_x,
			'ctr_y': ctr_y, 
			'idx_x': ctr_x-colw+2,
			'idx_y': hexpoint+Math.round(2*colw/3),
			'rowheight': rowh,
			'colwidth': colw,
			'cellheight': 1.25*hexside+1.75*hexpoint,
			'cellwidth': 2*colw,		
			'points': points,
			'edges': {
				'NE': `${points[0]}:${points[1]}`,
				'EE': `${points[1]}:${points[2]}`,
				'SE': `${points[2]}:${points[3]}`,
				'SW': `${points[3]}:${points[4]}`,
				'WW': `${points[4]}:${points[5]}`,
				'NW': `${points[5]}:${points[0]}`
				}
			}
	}
	console.log("unknown orientation: " + orient)
}
function roundplaces(val, dec) {
	return Math.round(val*10**dec)/10**dec
}
function canGoDir(cells, coord, dir) {
	if(!cells.hasOwnProperty(coord)) return false
	let nextcell = checkDir(cells, coord, dir)
	if(nextcell == 'barred') return false
	return nextcell
}

function checkDir(cells, coord, dir) {
	if(!cells.hasOwnProperty(coord)) return false
	if(cells[coord]['edges'].includes(dir)) return false

	let oppdir = getReverseDir(dir)
	let [row, col] = coord.split(',').map(Number)
	
	switch(dir) {
	  case 'NO': row-=2; break
	  case 'EE': col+=2; break
	  case 'SO': row+=2; break
    case 'WW': col-=2; break
	  case 'NE': row--; col++; break
	  case 'SE': row++; col++; break
	  case 'SW': row++; col--; break
   	case 'NW': row--; col--; break
	  default:
	  	console.log(`unknown dir ${dir}`)
	  	return	  	
	}

	const nextc =`${row},${col}`
	if(!cells.hasOwnProperty(nextc)) return false
	if(!cells[nextc]['isLight']) return false
	if(cells[nextc]['edges'].includes(oppdir)) return 'barred'
	return nextc
}
const clueMap = {}
function mapPuzzleClues(puz) {

	const dirinitials = {}
	Object.keys(clueshdr).forEach((dir) => {
		dirinitials[dir] = clueshdr[dir].replaceAll(/[^A-Z]/g, '')
	}) 
	Object.keys(puz.clues).forEach((clue) => {
		if(!puz.clues[clue].cells.length) return
		const startc = puz.clues[clue].cells[0].flat().map(Number)
		const endc = puz.clues[clue].cells.slice(-1).flat().map(Number)
		const run = endc[1]-startc[1]
		const rise = endc[0]-startc[0]
		
		let result = ''
		switch(true) {
			case rise>0 && run==0: result='SO'; break
			case rise>0 && run>0: result='SE'; break
			case rise>0 && run<0: result='SW'; break
			case rise==0 && run>0: result='EE'; break
			case rise==0 && run<0: result='WW'; break
			case rise<0 && run==0: result='NO'; break
			case rise<0 && run>0: result='NE'; break
			case rise<0 && run<0: result='NW'; break
			default: result='X'
		}
		
		if(dirinitials.hasOwnProperty(result)) {
			result = dirinitials[result]
		}
		
		result += puz.clues[clue].label
		clueMap[result] = clue	
	})
}

oldGetLight = getLight

function hexGetLight(puz, clueIndex) {
  clueIndex = clueMap[clueIndex]
  return oldGetLight(puz, clueIndex)
}

function hexAdjustCellText(p, c, ht, row, col) {
	const geo = gethexgeo(param['orient'], param['hexside'])

	let [offX, offY] = [0,0]
	let newX = parseFloat(c.getAttribute('x'))
	let newY = parseFloat(c.getAttribute('y'))
	
	switch(param['orient']) {
		case 'v':
			[offX, offY] = geo.points[4].split(',').map(Number)
			newY = p.cellTopPos(row, offY)
			newX = p.cellLeftPos(col+1, 0)
			c.setAttribute('x', newX-0.5)
			c.setAttribute('y', newY-3)
			c.style['text-anchor'] = 'end'
			break
	  case 'h': 
	  	[offX, offY] = geo.points[3].split(',').map(Number)
			newX = p.cellLeftPos(col, offX)
			c.setAttribute('x', newX)
			c.setAttribute('y', newY-3)
			c.style['text-anchor'] = 'middle'
			break
		default: console.log('hexAdjustCellText: unknown orientation')

	}
}

window.getLight = hexGetLight