import Image from "next/image";

export default function Home() {
  return (
    <main>
      <p className="text-lg flex justify-center">Hello George</p>
      <div className="grid grid-cols-3 gap-4">
        <div className="card1">
          <p className="flex items-center justify-center outline aspect-square">Card 1</p>
        </div>
        <div className="card2">
          <p className="flex items-center justify-center outline aspect-square">Card 2</p>
        </div>
        <div className="card3">
          <p className="flex items-center justify-center outline aspect-square">Card 3</p>
        </div>
      </div>
    </main>
  );
}
