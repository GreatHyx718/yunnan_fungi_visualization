# 项目结构说明

按 React 最佳实践整理的项目结构。

## 目录结构

```
src/
├── components/                 # React 组件
│   ├── layout/                # 布局组件（固定不变的页面骨架）
│   │   ├── SiteHeader.jsx     # 页面顶栏与导航
│   │   └── Cover.jsx          # 封面页
│   ├── sections/              # 页面章节组件（9 个可视化步骤）
│   │   ├── Sunburst.jsx       # 01. 分类层级旭日图
│   │   ├── BubbleMap.jsx      # 02. 州市县气泡地图
│   │   ├── MonthBars.jsx      # 03. 月份堆叠条形图
│   │   ├── Treemaps.jsx       # 04. 6-9 月矩形树图（每月一张）
│   │   ├── Top5.jsx           # 05. 每月 top5 科排名表
│   │   ├── FamilyCards.jsx    # 06. 科名片墙（滚动切换）
│   │   ├── Hotspots.jsx       # 07. 高发地区县级地图与出菇日历
│   │   ├── Amanita.jsx        # 08. 鹅膏属符号地图、热力图、属对比
│   │   └── Poison.jsx         # 09. CDC 中毒数据（人数、死亡、起数）
│
├── utils/                      # 工具与常量
│   ├── theme.js              # 主题、颜色、数据、常量、辅助函数
│   └── ui.jsx                # UI 通用组件（按钮、标签、提示等）
│
├── styles/                     # 全局样式
│   ├── index.css             # 原始项目样式
│   └── design.css            # 设计系统规范样式
│
├── data/                       # 静态数据（JSON）
│   ├── app-data.json         # 1,188 条菌类记录（编译生成）
│   ├── prefectures.json      # 云南 16 个州市 GeoJSON
│   └── counties.json         # 云南 129 个县 GeoJSON
│
├── images/                     # 前端图片资源（待补充）
│   └── (放置 logo、图标等)
│
├── App.jsx                     # 根组件，聚合所有步骤
├── main.jsx                    # 应用入口
└── README.md                   # 本文件
```

## 命名规范

- **components/** 内的文件用 **PascalCase**（如 `SiteHeader.jsx`）
- **utils/、styles/** 内的文件用 **camelCase**（如 `theme.js`）
- 文件夹名用 **camelCase**（如 `components/`, `sections/`, `layout/`）
- CSS 类名用 **kebab-case**（如 `.tax-node`, `.card-title`）

## 导入规则

### 从 utils 导入
```javascript
import { C, records, fmt } from "../../utils/theme.js";
import { Alert, Bi, Step, useTip } from "../../utils/ui.jsx";
```

### 从 styles 导入（在 main.jsx）
```javascript
import "./styles/index.css";
import "./styles/design.css";
```

### 从 data 导入（在 utils/theme.js）
```javascript
import data from "../data/app-data.json";
import prefectures from "../data/prefectures.json";
```

### 跨组件导入
```javascript
import { MAP_H, MAP_W, projection } from "./BubbleMap.jsx";  // 同级
import { MONTH_NAME, byMonth } from "./Top5.jsx";
```

## 数据流

1. **数据生成**
   - 原始数据：`data/redlist/yunnan_2010_2026_combined.jsonl`（1,188 条）
   - 脚本：`scripts/build-data.mjs`
   - 编译输出：`src/data/app-data.json`
   - 命令：`node scripts/build-data.mjs`

2. **数据加载**
   - `theme.js` 导入 `app-data.json`
   - 导出结构化常量（`records`, `top5`, `cdc` 等）
   - 各组件通过 `theme.js` 获取数据

3. **地理数据**
   - 县级与州市边界：`data/counties.json`, `data/prefectures.json`
   - 步骤 2、7 中使用 d3-geo 进行坐标匹配与渲染

## 代码风格

- **React Hooks**：优先使用 `useState`, `useMemo`, `useEffect`, `useRef`
- **函数式组件**：所有组件均为函数式组件
- **CSS-in-JS**：无，全部 CSS 文件；图表样式内联
- **JSX 注释**：用 `{/* comment */}` 形式
- **TypeScript**：未使用，使用 JSDoc 注释类型

## 图片资源

图片资源放在 `src/images/` 目录下，包括：
- Logo 和品牌图标
- 背景图、装饰图
- 其他前端资源

导入方式：
```javascript
import logo from "../images/logo.png";
```

## 编译与部署

- **开发**：`npm run dev`
- **生产编译**：`npm run build`
- **预览**：`npx vite preview`

编译后输出到 `dist/` 目录。

## 依赖库

### D3 库（可视化）
- `d3-shape`：圆弧、路径生成
- `d3-geo`：地理投影、坐标系
- `d3-hierarchy`：层级数据结构
- `d3-scale`：尺度映射
- `d3-interpolate`：颜色插值

### React 相关
- `react`, `react-dom`：核心库

### 构建工具
- `vite`：快速构建
- `@vitejs/plugin-react`：React 支持
