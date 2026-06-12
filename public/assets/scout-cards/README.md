24 张 Archetype 球星卡主视觉。

## 规格

- **尺寸**：800×1200（2:3 竖版）
- **透明底**：盾形外轮廓外为真透明 alpha
- **命名**：`{ArchetypeID}.png`（如 `F5_PO.png`）
- **B 版备选**（高频中性原型随机二选一）：`{ArchetypeID}_B.png`
  - 与 A 版为**独立盾形设计**（不同构图/动作/盾框），非调色变体
  - 当前支持：`F3_RO_B`, `F3_CTR_B`, `F3_CAR_B`, `F3_B2B_B`, `F5_PO_B`, `F5_TG_B`, `F4_IN_B`, `F2_SW_B`
  - 设计说明见 `VARIANTS_B.md`
  - 导入后务必执行比例规范（禁止拉伸）：`python3 scripts/normalize-scout-card.py <src> public/assets/scout-cards/{ID}_B.png`

## Archetype 列表

F2_A, F2_BS, F2_AG, F2_FB, F2_SW, F3_RO, F3_DE, F3_B2B, F3_AM, F3_CTR, F3_CAR, F3_HB, F3_SS, F4_CR, F4_IN, F4_WB, F4_WP, F4_SP, F5_PO, F5_TG, F5_RF, F5_PF, F5_AF, F5_CF
