# 🧱 Cellcraft

<div align="center">

**一个受 Minecraft 启发的 3D 体素世界生成器**
基于 Three.js 构建，支持程序化地形、村庄生成、方块交互和天气系统

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Three.js](https://img.shields.io/badge/Three.js-160.0-000000?logo=three.js&logoColor=white)](https://threejs.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6%2B-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

[**🌐 在线体验**](http://craft.mcell.top/) • [**📖 文档**](./CLAUDE.md) • [🎮 快速开始](#-快速开始)

</div>

---

⚠️ **免责声明**: 本项目仅为学习目的而创建，灵感来源于 Minecraft 概念。本项目**不隶属于** Mojang Studios 或 Microsoft，与 Minecraft 官方无关。所有"Minecraft"相关商标和版权归其各自所有者所有。本项目**不包含**任何原版游戏资源，仅使用程序生成的原创内容。请勿用于商业用途。

---

## ✨ 特色功能

🌍 **程序化地形** - 多层 Perlin 噪声生物群系
🏘️ **智能村庄** - 6 种建筑类型径向布局
🎮 **方块交互** - 放置/破坏，27 格库存管理
🌦️ **动态天气** - 雨雪粒子，时间系统光照
👤 **第一人称** - WASD 移动，鼠标视角
⚡ **性能优化** - 分块加载，Web Workers 多线程

---

## 🚀 快速开始

## 🎮 操作指南

| 按键            | 功能         |
| --------------- | ------------ |
| `W` `A` `S` `D` | 移动         |
| `鼠标`          | 视角旋转     |
| `左键`          | 破坏方块     |
| `右键`          | 放置方块     |
| `1-9`           | 选择库存槽位 |

---

## 🏗️ 技术架构

```
┌─────────────────┐
│   World Manager │
│                 │
│ ┌─────────────┐ │
│ │ Chunk System│ │  ← 16x16 分块加载
│ └─────────────┘ │
│                 │
│ ┌─────────────┐ │
│ │   Workers   │ │  ← 多线程生成
│ └─────────────┘ │
│                 │
│ ┌─────────────┐ │
│ │   Voxels    │ │  ← InstancedMesh 渲染
│ └─────────────┘ │
└─────────────────┘
```

### 技术栈

- **渲染引擎**: Three.js v0.160.0
- **噪声算法**: Simplex Noise v4.0.1
- **多线程**: Web Workers
- **模块系统**: ES6 Modules
- **无构建**: 原生浏览器支持

---

## 🌟 项目亮点

- 🌍 **程序化生成**: 多层 Perlin 噪声，自然生物群系
- 🏘️ **村庄系统**: 6 种建筑，径向分布，智能防重叠
- 🎮 **方块交互**: 射线检测，实时放置/破坏
- 🌦️ **天气效果**: 雨雪粒子，动态光照系统
- ⚡ **性能优化**: 分块加载，Workers 多线程，InstancedMesh

---

## 📊 项目统计

**代码规模**: 17 个核心类 • 30+文件 • 3 个 Workers • 9 种材质
**生成能力**: 512×512 世界 • 8+村庄 • 50+建筑 • 2000+装饰

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 项目 → 2. 创建分支 → 3. 提交更改 → 4. 推送 → 5. 提交 PR

---

## 📜 开源协议

本项目基于 [MIT License](LICENSE) 开源协议

**Made with ❤️ by [mcell](https://github.com/mcell)**
