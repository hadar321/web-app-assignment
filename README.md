# Project Name

## Description
Brief description of your project.

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm

### Installation
```bash
npm install
```

### Running the Project
```bash
npm start
```

### AI Semantic Search
Semantic search uses Hugging Face for both embeddings and answer generation.

Configure your Hugging Face settings:
```bash
HUGGINGFACE_API_KEY=your_huggingface_api_key
HUGGINGFACE_EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
HUGGINGFACE_TEXT_MODEL=google/flan-t5-small
```

The service performs at most one Hugging Face call every 3 seconds.

Use the semantic search endpoint:
```bash
GET /posts/search?q=your+query
```

## Project Structure
```
src/           - Source code
public/        - Static assets
package.json   - Project dependencies
```

## Features
- [ ] Feature 1
- [ ] Feature 2

## License
MIT
