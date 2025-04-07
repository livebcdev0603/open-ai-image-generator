'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Download } from 'lucide-react';
import { ImageResponse, GenerateImageRequest } from '../types';

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState<string>('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [downloadLoading, setDownloadLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [error, setError] = useState<string>('');

  const handleGenerate = async (): Promise<void> => {
    if (!prompt.trim()) {
      setError('Please enter a prompt first');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSelectedImage(null);
      setProgress(0);
      
      const requestBody: GenerateImageRequest = { prompt };
      const response = await fetch('/api/generate-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate images');
      }

      const data: ImageResponse = await response.json();
      setImages(data.images);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate images');
    } finally {
      setLoading(false);
      setProgress(100);
    }
  };

  const handleImageSelect = (index: number): void => {
    setSelectedImage(index);
  };

  const handleDownload = async (): Promise<void> => {
    if (selectedImage === null) return;
    
    try {
      setDownloadLoading(true);
      
      // Use the proxy API endpoint to download the image
      const response = await fetch('/api/download-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl: images[selectedImage] }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to download image');
      }
      
      // Get the blob from the response
      const blob = await response.blob();
      console.log("blob", blob);
      // Create a downloadable link for the blob
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ai-generated-image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download image');
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleRegenerateWithStyle = async (): Promise<void> => {
    if (selectedImage === null) {
      setError('Please select an image first');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setProgress(0);
      
      const enhancedPrompt = `${prompt} in the same style as the selected image`;
      const requestBody: GenerateImageRequest = { prompt: enhancedPrompt };
      
      const response = await fetch('/api/generate-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate images');
      }

      const data: ImageResponse = await response.json();
      setImages(data.images);
      setSelectedImage(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate images');
    } finally {
      setLoading(false);
      setProgress(100);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="Enter your image prompt..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="flex-1"
          disabled={loading}
        />
        <Button onClick={handleGenerate} disabled={loading}>
          {loading ? `Generating... ${progress}%` : 'Generate 4 Images'}
        </Button>
      </div>

      {error && <p className="text-red-500">{error}</p>}

      {loading && (
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}

      {images.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {images.map((image, index) => (
              <Card 
                key={index} 
                className={`cursor-pointer overflow-hidden ${selectedImage === index ? 'ring-2 ring-blue-500' : ''}`}
                onClick={() => handleImageSelect(index)}
              >
                <CardContent className="p-2">
                  <img 
                    src={image} 
                    alt={`Generated image ${index + 1}`} 
                    className="w-full h-auto rounded"
                  />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button 
              onClick={handleDownload} 
              disabled={selectedImage === null || downloadLoading}
              className="flex items-center gap-2"
            >
              <Download size={16} />
              {downloadLoading ? 'Downloading...' : 'Download Selected'}
            </Button>
            <Button 
              onClick={handleRegenerateWithStyle} 
              disabled={selectedImage === null || loading}
              variant="outline"
            >
              Generate 4 New Images With This Style
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}