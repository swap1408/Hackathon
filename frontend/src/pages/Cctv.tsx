import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function VideoTile({ src }: { src: string }) {
  const [snap, setSnap] = useState<string | null>(null);
  const takeSnapshot = async () => {
    const video = document.getElementById(src) as HTMLVideoElement;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 360;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    try {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const url = canvas.toDataURL('image/png');
      setSnap(url);
    } catch {}
  };
  return (
    <Card className="p-3">
      <video id={src} controls className="w-full h-40 bg-black" src={src} />
      <div className="flex gap-2 mt-2">
        <Button size="sm" onClick={takeSnapshot}>Snapshot</Button>
        <Button size="sm" variant="outline" onClick={() => window.open(src, '_blank')}>Download</Button>
      </div>
      {snap && (
        <div className="mt-2">
          <img src={snap} alt="snapshot" className="w-full" />
        </div>
      )}
    </Card>
  );
}

export default function CctvPage() {
  const vids = [
    'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  ];
  return (
    <div className="min-h-screen pb-20 bg-background">
      <header className="bg-primary text-primary-foreground p-6 shadow-lg">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold mb-1">CCTV</h1>
          <p className="text-primary-foreground/80">Live grid (simulated)</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {vids.map((v, i) => (
            <VideoTile key={i} src={v} />
          ))}
        </div>
      </main>
    </div>
  );
}