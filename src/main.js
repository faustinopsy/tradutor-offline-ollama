import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { pipeline } from '@xenova/transformers';
import fs from 'node:fs/promises';
import { tmpdir } from 'node:os';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';

ffmpeg.setFfmpegPath(ffmpegPath.path.replace('app.asar', 'app.asar.unpacked'));

let transcriber = null;

if (started) {
  app.quit();
}

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  //mainWindow.webContents.openDevTools();
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('translate-text', async (event, textToTranslate) => {
  console.log(`Texto recebido para tradução: "${textToTranslate}"`);

  const prompt = `Você é um tradutor expert. Traduza o seguinte texto de português para inglês, sem adicionar nenhum comentário ou explicação, apenas o texto traduzido:\n\n"${textToTranslate}"`;

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
    });

    if (!response.ok) {
      throw new Error(`Erro na API do Ollama: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Resposta recebida do Ollama:', data.response);
    
    return data.response.trim();
  } catch (error) {
    console.error('Falha ao comunicar com o Ollama:', error);
    return `Erro ao traduzir: ${error.message}`;
  }
});

async function getTranscriber() {
  if (transcriber === null) {
    console.log('Carregando o modelo Whisper pela primeira vez...');
    transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-base');
    console.log('Modelo carregado com sucesso.');
  }
  return transcriber;
}

ipcMain.handle('transcribe-audio', async (event, audioBuffer) => {
  const transcriber = await getTranscriber();

  const tempInputPath = path.join(tmpdir(), `temp-audio-${Date.now()}.webm`);
  const tempOutputPath = path.join(tmpdir(), `temp-audio-raw-${Date.now()}.pcm`);

  try {
    // Escreve o áudio comprimido (WebM) recebido do renderer em um arquivo
    await fs.writeFile(tempInputPath, Buffer.from(audioBuffer));

    console.log('Iniciando decodificação do áudio...');
    // Função que decodifica o áudio usando ffmpeg
    await new Promise((resolve, reject) => {
      ffmpeg(tempInputPath)
        .outputOptions([
          '-ar 16000',      // Taxa de amostragem: 16kHz
          '-ac 1',          // Canais de áudio: 1 (mono)
          '-f s16le',       // Formato de saída: PCM 16-bit little-endian (formato padrão)
        ])
        .save(tempOutputPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(err));
    });
    console.log('Decodificação concluída.');

    // Lê os dados de áudio brutos (raw) do arquivo decodificado
    const rawAudioBuffer = await fs.readFile(tempOutputPath);

    // O modelo Whisper do Transformers.js espera um Float32Array.
    // Primeiro, criamos um Int16Array a partir do buffer PCM de 16-bit.
    const audioInt16 = new Int16Array(rawAudioBuffer.buffer);
    // Em seguida, normalizamos para o intervalo de -1.0 a 1.0 em um Float32Array.
    const audioData = new Float32Array(audioInt16.length);
    for (let i = 0; i < audioInt16.length; i++) {
      audioData[i] = audioInt16[i] / 32768.0;
    }

    console.log('Iniciando a transcrição...');
    const output = await transcriber(audioData, {
      chunk_length_s: 30,
      stride_length_s: 5,
    });

    console.log('Transcrição concluída:', output.text);
    return output.text;

  } catch (error) {
    console.error('Erro no pipeline de áudio:', error);
    return `Erro: ${error.message}`;
  } finally {
    // Limpa os arquivos temporários, independentemente do sucesso ou falha
    await fs.unlink(tempInputPath).catch(e => console.error("Falha ao limpar arquivo de entrada:", e));
    await fs.unlink(tempOutputPath).catch(e => console.error("Falha ao limpar arquivo de saída:", e));
  }
});