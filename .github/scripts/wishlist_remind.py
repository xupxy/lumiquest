"""Вишлист: ежедневные напоминания Саше о важных датах.

Читает из Firestore только документ lists/<list>/meta/main (токен бота, chat id,
даты из «Важных дат» и день рождения из «Про меня») и отправляет сообщение
от бота за 14, 7, 3, 1 день и в сам день. Ссылка на вишлист берётся из
секрета репозитория WL_LINK — в коде её нет.
"""
import datetime, json, os, sys, urllib.parse, urllib.request
from zoneinfo import ZoneInfo

DAYS = (14, 7, 3, 1, 0)
MONTHS = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"]


def plural(n, forms):
    a, b = abs(n) % 100, abs(n) % 10
    return forms[2 if 10 < a < 20 else 0 if b == 1 else 1 if 1 < b < 5 else 2]


def fs_value(v):
    if "stringValue" in v: return v["stringValue"]
    if "integerValue" in v: return int(v["integerValue"])
    if "doubleValue" in v: return v["doubleValue"]
    if "booleanValue" in v: return v["booleanValue"]
    if "mapValue" in v: return {k: fs_value(x) for k, x in v["mapValue"].get("fields", {}).items()}
    if "arrayValue" in v: return [fs_value(x) for x in v["arrayValue"].get("values", [])]
    return None


def main():
    link = os.environ.get("WL_LINK", "").strip()
    if not link:
        print("WL_LINK не задан — пропускаю"); return
    q = urllib.parse.parse_qs(urllib.parse.urlparse(link).query)
    p, k, l = q.get("p", [""])[0], q.get("k", [""])[0], q.get("l", [""])[0]
    if not (p and k and l):
        sys.exit("В WL_LINK нет параметров p, k, l")
    url = f"https://firestore.googleapis.com/v1/projects/{p}/databases/(default)/documents/lists/{l}/meta/main?key={k}"
    meta = {key: fs_value(v) for key, v in json.load(urllib.request.urlopen(url, timeout=30)).get("fields", {}).items()}
    bot, chat = meta.get("bot"), meta.get("viewerId")
    if not bot or not chat:
        print("Уведомления не включены — пропускаю"); return
    rem = meta.get("sa_remind") or {}
    if rem.get("on") is False:
        print("Напоминания выключены"); return
    her = meta.get("ownerName") or "Арина"
    her_gen = her[:-1] + "ы" if her.endswith("а") else her
    dates = [d for d in (rem.get("dates") or []) if isinstance(d, dict)]
    bday = str((meta.get("about") or {}).get("bday") or "")
    try:
        bd, bm = [int(x) for x in bday.replace("/", ".").replace("-", ".").split(".")[:2]]
        if not any("рожд" in str(d.get("t", "")).lower() for d in dates):
            dates.append({"t": f"День рождения {her_gen}", "d": bd, "m": bm, "e": "🎂"})
    except Exception:
        pass

    today = datetime.datetime.now(ZoneInfo("Europe/Amsterdam")).date()
    lines = []
    for d in dates:
        try:
            when = datetime.date(today.year, int(d["m"]), int(d["d"]))
            if when < today: when = datetime.date(today.year + 1, int(d["m"]), int(d["d"]))
        except Exception:
            continue
        left = (when - today).days
        if left not in DAYS: continue
        e, t = d.get("e") or "📅", d.get("t") or "Важная дата"
        if left == 0:
            lines.append(f"{e} <b>Сегодня — {t}!</b>\nНе забудь поздравить 🎉")
        else:
            lines.append(f"{e} <b>До «{t}» — {left} {plural(left, ['день', 'дня', 'дней'])}</b> ({when.day} {MONTHS[when.month - 1]})" +
                         ("\nСамое время выбрать и заказать подарок 🎁" if left >= 7 else "\nПроверь, всё ли готово 🎁"))
    if not lines:
        print("Сегодня напоминаний нет"); return
    body = {"chat_id": chat, "parse_mode": "HTML", "text": "\n\n".join(lines),
            "reply_markup": json.dumps({"inline_keyboard": [[{"text": "Открыть вишлист 💝", "web_app": {"url": link}}]]})}
    req = urllib.request.Request(f"https://api.telegram.org/bot{bot}/sendMessage", data=urllib.parse.urlencode(body).encode())
    try:
        print(urllib.request.urlopen(req, timeout=30).read()[:200])
    except urllib.error.HTTPError as err:
        msg = err.read()[:300]; print(msg)
        if b"button" in msg.lower() or b"web_app" in msg.lower():
            body.pop("reply_markup")
            print(urllib.request.urlopen(urllib.request.Request(f"https://api.telegram.org/bot{bot}/sendMessage", data=urllib.parse.urlencode(body).encode()), timeout=30).read()[:200])
        else:
            raise


if __name__ == "__main__":
    main()
