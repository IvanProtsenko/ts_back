import PhotoWeldsDefect from '../../interfaces/PhotoWeldsDefect.js';
import PhotosDefects from '../../interfaces/PhotosDefects.js';
import sql from '../db_connect.js';

export async function getPhotoDefectsByChatId(
  chatId: number
): Promise<PhotosDefects[] | null> {
  try {
    const photoDefects = await sql`
      select
        p.id as photo_id, wd.name as defect_name
      from photos_welds_defects as pwd
      FULL JOIN photos as p ON
      pwd.photo_id = p.id
      FULL JOIN welds_defects as wd ON
      pwd.defect_id = wd.id
      where p.chat_id = ${chatId}
    `;

    return photoDefects as unknown as PhotosDefects[];
  } catch (error: any) {
    console.log(`error in getPhotoDefectsByChatId: ${error}`);
    return null;
  }
}

export async function createPhotoDefect(
  photoId: number,
  defectId: number
): Promise<PhotoWeldsDefect[] | null> {
  try {
    const photoDefect = await sql`
      insert into photos_welds_defects
      (photo_id, defect_id)
      values
      (${photoId}, ${defectId})

      returning *
    `;

    return photoDefect as unknown as PhotoWeldsDefect[];
  } catch (error: any) {
    console.log(`error in createPhotoDefect: ${error}`);
    return null;
  }
}
