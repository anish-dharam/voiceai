# VoiceAI - Interactive Tree Chatbot

An interactive chatbot with voice capabilities, featuring a beautiful animated tree interface. The chatbot uses VAPI AI for voice interactions and ElevenLabs for text-to-speech capabilities.

## Features

- Interactive tree animation
- Voice chat capabilities
- Text-to-speech integration
- Modern, responsive UI
- Real-time chat interface

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Installation

1. Clone the repository:

```bash
git clone https://github.com/anish-dharam/voiceai.git
cd voiceai
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory and add your API keys:

```
VAPI_API_KEY=your_vapi_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
```

## Running the Application

### Development Mode

To run the application in development mode with hot-reloading:

```bash
npm run dev
```

This will start the development server at `http://localhost:8080`

### Production Build

To create a production build:

```bash
npm run build
```

The built files will be available in the `dist` directory.

## Project Structure

```
voiceai/
├── src/
│   ├── app.ts          # Main application logic
│   ├── styles.css      # Styling
│   ├── index.html      # HTML template
│   └── types.ts        # TypeScript type definitions
├── package.json        # Project dependencies and scripts
├── webpack.config.js   # Webpack configuration
└── tsconfig.json      # TypeScript configuration
```

## Technologies Used

- TypeScript
- Webpack
- VAPI AI
- ElevenLabs
- Whisper Speech-to-Text

## License

ISC

## Author

Anish Dharam
