/**
 * Speech-to-Text Service
 * Supports multiple providers for better accuracy
 */

export interface SpeechToTextOptions {
  language?: string;
  sampleRate?: number;
}

export interface SpeechToTextResult {
  transcript: string;
  confidence?: number;
  error?: string;
}

export class SpeechToTextService {
  private useWebSpeech: boolean = true;
  private apiKey?: string;
  private provider: 'webspeech' | 'google' | 'azure' | 'openai' = 'webspeech';

  constructor(options?: { provider?: 'webspeech' | 'google' | 'azure' | 'openai'; apiKey?: string }) {
    if (options?.provider) {
      this.provider = options.provider;
    }
    if (options?.apiKey) {
      this.apiKey = options.apiKey;
    }
    
    // Check if Web Speech API is available
    const SpeechRecognition = (typeof window !== 'undefined') 
      ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
      : null;
    
    this.useWebSpeech = !!SpeechRecognition;
  }

  /**
   * Check if speech recognition is available
   */
  isAvailable(): boolean {
    if (this.provider === 'webspeech') {
      const SpeechRecognition = (typeof window !== 'undefined') 
        ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
        : null;
      return !!SpeechRecognition;
    }
    // For API-based providers, check if API key is set
    return !!this.apiKey;
  }

  /**
   * Start speech recognition using Web Speech API
   */
  private createWebSpeechRecognition(
    onResult: (result: SpeechToTextResult) => void,
    onError: (error: string) => void,
    onEnd: () => void
  ): any {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      onError('Web Speech API is not supported in this browser');
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      const confidence = event.results[0][0].confidence || 0.8;
      onResult({ transcript, confidence });
    };

    recognition.onerror = (event: any) => {
      let errorMessage = 'Speech recognition error';
      
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please speak clearly.';
          break;
        case 'audio-capture':
          errorMessage = 'No microphone found. Please check your microphone.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone permission denied. Please enable microphone access in browser settings.';
          break;
        case 'network':
          errorMessage = 'Network error. Please check your internet connection.';
          break;
        case 'aborted':
          errorMessage = 'Speech recognition was aborted.';
          break;
        default:
          errorMessage = `Speech recognition error: ${event.error}`;
      }
      
