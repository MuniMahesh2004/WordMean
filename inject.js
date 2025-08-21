(() => {
  if (typeof window.cspMeta === 'undefined') {
    window.cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (window.cspMeta) {
      chrome.runtime.sendMessage({ cspMetaDetected: true });
    }
  }

  let lastSelected = "";
  let miniBubble = null;

  function removeMiniBubble() {
    if (miniBubble) {
      miniBubble.remove();
      const t = document.querySelector('.define-popup-triangle');
      if (t) t.remove();
      miniBubble = null;
    }
  }

  window.addEventListener("mouseup", () => {
    setTimeout(() => {
      const selection = window.getSelection();
      lastSelected = selection ? selection.toString().trim() : "";

      removeMiniBubble();

      if (!lastSelected || !/^[a-zA-Z]+$/.test(lastSelected)) return;

      miniBubble = document.createElement('div');
      miniBubble.textContent = "Define";

      Object.assign(miniBubble.style, {
        position: 'absolute',
        background: '#fff',
        borderRadius: '14px',
        padding: '10px 20px 9px 20px',
        boxShadow: '0 3px 8px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.08)',
        fontSize: '17px',
        fontFamily: 'Segoe UI, Arial, sans-serif',
        color: '#222',
        cursor: 'pointer',
        userSelect: 'none',
        zIndex: 2147483647,
      });

      let rect = null;
      if (selection.rangeCount > 0) {
        rect = selection.getRangeAt(0).getBoundingClientRect();
      }
      if (!rect) return;

      let left = rect.left + window.scrollX + (rect.width / 2) - 30;
      let top = rect.bottom + window.scrollY + 8;

      let isAbove = false;
      if (top + 40 > window.scrollY + window.innerHeight) {
        top = rect.top + window.scrollY - 40;
        isAbove = true;
      }

      miniBubble.style.left = `${Math.max(left, 4)}px`;
      miniBubble.style.top = `${top}px`;

      document.body.appendChild(miniBubble);

      // Triangle for Define bubble
      const triangle = document.createElement('div');
      triangle.className = 'define-popup-triangle';
      Object.assign(triangle.style, {
        position: 'absolute',
        width: '0',
        height: '0',
        borderLeft: '10px solid transparent',
        borderRight: '10px solid transparent',
        zIndex: 2147483647,
        left: `${left + 30 - 10}px`, // centered under bubble
      });
 
      if (isAbove) {
        triangle.style.borderTop = '10px solid #fff';
        triangle.style.top = `${top + miniBubble.getBoundingClientRect().height}px`;
        triangle.style.filter = 'drop-shadow(0 2px 3px rgba(0,0,0,0.3))';
       
      } else {
        triangle.style.borderBottom = '10px solid #fff';
        triangle.style.top = `${top - 10}px`;
        triangle.style.filter = 'drop-shadow(0 -2px 2px rgba(0,0,0,0.3))';
       
      }

      document.body.appendChild(triangle);

      miniBubble.onclick = (event) => {
        event.stopPropagation();
        const bubbleRect = miniBubble.getBoundingClientRect();
        removeMiniBubble();
        window.dispatchEvent(new CustomEvent("play-word-meaning", {
          detail: { word: lastSelected, bubbleRect }
        }));
        window.getSelection().removeAllRanges();
      };

      function outsideClickListener(event) {
        if (miniBubble && !miniBubble.contains(event.target)) {
          removeMiniBubble();
          document.removeEventListener("click", outsideClickListener);
        }
      }
      setTimeout(() => {
        document.addEventListener("click", outsideClickListener);
      }, 0);
    }, 5);
  });

  // (Definition popup code unchanged below…)

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
    const selectedText = e.detail.word;
    const bubbleRect = e.detail.bubbleRect;

    if (!selectedText || !/^[a-zA-Z]+$/.test(selectedText)) return;

    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${selectedText}`);
      const data = await res.json();
      const definition = data[0]?.meanings[0]?.definitions[0]?.definition || "Meaning not found";
       const phoneticText = data[0]?.phonetic || "";

      document.querySelectorAll('.word-meaning-popup').forEach(p => p.remove());
      document.querySelectorAll('.definition-popup-triangle').forEach(t => t.remove());

      const popup = document.createElement('div');
      popup.className = 'word-meaning-popup';

      Object.assign(popup.style, {
        position: 'absolute',
        background: '#fff',
        borderRadius: '16px',
        boxShadow: '0 3px 8px rgba(0,0,0,0.19), 0 0 0 1.5px rgba(0,0,0,0.09)',
        padding: '20px 24px 17px 23px',
        fontFamily: 'Segoe UI, Arial, sans-serif',
        fontSize: '16px',
        color: '#1A1A1A',
        zIndex: 2147483647,
        minWidth: '300px',
        maxWidth: '355px',
        cursor: 'default',
      });

      const closeBtn = document.createElement('span');
      closeBtn.textContent = '❌';
      Object.assign(closeBtn.style, {
        position: 'absolute',
        top: '10px',
        right: '14px',
        fontSize: '17px',
        color: '#888',
        cursor: 'pointer',
      });
      closeBtn.onclick = () => {
        popup.remove();
        const t = document.querySelector('.definition-popup-triangle');
        if (t) t.remove();
      };
      popup.appendChild(closeBtn);

      const wordElement = document.createElement('div');
      wordElement.innerHTML = `<strong>${selectedText}</strong>`;
      wordElement.style.textAlign = 'center';
      popup.appendChild(wordElement);

      const pronunciationElement = document.createElement('div');
      pronunciationElement.style.marginTop = '5px';
      pronunciationElement.style.color = '#555';
      if (phoneticText) pronunciationElement.textContent = `Pronunciation: ${phoneticText}`;

      const audioIcon = document.createElement('span');
      audioIcon.textContent = ' 🔊';
      audioIcon.style.cursor = 'pointer';
      audioIcon.style.marginLeft = '8px';
      audioIcon.onclick = () => {
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(selectedText);
          utterance.lang = 'en-IN';
          window.speechSynthesis.speak(utterance);
        }
      };
      pronunciationElement.appendChild(audioIcon);
      popup.appendChild(pronunciationElement);

      const meaningElement = document.createElement('div');
      meaningElement.textContent = definition;
      meaningElement.style.marginTop = '10px';
      popup.appendChild(meaningElement);

      document.body.appendChild(popup);
      popup.style.visibility = 'hidden';

      const popupRect = popup.getBoundingClientRect();

      let popupX = bubbleRect.left + window.scrollX + (bubbleRect.width / 2) - (popupRect.width / 2);
      let popupY = bubbleRect.bottom + window.scrollY - 45;

      let isAbove = false;
      if (popupY + popupRect.height > window.scrollY + window.innerHeight) {
        popupY = bubbleRect.top + window.scrollY - popupRect.height - 40;
        isAbove = true;
      }

      if (popupX < 5) popupX = 5;
      if (popupX + popupRect.width > window.innerWidth) {
        popupX = window.innerWidth - popupRect.width - 5;
      }

      popup.style.left = `${popupX}px`;
      popup.style.top = `${popupY}px`;
      popup.style.visibility = 'visible';

      // Add friendly "chat-bubble" style triangle
      const triangle = document.createElement('div');
      triangle.className = 'definition-popup-triangle';
      Object.assign(triangle.style, {
        position: 'absolute',
        width: '0',
        height: '0',
        borderLeft: '12px solid transparent',
        borderRight: '12px solid transparent',
        zIndex: 2147483647,
        left: `${popupX + popupRect.width / 2 - 10}px`,
        // filter: 'drop-shadow(0 -2px 3px rgba(0,0,0, 0.19))', // Same as popup shadow
      });

      if (isAbove) {
        triangle.style.borderTop = '12px solid #fff';
        triangle.style.top = `${popupY + popupRect.height}px`;
        triangle.style.filter = 'drop-shadow(0 2px 3px rgba(0,0,0,0.5))'; // shadow goes downward
      } else {
        triangle.style.borderBottom = '12px solid #fff';
        triangle.style.top = `${popupY - 12}px`;
        triangle.style.filter = 'drop-shadow(0 -2px 2px rgba(0,0,0,0.3))'; // shadow goes upward
      }

      triangle.style.left = `${popupX + popupRect.width / 2 - 12}px`;

      document.body.appendChild(triangle);

      setTimeout(() => {
        function outsideClickListener(event) {
          if (!popup.contains(event.target)) {
            popup.remove();
            triangle.remove();
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
