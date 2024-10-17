import OpenAI from 'openai';

type ImageSize = '1024x1024' | '256x256' | '512x512' | '1792x1024' | '1024x1792';
type ImageQuality = 'standard' | 'hd';

const generateImages = async (
  prompt: string = '', 
  model: string = 'dall-e-3', 
  size: string = '1024x1024', 
  quality: string = 'standard', 
  quantity: number = 1
): Promise<void> => {
  if (!prompt) {
    throw new Error('No prompt provided. Please provide a prompt to generate images.');
  }


  const openai = new OpenAI();

  try {
    const response = await openai.images.generate({
      model,
      prompt,
      size: size as ImageSize,
      quality: quality as ImageQuality,
      n: quantity,
    });

    // Output the URLs of the generated images
    response.data.forEach(image => {
      process.stdout.write(image.url + '\n');
    });
  } catch (error) {
    console.error('Error while generating images:', error);
    process.exit(1);
  }
};

export { generateImages };
