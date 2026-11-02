import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, Upload, X, RefreshCw, Check, Loader2, Sparkles, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import useCamera from './useCamera';
import VisualSearchResults from './VisualSearchResults';
import { compressImageFile } from '../../utils/imageCompressor';
import { identifyProductImage, searchStoreByIdentification, searchExternalByIdentification } from '../../services/api';

export const OPEN_VISUAL_SEARCH_EVENT = 'uni:open-visual-search';

const dataUrlToBlob = (dataUrl) => {
  const [meta, b64] = dataUrl.split(',');
  const mime = /data:(.*?);/.exec(meta)?.[1] || 'image/jpeg';
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
};

const friendlyError = (err) => {
  if (err?.code === 'ERR_CANCELED') return '';
  if (err?.code === 'ECONNABORTED') return 'The request timed out. Please check your connection and try again.';
  if (!err?.response) return 'Could not reach the server. Please check your internet connection and try again.';
  const status = err.response.status;
  if (status === 429) return err.response.data?.message || 'Too many searches right now. Please wait a moment and try again.';
  if (status === 401) return 'Please log in to use visual search.';
  if (status === 413) return 'That photo is too large. Try a smaller one.';
  return err.response.data?.message || 'Something went wrong. Please try again.';
};

const STEPS = [
  { key: 'upload', label: 'Uploading photo' },
  { key: 'identify', label: 'AI identifying product & removing background' },
  { key: 'search', label: 'Searching Uni-Store' },
];

/**
 * Google-Lens-style visual search: camera / upload -> preview -> AI identify & isolate -> store results
 * -> (if none) Amazon & Flipkart alternatives.
 */
