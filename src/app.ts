import { WhisperSTT } from "whisper-speech-to-text";
import { ElevenLabsClient } from "elevenlabs";
import "./styles.css";

class TreeChat {
  private whisper: WhisperSTT;
  private chatMessages: HTMLElement;
  private startButton: HTMLButtonElement;
  private stopButton: HTMLButtonElement;
  private endConversationButton: HTMLButtonElement;
  private status: HTMLElement;
  private tree: HTMLElement;
  private isSessionActive: boolean = false;
  private elevenLabs: any;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private silenceTimer: number | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private readonly SILENCE_THRESHOLD = -50; // dB
  private readonly SILENCE_DURATION = 1000; // ms

  constructor() {
    this.whisper = new WhisperSTT(process.env.OPENAI_API_KEY as string); // OpenAI API key
    this.elevenLabs = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY as string,
    });
    this.chatMessages = document.getElementById("chatMessages") as HTMLElement;
    this.startButton = document.getElementById(
      "startButton"
    ) as HTMLButtonElement;
    this.stopButton = document.getElementById(
      "stopButton"
    ) as HTMLButtonElement;
    this.endConversationButton = document.getElementById(
      "endConversationButton"
    ) as HTMLButtonElement;
    this.status = document.getElementById("status") as HTMLElement;
    this.tree = document.querySelector(".tree") as HTMLElement;
    this.initializeEventListeners();
  }

  private initializeEventListeners(): void {
    this.startButton.addEventListener("click", () => {
      console.log("Start button clicked");
      this.handleStart();
    });
    this.stopButton.addEventListener("click", () => {
      console.log("Stop button clicked");
      this.handleStop();
    });
    this.endConversationButton.addEventListener("click", () => {
      console.log("End conversation button clicked");
      this.handleEndConversation();
    });
    this.tree.addEventListener("click", this.handleTreeClick.bind(this));
  }

  private addMessage(text: string, isUser: boolean = false): void {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${isUser ? "user-message" : "bot-message"}`;
    messageDiv.textContent = text;
    this.chatMessages.appendChild(messageDiv);
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
  }

  // setup audio
  private async setupAudioAnalysis(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new AudioContext();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      source.connect(this.analyser);

      // Start monitoring audio levels
      this.monitorAudioLevel();
    } catch (error) {
      console.error("Error setting up audio analysis:", error);
      throw error;
    }
  }

  private monitorAudioLevel(): void {
    if (!this.analyser) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    const checkLevel = () => {
      if (!this.analyser || !this.isSessionActive) return;

      this.analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      const db = 20 * Math.log10(average / 255);

      if (db < this.SILENCE_THRESHOLD) {
        if (!this.silenceTimer) {
          this.silenceTimer = window.setTimeout(() => {
            if (this.isSessionActive) {
              this.handleStop();
            }
          }, this.SILENCE_DURATION);
        }
      } else {
        if (this.silenceTimer) {
          clearTimeout(this.silenceTimer);
          this.silenceTimer = null;
        }
      }

      requestAnimationFrame(checkLevel);
    };

    checkLevel();
  }

  private async handleStart(): Promise<void> {
    try {
      console.log("handleStart: Attempting to start recording");
      this.status.textContent = "Listening...";
      this.startButton.disabled = true;
      this.stopButton.disabled = false;
      this.endConversationButton.disabled = false;
      this.isSessionActive = true;

      await this.setupAudioAnalysis();
      await this.whisper.startRecording();
      console.log("handleStart: Recording started");
    } catch (error) {
      console.error("Error starting Whisper recording:", error);
      this.status.textContent =
        "Failed to start voice chat. Please ensure microphone permissions are granted.";
      this.isSessionActive = false;
    }
  }

  private async handleStop(): Promise<void> {
    try {
      console.log("handleStop: Attempting to stop recording");
      this.status.textContent = "Transcribing...";
      this.startButton.disabled = true;
      this.stopButton.disabled = true;
      this.endConversationButton.disabled = false;
      this.isSessionActive = false;

      // Clean up audio analysis
      if (this.silenceTimer) {
        clearTimeout(this.silenceTimer);
        this.silenceTimer = null;
      }
      if (this.audioContext) {
        await this.audioContext.close();
        this.audioContext = null;
        this.analyser = null;
      }

      await this.whisper.stopRecording(async (text: string) => {
        console.log("handleStop: Transcription received", text);
        this.addMessage(text, true);
        this.status.textContent = "Thinking...";
        try {
          const response = await fetch(
            "https://api.openai.com/v1/chat/completions",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
              },
              body: JSON.stringify({
                model: "gpt-4.1-nano",
                messages: [
                  { role: "system", content: "You are a helpful assistant." },
                  { role: "user", content: text },
                ],
                temperature: 0.7,
              }),
            }
          );
          if (!response.ok) throw new Error("LLM API error");
          const data = await response.json();
          const botReply =
            data.choices?.[0]?.message?.content || "(No response)";
          this.addMessage(botReply, false);
          this.status.textContent = "Ready";

          try {
            const voiceId = "21m00Tcm4TlvDq8ikWAM"; // Rachel's actual voice ID
            const response = await fetch(
              `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "xi-api-key": process.env.ELEVENLABS_API_KEY as string,
                },
                body: JSON.stringify({
                  text: botReply,
                  model_id: "eleven_monolingual_v1",
                  voice_settings: { stability: 0.5, similarity_boost: 0.5 },
                }),
              }
            );

            if (!response.ok) throw new Error("TTS API error");
            const audioData = await response.arrayBuffer();
            const audioBlob = new Blob([audioData], { type: "audio/mpeg" });
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);

            // event listener for when audio finishes playing
            audio.addEventListener("ended", () => {
              // clean up  URL
              URL.revokeObjectURL(audioUrl);
              // start the next recording session
              this.handleStart();
            });

            audio.play();
          } catch (ttsError) {
            console.error("Error with ElevenLabs TTS:", ttsError);
          }
        } catch (llmError) {
          console.error("Error calling LLM:", llmError);
          this.addMessage("Sorry, I couldn't process that.", false);
          this.status.textContent = "Error occurred during LLM call.";
        }
      });
      console.log("handleStop: Recording stopped");
    } catch (error) {
      console.error("Error stopping Whisper recording:", error);
      this.status.textContent = "Error occurred during transcription.";
    }
  }

  private async handleEndConversation(): Promise<void> {
    try {
      // stop any ongoing recording
      if (this.isSessionActive) {
        await this.handleStop();
      }

      // clean up audio analysis
      if (this.silenceTimer) {
        clearTimeout(this.silenceTimer);
        this.silenceTimer = null;
      }
      if (this.audioContext) {
        await this.audioContext.close();
        this.audioContext = null;
        this.analyser = null;
      }

      // reset UI state
      this.startButton.disabled = false;
      this.stopButton.disabled = true;
      this.endConversationButton.disabled = true;
      this.status.textContent =
        "Conversation ended. Click 'Start Voice Chat' to begin a new conversation.";
      this.isSessionActive = false;
    } catch (error) {
      console.error("Error ending conversation:", error);
      this.status.textContent = "Error occurred while ending conversation.";
    }
  }

  private async handleTreeClick(): Promise<void> {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }

    if (this.isSessionActive) {
      await this.handleStop();
    }

    this.addMessage(
      "🌳 *rustling leaves* Hello! How can I help you today?",
      false
    );

    try {
      const voiceId = "21m00Tcm4TlvDq8ikWAM";
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "xi-api-key": process.env.ELEVENLABS_API_KEY as string,
          },
          body: JSON.stringify({
            text: "Hello! How can I help you today?",
            model_id: "eleven_monolingual_v1",
            voice_settings: { stability: 0.5, similarity_boost: 0.5 },
          }),
        }
      );

      if (!response.ok) throw new Error("TTS API error");
      const audioData = await response.arrayBuffer();
      const audioBlob = new Blob([audioData], { type: "audio/mpeg" });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      this.currentAudio = audio;

      audio.addEventListener("ended", () => {
        URL.revokeObjectURL(audioUrl);
        this.currentAudio = null;
        this.handleStart();
      });

      audio.play();
    } catch (error) {
      console.error("Error with tree TTS:", error);
    }
  }
}

// init application when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new TreeChat();
});
