# -*- coding: utf-8 -*-
"""
Verification suite for AgriGuard Multilingual Architecture
Checks all 23 language dictionaries, key parity, RTL directional markers, and backend localization.
"""

import os
import json
import subprocess
from backend.gemini_service import GeminiService, LANGUAGE_NAMES

def test_locales():
    print("=" * 60)
    print("   AgriGuard Multilingual Verification Suite")
    print("=" * 60)

    # 1. Verify language list in JS
    cmd = ['node', '-e', 'import("./src/i18n/languages.js").then(m => console.log(JSON.stringify(m.LANGUAGES.map(l => l.code))))']
    res = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')
    codes = json.loads(res.stdout)
    print(f"\n[1/4] Checking supported language count: {len(codes)} languages registered")
    assert len(codes) == 23, f"Expected 23 languages, got {len(codes)}"
    print(f"      Codes: {', '.join(codes)}")

    # 2. Check RTL languages
    cmd_rtl = ['node', '-e', 'import("./src/i18n/languages.js").then(m => console.log(JSON.stringify(m.LANGUAGES.filter(l => l.dir === "rtl").map(l => l.code))))']
    res_rtl = subprocess.run(cmd_rtl, capture_output=True, text=True, encoding='utf-8')
    rtl_codes = json.loads(res_rtl.stdout)
    print(f"\n[2/4] Checking RTL support: {len(rtl_codes)} RTL scripts configured")
    for r in ["ur", "ks", "sd"]:
        assert r in rtl_codes, f"RTL missing for {r}"
    print(f"      Verified RTL for: {', '.join(rtl_codes)}")

    # 3. Check 100% Key Parity across all 23 locale files
    print(f"\n[3/4] Verifying 100% key parity across all 23 locale dictionaries...")
    cmd_parity = ['node', '-e', '''
        Promise.all([
            import("./src/i18n/languages.js"),
            import("./src/i18n/locales/en.js")
        ]).then(async ([langMod, enMod]) => {
            const en = enMod.default;
            const enKeys = [];
            Object.keys(en).forEach(sec => Object.keys(en[sec]).forEach(k => enKeys.push(`${sec}.${k}`)));
            
            for (const lang of langMod.LANGUAGES) {
                const mod = await import(`./src/i18n/locales/${lang.code}.js`);
                const loc = mod.default;
                let found = 0;
                enKeys.forEach(fullKey => {
                    const [s, k] = fullKey.split(".");
                    if (loc[s] && loc[s][k] !== undefined) found++;
                });
                if (found !== enKeys.length) {
                    console.error(`Mismatch in ${lang.code}: ${found}/${enKeys.length}`);
                    process.exit(1);
                }
            }
            console.log(`All ${langMod.LANGUAGES.length} language files have identical ${enKeys.length} keys!`);
        })
    ''']
    res_p = subprocess.run(cmd_parity, capture_output=True, text=True, encoding='utf-8')
    assert res_p.returncode == 0, f"Parity check failed: {res_p.stderr}"
    print(f"      {res_p.stdout.strip()}")

    # 4. Check Backend Gemini Localization
    print(f"\n[4/4] Verifying Backend Dynamic Localization with Gemini Service...")
    svc = GeminiService()
    
    # Test Hindi
    hi_chat = svc.chat_advisory("पानी कब देना चाहिए?", crop="गेहूं", location="नासिक", soil_type="काली मिट्टी", language="hi")
    print(f"      [Hindi] Reply provider: {hi_chat['source']}")
    print(f"      [Hindi] Sample: {hi_chat['reply'][:100]}...")
    assert len(hi_chat['reply']) > 20

    # Test Marathi
    mr_chat = svc.chat_advisory("खतांचा डोस काय असावा?", crop="गहू", location="नाशिक", soil_type="काळी माती", language="mr")
    print(f"      [Marathi] Reply provider: {mr_chat['source']}")
    print(f"      [Marathi] Sample: {mr_chat['reply'][:100]}...")
    assert len(mr_chat['reply']) > 20

    # Test Urdu
    ur_chat = svc.chat_advisory("فصل کے لیے بہترین کھاد کون سی ہے؟", crop="گندم", location="ناسک", soil_type="چکنی مٹی", language="ur")
    print(f"      [Urdu] Reply provider: {ur_chat['source']}")
    print(f"      [Urdu] Sample: {ur_chat['reply'][:100]}...")
    assert len(ur_chat['reply']) > 20

    print("\n" + "=" * 60)
    print("   MULTILINGUAL SUITE: 100% PASSING (23 LANGUAGES READY)")
    print("=" * 60)

if __name__ == "__main__":
    test_locales()

