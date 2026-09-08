import { useRef, useEffect, useState } from 'react';

const VIDEO_URL = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_083109_283f3553-e28f-428b-a723-d639c617eb2b.mp4";

export default function VideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let rafId: number;

    const checkLoop = () => {
      if (!video.duration || video.duration === Infinity) {
        rafId = requestAnimationFrame(checkLoop);
        return;
      }

      const current = video.currentTime;
      const duration = video.duration;

      // Fade in during first 0.5s
      if (current < 0.5) {
        setOpacity(current / 0.5);
      }
      // Fade out during last 0.5s
      else if (current > duration - 0.5) {
        setOpacity(Math.max(0, (duration - current) / 0.5));
      }
      // Full opacity in between
      else {
        setOpacity(1);
      }

      // Manual loop with seamless transition
      if (current >= duration - 0.05) {
        setOpacity(0);
        setTimeout(() => {
          video.currentTime = 0;
          video.play();
        }, 100);
      }

      rafId = requestAnimationFrame(checkLoop);
    };

    video.play().then(() => {
      rafId = requestAnimationFrame(checkLoop);
    }).catch(() => {
      // Autoplay blocked, try muted
      video.muted = true;
      video.play().then(() => {
        rafId = requestAnimationFrame(checkLoop);
      });
    });

    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      <video
        ref={videoRef}
        src={VIDEO_URL}
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity, transition: 'opacity 0.15s ease' }}
      />
      {/* Overlay gradient for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/20 to-white/95" />
    </div>
  );
}
