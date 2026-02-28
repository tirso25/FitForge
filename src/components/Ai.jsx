import { useEffect, useRef, useState } from "react";
import "../styles/ai.css";
import { apiFetch } from "../utils/api";

export default function AI() {
    const chatMessagesRef = useRef(null);
    const messageInputRef = useRef(null);
    const sendButtonRef = useRef(null);
    const micButtonRef = useRef(null);
    const clearButtonRef = useRef(null);

    const [recognition, setRecognition] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [messages, setMessages] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [statusText, setStatusText] = useState('🟢 Conectado');
    const [statusClass, setStatusClass] = useState('online');
    const [isDisabled, setIsDisabled] = useState(false);

    const goToProfile = () => {
        const navigate = useNavigate(); // This won't work inside the component if not imported
        // Wait, I need to use useNavigate correctly.
    };

    // System prompt is now handled by the backend
    // The previous frontend calculation of metrics is also handled backward-compatibly, however we keep the definitions just in case it's needed for other parts.

    useEffect(() => {
        adjustTextareaHeight();
        if (messageInputRef.current) {
            messageInputRef.current.focus();
        }
        loadChatHistory();
    }, []);

    const loadChatHistory = async () => {
        try {
            const token = localStorage.getItem('token') || '';

            const response = await apiFetch(`/api/chatbot/history`);

            if (response.ok) {
                const data = await response.json();
                if (data.history && data.history.length > 0) {
                    const mappedMessages = data.history.map(msg => ({
                        content: msg.content.replace(/\n/g, '<br>'),
                        isUser: msg.role === 'user'
                    }));
                    setMessages(mappedMessages);

                    // Scroll to bottom after load
                    setTimeout(() => {
                        if (chatMessagesRef.current) {
                            chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
                        }
                    }, 100);
                }
            }
            if (response.status === 401) {
                addMessage('Your session has expired. Please log in again.');
            }
        } catch (error) {
            console.error('Error loading history:', error);
        }
    };

    useEffect(() => {
        adjustTextareaHeight();
    }, [inputValue]);

    const adjustTextareaHeight = () => {
        if (messageInputRef.current) {
            const textarea = messageInputRef.current;
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
        }
    };

    const addMessage = (content, isUser = false) => {
        const newMessage = {
            content: content.replace(/\n/g, '<br>'),
            isUser
        };
        setMessages(prev => [...prev, newMessage]);

        setTimeout(() => {
            if (chatMessagesRef.current) {
                chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
            }
        }, 10);
    };

    const showTyping = () => {
        setIsTyping(true);
        setTimeout(() => {
            if (chatMessagesRef.current) {
                chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
            }
        }, 10);
    };

    const hideTyping = () => {
        setIsTyping(false);
    };

    const updateStatus = (message, type = 'online') => {
        setStatusText(message);
        setStatusClass(type);
    };

    const extractMetrics = (text) => {
        const metrics = {};
        const lowerText = text.toLowerCase();

        const weightMatch = lowerText.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilos?)/);
        if (weightMatch) {
            const weight = parseFloat(weightMatch[1]);
            if (weight >= 30 && weight <= 200) {
                metrics.peso = weight;
            }
        }

        const heightPatterns = [
            /mido\s+(\d\.\d{2})/,
            /(\d{3})\s*cm/,
            /mido\s+(\d{3})/
        ];

        for (const pattern of heightPatterns) {
            const match = lowerText.match(pattern);
            if (match) {
                let height = match[1];
                if (height.includes('.')) {
                    height = parseInt(parseFloat(height) * 100);
                } else {
                    height = parseInt(height);
                }
                if (height >= 140 && height <= 220) {
                    metrics.altura = height;
                    break;
                }
            }
        }

        const agePatterns = [
            /(\d+)\s+años/,
            /edad\s+(\d+)/,
            /tengo\s+(\d+)/
        ];

        for (const pattern of agePatterns) {
            const match = lowerText.match(pattern);
            if (match) {
                const age = parseInt(match[1]);
                if (age >= 16 && age <= 70) {
                    metrics.edad = age;
                    break;
                }
            }
        }

        return metrics;
    };

    const calculateFitnessMetrics = (peso, altura, edad) => {
        try {
            const alturaM = altura / 100;
            const imc = peso / (alturaM * alturaM);

            let categoria;
            if (imc < 18.5) categoria = 'Underweight';
            else if (imc < 25) categoria = 'Normal weight';
            else if (imc < 30) categoria = 'Overweight';
            else categoria = 'Obesity';

            const tmb = (10 * peso) + (6.25 * altura) - (5 * edad) + 5;
            const proteina = Math.round(peso * 1.8);

            return `\n\n📊 <strong>YOUR PERSONALIZED ANALYSIS:</strong>\n• <strong>BMI:</strong> ${imc.toFixed(1)} (${categoria})\n• <strong>Basal Metabolism:</strong> ${Math.round(tmb)} cal/day\n• <strong>Maintenance:</strong> ${Math.round(tmb * 1.55)} cal/day\n• <strong>Fat Loss:</strong> ${Math.round(tmb * 1.2)} cal/day\n• <strong>Muscle Gain:</strong> ${Math.round(tmb * 1.8)} cal/day\n• <strong>Daily Protein:</strong> ${proteina}g/day\n\n`;
        } catch (error) {
            return '';
        }
    };

    const sendMessage = async () => {
        const message = inputValue.trim();
        if (!message || isDisabled) return;

        setIsDisabled(true);
        addMessage(message, true);
        setInputValue('');

        showTyping();

        try {
            updateStatus('🤖 Thinking...', 'thinking');

            const token = localStorage.getItem('token') || '';

            const response = await apiFetch(`/api/chatbot/message`, {
                method: 'POST',
                body: JSON.stringify({ message })
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Your session has expired. Please log in again.');
                }
                throw new Error('Server response error');
            }

            const data = await response.json();

            hideTyping();

            if (data.response) {
                addMessage(data.response);
            } else {
                addMessage(getFallbackResponse(message));
            }

            updateStatus('🟢 Conectado', 'online');

        } catch (error) {
            hideTyping();
            addMessage('❌ Server connection error. Could you try again?');
            updateStatus('❌ Error', 'error');
        } finally {
            setIsDisabled(false);
            messageInputRef.current?.focus();

            setTimeout(() => {
                if (statusText.includes('Error')) {
                    updateStatus('🟢 Connected', 'online');
                }
            }, 3000);
        }
    };

    const handleKeyPress = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    };

    const sendExample = (text) => {
        setInputValue(text);
        setTimeout(() => sendMessage(), 10);
    };

    const sendAnalysis = async () => {
        try {
            const response = await apiFetch('/api/users/update');
            if (!response.ok) return;
            const { weight, height, age, gender } = await response.json();
            if (!weight || !height || !age || !gender) return;
            const genderLabel = gender === 'M' ? 'hombre' : 'mujer';
            sendExample(`Peso ${weight}kg, altura ${height}cm, edad ${age} años, soy ${genderLabel}. Dame mi análisis fitness personalizado completo.`);
        } catch (error) {
            console.error('Error fetching profile for analysis:', error);
        }
    };

    const toggleMicrophone = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            updateStatus('❌ Microphone not supported', 'error');
            return;
        }

        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    const startRecording = () => {
        try {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const newRecognition = new SpeechRecognition();

            newRecognition.lang = 'es-ES';
            newRecognition.continuous = false;
            newRecognition.interimResults = false;

            newRecognition.onstart = () => {
                setIsRecording(true);
                updateStatus('🎤 Recording...', 'thinking');
            };

            newRecognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setInputValue(transcript);
            };

            newRecognition.onerror = () => {
                stopRecording();
                updateStatus('❌ Microphone error', 'error');
                setTimeout(() => updateStatus('🟢 Connected', 'online'), 2000);
            };

            newRecognition.onend = () => {
                stopRecording();
            };

            setRecognition(newRecognition);
            newRecognition.start();
        } catch {
            updateStatus('❌ Microphone error', 'error');
            setTimeout(() => updateStatus('🟢 Connected', 'online'), 2000);
        }
    };

    const stopRecording = () => {
        if (recognition) {
            recognition.stop();
            setRecognition(null);
        }

        setIsRecording(false);
        updateStatus('🟢 Conectado', 'online');
    };

    const clearChat = () => {
        setMessages([]);
        messageInputRef.current?.focus();
        // Nota: Esto solo limpia el estado local frontend. Para limpiarlo de DB haría falta un un nuevo endpoint DELETE.
    };

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
    };

    return (
        <div className="ai-trainer-container">
            <div className={`status ${statusClass}`}>
                {statusText}
            </div>

            <div className="container">
                <div className="header">
                    <h1>🏋️‍♂️ AI Personal Trainer</h1>
                </div>

                <div className="chat-messages" id="chatMessages" ref={chatMessagesRef}>
                    <div className="message bot welcome-message">
                        Hi! 💪 I'm your AI personal trainer.<br /><br />
                        <strong>How can I help you today?</strong><br /><br />
                        <em>💡 Tip: Mention your weight, height and age for personalized advice</em>
                    </div>

                    {messages.map((message, index) => (
                        <div
                            key={index}
                            className={`message ${message.isUser ? 'user' : 'bot'}`}
                            dangerouslySetInnerHTML={{ __html: message.content }}
                        />
                    ))}

                    <div className="typing-indicator" id="typingIndicator" style={{ display: isTyping ? 'block' : 'none' }}>
                        <div className="typing-dots">
                            <div className="typing-dot"></div>
                            <div className="typing-dot"></div>
                            <div className="typing-dot"></div>
                        </div>
                    </div>
                </div>

                <div className="input-section">
                    <div className="examples">
                        <div className="examples-title">💡 Examples:</div>
                        <div className="example-pills">
                            <div className="example-pill" onClick={sendAnalysis}>📊 My analysis</div>
                            <div className="example-pill" onClick={() => sendExample('3 day beginner routine')}>📋 Routine</div>
                            <div className="example-pill" onClick={() => sendExample('What to eat before training?')}>🥗 Nutrition</div>
                            <div className="example-pill" onClick={() => sendExample('I am demotivated')}>💪 Motivation</div>
                        </div>
                    </div>

                    {/* NUEVA ESTRUCTURA: Textarea y botones en la misma fila */}
                    <div className="input-row">
                        <textarea
                            className="message-input"
                            id="messageInput"
                            placeholder="Ask me about fitness, nutrition, routines..."
                            rows="1"
                            value={inputValue}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyPress}
                            ref={messageInputRef}
                            disabled={isDisabled}
                        />

                        <div className="buttons-container">
                            <button
                                className={`mic-button ${isRecording ? 'recording' : ''}`}
                                id="micButton"
                                onClick={toggleMicrophone}
                                title="Record message"
                                ref={micButtonRef}
                                disabled={isDisabled}
                            >
                                <span className="material-symbols-outlined">{isRecording ? 'stop' : 'mic'}</span>
                            </button>
                            <button
                                className="send-button"
                                id="sendButton"
                                onClick={sendMessage}
                                ref={sendButtonRef}
                                disabled={isDisabled}
                            >
                                {isDisabled ? (
                                    <div className="loading-spinner"></div>
                                ) : (
                                    <span className="material-symbols-outlined">send</span>
                                )}
                            </button>
                            <button
                                className="clear-button"
                                id="clearButton"
                                onClick={clearChat}
                                title="Clear chat"
                                ref={clearButtonRef}
                                disabled={isDisabled}
                            >
                                <span className="material-symbols-outlined">delete</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
