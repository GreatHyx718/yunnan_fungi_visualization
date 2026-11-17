# 首页图片资源说明

首页使用了三张图片资源。请按照以下要求准备并放入此文件夹。

## 📸 图片清单

### 1. `title_page.jpg` - 背景图
- **用途**：首页 `.masthead` 的背景图
- **推荐尺寸**：1920×1080 px 或更高（宽屏比例）
- **特点**：
  - 云南雨林/蕨类植物背景
  - 柔和、朦胧的自然风景
  - 色调以绿色、黄色、棕色为主
  - 建议有一定的景深感，主体不在中心（顶部较清晰）
- **文件大小**：建议 < 500 KB（可用 JPG 压缩）

### 2. `title.png` - 主标题
- **用途**：英文标题 "A Record of Mushroom Foraging in Yunnan"
- **推荐尺寸**：1400×400 px（宽度优先）
- **特点**：
  - 透明背景（PNG）
  - 字体优雅、易读
  - 颜色：深色（如 #344C3D 或 #2c2c2c）
  - 支持英文，字体建议 serif（如 Georgia、Playfair Display）
- **文件大小**：< 200 KB

### 3. `subtitle.png` - 副标题
- **用途**：英文副标题 "Delicious, Dangerous, and a Little Magical"
- **推荐尺寸**：1100×300 px
- **特点**：
  - 透明背景（PNG）
  - 字体比主标题稍小、优雅
  - 颜色：浅灰（如 #8a8a8a 或 #717e69）
  - 字体建议 serif 或 handwriting style
- **文件大小**：< 150 KB

## 🎨 设计建议

### 背景图
```
典型布局：
┌─────────────────────────────┐
│  雾气、光影、植物叶片（顶部）│
│                              │
│       （主体人物或菌类）      │
│                              │
│   清晰度逐渐下降（底部）     │
└─────────────────────────────┘
```

### 标题排版
- 背景图上方会有半透明遮罩（opacity: 0.15-0.25）
- 标题和副标题在中心竖排
- 下方是作者名（3 行）
- 整体居中，有足够的空白

## 🔧 HTML 结构

```jsx
<header className="masthead" style={{ backgroundImage: `url(${bgImg})` }}>
  <div className="masthead-overlay" />  {/* 半透明遮罩 */}
  <div className="masthead-content">
    <div className="masthead-images">
      <img src={titleImg} className="title-img" />
      <img src={subtitleImg} className="subtitle-img" />
    </div>
    <div className="authors">
      <p>Yuxuan Huang</p>
      <p>Siyuan Dong</p>
      <p>Yujie Zhang</p>
    </div>
  </div>
</header>
```

## 📱 响应式断点

| 断点 | 标题宽度 | 副标题宽度 | 作者布局 |
|------|---------|----------|--------|
| 小屏 (< 640px) | 28 rem | 22 rem | 竖排 |
| 中屏 (640-768px) | 32 rem | 26 rem | 竖排 |
| 大屏 (768-1024px) | 38 rem | 30 rem | 竖排 |
| 超大 (≥ 1024px) | 42 rem | 34 rem | 横排（3 列）|

## ✅ 放置方法

1. 准备好三张图片
2. 放入此文件夹（`src/images/`）
3. 确保文件名完全匹配：
   - `title_page.jpg`
   - `title.png`
   - `subtitle.png`
4. 运行 `npm run dev` 查看效果

## 🎯 效果预期

- ✅ 背景图全屏显示，固定在视口（parallax effect）
- ✅ 标题和副标题居中显示，带阴影效果
- ✅ 作者名在下方，小屏竖排，大屏横排
- ✅ 页面顶部有毛玻璃效果的过渡到下一页面

## 💡 优化建议

- 背景图可用 WebP 格式加快加载（需配置 Vite）
- 标题图片可使用 SVG 保持清晰度
- 考虑使用图片懒加载（lazy loading）
