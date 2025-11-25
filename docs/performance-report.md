# Cellcraft 性能优化报告

本报告总结了当前版本在运行时使用的主要性能优化手段，涵盖世界流式加载、渲染管线、生成流程以及玩家端画质控制策略。内容基于仓库现有实现，旨在帮助读者理解系统已经采取的性能措施。

## 1. 世界流式加载与任务调度
- **分块视距管理**：`ChunkManager` 按玩家位置计算需要加载的分块集合，并记录已加载键，便于精确计算增量加载/卸载列表。视距可配置，默认以 16×16 方块为一个分块。【F:src/class/ChunkManager.js†L6-L76】
- **距离/朝向优先级排序**：`World.updateChunks` 在计算出需加载列表后，根据玩家距离与朝向加权得分排序，再按每帧最多 4 个请求的上限发起生成，降低突发负载并优先加载视野前方内容。【F:src/class/World.js†L428-L507】
- **位置变化与时间节流**：分块检查受时间间隔与最小位移双重约束，减少高频微移动造成的重复请求。【F:src/class/World.js†L428-L455】
- **远距离低细节模式**：超出 `lowDetailRadius` 的分块以低细节标记发送给 Worker，跳过地下层生成，缩减远景块体数量。【F:src/class/World.js†L499-L503】【F:src/worker/terrainWorker.js†L13-L112】
- **卸载但保留数据**：视距外分块仅从场景移除 Mesh，不清空实例数据；回到视距内时可直接重渲染，避免重新生成方块集合。【F:src/class/World.js†L459-L507】
- **跨分块面裁剪同步**：新渲染的分块会触发邻近分块重渲染，以保证暴露面裁剪一致性，减少过绘。【F:src/class/World.js†L394-L414】

## 2. Web Worker 并行生成
- **地形生成移至 Worker**：`WorkerCoordinator` 初始化 `terrainWorker`，将分块生成请求排队，并在完成时移出 `pendingChunks` 集合，避免主线程阻塞。【F:src/core/WorkerCoordinator.js†L4-L88】
- **装饰/植被生成并行**：装饰生成由独立 `decorWorker` 处理，采用单次在途标记避免重复请求。【F:src/core/WorkerCoordinator.js†L37-L88】
- **缓存与打包传输**：Worker 端缓存 `Terrain` 配置并使用 `Int16Array/Uint16Array` 打包坐标与类型，连同缓冲区一起转移回主线程，降低拷贝和解析成本。【F:src/worker/terrainWorker.js†L31-L138】

## 3. 体素渲染优化
- **InstancedMesh 批量渲染**：同一变体和面掩码的方块实例通过 `THREE.InstancedMesh` 合批绘制，大幅减少 draw call。【F:src/voxel.js†L402-L516】
- **暴露面裁剪**：为立方体方块计算邻面暴露掩码，按掩码裁剪几何组，避免被遮挡的面进入渲染。【F:src/voxel.js†L460-L506】【F:src/voxel.js†L320-L400】
- **按渲染层分组**：方块实例按 `solid/alpha/water` 分层收集并分别渲染，透明层禁用深度写入，减少排序/混合开销，同时维持正确的透明显示。【F:src/voxel.js†L406-L516】
- **几何与材质缓存**：共享立方体几何与预生成的阶梯、半砖、火把等形状缓存，避免重复克隆；材质与纹理按类型缓存在 `materialsCache` 中，降低内存与创建开销。【F:src/voxel.js†L36-L118】【F:src/voxel.js†L402-L506】【F:src/voxel.js†L519-L606】
- **水面与火把特例处理**：顶部水面与内部水体使用不同材质变体控制透明度，火把拆分杆与火焰两组 instancing，避免为少量特效单独 draw call。【F:src/voxel.js†L213-L259】【F:src/voxel.js†L414-L456】

## 4. 生成与内容布局
- **种子驱动的可复现性**：统一的 `SeededRandom` 确保地形、村庄与装饰生成可复现，便于在不同设备上共享缓存或重放结果。【F:src/class/World.js†L21-L49】
- **Worker 裁剪与边界检查**：分块生成前在主线程校验世界边界，并在 Worker 内依据世界范围裁剪，有效避免无效块生成与传输。【F:src/class/World.js†L488-L507】【F:src/worker/terrainWorker.js†L13-L112】

## 5. 运行时画质与负载控制
- **性能/品质预设**：入口根据 URL 参数自动选择性能模式，调整抗锯齿、视距、草木数量与阴影类型，以适配低配设备。【F:src/main.js†L10-L82】
- **动态画质开关**：暂停菜单暴露视距、像素比、阴影与天气的实时调节，用户可在运行中降低渲染负载；像素比调节同时调用 `renderer.setSize` 以避免拉伸。【F:src/main.js†L226-L380】
- **天气与阴影按需启用**：默认关闭阴影与天气效果，避免高开销；天气渲染可在暂停菜单中关闭以减少粒子成本。【F:src/main.js†L28-L82】【F:src/main.js†L226-L380】

## 6. 用户体验相关的性能细节
- **FPS 监控与反馈**：在动画循环中统计 FPS 并传给天气系统，可用于动态调整粒子密度或开启提示，帮助在性能下降时做出反馈。【F:src/main.js†L153-L215】
- **窗口自适应缩放**：监听窗口变化时重新设置像素比与分辨率，保持渲染清晰度同时避免超采样带来的 GPU 压力。【F:src/main.js†L218-L224】

---
当前系统已经在加载、生成、渲染和用户控制层面落地了多项优化策略，可在保持较大世界规模的同时兼顾流畅度。后续可在此基础上进一步评估特定设备上的性能瓶颈并进行针对性改进。
