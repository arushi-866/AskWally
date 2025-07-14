import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, Loader2, Play, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceAssistantProps {
  onSearch: (query: string) => void;
  isSearching: boolean;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ onSearch, isSearching }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsSupported(true);
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      if (recognitionRef.current) {
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';
        recognitionRef.current.maxAlternatives = 1;
        
        // Add timeout for network issues
        recognitionRef.current.timeout = 10000; // 10 seconds timeout

        recognitionRef.current.onstart = () => {
          setIsListening(true);
          setTranscript('');
          setError(null);
          startAudioRecording();
        };

        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = '';
          let interimTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) {
              finalTranscript += result[0].transcript;
              setConfidence(result[0].confidence);
            } else {
              interimTranscript += result[0].transcript;
            }
          }

          setTranscript(finalTranscript || interimTranscript);

          // Only trigger search when we have a final result
          if (finalTranscript) {
            console.log('Voice search triggered:', finalTranscript.trim());
            processVoiceInput(finalTranscript.trim());
          }
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
          stopAudioRecording();
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          stopAudioRecording();
          
          switch (event.error) {
            case 'not-allowed':
              setError('Microphone access denied. Please allow microphone permissions and try again.');
              break;
            case 'no-speech':
              setError('No speech detected. Please try speaking again.');
              break;
            case 'audio-capture':
              setError('Audio capture failed. Please check your microphone.');
              break;
            case 'network':
              setError('Network error with speech recognition. Trying fallback method...');
              // Try fallback: use audio recording and manual transcription
              setTimeout(() => {
                setError(null);
                handleNetworkErrorFallback();
              }, 2000);
              break;
            default:
              setError('Voice recognition failed. Please try again.');
          }
        };
      }
    }
  }, []);

  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
        // Clean up the stream
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
    } catch (error) {
      console.error('Failed to start audio recording:', error);
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const processVoiceInput = async (voiceText: string) => {
    setIsProcessing(true);
    
    try {
      // Step 1: Use the transcript directly for search
      console.log('Processing voice input:', voiceText);
      
      // Step 2: If we have audio, we could send it to a transcription service
      // For now, we'll use the Web Speech API transcript and enhance it with Ollama
      if (audioBlob) {
        console.log('Audio recorded, size:', audioBlob.size);
        // Here you could send the audio to a transcription service if needed
      }

      // Step 3: Use Ollama to enhance the search query
      const enhancedQuery = await enhanceQueryWithOllama(voiceText);
      
      // Step 4: Perform the search
      onSearch(enhancedQuery || voiceText);
      
    } catch (error) {
      console.error('Error processing voice input:', error);
      // Fallback to direct search
      onSearch(voiceText);
    } finally {
      setIsProcessing(false);
    }
  };

  const enhanceQueryWithOllama = async (query: string): Promise<string> => {
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Enhance this shopping search query to be more specific and searchable: "${query}". Return only the enhanced query, nothing else.`,
          context: 'voice-search-enhancement'
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.response || query;
      }
    } catch (error) {
      console.error('Error enhancing query with Ollama:', error);
    }
    
    return query; // Fallback to original query
  };

  const startListening = async () => {
    if (!recognitionRef.current || isListening || isSearching || isProcessing) return;

    setError(null);
    setTranscript('');
    setAudioBlob(null);
    setAudioUrl(null);
    
    try {
      // Check if getUserMedia is supported
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // First, request microphone access
        await navigator.mediaDevices.getUserMedia({ audio: true })
          .then(function(stream) {
            console.log("Microphone access granted");
            // Stop the stream as we just needed permission
            stream.getTracks().forEach(track => track.stop());
          })
          .catch(function(err) {
            console.error("Microphone access denied:", err);
            throw new Error('Microphone access denied. Please allow microphone permissions and try again.');
          });
      } else {
        console.warn("getUserMedia not supported");
      }

      // Now start speech recognition with retry logic
      let retryCount = 0;
      const maxRetries = 2;
      
      const attemptRecognition = () => {
        try {
          recognitionRef.current.start();
        } catch (error) {
          console.error('Speech recognition start error:', error);
          if (retryCount < maxRetries) {
            retryCount++;
            setTimeout(attemptRecognition, 1000);
          } else {
            setError('Voice recognition unavailable. Please try typing your query manually.');
          }
        }
      };
      
      attemptRecognition();
      
      // Auto-stop after 10 seconds
      timeoutRef.current = setTimeout(() => {
        if (recognitionRef.current && isListening) {
          recognitionRef.current.stop();
        }
      }, 10000);
      
    } catch (error) {
      if (error instanceof Error && error.message.includes('Microphone access denied')) {
        setError(error.message);
      } else {
        setError('Failed to start voice recognition. Please try again.');
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const playAudio = () => {
    if (audioUrl && audioRef.current) {
      audioRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    }
  };

  const handleNetworkErrorFallback = async () => {
    try {
      setIsProcessing(true);
      setError('Using audio recording fallback...');
      
      // If we have recorded audio, we can try to process it
      if (audioBlob) {
        console.log('Processing recorded audio as fallback');
        
        // For now, we'll use a simple approach: ask user to type their query
        // In a real implementation, you could send the audio to a transcription service
        const userInput = prompt('Voice recognition failed. Please type your search query:');
        if (userInput && userInput.trim()) {
          await processVoiceInput(userInput.trim());
        }
      } else {
        setError('Please try speaking again or type your query manually.');
      }
    } catch (error) {
      console.error('Fallback error:', error);
      setError('Voice recognition unavailable. Please type your query manually.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div className="relative">
      {/* Voice Button with 3D Effects */}
      <motion.button
        type="button"
        onClick={isListening ? stopListening : startListening}
        disabled={isSearching || isProcessing}
        className={`relative p-3 rounded-2xl font-semibold transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed perspective-1000 transform-gpu ${
          isListening
            ? 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-2xl'
            : isProcessing
            ? 'bg-gradient-to-br from-yellow-500 to-yellow-600 text-white shadow-2xl'
            : 'bg-gradient-to-br from-walmart-blue to-walmart-blue-dark text-white shadow-xl hover:shadow-2xl'
        }`}
        whileHover={{ 
          scale: 1.1,
          rotateY: 10,
          boxShadow: isListening 
            ? '0 15px 35px rgba(239,68,68,0.4)' 
            : isProcessing
            ? '0 15px 35px rgba(245,158,11,0.4)'
            : '0 15px 35px rgba(0,76,145,0.4)'
        }}
        whileTap={{ scale: 0.9 }}
        animate={isListening ? {
          scale: [1, 1.1, 1],
          boxShadow: [
            '0 10px 25px rgba(239,68,68,0.3)',
            '0 20px 40px rgba(239,68,68,0.5)',
            '0 10px 25px rgba(239,68,68,0.3)'
          ]
        } : isProcessing ? {
          scale: [1, 1.05, 1],
          boxShadow: [
            '0 10px 25px rgba(245,158,11,0.3)',
            '0 20px 40px rgba(245,158,11,0.5)',
            '0 10px 25px rgba(245,158,11,0.3)'
          ]
        } : {}}
        transition={isListening || isProcessing ? {
          duration: 1,
          repeat: Infinity,
          ease: "easeInOut"
        } : {}}
      >
        {/* Animated Background */}
        <motion.div
          className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          animate={isListening ? {
            background: [
              'linear-gradient(45deg, rgba(255,255,255,0.1), transparent)',
              'linear-gradient(135deg, rgba(255,255,255,0.2), transparent)',
              'linear-gradient(225deg, rgba(255,255,255,0.1), transparent)',
              'linear-gradient(315deg, rgba(255,255,255,0.2), transparent)',
              'linear-gradient(45deg, rgba(255,255,255,0.1), transparent)'
            ]
          } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />

        {/* Icon with 3D Animation */}
        <motion.div
          className="relative z-10"
          animate={isListening ? {
            rotateY: [0, 360],
            scale: [1, 1.2, 1]
          } : isProcessing ? {
            rotateY: [0, 180],
            scale: [1, 1.1, 1]
          } : {}}
          transition={isListening || isProcessing ? {
            rotateY: { duration: 2, repeat: Infinity, ease: "linear" },
            scale: { duration: 1, repeat: Infinity, ease: "easeInOut" }
          } : {}}
        >
          <AnimatePresence mode="wait">
            {isSearching ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, rotate: -180 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 180 }}
              >
                <Loader2 className="w-5 h-5 animate-spin" />
              </motion.div>
            ) : isProcessing ? (
              <motion.div
                key="processing"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
              >
                <Loader2 className="w-5 h-5 animate-spin" />
              </motion.div>
            ) : isListening ? (
              <motion.div
                key="listening"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
              >
                <MicOff className="w-5 h-5" />
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
              >
                <Mic className="w-5 h-5" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Pulse Effect for Listening State */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              className="absolute inset-0 rounded-2xl border-2 border-red-400"
              initial={{ scale: 1, opacity: 1 }}
              animate={{ 
                scale: [1, 1.5, 2],
                opacity: [1, 0.5, 0]
              }}
              exit={{ opacity: 0 }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity,
                ease: "easeOut"
              }}
            />
          )}
        </AnimatePresence>
      </motion.button>

      {/* Audio Playback Controls */}
      <AnimatePresence>
        {audioUrl && !isListening && (
          <motion.div
            className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-2 flex items-center space-x-2"
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.8 }}
            transition={{ duration: 0.3 }}
          >
            <button
              onClick={isPlayingAudio ? pauseAudio : playAudio}
              className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              {isPlayingAudio ? (
                <Pause className="w-3 h-3 text-gray-600" />
              ) : (
                <Play className="w-3 h-3 text-gray-600" />
              )}
            </button>
            <span className="text-xs text-gray-600">Play Recording</span>
            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlayingAudio(false)}
              onPause={() => setIsPlayingAudio(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="absolute -top-20 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-xl text-sm whitespace-nowrap backdrop-blur-sm max-w-64"
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.8 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col items-center space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-red-200">⚠️</span>
                <span>{error}</span>
              </div>
              {error.includes('unavailable') && (
                <button
                  onClick={() => {
                    const userInput = prompt('Please type your search query:');
                    if (userInput && userInput.trim()) {
                      processVoiceInput(userInput.trim());
                    }
                  }}
                  className="px-3 py-1 bg-white text-red-500 rounded-lg text-xs font-medium hover:bg-gray-100 transition-colors"
                >
                  Type Query Manually
                </button>
              )}
            </div>
            {/* Error Tooltip Arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-red-500" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice Feedback Tooltip */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-xl text-sm whitespace-nowrap backdrop-blur-sm"
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.8 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center space-x-2">
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Volume2 className="w-4 h-4 text-red-400" />
              </motion.div>
              <span>Recording & Listening...</span>
              {/* Audio Visualizer */}
              <div className="flex items-center space-x-1">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1 bg-red-400 rounded-full"
                    animate={{
                      height: [4, 12, 4],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: i * 0.2,
                      ease: "easeInOut"
                    }}
                  />
                ))}
              </div>
            </div>
            
            {/* Transcript Preview */}
            {transcript && (
              <motion.div
                className="mt-2 text-xs text-gray-300 max-w-48 truncate"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                "{transcript}"
              </motion.div>
            )}

            {/* Tooltip Arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/80" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Processing Feedback */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white px-4 py-2 rounded-xl text-sm whitespace-nowrap backdrop-blur-sm"
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.8 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center space-x-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className="w-4 h-4" />
              </motion.div>
              <span>Processing voice input...</span>
            </div>
            
            {/* Tooltip Arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-yellow-500" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confidence Indicator */}
      <AnimatePresence>
        {confidence > 0 && !isListening && !isProcessing && (
          <motion.div
            className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-gray-500"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {Math.round(confidence * 100)}% confident
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};