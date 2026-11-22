# 页面文案草稿

参考风格:<https://y0uk1.github.io/PacificVis2025/>
状态:草稿,尚未写入代码。`[ ]` 为待补数据。

文档分三部分:

- **A. 图表左侧说明。** 只写英文,陈述性,不用人物口吻。
- **B. 叙事节点。** 开头、转折、结尾。叙事和总结性的内容放在这里,不放进左侧。
- **C. 页面底部。** 数据来源和口径说明。

---

# A. 图表左侧说明

## 写法原则

1. 左侧说明用第三人称陈述,不出现 Xiaojun、Grandma 等人物。
2. 只写英文。
3. 每块正文 1 到 3 句,第一句直接给结论,数字放进句子里。篇幅参考 Wagyu 页。
4. 交互提示单独一行,用 `(*)`。
5. 细节放进悬停卡片或页面底部数据说明,不放左侧。
6. 用词统一为 *records* / *observations*,不写 *fruiting*。GBIF 数据只能证明某天有人拍到,不能证明出菇时间。
7. 总结、转折、引入这类叙事内容放到 B 部分,不放左侧。

页面顺序:开篇图 → 县级 bubble 图 → 月度图 → 科名片 → (转折) → 高发地区 bubble 图 → Amanita → Part III 中毒 → (结尾)。

---

## A0. Fungi recorded in Yunnan(force-directed 图)

这一节划定范围:云南可见菌有哪些,其中哪一部分在可食范围内。图有 All / Edible / Toxic 三种模式。

**正文**

> Yunnan has 1,188 mushroom records on GBIF from 2010 to 2026. Only 199 of them, covering 87 species, fall in the edible range.

**交互提示**

> (*) Switch between All, Edible and Toxic. Scroll inside the chart to go from phylum down to species.

**不放进左侧的内容**

- 393 种、271 属、95 科、91% 担子菌门:放进节点的悬停卡片。
- 60 条带有毒标记:放进 Toxic 模式的悬停卡片。开篇不写有毒范围。
- 463 条鉴定到属或更高、无法匹配,所以可食占比是下限:放进页面底部数据说明(见 C1)。

**数据核对**

| | 全部 | 可食范围 |
|---|---|---|
| 记录 | 1,188 | 199(139 仅可食,60 带有毒标记) |
| 科 | 95 | 31 |
| 属 | 271 | 58 |
| 种 | 393 | 87 |

- 担子菌门 1,081 条(91%),子囊菌门 107 条。
- 1,188 条中 725 条鉴定到种,401 条到属,56 条到科,6 条到目。可食匹配只在种一级,所以 199 条都来自这 725 条。463 = 1,188 − 725。

---

## A1. Observations by prefecture and county(bubble 图)

> Records are concentrated in a few places. [Top prefecture] alone holds [n] of the records with coordinates, and many counties have fewer than five. Bubble size shows the number of records per county.

> (*) Hover a bubble for the county name and count. Records without coordinates (n = [ ]) are not shown.

---

## A2. What was recorded each month(单图 + 滚轮,左右排版)

> Observations are concentrated in summer. June to October holds 1,024 of the 1,188 records (86%). August is the peak with 438 records, followed by July with 247. Each bar splits into edible-range and other records.

> (*) Scroll to move between months. Click a family to see its records for that month.

月度记录:Jun 95、Jul 247、Aug 438、Sep 125、Oct 119。"edible range" 回指 A0 的定义,不再重新解释。

---

## A3. Family cards(每月 top 5,带图片)

**不写左侧文字。** 左侧放菌菇图片,右侧放名片。

备注:现有 `top5_families_by_month_6-9.csv` 只覆盖 6 到 9 月,10 月需要重新计算。

---

## A4. Where the peak season is busiest(高发地区 bubble 图)

保留这一节,形式改为 bubble 图,去掉右侧日历。前面有叙事转折(见 B2)。

> The busiest counties from June to October are [A], [B] and [C], with [n]% of the records. [n] counties have a single record.

> (*) Hover a bubble for the county name and count.

备注:月份范围 6 到 9 月还是 6 到 10 月,待 10 月数据补完后定。

---

## A5. One genus, two kinds of mushroom: Amanita

> Amanita includes both edible and dangerous species. *A. hemibapha* and *A. ochracea* fall in the edible range, while *A. pseudoporphyria* appears in China CDC outbreak tables every year from 2019 to 2025. Records peak in August at 2,000 to 2,500 m (16 records).

> (*) Click a species in the list to see its locations and its flow into edible, poisonous and other.

备注:"16 records" 来自设计稿里的海拔热力图,写入前需对照实际图表核对。增加鹅膏名片后,名片承担 records / species / edible 三个数字,正文不再重复。

---

## A6. Part III · Poisoning in Yunnan(滚动交互)

