let popupModal;
var answer_hashes = {};

function doCloseModal() {
	if(popupModal) { 
		if(popupModal.style.display == "none") { return;	}
		popupModal.style.display = "none";
		window.getSelection().removeAllRanges();
	}
}

function showModal(msg) {
	// Get the modal
	if (!popupModal) {
		popupModal = document.getElementById("popupModal");
	
		if(popupModal) {
			var span = document.getElementsByClassName("modal-close");
			span[0].onclick = doCloseModal;
			window.onclick = function(e) {
				if(e.target == popupModal) { doCloseModal(); }
			}
			document.addEventListener('keydown', (event) => {
  			if (event.key === 'Escape') { doCloseModal(); }
  		});
		}
	}

	if(popupModal) {
		var modalBody = document.getElementsByClassName("modal-body");
		if(modalBody) {
			modalBody[0].innerHTML = msg;
			popupModal.style.display = "block";
		}
	}
}

function sha256hash(string) {
  const utf8 = new TextEncoder().encode(string);
  return crypto.subtle.digest('SHA-256', utf8).then((hashBuffer) => {
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((bytes) => bytes.toString(16).padStart(2, '0'))
      .join('');
    return hashHex;
  });
}

function getLight(puz, clueIndex) {
  let light = '';
  for (let rowcol of puz.clues[clueIndex].cells) {
    light = light + puz.grid[rowcol[0]][rowcol[1]].currLetter
  }
  return light
}

var checklock = 0;
var hashpromises = [];

function checkPuzzle() {

	if(checklock) { return false; }
	answer_hashes = {};
	hashpromises = [];
	
	var puz = exolvePuzzles[puzid];
	
	if(!puz) { return; }

	checklock = 1;	
	const keys = Object.keys(exolveanswers);
	var p;

	for (var k=0; k < keys.length; k++) {
		var light = getLight(puz, keys[k]);
		if(light.match(/0/)) {
			p = Promise.resolve('');
			answer_hashes[keys[k]] = p;
			hashpromises.push(p);
		} else {
			p = sha256hash(light);			
			answer_hashes[keys[k]] = p;
			hashpromises.push(p);
		}
	}
	
	if(hashpromises.length>0) {
		Promise.all(hashpromises).then(processAnswers());
		return false;
	}

	processAnswers();
	return false;
}

async function processAnswers() {
	
	var incomplete_count = 0;
	var incorrect_count = 0;
	var incorrect_msg = '';
	
	var puz = exolvePuzzles[puzid];
	
	if(!puz) { return; }
	
	const keys = Object.keys(exolveanswers);
	
	for (var k=0; k < keys.length; k++) {
		if (!answer_hashes.hasOwnProperty(keys[k])) {
			// console.log(keys[k]+': missing hash');
		} else {
			var ans = await answer_hashes[keys[k]];
			if(ans == '') {
				incomplete_count++;
			} else {
				if(ans != exolveanswers[keys[k]]) {
					if(incorrect_count) { incorrect_msg +=', '; }
					incorrect_msg += keys[k];
					incorrect_count++;
				}
			}
		}
	}

	var msg = '';
	if(!(incorrect_count||incomplete_count)) {
		msg = 'Correct!';
	} else {
		if(incorrect_count) {
			msg = 'Incorrect answer'
					+ (incorrect_count > 1 ? 's' : '')
					+ ': ' + incorrect_msg;
		
			if(incomplete_count>0) { msg += ' and ' }			
		}

		if(incomplete_count>0) {
			msg += incomplete_count + ' incomplete answer'
					+ (incomplete_count > 1 ? 's' : '')
		}
		msg += '.';
	}
	showModal(msg);
	checklock = 0;
}
