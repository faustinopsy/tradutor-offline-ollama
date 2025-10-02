import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

import { ipcMain } from 'electron'

ipcMain.handle('translate-text', async (event, textToTranslate) => {
  console.log(`Texto recebido para tradução: "${textToTranslate}"`)

  const prompt = `Você é um tradutor expert. Traduza o seguinte texto de português para inglês, sem adicionar nenhum comentário ou explicação, apenas o texto traduzido:\n\n"${textToTranslate}"`

  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3:8b-instruct-q4_K_M',
        prompt: prompt,
        stream: false,
      }),
    })

    if (!response.ok) {
      throw new Error(`Erro na API do Ollama: ${response.statusText}`)
    }

    const data = await response.json()
    console.log('Resposta recebida do Ollama:', data.response)
    
    return data.response.trim()

  } catch (error) {
    console.error('Falha ao comunicar com o Ollama:', error)
    return `Erro ao traduzir: ${error.message}`
  }
})