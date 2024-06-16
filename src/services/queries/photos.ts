import Photo from '../../interfaces/Photo.js';
import sql from '../db_connect.js';

export async function getPhotosByChatId(
  chatId: number
): Promise<Photo[] | null> {
  try {
    const photos = await sql`
    select
      *
    from photos
    where chat_id = ${chatId}
  `;

    return photos as unknown as Photo[];
  } catch (error: any) {
    console.log(`error in getPhotosByChatId: ${error}`);
    return null;
  }
}

export async function getAllPhotos(): Promise<Photo[] | null> {
  try {
    const photos = await sql`
      select
        *
      from photos
    `;

    return photos as unknown as Photo[];
  } catch (error: any) {
    console.log(`error in getAllPhotos: ${error}`);
    return null;
  }
}

export async function createPhoto(
  chatId: number,
  tgFileId: string
): Promise<Photo[] | null> {
  try {
    const photo = await sql`
      insert into photos
      (chat_id, tg_file_id, created_at)
      values
      (${chatId}, ${tgFileId}, ${Date.now()})

      returning *
    `;

    return photo as unknown as Photo[];
  } catch (error: any) {
    console.log(`error in createPhoto: ${error}`);
    return null;
  }
}
