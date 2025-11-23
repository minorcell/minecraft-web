/**
 * 集中管理建筑和装饰的配置，便于扩展/替换
 */
export function getBuildingConfig() {
    return [
        // 仅保留民居，安全删除其他建筑类型
        { type: null, name: 'House', count: 10, priority: 1, distanceRange: [0.2, 0.8] }
    ]
}

/**
 * 将具体类注入配置，保持配置数据与实现解耦
 */
export function wireBuildingTypes(buildingTypes) {
    const map = {
        House: buildingTypes.House
    }
    return getBuildingConfig().map(cfg => ({
        ...cfg,
        type: map[cfg.name]
    })).filter(cfg => !!cfg.type)
}
