const { Telegraf } = require('telegraf');
const axios = require('axios');
const fs = require('fs');

// تنظیمات
const BOT_TOKEN = '7109843159:AAELKwrpvg1RhD5ZEYKWCS0u_ddeTOU2bEI';
const CHANNEL_ID = '-1002408872436';
const API_URL = 'https://one-api.ir/price/?token=645888:669bf7ffa1c57&action=tgju';
const STORAGE_FILE = 'lastPrice.json'; // فایل ذخیره آخرین قیمت

// ایجاد نمونه بات
const bot = new Telegraf(BOT_TOKEN);

// تابع ذخیره قیمت در فایل
function savePrice(price) {
  fs.writeFileSync(STORAGE_FILE, JSON.stringify({ lastPrice: price }));
}

// تابع دریافت قیمت از فایل
function getLastPrice() {
  try {
    const data = fs.readFileSync(STORAGE_FILE);
    return JSON.parse(data).lastPrice;
  } catch (error) {
    return null; // اگر فایل وجود نداشت
  }
}

// تابع اصلی دریافت و ارسال قیمت
async function fetchAndSendPrice() {
  try {
    const response = await axios.get(API_URL);
    const currentPrice = response.data.result.currencies.dollar.p;
    const lastPrice = getLastPrice();

    // اگر قیمت تغییر کرده باشد
    if (currentPrice !== lastPrice) {
      // ارسال پیام
      await bot.telegram.sendMessage(
        CHANNEL_ID,
        `🔄 تغییر قیمت!\n💰 قیمت جدید دلار: ${currentPrice} تومان\n📉 قیمت قبلی: ${lastPrice || 'نامعلوم'}`
      );
      
      // ذخیره قیمت جدید
      savePrice(currentPrice);
      console.log('پیام ارسال شد. قیمت جدید:', currentPrice);
    } else {
      console.log('تغییری در قیمت وجود ندارد.');
    }
  } catch (error) {
    console.error('خطا:', error.message);
  }
}

// مدیریت اولین اجرا
if (!fs.existsSync(STORAGE_FILE)) {
  console.log('اولین اجرا: قیمت اولیه ذخیره می‌شود');
  fetchAndSendPrice();
}

// تنظیم تایمر برای بررسی هر ۳ دقیقه
setInterval(fetchAndSendPrice, 180000);

// راه‌اندازی بات
bot.launch().then(() => {
  console.log('بات راه‌اندازی شد!');
});

// مدیریت خروج
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));