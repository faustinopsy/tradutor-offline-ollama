import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electron', {
  api: {
    translate: (text) => ipcRenderer.invoke('translate-text', text),
    transcribeAudio: (audioBuffer) => ipcRenderer.invoke('transcribe-audio', audioBuffer),
  }
})