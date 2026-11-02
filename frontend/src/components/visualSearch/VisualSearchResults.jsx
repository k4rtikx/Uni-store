import React from 'react';
import { ExternalLink, ShoppingBag, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import ListingCard from '../listings/ListingCard';

const MARKET = {
  amazon: { name: 'Amazon.in', cls: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100' },
  flipkart: { name: 'Flipkart', cls: 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100' },
};

/** Existing ListingCard plus the extra context visual search needs (availability, seller college, why it matched). */
const MatchCard = ({ listing }) => (
  <div className="space-y-1.5 lens-pop">
    <ListingCard listing={listing} />
    <div className="flex flex-wrap items-center gap-1.5 px-1 text-[11px]">
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
        <CheckCircle2 className="w-3 h-3" /> {listing.availability || 'Available'}
      </span>
      {listing.seller?.college && <span className="text-slate-500 font-medium truncate">{listing.seller.college}</span>}
      {(listing.matchReasons || []).slice(0, 2).map((r) => (
        <span key={r} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">{r}</span>
      ))}
    </div>
  </div>
);

const ExternalSection = ({ external, loading, error }) => (
  <section className="space-y-3 lens-pop">
    <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900">
      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
      <p className="text-sm font-semibold">{external?.message || 'Looking for alternatives…'}</p>
    </div>

    {loading && <p className="text-sm text-slate-500">Finding alternatives…</p>}
    {error && <p className="text-sm text-rose-600 font-medium">{error}</p>}

    {external && (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {external.links.map((l) => (
            <a
              key={l.marketplace}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer nofollow sponsored"
              className={`flex items-center justify-between gap-2 px-4 py-3 rounded-2xl border font-bold text-sm transition-colors ${MARKET[l.marketplace].cls}`}
            >
              <span className="flex items-center gap-2"><ShoppingBag className="w-4 h-4" />{l.label}</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          ))}
        </div>
        <p className="text-[11px] text-slate-500">
          Search links open each store&apos;s own results for “{external.query}”. {external.notice}
        </p>

        {external.items.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {external.items.map((it) => (
              <a
                key={it.url}
                href={it.url}
                target="_blank"
                rel="noopener noreferrer nofollow sponsored"
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-emerald-400 transition-colors flex flex-col"
              >
                <div className="aspect-square bg-slate-50 flex items-center justify-center">
                  {it.image ? (
                    <img src={it.image} alt={it.title} loading="lazy" referrerPolicy="no-referrer" className="w-full h-full object-contain" />
                  ) : (
                    <ShoppingBag className="w-8 h-8 text-slate-300" />
                  )}
                </div>
                <div className="p-3 space-y-1 flex-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">{MARKET[it.marketplace].name}</span>
                  <h4 className="text-xs font-bold text-slate-800 line-clamp-2">{it.title}</h4>
                  {it.price && <p className="font-mono font-bold text-slate-900 text-sm">{it.price}</p>}
                  <p className="text-[10px] text-slate-400">via {it.source}</p>
                </div>
              </a>
            ))}
          </div>
        )}
      </>
    )}
  </section>
);

const VisualSearchResults = ({ store, external, externalLoading, externalError, onLoadExternal }) => {
  const hasStore = store && (store.exact.length > 0 || store.similar.length > 0);
  return (
    <div className="space-y-6">
      {store?.exact.length > 0 && (
        <section className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-extrabold text-slate-900 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-emerald-600" /> Best matches in Uni-Store
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{store.exact.map((l) => <MatchCard key={l._id} listing={l} />)}</div>
        </section>
      )}

      {store?.similar.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
            {store.exact.length > 0 ? 'Similar products' : 'Similar products on campus'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{store.similar.map((l) => <MatchCard key={l._id} listing={l} />)}</div>
        </section>
      )}

      {hasStore && !external && !externalLoading && (
        <button
          type="button"
          onClick={onLoadExternal}
          className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 cursor-pointer"
        >
          Also compare on Amazon &amp; Flipkart
        </button>
      )}

      {(external || externalLoading || externalError) && (
        <ExternalSection external={external} loading={externalLoading} error={externalError} />
      )}
    </div>
  );
};

export default VisualSearchResults;
