
"use strict";

// داده‌های رزوه متریک دنده درشت. مقدارهای محاسبه‌شده برای استفاده کارگاهی گرد می‌شوند.
const TAP_DATA = [
  { size: "M2", major: 2, pitch: 0.4 },
  { size: "M2.5", major: 2.5, pitch: 0.45 },
  { size: "M3", major: 3, pitch: 0.5 },
  { size: "M4", major: 4, pitch: 0.7 },
  { size: "M5", major: 5, pitch: 0.8 },
  { size: "M6", major: 6, pitch: 1 },
  { size: "M7", major: 7, pitch: 1 },
  { size: "M8", major: 8, pitch: 1.25 },
  { size: "M9", major: 9, pitch: 1.25 },
  { size: "M10", major: 10, pitch: 1.5 },
  { size: "M11", major: 11, pitch: 1.5 },
  { size: "M12", major: 12, pitch: 1.75 },
  { size: "M14", major: 14, pitch: 2 },
  { size: "M16", major: 16, pitch: 2 },
  { size: "M18", major: 18, pitch: 2.5 },
  { size: "M20", major: 20, pitch: 2.5 }
];

// تنظیمات پیشنهادی وایرکات بر اساس داده‌هایی که کاربر ارائه کرده است.
const EDM_DATA = [
  { name: "تمامی رندها", spark: 200, feed: 20, water: 12, zPosition: 125, wire: 2.2 },
  { name: "کولت‌ها", spark: 100, feed: 20, water: 16, wire: 3 },
  { name: "ماتریس و سنبه تریم", spark: 180, feed: 50, water: 16, wire: 2.6 },
  { name: "برش قالب‌ها", spark: 220, feed: 50, water: 16, wire: 3 },
  { name: "قطعات آلومینیوم", spark: 80, feed: 30, water: 12, wire: 2.6 }
];

const HARDNESS_TABLE = [
  { HRC: 20, HB: 227 },
  { HRC: 22, HB: 246 },
  { HRC: 24, HB: 266 },
  { HRC: 26, HB: 286 },
  { HRC: 28, HB: 306 },
  { HRC: 30, HB: 325 },
  { HRC: 32, HB: 344 },
  { HRC: 34, HB: 363 },
  { HRC: 36, HB: 381 },
  { HRC: 38, HB: 400 },
  { HRC: 40, HB: 419 },
  { HRC: 42, HB: 437 },
  { HRC: 44, HB: 456 },
  { HRC: 46, HB: 474 },
  { HRC: 48, HB: 492 },
  { HRC: 50, HB: 511 },
  { HRC: 52, HB: 529 },
  { HRC: 54, HB: 546 },
  { HRC: 56, HB: 563 },
  { HRC: 58, HB: 580 },
  { HRC: 60, HB: 598 },
  { HRC: 62, HB: 615 },
  { HRC: 64, HB: 632 },
  { HRC: 66, HB: 649 },
  { HRC: 68, HB: 666 },
  { HRC: 70, HB: 683 }
];

const PAGE_TITLES = {

  tap: {
    eyebrow: "رزوه‌های متریک دنده درشت",
    title: "محاسبه‌گر قلاویز"
  },
  booklet: {
    eyebrow: "آموزش اپراتوری دستگاه",
    title: "جزوه وایرکات ایزی پایپ"
  },
  fanuc: {
    eyebrow: "آموزش اپراتوری دستگاه",
    title: "جزوه فانوک ایزی پایپ"
  },
  heidenhain: {
    eyebrow: "آموزش اپراتوری دستگاه",
    title: "جزوه هایدن هاین ایزی پایپ"
  },
  edm: {
    eyebrow: "تنظیمات پیشنهادی دستگاه",
    title: "تنظیمات وایرکات"
  },
  taper: {
  eyebrow: "ماشین حساب مهندسی",
  title: "محاسبه زاویه مخروط"
},
  lathe: {
  eyebrow: "جزوه آموزشی",
  title: "آموزش اپراتوری دستگاه تراش CNC GSK"
},
threadDepth: {
  eyebrow: "ماشین حساب تراش",
  title: "محاسبه عمق دنده"
},
hardnessConversion: {
  eyebrow: "محاسبات مهندسی",
  title: "تبدیل سختی HB ↔ HRC"
},
forgingClearance: {
  eyebrow: "محاسبات مهندسی",
  title: "محاسبه لقی سنبه و قالب فورج"
},
weightCalculator: {
  eyebrow: "محاسبات مهندسی",
  title: "محاسبه وزن قطعه"
},
threadTable: {
  eyebrow: "استانداردها",
  title: "اندازه استاندارد دنده‌ها"
},
booklets: {
  eyebrow: "جزوه‌های آموزشی",
  title: "انتخاب جزوه آموزشی"
},
calculations: {
  eyebrow: "محاسبات مهندسی",
  title: "ابزارهای محاسباتی"
},
standards: {
  eyebrow: "استانداردهای مهندسی",
  title: "جداول استاندارد"
},
materials: {
  eyebrow: "مرجع مهندسی",
  title: "بانک متریال"
},
toolSteel: {
  eyebrow: "بانک متریال",
  title: "فولادهای ابزاری"
},
H13: {
  eyebrow: "بانک متریال",
  title: "فولاد H13"
},
D2: {
  eyebrow: "بانک متریال",
  title: "فولاد D2"
},
O1: {
  eyebrow: "بانک متریال",
  title: "فولاد O1"
},
2083: {
  eyebrow: "بانک متریال",
  title: "فولاد 1.2083"
},
2311: {
  eyebrow: "بانک متریال",
  title: "فولاد 1.2311"
},
2312: {
  eyebrow: "بانک متریال",
  title: "فولاد 1.2312"
},
2738: {
    eyebrow: "بانک متریال",
    title: "فولاد 1.2738"
},VCN150: {
    eyebrow: "بانک متریال",
    title: "VCN 150"
},
VCN200: {
    eyebrow: "بانک متریال",
    title: "VCN 200"
},
MO40: {
    eyebrow: "بانک متریال",
    title: "MO40"
},
CK45: {
    eyebrow: "بانک متریال",
    title: "CK45"
},
CK75: {
    eyebrow: "بانک متریال",
    title: "CK75"
},
H7176: {
    eyebrow: "بانک متریال",
    title: "H7176"
},castIron: {
  eyebrow: "بانک متریال",
  title: "چدن‌های ریخته‌گری"
},
GG25: {
  eyebrow: "بانک متریال",
  title: "GG25 - چدن خاکستری"
},
GG200: {
  eyebrow: "بانک متریال",
  title: "GG200 - چدن خاکستری قوی"
},
GGG40: {
  eyebrow: "بانک متریال",
  title: "GGG40 - چدن داکتیل"
},
GGG50: {
  eyebrow: "بانک متریال",
  title: "GGG50 - چدن داکتیل قوی"
},
plastic: {
  eyebrow: "بانک متریال",
  title: "پلاستیک‌های صنعتی"
},
POM: {
  eyebrow: "بانک متریال",
  title: "POM - Delrin (استال)"
},
PEEK: {
  eyebrow: "بانک متریال",
  title: "PEEK - پلاستیک پیشرفته"
},
PTFE: {
  eyebrow: "بانک متریال",
  title: "PTFE - Teflon (تفلون)"
},
PA6: {
  eyebrow: "بانک متریال",
  title: "PA6 - Nylon 6 (نایلون)"
},
ABS: {
  eyebrow: "بانک متریال",
  title: "ABS - Acrylonitrile Butadiene Styrene"
},
copper: {
  eyebrow: "بانک متریال",
  title: "مس و برنج و برنز"
},
Copper: {
  eyebrow: "بانک متریال",
  title: "مس خالص - Copper (Cu 99.9)"
},
Brass: {
  eyebrow: "بانک متریال",
  title: "برنج - Brass (Cu + Zn)"
},
Bronze: {
  eyebrow: "بانک متریال",
  title: "برنز - Bronze (Cu + Sn)"
},
stainlessSteel: {
  eyebrow: "بانک متریال",
  title: "استنلس استیل - فولاد ضد زنگ"
},
SS304: {
  eyebrow: "بانک متریال",
  title: "Stainless Steel 304 (18/8)"
},
SS316: {
  eyebrow: "بانک متریال",
  title: "Stainless Steel 316 / 316L"
},
SS420: {
  eyebrow: "بانک متریال",
  title: "Stainless Steel 420 - Cutlery Grade"
},
aluminum: {
  eyebrow: "بانک متریال",
  title: "آلومینیوم و آلیاژهای آن"
},
AL6061: {
  eyebrow: "بانک متریال",
  title: "Aluminum 6061 - سایز‌کاری عمومی"
},
AL7075: {
  eyebrow: "بانک متریال",
  title: "Aluminum 7075 - قوی و سبک"
},
AL5083: {
  eyebrow: "بانک متریال",
  title: "Aluminum 5083 - دریایی و دریانوردی"
},
as568: {
  eyebrow: "استانداردهای مهندسی",
  title: "جدول استاندارد AS568"
},
moldtotarial: {
  eyebrow: "جزوه اشنایی با واحد قالب سازی",
  title: "روند فعالیت قالب سازی"
},
};

