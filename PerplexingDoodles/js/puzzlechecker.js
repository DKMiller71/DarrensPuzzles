window.onload = init;

//template inserted for each puzzle checker box:
const puzzleFormTemplate = `
<div id="Puzzle_PUZZLEID_Section">
<h2>Day DAYNUM: Puzzle by AUTHOR</h2>
<form id="Puzzle_PUZZLEID_Form" onsubmit="handleFormSubmit(this)" autocomplete=off>
<input name="PuzzleID" type="hidden" value="PUZZLEID" />
<span id="Puzzle_InputWrapper_PUZZLEID">
<input id="Puzzle_Input_PUZZLEID" class="inputbox" name="Answer" type="text" width=50 oninput="clearInputState(this);" />
</span><span id="Puzzle_Result_PUZZLEID">&nbsp;</span><br />
<input id="Puzzle_CheckButton_PUZZLEID" class="button" name="Check Answer" type="submit" value="Check Answer" />
</form>
</div>
`
const puzzleResetTemplate = `
	<input id="Puzzle_ResetButton" class="button resetbutton" name="Reset" value="Reset" onclick="resetPage()"  />
`
const PuzzleCheckTimer = {}
const test_hashes = {}
const answerdata_hashes = {}
const unlockdata = {}
const answer_state = {}
const pageKey = location.pathname.replaceAll(/\W/g,'_').toLowerCase()

