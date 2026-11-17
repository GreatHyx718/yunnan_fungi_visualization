# 🖼️ 首页图片设置指南

首页封面已升级为使用背景图 + 标题图片的设计。现在你需要准备 **3 张图片**。

## 📋 需要的图片

| 文件名 | 用途 | 尺寸 | 格式 | 位置 |
|-------|------|------|------|------|
| `title_page.jpg` | 封面背景 | 1920×1080+ | JPG | `src/images/` |
| `title.png` | 主标题图 | 1400×400 | PNG | `src/images/` |
| `subtitle.png` | 副标题图 | 1100×300 | PNG | `src/images/` |

## 🎨 设计参考

### 背景图（title_page.jpg）
- 云南雨林背景，类似对话中的示例
- 建议有菌类、植物、雾气的自然场景
- 颜色调和：绿色、棕色、黄色系
- 上方较清晰，下方略模糊

**参考示例（来自对话）**：
```
森林雾景 → 菌类多样 → 光影分层
上清下虚的视觉层次
```

### 标题图（title.png）
```
A Record of Mushroom Foraging in Yunnan
```
- 英文字体，serif 风格（如 Georgia、Playfair Display）
- 颜色：深色（#344C3D 或 #2c2c2c）
- 透明背景

### 副标题图（subtitle.png）
```
Delicious, Dangerous, and a Little Magical
```
- 英文字体，可用 serif 或手写体
- 颜色：浅灰色（#8a8a8a）
- 透明背景

## 📍 放置步骤

1. **准备图片**
   - 使用设计工具（Photoshop、Figma、AI 等）制作
   - 或从素材库下载符合要求的图片
   - 确保分辨率足够（1920+ 宽度）

2. **保存为正确格式**
   - `title_page.jpg`：背景图，压缩后 < 500 KB
   - `title.png`：透明背景，< 200 KB
   - `subtitle.png`：透明背景，< 150 KB

3. **放入文件夹**
   ```
   src/images/
   ├── title_page.jpg
   ├── title.png
   ├── subtitle.png
   └── README.md
   ```

4. **检查效果**
   ```bash
   npm run dev
   ```
   打开浏览器访问 `http://localhost:5173`，查看首页效果

## 💻 代码已更新

### Cover.jsx
```javascript
import titleImg from "../../images/title.png";
import subtitleImg from "../../images/subtitle.png";
import bgImg from "../../images/title_page.jpg";

export default function Cover() {
  return (
    <div className="cover">
      <header 
        className="masthead" 
        id="top" 
        style={{ backgroundImage: `url(${bgImg})` }}
      >
        <div className="masthead-overlay" />
        <div className="masthead-content">
          <div className="masthead-images">
            <img src={titleImg} alt="..." className="title-img" />
            <img src={subtitleImg} alt="..." className="subtitle-img" />
          </div>
          <div className="authors">
            <p>Yuxuan Huang</p>
            <p>Siyuan Dong</p>
            <p>Yujie Zhang</p>
          </div>
        </div>
      </header>
    </div>
  );
}
```

### CSS 样式特性
- ✅ 背景图全屏显示，fixed 固定（parallax 效果）
- ✅ 半透明遮罩（opacity: 0.15-0.25），增加文字可读性
- ✅ 标题和副标题竖排居中
- ✅ 作者名在下方，小屏竖排，大屏（≥1024px）横排
- ✅ 响应式设计：4 个断点（小、中、大、超大屏）
- ✅ 图片带阴影效果（drop-shadow）
- ✅ 下方有渐变过渡到白色背景

## 📱 响应式布局

### 超小屏（< 640px）
```
       [背景图]
         
        [标题]
       [副标题]
       
    [作者作者作者]
        (竖排)
```

### 中屏（640px - 1024px）
```
       [背景图]
          
        [标题]
       [副标题]
       
    [作者作者作者]
        (竖排)
```

### 大屏（≥ 1024px）
```
       [背景图]
         
        [标题]
       [副标题]
       
  [作者] [作者] [作者]
        (横排)
```

## 🔧 后续调整

如果需要微调，编辑 `src/styles/index.css` 中的 `.masthead*` 相关类：

```css
/* 调整背景图透明度 */
.masthead-overlay {
  background: linear-gradient(135deg, rgba(244, 239, 228, 0.2) 0%, ...);
}

/* 调整图片大小 */
.title-img {
  max-width: 35rem;  /* 改这个值 */
}

.subtitle-img {
  max-width: 25rem;  /* 改这个值 */
}

/* 调整作者名字体 */
.authors p {
  font-size: 1.25rem;  /* 改这个值 */
}
```

## ✅ 验证清单

- [ ] 准备好 3 张图片
- [ ] 放入 `src/images/` 文件夹
- [ ] 文件名完全匹配（大小写敏感）
- [ ] 运行 `npm run dev` 验证
- [ ] 在不同屏幕大小测试（手机、平板、PC）
- [ ] 检查图片加载是否正常

## 💡 提示

- 图片文件较大时，考虑用 WebP 格式加速加载
- 如果背景图加载慢，可以先用占位符测试
- 标题图片建议用 SVG 而非 PNG（保持清晰度，文件更小）

准备好后，告诉我图片已放入，我可以帮你进一步优化或调整样式！
