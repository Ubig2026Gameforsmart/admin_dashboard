---
name: Asset & Performance Optimization
description: Standards for managing images and assets to ensure fast performance and professional UI.
---

# Asset & Performance Optimization

Follow these rules to satisfy the "Management Asset" and "Target Kompetensi" requirements.

## 1. Image Optimization (Next.js Image)
Always use the `<Image />` component from `next/image` instead of `<img>`.

### Configuration
```tsx
import Image from 'next/image';

<Image
  src={src}
  alt={description}
  width={800}    // Correct aspect ratio
  height={450}
  placeholder="blur"
  loading="lazy"
  className="object-cover rounded-md"
/>
```

## 2. Formats & Compression
- **Production**: Use **WebP** or **AVIF** for smaller file sizes with high quality.
- **Originals**: Keep a copy of high-res assets in a separate backup (not in the public folder).

## 3. Asset Loading Patterns
- **LCP (Largest Contentful Paint)**: Set `priority={true}` for main hero images or posters.
- **SVGs**: Use inline SVGs for icons or `lucide-react` to keep them crisp and styleable via CSS.

## 4. Performance Goals
- Minimize layout shift (CLS) by providing fixed dimensions.
- Aim for a Lighthouse score > 90 for Performance.
