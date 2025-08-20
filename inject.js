(() => {
  if (typeof window.cspMeta === 'undefined') {
    window.cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (window.cspMeta) {
      chrome.runtime.sendMessage({ cspMetaDetected: true });
    }
  }

  let lastSelected = "";

  window.addEventListener("mouseup", () => {
    const selection = window.getSelection();
    lastSelected = selection ? selection.toString().trim() : "";
  });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.textRequest) {
      let responseText = lastSelected.length > 0 ? lastSelected : "_TextNotSelected_";
      sendResponse({ swor: responseText });
    }
    return true;
  });

  window.removeEventListener("play-word-meaning", handleWordMeaning);
  window.addEventListener("play-word-meaning", handleWordMeaning);

  async function handleWordMeaning(e) {
    const selectedText = e.detail || lastSelected;
    if (!selectedText || !/^[a-zA-Z]+$/.test(selectedText)) return;

    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${selectedText}`);
      const data = await res.json();
       const definition = data[0]?.meanings[0]?.definitions[0]?.definition || "Meaning not found";
       const phoneticText = data[0]?.phonetic || "";

      let oldPopup = document.querySelector('.word-meaning-popup');
      while (oldPopup) {
        oldPopup.remove();
        oldPopup = document.querySelector('.word-meaning-popup');
      }

      const popup = document.createElement('div');
      popup.className = 'word-meaning-popup';
      Object.assign(popup.style, {
        position: 'absolute',
        background: '#fff',
        border: '1px solid #aaa',
        padding: '10px',
        zIndex: 99999,
        maxWidth: '300px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
        borderRadius: '8px',
        fontFamily: 'sans-serif',
        visibility: 'hidden'
      });

      const closeBtn = document.createElement('span');
      closeBtn.textContent = '❌';
      Object.assign(closeBtn.style, {
        float: 'right',
        cursor: 'pointer',
        fontSize: '14px',
        marginBottom: '5px',
      });
      closeBtn.onclick = () => popup.remove();
      popup.appendChild(closeBtn);

      const wordElement = document.createElement('div');
      wordElement.innerHTML = `<strong>${selectedText}</strong>`;
      popup.appendChild(wordElement);

      const pronunciationElement = document.createElement('div');
      pronunciationElement.style.marginTop = '5px';
      pronunciationElement.style.fontSize = '14px';
      pronunciationElement.style.color = '#555';

      if (phoneticText) {
        pronunciationElement.textContent = `Pronunciation: ${phoneticText}`;
      }

      const audioIcon = document.createElement('span');
      audioIcon.textContent = ' 🔊';
      audioIcon.style.cursor = 'pointer';
      audioIcon.style.marginLeft = '8px';
      audioIcon.title = "Play Pronunciation";

      audioIcon.onclick = () => {
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(selectedText);
          utterance.lang = 'en-IN';
          window.speechSynthesis.speak(utterance);
        } else {
          console.warn('Text-to-Speech not supported');
        }
      };
      pronunciationElement.appendChild(audioIcon);
      popup.appendChild(pronunciationElement);

      const meaningElement = document.createElement('div');
      meaningElement.textContent = definition;
      meaningElement.style.marginTop = '10px';
      popup.appendChild(meaningElement);

      document.body.appendChild(popup);

      const selection = window.getSelection();
      let rect = null;
      if (selection.rangeCount > 0) {
        rect = selection.getRangeAt(0).getBoundingClientRect();
      }

      if (rect) {
        const popupRect = popup.getBoundingClientRect();

        let popupX = rect.left + window.scrollX + rect.width / 2 - popupRect.width / 2;
        let popupY = rect.top + window.scrollY - popupRect.height - 8;

        if (popupY < window.scrollY) {
          popupY = rect.bottom + window.scrollY + 8;
        }
        if (popupX < 0) popupX = 5;
        if (popupX + popupRect.width > window.innerWidth) {
          popupX = window.innerWidth - popupRect.width - 5;
        }

        popup.style.left = `${popupX}px`;
        popup.style.top = `${popupY}px`;
      } else {
        popup.style.top = '100px';
        popup.style.left = '100px';
      }

      popup.style.visibility = 'visible';

      setTimeout(() => {
        function outsideClickListener(event) {
          if (!popup.contains(event.target)) {
            popup.remove();
            document.removeEventListener("click", outsideClickListener);
          }
        }
        document.addEventListener("click", outsideClickListener);
      }, 0);

    } catch (err) {
      console.error("Error fetching definition:", err);
    }
  }
})();