const elements = {
  pageEyebrow: document.querySelector("#pageEyebrow"),
  pageTitle: document.querySelector("#pageTitle"),
  toolCards: document.querySelectorAll(".tool-card"),
  panels: document.querySelectorAll(".tool-panel"),
  tapSearch: document.querySelector("#tapSearch"),
  tapSelect: document.querySelector("#tapSelect"),
  drillSize: document.querySelector("#drillSize"),
  metricsGrid: document.querySelector("#metricsGrid"),
  edmSelect: document.querySelector("#edmSelect"),
  edmSettings: document.querySelector("#edmSettings"),
  bigDiameter: document.querySelector("#bigDiameter"),
  smallDiameter: document.querySelector("#smallDiameter"),
  heightValue: document.querySelector("#heightValue"),
  calcTaper: document.querySelector("#calcTaper"),
  taperResult: document.querySelector("#taperResult"),
  hardnessType: document.querySelector("#hardnessType"),
  hardnessValue: document.querySelector("#hardnessValue"),
  convertHardness: document.querySelector("#convertHardness"),
  resetHardness: document.querySelector("#resetHardness"),
  hardnessResult: document.querySelector("#hardnessResult"),
  hardnessMessage: document.querySelector("#hardnessMessage"),
  threadPitch: document.querySelector("#threadPitch"),
  threadDepthResult: document.querySelector("#threadDepthResult"),
  shapeSelect: document.querySelector("#shapeSelect"),
  shapeInputs: document.querySelector("#shapeInputs"),
  weightMaterial: document.querySelector("#weightMaterial"),
  weightDensity: document.querySelector("#weightDensity"),
  calculateWeight: document.querySelector("#calculateWeight"),
  resetWeight: document.querySelector("#resetWeight"),
  weightMessage: document.querySelector("#weightMessage"),
  weightResult: document.querySelector("#weightResult"),
  weightDetails: document.querySelector("#weightDetails"),
  weightDensityNote: document.querySelector("#weightDensityNote"),
  forgingPanel: document.querySelector("#forgingClearancePanel"),
  forgingWorkpieceMaterial: document.querySelector("#forgingWorkpieceMaterial"),
  forgingDieHoleDiameter: document.querySelector("#forgingDieHoleDiameter"),
  forgingTemperature: document.querySelector("#forgingTemperature"),
  calculateForgingClearance: document.querySelector("#calculateForgingClearance"),
  resetForgingClearance: document.querySelector("#resetForgingClearance"),
  forgingMessage: document.querySelector("#forgingMessage"),
  forgingResult: document.querySelector("#forgingResult"),
  forgingDetails: document.querySelector("#forgingDetails"),
  newsCard: document.querySelector(".news-card"),
  refreshNews: document.querySelector("#refreshNews"),
  homeButton: document.querySelector("#homeButton"),
};
let currentTool = null;
let ignoreHistory = false;

const trimNumber = (value, digits = 2) => Number(value.toFixed(digits)).toString();
const formatMm = (value, digits = 2) => `${trimNumber(value, digits)} میلی‌متر`;
const formatInch = (value) => `${value.toFixed(4)} اینچ`;
const formatValue = (value) => value ?? "-";

function getTapCalculations(tap) {
  const drill = tap.major - tap.pitch;
  const pitchInch = tap.pitch / 25.4;
  const threadHeight = tap.pitch * 0.8660254;
  const minor = tap.major - (1.226869 * tap.pitch);

  return {
    drill,
    metrics: [
      { label: "گام (میلی‌متر)", value: formatMm(tap.pitch) },
      { label: "گام (اینچ)", value: formatInch(pitchInch) },
      { label: "ارتفاع رزوه", value: formatMm(threadHeight) },
      { label: "قطر اسمی", value: formatMm(tap.major) },
      { label: "قطر داخلی", value: formatMm(minor) }
    ]
  };
}

function renderTapOptions(filter = "") {
  if (!elements.tapSelect) return;

  const query = filter.trim().toLowerCase();
  const filteredTaps = TAP_DATA.filter((tap) => tap.size.toLowerCase().includes(query));

  elements.tapSelect.innerHTML = "";

  filteredTaps.forEach((tap) => {
    const option = document.createElement("option");
    option.value = tap.size;
    option.textContent = `${tap.size} - گام ${trimNumber(tap.pitch)} میلی‌متر`;
    elements.tapSelect.appendChild(option);
  });

  if (filteredTaps.length === 0) {
    const option = document.createElement("option");
    option.textContent = "قلاویز مطابق پیدا نشد";
    option.disabled = true;
    elements.tapSelect.appendChild(option);
    updateTapEmptyState();
    return;
  }

  updateTapDetails(filteredTaps[0].size);
}

function updateTapDetails(size) {
  if (!elements.drillSize || !elements.metricsGrid) return;

  const tap = TAP_DATA.find((item) => item.size === size);

  if (!tap) {
    updateTapEmptyState();
    return;
  }

  const details = getTapCalculations(tap);
  elements.drillSize.textContent = formatMm(details.drill);
  elements.metricsGrid.innerHTML = details.metrics
    .map((metric, index) => `
      <article class="metric-card" style="animation-delay: ${index * 35}ms">
        <span>${metric.label}</span>
        <strong>${metric.value}</strong>
      </article>
    `)
    .join("");
}

function updateTapEmptyState() {
  if (!elements.drillSize || !elements.metricsGrid) return;

  elements.drillSize.textContent = "--";
  elements.metricsGrid.innerHTML = `
    <article class="metric-card">
      <span>نتیجه جستجو</span>
      <strong>سایز قلاویز پیدا نشد</strong>
    </article>
  `;
}

function renderEdmOptions() {
  if (!elements.edmSelect) return;

  EDM_DATA.forEach((setting) => {
    const option = document.createElement("option");
    option.value = setting.name;
    option.textContent = setting.name;
    elements.edmSelect.appendChild(option);
  });

  updateEdmSettings(EDM_DATA[0].name);
}

