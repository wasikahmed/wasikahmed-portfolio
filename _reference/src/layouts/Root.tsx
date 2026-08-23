import { Outlet, useLocation } from 'react-router';
import { useEffect, useState } from 'react';
import Nav from '../components/Nav';
import Footer from '../components/Footer';

export default function Root() {
  const [progress, setProgress] = useState(0);
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      if (total > 0) setProgress((window.scrollY / total) * 100);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-bg text-text font-sans">
      {/* Left-edge scroll progress */}
      <div className="fixed left-0 top-0 w-[2px] h-screen z-50" style={{ background: 'rgba(15,191,122,0.06)' }}>
        <div
          className="w-full"
          style={{
            height: `${progress}%`,
            background: 'linear-gradient(to bottom, #0FBF7A, #7CE86A)',
            transition: 'height 0.1s linear',
          }}
        />
      </div>

      <Nav />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