      onError(errorMessage);
    };

    recognition.onend = () => {
      onEnd();
    };

    return recognition;
  }

  /**
   * Start speech recognition using Google Cloud Speech-to-Text API
   */
  private async recognizeWithGoogle(
    audioBlob: Blob,
    options: SpeechToTextOptions = {}
  ): Promise<SpeechToTextResult> {
    if (!this.apiKey) {
      return { transcript: '', error: 'Google API key not configured' };
    }

    try {
      // Convert audio blob to base64
      const base64Audio = await this.blobToBase64(audioBlob);
      const base64Content = base64Audio.includes(',') 
        ? base64Audio.split(',')[1] 
        : base64Audio;
      
      // Determine audio encoding from blob type
      let encoding = 'WEBM_OPUS';
      if (audioBlob.type.includes('wav')) {
        encoding = 'LINEAR16';
      } else if (audioBlob.type.includes('flac')) {
        encoding = 'FLAC';
      }
      
      const response = await fetch(
        `https://speech.googleapis.com/v1/speech:recognize?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            config: {
              encoding: encoding,
              sampleRateHertz: options.sampleRate || 48000,
              languageCode: options.language || 'en-US',
              enableAutomaticPunctuation: true,
              enableWordTimeOffsets: false,
              model: 'latest_long', // Better for longer phrases
            },
            audio: {
              content: base64Content,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { 
          transcript: '', 
          error: errorData.error?.message || `HTTP ${response.status}: ${response.statusText}` 
        };
      }

      const data = await response.json();
      
      if (data.error) {
        return { transcript: '', error: data.error.message };
      }

      if (data.results && data.results.length > 0 && data.results[0].alternatives) {
        const transcript = data.results[0].alternatives[0].transcript;
        const confidence = data.results[0].alternatives[0].confidence || 0.9;
        return { transcript, confidence };
      }

      return { transcript: '', error: 'No transcription results' };
    } catch (error: any) {
      console.error('Google Speech API error:', error);
      return { transcript: '', error: error.message || 'Failed to transcribe audio' };
    }
  }

  /**
   * Start speech recognition using Azure Speech Services
   */
  private async recognizeWithAzure(
    audioBlob: Blob,
    options: SpeechToTextOptions = {}
  ): Promise<SpeechToTextResult> {
    if (!this.apiKey) {
      return { transcript: '', error: 'Azure API key not configured' };
    }

    try {
      // Azure requires region - get from env or use default
      const region = (typeof window !== 'undefined' && (window as any).AZURE_SPEECH_REGION) 
        || (typeof process !== 'undefined' && process.env?.AZURE_SPEECH_REGION) 
        || 'eastus';
      
      // Get access token first
      const tokenResponse = await fetch(
        `https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
        {
          method: 'POST',
          headers: {
            'Ocp-Apim-Subscription-Key': this.apiKey,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        return { 
          transcript: '', 
          error: `Failed to get Azure access token: ${errorText || tokenResponse.statusText}` 
        };
      }

      const token = await tokenResponse.text();
      
      // Convert audio blob to array buffer
      const audioArrayBuffer = await audioBlob.arrayBuffer();
      
      // Determine content type based on blob type
      let contentType = 'audio/wav';
      if (audioBlob.type.includes('webm')) {
        contentType = 'audio/webm';
      } else if (audioBlob.type.includes('ogg')) {
        contentType = 'audio/ogg';
      }
      
      const response = await fetch(
        `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${options.language || 'en-US'}&format=detailed`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': contentType,
            'Accept': 'application/json',
          },
          body: audioArrayBuffer,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        return { 
          transcript: '', 
          error: `Azure API error: ${errorText || response.statusText}` 
        };
      }

      const data = await response.json();
      
      if (data.RecognitionStatus === 'Success' && data.DisplayText) {
        return { 
          transcript: data.DisplayText, 
          confidence: data.Confidence || 1.0 
        };
      }

      return { 
        transcript: '', 
        error: data.RecognitionStatus || 'Recognition failed' 
      };
    } catch (error: any) {
      console.error('Azure Speech API error:', error);
      return { transcript: '', error: error.message || 'Failed to transcribe audio' };
    }
  }

  /**
   * Start speech recognition using OpenAI Whisper API
   */
  private async recognizeWithOpenAI(
    audioBlob: Blob,
    options: SpeechToTextOptions = {}
  ): Promise<SpeechToTextResult> {
    if (!this.apiKey) {
      return { transcript: '', error: 'OpenAI API key not configured' };
    }

    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', 'whisper-1');
      formData.append('language', options.language || 'en');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      const data = await response.json();
      
      if (data.error) {
        return { transcript: '', error: data.error.message };
      }

      return { transcript: data.text || '', confidence: 1.0 };
    } catch (error: any) {
      return { transcript: '', error: error.message || 'Failed to transcribe audio' };
    }
  }

  /**
   * Convert blob to base64
   */
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Start speech recognition
   * Returns a recognition object that can be started/stopped
   */
  startRecognition(
    onResult: (result: SpeechToTextResult) => void,
    onError: (error: string) => void,
    onEnd: () => void,
    options: SpeechToTextOptions = {}
  ): {
    start: () => void;
    stop: () => void;
    isRecording: () => boolean;
  } {
    if (this.provider === 'webspeech' && this.useWebSpeech) {
      const recognition = this.createWebSpeechRecognition(onResult, onError, onEnd);
      
      return {
        start: () => {
          try {
            recognition?.start();
          } catch (error: any) {
            onError(error.message || 'Failed to start recognition');
          }
        },
        stop: () => {
          recognition?.stop();
        },
        isRecording: () => {
          // Web Speech API doesn't expose this directly
          return false;
        },
      };
    }

    // For API-based providers, we need to record audio first
    let mediaRecorder: MediaRecorder | null = null;
    let audioChunks: Blob[] = [];
    let isRecording = false;

    return {
      start: async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'audio/webm;codecs=opus',
          });

          audioChunks = [];

          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              audioChunks.push(event.data);
            }
          };

          mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            
            let result: SpeechToTextResult;
            
            switch (this.provider) {
              case 'google':
                result = await this.recognizeWithGoogle(audioBlob, options);
                break;
              case 'azure':
                result = await this.recognizeWithAzure(audioBlob, options);
                break;
              case 'openai':
                result = await this.recognizeWithOpenAI(audioBlob, options);
                break;
              default:
                result = { transcript: '', error: 'Unknown provider' };
            }

            if (result.error) {
              onError(result.error);
            } else {
              onResult(result);
            }

            // Stop all tracks
            stream.getTracks().forEach(track => track.stop());
            onEnd();
          };

          mediaRecorder.start();
          isRecording = true;
        } catch (error: any) {
          onError(error.message || 'Failed to start recording');
          onEnd();
        }
      },
      stop: () => {
        if (mediaRecorder && isRecording) {
          mediaRecorder.stop();
          isRecording = false;
        }
      },
      isRecording: () => isRecording,
    };
  }
}

