import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';
import fs from 'fs';

import { createPhoto, getAllPhotos } from './services/queries/photos';
import {
  createPhotoDefect,
  getPhotoDefectsByChatId,
} from './services/queries/photos_welds_defects';
import { getWeldsDefects } from './services/queries/welds_defects';

import { createDir, download, groupBy, sleep } from './services/utils';
import requestNeuroApi from './services/neuro_api';
import WeldDefect from './interfaces/WeldsDefect';
import PhotosDefects from './interfaces/PhotosDefects';

dotenv.config();

const bot = new TelegramBot(process.env.BOT_TOKEN!, { polling: true });
let defects: string[] = [];

// TODO try catch everywhere
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const defectsFromDb = await getAllDefects();
  if (defectsFromDb) {
    defects = defectsFromDb.map((defect) => defect.name);
  }

  const IsPhoto = msg.photo === undefined ? false : true;
  if (IsPhoto) {
    await sendMessage(chatId, 'Обрабатываю...');

    const fileId = msg.photo![msg.photo!.length - 1].file_id;
    const fileUniqueId = msg.photo![msg.photo!.length - 1].file_unique_id;
    const image = await bot.getFile(fileId);

    const downloadURL = `${process.env.TELEGRAM_API}file/bot${process.env.BOT_TOKEN}/${image.file_path}`;

    const now = Date.now();
    createDir(`./../images/${chatId}`);

    // todo guard on success
    download(
      downloadURL,
      `./../images/${chatId}/${now}_${fileUniqueId}.jpg`,
      function () {
        console.log('Done!');
      }
    );

    const insertedPhoto = await createPhoto(chatId, fileUniqueId);

    await sleep(3000);

    await requestNeuroApi(
      `C:/hackaton/images/${chatId}/${now}_${fileUniqueId}.jpg`
    );

    await bot.sendPhoto(
      chatId,
      `../images/${chatId}/${now}_${fileUniqueId}_out.jpg`
    );

    if (insertedPhoto) {
      await sendMessage(chatId, 'Сохранил ваше фото');
      await writeDefectsToDb(
        insertedPhoto[0].id,
        `../images/${chatId}/${now}_${fileUniqueId}_out_defects.txt`
      );
    } else {
      await sendMessage(chatId, 'Не удалось сохранить фото');
    }
  } else if (msg.text === 'stats') {
    const photosByChatId: PhotosDefects[] | null =
      await getPhotoDefectsByChatId(chatId);

    if (!photosByChatId || defects.length === 0) {
      await sendMessage(chatId, `Извините, статистика временно недоступна`);
      return;
    }

    const photos = groupBy(photosByChatId, 'photo_id');
    let photosWithoutDefects = 0;
    for (const value of photos.values()) {
      if (
        value.filter((defect) => defect.defect_name === null).length ===
        value.length
      ) {
        photosWithoutDefects++;
      }
    }

    const defectsByPhotos = getDefectsPercentile(defects, photosByChatId);

    await sendMessage(
      chatId,
      `
            Фото без дефектов: ${photosWithoutDefects}
            \nВсего фото: ${photos.size}
            \nВсего дефектов встречено: ${
              photosByChatId.filter((defect) => defect.defect_name !== null)
                .length
            }
            \n${defectsByPhotos}
        `
    );
  } else {
    const apologize = 'Простите, но я могу обрабатывать только фотографии';
    console.log(apologize);
    await sendMessage(chatId, apologize);
  }
});

const sendMessage = async (chatId: number, text: string) => {
  await bot.sendMessage(chatId, text);
};

const getAllDefects = async () => {
  const defects = await getWeldsDefects();
  return defects;
};

const getDefectsPercentile = (
  defects: string[],
  photosByChatId: PhotosDefects[]
) => {
  let answer = '';
  for (const defect of defects) {
    const defectCount = photosByChatId.filter(
      (photoDefect) => photoDefect.defect_name === defect
    ).length;
    const percentile = Math.round(
      (defectCount /
        photosByChatId.filter((defect) => defect.defect_name !== null).length) *
        100
    );
    answer += `${defect}: ${defectCount} (${percentile}%)\n`;
  }

  return answer;
};

const parseWeldDefectsFile = (path: string): number[] => {
  const data = fs.readFileSync(path);
  const splittedByLinesContent = data.toString().split('\n');
  splittedByLinesContent.pop();
  return splittedByLinesContent.map((line) => Number(line.split(' ')[0]));
};

const writeDefectsToDb = async (photoId: number, pathToFile: string) => {
  if (fs.existsSync(pathToFile)) {
    const defectIds = parseWeldDefectsFile(pathToFile);
    for (const defectId of defectIds) {
      await createPhotoDefect(photoId, defectId + 1);
    }
  }
};
