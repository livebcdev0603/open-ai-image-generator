import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { imageUrl } = await request.json();
    console.log(imageUrl);
    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    }
    
    // Fetch the image from OpenAI's servers (server-side to avoid CORS issues)
    const response = await fetch(imageUrl);
    console.log(response)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    // Get the image data
    const imageData = await response.blob();
    
    // Return the image data directly
    return new NextResponse(imageData, {
      headers: {
        'Content-Type': imageData.type,
        'Content-Disposition': 'attachment; filename="ai-generated-image.png"',
      },
    });
  } catch (error) {
    console.error('Error downloading image:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to download image' },
      { status: 500 }
    );
  }
}