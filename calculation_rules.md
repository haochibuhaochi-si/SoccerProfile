# 足球风格与竞技水准测试 - 计算规则说明书（优化版）

## 1. 风格向量计算 (Style Vector)

### 1.1 轴定义与权重
我们将优化后的21道风格题映射到4个位置族的12个轴上。每道题的权重默认为1.0，可根据后续数据校准调整。

| 位置族 | 轴 (Axis) | 描述 | 对应题目 |
|--------|-----------|------|----------|
| **F2 (后卫)** | Engagement | 出击倾向 (高: 压迫, 低: 蹲坑) | P4, P13 |
| | Distribution | 出球偏好 (高: 穿透, 低: 安全) | P1, P6, P15 |
| | Body | 身体工具 (高: 对抗, 低: 站位) | P5, P14 |
| **F3 (中场)** | Tempo | 节奏取向 (高: 推, 低: 稳) | P2, P12, P15, P20 |
| | Duels | 对抗意愿 (高: 迎上, 低: 规避) | P5, P9 |
| | Territory | 活动热区 (高: 前插, 低: 回撤) | P7 |
| **F4 (边路)** | Mode | 杀伤手段 (高: 内切, 低: 传中) | P3 |
| | WorkRate | 往返投入 (高: 防守, 低: 进攻) | P8, P17 |
| | Width | 空间取向 (高: 内收, 低: 拉边) | P3 |
| **F5 (前锋)** | HoldUp | 持球做墙 (高: 支点, 低: 一脚) | P10, P16, P19 |
| | Movement | 跑位类型 (高: 猎手, 低: 流动) | P7, P10, P21 |
| | Physical | 主要武器 (高: 力量/技巧, 低: 嗅觉) | P11, P18 |

### 1.2 计分逻辑
1. 遍历用户答案，根据选项后的标签（如 `[F2-Engagement: +]`）累加分数。  
   - `+` 计 +1  
   - `-` 计 -1  
   - `=` 计 0  
2. 每个轴的原始得分范围取决于题目数量。  
3. 归一化：将原始得分线性映射到 0-10 分。  
   公式：`归一化分 = (原始得分 - 最小值) / (最大值 - 最小值) * 10`  
   例如某轴有3题，原始得分范围 -3 到 3，则 `(得分+3)/6 * 10`。

---

## 2. Archetype 映射逻辑

### 2.1 主型判定 (Primary Archetype)
1. 根据用户 Q0 选择的**首选位置**，确定候选 Archetype 池：  
   - 后卫 → F2_A, F2_BS, F2_AG  
   - 中场 → F3_RO, F3_DE, F3_B2B, F3_AM  
   - 边路 → F4_CR, F4_IN, F4_WB  
   - 前锋 → F5_PO, F5_TG, F5_RF  
2. 计算用户向量与每个候选 Archetype 原型向量的**余弦相似度**（或欧氏距离）。  
   余弦相似度公式：`cos_sim = (A·B) / (||A|| ||B||)`，值越接近1越相似。  
3. 取相似度最高的作为 `Archetype_ID`。

### 2.2 副型判定 (Secondary Archetype / Hybrid)
1. 计算用户向量与**所有13个Archetype**的相似度。  
2. 排除主型后，取相似度最高的作为副型。  
3. 若副型相似度 ≥ 主型相似度 × 0.85，则判定为混合亚型，在报告中展示副型文案 (`hybrids` 字段)。  
4. 混合程度百分比 = `(副型相似度 / 主型相似度) * 100%`。

---

## 3. 强度分 (PlayLevel) 计算

### 3.1 基础分 (Env Tier)
根据 S1 选择：
- Tier A: 8.0
- Tier B+: 6.5
- Tier B: 5.0
- Tier C: 3.5
- Tier D: 2.0

### 3.2 频率修正 (Frequency Modifier)
根据 S2：
- 每周2次及以上: +0.5
- 每周末1次: +0.2
- 一个月2-3次: 0
- 随缘: -0.3

### 3.3 队友水平修正 (Peer Modifier)
根据 S3：
- 高: +0.4
- 中: +0.1
- 低: -0.2

