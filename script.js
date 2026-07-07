
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
  threadPitch: document.querySelector("#threadPitch"),
threadDepthResult: document.querySelector("#threadDepthResult"),
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
  elements.drillSize.textContent = "--";
  elements.metricsGrid.innerHTML = `
    <article class="metric-card">
      <span>نتیجه جستجو</span>
      <strong>سایز قلاویز پیدا نشد</strong>
    </article>
  `;
}

function renderEdmOptions() {
  EDM_DATA.forEach((setting) => {
    const option = document.createElement("option");
    option.value = setting.name;
    option.textContent = setting.name;
    elements.edmSelect.appendChild(option);
  });

  updateEdmSettings(EDM_DATA[0].name);
}

function updateEdmSettings(name) {
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
  if (!PAGE_TITLES[tool]) {
    return;
  }
  const welcomeCard = document.getElementById("welcomeCard");

if (welcomeCard && !welcomeCard.classList.contains("hide")) {
  welcomeCard.classList.add("hide");

  setTimeout(() => {
    welcomeCard.style.display = "none";
  }, 500);
}

  elements.toolCards.forEach((card) => {
    card.classList.toggle("active", card.dataset.tool === tool);
  });

 elements.panels.forEach((panel) => {
  const active = panel.dataset.panel === tool || panel.id === tool + "Panel";

  panel.classList.toggle("active", active);
  panel.hidden = !active;
});

  elements.pageEyebrow.textContent = PAGE_TITLES[tool].eyebrow;
  elements.pageTitle.textContent = PAGE_TITLES[tool].title;

currentTool = tool;

if (addToHistory) {
    history.pushState({ tool: tool }, "", "#" + tool);
}
}

function bindEvents() {
 elements.toolCards.forEach((card) => {
  card.addEventListener("click", () => {

    if (card.classList.contains("locked")) return;

    const tool = card.dataset.tool;

    if (tool) {
      switchTool(tool);
    }

  });
});

  elements.tapSearch.addEventListener("input", (event) => {
    renderTapOptions(event.target.value);
  });

  elements.tapSelect.addEventListener("change", (event) => {
    updateTapDetails(event.target.value);
  });

  elements.edmSelect.addEventListener("change", (event) => {
    updateEdmSettings(event.target.value);
  });
  elements.threadPitch.addEventListener("change", () => {
  updateThreadDepth();
});
  elements.calcTaper.addEventListener("click", calculateTaper);
  function updateThreadDepth() {

  const pitch = Number(elements.threadPitch.value);

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

bindEvents();
renderTapOptions();
renderEdmOptions();
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
elements.pageTitle.textContent = "قالب سازی";
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
    elements.pageTitle.textContent = "قالب سازی";

    const welcomeCard = document.getElementById("welcomeCard");
    if (welcomeCard) {
        welcomeCard.style.display = "flex";
        welcomeCard.classList.remove("hide");
    }
});