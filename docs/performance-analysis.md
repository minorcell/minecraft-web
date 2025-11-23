# 性能分析与优化建议

本文基于当前代码（2024-xx）对渲染、分块/Worker、内存与内容规模进行性能扫描，并给出优先级优化方案。

## 结论速览

- **GPU 资源未释放**：`src/core/RenderCoordinator.js` 卸载 chunk 只从场景移除 mesh，未 `dispose` 几何/材质；同时 `VoxelBuilder.instances` 在卸载时保留块数据，长时间游走会持续占用显存与内存。
- **远距仍生成全细节**：`src/class/World.js` 在 `updateChunks` 计算了 `lowDetail`，但 `requestChunkFromWorker` 没有把该标志传给 `WorkerCoordinator`，远处 chunk 依旧生成地下层 + 全水层。
- **渲染负荷偏高**：默认视距 6（≈169 个 chunk 同屏）、抗锯齿开启、阴影贴图 2048² 且所有固体实例都 `castShadow/receiveShadow`；未限制 `renderer.setPixelRatio`，在高 DPI 屏幕上渲染分辨率翻倍。
- **视锥裁剪无效**：InstancedMesh 未设置 chunk 级包围体，默认只使用单个立方体的包围球，导致 chunk 基本不会被裁剪（或在远离原点时整块被一次性裁掉），GPU 需要绘制视距内几乎所有实例。
- **内容密度大**：每个 chunk 约 16×16×(地形高度+水层)，视距 6 时 ~1M 级实例；再叠加 `WeatherSystem` 每帧更新的 700 雨滴 / 520 雪花，低端机容易掉帧。

## 主要问题拆解

- **渲染 / GPU**
  - `renderer` 未设置像素比上限；`DirectionalLight` 阴影贴图 2048²，`VoxelBuilder.render` 为所有 solid 实例开启阴影，透明层也参与深度测试，填充率与 draw calls 均偏高。
  - Chunk InstancedMesh 未使用 chunk 尺寸的包围盒/球，视锥裁剪近似失效；在视距 6 时几乎所有 chunk 都被提交给 GPU。
- **分块 / Worker**
  - `World.updateChunks` 计算出的 `lowDetail` 未传递给 `WorkerCoordinator.requestChunk`（`src/class/World.js`），worker 端始终按全细节生成，增加传输与主线程构建成本。
  - `maxChunkRequestsPerTick=4` 已做限流，但 `rerenderAdjacentChunks` 会让每个新 chunk 触发邻居重建 InstancedMesh，一帧内可能重复创建多个 mesh。
- **内存 / 资源回收**
  - `RenderCoordinator.unloadChunk` 仅 `scene.remove`，没有 `geometry.dispose()` / `material.dispose()`；频繁卸载/重载 chunk 会积累显存。
  - 卸载 chunk 时未调用 `VoxelBuilder.clearChunk`，数据留在 `instances` 与 `registry`，探索越久内存越大。
- **内容规模与特效**
  - 默认视距 6、`treeCount=520`、`grassCount=900`，水面/地下层仍全量生成，基数大。
  - 天气粒子：雨 700、雪 520，且总是启用；在阴影 + 高 DPI 下容易成为瓶颈。

## 优化方案（按优先级）

### 1) 即时可落地（低风险）

- **像素比与分辨率**：在 `src/main.js` 调用 `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))`，并提供“性能模式”开关禁用抗锯齿。
- **阴影预算**：将 `dirLight.shadow.mapSize` 降到 1024 或在性能模式下关闭实例阴影（只让关键体素投射，或禁用透明层的 `receiveShadow`）。必要时切换 `renderer.shadowMap.type` 为 `BasicShadowMap`。
- **默认世界参数分档**：添加性能预设：`viewDistance 4`、`treeCount≈300`、`grassCount≈500`，并在低端设备关闭雨雪或把雨雪数量减半。
- **天气开关**：在 UI/配置中允许关闭天气更新；或按 FPS 自动降级粒子数量/更新频率。

### 2) 必做修复（中等工作量）

- **正确传递低细节标志**：让 `World.requestChunkFromWorker` 接收 `lowDetail` 并传给 `WorkerCoordinator.requestChunk`，worker 侧已有 `lowDetail` 支持（会跳过地下层），直接减少远处 chunk 的数据量和传输量。
- **Chunk 卸载释放资源**：在 `RenderCoordinator.unloadChunk` 对 InstancedMesh 的 `geometry/material` 调 `dispose()`；并在卸载时调用 `voxelBuilder.clearChunk` 或增加 LRU，避免 `instances` 和 `BlockStore` 无限增长。
- **视锥裁剪回归**：为每个 chunk mesh 设置包围体（中心在 chunk 中心，半径约 `chunkSize*0.9`），或在创建 mesh 时 `mesh.geometry.boundingSphere = ...`；确保裁剪按 chunk 生效，减少 GPU 提交。

### 3) 进一步优化（迭代规划）

- **阴影分级**：仅对玩家附近 N 个 chunk 启用阴影；远处 chunk 禁用阴影或用低精度贴图。
- **InstancedMesh 合批策略**：将同类型/同渲染层的实例跨 chunk 合批，减少 draw calls；或将方块纹理打成 atlas，降低材质数量。
- **生成侧裁剪**：对视距边界以外的 chunk 只生成地表 + 一层水（现有 `lowDetail` 可扩展）；极远处完全跳过生成。
- **可观测性**：在调试 HUD 输出 `renderer.info.render.calls/triangles`、当前加载 chunk 数、GPU 内存占用，便于回归测试。

## 推荐执行顺序

1. 补齐 `lowDetail` 传递 + chunk 资源释放（阻断内存/显存泄漏）。
2. 加像素比上限 + 阴影分档 + 性能预设，验证 FPS 变化。
3. 为 chunk mesh 添加包围体恢复裁剪，记录 `draw calls`/`triangles` 下降幅度。
4. 根据瓶颈决定是否推进纹理图集/跨 chunk 合批。
