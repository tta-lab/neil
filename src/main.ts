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
    title: "Why Non-Technical Decisions Matter More Than Code",
    date: "2026-06-13",
    slug: "why-non-technical-decisions-matter-more-than-code",
    summary:
      "A note on product judgment, tradeoffs, and the work that code alone cannot finish.",
    tags: ["product", "agents"],
  },
  {
    title: "Building With Agents Without Losing Taste",
    date: "2026-06-02",
    slug: "building-with-agents-without-losing-taste",
    summary:
      "How I use agents as teammates while keeping direction, review, and taste close to the work.",
    tags: ["engineering", "ai"],
  },
  {
    title: "From Notes to a Portable Agent",
    date: "2026-05-18",
    slug: "from-notes-to-a-portable-agent",
    summary:
      "FlickNote started from a small irritation: note-taking kept breaking my train of thought.",
    tags: ["flicknote", "design"],
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
    "....hhhhhhhh....",
    "...hhhhhhhhhh...",
    "..hhbbbbbbbbhh..",
    "..hbssssssssbh..",
    ".hbssfssssssbh..",
    ".hbssffffffsbh..",
    ".hbsgggssgggsbh.",
    ".hbsgggooggssbh.",
    ".hbssssnnssssbh.",
    ".hbsssmmmmsssbh.",
    "..hbssmmmmmssb..",
    "..hbbssssssbbh..",
    "...hhbbbbbbhh...",
    "....hhcccccc....",
    "...cccccccccc...",
    "..cccccccccccc..",
  ];

  const colors: Record<string, string> = {
    h: "#17130f",
    b: "#2a1f18",
    s: "#d6ae89",
    f: "#e6c2a0",
    g: "#111111",
    o: "#f6efe4",
    n: "#8d563c",
    m: "#6d3f32",
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

  return `<div class="pixel-avatar" aria-label="Pixel portrait of Neil Zhang">${pixels}</div>`;
}

function renderHome(): string {
  return `
    <main>
      <section class="hero" aria-labelledby="hero-title">
        <div class="hero-copy">
          <p class="eyebrow">Neil Zhang / 张跃飞</p>
          <h1 id="hero-title">I build small teams that make serious software.</h1>
          <p class="lede">
            Founder building FlickNote and TTAL. Former Huawei engineer.
            SUSTech computer science, Illinois Tech CS.
          </p>
          <div class="hero-actions" aria-label="Primary links">
            <a href="https://flicknote.app">FlickNote</a>
            <a href="https://git.guion.io/neil">Code</a>
            <a href="mailto:neil@guion.io">Email</a>
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
            code review, and the boring systems that make all of it reliable.
          </p>
        </div>
        <div>
          <h2>Current</h2>
          <p>
            FlickNote is becoming a portable agent for ideas, life management,
            meeting notes, and classroom notes.
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
            <h3>Founder, FlickNote + TTAL</h3>
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