标题候选:*Poisoning in Yunnan: What the CDC counts* 或 *From observation to poisoning*。

**Patients / Deaths**

> China CDC reported 1,615 mushroom-poisoning patients and 23 deaths in Yunnan from 2020 to 2025. The worst year was 2022 with 404 patients and 9 deaths. 2024 had 281 patients and no deaths.

> (*) Scroll to move from patients, to deaths, to the GBIF records.

**Records vs toxic records**

> GBIF records from June to September, all years, total 905. Toxic-flagged records account for 123 of them (14%). Toxic-flagged means marked poisonous in Wu 2019 or Zhang 2021, so the share is a wide estimate.

**小字**

> CDC data are province-level counts. GBIF records cover 2010 to 2026 and are not poisoning cases.

**对比地图**(毒蘑菇记录地区 vs 中毒事发地区)

> Poisoning cases and toxic-species observations do not cover the same places. [Fill in after the year and the county-level source are set.]

备注:目前只有省级和少数州市的 CDC 数据,地图能做到哪一级取决于数据来源。"Poisoning incidents per month, 2025 only" 按 todo 删除。

数据来源:`part3_yunnan_annual_patients_deaths.csv`(2020 到 2025:患者 244、200、404、225、281、261;死亡 7、4、9、1、0、2)、`part3_timing_total_vs_toxic.csv`。

---



---

# C. 页面底部

## C1. 数据来源与口径(footer)

替换现有 footer。现有文字:

> Data: GBIF occurrences for Yunnan 2010–2026 (1,188 records), Wu 2019 and Zhang 2021 edible-species tables, China CDC Weekly poisoning reports, SRTM 90 m elevation. 观测 ≠ 实际分布 · 观测 ≠ 可食用

改后草稿:

**Data sources**

> **Records.** GBIF occurrence records for Yunnan, 2010 to 2026 (1,188 records after filtering; retrieved November 2026). Soil-DNA samples, other material samples and lichens are excluded. [GBIF citation / DOI to add]
>
> **Edible and poisonous status.** Species-level match to Wu et al. (2019), Table 1, and Zhang et al. (2021), Table 2. [Full citations to add]
>
> **Poisoning.** China CDC Weekly foodborne disease outbreak reports, 2019 to 2025. Province-level counts. [Full citations to add]
>
> **Elevation.** SRTM 90 m digital elevation model, sampled at each record's coordinates.

**Notes**


> The edible match uses species names only. 463 records identified to genus or higher cannot be matched, so the edible count is a lower bound.
>
> Toxic-flagged means marked poisonous in either table, or in a non-edible group in the CDC tables.
>
> Maps show only the records with coordinates. Elevation from the DEM differs from the original recorded elevation by more than 200 m for 36% of records that have both.

**数据核对**

- "Soil-DNA samples, other material samples and lichens are excluded" 来自 `yunnan_2010_2026.query.json` 的 `exclusion_rules`。该文件显示 GBIF 原始返回 12,764 条,筛选后保留 918 条带坐标记录,10,809 条是土壤 DNA 样本。
- 检索日期 2026-11-12,来自同一个文件。
- 36% 和 200 m 来自现有 Amanita 一节的说明。
- 463 条的算法见 A0。
- 两篇论文的作者、标题、期刊,以及 CDC Weekly 各期的具体引用,仓库里没有记录,需要你补。我没有凭记忆填写。
- 一个需要核对的数字:`yunnan_2010_2026_combined_summary.txt` 写的总记录数是 1,198,而合并文件 `yunnan_2010_2026_combined.jsonl` 是 1,188 行,页面也用 1,188。可能是总结文件没更新,写入前确认一下。

---

## 待确认
1. **10 月数据。** 月度记录里 10 月已有 119 条,但 Top5 和科名片的 CSV 只算到 6 到 9 月。"补 10 月"是指重新计算科级数据吗?
2. **Treemaps 一节。** todo 没有提到,先保留吗?
3. **两张 bubble 图。** A1(全部月份、县级)和 A4(6 到 10 月)形式相近。是否需要在 A4 里换一个区分方式,例如按科着色?
4. **对比地图的年份与数据级别。** 没找到逐县的 CDC 中毒数据。
5. **Part III 的新标题。**
6. **Part III 之前是否也要一个转折。** 从 Amanita 进入中毒数据,目前只写了高发地区图前的转折(B2)。
7. **B 部分的故事线。** B1 和 B3 的人物设定和结局,以你们的设定为准。
8. **C1 的引用信息。** 两篇论文和 CDC Weekly 的完整引用,以及 GBIF 的 DOI。
9. **页脚语言。** 现有页脚末尾有一行中文 "观测 ≠ 实际分布 · 观测 ≠ 可食用"。C1 改成只写英文,是否保留中文这一行?
