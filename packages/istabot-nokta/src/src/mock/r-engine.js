/**
 * Mock R Engine — ISTABOT'un R/Plumber istatistik servisi simülasyonu.
 * Gerçek entegrasyonda R Plumber API'ye veri gönderilir, sonuç alınır.
 *
 * Tüm değerler gerçekçi istatistiksel output formatındadır.
 */

/**
 * Power analysis (Cohen formüllerine dayalı yaklaşım)
 *
 * @param {object} params
 * @param {number} [params.alpha=0.05]
 * @param {number} [params.power=0.80]
 * @param {number} [params.effectSize=0.5] - Cohen d/w/f
 * @param {"two-sample-t"|"chi-square"|"logistic"|"anova"|"correlation"} [params.test="logistic"]
 * @param {number} [params.dropoutRate=0.20]
 * @returns {PowerResult}
 */
export function powerAnalysis({ alpha = 0.05, power = 0.80, effectSize = 0.5, test = "logistic", dropoutRate = 0.20 } = {}) {
  // Cohen tablosuna dayalı yaklaşık hesaplar (mock ama makul değerler)
  const baseN = {
    "two-sample-t": Math.ceil(2 * Math.pow((1.96 + 0.84) / effectSize, 2)),
    "chi-square": Math.ceil(Math.pow((1.96 + 0.84), 2) / Math.pow(effectSize, 2)),
    "logistic": Math.ceil(Math.pow((1.96 + 0.84) / effectSize, 2) * 1.1),
    "anova": Math.ceil(3 * Math.pow((1.96 + 0.84) / effectSize, 2)),
    "correlation": Math.ceil(Math.pow((1.96 + 0.84), 2) / Math.pow(effectSize, 2) + 3),
  }[test] ?? 156;

  const targetN = Math.ceil(baseN / (1 - dropoutRate));

  return {
    minimumN: baseN,
    targetN,
    alpha,
    power,
    effectSize,
    dropoutRate,
    test,
    interpretation: `α=${alpha}, güç=${power}, etki büyüklüğü=${effectSize} (${effectSizeLabel(effectSize)}) varsayımıyla minimum ${baseN} katılımcı gereklidir. %${Math.round(dropoutRate * 100)} dropout için hedef n=${targetN}.`,
  };
}

function effectSizeLabel(d) {
  if (d < 0.3) return "küçük";
  if (d < 0.6) return "orta";
  return "büyük";
}

/**
 * Binary Logistic Regression sonucu
 *
 * @param {object} params
 * @param {string} params.outcome - Bağımlı değişken adı
 * @param {string[]} params.predictors - Bağımsız değişken adları
 * @returns {LogisticResult}
 */
export function logisticRegression({ outcome, predictors = [] }) {
  const results = predictors.map((predictor, i) => {
    // Gerçekçi OR aralıkları — demo için sabit seed'li değerler
    const orValues = [2.8, 1.5, 1.9, 1.3, 2.1, 0.8, 1.7];
    const pValues = [0.001, 0.12, 0.04, 0.21, 0.008, 0.43, 0.03];
    const or = orValues[i % orValues.length];
    const p = pValues[i % pValues.length];
    const se = 0.18 + i * 0.04;
    const ciLow = parseFloat((or * Math.exp(-1.96 * se)).toFixed(2));
    const ciHigh = parseFloat((or * Math.exp(1.96 * se)).toFixed(2));

    return {
      predictor,
      OR: or,
      CI95: `${ciLow}–${ciHigh}`,
      p: p,
      significant: p < 0.05,
    };
  });

  return {
    test: "Binary Logistic Regression",
    outcome,
    predictors: results,
    modelFit: {
      nagelkerkeR2: 0.34,
      hosmerLemeshow: { chi2: 6.21, df: 8, p: 0.624 },
      correctlyClassified: "78.3%",
    },
    interpretation: `Model istatistiksel olarak anlamlıdır. ${results.filter((r) => r.significant).map((r) => r.predictor).join(", ")} bağımsız risk faktörü olarak belirlendi.`,
  };
}

/**
 * Tanımlayıcı istatistikler
 *
 * @param {object} params
 * @param {number} params.n - Örneklem büyüklüğü
 * @param {string[]} params.continuousVars
 * @param {string[]} params.categoricalVars
 * @returns {DescriptiveResult}
 */
export function descriptiveStats({ n, continuousVars = [], categoricalVars = [] }) {
  const continuous = continuousVars.map((v, i) => ({
    variable: v,
    mean: parseFloat((40 + i * 5.3).toFixed(1)),
    sd: parseFloat((8.2 + i * 1.1).toFixed(1)),
    median: parseFloat((39 + i * 5.1).toFixed(1)),
    iqr: `${32 + i * 4}–${47 + i * 6}`,
    min: 18,
    max: 79,
  }));

  const categorical = categoricalVars.map((v, i) => ({
    variable: v,
    categories: [
      { label: "Evet", n: Math.round(n * (0.45 + i * 0.05)), pct: `${Math.round((0.45 + i * 0.05) * 100)}%` },
      { label: "Hayır", n: Math.round(n * (0.55 - i * 0.05)), pct: `${Math.round((0.55 - i * 0.05) * 100)}%` },
    ],
  }));

  return {
    n,
    missingDataPct: "3.2%",
    continuous,
    categorical,
    normalityTests: continuousVars.map((v) => ({
      variable: v,
      test: "Shapiro-Wilk",
      statistic: 0.94,
      p: 0.03,
      normal: false,
    })),
  };
}