### 3.4 执行修正 (Exec Modifier)
根据 S4, S6, S7 计算平均 Exec 值：
- 平均 +0.2: +0.3 分
- 平均 0: 0 分
- 平均 -0.2: -0.3 分
- 平均 -0.4: -0.5 分

### 3.5 可靠性修正 (Reliability Modifier)
根据 S5：
- 核心: +0.3
- 重要: +0.1
- 边缘: -0.2

### 3.6 素养加成 (Literacy Bonus)
根据 K1-K4 答对数量（共4题）：
- 4题全对: +0.6
- 3题对: +0.4
- 2题对: +0.2
- 0-1题: 0

### 3.7 场地修正 (Pitch Modifier)
根据 S8：
- 好: +0.1
- 一般: 0
- 差: -0.1

### 3.8 最终强度
`PlayLevel = 基础分 + 频率修正 + 队友修正 + 执行修正 + 可靠性修正 + 素养加成 + 场地修正`  
限制在 1.0 - 10.0 之间，保留一位小数。

### 3.9 强度等级映射
- 8.5 ≤ PlayLevel ≤ 10.0 → TIER_A (高竞争联赛级)
- 6.5 ≤ PlayLevel < 8.5 → TIER_B (标准业余)
- 4.0 ≤ PlayLevel < 6.5 → TIER_C (休闲野球)
- 1.0 ≤ PlayLevel < 4.0 → TIER_D (养生局)

---

## 4. 报告渲染流程 (Backend Logic)

1. **接收数据**：前端 POST 用户答案（包含 Q0, P1-P21, S1-S10, K1-K4）。  
2. **计算风格向量**：按照1.2节计算12个轴的归一化得分，得到 `style_vector` (长度为12的数组)。  
3. **匹配主型和副型**：执行第2节逻辑，得到 `archetype_id`, `secondary_id`, `hybrid_percentage`。  
4. **计算强度分**：执行第3节逻辑，得到 `playlevel_score` 和 `intensity_band` (TIER_A/B/C/D)。  
5. **计算素养等级**：根据 K1-K4 答对数量，映射到 `literacy_band`：  
   - 答对4题 → LIT_HIGH  
   - 答对3题 → LIT_MID  
   - 答对≤2题 → LIT_LOW  
6. **读取文案**：  
   - 主文案 = `copy_pack[archetype_id].base`  
   - 强度文案 = `intensity_modifiers[intensity_band]`  
   - 素养文案 = `literacy_modifiers[literacy_band]`  
7. **组装报告数据**：  
   - 如果是混合亚型（hybrid_percentage ≥ 85%），则标题拼接 `主文案.title` + `“ · ”` + `copy_pack[archetype_id].hybrids[secondary_id].title_suffix`。  
   - 描述文案中适当插入强度分和素养标签。  
   - 生成雷达图所需数据：`radar_data` 为 style_vector 中用于雷达显示的6个核心维度（可从12轴中挑选，如 Engagement, Distribution, Tempo, Duels, WorkRate, Movement）。  
8. **返回 JSON**：格式如下示例：  
```json
{
  "archetype_id": "F3_B2B",
  "archetype_title": "永动机 · 全能中场",
  "is_hybrid": true,
  "hybrid_desc": "创意型",
  "playlevel_score": 7.2,
  "intensity_band": "TIER_B",
  "literacy_band": "LIT_MID",
  "radar_data": [7.5, 6.0, 8.0, 7.0, 6.5, 7.8],
  "copy_data": {
    "tagline": "覆盖每一寸草皮，攻防两端的粘合剂。",
    "description": "...",
    "strengths": ["...","..."],
    "weaknesses": ["...","..."],
    "training": { "priority_1": "...", "priority_2": "..." },
    "formation_fit": { "best": "...", "position": "...", "avoid": "..." },
    "style_reference": { "core_ref": "...", "sub_ref": "...", "avoid_ref": "..." },
    "intensity_tone": "...",
    "literacy_desc": "..."
  }
}
```
