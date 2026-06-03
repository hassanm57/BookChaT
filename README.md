<!-- Improved compatibility of back to top link: See: https://github.com/othneildrew/Best-README-Template/pull/73 -->
<a id="readme-top"></a>

<!-- PROJECT SHIELDS -->
[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![LinkedIn][linkedin-shield]][linkedin-url]



<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/hassanm57/BookChaT">
    <img src="rag-books/frontend/public/logo.png" alt="Logo" width="80" height="80">
  </a>

<h3 align="center">Folio</h3>

  <p align="center">
    Chat with any PDF. Upload your books, ask questions, and get answers with clickable citations that jump straight to the page.
    <br />
    <br />
    <a href="https://github.com/hassanm57/BookChaT">View Demo</a>
    &middot;
    <a href="https://github.com/hassanm57/BookChaT/issues/new?labels=bug&template=bug-report---.md">Report Bug</a>
    &middot;
    <a href="https://github.com/hassanm57/BookChaT/issues/new?labels=enhancement&template=feature-request---.md">Request Feature</a>
  </p>
</div>



<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>



<!-- ABOUT THE PROJECT -->
## About The Project

[![Folio Screenshot][product-screenshot]](https://github.com/hassanm57/BookChaT)

Folio is a RAG-powered PDF chat application. Upload any PDF — a textbook, novel, research paper — and have a real conversation with it. Answers stream in real time, every claim is backed by a citation chip that navigates the embedded PDF viewer directly to that page, and follow-up question suggestions appear after each response.

**Key features:**
- Upload and manage a personal library of PDFs
- Streaming chat with clickable page citations
- Embedded PDF viewer — click a citation, the page opens right beside the answer
- Hybrid retrieval (dense vector search + BM25, fused via Reciprocal Rank Fusion)
- Multi-layer Redis caching — repeat questions answer in ~1s with zero API cost
- Supabase Auth with Google OAuth and per-user isolated collections
- Fully animated UI built with Framer Motion

<p align="right">(<a href="#readme-top">back to top</a>)</p>



### Built With

* [![FastAPI][FastAPI-badge]][FastAPI-url]
* [![React][React.js]][React-url]
* [![TypeScript][TypeScript-badge]][TypeScript-url]
* [![Vite][Vite-badge]][Vite-url]
* [![Supabase][Supabase-badge]][Supabase-url]
* [![OpenAI][OpenAI-badge]][OpenAI-url]
* [![Redis][Redis-badge]][Redis-url]
* [![Docker][Docker-badge]][Docker-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- GETTING STARTED -->
## Getting Started

### Prerequisites

- Python 3.12
- Node.js 18+
- Docker (for Qdrant and Redis)
- A Supabase project
- An OpenAI API key

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/hassanm57/BookChaT.git
   cd BookChaT
   ```

2. Create the root `.env` file
   ```sh
   OPENAI_API_KEY=your_key
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

3. Create `rag-books/frontend/.env.local`
   ```sh
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

4. Start Qdrant and Redis
   ```sh
   docker-compose -f rag-books/docker-compose.yml up -d
   ```

5. Set up the Python environment
   ```sh
   python3.12 -m venv venv
   source venv/bin/activate
   pip install -r rag-books/requirements.txt
   ```

6. Install frontend dependencies
   ```sh
   cd rag-books/frontend && npm install
   ```

7. Create the Supabase `books` table
   ```sql
   create table books (
     id           bigserial primary key,
     user_id      uuid references auth.users not null,
     book_id      text not null unique,
     title        text not null,
     author       text not null,
     genre        text not null default 'General',
     pdf_filename text not null,
     cover_image  text,
     status       text not null default 'ready',
     created_at   timestamptz default now()
   );
   alter table books enable row level security;
   create policy "users own their books" on books
     for all using (auth.uid() = user_id);
   ```

8. Start the API server
   ```sh
   cd rag-books && uvicorn backend.main:app --reload --port 8000
   ```

9. Start the frontend
   ```sh
   cd rag-books/frontend && npm run dev
   ```

   Open [http://localhost:5173](http://localhost:5173)

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- USAGE EXAMPLES -->
## Usage

**Upload a PDF** — Click the upload button in your Library, enter the title and author, and Folio ingests it in the background. The card updates live when processing is complete.

**Chat with a book** — Click any book to open the chat. Ask anything — summaries, specific quotes, character analysis, thematic questions. Answers cite the exact pages they draw from.

**Navigate citations** — Click any citation chip (e.g. `p.42`) to jump the embedded PDF viewer directly to that page.

**Follow-up suggestions** — After each answer, three follow-up questions appear based on what was just discussed. Click one to send it instantly.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- ROADMAP -->
## Roadmap

- [x] PDF upload with background ingestion pipeline
- [x] Hybrid retrieval — dense vector search + BM25 + Reciprocal Rank Fusion
- [x] Streaming chat with real-time SSE citations
- [x] Embedded PDF viewer with citation-to-page navigation
- [x] Supabase Auth — email + Google OAuth
- [x] Per-user isolated book collections with Supabase RLS
- [x] Multi-layer Redis caching — PDF URLs, book metadata, full RAG answers
- [x] Rate limiting on all API endpoints
- [ ] Stripe payments — Pro plan
- [ ] Highlight the exact passage in the PDF viewer
- [ ] Multi-PDF chat — ask across your entire library
- [ ] Mobile layout

See the [open issues](https://github.com/hassanm57/BookChaT/issues) for a full list of proposed features and known issues.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- CONTRIBUTING -->
## Contributing

Contributions are welcome. If you have a suggestion or find a bug, please open an issue or submit a pull request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Top contributors:

<a href="https://github.com/hassanm57/BookChaT/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=hassanm57/BookChaT" alt="contrib.rocks image" />
</a>



<!-- CONTACT -->
## Contact

Hassan Mansoor — hassanmansoor1569@gmail.com

Project Link: [https://github.com/hassanm57/BookChaT](https://github.com/hassanm57/BookChaT)

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- ACKNOWLEDGMENTS -->
## Acknowledgments

* [Qdrant](https://qdrant.tech/) — vector database for semantic search
* [SentenceTransformers](https://www.sbert.net/) — `all-MiniLM-L6-v2` embeddings
* [rank-bm25](https://github.com/dorianbrown/rank_bm25) — BM25 sparse retrieval
* [Framer Motion](https://www.framer.com/motion/) — animations throughout the UI
* [Best-README-Template](https://github.com/othneildrew/Best-README-Template)

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- MARKDOWN LINKS & IMAGES -->
[contributors-shield]: https://img.shields.io/github/contributors/hassanm57/BookChaT.svg?style=for-the-badge
[contributors-url]: https://github.com/hassanm57/BookChaT/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/hassanm57/BookChaT.svg?style=for-the-badge
[forks-url]: https://github.com/hassanm57/BookChaT/network/members
[stars-shield]: https://img.shields.io/github/stars/hassanm57/BookChaT.svg?style=for-the-badge
[stars-url]: https://github.com/hassanm57/BookChaT/stargazers
[issues-shield]: https://img.shields.io/github/issues/hassanm57/BookChaT.svg?style=for-the-badge
[issues-url]: https://github.com/hassanm57/BookChaT/issues
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://linkedin.com/in/linkedin_username
[product-screenshot]: images/screenshot.png

[FastAPI-badge]: https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi
[FastAPI-url]: https://fastapi.tiangolo.com/
[React.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://reactjs.org/
[TypeScript-badge]: https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white
[TypeScript-url]: https://www.typescriptlang.org/
[Vite-badge]: https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white
[Vite-url]: https://vitejs.dev/
[Supabase-badge]: https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white
[Supabase-url]: https://supabase.com/
[OpenAI-badge]: https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white
[OpenAI-url]: https://openai.com/
[Redis-badge]: https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white
[Redis-url]: https://redis.io/
[Docker-badge]: https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white
[Docker-url]: https://www.docker.com/
