import { WhisperSTT } from "whisper-speech-to-text";
import "./styles.css";

class TreeChat {
  private whisper: WhisperSTT;
  private chatMessages: HTMLElement;
  private startButton: HTMLButtonElement;
  private stopButton: HTMLButtonElement;
  private status: HTMLElement;
  private tree: HTMLElement;
  private isSessionActive: boolean = false;

  constructor() {
    this.whisper = new WhisperSTT(process.env.OPENAI_API_KEY as string); // OpenAI API key
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
      await this.whisper.stopRecording((text: string) => {
        console.log("handleStop: Transcription received", text);
        this.addMessage(text, true);
        this.status.textContent = "Ready";
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

// Initialize the application when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new TreeChat();
});
