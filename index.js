const { Telegraf } = require('telegraf');
const axios = require('axios');

// تنظیمات
const BOT_TOKEN = '7109843159:AAELKwrpvg1RhD5ZEYKWCS0u_ddeTOU2bEI'; // توکن بات خود را جایگزین کنید
const CHANNEL_ID = '-1002408872436'; // آیدی کانال خود را جایگزین کنید
const API_URL = 'https://one-api.ir/price/?token=645888:669bf7ffa1c57&action=tgju';

// ایجاد نمونه بات
const bot = new Telegraf(BOT_TOKEN);

// تابع دریافت قیمت و ارسال به کانال
async function fetchAndSendPrice() {
  try {
    const response = await axios.get(API_URL);
    const price = response.data.result.currencies.dollar.p;
    
    // ارسال پیام به کانال
    await bot.telegram.sendMessage(
      CHANNEL_ID,
      `(در حال پارگی)💰 قیمت فعلی دلار: ${price} ریال`
    );
    
    console.log('پیام با موفقیت ارسال شد:', price);
  } catch (error) {
    console.error('خطا:', error.message);
  }
}

// تنظیم تایمر برای اجرای هر ۳ دقیقه
setInterval(fetchAndSendPrice, 180000); // 180000ms = 3 دقیقه

// اجرای اولیه
fetchAndSendPrice();

// راهاندازی بات
bot.launch().then(() => {
  console.log('بات راهاندازی شد!');
});

// مدیریت خروج تمیز
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));