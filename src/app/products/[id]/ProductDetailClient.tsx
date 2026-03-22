
            <TabsContent value="specs">
              {product.specifications?.some((s: any) => s.commonValue) ? (
                <div className="overflow-hidden rounded-[2rem] border border-primary/10 bg-white shadow-sm">
                  {/* Table Header */}
                  <div className="grid grid-cols-3 bg-primary/5 px-6 py-4 border-b border-primary/10">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Feature
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1">
                      🏺 Kalamic
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                      🏭 Common Products
                    </span>
                  </div>

                  {/* Table Rows */}
                  {product.specifications.map((spec: any, i: number) => (
                    <div key={i} className={cn(
                      "grid grid-cols-3 px-6 py-5 border-b border-primary/5 last:border-0 items-center transition-colors hover:bg-primary/[0.02]",
                      i % 2 === 0 ? "bg-white" : "bg-primary/[0.01]"
                    )}>
                      {/* Feature name */}
                      <span className="text-[11px] font-black uppercase tracking-wider text-foreground">
                        {spec.key}
                      </span>
                      
                      {/* Kalamic value — highlighted */}
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                        <span className="text-xs font-bold text-primary">
                          {spec.value}
                        </span>
                      </div>
                      
                      {/* Common value — muted */}
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30 flex-shrink-0" />
                        <span className="text-xs font-normal text-muted-foreground">
                          {spec.commonValue || '—'}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {/* Footer badge */}
                  <div className="px-6 py-4 bg-primary/5 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary opacity-60" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                      All Kalamic pieces are handcrafted by certified artisans in Kanpur, India
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {(product.specifications || []).map((spec: any, i: number) => (
                    <div key={i} className="flex justify-between items-center p-5 rounded-2xl bg-white border border-primary/5 hover:border-primary/20 transition-all shadow-sm">
                      <span className="text-[11px] font-black uppercase tracking-widest text-foreground">{spec.key}</span>
                      <span className="text-[10px] font-normal text-muted-foreground">{spec.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
