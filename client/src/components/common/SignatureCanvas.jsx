import React, { Component } from 'react';

/**
 * SignatureCanvas (Class Component per user request)
 * Handles HTML5 Canvas mouse/touch drawing for digital e-Signature Proof of Delivery
 */
export class SignatureCanvas extends Component {
  constructor(props) {
    super(props);
    this.canvasRef = React.createRef();
    this.state = {
      isDrawing: false,
      hasSignature: false,
    };
  }

  componentDidMount() {
    this.initCanvas();
  }

  initCanvas = () => {
    const canvas = this.canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  };

  startDrawing = (e) => {
    const canvas = this.canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    this.setState({ isDrawing: true, hasSignature: true });
  };

  draw = (e) => {
    if (!this.state.isDrawing) return;
    const canvas = this.canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  stopDrawing = () => {
    if (this.state.isDrawing) {
      this.setState({ isDrawing: false });
      if (this.props.onSaveSignature && this.canvasRef.current) {
        this.props.onSaveSignature(this.canvasRef.current.toDataURL());
      }
    }
  };

  clearCanvas = () => {
    const canvas = this.canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      this.setState({ hasSignature: false });
      if (this.props.onSaveSignature) {
        this.props.onSaveSignature(null);
      }
    }
  };

  render() {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-on-surface">
          <span>Tanda Tangan Digital Penerima Barang (e-Signature):</span>
          <button
            type="button"
            onClick={this.clearCanvas}
            className="text-xs text-rose-600 hover:underline font-bold"
          >
            Hapus / Ulangi
          </button>
        </div>
        <div className="border border-border-glass rounded-2xl overflow-hidden bg-surface relative">
          <canvas
            ref={this.canvasRef}
            width={400}
            height={150}
            onMouseDown={this.startDrawing}
            onMouseMove={this.draw}
            onMouseUp={this.stopDrawing}
            onTouchStart={this.startDrawing}
            onTouchMove={this.draw}
            onTouchEnd={this.stopDrawing}
            className="w-full h-36 cursor-crosshair touch-none bg-surface-variant/20"
          />
          {!this.state.hasSignature && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-xs text-on-surface-variant/60">
              Goreskan tanda tangan di sini
            </div>
          )}
        </div>
      </div>
    );
  }
}
