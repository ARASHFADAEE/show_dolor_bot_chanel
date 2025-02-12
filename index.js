const { Telegraf } = require('telegraf');
const axios = require('axios');
const fs = require('fs');

// تنظیمات
const BOT_TOKEN = '7109843159:AAELKwrpvg1RhD5ZEYKWCS0u_ddeTOU2bEI';
const CHANNEL_ID = '-1002408872436';
const API_URL = 'https://one-api.ir/price/?token=645888:669bf7ffa1c57&action=tgju';
const STORAGE_FILE = 'lastPrice.json';

const bot = new Telegraf(BOT_TOKEN);

// ذخیره قیمت در فایل
function savePrice(price) {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify({ lastPrice: price }));
}

// دریافت آخرین قیمت از فایل
function getLastPrice() {
    if (!fs.existsSync(STORAGE_FILE)) {
        console.warn('⚠️ فایل ذخیره قیمت وجود ندارد، مقدار پیش‌فرض تنظیم شد.');
        savePrice("0");
        return 0;
    }

    try {
        const data = fs.readFileSync(STORAGE_FILE, 'utf8').trim();
        if (!data || data === '{}') {
            console.warn('⚠️ فایل ذخیره قیمت خالی است، مقدار پیش‌فرض تنظیم شد.');
            savePrice("0");
            return 0;
        }

        const jsonData = JSON.parse(data);
        let lastPrice = jsonData.lastPrice;

        if (!lastPrice || typeof lastPrice !== "string") {
            console.warn('⚠️ مقدار ذخیره‌شده نامعتبر است، مقدار پیش‌فرض تنظیم شد.');
            savePrice("0");
            return 0;
        }

        lastPrice = Number(lastPrice.replace(/,/g, ''));
        
        if (isNaN(lastPrice)) {
            console.warn('⚠️ مقدار ذخیره‌شده نامعتبر است، مقدار پیش‌فرض تنظیم شد.');
            savePrice("0");
            return 0;
        }

        return lastPrice;
    } catch (error) {
        console.error('❌ خطا در خواندن فایل ذخیره قیمت:', error.message);
        savePrice("0");
        return 0;
    }
}

// دریافت و ارسال قیمت جدید
async function fetchAndSendPrice() {
    try {
        const response = await axios.get(API_URL);
        let currentPrice = response.data.result.currencies.dollar.p;

        if (!currentPrice) {
            console.warn('❌ دریافت قیمت جدید ناموفق بود!');
            return;
        }

        currentPrice = Number(currentPrice.replace(/,/g, ''));
        const lastPrice = getLastPrice();

        if (currentPrice !== lastPrice) {
            await bot.telegram.sendMessage(
                CHANNEL_ID,
                `🔄 تغییر قیمت!
💰 قیمت جدید دلار: ${currentPrice.toLocaleString()} ریال
📉 قیمت قبلی: ${lastPrice.toLocaleString()} ریال`
            );
            savePrice(currentPrice.toString());
            console.log('✅ پیام ارسال شد. قیمت جدید:', currentPrice);
        } else {
            console.log('ℹ️ تغییری در قیمت وجود ندارد.');
        }
    } catch (error) {
        console.error('❌ خطا در دریافت داده:', error.message);
    }
}

// مدیریت اولین اجرا
if (!fs.existsSync(STORAGE_FILE)) {
    console.log('🔰 اولین اجرا: قیمت اولیه ذخیره می‌شود');
    fetchAndSendPrice();
}

// بررسی قیمت هر ۳ دقیقه
setInterval(fetchAndSendPrice, 180000);

// راه‌اندازی بات
bot.launch().then(() => {
    console.log('🚀 بات راه‌اندازی شد!');
});

// مدیریت خروج ایمن
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
