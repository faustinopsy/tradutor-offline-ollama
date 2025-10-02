import { pipeline } from '@xenova/transformers';
import { readFileSync } from 'fs';
import wavefile from 'wavefile';
const { WaveFile } = wavefile;

console.log('Carregando o modelo Whisper...');
const transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-base');
console.log('Modelo carregado.');

const buffer = readFileSync('ENG_M.wav');
const wav = new WaveFile(buffer);
wav.toBitDepth('32f'); 
wav.toSampleRate(16000); 

let audioData = wav.getSamples();
if (Array.isArray(audioData)) {
  audioData = audioData[0];
}

console.log('Iniciando a transcrição...');
const startTime = process.hrtime();
const output = await transcriber(audioData);
const endTime = process.hrtime(startTime);
console.log('Transcrição concluída:', output);
console.log(`Tempo de execução: ${endTime[0]}s ${endTime[1] / 1000000}ms`);