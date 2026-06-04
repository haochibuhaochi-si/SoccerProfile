# 足球风格与竞技水准测试 - 计算规则说明书

## 1. 风格向量计算 (Style Vector)

### 1.1 轴定义与权重
我们将 30 道风格题映射到 4 个位置族的 12 个轴上。
每道题的权重默认为 1.0（可根据后续校准调整）。

| 位置族 | 轴 (Axis) | 描述 |
| :--- | :--- | :--- |
| **F2 (后卫)** | Engagement | 出击倾向 (高: 压迫, 低: 蹲坑) |
| | Distribution | 出球偏好 (高: 穿透, 低: 安全) |
| | Body | 身体工具 (高: 对抗, 低: 站位) |
| **F3 (中场)** | Tempo | 节奏取向 (高: 推, 低: 稳) |
| | Duels | 对抗意愿 (高: 迎上, 低: 规避) |
| | Territory | 活动热区 (高: 前插, 低: 回撤) |
| **F4 (边路)** | Mode | 杀伤手段 (高: 内切, 低: 传中) |
| | WorkRate | 往返投入 (高: 防守, 低: 进攻) |
| | Width | 空间取向 (高: 内收, 低: 拉边) |
| **F5 (前锋)** | HoldUp | 持球做墙 (高: 支点, 低: 一脚) |
| | Movement | 跑位类型 (高: 猎手, 低: 流动) |
| | Physical | 主要武器 (高: 力量/技巧, 低: 嗅觉) |

### 1.2 计分逻辑
1. 遍历用户答案。
2. 根据题目后的标签（如 `[F2-Engagement: +]`）累加分数。
3. 归一化：将每个轴的得分转换为 0-10 的浮点数（或 0-1，视前端雷达图需求而定）。

---

## 2. Archetype 映射逻辑

### 2.1 主型判定 (Primary Archetype)
1. 根据用户 Q0 选择的**首选位置**，确定候选的 Archetype 池。
    *   后卫 -> F2_A, F2_BS, F2_AG
    *   中场 -> F3_RO, F3_DE, F3_B2B, F3_AM
    *   边路 -> F4_CR, F4_IN, F4_WB
    *   前锋 -> F5_PO, F5_TG, F5_RF
2. 计算用户向量与每个候选 Archetype 原型向量的**欧氏距离**或**余弦相似度**。
3. 距离最近的即为 `Archetype_ID`。

### 2.2 副型判定 (Secondary Archetype / Hybrid)
1. 计算用户向量与**所有 13 个 Archetype** 的距离。
2. 排除主型后，距离第二近的即为副型。
3. 计算副型占比：`(主型距离 - 副型距离) / 主型距离` 或通过相似度换算。
4. 如果副型占比 > 15%（可调），则在报告中展示副型文案 (`hybrids` 字段)。

---

## 3. 强度分 (PlayLevel) 计算

### 3.1 基准分 (Env Tier)
根据 S1 选择：
*   Tier A: 8.0
*   Tier B+: 6.5
*   Tier B: 5.0
*   Tier C: 3.5
*   Tier D: 2.0

### 3.2 执行修正 (Exec Modifier)
根据 S4, S6, S7 计算平均值：
*   Exec +0.2: +0.3 分
*   Exec 0: 0 分
*   Exec -0.2: -0.3 分
*   Exec -0.4: -0.5 分

### 3.3 素养加成 (Literacy Bonus)
根据 K1-K5 答对数量：
*   5题全对: +0.8
*   4题对: +0.5
*   3题对: +0.2
*   0-2题: 0

### 3.4 最终强度
`PlayLevel = 基准分 + 执行修正 + 素养加成`
最终结果限制在 1.0 - 10.0 之间。

---

## 4. 报告渲染流程 (Backend Logic)

1.  **接收数据**：前端 POST 用户答案。
2.  **计算向量**：执行 1.1 和 1.2，得到 Style Vector。
3.  **匹配主型**：执行 2.1，得到 `Archetype_ID`。
4.  **匹配副型**：执行 2.2，得到 `Secondary_Type` 和 `Hybrid_Percentage`。
5.  **计算强度**：执行 3.1-3.3，得到 `PlayLevel` 数值，并映射到 `Intensity_Band` (TIER_A/B/C/D)。
6.  **计算素养**：根据 K1-K5 结果，映射到 `Literacy_Band` (LIT_HIGH/MID/LOW)。
7.  **读取文案**：
    *   `Main_Copy = load_json(copy_pack[Archetype_ID].base)`
    *   `Intensity_Copy = load_json(intensity_modifiers[Intensity_Band])`
    *   `Literacy_Copy = load_json(literacy_modifiers[Literacy_Band])`
8.  **组装数据**：
    *   如果 `Hybrid_Percentage > 15%`，则拼接 `Main_Copy.title` + `hybrids[Secondary_Type].title_suffix`。
    *   拼接描述文案。
    *   将 `PlayLevel` 数值填入文案。
9.  **返回 JSON**：发送给前端进行渲染。