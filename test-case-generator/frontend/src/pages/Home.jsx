import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Home.css'

const FEATURES = [
  {
    icon: '📄',
    title: 'Upload Documents',
    desc: 'Upload your product specs or requirement PDFs and let the AI analyse them instantly.',
  },
  {
    icon: '🤖',
    title: 'AI-Generated Test Cases',
    desc: 'Our RAG pipeline reads your documents and generates relevant test cases automatically.',
  },
  {
    icon: '🗂️',
    title: 'Organise by Feature',
    desc: 'Group test cases under features, track their status, and manage them like a pro.',
  },
  {
    icon: '✅',
    title: 'Track Pass / Fail',
    desc: 'Mark each test case as Passed, Failed, Blocked or Untested and keep your runs up to date.',
  },
  {
    icon: '📝',
    title: 'Rich Test Case Details',
    desc: 'Add descriptions, steps, and expected results to every test case for full clarity.',
  },
  {
    icon: '🔒',
    title: 'Secure & Private',
    desc: 'Your data is tied to your account — no one else can see your features or test cases.',
  },
]

export default function Home() {
  const { user } = useAuth()

  return (
    <div className="landing">
      {/* ── Hero ── */}
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <div className="landing-badge">AI-Powered QA</div>
          <h1 className="landing-h1">
            Generate test cases <br />
            <span className="landing-h1-accent">from your docs in seconds</span>
          </h1>
          <p className="landing-sub">
            Upload a PDF spec, pick a feature, and let the AI write test cases for you.
            Manage, track, and document everything in one place.
          </p>
          <div className="landing-cta">
            {user ? (
              <>
                <Link to="/upload" className="landing-btn-primary">Go to Upload</Link>
                <Link to="/features" className="landing-btn-secondary">My Features</Link>
              </>
            ) : (
              <>
                <Link to="/register" className="landing-btn-primary">Get started free</Link>
                <Link to="/login" className="landing-btn-secondary">Sign in</Link>
              </>
            )}
          </div>
        </div>

        {/* decorative glow */}
        <div className="landing-glow" />
      </section>

      {/* ── How it works ── */}
      <section className="landing-steps">
        <h2 className="landing-section-title">How it works</h2>
        <div className="landing-steps-grid">
          {[
            { n: '1', title: 'Upload your PDF', desc: 'Drop in your requirements or spec document.' },
            { n: '2', title: 'Run the AI pipeline', desc: 'Our RAG model reads and understands your document.' },
            { n: '3', title: 'Get test cases', desc: 'Receive a full set of test cases mapped to your feature.' },
          ].map((s) => (
            <div key={s.n} className="landing-step">
              <div className="landing-step-num">{s.n}</div>
              <div className="landing-step-title">{s.title}</div>
              <div className="landing-step-desc">{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features grid ── */}
      <section className="landing-features">
        <h2 className="landing-section-title">Everything you need</h2>
        <div className="landing-features-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="landing-feature-card">
              <div className="landing-feature-icon">{f.icon}</div>
              <div className="landing-feature-title">{f.title}</div>
              <div className="landing-feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      {!user && (
        <section className="landing-bottom-cta">
          <h2 className="landing-bottom-title">Ready to ship better software?</h2>
          <p className="landing-bottom-sub">Create your free account and start generating test cases today.</p>
          <Link to="/register" className="landing-btn-primary">Get started free</Link>
        </section>
      )}
    </div>
  )
}