const VisualSearchModal = ({ open, onClose }) => {
  const camera = useCamera();
  const fileRef = useRef(null);
  const abortRef = useRef(null);

  const [stage, setStage] = useState('camera'); // camera | preview | processing | results
  const [imageBlob, setImageBlob] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [ident, setIdent] = useState(null);
  const [isolated, setIsolated] = useState(null);
  const [store, setStore] = useState(null);
  const [external, setExternal] = useState(null);
  const [externalLoading, setExternalLoading] = useState(false);
  const [externalError, setExternalError] = useState('');

  const { start: startCamera, stop: stopCamera } = camera;

  const resetResults = () => {
    setIdent(null); setIsolated(null); setStore(null); setExternal(null);
    setExternalError(''); setExternalLoading(false); setError(''); setStep(0);
  };

  const setImage = useCallback((blob) => {
    setImageBlob(blob);
    setPreviewUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return blob ? URL.createObjectURL(blob) : '';
    });
  }, []);

  const goCamera = useCallback(() => {
    abortRef.current?.abort();
    setImage(null);
    resetResults();
    setStage('camera');
    startCamera('environment');
  }, [setImage, startCamera]);

  // Open / close lifecycle: start camera on open, always release it on close.
  useEffect(() => {
    if (!open) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = setTimeout(goCamera, 0);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = prevOverflow;
      abortRef.current?.abort();
      stopCamera();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => () => previewUrl && URL.revokeObjectURL(previewUrl), [previewUrl]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const handleCapture = async () => {
    try {
      const blob = await camera.capture();
      stopCamera();
      setImage(blob);
      setError('');
      setStage('preview');
    } catch (e) {
      setError(e.message);
    }
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const dataUrl = await compressImageFile(file, 1280, 0.85);
      stopCamera();
      setImage(dataUrlToBlob(dataUrl));
      setError('');
      setStage('preview');
    } catch (err) {
      setError(err.message || 'Could not read that image. Please try a JPG, PNG or WebP photo.');
    }
  };

  const runSearch = async () => {
    if (!imageBlob) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    resetResults();
    setStage('processing');
    try {
      setStep(1);
      const idRes = await identifyProductImage(imageBlob, ctrl.signal);
      const data = idRes.data?.data;
      if (!data?.isProduct) {
        setError(data?.message || "We couldn't spot a product in that photo.");
        setStage('preview');
        return;
      }
      setIdent(data.identification);
      setIsolated({ src: data.isolatedImage, ...data.processing });

      setStep(2);
      const sRes = await searchStoreByIdentification(data.identification, ctrl.signal);
      const found = sRes.data?.data;
      setStore(found);
      setStage('results');

      if (!found?.found) await loadExternal(data.identification, ctrl.signal);
    } catch (err) {
      const msg = friendlyError(err);
      if (msg) {
        setError(msg);
        setStage((s) => (s === 'results' ? s : 'preview'));
      }
    }
  };

  const loadExternal = async (identification = ident, signal) => {
    if (!identification) return;
    setExternalLoading(true);
    setExternalError('');
    try {
      const res = await searchExternalByIdentification(identification, signal);
      setExternal(res.data?.data);
    } catch (err) {
      setExternalError(friendlyError(err) || 'Could not load alternatives.');
    } finally {
      setExternalLoading(false);
    }
  };

  if (!open) return null;

  const showCamera = stage === 'camera';
  const busy = stage === 'processing';

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-slate-950/70 backdrop-blur-md animate-fadeIn" role="dialog" aria-modal="true" aria-label="Search by photo">
      <div className="bg-white w-full sm:max-w-3xl max-h-[100dvh] sm:max-h-[92vh] sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center"><Sparkles className="w-4 h-4" /></span>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">Search by photo</h2>
              <p className="text-[11px] text-slate-500 leading-tight">AI finds your item on campus</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="p-2 rounded-full text-slate-500 hover:bg-slate-100 cursor-pointer"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {error && (
            <div role="alert" className="m-4 flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><span>{error}</span>
            </div>
          )}

          {/* CAMERA */}
          {showCamera && (
            <div className="p-4 space-y-3">
              <div className="relative aspect-[4/3] sm:aspect-video bg-slate-950 rounded-2xl overflow-hidden">
                <video ref={camera.videoRef} playsInline muted autoPlay className={`w-full h-full object-cover ${camera.facingMode === 'user' ? '-scale-x-100' : ''}`} />
                {camera.isActive && (
                  <div className="pointer-events-none absolute inset-6 sm:inset-10">
                    {['top-0 left-0 border-t-4 border-l-4 rounded-tl-2xl', 'top-0 right-0 border-t-4 border-r-4 rounded-tr-2xl', 'bottom-0 left-0 border-b-4 border-l-4 rounded-bl-2xl', 'bottom-0 right-0 border-b-4 border-r-4 rounded-br-2xl'].map((c) => (
                      <span key={c} className={`absolute w-8 h-8 border-white/90 ${c}`} />
                    ))}
                    <p className="absolute -bottom-1 inset-x-0 text-center text-[11px] font-semibold text-white/90 drop-shadow">Center the product in the frame</p>
                  </div>
                )}
                {!camera.isActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-white">
                    {camera.isStarting ? (
                      <><Loader2 className="w-8 h-8 animate-spin" /><p className="text-sm">Starting camera…</p></>
                    ) : (
                      <>
                        <Camera className="w-9 h-9 text-white/70" />
                        <p className="text-sm max-w-sm text-white/90">{camera.error || 'Allow camera access to take a photo of an item.'}</p>
                        <button type="button" onClick={() => camera.start('environment')} className="px-4 py-2 rounded-xl bg-white text-slate-900 text-sm font-bold cursor-pointer">Try camera again</button>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center gap-4">
                <button type="button" onClick={() => fileRef.current?.click()} className="flex flex-col items-center gap-1 text-slate-600 hover:text-emerald-700 cursor-pointer" aria-label="Upload a photo">
                  <span className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center"><Upload className="w-5 h-5" /></span>
                  <span className="text-[11px] font-semibold">Upload</span>
                </button>
                <button type="button" onClick={handleCapture} disabled={!camera.isActive} aria-label="Capture photo" className="w-[72px] h-[72px] rounded-full bg-white ring-4 ring-emerald-500 p-1.5 disabled:opacity-40 active:scale-95 transition cursor-pointer">
                  <span className="block w-full h-full rounded-full bg-gradient-to-br from-emerald-500 to-teal-600" />
                </button>
                <button type="button" onClick={camera.flip} disabled={!camera.isActive} className="flex flex-col items-center gap-1 text-slate-600 hover:text-emerald-700 disabled:opacity-40 cursor-pointer" aria-label="Switch camera">
                  <span className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center"><RefreshCw className="w-5 h-5" /></span>
                  <span className="text-[11px] font-semibold">Flip</span>
                </button>
              </div>
              <p className="text-center text-[11px] text-slate-400">Tip: on a phone, “Upload” also lets you take a photo with your camera app.</p>
            </div>
          )}

          {/* PREVIEW / PROCESSING / RESULTS share a top strip with the photo */}
          {!showCamera && (
            <div className="p-4 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <figure className="relative rounded-2xl overflow-hidden bg-slate-100 aspect-square">
                  <img src={previewUrl} alt="Your captured photo" className="w-full h-full object-cover" />
                  {busy && <div className="lens-scanline" />}
                  <figcaption className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/70 text-white text-[10px] font-bold">Your photo</figcaption>
                </figure>
                <figure className="relative rounded-2xl overflow-hidden lens-checker aspect-square flex items-center justify-center">
                  {isolated ? (
                    <img src={isolated.src} alt="Isolated product" className="w-full h-full object-contain p-2 lens-pop" />
                  ) : (
                    <span className="text-[11px] font-semibold text-slate-400 px-3 text-center">{busy ? 'Isolating product…' : 'Isolated product appears here'}</span>
                  )}
                  {isolated && (
                    <figcaption className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-emerald-700/90 text-white text-[10px] font-bold">
                      {isolated.backgroundRemoved ? 'Background removed' : 'Cropped to product'}
                    </figcaption>
                  )}
                </figure>
              </div>
              {isolated && !isolated.backgroundRemoved && isolated.backgroundNote && (
                <p className="text-[11px] text-slate-500 -mt-3">{isolated.backgroundNote}</p>
              )}

              {stage === 'preview' && (
                <div className="flex gap-3">
                  <button type="button" onClick={goCamera} className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 cursor-pointer"><ArrowLeft className="w-4 h-4" />Retake</button>
                  <button type="button" onClick={runSearch} className="flex-[2] inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-sm shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer"><Check className="w-4 h-4" />Search this photo</button>
                </div>
              )}

              {busy && (
                <ol className="space-y-2" aria-live="polite">
                  {STEPS.map((s, i) => {
                    const done = i < step;
                    const active = i === step;
                    return (
                      <li key={s.key} className={`flex items-center gap-2.5 text-sm font-semibold ${done ? 'text-emerald-700' : active ? 'text-slate-900' : 'text-slate-400'}`}>
                        {done ? <CheckCircle2 className="w-4 h-4" /> : active ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="w-4 h-4 rounded-full border-2 border-slate-300" />}
                        {s.label}
                      </li>
                    );
                  })}
                </ol>
              )}

              {ident && (
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2 lens-pop">
                  <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider text-emerald-700"><Sparkles className="w-3.5 h-3.5" />AI identified</div>
                  <h3 className="font-extrabold text-slate-900">{ident.productName}</h3>
                  <p className="text-xs text-slate-600">{ident.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[ident.category, ident.brand, ident.model, ident.color].filter(Boolean).map((t) => (
                      <span key={t} className="px-2 py-0.5 rounded-full bg-white border border-emerald-200 text-[11px] font-bold text-emerald-800">{t}</span>
                    ))}
                    {ident.confidence > 0 && <span className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-[11px] font-semibold text-slate-500">{Math.round(ident.confidence * 100)}% confident</span>}
                  </div>
                </div>
              )}

              {stage === 'results' && (
                <>
                  <VisualSearchResults store={store} external={external} externalLoading={externalLoading} externalError={externalError} onLoadExternal={() => loadExternal()} />
                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={goCamera} className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 cursor-pointer"><Camera className="w-4 h-4" />Retake photo</button>
                    <button type="button" onClick={runSearch} className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 cursor-pointer"><RefreshCw className="w-4 h-4" />Search again</button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
      </div>
    </div>
  );
};

export default VisualSearchModal;
