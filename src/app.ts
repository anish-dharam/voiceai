import OpenAI from "openai";
import { ChatMessage, ChatRequest, ChatResponse } from "./types";
import "./styles.css";

class TreeChat {
  private openai: OpenAI;
  private chatMessages: HTMLElement;
  private startButton: HTMLButtonElement;
  private stopButton: HTMLButtonElement;
  private status: HTMLElement;
  private tree: HTMLElement;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private isRecording: boolean = false;

  constructor() {
    this.openai = new OpenAI({
      apiKey: "YOUR_4O_API_KEY", // Replace with your 4o API key
      dangerouslyAllowBrowser: true, // Only for development
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
    this.startButton.addEventListener("click", this.handleStart.bind(this));
    this.stopButton.addEventListener("click", this.handleStop.bind(this));
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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        this.audioChunks.push(event.data);
      };

      this.mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(this.audioChunks, { type: "audio/wav" });
        await this.processAudio(audioBlob);
      };

      this.mediaRecorder.start();
      this.isRecording = true;
      this.startButton.disabled = true;
      this.stopButton.disabled = false;
      this.status.textContent = "Listening...";
    } catch (error) {
      console.error("Error starting recording:", error);
      this.status.textContent = "Failed to start recording";
    }
  }

  private async handleStop(): Promise<void> {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      this.startButton.disabled = false;
      this.stopButton.disabled = true;
      this.status.textContent = "Processing...";
    }
  }

  private async processAudio(audioBlob: Blob): Promise<void> {
    try {
      // Convert audio to text using 4o API
      const transcription = await this.openai.audio.transcriptions.create({
        file: audioBlob,
        model: "whisper-1",
      });

      const userMessage = transcription.text;
      this.addMessage(userMessage, true);

      // Get chat response from 4o API
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "You are a friendly tree that loves to chat about nature and the environment. Keep responses concise and engaging.",
          },
          {
            role: "user",
            content: userMessage,
          },
        ],
        temperature: 0.7,
      });

      const botResponse = response.choices[0].message.content;
      this.addMessage(botResponse, false);
      this.status.textContent = "Ready";
    } catch (error) {
      console.error("Error processing audio:", error);
      this.status.textContent = "Error processing audio";
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