function updateEdmSettings(name) {
  if (!elements.edmSettings) return;

  const setting = EDM_DATA.find((item) => item.name === name);

  if (!setting) {
    return;
  }

  const rows = [
    { label: "قدرت اسپارک", value: setting.spark },
    { label: "نرخ پیشروی", value: setting.feed },
    { label: "فشار آب", value: setting.water },
    { label: "سرعت وایر", value: setting.wire },
    { label: "موقعیت Z", value: formatValue(setting.zPosition) }
  ];

  elements.edmSettings.innerHTML = rows
    .map((row, index) => `
      <div class="setting-row" style="animation-delay: ${index * 35}ms">
        <span>${row.label}</span>
        <strong>${row.value}</strong>
      </div>
    `)
    .join("");
}

function switchTool(tool, addToHistory = true) {
  if (!tool || !PAGE_TITLES[tool]) {
    return;
  }

  if (currentTool === tool) {
    if (addToHistory && location.hash !== `#${tool}`) {
      history.pushState({ tool }, "", `#${tool}`);
    }
    return;
  }

  const welcomeCard = document.getElementById("welcomeCard");

  if (elements.newsCard) {
    elements.newsCard.hidden = true;
  }

  if (welcomeCard && !welcomeCard.classList.contains("hide")) {
    welcomeCard.classList.add("hide");

    setTimeout(() => {
      if (welcomeCard) {
        welcomeCard.style.display = "none";
      }
    }, 500);
  }

  if (elements.toolCards) {
    elements.toolCards.forEach((card) => {
      card.classList.toggle("active", card.dataset.tool === tool);
    });
  }

  if (elements.panels) {
    elements.panels.forEach((panel) => {
      const active = panel.dataset.panel === tool || panel.id === tool + "Panel";

      panel.classList.toggle("active", active);
      panel.hidden = !active;
    });
  }

  if (elements.pageEyebrow) {
    elements.pageEyebrow.textContent = PAGE_TITLES[tool].eyebrow;
  }
  if (elements.pageTitle) {
    elements.pageTitle.textContent = PAGE_TITLES[tool].title;
  }

  currentTool = tool;

  if (addToHistory && location.hash !== `#${tool}`) {
    history.pushState({ tool }, "", `#${tool}`);
  }
}

function bindEvents() {
  if (elements.homeButton) {
    elements.homeButton.addEventListener("click", () => {
      history.replaceState({}, "", location.pathname);

      if (elements.panels) {
        elements.panels.forEach((panel) => {
          panel.hidden = true;
          panel.classList.remove("active");
        });
      }
      if (elements.toolCards) {
        elements.toolCards.forEach((card) => card.classList.remove("active"));
      }

      if (elements.pageEyebrow) {
        elements.pageEyebrow.textContent = "";
      }
      if (elements.pageTitle) {
        elements.pageTitle.textContent = "MACHINIST TOOL BOX";
      }

      const welcomeCard = document.getElementById("welcomeCard");
      if (welcomeCard) {
        welcomeCard.style.display = "flex";
        welcomeCard.classList.remove("hide");
      }
      if (elements.newsCard) elements.newsCard.hidden = false;
      currentTool = null;
    });
  }

  if (elements.toolCards) {
    elements.toolCards.forEach((card) => {
      card.addEventListener("click", () => {
        if (card.classList.contains("locked")) return;

        const tool = card.dataset.tool;

        if (tool) {
          switchTool(tool);
        }
      });
    });
  }

  if (elements.tapSearch) {
    elements.tapSearch.addEventListener("input", (event) => {
      renderTapOptions(event.target.value);
    });
  }

  if (elements.tapSelect) {
    elements.tapSelect.addEventListener("change", (event) => {
      updateTapDetails(event.target.value);
    });
  }

  if (elements.edmSelect) {
    elements.edmSelect.addEventListener("change", (event) => {
      updateEdmSettings(event.target.value);
    });
  }

  if (elements.threadPitch) {
    elements.threadPitch.addEventListener("change", () => {
      updateThreadDepth();
    });
  }

  if (elements.calcTaper) {
    elements.calcTaper.addEventListener("click", calculateTaper);
  }
  if (elements.convertHardness) {
    elements.convertHardness.addEventListener("click", updateHardnessResult);
  }
  if (elements.resetHardness) {
    elements.resetHardness.addEventListener("click", resetHardnessForm);
  }
  if (elements.hardnessValue) {
    elements.hardnessValue.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        updateHardnessResult();
      }
    });
  }
  if (elements.shapeSelect) {
    elements.shapeSelect.addEventListener("change", () => {
      renderWeightShapeInputs();
    });
  }
  if (elements.weightMaterial) {
    elements.weightMaterial.addEventListener("change", () => {
      updateWeightDensityFromMaterial();
    });
  }
  if (elements.calculateWeight) {
    elements.calculateWeight.addEventListener("click", calculateWeight);
  }
  if (elements.resetWeight) {
    elements.resetWeight.addEventListener("click", resetWeightForm);
  }
  if (elements.calculateForgingClearance) {
    elements.calculateForgingClearance.addEventListener("click", calculateForgingClearance);
  }
  if (elements.resetForgingClearance) {
    elements.resetForgingClearance.addEventListener("click", resetForgingClearanceForm);
  }
  if (elements.forgingPanel) {
    elements.forgingPanel.querySelectorAll("input, select").forEach((field) => {
      field.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          calculateForgingClearance();
        }
      });
    });
  }
  if (elements.refreshNews) {
    elements.refreshNews.addEventListener("click", loadNews);
  }
}

function updateThreadDepth() {
  if (!elements.threadPitch || !elements.threadDepthResult) return;

  const pitch = Number(elements.threadPitch.value);
  if (Number.isNaN(pitch) || pitch <= 0) {
    elements.threadDepthResult.innerHTML = "مقدار گام معتبر نیست.";
    return;
  }

  const pitchInch = pitch / 25.4;
  const tpi = 25.4 / pitch;

  const radial = pitch * 0.61;
  const diameter = pitch * 1.22;

  elements.threadDepthResult.innerHTML = `
گام اینچی: ${pitchInch.toFixed(4)}"<br>
تعداد دندانه در اینچ: ${tpi.toFixed(2)}<br>
عمق شعاعی دندانه: ${radial.toFixed(3)} mm<br>
عمق قطری دندانه: ${diameter.toFixed(3)} mm
`;
}
function calculateTaper() {

  const D = parseFloat(elements.bigDiameter.value);
  const d = parseFloat(elements.smallDiameter.value);
  const H = parseFloat(elements.heightValue.value);

  if (isNaN(D) || isNaN(d) || isNaN(H) || H <= 0) {
    elements.taperResult.textContent = "--";
    return;
  }

  const halfAngle = Math.atan((D - d) / (2 * H)) * 180 / Math.PI;
  const totalAngle = halfAngle * 2;
  const diff = D - d;

  elements.taperResult.innerHTML =
    `زاویه از مرکز قطعه: ${halfAngle.toFixed(3)}°<br>
     زاویه کل قطعه: ${totalAngle.toFixed(3)}°<br>
     اختلاف قطر: ${diff.toFixed(3)} mm`;

}

function interpolate(x, x0, y0, x1, y1) {
  return y0 + ((x - x0) * (y1 - y0)) / (x1 - x0);
}

