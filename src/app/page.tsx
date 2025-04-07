import ImageGenerator from '../components/ImageGenerator';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-6 md:p-24">
      <div className="w-full max-w-5xl">
        <h1 className="text-4xl font-bold mb-6 text-center">AI Image Generator</h1>
        <ImageGenerator />
      </div>
    </main>
  );
}