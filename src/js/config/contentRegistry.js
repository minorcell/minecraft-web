/**
 * 集中管理建筑和装饰的配置，便于扩展/替换
 */
export function getBuildingConfig() {
    return [
        { type: null, name: 'TownHall', count: 1, priority: 1, distanceRange: [0, 0.2] },
        { type: null, name: 'Tower', count: 1, priority: 2, distanceRange: [0.5, 0.8] },
        { type: null, name: 'Blacksmith', count: 1, priority: 3, distanceRange: [0.2, 0.5] },
        { type: null, name: 'House', count: 3, priority: 4, distanceRange: [0.2, 0.5] },
        { type: null, name: 'Barn', count: 2, priority: 5, distanceRange: [0.4, 0.7] },
        { type: null, name: 'Storage', count: 2, priority: 6, distanceRange: [0.3, 0.6] }
    ]
}

/**
 * 将具体类注入配置，保持配置数据与实现解耦
 */
export function wireBuildingTypes(buildingTypes) {
    const map = {
        TownHall: buildingTypes.TownHall,
        Tower: buildingTypes.Tower,
        Blacksmith: buildingTypes.Blacksmith,
        House: buildingTypes.House,
        Barn: buildingTypes.Barn,
        Storage: buildingTypes.Storage
    }
    return getBuildingConfig().map(cfg => ({
        ...cfg,
        type: map[cfg.name]
    })).filter(cfg => !!cfg.type)
}
