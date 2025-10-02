const input = document.getElementById('inputText')
const btnTraduzir = document.getElementById('btnTraduzir')
const resultado = document.getElementById('resultado')
const recordBtn = document.getElementById('recordBtn')
const stopBtn = document.getElementById('stopBtn')
const statusElem = document.getElementById('status')
let mediaRecorder = null
let audioChunks = []
btnTraduzir.addEventListener('click', async () => {
  const textToTranslate = input.value

  if (!textToTranslate.trim()) return
  btnTraduzir.disabled = true
  btnTraduzir.textContent = 'Traduzindo...'
  resultado.textContent = '...'

  try {
    const result = await window.electron.api.translate(textToTranslate)
    resultado.textContent = result
  } catch (error) {
    resultado.textContent = `Erro ao traduzir: ${error.message}`
  } finally {
    btnTraduzir.disabled = false
    btnTraduzir.textContent = 'Traduzir'
  }
})

recordBtn.addEventListener('click', async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    
    mediaRecorder = new MediaRecorder(stream)
    audioChunks = []

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data)
    }

    mediaRecorder.onstop = async () => {
      statusElem.textContent = 'Processando áudio...'
      
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
      
      const audioBuffer = await audioBlob.arrayBuffer()

      const transcribedText = await window.electron.api.transcribeAudio(audioBuffer)
      
      inputTextElem.value = transcribedText
      statusElem.textContent = 'Texto transcrito! Clique em "Traduzir".'
    }
    
    mediaRecorder.start()
    statusElem.textContent = 'Gravando... Fale agora.'
    recordBtn.disabled = true
    stopBtn.disabled = false
    
  } catch (error) {
    console.error('Erro ao iniciar gravação:', error)
    statusElem.textContent = `Erro: ${error.message}`
  }
});

stopBtn.addEventListener('click', () => {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop()
    statusElem.textContent = 'Gravação parada. Aguarde...'
    recordBtn.disabled = false
    stopBtn.disabled = true
  }
});