function convertHardnessLookup(type, value) {
  const sorted = HARDNESS_TABLE.slice().sort((a, b) => a.HB - b.HB);

  if (type === "HB") {
    const exact = sorted.find((item) => item.HB === value);
    if (exact) {
      return { value: exact.HRC, exact: true };
    }

    const lower = sorted.filter((item) => item.HB < value).pop();
    const upper = sorted.find((item) => item.HB > value);
    if (!lower || !upper) return null;
    return {
      value: interpolate(value, lower.HB, lower.HRC, upper.HB, upper.HRC),
      exact: false
    };
  }

  if (type === "HRC") {
    const exact = HARDNESS_TABLE.find((item) => item.HRC === value);
    if (exact) {
      return { value: exact.HB, exact: true };
    }

    const lower = HARDNESS_TABLE.filter((item) => item.HRC < value).pop();
    const upper = HARDNESS_TABLE.find((item) => item.HRC > value);
    if (!lower || !upper) return null;
    return {
      value: interpolate(value, lower.HRC, lower.HB, upper.HRC, upper.HB),
      exact: false
    };
  }

  return null;
}

function updateHardnessResult() {
  const type = elements.hardnessType.value;
  const value = Number(elements.hardnessValue.value);
  elements.hardnessResult.textContent = "--";
  elements.hardnessMessage.textContent = "";
  elements.hardnessMessage.style.color = "#38bdf8";

  if (isNaN(value) || value <= 0) {
    elements.hardnessMessage.textContent = "لطفاً مقدار سختی معتبر وارد کنید.";
    elements.hardnessMessage.style.color = "#f87171";
    return;
  }

  const conversion = convertHardnessLookup(type, value);
  if (!conversion) {
    elements.hardnessMessage.textContent = "مقدار خارج از محدوده جدول تبدیل است.";
    elements.hardnessMessage.style.color = "#f87171";
    return;
  }

  if (type === "HB") {
    elements.hardnessResult.textContent = `${trimNumber(conversion.value, 2)} HRC`;
    elements.hardnessMessage.textContent = conversion.exact ? "تبدیل دقیق" : "تبدیل تقریبی";
  } else {
    elements.hardnessResult.textContent = `${trimNumber(conversion.value, 2)} HB`;
    elements.hardnessMessage.textContent = conversion.exact ? "تبدیل دقیق" : "تبدیل تقریبی";
  }
}

function resetHardnessForm() {
  elements.hardnessType.value = "HB";
  elements.hardnessValue.value = "";
  elements.hardnessResult.textContent = "--";
  elements.hardnessMessage.textContent = "";
}

function parseDensityValue(text) {
  if (!text) return null;
  const normalized = text.replace(/[،٬]/g, ".").replace(/\u2212/g, "-");
  const rangeMatch = normalized.match(/(\d+(?:\.\d+)?)[–-](\d+(?:\.\d+)?)/);
  if (rangeMatch) {
    return (Number(rangeMatch[1]) + Number(rangeMatch[2])) / 2;
  }
  const valueMatch = normalized.match(/(\d+(?:\.\d+)?)/);
  if (!valueMatch) return null;
  return Number(valueMatch[1]);
}

function getMaterialKeysFromBankSections() {
  const materialKeys = new Set();

  document.querySelectorAll("section.calculator-panel.tool-panel").forEach((panel) => {
    panel.querySelectorAll("button.tool-card[data-tool]").forEach((button) => {
      const key = button.dataset.tool;
      if (key) materialKeys.add(key);
    });
  });

  return Array.from(materialKeys);
}

function buildMaterialDensityMapFromPanels() {
  const materials = {};
  getMaterialKeysFromBankSections().forEach((materialKey) => {
    const panel = document.querySelector(`section.calculator-panel.tool-panel[data-panel="${materialKey}"]`);
    if (!panel) return;

    const title = panel.querySelector("h3");
    const label = title ? title.textContent.trim() : materialKey;

    const densityCard = Array.from(panel.querySelectorAll(".metric-card")).find((card) => {
      const labelText = card.querySelector("span")?.textContent.trim();
      return labelText === "چگالی";
    });

    const density = densityCard ? parseDensityValue(densityCard.querySelector("strong")?.textContent) : null;
    materials[materialKey] = { label, density };
  });

  return materials;
}

const MATERIAL_DENSITY_MAP = buildMaterialDensityMapFromPanels();

function formatWeight(grams) {
  if (grams < 1000) {
    return `${trimNumber(grams, 2)} گرم`;
  }
  return `${trimNumber(grams / 1000, 3)} کیلوگرم`;
}

function getShapeVolumeCm3() {
  const shape = elements.shapeSelect.value;

  switch (shape) {
    case "rectangular": {
      const length = Number(document.querySelector("#rectLength").value);
      const width = Number(document.querySelector("#rectWidth").value);
      const height = Number(document.querySelector("#rectHeight").value);
      if ([length, width, height].some((v) => isNaN(v) || v <= 0)) return null;
      return (length * width * height) / 1000;
    }
    case "cylinder": {
      const diameter = Number(document.querySelector("#cylDiameter").value);
      const length = Number(document.querySelector("#cylLength").value);
      if ([diameter, length].some((v) => isNaN(v) || v <= 0)) return null;
      return Math.PI * Math.pow(diameter / 2, 2) * length / 1000;
    }
    case "tube": {
      const outer = Number(document.querySelector("#tubeOuterDiameter").value);
      const inner = Number(document.querySelector("#tubeInnerDiameter").value);
      const length = Number(document.querySelector("#tubeLength").value);
      if ([outer, inner, length].some((v) => isNaN(v) || v <= 0) || inner >= outer) return null;
      return (Math.PI / 4) * (Math.pow(outer, 2) - Math.pow(inner, 2)) * length / 1000;
    }
    case "plate": {
      const length = Number(document.querySelector("#plateLength").value);
      const width = Number(document.querySelector("#plateWidth").value);
      const thickness = Number(document.querySelector("#plateThickness").value);
      if ([length, width, thickness].some((v) => isNaN(v) || v <= 0)) return null;
      return (length * width * thickness) / 1000;
    }
    case "custom": {
      const volume = Number(document.querySelector("#customVolume").value);
      if (isNaN(volume) || volume <= 0) return null;
      return volume;
    }
    default:
      return null;
  }
}

function renderWeightShapeInputs() {
  if (!elements.shapeSelect || !elements.shapeInputs) return;

  const shape = elements.shapeSelect.value;
  const inputSections = {
    rectangular: `
      <div class="selector-row">
        <label for="rectLength">طول (mm)</label>
        <input type="number" id="rectLength" placeholder="مثلاً 100" step="1" min="0" />
      </div>
      <div class="selector-row">
        <label for="rectWidth">عرض (mm)</label>
        <input type="number" id="rectWidth" placeholder="مثلاً 50" step="1" min="0" />
      </div>
      <div class="selector-row">
        <label for="rectHeight">ارتفاع (mm)</label>
        <input type="number" id="rectHeight" placeholder="مثلاً 20" step="1" min="0" />
      </div>
    `,
    cylinder: `
      <div class="selector-row">
        <label for="cylDiameter">قطر استوانه (mm)</label>
        <input type="number" id="cylDiameter" placeholder="مثلاً 50" step="1" min="0" />
      </div>
      <div class="selector-row">
        <label for="cylLength">طول (mm)</label>
        <input type="number" id="cylLength" placeholder="مثلاً 100" step="1" min="0" />
      </div>
    `,
    tube: `
      <div class="selector-row">
        <label for="tubeOuterDiameter">قطر خارجی (mm)</label>
        <input type="number" id="tubeOuterDiameter" placeholder="مثلاً 60" step="1" min="0" />
      </div>
      <div class="selector-row">
        <label for="tubeInnerDiameter">قطر داخلی (mm)</label>
        <input type="number" id="tubeInnerDiameter" placeholder="مثلاً 40" step="1" min="0" />
      </div>
      <div class="selector-row">
        <label for="tubeLength">طول (mm)</label>
        <input type="number" id="tubeLength" placeholder="مثلاً 120" step="1" min="0" />
      </div>
    `,
    plate: `
      <div class="selector-row">
        <label for="plateLength">طول (mm)</label>
        <input type="number" id="plateLength" placeholder="مثلاً 200" step="1" min="0" />
      </div>
      <div class="selector-row">
        <label for="plateWidth">عرض (mm)</label>
        <input type="number" id="plateWidth" placeholder="مثلاً 100" step="1" min="0" />
      </div>
      <div class="selector-row">
        <label for="plateThickness">ضخامت (mm)</label>
        <input type="number" id="plateThickness" placeholder="مثلاً 10" step="1" min="0" />
      </div>
    `,
    custom: `
      <div class="selector-row">
        <label for="customVolume">حجم قطعه (cm³)</label>
        <input type="number" id="customVolume" placeholder="مثلاً 500" step="0.1" min="0" />
      </div>
    `
  };

  elements.shapeInputs.innerHTML = inputSections[shape] || "";
}

