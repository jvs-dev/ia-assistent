import { useState, useRef, useEffect } from 'react';
import { styled, createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
@import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');
  body {
    margin: 0;
    min-height: 100vh;
    background-color: #1D1E23;
    font-family: "Poppins", sans-serif;
  }
  * {
    box-sizing: border-box;
    margin: '0px';
    padding: '0px';
  }
`;

const HomeSection = styled.section`
    width: 100%;
    min-height: 100vh;
    background: #1D1E23;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
`

const HomeHeader = styled.header`
    background: #181A1F;
    padding: 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;    

`

const Logo = styled.div`
display: flex;
align-items: flex-start;
flex-direction: column;
justify-content: flex-start;

`

const LogoTitle = styled.h1`
    font-weight: 700;
    margin: 0px;
    color: #fff;
    font-size: 26px;
`

const LogoBallsDiv = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
`

const LogoBalls = styled.div`
width: 12px;
height: 12px;
border-radius: 100%;
background: #CD2B4E;

`




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

            if (mode === 'wakeword' && transcript.includes('alexia')) {
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
        document.querySelector("body").style.margin = '0px';
        document.querySelector("body").style.minHeight = '100vh';
        speechSynthesis.getVoices().forEach(voice => {
            console.log(`Nome: ${voice.name} | Idioma: ${voice.lang} | Masculina: ${voice.name.toLowerCase().includes('male') || voice.name.toLowerCase().includes('daniel')}`);
        });

        // Garante que as vozes sejam carregadas
        window.speechSynthesis.onvoiceschanged = () => {
            window.speechSynthesis.getVoices();
        };
    }, []);

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

    /* <Container>
            <Title>Assistente Pessoal</Title>
            <Button onClick={toggleListening}>
                {isListening ? 'Desativar escuta' : 'Ativar escuta'}
            </Button>
            <ModeText mode={mode}>Modo: {mode}</ModeText>
            <StatusMessage>{status}</StatusMessage>
        </Container> */
 
    return (
        <>
            <GlobalStyle />
            <HomeSection>
                <HomeHeader>
                    <Logo>
                        <LogoTitle>Alex.IA</LogoTitle>
                        <LogoBallsDiv>
                            <LogoBalls></LogoBalls>
                            <LogoBalls></LogoBalls>
                            <LogoBalls></LogoBalls>
                        </LogoBallsDiv>
                    </Logo>
                </HomeHeader>
            </HomeSection>
        </>
    );
}
