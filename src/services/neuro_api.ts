import axios from 'axios';

export default async function requestNeuroApi(
  pathToFile: string
): Promise<string> {
  try {
    const url = process.env.NEURO_URL!;

    const response = await axios.post(url, pathToFile, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10_000,
    });

    return response.data.pathToFile;
  } catch (err: any) {
    console.log(`err: ${err}`);
    return 'error';
  }
}
