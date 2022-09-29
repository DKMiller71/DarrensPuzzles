function decryptStringWithXOR(input,key) {
  
  const utf8Encode = new TextEncoder();
	var c = utf8Encode.encode(window.atob(input));
	var kb = utf8Encode.encode(key);
	
 	for(var i=0; i<c.length; i++) {
		for(var r=0; r<kb.length; r++) {
			var k = r % kb.length;
		  c[i] = c[i] ^ kb[k];
	 	}
	}
  
	return (new TextDecoder()).decode(c);
}

let params = new URLSearchParams(document.location.search);
let query = params.get('key');

if(query && typeof(exolvedata) !== 'undefined') {
	
	let key = query instanceof Array ? query[0] : query;
	exdata = decryptStringWithXOR(exolvedata, key);
	
	if(exdata.match(/[^\s\x20-\x7E]/)) {
		// bad characters or key didn't match
	} else if(exdata.match(/exolve/)) {
		createExolve(exdata);		
	} 
}
