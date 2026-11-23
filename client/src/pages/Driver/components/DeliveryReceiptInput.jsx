import React, { useRef, useState } from 'react';
export function DeliveryReceiptInput({ policy, name, signature, onName, onSignature }) {
  const canvas = useRef(null),
    stroke = useRef(null),
    ink = useRef(false);
  const [drawingCanvas, setDrawingCanvas] = useState(!signature);
  const nameMode = policy.DELIVERY_RECIPIENT_MODE || 'OPTIONAL',
    signatureMode = policy.DELIVERY_SIGNATURE_MODE || 'DISABLED';
  if (nameMode === 'DISABLED' && signatureMode === 'DISABLED') return null;
  const point = (e) => {
    const r = canvas.current.getBoundingClientRect();
    return [((e.clientX - r.left) * 600) / r.width, ((e.clientY - r.top) * 180) / r.height];
  };
  return (
    <section
      className="rounded-xl border border-border-glass p-4 space-y-3"
      aria-label="Bukti penerimaan barang"
    >
      <h4 className="font-bold">Penerima barang</h4>
      <p className="text-sm">Untuk barang yang diterima. Bukti ini tidak mencatat pembayaran.</p>
      {nameMode !== 'DISABLED' && (
        <label className="block">
          Nama penerima {nameMode === 'REQUIRED' || signature ? '(wajib)' : '(opsional)'}
          <input
            className="form-input block w-full"
            maxLength={200}
            minLength={2}
            placeholder="Nama penerima di toko"
            required={nameMode === 'REQUIRED' || !!signature}
            value={name || ''}
            onChange={(e) => onName(e.target.value)}
          />
        </label>
      )}
      {signatureMode !== 'DISABLED' && (
        <div className="space-y-2">
          <p>Tanda tangan penerima {signatureMode === 'REQUIRED' ? '(wajib)' : '(opsional)'}</p>
          {signature && !drawingCanvas ? (
            <img
              src={signature}
              alt={`Tanda tangan ${name || 'penerima'}`}
              className="w-full max-w-xl h-36 object-contain bg-white border rounded-xl"
            />
          ) : (
            <>
              <p className="text-sm">
                Minta penerima menggambar dengan jari, stylus, atau mouse pada kotak berikut (bisa beberapa goresan).
              </p>
              <canvas
                ref={canvas}
                width={600}
                height={180}
                aria-label="Area menggambar tanda tangan penerima"
                className="block w-full max-w-xl bg-white border rounded-xl"
                style={{ touchAction: 'none' }}
                onPointerDown={(e) => {
                  if (e.button !== 0) return;
                  e.currentTarget.setPointerCapture(e.pointerId);
                  stroke.current = point(e);
                  ink.current = true;
                }}
                onPointerMove={(e) => {
                  if (!stroke.current) return;
                  const next = point(e),
                    ctx = canvas.current.getContext('2d');
                  ctx.strokeStyle = '#111827';
                  ctx.lineWidth = 2.5;
                  ctx.lineCap = 'round';
                  ctx.beginPath();
                  ctx.moveTo(...stroke.current);
                  ctx.lineTo(...next);
                  ctx.stroke();
                  ink.current = true;
                  stroke.current = next;
                }}
                onPointerUp={() => {
                  if (stroke.current && ink.current)
                    onSignature(canvas.current.toDataURL('image/png'));
                  stroke.current = null;
                }}
                onPointerCancel={() => {
                  stroke.current = null;
                }}
              />
            </>
          )}
          {signature && (
            <button
              type="button"
              className="app-button min-h-11"
              onClick={() => {
                onSignature('');
                setDrawingCanvas(true);
                ink.current = false;
                canvas.current?.getContext('2d').clearRect(0, 0, 600, 180);
              }}
            >
              {drawingCanvas ? 'Hapus tanda tangan' : 'Ulang tanda tangan'}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
