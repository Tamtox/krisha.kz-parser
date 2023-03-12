const express = require("express");
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
import { Request, Response } from "express";

// Normalize text
const normalizeText = (str: string) => {
  let result = '';
  if (typeof str !== 'string') return result;
  result = str.replace(/\s/g, ' ');
  result = result.replace(/\\/g, '');
  result = result.replace(/\s+/g, ' ').trim();
  return result;
};

interface IFlatData {
  area: string;
  ceiling: string;
  city: string;
  isFormerDorm: string;
  floor: string;
  imageUrls: string[];
  materials: string;
  price: string;
  rooms: string;
  url: string;
  year: string;
}

// Html parser
const parsePage = async (url: string) => {
  // Get html page
  const pageRes = await axios.request({
    url,
    method: 'GET',
    responseType: 'blob',
  })
  const $ = cheerio.load(pageRes.data);
  // Get ad title info 
  const advertTitle = $('.offer__advert-title>h1').contents();
  const [rooms, area, floor] = normalizeText(advertTitle.text()).split(',');
  // Get ad description info
  const priceText = $('.offer__price').contents();
  const price = normalizeText(priceText.text());
  const advertInfo = $('.offer__advert-info').contents();
  // Get ad picture links
  const galleryItems = $('.gallery__small-list>li').contents();
  const imageUrls = galleryItems.map((i: number, el: any) => {
    return $(el).attr('data-photo-url');
  }).toArray();
  // Get ad description
  const descriptionText = $('.offer__short-description').contents();
  const descriptionArr = descriptionText.map((i: number, el: any) => {
    const rowText = $(el).contents();
    let title = '';
    let description = '';
    rowText.each((i: number, el: any) => {
      const descriptionRowText = normalizeText($(el).text())
      if (descriptionRowText) {
        title ? description = descriptionRowText : title = descriptionRowText;
      }
    });
    const descriptionItem = { title, description };
    return (descriptionItem.title && descriptionItem.description) ? descriptionItem : null;
  }).toArray();
  // Set data
  const flatData = { area, floor, imageUrls, price, rooms, url: url } as IFlatData;
  descriptionArr.forEach((item: { title: string, description: string }) => {
    const { title, description } = item;
    if (title === 'Город') {
      const fixedDesc = description.replace(" показать на карте", "");
      flatData.city = fixedDesc;;
    } else if (title === 'Тип дома') {
      flatData.materials = description;
    } else if (title === 'Год постройки') {
      flatData.year = description;
    } else if (title === 'Потолки') {
      flatData.ceiling = description;
    } else if (title === 'Бывшее общежитие') {
      flatData.isFormerDorm = description;
    }
  });
  return flatData;
}

const validateUrl = (url: string) => {
  const httpsRemoved = url.replace('https://', '')
  const [domain, a, show, id] = httpsRemoved.split('/');
  const numId = Number(id);
  if (domain === 'krisha.kz' && a === 'a' && show === 'show' && typeof (numId) === 'number') {
    return true;
  } else {
    return false;
  }
}

// Get route requires url
app.get('/parsePage', async (req: Request, res: Response) => {
  const { url } = req.body;
  let flatData: unknown;
  const validUrl = validateUrl(url);
  try {
    if (!validUrl) {
      throw new Error('Invalid URL');
    }
    flatData = await parsePage(url);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
  res.status(200).json({ flatData });
});


const startApp = async () => {
  console.dir(await parsePage('https://krisha.kz/a/show/681684217'));
  app.listen(8080);
  console.log('Listening on port 8080');
}

startApp();
