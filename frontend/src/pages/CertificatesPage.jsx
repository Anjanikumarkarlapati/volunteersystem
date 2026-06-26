import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';
import { Award, Download, RefreshCw, Clock, CheckCircle2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── helpers ─────────────────────────────────── */
function formatDate(d) {
  return new Date(d || Date.now()).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function generateCertNo(id) {
  const short = (id || '0').toString().slice(-6).padStart(6, '0');
  return `CERT-${new Date().getFullYear()}-${short.toUpperCase()}`;
}

/* ─── Certificate renderer (DOM) ─────────────── */
function CertificateView({ data }) {
  const { volunteerName, taskName, organizerName, hours, dateIssued, certNumber } = data;

  return (
    <div
      id="cert-canvas"
      style={{
        width: '1056px',
        height: '748px',
        background: '#fff',
        border: '3px solid #1a2e5a',
        padding: '10px',
        fontFamily: "'Georgia', serif",
        position: 'relative',
        boxSizing: 'border-box',
        flexShrink: 0,
      }}
    >
      {/* Gold inner border */}
      <div
        style={{
          border: '1.5px solid #c9a83c',
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
          padding: '32px 64px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {/* Logo */}
        <svg width="44" height="52" viewBox="0 0 40 48">
          <ellipse cx="20" cy="16" rx="14" ry="16" fill="#1a2e5a" />
          <ellipse cx="20" cy="16" rx="7" ry="8" fill="#16a34a" transform="rotate(-15 20 16)" />
        </svg>

        <h1
          style={{
            fontSize: '26px',
            fontWeight: 700,
            color: '#1a2e5a',
            margin: '8px 0 2px',
            fontFamily: 'sans-serif',
            letterSpacing: '-0.5px',
          }}
        >
          Volunteer Hub
        </h1>
        <p
          style={{
            fontSize: '14px',
            color: '#c9a83c',
            fontStyle: 'italic',
            margin: '0 0 16px',
          }}
        >
          Certificate of Appreciation
        </p>
        <hr style={{ width: '80%', border: 'none', borderTop: '1px solid #c9a83c' }} />

        <p style={{ fontSize: '14px', color: '#555', margin: '20px 0 4px' }}>
          This certificate is proudly presented to
        </p>
        <h2
          style={{
            fontSize: '44px',
            color: '#1a2e5a',
            margin: '0 0 8px',
            fontWeight: 700,
          }}
        >
          {volunteerName}
        </h2>
        <hr
          style={{
            width: '40%',
            border: 'none',
            borderTop: '2px solid #c9a83c',
            marginBottom: '16px',
          }}
        />

        <p style={{ fontSize: '13px', color: '#555', margin: '0 0 4px' }}>
          for successfully completing
        </p>
        <h3 style={{ fontSize: '22px', color: '#1a2e5a', margin: '0 0 8px' }}>{taskName}</h3>
        <p style={{ fontSize: '13px', color: '#555', margin: '0' }}>
          and contributing <strong style={{ color: '#1a2e5a' }}>{hours} hours</strong> of dedicated
          volunteer service
        </p>
        <p style={{ fontSize: '13px', color: '#555', margin: '4px 0 0' }}>
          Organized by <strong style={{ color: '#1a2e5a' }}>{organizerName}</strong>
        </p>

        {/* Seal */}
        <div
          style={{
            margin: '20px 0',
            width: '84px',
            height: '84px',
            borderRadius: '50%',
            border: '2px solid #c9a83c',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(201,168,60,0.05)',
          }}
        >
          <span style={{ fontSize: '30px' }}>★</span>
          <span
            style={{
              fontSize: '7px',
              color: '#c9a83c',
              fontFamily: 'sans-serif',
              letterSpacing: '1px',
              fontWeight: 600,
            }}
          >
            CERTIFIED
          </span>
        </div>

        {/* Footer row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%',
            marginTop: 'auto',
            paddingTop: '12px',
          }}
        >
          <div
            style={{
              borderTop: '1px solid #aaa',
              paddingTop: '6px',
              fontSize: '11px',
              color: '#888',
              fontFamily: 'sans-serif',
              minWidth: '180px',
            }}
          >
            Organization Representative
          </div>
          <div
            style={{
              borderTop: '1px solid #aaa',
              paddingTop: '6px',
              fontSize: '11px',
              color: '#888',
              fontFamily: 'sans-serif',
              textAlign: 'right',
              minWidth: '180px',
            }}
          >
            {dateIssued}
            <br />
            Date Issued
          </div>
        </div>

        <p
          style={{
            fontSize: '10px',
            color: '#aaa',
            margin: '8px 0 0',
            fontFamily: 'sans-serif',
          }}
        >
          Volunteer Hub Platform · volunteerhub.app · Cert No: <strong>{certNumber}</strong>
        </p>
      </div>

      {/* Watermark */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%,-50%) rotate(-30deg)',
          fontSize: '80px',
          fontWeight: 700,
          color: 'rgba(26,46,90,0.055)',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          fontFamily: 'sans-serif',
          userSelect: 'none',
        }}
      >
        {volunteerName.toUpperCase()}
      </div>
    </div>
  );
}

/* ─── Certificate Card (preview thumbnail) ───── */
function CertCard({ cert, onSelect, selected }) {
  return (
    <motion.button
      layout
      onClick={() => onSelect(cert)}
      className={`w-full text-left rounded-2xl border-2 p-4 transition-all duration-200 ${
        selected
          ? 'border-[#1a2e5a] bg-[#1a2e5a]/5 shadow-md'
          : 'border-outline-variant bg-white hover:border-[#c9a83c]/60 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1a2e5a]/10">
          <Award className="h-5 w-5 text-[#1a2e5a]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-on-surface truncate">{cert.taskName}</p>
          <p className="text-xs text-on-surface-variant mt-0.5 truncate">{cert.organizerName}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="inline-flex items-center gap-1 text-[11px] text-on-surface-variant">
              <Clock className="h-3 w-3" />
              {cert.hours} hrs
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-[#16a34a] font-semibold">
              <CheckCircle2 className="h-3 w-3" />
              Completed
            </span>
          </div>
        </div>
        <ChevronRight
          className={`h-4 w-4 mt-1 shrink-0 transition-colors ${selected ? 'text-[#1a2e5a]' : 'text-on-surface-variant'}`}
        />
      </div>
    </motion.button>
  );
}

/* ─── Main Page ────────────────────────────────── */
export default function CertificatesPage() {
  const { user } = useAuth();
  const [certs, setCerts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const certRef = useRef(null);

  /* Load completed attendances to build certificates */
  useEffect(() => {
    setLoading(true);
    api
      .get('/attendance?status=verified')
      .then(res => {
        const rows = Array.isArray(res.data) ? res.data : res.data?.data || [];
        const mapped = rows.map((r, i) => ({
          id: r.id || i,
          volunteerName: user?.name || 'Volunteer',
          taskName: r.event_title || r.title || 'Volunteer Event',
          organizerName: r.organization_name || r.organizer || 'Volunteer Hub',
          hours: parseFloat(r.hours || r.volunteer_hours || 0).toFixed(1),
          dateIssued: formatDate(r.check_out_at || r.updated_at),
          certNumber: generateCertNo(r.id || String(i + 42)),
        }));
        setCerts(mapped);
        if (mapped.length > 0) setSelected(mapped[0]);
      })
      .catch(() => {
        /* fallback: show sample if API fails */
        const sample = [
          {
            id: 'demo-1',
            volunteerName: user?.name || 'Volunteer',
            taskName: 'Tree Plantation Drive',
            organizerName: 'Green Earth Foundation',
            hours: '4.5',
            dateIssued: formatDate(new Date()),
            certNumber: generateCertNo('000042'),
          },
        ];
        setCerts(sample);
        setSelected(sample[0]);
      })
      .finally(() => setLoading(false));
  }, [user]);

  /* Download using html2canvas from CDN */
  const handleDownload = async () => {
    if (!selected) return;
    setDownloading(true);

    /* Lazy-load html2canvas from CDN */
    if (!window.html2canvas) {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }

    try {
      const el = document.getElementById('cert-canvas');
      const canvas = await window.html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      const link = document.createElement('a');
      link.download = `certificate-${selected.volunteerName.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-on-surface-variant" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-on-surface">My Certificates</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            {certs.length} certificate{certs.length !== 1 ? 's' : ''} earned · Click one to preview
          </p>
        </div>
        {selected && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center gap-2 rounded-xl bg-[#1a2e5a] px-5 py-2.5 text-sm font-bold text-white shadow hover:opacity-90 transition-all disabled:opacity-60"
          >
            {downloading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {downloading ? 'Generating…' : 'Download PNG'}
          </motion.button>
        )}
      </div>

      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Left: list */}
        <div className="w-full lg:w-72 shrink-0 space-y-2">
          {certs.length === 0 ? (
            <div className="rounded-2xl border border-outline-variant bg-white p-8 text-center">
              <Award className="h-10 w-10 text-on-surface-variant mx-auto mb-3 opacity-40" />
              <p className="text-sm font-semibold text-on-surface">No certificates yet</p>
              <p className="text-xs text-on-surface-variant mt-1">
                Complete and verify volunteer events to earn certificates.
              </p>
            </div>
          ) : (
            certs.map(c => (
              <CertCard
                key={c.id}
                cert={c}
                selected={selected?.id === c.id}
                onSelect={setSelected}
              />
            ))
          )}
        </div>

        {/* Right: preview */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="rounded-2xl border border-outline-variant bg-white p-4 shadow-sm overflow-auto"
              >
                {/* Cert label */}
                <div className="flex items-center justify-between mb-4 px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
                      Preview
                    </span>
                    <span className="rounded-full bg-[#16a34a]/10 px-2 py-0.5 text-[10px] font-bold text-[#16a34a] uppercase tracking-wider">
                      {selected.certNumber}
                    </span>
                  </div>
                  <span className="text-[11px] text-on-surface-variant">
                    Issued {selected.dateIssued}
                  </span>
                </div>

                {/* Scroll wrapper for wide cert */}
                <div className="overflow-x-auto" ref={certRef}>
                  <CertificateView data={selected} />
                </div>

                <p className="text-center text-[11px] text-on-surface-variant mt-4">
                  Click <strong>Download PNG</strong> above to save a print-ready copy.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex h-64 items-center justify-center rounded-2xl border border-outline-variant bg-white"
              >
                <p className="text-sm text-on-surface-variant">Select a certificate to preview</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
