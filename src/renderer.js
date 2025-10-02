const input = document.getElementById('inputText')
const btnTraduzir = document.getElementById('btnTraduzir')
const resultado = document.getElementById('resultado')

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