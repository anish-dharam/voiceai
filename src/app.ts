import { WhisperSTT } from "whisper-speech-to-text";
import { ElevenLabsClient } from "elevenlabs";
import "./styles.css";

class TreeChat {
  private whisper: WhisperSTT;
  private chatMessages: HTMLElement;
  private startButton: HTMLButtonElement;
  private stopButton: HTMLButtonElement;
  private status: HTMLElement;
  private tree: HTMLElement;
  private isSessionActive: boolean = false;
  private elevenLabs: any;

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
    this.tree.addEventListener("click", this.handleTreeClick.bind(this));
  }

  private addMessage(text: string, isUser: boolean = false): void {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${isUser ? "user-message" : "bot-message"}`;
    messageDiv.textContent = text;
    this.chatMessages.appendChild(messageDiv);
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
  }

  private async handleStart(): Promise<void> {
    try {
      console.log("handleStart: Attempting to start recording");
      this.status.textContent = "Listening...";
      this.startButton.disabled = true;
      this.stopButton.disabled = false;
      await this.whisper.startRecording();
      console.log("handleStart: Recording started");
    } catch (error) {
      console.error("Error starting Whisper recording:", error);
      this.status.textContent =
        "Failed to start voice chat. Please ensure microphone permissions are granted.";
    }
  }

  private async handleStop(): Promise<void> {
    try {
      console.log("handleStop: Attempting to stop recording");
      this.status.textContent = "Transcribing...";
      this.startButton.disabled = false;
      this.stopButton.disabled = true;
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

  private handleTreeClick(): void {
    this.addMessage(
      "🌳 *rustling leaves* Hello! How can I help you today?",
      false
    );
  }
}

// init application when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new TreeChat();
});
