import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GenerateImageRequest, ImageResponse } from '../../../types';

// Initialize OpenAI client outside the handler to prevent re-initialization on every request
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    // Add error handling for JSON parsing
    let prompt: string;
    try {
      const body = await request.json() as GenerateImageRequest;
      prompt = body.prompt;
    } catch (e) {
      console.log(e);
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Check if API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not set');
      return NextResponse.json({ error: 'API configuration error' }, { status: 500 });
    }

    // Create 4 slightly different prompts
    const prompts = [
      prompt,
      `${prompt} with slight variation 1`,
      `${prompt} with slight variation 2`,
      `${prompt} with slight variation 3`
    ];
    
    const images: string[] = [];

    // Use sequential requests instead of Promise.all to avoid rate limiting issues
    for (const currentPrompt of prompts) {
      try {
        const result = await openai.images.generate({
          model: "dall-e-3",
          prompt: currentPrompt,
          n: 1,
          size: "1024x1024",
        });
        
        if (result.data[0].url) {
          images.push(result.data[0].url);
        }
      } catch (imageError) {
        // Log specific image generation error but continue with other prompts
        console.error(`Error generating image for prompt "${currentPrompt.substring(0, 20)}...":`, imageError);
      }
    }

    // Return whatever images were successfully generated
    if (images.length === 0) {
      return NextResponse.json({ error: 'Failed to generate any images' }, { status: 500 });
    }

    return NextResponse.json({ images } as ImageResponse);
    
  } catch (error) {
    console.error('Error in image generation endpoint:', error);
    
    // Provide more specific error information
    let errorMessage = 'Failed to generate images';
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Check for specific OpenAI error types
      if (error.message.includes('rate limit')) {
        statusCode = 429;
        errorMessage = 'OpenAI API rate limit exceeded. Please try again later.';
      } else if (error.message.includes('authentication')) {
        statusCode = 401;
        errorMessage = 'OpenAI API authentication error. Check your API key.';
      }
    }
    
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
