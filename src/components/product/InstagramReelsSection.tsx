import Link from 'next/link';
import { Instagram, ExternalLink } from 'lucide-react';

export function InstagramReelsSection({ items }: { items: any[] }) {
  if (!items?.length) return null;
  return <section aria-labelledby="instagram-reels-heading" className="rounded-[2.5rem] border border-primary/15 bg-gradient-to-br from-primary/[0.04] to-accent/[0.08] p-7 md:p-10">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">From @kala_mic_04</p><h2 id="instagram-reels-heading" className="mt-2 text-3xl font-display font-bold text-foreground">Instagram from the Studio</h2><p className="mt-2 text-sm text-muted-foreground">See this creation in our latest studio reels.</p></div>
      <Link href="https://www.instagram.com/kala_mic_04/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary hover:underline"><Instagram className="h-4 w-4" /> Follow Kalamic</Link>
    </div>
    <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => <article key={item._id} className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <a href={item.instagramPermalink} target="_blank" rel="noreferrer" className="group block">
          <div className="relative aspect-[4/5] overflow-hidden bg-muted">
            {item.thumbnailUrl ? <img src={item.thumbnailUrl} alt={item.altText} loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-primary"><Instagram className="h-12 w-12" /></div>}
            <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/70 px-3 py-1 text-[10px] font-bold text-white"><ExternalLink className="h-3 w-3" /> View Reel</span>
          </div>
        </a>
        {item.instagramCaption && <p className="line-clamp-3 p-4 text-sm leading-6 text-muted-foreground">{item.instagramCaption}</p>}
      </article>)}
    </div>
  </section>;
}
