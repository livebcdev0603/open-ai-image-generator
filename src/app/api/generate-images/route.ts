import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GenerateImageRequest, ImageResponse } from '../../../types';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY as string,
});

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json() as GenerateImageRequest;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // DALL-E 3 only supports n=1, so we need to make multiple requests
    const imagePromises = [];
    
    // Create 4 slightly different prompts to get variation
    const prompts = [
      prompt,
      `${prompt} with slight variation 1`,
      `${prompt} with slight variation 2`,
      `${prompt} with slight variation 3`
    ];
    
    // Generate 4 images in parallel
    for (const currentPrompt of prompts) {
      imagePromises.push(
        openai.images.generate({
          model: "dall-e-3",
          prompt: currentPrompt,
          n: 1, // DALL-E 3 only supports n=1
          size: "1024x1024",
        })
      );
    }
    
    // Wait for all promises to resolve
    const results = await Promise.all(imagePromises);
    
    // Extract image URLs from all responses
    const images = results.map(result => result.data[0].url);

    return NextResponse.json({ images } as ImageResponse);
  } catch (error) {
    console.error('Error generating images:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate images' },
      { status: 500 }
    );
  }
}