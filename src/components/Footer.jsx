export default function Footer() {
  return (
    <footer className="content-layer">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'var(--f-display)', fontWeight: 600 }}>
        <div style={{ width: '24px', height: '24px', borderRadius: '7px', background: 'var(--indigo)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800, color: '#fff' }}>A</div>
        AdaptivePath
      </div>
      <div>Built with FastAPI · Three.js · PyTorch · Stable-Baselines3</div>
      <div style={{ display: 'flex', gap: '20px' }}>
        <a href="#">Privacy</a>
        <a href="#">Terms</a>
        <a href="#">GitHub</a>
      </div>
    </footer>
  )
}
