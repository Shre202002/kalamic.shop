import { ArrowRight, Check } from 'lucide-react';

type ComparisonRow = {
  key?: string;
  value?: string;
  commonValue?: string;
};

export function ProductComparisonTable({ product }: { product: any }) {
  const rows: ComparisonRow[] = (product.specifications || [])
    .filter((spec: ComparisonRow) => spec?.key && spec?.value && spec?.commonValue)
    .slice(0, 12);

  if (rows.length === 0) return null;

  return (
    <section aria-labelledby="product-comparison-heading" className="rounded-[2.5rem] border border-border bg-white p-7 shadow-sm md:p-10">
      <div className="max-w-2xl space-y-3">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">Why choose Kalamic</p>
        <h2 id="product-comparison-heading" className="text-3xl font-display font-bold text-foreground">
          Kalamic quality vs. common alternatives
        </h2>
        <p className="text-sm font-medium leading-7 text-muted-foreground">
          Compare the details that make this handcrafted piece different from a typical mass-produced alternative.
        </p>
      </div>

      <div className="mt-8 md:hidden">
        <div className="space-y-3">
          {rows.map((row) => (
            <article key={row.key} className="rounded-2xl border border-border bg-[#FDFAF6] p-4">
              <h3 className="text-sm font-black text-foreground">{row.key}</h3>
              <div className="mt-3 grid gap-3">
                <div className="rounded-xl bg-white p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">Kalamic</p>
                  <p className="mt-1 inline-flex items-start gap-2 text-sm font-semibold leading-6 text-foreground">
                    <Check aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-primary" />
                    {row.value}
                  </p>
                </div>
                <div className="rounded-xl border border-border/70 p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Common alternative</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{row.commonValue}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="mt-8 hidden overflow-x-auto rounded-2xl border border-border md:block">
        <table className="w-full min-w-[640px] text-left text-sm">
          <caption className="sr-only">Comparison of {product.name} with common alternatives</caption>
          <thead className="bg-[#20150d] text-white">
            <tr>
              <th scope="col" className="p-4 font-black">Feature</th>
              <th scope="col" className="p-4 font-black text-primary">Kalamic</th>
              <th scope="col" className="p-4 font-black text-white/75">Common alternative</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/70">
            {rows.map((row) => (
              <tr key={row.key} className="align-top">
                <th scope="row" className="p-4 font-black text-foreground">{row.key}</th>
                <td className="p-4 font-semibold text-foreground">
                  <span className="inline-flex items-start gap-2">
                    <Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {row.value}
                  </span>
                </td>
                <td className="p-4 text-muted-foreground">{row.commonValue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
        Handcrafted details, thoughtfully finished <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
      </div>
    </section>
  );
}