function renderWeightMaterials() {
  if (!elements.weightMaterial) return;

  elements.weightMaterial.innerHTML = "";
  const allowedMaterials = new Set([
    "MO40",
    "VCN150",
    "VCN200",
    "CK75",
    "CK45",
    "H13",
    "H7176",
    "POM",
    "PEEK",
    "PTFE"
  ]);

  const materialEntries = Object.entries(MATERIAL_DENSITY_MAP)
    .filter(([key]) => allowedMaterials.has(key))
    .sort(([aKey, aValue], [bKey, bValue]) => {
      const aName = aValue.label.toLowerCase();
      const bName = bValue.label.toLowerCase();
      return aName.localeCompare(bName, "fa", { sensitivity: "base" });
    });

  materialEntries.forEach(([key, item]) => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = item.label;
    elements.weightMaterial.appendChild(option);
  });

  if (materialEntries.length > 0) {
    elements.weightMaterial.selectedIndex = 0;
  }
  updateWeightDensityFromMaterial();
}

function updateWeightDensityFromMaterial() {
  if (!elements.weightMaterial || !elements.weightDensity || !elements.weightDensityNote) return;

  const materialKey = elements.weightMaterial.value;
  const material = MATERIAL_DENSITY_MAP[materialKey];
  const materialLabel = material?.label || materialKey || "متریال";
  const density = material?.density ?? null;

  if (density != null && !Number.isNaN(density)) {
    elements.weightDensity.value = density;
    elements.weightDensityNote.textContent = `چگالی متریال «${materialLabel}» از بانک اطلاعاتی خوانده شد.`;
  } else {
    elements.weightDensity.value = "";
    elements.weightDensityNote.textContent = `چگالی متریال «${materialLabel}» در بانک اطلاعاتی ثبت نشده است. لطفاً دستی وارد کنید.`;
  }
}

function updateForgingMessage(text, isError = false) {
  elements.forgingMessage.textContent = text;
  elements.forgingMessage.style.color = isError ? "#f87171" : "#38bdf8";
}

function getForgingSizeCategory(sizeMm) {
  if (sizeMm <= 20) return "small";
  if (sizeMm <= 50) return "medium";
  return "large";
}

function getForgingMaterialGroup(materialKey) {
  switch (materialKey) {
    case "copper":
      return "copper";
    case "brass":
      return "brass";
    case "bronze":
      return "bronze";
    default:
      return "copper";
  }
}

function getForgingProcessType(temperature) {
  if (temperature == null || Number.isNaN(temperature)) {
    return "hot";
  }

  if (temperature >= 900) {
    return "hot";
  }

  if (temperature >= 650) {
    return "warm";
  }

  return "cold";
}

function getForgingTemperatureFactor(processType, temperature) {
  if (temperature == null || Number.isNaN(temperature)) {
    return 0;
  }

  switch (processType) {
    case "hot":
      return temperature >= 1000 ? 0.12 : temperature >= 900 ? 0.06 : 0.02;
    case "warm":
      return temperature >= 800 ? 0.10 : temperature >= 700 ? 0.05 : 0.02;
    case "cold":
      return 0.0;
    default:
      return 0;
  }
}

function getForgingClearanceRange(processType, materialGroup, sizeCategory) {
  const table = {
    hot: {
      copper: { small: [0.06, 0.12], medium: [0.07, 0.14], large: [0.08, 0.16] },
      brass: { small: [0.07, 0.14], medium: [0.08, 0.16], large: [0.09, 0.18] },
      bronze: { small: [0.06, 0.13], medium: [0.07, 0.15], large: [0.08, 0.17] }
    },
    warm: {
      copper: { small: [0.04, 0.10], medium: [0.05, 0.12], large: [0.06, 0.14] },
      brass: { small: [0.05, 0.11], medium: [0.06, 0.13], large: [0.07, 0.15] },
      bronze: { small: [0.04, 0.10], medium: [0.05, 0.12], large: [0.06, 0.14] }
    },
    cold: {
      copper: { small: [0.03, 0.07], medium: [0.04, 0.09], large: [0.05, 0.11] },
      brass: { small: [0.04, 0.09], medium: [0.05, 0.11], large: [0.06, 0.13] },
      bronze: { small: [0.03, 0.08], medium: [0.04, 0.10], large: [0.05, 0.12] }
    }
  };

  return table[processType]?.[materialGroup]?.[sizeCategory] || null;
}

function getForgingToolToleranceFactor() {
  return 0.35;
}

function calculateForgingClearance() {
  const materialGroup = getForgingMaterialGroup(elements.forgingWorkpieceMaterial.value);
  const dieHoleDiameter = Number(elements.forgingDieHoleDiameter.value);
  const temperatureInput = elements.forgingTemperature.value.trim();
  const temperature = temperatureInput === "" ? null : Number(temperatureInput);
  const processType = getForgingProcessType(temperature);
  const punchMaterialLabel = "H13";
  const dieMaterialLabel = "H13";

  elements.forgingResult.textContent = "--";
  elements.forgingDetails.textContent = "";
  updateForgingMessage("");

  if (isNaN(dieHoleDiameter) || dieHoleDiameter <= 0) {
    updateForgingMessage("لطفاً قطر دهانه قالب معتبر وارد کنید.", true);
    return;
  }

  const sizeCategory = getForgingSizeCategory(dieHoleDiameter);
  const range = getForgingClearanceRange(processType, materialGroup, sizeCategory);

  if (!range) {
    updateForgingMessage("برای ترکیب انتخاب شده، محدوده لقی تعریف نشده است.", true);
    return;
  }

  const [minPerSide, maxPerSide] = range;
  const toolFactor = getForgingToolToleranceFactor();
  const temperatureFactor = getForgingTemperatureFactor(processType, temperature);
  const selectionFactor = Math.min(0.75, Math.max(0.25, toolFactor + temperatureFactor));
  const referencePerSide = minPerSide + (maxPerSide - minPerSide) * selectionFactor;
  const referenceLabel = selectionFactor <= 0.3 ? "محدوده دقیق‌تر" : selectionFactor >= 0.6 ? "محدوده محافظه‌کارانه" : "محدوده میانی";

  const totalMin = minPerSide * 2;
  const totalMax = maxPerSide * 2;
  const referenceTotal = referencePerSide * 2;
  const recommendedPunchDiameter = dieHoleDiameter - referenceTotal;

  if (recommendedPunchDiameter <= 0) {
    updateForgingMessage("قطر دهانه قالب کمتر از مجموع لقی پیشنهادی است.", true);
    return;
  }

  const materialLabel = elements.forgingWorkpieceMaterial.options[elements.forgingWorkpieceMaterial.selectedIndex].textContent;
  const temperatureLabel = temperature == null ? "بدون ورود دما" : `${temperature.toFixed(0)} °C`;

  elements.forgingResult.textContent = `قطر سنبه پیشنهادی: ${trimNumber(recommendedPunchDiameter, 3)} mm`;
  elements.forgingDetails.innerHTML = `
    <strong>قطر سنبه پیشنهادی:</strong> ${recommendedPunchDiameter.toFixed(3)} mm<br>
    <strong>لقی هر سمت:</strong> ${referencePerSide.toFixed(3)} mm<br>
    <strong>لقی کل:</strong> ${referenceTotal.toFixed(3)} mm<br>
    <strong>حداقل محدوده:</strong> ${minPerSide.toFixed(3)} mm / سمت<br>
    <strong>حداکثر محدوده:</strong> ${maxPerSide.toFixed(3)} mm / سمت<br>
    <strong>قطر دهانه قالب:</strong> ${dieHoleDiameter.toFixed(3)} mm<br>
    <strong>جنس قطعه:</strong> ${materialLabel}<br>
    <strong>دمای فورج:</strong> ${temperatureLabel}<br>
    <strong>جنس سنبه:</strong> ${punchMaterialLabel}<br>
    <strong>جنس قالب:</strong> ${dieMaterialLabel}<br>
    <br>
    پایه انتخاب مقدار: ${referenceLabel} برای فورج ${processType === "hot" ? "گرم" : processType === "warm" ? "نیمه‌گرم" : "سرد"} بر اساس ${materialLabel}.
  `;

  updateForgingMessage(`مقدار مرجع بر اساس محدوده‌های مهندسی انتخاب شد.`);
}

