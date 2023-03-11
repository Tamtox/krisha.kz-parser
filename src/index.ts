const express = require("express");
const _ = require('lodash');
const axios = require('axios');
const cheerio = require('cheerio');


const app = express();
import { Request, Response } from "express";

app.get('/parsePage', (req: Request, res: Response) => {
  const { url } = req.body;
  console.log(url);
});

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
  description: string;
  floor: string;
  imageUrls: string[];
  price: string;
  rooms: string;
  url: string;
}

// Html parser
const parsePage = async (url: string) => {
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
  const decriptionText = $('.offer__description').contents();
  const description = normalizeText(decriptionText.text());
  // const main = $('.layout__content').contents();
  const flatData: IFlatData = { rooms, area, floor, price, description, url, imageUrls };
  return flatData;
}

const startApp = async () => {
  console.dir(await parsePage('https://krisha.kz/a/show/683091464'));
  app.listen(8080);
  console.log('Listening on port 8080');
}

startApp();
