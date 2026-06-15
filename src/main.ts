import "./styles.css";

type Post = {
  title: string;
  date: string;
  slug: string;
  summary: string;
  tags: string[];
};

type LibraryItem = {
  title: string;
  note: string;
  href: string;
  meta: string;
};

const posts: Post[] = [
  {
    title: "Why Every AI Agent Is Playing a Turn-Based Game",
    date: "2026-04-12",
    slug: "why-every-ai-agent-is-playing-a-turn-based-game",
    summary:
      "Tool calls, model turns, fog of war, and why agent loops feel closer to games than chats.",
    tags: ["ai agents"],
  },
  {
    title: "Managing 15+ Repos with Claude Code via a Coordination Layer",
    date: "2026-03-27",
    slug: "managing-15-repos-with-claude-code-via-a-coordination-layer",
    summary:
      "What breaks when agent work spans many repos, and how a coordination layer keeps state sane.",
    tags: ["agents", "workflow"],
  },
  {
    title: "The Architecture Behind a Multi-Agent Claude Code System",
    date: "2026-03-24",
    slug: "the-architecture-behind-a-multi-agent-claude-code-system",
    summary:
      "Two planes, append-only state, session forking, and the boring parts that make agents usable.",
    tags: ["architecture", "agents"],
  },
  {
    title: "How We Manage Memory and Sessions for Long-Running Agents",
    date: "2026-03-24",
    slug: "how-we-manage-memory-and-sessions-for-long-running-agents",
    summary:
      "A practical look at context, memory, and session boundaries in agent systems that keep working.",
    tags: ["memory", "agents"],
  },
  {
    title: "Configuring Claude Code's Settings",
    date: "2026-03-28",
    slug: "configuring-claude-codes-settings",
    summary:
      "A short guide to the settings that change daily Claude Code usage more than people expect.",
    tags: ["claude code"],
  },
  {
    title: "We Replaced Every Tool Claude Code Has with a Custom Implementation",
    date: "2026-03-21",
    slug: "we-replaced-every-tool-claude-code-has-with-a-custom-implementation",
    summary:
      "What we learned after rebuilding the tool surface instead of treating it as a black box.",
    tags: ["tooling", "agents"],
  },
];

const library: LibraryItem[] = [
  {
    title: "Reading list coming soon",
    note:
      "Book PDFs can live under public/library and will be served directly by Cloudflare assets.",
    href: "/library/index.html",
    meta: "PDF shelf",
  },
];

const sortedPosts = [...posts].sort(
  (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
);

function postUrl(post: Post): string {
  const date = new Date(`${post.date}T00:00:00`);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  return `/${year}/${month}/${post.slug}/`;
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(`${date}T00:00:00`));
}

function pixelAvatar(): string {
  const rows = [
    ".....hhhhhh.....",
    "....hhhhhhhh....",
    "...hhsssssshh...",
    "...hssssssssh...",
    "...hssssssssh...",
    "...ssxxxxxxss...",
    "...ssxllxllxss..",
    "...ssxllxllxss..",
    "...sssssdssss...",
    "...ssssmmssss...",
    "...ssssssssss...",
    "....ssssssss....",
    ".....ssssss.....",
    ".....cccccc.....",
    "....cccccccc....",
    "...cccccccccc...",
  ];

  const colors: Record<string, string> = {
    h: "#17130f",
    s: "#d9b08b",
    d: "#a76f50",
    x: "#101010",
    l: "#f3dfc7",
    m: "#8f3f36",
    c: "#1d2a34",
  };

  const pixels = rows
    .join("")
    .split("")
    .map((cell) => {
      if (cell === ".") {
        return `<span class="pixel transparent"></span>`;
      }
      return `<span class="pixel" style="--pixel:${colors[cell]}"></span>`;
    })
    .join("");

  return `<div class="pixel-avatar" aria-label="Pixel portrait of Neil">${pixels}</div>`;
}

