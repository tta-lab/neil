#set page(
  paper: "a4",
  margin: (x: 1.25cm, y: 1.12cm),
)

#set text(
  font: ("Source Han Serif SC", "Libertinus Serif"),
  size: 9.25pt,
  lang: "zh",
)

#set par(justify: true, leading: 0.45em)
#set list(indent: 1em, body-indent: 0.35em)

#let accent = rgb("#9b2f1f")
#let muted = rgb("#66605a")
#let rule = rgb("#d8cec0")

#let section(title) = {
  v(0.5em)
  text(fill: accent, weight: "bold", size: 10.4pt)[#title]
  v(0.12em)
  line(length: 100%, stroke: 0.55pt + rule)
  v(0.22em)
}

#let item(title, meta, body) = {
  grid(
    columns: (1fr, auto),
    gutter: 1em,
    text(weight: "bold")[#title],
    text(fill: muted, size: 9.3pt)[#meta],
  )
  v(0.02em)
  body
}

#align(center)[
  #text(size: 17pt, weight: "bold")[张跃飞]
  #v(0.12em)
  #text(fill: muted)[南方科技大学 2021 届计算机科学与技术 · 前华为软件工程师 · GuionAI 联合创始人]
  #v(0.18em)
  #text(size: 8.8pt)[
    Email: #link("mailto:neil@flicknote.app")[neil\@flicknote.app] · WeChat: neiloi ·
    Website: #link("https://neil.guion.io")[neil.guion.io]
  ]
]

#section[个人简介]

南方科技大学计算机科学与技术专业 2021 届校友。毕业后在华为做软件工程，先做 Web GIS 可视化，后来转向云计算和 Kubernetes。2023 年起在职修读 Illinois Institute of Technology 计算机科学硕士课程，2024 年赴美国完成剩余课程。现在是 GuionAI 联合创始人，做 FlickNote 和 Lenos，关注个人知识工具、agent-native 软件工程，以及 AI 时代学生怎样做长期选择。

#section[教育经历]

#item(
  [南方科技大学 · 计算机科学与技术 · 学士],
  [2017 - 2021],
)[
- 通过 1+3 培养模式，在真正上过不同方向的课、做过科研和实习之后，决定深入计算机。
- 计算机系不少作业没有现成模板，需要自己拆问题、查资料、设计方案，再一轮轮改到能跑。
- 全英文授课让我更早习惯直接读英文文档、论文、标准和论坛讨论。
]

#item(
  [Illinois Institute of Technology · Master of Applied Computer Science (MACS)],
  [2023 - 2025],
)[
- 2023 年在华为工作期间开始通过线上课程修读硕士项目，2024 年赴美国完成后续课程。
- 课程方向包括分布式计算、人机交互、研究方法与实验设计。
- 在 SSIL（Social Spatial Interaction Lab）参与 AR interaction research，做增强现实社交项目。
]

#section[工作与创业经历]

#item(
  [GuionAI · 联合创始人],
  [2025 - 至今],
)[
- FlickNote 做灵感记录、生活管理、会议纪要和课堂笔记，希望把零散信息变成之后还能找回、还能继续用的东西。
- Lenos 研究 AI agent 怎么参与真实软件工程：跨仓库任务、长期会话、任务分解、代码审查和交付。
- 现在一个人配合 AI agent 维护 33 个活跃项目、约 63 万行代码。这个数字不是为了好看，主要是逼着系统经受真实工程压力。
]

#item(
  [华为技术有限公司 · 软件工程师（15 级）],
  [2021.07 - 2024.01],
)[
- 入职后进入此前没有接触过的地理信息大屏可视化方向，第一个月完成复杂配置页面；导师离职后，独立承接多条业务线前端交付。
- 负责团队开源依赖，分析主流地图厂商底层渲染机制，从零实现适配多家地图提供商的截图库，替代退出生命周期的开源组件。
- 后来从 Web 开发转向云计算和 Kubernetes 相关工程，开始更多接触大规模工程里的任务拆分、协作和稳定性交付。
]

#section[代表项目与链接]

#item(
  [FlickNote],
  [#link("https://flicknote.app")[flicknote.app]],
)[
- 一个学习、工作和生活里都能用的随身 agent。它不只是记笔记，更关心一件事：信息过了一周、一个月之后，还能不能帮上忙。
]

#item(
  [Lenos],
  [#link("https://tta-lab.github.io/lenos-website/")[tta-lab.github.io/lenos-website]],
)[
- agent-native 软件工程实验项目，研究多个 AI agent 如何围绕任务、代码仓库、长期上下文、代码审查和交付协作。
]

#section[分享主题]

- 南科大 1+3、全英文授课、计算机系课程训练，对工程能力和生涯选择的影响。
- 从华为大规模工程到 AI agent 协作：工程纪律、任务拆分和审查机制为什么仍然重要。
- AI 能提高执行效率，但不能替代兴趣、体验、判断和长期坚持。