function resetForgingClearanceForm() {
  if (elements.forgingWorkpieceMaterial) {
    elements.forgingWorkpieceMaterial.value = "copper";
  }
  if (elements.forgingDieHoleDiameter) {
    elements.forgingDieHoleDiameter.value = "";
  }
  if (elements.forgingTemperature) {
    elements.forgingTemperature.value = "";
  }
  if (elements.forgingResult) {
    elements.forgingResult.textContent = "--";
  }
  if (elements.forgingDetails) {
    elements.forgingDetails.textContent = "";
  }
  updateForgingMessage("");
}

function updateWeightMessage(text, isError = false) {
  elements.weightMessage.textContent = text;
  elements.weightMessage.style.color = isError ? "#f87171" : "#38bdf8";
}

function calculateWeight() {
  const volumeCm3 = getShapeVolumeCm3();
  const density = Number(elements.weightDensity.value);
  elements.weightResult.textContent = "--";
  elements.weightDetails.textContent = "";
  updateWeightMessage("");

  if (volumeCm3 === null || isNaN(volumeCm3) || volumeCm3 <= 0) {
    updateWeightMessage("لطفاً ابعاد یا حجم معتبر وارد کنید.", true);
    return;
  }

  if (isNaN(density) || density <= 0) {
    updateWeightMessage("لطفاً چگالی معتبر وارد کنید.", true);
    return;
  }

  const massGrams = volumeCm3 * density;
  elements.weightResult.textContent = formatWeight(massGrams);
  elements.weightDetails.innerHTML = `حجم: ${trimNumber(volumeCm3, 2)} cm³<br>چگالی: ${trimNumber(density, 2)} g/cm³`;
  updateWeightMessage("وزن قطعه محاسبه شد.");
}

function resetWeightForm() {
  elements.shapeSelect.value = "rectangular";
  renderWeightShapeInputs();
  elements.weightMaterial.selectedIndex = 0;
  updateWeightDensityFromMaterial();
  elements.weightResult.textContent = "--";
  elements.weightDetails.textContent = "";
  updateWeightMessage("");
}

bindEvents();
renderTapOptions();
renderEdmOptions();
renderWeightMaterials();
renderWeightShapeInputs();
// در شروع برنامه هیچ پنلی باز نباشد
elements.panels.forEach(panel => {
  panel.hidden = true;
  panel.classList.remove("active");
});

// هیچ دکمه‌ای هم فعال نباشد
elements.toolCards.forEach(card => {
  card.classList.remove("active");
});

// عنوان صفحه
elements.pageEyebrow.textContent = "";
elements.pageTitle.textContent = "MACHINIST TOOL BOX";
history.replaceState({}, "", location.pathname);

window.addEventListener("popstate", (event) => {

    if (event.state && event.state.tool) {
        switchTool(event.state.tool, false);
        return;
    }

    elements.panels.forEach(panel => {
        panel.hidden = true;
        panel.classList.remove("active");
    });

    elements.toolCards.forEach(card => {
        card.classList.remove("active");
    });

    elements.pageEyebrow.textContent = "";
    elements.pageTitle.textContent = "MACHINIST TOOL BOX";

    const welcomeCard = document.getElementById("welcomeCard");
    if (welcomeCard) {
        welcomeCard.style.display = "flex";
        welcomeCard.classList.remove("hide");
    }

    if (elements.newsCard) {
        elements.newsCard.hidden = false;
    }
});
// ===== خروج خودکار در صورت عدم فعالیت =====

let inactivityTimer;

function resetInactivityTimer() {
    clearTimeout(inactivityTimer);

    inactivityTimer = setTimeout(() => {
        alert("به علت عدم فعالیت، از برنامه خارج شدید.");
        sessionStorage.removeItem("loggedIn");
        window.location.href = "login.html";
    }, 1800000);
}

["mousemove", "mousedown", "click", "scroll", "keydown", "touchstart"].forEach((event) => {
    document.addEventListener(event, resetInactivityTimer);
});

resetInactivityTimer();

