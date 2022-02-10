window.onload = init;

function init() {

	let data = document.getElementById("data");
	if(!data) { return;}
	
	let rows = data.innerText.split(/\r?\n/);

	let table = document.getElementById("hints");
	let tr;
	
	for(let i=0; i < rows.length; i++) {
		let fields = rows[i].split(/\t/);
		if(fields[0] == '') {}
		else if(fields[0].match(/^ACROSS$|^DOWN$/i)) {
			tr = table.insertRow(-1);
			tr.innerHTML = "<TH colspan=4 class='ad'><h2>" 
										+ fields[0].charAt(0).toUpperCase() 
										+ fields[0].slice(1).toLowerCase()
										+ "</h2></TH>";
			tr = table.insertRow(-1)
			tr.innerHTML = "<TH>Clue</TH><TH>indicator(s)</TH><TH>method(s)</TH><TH>definition(s)</TH>"							
		} else {
			tr = table.insertRow(-1);
			tr.classList.add('hint');
			tr.innerHTML = "<TH>" + fields[0] + "</TH><TD>"
							+ fields.slice(1).join('</TD><TD>') + "</TD>";
		}
	}
	
	addHideControl();
}

function addHideControl() {
	var cells = document.getElementsByTagName('td');

	for (let i=0; i < cells.length; i++) {
	  cells[i].onclick = function() { toggleHide(this) };
	}
}	
	
function toggleHide(ctl) {
	if(ctl.classList.contains('revealed')) {
		ctl.classList.remove('revealed');
	}	else {
		ctl.classList.add('revealed');
	}
}

function setAll(ctl) {

	let bool = ctl.value == 'Hide All';
	var cells = document.getElementsByTagName('td');
	
	for (let i=0; i < cells.length; i++) {
		if(bool) {
			if(cells[i].classList.contains('revealed')) {
				cells[i].classList.remove('revealed');
			}
		} else {
			if(!cells[i].classList.contains('revealed')) {
				cells[i].classList.add('revealed');
			}
		}
	}
}