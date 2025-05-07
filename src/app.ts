import Vapi from "@vapi-ai/web";
import "./styles.css";

class TreeChat {
  private vapi: Vapi;
  private chatMessages: HTMLElement;
  private startButton: HTMLButtonElement;
  private stopButton: HTMLButtonElement;
  private status: HTMLElement;
  private tree: HTMLElement;
  private isSessionActive: boolean = false;
  private readonly assistantId: string = "YOUR_ASSISTANT_ID"; // Replace with your actual assistant ID

  constructor() {
    this.vapi = new Vapi("YOUR_VAPI_PUBLIC_KEY"); // Replace with your Vapi public key

    this.chatMessages = document.getElementById("chatMessages") as HTMLElement;
    this.startButton = document.getElementById(
      "startButton"
    ) as HTMLButtonElement;
    this.stopButton = document.getElementById(
      "stopButton"
    ) as HTMLButtonElement;
    this.status = document.getElementById("status") as HTMLElement;
    this.tree = document.querySelector(".tree") as HTMLElement;

    this.initializeVapi();
    this.initializeEventListeners();
  }

  private initializeVapi(): void {
    this.vapi.on("call-start", () => {
      this.isSessionActive = true;
    });

    this.vapi.on("call-end", () => {
      this.isSessionActive = false;
    });

    this.vapi.on("message", (message: any) => {
      if (message.type === "transcript") {
        this.addMessage(message.transcript, message.role === "user");
      }
    });

    this.vapi.on("error", (error: Error) => {
      console.error("Vapi error:", error);
      this.status.textContent = "Error occurred. Please try again.";
    });
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
      await this.vapi.start(this.assistantId);
      this.startButton.disabled = true;
      this.stopButton.disabled = false;
      this.status.textContent = "Listening...";
    } catch (error) {
      console.error("Error starting Vapi:", error);
      this.status.textContent = "Failed to start voice chat";
    }
  }

  private async handleStop(): Promise<void> {
    try {
      await this.vapi.stop();
      this.startButton.disabled = false;
      this.stopButton.disabled = true;
      this.status.textContent = "Voice chat stopped";
    } catch (error) {
      console.error("Error stopping Vapi:", error);
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
