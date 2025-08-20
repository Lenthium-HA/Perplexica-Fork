# 🚀 Custom Docker Deployment for Perplexica

This is your custom Docker Compose setup for running Perplexica with your latest changes including the configurable default OpenAI model feature and model indicator.

## 📁 Files Created

- `docker-compose.custom.yaml` - Custom Docker Compose configuration
- `Dockerfile.custom` - Custom Dockerfile for your fork
- `entrypoint.custom.sh` - Custom entrypoint script
- `setup-docker.sh` - Automated setup script
- `README-CUSTOM-DOCKER.md` - This documentation

## 🛠️ Quick Setup

### 1. Configure Your Environment

```bash
# Copy and edit the configuration
cp sample.config.toml config.toml
```

Edit `config.toml` with your API keys and settings:
```toml
[MODELS.OPENAI]
API_KEY = "your-openai-api-key"
DEFAULT_MODEL = "gpt-5-nano"  # Your default model

[MODELS.GROQ]
API_KEY = "your-groq-api-key"
DEFAULT_MODEL = "llama-3.1-70b"

[MODELS.ANTHROPIC]
API_KEY = "your-anthropic-api-key"
DEFAULT_MODEL = "claude-3-5-sonnet-20241022"

[MODELS.GEMINI]
API_KEY = "your-gemini-api-key"
DEFAULT_MODEL = "gemini-1.5-pro"

[API_ENDPOINTS]
SEARXNG = "http://localhost:4000"  # SearxNG endpoint
```

### 2. Run the Setup Script

```bash
./setup-docker.sh
```

### 3. Start the Services

```bash
docker-compose -f docker-compose.custom.yaml up -d
```

## 🌐 Access Points

- **Perplexica Web Interface**: http://localhost:3000
- **SearxNG Search Engine**: http://localhost:4000

## 📋 Management Commands

### Start Services
```bash
docker-compose -f docker-compose.custom.yaml up -d
```

### Stop Services
```bash
docker-compose -f docker-compose.custom.yaml down
```

### View Logs
```bash
docker-compose -f docker-compose.custom.yaml logs -f
```

### Restart Services
```bash
docker-compose -f docker-compose.custom.yaml restart
```

### Update and Rebuild
```bash
# Pull latest changes
git pull

# Rebuild images
docker-compose -f docker-compose.custom.yaml build --no-cache

# Restart services
docker-compose -f docker-compose.custom.yaml up -d
```

## 🔧 Features Included

### ✅ Default Model Configuration
- Set default models for OpenAI, Groq, Anthropic, and Gemini
- Models fall back to configured defaults when none selected
- Configurable via `config.toml`

### ✅ Model Indicator
- Shows current provider and model in the Navbar
- Updates dynamically when models change
- Format: "Provider • ModelName"

### ✅ Enhanced Settings
- Default model selection in settings page
- Provider-specific model configuration
- Real-time model switching

### ✅ SearxNG Integration
- Fixed endpoint configuration (port 8080)
- Proper networking between services
- Real-time search capabilities

## 📁 Directory Structure

```
├── config.toml              # Your configuration (DO NOT commit)
├── sample.config.toml       # Configuration template
├── docker-compose.custom.yaml  # Custom Docker Compose
├── Dockerfile.custom        # Custom Dockerfile
├── entrypoint.custom.sh     # Custom entrypoint
├── setup-docker.sh         # Setup script
├── README-CUSTOM-DOCKER.md # This file
├── searxng/               # SearxNG configuration
├── uploads/               # File upload directory
└── src/                  # Your source code with changes
```

## 🔐 Security Notes

- **Never commit `config.toml`** - it contains API keys
- The `.gitignore` file already excludes `config.toml`
- Use `sample.config.toml` as a template for new configurations
- Keep your API keys secure and never share them

## 🐛 Troubleshooting

### Port Conflicts
If ports 3000 or 4000 are already in use, modify the ports in `docker-compose.custom.yaml`:
```yaml
ports:
  - 3001:3000  # Change app port
```

### Database Issues
```bash
# Reset database volume
docker-compose -f docker-compose.custom.yaml down -v
docker-compose -f docker-compose.custom.yaml up -d
```

### Build Errors
```bash
# Clean build cache
docker system prune -a
docker-compose -f docker-compose.custom.yaml build --no-cache
```

### Configuration Issues
```bash
# Check configuration syntax
docker-compose -f docker-compose.custom.yaml config
```

## 🔄 Updates

To update with your latest changes:
```bash
# Commit your changes
git add .
git commit -m "Your commit message"
git push origin master

# Rebuild and restart
docker-compose -f docker-compose.custom.yaml build
docker-compose -f docker-compose.custom.yaml up -d
```

## 📊 Monitoring

### Resource Usage
```bash
docker stats
```

### Container Status
```bash
docker ps -a
```

### Disk Usage
```bash
docker system df
```

---

**Happy coding! 🎉**