// ===== Utility Panel: Clock + Calendar + Calculator =====
(function() {
  'use strict';

  // ===== Analog Clock =====
  const hourHand = document.getElementById('hourHand');
  const minuteHand = document.getElementById('minuteHand');
  const secondHand = document.getElementById('secondHand');
  const clockMarkers = document.getElementById('clockMarkers');

  // Create clock markers
  if (clockMarkers) {
    for (let i = 0; i < 12; i++) {
      const marker = document.createElement('div');
      marker.className = 'clock-marker' + (i % 3 === 0 ? ' major' : '');
      marker.style.transform = `rotate(${i * 30}deg)`;
      clockMarkers.appendChild(marker);
    }
  }

  function updateClock() {
    const now = new Date();
    const hours = now.getHours() % 12;
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const milliseconds = now.getMilliseconds();

    // Smooth second hand movement
    const secondAngle = (seconds + milliseconds / 1000) * 6;
    const minuteAngle = (minutes + seconds / 60) * 6;
    const hourAngle = (hours + minutes / 60) * 30;

    if (secondHand) {
      secondHand.style.transform = `rotate(${secondAngle}deg)`;
    }
    if (minuteHand) {
      minuteHand.style.transform = `rotate(${minuteAngle}deg)`;
    }
    if (hourHand) {
      hourHand.style.transform = `rotate(${hourAngle}deg)`;
    }

    requestAnimationFrame(updateClock);
  }

  if (hourHand || minuteHand || secondHand) {
    requestAnimationFrame(updateClock);
  }

  // ===== Scientific Calculator =====
  const calculatorToggle = document.getElementById('calculatorToggle');
  const scientificCalculator = document.getElementById('scientificCalculator');
  const calcExpression = document.getElementById('calcExpression');
  const calcResult = document.getElementById('calcResult');
  const calcHistory = document.getElementById('calcHistory');
  const degRadToggle = document.getElementById('degRadToggle');

  let isCalculatorOpen = false;
  let currentExpression = '';
  let currentResult = '0';
  let lastAnswer = 0;
  let memory = 0;
  let isDegree = true;
  let openParentheses = 0;

  if (calculatorToggle && scientificCalculator) {
    calculatorToggle.addEventListener('click', () => {
      isCalculatorOpen = !isCalculatorOpen;
      scientificCalculator.classList.toggle('active', isCalculatorOpen);
      calculatorToggle.classList.toggle('active', isCalculatorOpen);
    });
  }

  if (degRadToggle) {
    degRadToggle.addEventListener('click', () => {
      isDegree = !isDegree;
      degRadToggle.textContent = isDegree ? 'DEG' : 'RAD';
      degRadToggle.classList.toggle('active', !isDegree);
    });
  }

  function toRadians(angle) {
    return isDegree ? (angle * Math.PI / 180) : angle;
  }

  function fromRadians(angle) {
    return isDegree ? (angle * 180 / Math.PI) : angle;
  }

  function updateDisplay() {
    if (calcExpression) {
      calcExpression.textContent = currentExpression || '0';
    }
    if (calcResult) {
      calcResult.textContent = currentResult;
    }
  }

  function appendToExpression(value) {
    currentExpression += value;
    updateDisplay();
  }

  function clearCalculator() {
    currentExpression = '';
    currentResult = '0';
    openParentheses = 0;
    updateDisplay();
  }

  function calculateResult() {
    try {
      let expr = currentExpression;

      // Replace constants
      expr = expr.replace(/π/g, Math.PI.toString());
      expr = expr.replace(/e(?![a-z])/g, Math.E.toString());

      // Handle functions
      expr = expr.replace(/sin\(([^)]+)\)/g, (match, p1) => {
        const val = evaluateExpression(p1);
        return Math.sin(toRadians(val));
      });

      expr = expr.replace(/cos\(([^)]+)\)/g, (match, p1) => {
        const val = evaluateExpression(p1);
        return Math.cos(toRadians(val));
      });

      expr = expr.replace(/tan\(([^)]+)\)/g, (match, p1) => {
        const val = evaluateExpression(p1);
        return Math.tan(toRadians(val));
      });

      expr = expr.replace(/sin⁻¹\(([^)]+)\)/g, (match, p1) => {
        const val = evaluateExpression(p1);
        return fromRadians(Math.asin(val));
      });

      expr = expr.replace(/cos⁻¹\(([^)]+)\)/g, (match, p1) => {
        const val = evaluateExpression(p1);
        return fromRadians(Math.acos(val));
      });

      expr = expr.replace(/tan⁻¹\(([^)]+)\)/g, (match, p1) => {
        const val = evaluateExpression(p1);
        return fromRadians(Math.atan(val));
      });

      expr = expr.replace(/√\(([^)]+)\)/g, (match, p1) => {
        const val = evaluateExpression(p1);
        return Math.sqrt(val);
      });

      expr = expr.replace(/log\(([^)]+)\)/g, (match, p1) => {
        const val = evaluateExpression(p1);
        return Math.log10(val);
      });

      expr = expr.replace(/ln\(([^)]+)\)/g, (match, p1) => {
        const val = evaluateExpression(p1);
        return Math.log(val);
      });

      // Handle power operator
      expr = expr.replace(/\^/g, '**');

      // Evaluate the expression
      const result = evaluateExpression(expr);

      if (isFinite(result)) {
        if (calcHistory) {
          calcHistory.textContent = currentExpression + ' =';
        }
        lastAnswer = result;
        currentResult = formatNumber(result);
        currentExpression = '';
        updateDisplay();
      } else {
        currentResult = 'خطا';
        updateDisplay();
      }
    } catch (e) {
      currentResult = 'خطا';
      updateDisplay();
    }
  }

  function evaluateExpression(expr) {
    // Safe evaluation using Function constructor
    const sanitized = expr.replace(/[^0-9+\-*/().%e\s]/g, '');
    return new Function('return ' + sanitized)();
  }

  function formatNumber(num) {
    if (Number.isInteger(num)) return num.toString();
    return parseFloat(num.toFixed(8)).toString();
  }

  function handleParenthesis() {
    if (openParentheses === 0 || currentExpression.slice(-1) === '(') {
      appendToExpression('(');
      openParentheses++;
    } else {
      appendToExpression(')');
      openParentheses--;
    }
  }

  // Calculator button events
  document.querySelectorAll('.calc-btn').forEach(button => {
    button.addEventListener('click', () => {
      const action = button.dataset.action;
      const value = button.dataset.value;

      if (value !== undefined) {
        appendToExpression(value);
      } else if (action) {
        switch (action) {
          case 'clear':
            clearCalculator();
            break;
          case 'parenthesis':
            handleParenthesis();
            break;
          case 'percent':
            appendToExpression('%');
            break;
          case 'add':
            appendToExpression('+');
            break;
          case 'subtract':
            appendToExpression('-');
            break;
          case 'multiply':
            appendToExpression('×');
            break;
          case 'divide':
            appendToExpression('÷');
            break;
          case 'equals':
            calculateResult();
            break;
          case 'sqrt':
            appendToExpression('√(');
            openParentheses++;
            break;
          case 'power':
            appendToExpression('^');
            break;
          case 'sin':
            appendToExpression('sin(');
            openParentheses++;
            break;
          case 'cos':
            appendToExpression('cos(');
            openParentheses++;
            break;
          case 'tan':
            appendToExpression('tan(');
            openParentheses++;
            break;
          case 'asin':
            appendToExpression('sin⁻¹(');
            openParentheses++;
            break;
          case 'acos':
            appendToExpression('cos⁻¹(');
            openParentheses++;
            break;
          case 'atan':
            appendToExpression('tan⁻¹(');
            openParentheses++;
            break;
          case 'log':
            appendToExpression('log(');
            openParentheses++;
            break;
          case 'ln':
            appendToExpression('ln(');
            openParentheses++;
            break;
          case 'pi':
            appendToExpression('π');
            break;
          case 'e':
            appendToExpression('e');
            break;
          case 'memory':
            memory = parseFloat(currentResult) || 0;
            if (calcHistory) {
              calcHistory.textContent = `M = ${memory}`;
            }
            break;
          case 'memory-recall':
            appendToExpression(formatNumber(memory));
            break;
          case 'ans':
            appendToExpression(formatNumber(lastAnswer));
            break;
        }
      }
    });
  });

  // Keyboard support for calculator
  document.addEventListener('keydown', (e) => {
    if (!isCalculatorOpen) return;

    const key = e.key;
    if (/[0-9]/.test(key)) {
      appendToExpression(key);
    } else if (key === '+' || key === '-' || key === '*' || key === '/') {
      const opMap = { '*': '×', '/': '÷' };
      appendToExpression(opMap[key] || key);
    } else if (key === '(' || key === ')') {
      handleParenthesis();
    } else if (key === '%') {
      appendToExpression('%');
    } else if (key === '^') {
      appendToExpression('^');
    } else if (key === 'Enter' || key === '=') {
      e.preventDefault();
      calculateResult();
    } else if (key === 'Escape' || key === 'c' || key === 'C') {
      clearCalculator();
    } else if (key === 'Backspace') {
      currentExpression = currentExpression.slice(0, -1);
      updateDisplay();
    }
  });

})();

const notes = document.getElementById("workshopNotes");
const saveBtn = document.getElementById("saveNotes");
const clearBtn = document.getElementById("clearNotes");
const status = document.getElementById("saveStatus");
const counter = document.getElementById("charCount");

