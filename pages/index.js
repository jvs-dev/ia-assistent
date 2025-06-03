import { useState, useRef, useEffect } from 'react';
import { styled } from 'styled-components';

const Container = styled.div`
  max-width: 480px;
  margin: 40px auto;
  background: #121212;
  padding: 30px 25px;
  border-radius: 12px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
  color: #e0e0e0;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
`;

const Title = styled.h1`
  text-align: center;
  font-weight: 900;
  margin-bottom: 24px;
  color: #61dafb;
  text-shadow: 0 0 8px #61dafb;
`;

const Button = styled.button`
  display: block;
  margin: 0 auto 24px auto;
  padding: 14px 36px;
  font-size: 18px;
  font-weight: 700;
  color: #121212;
  background-color: #61dafb;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  box-shadow: 0 4px 12px #61dafbaa;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #21a1f1;
  }

  &:active {
    background-color: #1781c7;
  }
`;

const ModeText = styled.p`
  font-size: 16px;
  text-align: center;
  font-weight: 600;
  color: ${({ mode }) => (mode === 'wakeword' ? '#7fffd4' : '#ffa500')};
  text-transform: uppercase;
  letter-spacing: 2px;
  user-select: none;
`;

const StatusMessage = styled.p`
  font-style: italic;
  text-align: center;
  margin-top: 16px;
  color: #ccc;
  min-height: 24px;
`;

export default function Home() {
    const [isListening, setIsListening] = useState(false);
    const [mode, setMode] = useState('wakeword');
    const [status, setStatus] = useState('');
    const recognitionRef = useRef(null);
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('Seu navegador não suporta Web Speech API.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.lang = 'pt-BR';

        recognition.onresult = async (event) => {
            const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
            console.log('Reconhecido:', transcript, '\\Modo:', mode);

            if (mode === 'wakeword' && transcript.includes('jarvis')) {
                setMode('command');
                setStatus('Pode falar');
                new Audio('/ativado.mp3').play();
                speak('Pode falar');
            } else if (mode === 'command') {
                setStatus('Processando...');
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: transcript }),
                });
                const data = await response.json();
                if (`${data.response}`.includes('music=')) {
                    console.log(data.response);
                    const musicLink = `${data.response}`.replace('music=', '').trim();
                    console.log(musicLink);
                    window.open(musicLink, '_blank');
                }
                speak(data.response);
                setMode('wakeword');
                new Audio('/espera.mp3').play();
                setStatus('Modo espera ativado');
            }
        };

        recognitionRef.current = recognition;

        if (isListening) recognition.start();
        else recognition.stop();

        return () => {
            recognition.stop();
        };
    }, [isListening, mode]);

    useEffect(() => {
        speechSynthesis.getVoices().forEach(voice => {
            console.log(`Nome: ${voice.name} | Idioma: ${voice.lang} | Masculina: ${voice.name.toLowerCase().includes('male') || voice.name.toLowerCase().includes('daniel')}`);
        });

        // Garante que as vozes sejam carregadas
        window.speechSynthesis.onvoiceschanged = () => {
            window.speechSynthesis.getVoices();
        };
    }, []);

    console

    const speak = (text) => {
        if (!synth) return;

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';

        const voices = window.speechSynthesis.getVoices();

        // Escolhe uma voz em português que pareça mais natural
        const voice = voices.find(v =>
            v.lang.startsWith('pt') && v.name.toLowerCase().includes('Google português do Brasil') // ou 'brasil', 'female', etc
        );

        if (voice) {
            utterance.voice = voice;
        }

        synth.speak(utterance);
    };


    const toggleListening = () => {
        setStatus('');
        setIsListening(!isListening);
    };

    return (
        <Container>
            <Title>Assistente Pessoal</Title>
            <Button onClick={toggleListening}>
                {isListening ? 'Desativar escuta' : 'Ativar escuta'}
            </Button>
            <ModeText mode={mode}>Modo: {mode}</ModeText>
            <StatusMessage>{status}</StatusMessage>
        </Container>
    );
}