function renderHome(): string {
  return `
    <main>
      <section class="hero" aria-labelledby="hero-title">
        <div class="hero-copy">
          <p class="eyebrow">Neil</p>
          <h1 id="hero-title">I build small teams that make serious software.</h1>
          <p class="lede">
            I build FlickNote and Lenos: tools for notes, agents, and software teams.
            Before that, I worked on production software at Huawei.
          </p>
          <div class="hero-actions" aria-label="Primary links">
            <a href="https://flicknote.app">FlickNote</a>
            <a href="https://tta-lab.github.io/lenos-website/">Lenos</a>
            <a href="https://github.com/tta-lab">tta-lab</a>
            <a href="https://github.com/GuionAI">GuionAI</a>
            <a href="mailto:neil@flicknote.app">Email</a>
          </div>
        </div>
        <div class="portrait-panel">
          ${pixelAvatar()}
          <p>Thin face. Glasses. Usually debugging something that was supposed to be simple.</p>
        </div>
      </section>

      <section class="band intro-grid" aria-label="Profile summary">
        <div>
          <h2>Work</h2>
          <p>
            I care about tools that help people keep context: notes, agents,
            code, and the boring systems that make all of it reliable.
          </p>
        </div>
        <div>
          <h2>Current</h2>
          <p>
            FlickNote keeps personal context close. Lenos explores how agents
            should work when the job spans repos, sessions, and time.
          </p>
        </div>
        <div>
          <h2>Style</h2>
          <p>
            Clear writing. Small surfaces. Hard engineering under a quiet UI.
            Less theater, more signal.
          </p>
        </div>
      </section>

      <section class="resume-section" aria-labelledby="resume-title">
        <div class="section-heading">
          <p class="eyebrow">Resume</p>
          <h2 id="resume-title">The short version</h2>
        </div>
        <div class="timeline">
          <article>
            <span>2025 - now</span>
            <h3>Building FlickNote + Lenos</h3>
            <p>
              Building agent-native products and the workflow around them:
              capture, review, delegation, and shipping.
            </p>
          </article>
          <article>
            <span>2024 - 2025</span>
            <h3>M.S. Computer Science, Illinois Tech</h3>
            <p>
              Focused on human-computer interaction, systems, and the product
              questions behind technical choices.
            </p>
          </article>
          <article>
            <span>2021 - 2024</span>
            <h3>Software Engineer, Huawei</h3>
            <p>
              Worked from web development into cloud and Kubernetes. Learned
              what production discipline feels like at scale.
            </p>
          </article>
          <article>
            <span>2017 - 2021</span>
            <h3>B.Eng. Computer Science, SUSTech</h3>
            <p>
              English-taught courses, hard assignments, research, internships,
              and enough room to choose after real experience.
            </p>
          </article>
        </div>
      </section>

      <section class="writing-section" aria-labelledby="writing-title">
        <div class="section-heading">
          <p class="eyebrow">Writing</p>
          <h2 id="writing-title">Posts</h2>
        </div>
        <div class="post-list">
          ${sortedPosts
            .map(
              (post) => `
                <a class="post-row" href="${postUrl(post)}">
                  <time>${formatDate(post.date)}</time>
                  <span>
                    <strong>${post.title}</strong>
                    <em>${post.summary}</em>
                  </span>
                  <small>${post.tags.join(" / ")}</small>
                </a>
              `,
            )
            .join("")}
        </div>
      </section>

      <section class="library-section" aria-labelledby="library-title">
        <div class="section-heading">
          <p class="eyebrow">Library</p>
          <h2 id="library-title">Shared PDFs</h2>
        </div>
        <div class="library-list">
          ${library
            .map(
              (item) => `
                <a class="library-row" href="${item.href}">
                  <span>
                    <strong>${item.title}</strong>
                    <em>${item.note}</em>
                  </span>
                  <small>${item.meta}</small>
                </a>
              `,
            )
            .join("")}
        </div>
      </section>
    </main>
  `;
}

function renderPost(): string {
  const currentPath = window.location.pathname;
  const post = sortedPosts.find((entry) => postUrl(entry) === currentPath);

  if (!post) {
    return renderHome();
  }

  return `
    <main class="article-shell">
      <a class="back-link" href="/">Back</a>
      <article class="article">
        <p class="eyebrow">${formatDate(post.date)}</p>
        <h1>${post.title}</h1>
        <p class="lede">${post.summary}</p>
        <div class="article-placeholder">
          <p>
            This route is ready for the post. Add the article body here, or
            replace the static data with Markdown when the writing archive is ready.
          </p>
        </div>
      </article>
    </main>
  `;
}

const app = document.querySelector<HTMLDivElement>("#app");

if (app) {
  app.innerHTML = window.location.pathname === "/" ? renderHome() : renderPost();
}