function updateCounter() {
    if (counter && notes) {
        counter.textContent = `${notes.value.length} / 5000`;
    }
}

if (notes) {
    notes.value = localStorage.getItem("easyPipeNotes") || "";
    updateCounter();

    notes.addEventListener("input", () => {
        updateCounter();
        localStorage.setItem("easyPipeNotes", notes.value);
        if (status) {
            status.textContent = "Saved";
        }
    });
}

if (saveBtn) {
    saveBtn.addEventListener("click", () => {
        if (notes) {
            localStorage.setItem("easyPipeNotes", notes.value);
        }
        if (status) {
            status.textContent = "Saved";
        }
        saveBtn.classList.add("saved");
        setTimeout(() => {
            saveBtn.classList.remove("saved");
        }, 500);
    });
}

if (clearBtn && notes) {
    clearBtn.addEventListener("click", () => {
        if (confirm("همه یادداشت‌ها پاک شوند؟")) {
            notes.value = "";
            localStorage.removeItem("easyPipeNotes");
            updateCounter();
            if (status) {
                status.textContent = "Cleared";
            }
        }
    });
}

const notesToggle = document.getElementById("notesToggle");
const notesCard = document.querySelector(".notes-card");

if (notesToggle && notesCard) {
    notesToggle.addEventListener("click", () => {
        notesCard.style.display = notesCard.style.display === "block" ? "none" : "block";
    });
}
const NEWS_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

function parseNewsDate(item) {
    if (!item) return null;
    const raw = item.publishedAt || item.date || "";
    if (!raw) return null;
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatNewsDate(date) {
    if (!date) return "—";
    try {
        return new Intl.DateTimeFormat("fa-IR", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
        }).format(date);
    } catch {
        return date.toISOString().slice(0, 10);
    }
}

function isNewsRecent(item, now) {
    const date = parseNewsDate(item);
    if (!date) return true; // no date: keep it (backend has already filtered)
    return date.getTime() >= now.getTime() - NEWS_AGE_MS;
}

async function loadNews() {
    const container = document.getElementById("newsList");
    if (!container) return;

    const refreshBtn = document.getElementById("refreshNews");
    const originalBtnText = refreshBtn ? refreshBtn.textContent : "";
    if (refreshBtn) {
        refreshBtn.disabled = true;
        refreshBtn.textContent = "در حال بروزرسانی…";
    }

    container.className = "";
    container.textContent = "در حال دریافت اخبار…";

    // Load local JSON first so the live site shows the corrected Persian
    // news immediately, even before a new commit reaches GitHub.
    // Remote is only a fallback if the local file is unavailable.
    const remoteUrl = "https://raw.githubusercontent.com/omidmarddel-code/machinist-toolbox/main/www/data/mechanical-news.json";

    let news = null;

    try {
        // Try local file first. Try the project-layout path first
        // (www/data/...) for the web/GitHub Pages build, then the
        // Capacitor path (data/...) where www is the web root.
        const candidates = [
            new URL("www/data/mechanical-news.json", document.baseURI),
            new URL("data/mechanical-news.json", document.baseURI),
        ];
        let loaded = false;
        for (const candidate of candidates) {
            candidate.searchParams.set("v", Date.now().toString());
            try {
                const response = await fetch(candidate, { cache: "no-store" });
                if (response.ok) {
                    news = await response.json();
                    console.log("News loaded from local file:", candidate.pathname);
                    loaded = true;
                    break;
                }
            } catch (err) {
                console.warn("Local candidate failed:", candidate.pathname, err);
            }
        }
        if (!loaded) {
            throw new Error("All local candidates failed");
        }
    } catch (localError) {
        console.warn("Failed to load local news, trying remote:", localError);

        try {
            // Fallback to remote URL with cache busting
            const remoteNewsUrl = new URL(remoteUrl);
            remoteNewsUrl.searchParams.set("v", Date.now().toString());
            const response = await fetch(remoteNewsUrl, {
                cache: "no-store",
                headers: {
                    "Accept": "application/json"
                }
            });

            if (response.ok) {
                news = await response.json();
                console.log("News loaded from remote server");
            } else {
                throw new Error(`Remote request failed: ${response.status}`);
            }
        } catch (remoteError) {
            console.error("Both local and remote failed:", remoteError);
            container.className = "news-error";
            container.textContent = "دریافت اخبار در حال حاضر ممکن نیست. لطفاً دوباره تلاش کنید.";
            if (refreshBtn) {
                refreshBtn.disabled = false;
                refreshBtn.textContent = originalBtnText;
            }
            return;
        }
    }
    
    // Client-side safety net: only show news from the last 24 hours.
    // If nothing is recent, fall back to the newest available items so
    // the page is never blank (e.g. the GitHub Actions feed is stale).
    const articles = Array.isArray(news) ? news : [];
    const now = new Date();
    let recentNews = articles.filter((item) => isNewsRecent(item, now));

    if (!recentNews.length) {
        recentNews = articles;
    }

    container.replaceChildren();

    if (!recentNews.length) {
        container.className = "news-error";
        container.textContent = "هیچ خبری در حال حاضر موجود نیست.";
        if (refreshBtn) {
            refreshBtn.disabled = false;
            refreshBtn.textContent = originalBtnText;
        }
        return;
    }

    recentNews.forEach((item) => {
        const article = document.createElement("a");
        article.className = item.image ? "news-item has-image" : "news-item";
        article.href = item.url || "#";
        article.target = "_blank";
        article.rel = "noopener noreferrer";

        // Only use the article's own real image. If the source provides no
        // image, or the image fails to load, we render the text-only card
        // (no fake/placeholder thumbnail from another site).
        if (item.image) {
            const thumb = document.createElement("img");
            thumb.className = "news-thumb";
            // Use CORS proxy for Digiato images to bypass CDN restrictions
            const imageUrl = item.image.includes("digiato.com") 
                ? `https://corsproxy.io/?${encodeURIComponent(item.image)}`
                : item.image;
            thumb.src = imageUrl;
            thumb.alt = item.title || "";
            thumb.onerror = function() {
                console.warn("Image blocked or failed to load:", item.image);
                this.style.display = 'none';
                article.classList.remove("has-image");
            };
            thumb.onload = function() {
                console.log("Image loaded successfully:", imageUrl);
            };
            article.append(thumb);
        }

        const body = document.createElement("div");
        body.className = "news-body";

        const title = document.createElement("h3");
        title.textContent = item.title || "خبر";
        const summary = document.createElement("p");
        summary.textContent = item.summary || "";
        const meta = document.createElement("small");
        const newsDate = formatNewsDate(parseNewsDate(item));
        meta.textContent = `${item.source || "منبع"} • ${newsDate}`;
        
        body.append(title, summary, meta);
        article.append(body);
        container.append(article);
    });

    if (refreshBtn) {
        refreshBtn.disabled = false;
        refreshBtn.textContent = originalBtnText;
    }
}
loadNews();


// ===== تغییر تم دارک/روشن =====
const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
  const savedTheme = localStorage.getItem('theme');
  const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  const currentTheme = savedTheme || (prefersLight ? 'light' : 'dark');

  if (currentTheme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  themeToggle.textContent = currentTheme === 'light' ? '☀️' : '🌙';

  themeToggle.addEventListener('click', () => {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    if (isLight) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'dark');
      themeToggle.textContent = '🌙';
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
      themeToggle.textContent = '☀️';
    }
  });
}

// ===== Developer & Contact Button =====
(function () {
  const devContactBtn = document.getElementById("devContactBtn");
  if (devContactBtn) {
    devContactBtn.addEventListener("click", () => {
      window.location.href = "contact.html";
    });
  }
})();


