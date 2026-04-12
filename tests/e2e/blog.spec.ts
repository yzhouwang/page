import { test, expect } from '@playwright/test';

test.describe('Blog index', () => {
  test('renders post cards sorted by date', async ({ page }) => {
    await page.goto('/page/blog');
    const cards = page.locator('.blog-card');
    await expect(cards.first()).toBeAttached();
    expect(await cards.count()).toBeGreaterThanOrEqual(2);
    // Most recent first (physics-portfolio: Apr 11 > tone-spreading: Apr 10)
    const firstTitle = cards.first().locator('.blog-card-title');
    await expect(firstTitle).toHaveText('Why I Built a Physics Engine for My Portfolio');
  });

  test('post card links to post page', async ({ page }) => {
    await page.goto('/page/blog');
    await page.locator('.blog-card').first().click();
    await expect(page).toHaveURL(/\/blog\/physics-portfolio/);
    await expect(page.locator('.post-title')).toBeVisible();
  });

  test('shows blog header', async ({ page }) => {
    await page.goto('/page/blog');
    await expect(page.locator('.blog-header-title')).toHaveText('Blog');
  });
});

test.describe('Post page', () => {
  test('renders post content and sidebar', async ({ page }) => {
    await page.goto('/page/blog/physics-portfolio');
    await expect(page.locator('.post-title')).toHaveText('Why I Built a Physics Engine for My Portfolio');
    await expect(page.locator('.post-sidebar')).toBeVisible();
    await expect(page.locator('.post-sidebar-date')).toBeVisible();
    await expect(page.locator('.post-sidebar-reading')).toBeVisible();
  });

  test('renders MDX components inline', async ({ page }) => {
    await page.goto('/page/blog/physics-portfolio');
    // CalloutTile
    await expect(page.locator('.callout-tile').first()).toBeVisible();
    // AsideTile
    await expect(page.locator('.aside-tile').first()).toBeVisible();
    // LinkCard
    await expect(page.locator('.link-card').first()).toBeVisible();
    // CodeBlock (wrapped by CodeBlock component)
    await expect(page.locator('.code-block').first()).toBeVisible();
  });

  test('renders prev/next navigation', async ({ page }) => {
    await page.goto('/page/blog/physics-portfolio');
    const nav = page.locator('.post-nav');
    await expect(nav).toBeVisible();
    // physics-portfolio is the newest, so it should have a "previous" link to tone-spreading
    await expect(nav.locator('.post-nav-link').first()).toBeVisible();
  });

  test('prev/next links navigate correctly', async ({ page }) => {
    await page.goto('/page/blog/physics-portfolio');
    // Navigate to the previous post
    await page.locator('.post-nav-link').first().click();
    await expect(page).toHaveURL(/\/blog\/tone-spreading/);
    await expect(page.locator('.post-title')).toHaveText('Tone Spreading in Kinyarwanda: A Visual Primer');
  });

  test('tags render in sidebar', async ({ page }) => {
    await page.goto('/page/blog/physics-portfolio');
    const tags = page.locator('.post-sidebar-tag');
    await expect(tags.first()).toBeVisible();
  });
});

test.describe('Blog navigation', () => {
  test('blog nav links back to portfolio', async ({ page }) => {
    await page.goto('/page/blog');
    await page.locator('.blog-nav-brand').click();
    await expect(page).toHaveURL(/\/page\/?$/);
  });

  test('homepage has Blog link in nav', async ({ page }) => {
    await page.goto('/page/');
    const viewport = page.viewportSize();
    if (viewport && viewport.width >= 1024) {
      // Desktop: generative layout activates after crossfade
      await expect(page.locator('#generative-layout')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('.gen-nav-links a[href*="blog"]')).toBeVisible();
    } else {
      // Mobile: blog link exists behind hamburger (visibility tested separately)
      await expect(page.locator('.h-nav-links a[href*="blog"]')).toBeAttached();
    }
  });
});

test.describe('Physics isolation', () => {
  test('blog pages do not load Matter.js', async ({ page }) => {
    const scripts: string[] = [];
    page.on('request', (req) => {
      if (req.resourceType() === 'script') {
        scripts.push(req.url());
      }
    });
    await page.goto('/page/blog/physics-portfolio');
    await page.waitForLoadState('networkidle');
    const hasMatterJs = scripts.some((s) => s.includes('matter'));
    expect(hasMatterJs).toBe(false);
  });
});

test.describe('RSS feed', () => {
  test('serves valid XML', async ({ page }) => {
    const response = await page.goto('/page/rss.xml');
    expect(response?.status()).toBe(200);
    const contentType = response?.headers()['content-type'] ?? '';
    expect(contentType).toContain('xml');
    const body = await response?.text();
    expect(body).toContain('<title>Yuzhou Wang');
    expect(body).toContain('physics-portfolio');
    expect(body).toContain('tone-spreading');
  });
});

test.describe('Mobile hamburger menu', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('hamburger menu shows blog link on mobile', async ({ page }) => {
    await page.goto('/page/blog');
    // Menu should be hidden initially
    const links = page.locator('.blog-nav-links');
    await expect(links).not.toBeVisible();
    // Click hamburger
    await page.locator('.blog-menu-btn').click();
    await expect(links).toBeVisible();
    const blogLink = links.locator('a[href*="blog"]');
    await expect(blogLink).toBeVisible();
  });

  test('homepage hamburger shows blog link on mobile', async ({ page }) => {
    await page.goto('/page/');
    const menuBtn = page.locator('.h-menu-btn');
    if (await menuBtn.isVisible()) {
      await menuBtn.click();
      const blogLink = page.locator('.h-nav-links a[href*="blog"]');
      await expect(blogLink).toBeVisible();
    }
  });
});