async function sha256hash(string) {
  const utf8 = new TextEncoder().encode(string);
  const hashBuffer = await crypto.subtle.digest('SHA-256', utf8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((bytes) => bytes.toString(16).padStart(2, '0'))
    .join('');
  return hashHex;
}

// Prevent forms from submitting
function preventFormSubmit() {
	const forms = document.querySelectorAll('form');
	for (let i = 0; i < forms.length; i++) {
		forms[i].addEventListener('submit', function(event) { event.preventDefault(); });
	}
}

// Accepts form submit event, sends values to answer checker
function handleFormSubmit(formObject) {
  if(PuzzleCheckTimer.hasOwnProperty(formObject.PuzzleID.value)) return
  checkAnswer(formObject.PuzzleID.value, formObject.Answer.value)
}

async function decodeUnlock(pid, key) {
	console.log(`1. decodeUnlock ${pid}, ${key}`)
	if(!unlockdata.hasOwnProperty(pid)) return
	console.log(`2. decodeUnlock ${pid}, ${key}`)
	decryptData(unlockdata[pid], key).then(result => showUnlock(pid, result));
}

function showUnlock(pid, text) {
	console.log(`showUnlock ${pid}, ${text}`)
	if(!text) return
	const el = document.getElementById(`Puzzle_${pid}_Section`);
	if(!el) {
		console.log(`missing section; Puzzle_${pid}_Section`)
		return
	}
	el.insertAdjacentHTML('beforeend', `<div>${text}</div>`)	
}

// Process puzzleid and answer for validation
function checkAnswer(pid, answer, isrestore=false) {
	answer = answer.toUpperCase().replaceAll(/\W/g, '')
  if(answer == '') return

  PuzzleCheckTimer[pid] = setTimeout(function(){ timeoutAnswerCheck(pid) }, 2000);
  lockPuzzleForm(pid, 'PENDING');
	decodeUnlock(pid, answer)
	test_hashes[pid] = sha256hash(answer)	
	test_hashes[pid].then(checkAnswerResult.bind(null, pid))
	
	if(isrestore) restoreAnswer(pid, answer) 
	
}

// Attempt to hash answer took longer than timeout, unlock form
function timeoutAnswerCheck(pid) {
    if(!PuzzleCheckTimer.hasOwnProperty(pid)) { return; }
    delete PuzzleCheckTimer[pid];
    lockPuzzleForm(pid, 'TIMEOUT');
}

// Lock/unlock input box and submit box while answer is being checked
function lockPuzzleForm(pid, status) {

  const el = document.getElementById('Puzzle_Result_'+pid);
  if(!el) { return; }
  
  el.innerHTML = status;
  el.className = status;

  disableUserInput(pid, (status != 'TIMEOUT'));
}

function disableUserInput(pid, state) {
  let el = document.getElementById('Puzzle_Input_'+pid);
  if(el) { el.disabled = state; }
  el = document.getElementById('Puzzle_CheckButton_'+pid);
  if(el) { el.disabled = state; }
}

function selectall(elem) { // select everything in the outputarea
	if (window.getSelection) {
    const range = document.createRange();
    range.selectNode(elem);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
  }
}

// show result and update state if correct
function showCheckResult(pid, status) {

  if(status == 'CORRECT') { saveToState(pid); showResetButton(true); }
 
  if(PuzzleCheckTimer.hasOwnProperty(pid)) {
    delete PuzzleCheckTimer[pid];
  }

  let el = document.getElementById('Puzzle_Result_'+pid);
  if(!el) { alert('Bad Puzzle ID '+pid); return;}

  el.innerHTML = status == '' ? '&nbsp;' : status;
  if(el) el.className = status;

  el = document.getElementById('Puzzle_InputWrapper_'+pid);
  if(el) el.className = status+'_INPUT';

	disableUserInput(pid, (status == 'CORRECT'));

}

function clearInputState(el) {
	el.parentNode.className = ''
	let rel = document.getElementById(el.id.replace('Input','Result'))
	if(rel) rel.innerHTML = '&nbsp;'	
}


function restoreAnswer(pid, answer) {
  const el = document.getElementById('Puzzle_Input_'+pid);
	if(el) el.value = answer
}

// Writes correct answers to state and localstorage
function saveToState(pid) {
  el = document.getElementById(`Puzzle_Input_${pid}`);
  if(el) {
  	answer_state[pid] = el.value.toUpperCase().replaceAll(/\W/g,'')
  }
  
  if (typeof(Storage) === "undefined") return
  if (pageKey == '') return

	try {
		window.localStorage.setItem(pageKey, JSON.stringify(answer_state));
	} catch(error) {}
}

// Reads localstorage and writes them to state if correct
function restoreFromState() {
  if (typeof(Storage) === "undefined") { return; }
  if (pageKey == '') { return; }
	
	let savedstate = ''
  
  try {
    savedstate = window.localStorage.getItem(pageKey);

		if(savedstate == '') return 

		const restoredstate = JSON.parse(savedstate)

		const keys = Object.keys(restoredstate);
		
		for (let k=0; k < keys.length; k++) {
			checkAnswer(keys[k], restoredstate[keys[k]], true)
		}

  } catch(error) {}

}

function showResetButton(bool) {
	const el = document.getElementById("Puzzle_ResetButton")
	if(el) { el.style.display = 'block' }
}

function resetPage() {
	resetState()
	window.location.reload()
}

function resetState() {
  if (typeof(Storage) === "undefined") { return; }
  if (pageKey == '') { return; }
  window.localStorage.removeItem(pageKey);
}

async function checkAnswerResult(pid) {
	if (!test_hashes.hasOwnProperty(pid)) {
		console.log(pid+': missing hash');
	} else {
		const ans = await test_hashes[pid]
		showCheckResult(pid, (ans == answerdata_hashes[pid] ? 'CORRECT' : 'INCORRECT'))
		delete test_hashes[pid]
	}
	
  if(PuzzleCheckTimer.hasOwnProperty(pid)) {
  	clearTimeout(PuzzleCheckTimer[pid])
  	delete PuzzleCheckTimer[pid]
  }
}

async function hashToConsole(pid) {
  const el = document.getElementById('Puzzle_Input_'+pid);
	if(!el) return
	const answer = el.value.toUpperCase().replaceAll(/\W/g, '')
	sha256hash(answer).then(console.log)		
}

// updates torn edge variable dynamically for larger boxes
function updateTornEdges() {

	const el = document.getElementById("container")
	if(!el) return
	if(el.scrollHeight < 400) return
	
	let yinc_base = Math.floor(10000 / el.scrollHeight)/10  // decimal, not percent

	if (yinc_base < .5) yinc_base = 0.5

	let pathstr = '100% 0%,'
	let ycum = yinc_base
	
	do {
		let xpct = Math.round(Math.random()*1000) / 10
		pathstr += ` ${xpct}% ${ycum}%,`

		let yvar = Math.round(10 * yinc_base * (1 + Math.random()- 0.5)) / 10
		ycum = Math.round(ycum + yvar)

	} while (ycum < 100)

	pathstr +=  'calc(100% + 1px) 100%, calc(100% + 1px) 0%'
	document.body.style.setProperty('--torn-left-clip-path',`polygon(${pathstr})`)

	pathstr = '100% 0%,'
	ycum = yinc_base
		
	do {
		xpct = Math.round(Math.random()*1000) / 10
		pathstr += ` ${xpct}% ${ycum}%,`

		let yvar = Math.round(10 * yinc_base * (1 + Math.random()- 0.5)) / 10
		ycum = Math.round(ycum + yvar)

	} while (ycum < 100)

	pathstr +=  '-10% 100%, -10% 0%'
	document.body.style.setProperty('--torn-right-clip-path',`polygon(${pathstr})`)
}

function parsedatarow(str) {
	if(str.startsWith("{")) {
		return JSON.parse(str)
	}
	const fields = str.split(/:/)
	
	if(fields[0] == '' || fields.length < 3) return;
	return {
		id: fields[0].trim(),
		hash: fields[1].trim(),
		author: fields[2].trim()
	}
}

function init() {

	const data = document.getElementById("answerdata");
	if(!data) { return;}

	const el = document.getElementById("container")
	if(!el) return
	
	const rows = data.innerText.split(/\r?\n/);

	for(let i=0; i < rows.length; i++) {
		const dval = parsedatarow(rows[i])
		if(!dval) continue

		answerdata_hashes[dval.id] = dval.hash
		if(dval.hasOwnProperty('unlock')) {
			if(dval.unlock) {
				unlockdata[dval.id] = dval.unlock
			}
		}

		el.insertAdjacentHTML('beforeend', 
					puzzleFormTemplate.replaceAll('PUZZLEID', dval.id)
						.replaceAll('DAYNUM', parseInt(dval.id))
						.replaceAll('AUTHOR', dval.author))
	}

	el.insertAdjacentHTML('beforeend', puzzleResetTemplate)	
	
	preventFormSubmit()
	updateTornEdges()
	restoreFromState()	
}

// https://github.com/bradyjoslin/webcrypto-example
// for large strings, use this from https://stackoverflow.com/a/49124600

const buff_to_base64 = (buff) => btoa(
  new Uint8Array(buff).reduce(
    (data, byte) => data + String.fromCharCode(byte), ''
  )
);

const base64_to_buf = (b64) =>
  Uint8Array.from(atob(b64), (c) => c.charCodeAt(null));

const enc = new TextEncoder();
const dec = new TextDecoder();

const getPasswordKey = (password) =>
  window.crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, [
    "deriveKey",
  ]);

