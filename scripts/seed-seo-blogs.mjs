import dotenv from 'dotenv';
// Vercel CLI writes pulled variables to .env.local. Node does not load that
// file automatically, so load it explicitly before reading MONGODB_URI.
dotenv.config({ path: '.env.local' });
dotenv.config();
import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error('MONGODB_URI is required. Run with the production environment variables loaded.');

const blogs = [
  {
    title: 'Handmade Ceramic Home Decor Ideas for Indian Homes',
    slug: 'handmade-ceramic-home-decor-ideas-for-indian-homes',
    excerpt: 'Explore practical ways to style handmade ceramic decor in Indian homes, from entryways and living rooms to bedrooms, shelves and festive corners.',
    category: 'Tips',
    tags: ['handmade decor', 'Indian interiors', 'ceramic art', 'home styling', 'artisan products'],
    seo: { metaTitle: 'Handmade Ceramic Home Decor Ideas for Indian Homes', metaDescription: 'Discover handmade ceramic home decor ideas for Indian homes, including wall art, mirrors, photo frames and traditional artisan accents.', metaKeywords: ['handmade ceramic decor', 'Indian home decor', 'ceramic wall art', 'handcrafted decor', 'artisan decor India'], canonicalUrl: 'https://www.kalamic.shop/blog/handmade-ceramic-home-decor-ideas-for-indian-homes' },
    coverImage: { url: 'https://picsum.photos/seed/kalamic-ceramic-decor/1200/675', alt: 'Handmade ceramic decor styled in an Indian home' },
    productSlugs: ['handmade-ceramic-peacock-floral-wall-mirror', 'handcrafted-peacock-mor-stambh-set-of-2'],
    content: `<p>Handmade ceramic home decor adds warmth, texture and personality to Indian interiors. Unlike mass-produced decorations, ceramic pieces often carry visible details created by skilled artisans. Small variations in texture, colour and finish make every item feel personal.</p><h2>Create a Welcoming Entryway</h2><p>The entrance is the first area guests notice. A ceramic wall accent, decorative mirror or handcrafted hanging piece can create an inviting focal point. Place the item above a narrow console table and add a small plant, brass bowl or warm lamp below it.</p><p>Choose pieces that match the scale of the wall. A large empty wall can support a statement mirror, while a smaller entrance works better with compact ceramic artwork.</p><h2>Add Character to the Living Room</h2><p>Ceramic wall decor works beautifully above sofas, consoles and reading corners. Peacock, floral and traditional Indian motifs can introduce cultural character without making the room feel overly formal.</p><p>Use one large piece as a focal point or combine three smaller pieces in a balanced arrangement. Leave enough space around each item so the artwork does not look crowded.</p><h2>Style Shelves and Side Tables</h2><p>Small ceramic sculptures, candle holders and decorative frames can add depth to open shelves. Place objects at different heights and combine them with books, plants and natural fabrics. Avoid filling every shelf completely so each handcrafted item remains visible.</p><h2>Use Ceramic Decor for Gifting</h2><p>Handmade ceramic decor makes a thoughtful gift for weddings, housewarmings, anniversaries and festivals. A decorative mirror, photo frame or artisan figurine can carry more emotional value than a generic gift because it feels artistic and lasting.</p><h2>Explore Kalamic Handmade Decor</h2><p>Add a statement piece with our <a href="/products/handmade-ceramic-peacock-floral-wall-mirror">handmade ceramic peacock floral wall mirror</a>. For a traditional accent, explore the <a href="/products/handcrafted-peacock-mor-stambh-set-of-2">handcrafted peacock Mor Stambh set</a>.</p><p>Kalamic brings handcrafted ceramic decor inspired by Indian heritage and contemporary living.</p>`
  },
  {
    title: 'How to Style a Decorative Wall Mirror in a Small Room',
    slug: 'how-to-style-a-decorative-wall-mirror-in-a-small-room',
    excerpt: 'Learn how to use decorative wall mirrors in compact Indian rooms to reflect light, improve visual balance and create a more spacious atmosphere.',
    category: 'Care Guide',
    tags: ['wall mirrors', 'small room decor', 'mirror styling', 'living room ideas', 'home interiors'],
    seo: { metaTitle: 'How to Style a Decorative Wall Mirror in a Small Room', metaDescription: 'Learn how to style a decorative wall mirror in a small room to reflect light, create space and add handcrafted Indian character to your home.', metaKeywords: ['decorative wall mirror', 'small room mirror ideas', 'mirror placement', 'Indian home decor', 'ceramic wall mirror'], canonicalUrl: 'https://www.kalamic.shop/blog/how-to-style-a-decorative-wall-mirror-in-a-small-room' },
    coverImage: { url: 'https://picsum.photos/seed/kalamic-wall-mirror/1200/675', alt: 'Decorative wall mirror styled in a small living room' },
    productSlugs: ['handmade-ceramic-peacock-floral-wall-mirror', 'handcrafted-antique-gold-floral-wall-mirror-23x18'],
    content: `<p>A decorative wall mirror can make a small room appear brighter, wider and more welcoming. The secret is not simply choosing the largest mirror. Placement, shape, surrounding furniture and reflected views all affect the final result.</p><h2>Place the Mirror Opposite Natural Light</h2><p>One of the easiest ways to brighten a compact room is to place the mirror opposite or beside a window. It reflects daylight and distributes brightness across the room. Avoid positioning the mirror where it reflects harsh sunlight directly into someone’s eyes.</p><h2>Choose the Right Shape</h2><p>Round and oval mirrors soften rooms that contain many straight lines, such as rectangular windows, shelves and sofas. Rectangular mirrors can make a narrow wall feel taller or wider. Decorative ceramic mirrors with floral or peacock motifs work well when the frame is visible from the main seating area.</p><h2>Use Furniture as a Guide</h2><p>A mirror above a console table should usually be slightly narrower than the table. Above a sofa, leave enough space between the top of the sofa and the bottom of the mirror.</p><h2>Avoid Visual Clutter</h2><p>A mirror reflects whatever is opposite it. Aim the mirror toward a plant, artwork, window or clean architectural feature instead of clutter, exposed storage or tangled wires.</p><h2>Install It Safely</h2><p>Check the product weight and wall material before installation. Use hardware suitable for masonry, tile or drywall. Heavy ceramic-framed mirrors should be installed with assistance from another adult.</p><h2>Explore Kalamic Wall Mirrors</h2><p>Discover the <a href="/products/handmade-ceramic-peacock-floral-wall-mirror">handmade ceramic peacock floral wall mirror</a> or choose the <a href="/products/handcrafted-antique-gold-floral-wall-mirror-23x18">handcrafted antique gold floral wall mirror</a> for an elegant decorative finish.</p>`
  },
  {
    title: 'Mor Stambh Meaning, History and Modern Home Styling',
    slug: 'mor-stambh-meaning-history-and-modern-home-styling',
    excerpt: 'Discover the symbolism of Mor Stambh, its connection with Indian cultural traditions and practical ways to style this meaningful decor piece at home.',
    category: 'Heritage',
    tags: ['Mor Stambh', 'Indian heritage', 'peacock decor', 'traditional interiors', 'cultural art'],
    seo: { metaTitle: 'Mor Stambh Meaning, History and Modern Home Styling', metaDescription: 'Learn the cultural meaning of Mor Stambh, its connection with Indian heritage and simple ways to style this peacock pillar at home.', metaKeywords: ['Mor Stambh meaning', 'peacock pillar decor', 'Indian traditional decor', 'Mor Stambh for home', 'heritage home decor'], canonicalUrl: 'https://www.kalamic.shop/blog/mor-stambh-meaning-history-and-modern-home-styling' },
    coverImage: { url: 'https://picsum.photos/seed/kalamic-mor-stambh/1200/675', alt: 'Handcrafted peacock Mor Stambh decor in a modern Indian home' },
    productSlugs: ['handcrafted-peacock-mor-stambh-set-of-2'],
    content: `<p>Mor Stambh is a decorative representation of the peacock pillar, inspired by the beauty and symbolism of Indian heritage. The peacock has long been associated with grace, beauty, protection and celebration.</p><h2>What Does Mor Stambh Represent?</h2><p>The word “Mor” refers to the peacock, while “Stambh” means pillar or column. Together, Mor Stambh represents a decorative pillar inspired by the peacock form. Many people choose peacock decor because it adds cultural identity, elegance and positive energy to a space.</p><h2>Where Can You Place Mor Stambh?</h2><p>Mor Stambh can be styled near an entrance, in a living room, on a console or beside a prayer and meditation area. For a modern interior, pair it with neutral walls, wooden furniture and warm lighting. For a traditional look, combine it with brass accents and heritage textiles.</p><h2>How to Style It in a Contemporary Home</h2><p>Give traditional objects breathing space. A pair of Mor Stambh pieces can frame a console or doorway, while a single piece can become a focal point on a shelf or side table. Use warm white lighting to highlight its textures and curves.</p><h2>Shop Handcrafted Mor Stambh Decor</h2><p>Bring this cultural symbol into your home with the <a href="/products/handcrafted-peacock-mor-stambh-set-of-2">handcrafted peacock Mor Stambh set</a>. It works beautifully near entrances, consoles, prayer spaces and living-room displays.</p><h2>A Meaningful Gifting Choice</h2><p>Mor Stambh makes a thoughtful gift for housewarmings, weddings, festivals and celebrations. It combines artistic beauty with cultural meaning and brings Indian heritage into contemporary homes.</p>`
  },
  {
    title: 'How to Choose a Handmade Photo Frame for Gifting',
    slug: 'how-to-choose-a-handmade-photo-frame-for-gifting',
    excerpt: 'Find the right handmade photo frame for birthdays, weddings, anniversaries and housewarmings with advice on size, design, finish and personal meaning.',
    category: 'Tips',
    tags: ['photo frames', 'personalised gifts', 'ceramic gifts', 'wedding gifting', 'handmade decor'],
    seo: { metaTitle: 'How to Choose a Handmade Photo Frame for Gifting', metaDescription: 'Learn how to choose a handmade photo frame for birthdays, weddings, anniversaries and housewarmings with practical Indian gifting ideas.', metaKeywords: ['handmade photo frame', 'ceramic photo frame', 'personalised gift India', 'photo frame for wedding gift', 'handcrafted home decor'], canonicalUrl: 'https://www.kalamic.shop/blog/how-to-choose-a-handmade-photo-frame-for-gifting' },
    coverImage: { url: 'https://picsum.photos/seed/kalamic-photo-frame/1200/675', alt: 'Handmade ceramic photo frame displayed as an Indian gift' },
    productSlugs: ['customized-ceramic-photo-frame'],
    content: `<p>A handmade photo frame is a thoughtful gift because it preserves a memory while also becoming part of the recipient’s home. Compared with ordinary frames, handcrafted ceramic designs add texture, colour and artistic character.</p><h2>Consider the Photograph Size</h2><p>Start by checking the photograph dimensions. A standard 4×6-inch frame is suitable for family portraits, travel memories and everyday snapshots. Confirm the opening size before ordering a larger wedding or family photograph.</p><h2>Match the Recipient’s Style</h2><p>Floral and vintage designs work well for traditional interiors. Minimal frames suit modern spaces, while colourful ceramic details can brighten a child’s room or creative workspace. A handcrafted owl, peacock or floral motif can also carry symbolic meaning.</p><h2>Choose Tabletop or Wall-Mounting</h2><p>Some frames are designed for desks and shelves, while others can be mounted on a wall. A dual-purpose frame gives the recipient more flexibility and works especially well as a housewarming gift.</p><h2>Personalise the Moment</h2><p>Choose a photograph connected to the occasion. For an anniversary, use a shared memory. For a wedding, select a meaningful couple portrait. For a birthday, choose a joyful family or friendship photograph.</p><h2>Explore Kalamic Ceramic Photo Frames</h2><p>Preserve a meaningful memory with our <a href="/products/customized-ceramic-photo-frame">customized ceramic photo frame</a>. Its handcrafted finish makes it suitable for birthdays, anniversaries, weddings and housewarming gifts.</p><h2>Care and Finish</h2><p>Ceramic frames should be handled carefully and cleaned with a soft, dry cloth. Avoid harsh chemicals and excessive moisture. A handmade photo frame combines memory, craftsmanship and useful home styling.</p>`
  }
];

