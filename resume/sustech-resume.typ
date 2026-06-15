#set page(
  paper: "a4",
  margin: (x: 1.25cm, y: 1.12cm),
)

#set text(
  font: ("Noto Serif CJK SC", "Libertinus Serif"),
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
  #text(fill: muted)[南方科技大学 2021 届计算机科学与技术 · 前华为软件工程师 · FlickNote / Lenos 创业者]
  #v(0.18em)
  #text(size: 8.8pt)[
    Email: #link("mailto:neil@flicknote.app")[neil\@flicknote.app] · WeChat: neiloi ·
    Website: #link("https://neil.guion.io")[neil.guion.io]
  ]
]

#section[个人简介]

南方科技大学计算机科学与技术专业 2021 届校友。毕业后在华为担任软件工程师，参与 Web GIS 可视化、云计算与 Kubernetes 相关工程；之后赴 Illinois Institute of Technology 学习计算机科学，并回国创业做 FlickNote 与 Lenos。关注个人知识工具、agent-native 软件工程，以及 AI 时代学生如何做长期选择。

#section[教育经历]

#item(
  [南方科技大学 · 计算机科学与技术 · 学士],
  [2017 - 2021],
)[
- 经历南科大 2+2 培养模式，在多方向课程、科研和实习体验后确定深入计算机方向。
- 计算机系课程重视理论与实践结合，全英文授课训练了直接阅读英文文档、论文和一手技术讨论的能力。
]

#item(
  [Illinois Institute of Technology · Computer Science],
  [2024.08 - 2025.06],
)[
- 硕士阶段学习计算机系统、人机交互、研究方法与实验设计；在人机交互相关课题组中负责增强现实社交项目。
]

#section[工作与创业经历]

#item(
  [FlickNote / Lenos · 创业者],
  [2025 - 至今],
)[
- FlickNote 面向灵感记录、生活管理、会议纪要、课堂笔记等场景，目标是成为随身 agent：先接住信息，再帮助整理和回看。
- Lenos 探索 AI agent 在软件工程中的协作方式，关注跨仓库任务、长期会话、任务分解、审查与交付。
- 当前一个人配合 AI agent 维护 33 个活跃项目、约 63 万行代码，验证小团队在 AI 编程时代的工程边界。
]

#item(
  [华为技术有限公司 · 软件工程师（15 级）],
  [2021.07 - 2024.01],
)[
- 入职后进入此前未接触过的地理信息大屏可视化方向，快速完成复杂配置页面，并在团队变化后独立承接多条业务线前端交付。
- 维护团队开源依赖，分析主流地图厂商底层渲染机制，从零实现适配多家地图提供商的截图库，替代退出生命周期的开源组件。
- 后续从 Web 开发转向云计算与 Kubernetes 相关工程，接受大规模工程、跨团队协作和稳定性交付训练。
]

#section[代表项目与链接]

#item(
  [FlickNote],
  [#link("https://flicknote.app")[flicknote.app]],
)[
- 面向学习、工作和生活场景的随身 agent，帮助用户记录、整理并回看重要信息；产品判断不只关注技术实现，也关注用户是否真的需要。
]

#item(
  [Lenos],
  [#link("https://tta-lab.github.io/lenos-website/")[tta-lab.github.io/lenos-website]],
)[
- 面向 agent-native 软件工程的实验项目，研究多个 AI agent 如何围绕任务、代码仓库、长期上下文、代码审查与交付协作。
]

#section[可分享主题]

- 南科大 2+2、全英文授课、计算机系课程训练，对工程能力和生涯选择的影响。
- 从华为大规模工程到 AI agent 协作：工程纪律、任务拆分和审查机制为什么仍然重要。
- AI 能提高执行效率，但不能替代兴趣、体验、判断和长期坚持。
