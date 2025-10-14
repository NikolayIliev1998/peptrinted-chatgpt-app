# PetPrinted ChatGPT Assistant

Ein dedizierter Zendesk App für ChatGPT-Integration zur Unterstützung des Kundenservice-Teams.

## Features

- 🤖 **ChatGPT Integration**: Direkte Verbindung zur OpenAI API
- 📝 **Ticket-Kontext**: Automatische Einbindung von Ticket-Informationen
- ⚡ **Schnelle Prompts**: Vordefinierte Prompts für häufige Kundenservice-Szenarien
- 🎨 **Moderne UI**: Benutzerfreundliche Oberfläche mit Status-Indikator
- 🔄 **Echtzeit-Chat**: Live-Chat-Funktionalität mit Nachrichtenverlauf

## Installation

### 1. Abhängigkeiten installieren

```bash
cd chatgpt_app
npm install
```

### 2. OpenAI API Key konfigurieren

Setzen Sie Ihre OpenAI API Key als Umgebungsvariable:

```bash
# Windows
set OPENAI_API_KEY=your-openai-api-key-here

# Linux/Mac
export OPENAI_API_KEY=your-openai-api-key-here
```

Oder bearbeiten Sie die `server.mjs` Datei und ersetzen Sie:
```javascript
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'your-openai-api-key-here';
```

### 3. Server starten

```bash
npm start
```

Der Server läuft standardmäßig auf `http://localhost:3001`

### 4. Zendesk App starten

```bash
npm run run-app
```

## Verwendung

### Schnelle Prompts

Die App bietet vordefinierte Prompts für häufige Kundenservice-Szenarien:

- **Professionelle Antwort**: Hilft bei der Formulierung professioneller Antworten
- **Problem-Analyse**: Analysiert Kundenprobleme und schlägt Lösungen vor
- **Verzögerung erklären**: Erklärt höflich mögliche Verzögerungen
- **Entschuldigung**: Formuliert freundliche Entschuldigungen
- **Kundenunterstützung**: Bietet Unterstützung bei der Kundenbetreuung

### Benutzerdefinierte Nachrichten

Sie können auch eigene Nachrichten an ChatGPT senden:

1. Geben Sie Ihre Nachricht in das Textfeld ein
2. Klicken Sie auf "Senden" oder drücken Sie Enter
3. ChatGPT antwortet basierend auf dem Ticket-Kontext

## Konfiguration

### Server-URL ändern

Bearbeiten Sie die `chatgpt.html` Datei und ändern Sie:

```javascript
const serverURL = localURL; // Ändern Sie zu liveURL für Produktion
```

### App-Größe anpassen

Bearbeiten Sie die `manifest.json` Datei:

```json
"size": {
  "height": "500px",
  "width": "400px"
}
```

## Entwicklung

### Projektstruktur

```
chatgpt_app/
├── assets/
│   ├── chatgpt.html      # Haupt-UI der App
│   ├── server.mjs        # Backend-Server
│   └── icon.png          # App-Icon
├── manifest.json         # Zendesk App-Konfiguration
├── package.json          # Node.js Abhängigkeiten
└── README.md            # Diese Datei
```

### API Endpoints

- `GET /test` - Server-Status prüfen
- `POST /chatgpt` - ChatGPT-Anfragen verarbeiten

### Anpassungen

#### Neue Prompts hinzufügen

Fügen Sie neue Quick-Prompts in `chatgpt.html` hinzu:

```html
<button class="quick-prompt" data-prompt="Ihr neuer Prompt hier">Button Text</button>
```

#### System-Prompt anpassen

Bearbeiten Sie den `systemPrompt` in `server.mjs`:

```javascript
let systemPrompt = `Ihr angepasster System-Prompt hier...`;
```

## Troubleshooting

### Server-Verbindung

- Prüfen Sie, ob der Server auf Port 3001 läuft
- Überprüfen Sie die Firewall-Einstellungen
- Stellen Sie sicher, dass CORS aktiviert ist

### OpenAI API

- Überprüfen Sie Ihren API-Key
- Prüfen Sie Ihr API-Limit
- Stellen Sie sicher, dass die API erreichbar ist

### Zendesk Integration

- Überprüfen Sie die Zendesk App-Konfiguration
- Stellen Sie sicher, dass die App installiert ist
- Prüfen Sie die Browser-Konsole auf JavaScript-Fehler

## Support

Bei Problemen oder Fragen wenden Sie sich an:
- **Entwickler**: Nikolay (nikolay@bytexperts.de)
- **Unternehmen**: PetPrinted

## Lizenz

MIT License - siehe LICENSE Datei für Details.
