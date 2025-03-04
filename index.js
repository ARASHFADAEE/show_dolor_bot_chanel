const { Telegraf } = require('telegraf');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const moment = require('moment-jalaali');

// 📌 تنظیمات
const BOT_TOKEN = '7722552369:AAEWrnT4qLOYlck_iO76vtLHiOmIU5rfXxs';
const CHANNEL_ID = '-1002408872436';
const URL = 'https://www.tgju.org/profile/price_dollar_rl'; // آدرس وب‌سایت برای اسکرپینگ
const STORAGE_FILE = 'lastPrice.json';

const bot = new Telegraf(BOT_TOKEN);

// 📌 تابع اسکرپینگ برای دریافت نرخ فعلی
async function scrapeCurrentRate() {
    try {
        // ارسال درخواست به صفحه
        const { data: html } = await axios.get(URL);

        // بارگذاری HTML در cheerio
        const $ = cheerio.load(html);

        // پیدا کردن مقدار "نرخ فعلی"
        const currentRate = $('tbody.table-padding-lg tr')
            .filter((i, el) => {
                return $(el).find('td.text-right').text().trim() === 'نرخ فعلی';
            })
            .find('td.text-left')
            .text()
            .replace(/,/g, '') // حذف کاما
            .trim();

        return Number(currentRate); // تبدیل به عدد و بازگشت
    } catch (error) {
        console.error('❌ خطا در اسکرپینگ:', error.message);
        return null; // در صورت خطا، مقدار null بازمی‌گردد
    }
}

// 📌 ذخیره قیمت در فایل
function savePrice(price) {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify({ lastPrice: price }));
}

// 📌 دریافت آخرین قیمت از فایل
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

// 📌 دریافت و ارسال قیمت جدید
async function fetchAndSendPrice() {
    try {
        const currentPrice = await scrapeCurrentRate(); // دریافت نرخ از طریق اسکرپینگ

        if (!currentPrice) {
            console.warn('❌ دریافت قیمت جدید ناموفق بود!');
            return;
        }

        const lastPrice = getLastPrice();

        // 📌 دریافت تاریخ و ساعت شمسی
        moment.loadPersian({ dialect: 'persian-modern' }); // فعال کردن زبان فارسی
        const currentDateTime = moment().format('jYYYY/jMM/jDD HH:mm:ss'); // فرمت: 1402/11/24 14:35:10

        if (currentPrice !== lastPrice) {
            await bot.telegram.sendMessage(
                CHANNEL_ID,
                `🔄 تغییر قیمت!
📅 تاریخ و ساعت: ${currentDateTime}
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

// 📌 مدیریت اولین اجرا
if (!fs.existsSync(STORAGE_FILE)) {
    console.log('🔰 اولین اجرا: قیمت اولیه ذخیره می‌شود');
    fetchAndSendPrice();
}

// 📌 بررسی قیمت هر ۳ دقیقه
setInterval(fetchAndSendPrice, 180000);

// 📌 راه‌اندازی بات
bot.launch().then(() => {
    console.log('🚀 بات راه‌اندازی شد!');
});

// 📌 مدیریت خروج ایمن
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));