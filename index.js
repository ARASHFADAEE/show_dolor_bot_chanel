const { Telegraf } = require('telegraf');
const axios = require('axios');
const fs = require('fs');

// تنظیمات
const BOT_TOKEN = '7109843159:AAELKwrpvg1RhD5ZEYKWCS0u_ddeTOU2bEI';
const CHANNEL_ID = '-1002408872436';
const ADMIN_ID = '5388685693'; // شناسه تلگرام ادمین
const API_URL = 'https://one-api.ir/price/?token=645888:669bf7ffa1c57&action=tgju';
const STORAGE_FILE = 'lastPrice.json'; // فایل ذخیره آخرین قیمت

// ایجاد نمونه بات
const bot = new Telegraf(BOT_TOKEN);

// تابع ذخیره قیمت در فایل
function savePrice(price) {
  try {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify({ lastPrice: price }, null, 2));
  } catch (error) {
    console.error('خطا در ذخیره قیمت:', error);
  }
}

// تابع دریافت قیمت از فایل
function getLastPrice() {
  try {
    if (!fs.existsSync(STORAGE_FILE)) return null;
    const data = fs.readFileSync(STORAGE_FILE, 'utf8');
    return JSON.parse(data).lastPrice || null;
  } catch (error) {
    console.error('خطا در خواندن فایل ذخیره:', error);
    return null;
  }
}

// تابع اصلی دریافت و ارسال قیمت
async function fetchAndSendPrice() {
  try {
    const response = await axios.get(API_URL);
    if (!response.data || !response.data.result || !response.data.result.currencies || !response.data.result.currencies.dollar) {
      console.error('ساختار داده‌های API نامعتبر است:', response.data);
      return;
    }

    const currentPrice = response.data.result.currencies.dollar.p;
    const lastPrice = getLastPrice();

    if (!fs.existsSync(STORAGE_FILE)) {
      console.log('اولین اجرا: قیمت اولیه ذخیره می‌شود');
      savePrice(currentPrice);
      return;
    }

    // اگر قیمت تغییر کرده باشد
    if (currentPrice !== lastPrice) {
      await bot.telegram.sendMessage(
        CHANNEL_ID,
        `🔄 تغییر قیمت!
💰 قیمت جدید دلار: ${currentPrice} تومان
📉 قیمت قبلی: ${lastPrice || 'نامعلوم'}`
      );
      savePrice(currentPrice);
      console.log('پیام ارسال شد. قیمت جدید:', currentPrice);
    } else {
      console.log('تغییری در قیمت وجود ندارد.');
    }
  } catch (error) {
    console.error('خطا در دریافت قیمت:', error);
    if (error.response) {
      console.error('پاسخ سرور:', error.response.data);
    }
    await bot.telegram.sendMessage(ADMIN_ID, `❌ خطا در دریافت قیمت:\n${error.message}`);
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
