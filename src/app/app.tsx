// src/app/page.tsx
import MinesGame from '../components/grid';

export default function Home() {
  return (
    <div className="min-h-screen">
      <MinesGame />
    </div>
  );
}