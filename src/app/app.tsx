// src/app/page.tsx
import MinesGame from '../components/grid';


export default function Home() {
  return (
    <div className="flex flex-col flex-1 h-full w-full text-white overflow-hidden safe-height">
      <MinesGame />
    </div>
  );
}