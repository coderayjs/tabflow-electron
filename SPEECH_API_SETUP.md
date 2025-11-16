# Speech-to-Text API Setup Guide

This guide will help you set up Google Cloud Speech-to-Text or Azure Speech Services for better voice recognition accuracy in noisy casino environments.

## Option 1: Google Cloud Speech-to-Text

### Step 1: Get API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Cloud Speech-to-Text API**
4. Go to **APIs & Services** > **Credentials**
5. Click **Create Credentials** > **API Key**
6. Copy your API key

### Step 2: Configure in Application
Open browser console and run:
```javascript
localStorage.setItem('speech_api_key', 'YOUR_GOOGLE_API_KEY_HERE');
localStorage.setItem('speech_provider', 'google');
```

Or set in `.env` file:
```env
REACT_APP_SPEECH_API_KEY=your-google-api-key-here
REACT_APP_SPEECH_PROVIDER=google
```

## Option 2: Azure Speech Services

### Step 1: Get API Key and Region
1. Go to [Azure Portal](https://portal.azure.com/)
2. Create a new **Speech Services** resource
3. Copy your **Key 1** (API key)
4. Copy your **Region** (e.g., `eastus`, `westus`, etc.)

### Step 2: Configure in Application
Open browser console and run:
```javascript
localStorage.setItem('speech_api_key', 'YOUR_AZURE_API_KEY_HERE');
localStorage.setItem('speech_provider', 'azure');
localStorage.setItem('azure_speech_region', 'YOUR_REGION_HERE'); // e.g., 'eastus'
```

Or set in `.env` file:
```env
REACT_APP_SPEECH_API_KEY=your-azure-api-key-here
REACT_APP_SPEECH_PROVIDER=azure
AZURE_SPEECH_REGION=eastus
```

## Option 3: OpenAI Whisper API

### Step 1: Get API Key
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Navigate to **API Keys**
3. Create a new API key
4. Copy your API key

### Step 2: Configure in Application
Open browser console and run:
```javascript
localStorage.setItem('speech_api_key', 'YOUR_OPENAI_API_KEY_HERE');
localStorage.setItem('speech_provider', 'openai');
```

Or set in `.env` file:
```env
REACT_APP_SPEECH_API_KEY=your-openai-api-key-here
REACT_APP_SPEECH_PROVIDER=openai
```

## Testing

After configuration, test the voice input:
1. Click the microphone button
2. Speak a command like: "I need an H1 high limit dealer for R101 at 6:00"
3. The system should transcribe it accurately

## Recommendations

- **For Casino Environments**: Use **Google Cloud Speech-to-Text** or **Azure Speech Services**
  - Better noise handling
  - More accurate transcription
  - Better for professional use

- **For Development/Testing**: Web Speech API (no setup needed, but less accurate)

## Cost Considerations

- **Google Cloud**: Pay-as-you-go, ~$0.006 per 15 seconds
- **Azure**: Pay-as-you-go, ~$1 per audio hour
- **OpenAI Whisper**: $0.006 per minute

## Security Note

API keys are stored in localStorage for convenience. For production, consider:
- Using environment variables
- Storing keys securely in backend
- Using API key rotation

