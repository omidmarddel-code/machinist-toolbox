// این فایل «واسط» است: هستهٔ واقعی OCR را از همین پوشه بارگذاری می‌کند.
// بودنش باعث می‌شود هر مسیری که Tesseract.js برای هسته انتخاب کند، درست کار کند.
importScripts(self.location.href.replace(/[^/]*$/, '') + 'tesseract-core-simd-lstm.wasm.js');