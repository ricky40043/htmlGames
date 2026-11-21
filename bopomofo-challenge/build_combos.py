# 產生注音題庫 combos.js：只出「真的有常用詞」的聲母組合，並附上參考答案。
#
# 用法（需要 jieba、opencc-python-reimplemented、pypinyin）：
#   pip install jieba==0.42.1 opencc-python-reimplemented==0.1.7 pypinyin==0.53.0
#   python3 build_combos.py
#
# 做法：取 jieba 詞頻詞典的常用詞 → OpenCC 轉成台灣繁體 → pypinyin 取每個字最常見讀音的聲母，
# 每個字都要有聲母（ㄅ～ㄙ）才算；同一組聲母的常用詞數量夠多才收進題庫。
import collections, json, os
import jieba
from opencc import OpenCC
from pypinyin import pinyin, Style

HERE = os.path.dirname(os.path.abspath(__file__))
INITIALS = set('ㄅㄆㄇㄈㄉㄊㄋㄌㄍㄎㄏㄐㄑㄒㄓㄔㄕㄖㄗㄘㄙ')
# 每種字數的（最低詞頻, 至少幾個常用詞）。5 字的常用詞太少、多是政治或專有名詞，所以不出 5 字題。
RULES = {2: (1000, 3), 3: (150, 2), 4: (300, 1)}
# 人名、數詞、虛詞等不當題目
BAD_POS = ('nr', 'm', 'x', 'eng', 'q', 'uj', 'ul', 'ug', 'uv', 'uz', 'ud', 'r', 'p', 'c', 'u', 'e', 'y', 'o', 'f')
# 攤位有小朋友，避開不雅、政治、疾病與暴力相關的詞
BLOCK = ['性', '死', '殺', '屍', '妓', '嫖', '淫', '奸', '姦', '黨', '共產', '政府', '中共', '解放軍', '軍區', '全會', '毛澤東',
         '省委', '縣委', '市委', '人大', '政協', '書記', '中央', '革命', '階級', '鬥爭', '戰爭', '屠', '病', '癌', '腫瘤', '毒品',
         '賭', '色情', '裸', '屁', '尿', '糞', '屎', '槍', '炸', '自殺', '監獄', '犯罪', '鴉片', '酒精', '菸']

def initials(word):
    out = []
    for reading in pinyin(word, style=Style.BOPOMOFO):
        s = reading[0]
        if not s or s[0] not in INITIALS:
            return None
        out.append(s[0])
    return ''.join(out)

def main():
    cc = OpenCC('s2twp')
    words = collections.defaultdict(dict)
    with open(os.path.join(os.path.dirname(jieba.__file__), 'dict.txt'), encoding='utf-8') as f:
        for line in f:
            w, freq, pos = line.split()
            n, freq = len(w), int(freq)
            if n not in RULES or freq < RULES[n][0] or pos.startswith(BAD_POS):
                continue
            if not all('一' <= c <= '鿿' for c in w):
                continue
            t = cc.convert(w)
            if len(t) != n or any(b in t for b in BLOCK):
                continue
            key = initials(t)
            if key:
                words[key][t] = max(freq, words[key].get(t, 0))
    combos = {}
    for key, ws in words.items():
        n, (_, need) = len(key), RULES[len(key)]
        if len(ws) >= need:
            top = sorted(ws, key=ws.get, reverse=True)[:3]
            combos.setdefault(n, []).append([key, '、'.join(top)])
    for n in combos:
        combos[n].sort()
    with open(os.path.join(HERE, 'combos.js'), 'w', encoding='utf-8') as f:
        f.write('// 由 build_combos.py 產生，請勿手動修改。格式：{字數: [[聲母組合, 參考答案], ...]}\n')
        f.write('window.BOPO_COMBOS=' + json.dumps(combos, ensure_ascii=False, separators=(',', ':')) + ';\n')
    print({n: len(v) for n, v in sorted(combos.items())})

if __name__ == '__main__':
    main()
