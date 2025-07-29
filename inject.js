(() =>{
const pscript = document.createElement('script');
pscript.src = 'https://js.puter.com/v2/';
document.head.appendChild(pscript);

window.addEventListener("play-word-meaning", async (e) => {
  const selectedText = e.detail;
  if (!selectedText || !/^[a-zA-Z]+$/.test(selectedText)) return;

  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${selectedText}`);
    const data = await res.json();
    const definition = data[0]?.meanings[0]?.definitions[0]?.definition || "Meaning not found";
    const phoneticText = data[0]?.phonetic || "";

    const oldPopup = document.querySelector('.word-meaning-popup');
    if (oldPopup) oldPopup.remove();

    const popup = document.createElement('div');
    popup.className = 'word-meaning-popup';
    Object.assign(popup.style, {
      position: 'fixed',
      background: '#fff',
      border: '1px solid #aaa',
      padding: '10px',
      zIndex: 99999,
      maxWidth: '300px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
      borderRadius: '8px',
      top: '100px',
      left: '100px',
      fontFamily: 'sans-serif',
      cursor: 'move',
      userSelect: 'none',
    });

    // Make it draggable
    let isDragging = false;
    let offsetX, offsetY;

    popup.addEventListener('mousedown', (e) => {
      isDragging = true;
      offsetX = e.clientX - popup.offsetLeft;
      offsetY = e.clientY - popup.offsetTop;
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        popup.style.left = `${e.clientX - offsetX}px`;
        popup.style.top = `${e.clientY - offsetY}px`;
      }
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
    });

    // Close Button
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

    // Word Title
    const wordElement = document.createElement('div');
    wordElement.innerHTML = `<strong>${selectedText}</strong>`;

    // Pronunciation + Audio
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
    audioIcon.style.marginLeft = '5px';
    audioIcon.onclick = () => {
      if (window.puter?.ai?.txt2speech) {
        window.puter.ai.txt2speech(selectedText)
          .then(audio => audio.play())
          .catch(error => console.error('TTS error:', error));
      } else {
        alert("Error in ai");
        console.error("Puter SDK not loaded.");
      }
    };
    pronunciationElement.appendChild(audioIcon);

    // Meaning
    const meaningElement = document.createElement('div');
    meaningElement.textContent = definition;
    meaningElement.style.marginTop = '10px';

    popup.appendChild(wordElement);
    popup.appendChild(pronunciationElement);
    popup.appendChild(meaningElement);
    document.body.appendChild(popup);
  } catch (err) {
    console.error("Error fetching definition:", err);
  }
});

})();