const deriveKey = (passwordKey, salt, keyUsage) =>
  window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 250000,
      hash: "SHA-256",
    },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    false,
    keyUsage
  );

async function encryptData(secretData, password) {
  try {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const passwordKey = await getPasswordKey(password);
    const aesKey = await deriveKey(passwordKey, salt, ["encrypt"]);
    const encryptedContent = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      aesKey,
      enc.encode(secretData)
    );

    const encryptedContentArr = new Uint8Array(encryptedContent);
    let buff = new Uint8Array(
      salt.byteLength + iv.byteLength + encryptedContentArr.byteLength
    );
    buff.set(salt, 0);
    buff.set(iv, salt.byteLength);
    buff.set(encryptedContentArr, salt.byteLength + iv.byteLength);
    const base64Buff = buff_to_base64(buff);
    return base64Buff;
  } catch (e) {
    console.log(`Error - ${e}`);
    return "";
  }
}

async function decryptData(encryptedData, password) {
	console.log(`decryptData ${password}`)
  try {
    const encryptedDataBuff = base64_to_buf(encryptedData);
    const salt = encryptedDataBuff.slice(0, 16);
    const iv = encryptedDataBuff.slice(16, 16 + 12);
    const data = encryptedDataBuff.slice(16 + 12);
    const passwordKey = await getPasswordKey(password);
    const aesKey = await deriveKey(passwordKey, salt, ["decrypt"]);
    const decryptedContent = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      aesKey,
      data
    );
    return dec.decode(decryptedContent);
  } catch (e) {
    console.log(`Error - ${e}`);
    return "";
  }
}
