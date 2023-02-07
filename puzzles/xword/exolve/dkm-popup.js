let popupModal;

function doCloseModal() {
	if(popupModal) { 
		if(popupModal.style.display == "none") { return;	}
		popupModal.style.display = "none";
		window.getSelection().removeAllRanges();
	}
}

function showModal(title, msg) {
	// Get the modal
	if (!popupModal) {
		popupModal = document.getElementById("popupModal");
		
		if(popupModal) {
			popupModal.innerHTML = `
  <!-- Modal content -->
  <div class="modal-content">
    <div class="modal-header">
      <span class="modal-close">&times;</span>
      <h3 class="modal-title"></h3>
    </div>
    <div class="modal-body" onclick="selectall(this);">
    </div>
  </div>
`
;	

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
		var modalTitle = document.getElementsByClassName("modal-title");
		if(modalTitle) {
			modalTitle[0].innerHTML = title;
		}
		var modalBody = document.getElementsByClassName("modal-body");
		if(modalBody) {
			modalBody[0].innerHTML = msg;
			popupModal.style.display = "block";
		}
	}
}

function selectall(elem) {
	if (window.getSelection) {
    var range = document.createRange();
    range.selectNode(elem);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
  }
}