const slugify = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
await mongoose.connect(uri, { dbName: process.env.DB_NAME || 'kalamic' });
const db = mongoose.connection.db;
const products = await db.collection('Kalamic_Products').find({ slug: { $in: blogs.flatMap((blog) => blog.productSlugs) } }).toArray();
const productsBySlug = new Map(products.map((product) => [product.slug, product]));

for (const blog of blogs) {
  const linkedProducts = blog.productSlugs.map((slug) => {
    const product = productsBySlug.get(slug);
    if (!product) return null;
    return { productId: String(product._id), productName: product.name, productImage: product.images?.find((image) => image.is_primary)?.url || product.images?.[0]?.url || '', productPrice: product.price, productSlug: product.slug };
  }).filter(Boolean);
  const now = new Date();
  await db.collection('Blog_Posts').updateOne(
    { slug: blog.slug },
    { $set: { title: blog.title, slug: slugify(blog.slug), excerpt: blog.excerpt, content: blog.content, coverImage: blog.coverImage, images: [], author: { name: 'Kalamic Artisan' }, category: blog.category, tags: blog.tags, seo: blog.seo, linkedProducts, status: 'published', isFeatured: false, readTime: Math.max(1, Math.ceil(blog.content.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).length / 200)), updatedAt: now }, $setOnInsert: { views: 0, createdAt: now, publishedAt: now } }, { upsert: true }
  );
  console.log(`Seeded ${blog.slug} (${linkedProducts.length} linked products)`);
}
await mongoose.disconnect();
